/**
 * tacticalRenderer.ts
 *
 * Full pipeline for rendering MIL-STD-2525 tactical graphics in Cesium
 * with 100% shape fidelity matching Odin's 2D rendering:
 *
 *   GeoJSON (WGS84)
 *     → EPSG:3857 jsts geometry
 *     → Odin style function (pure geometry, same as Odin uses)
 *     → jsts output geometries
 *     → WGS84 Cesium entities (polyline/polygon) with clampToGround
 */

import * as Cesium from 'cesium';
import { TS } from './tacticalTs';
import { parameterizeSidc, computeTacticalDescriptors } from './tacticalStyles';

// ---------------------------------------------------------------------------
// Coordinate projection: WGS84 (lon°, lat°) ↔ EPSG:3857 (meters)
// ---------------------------------------------------------------------------

const EARTH_R = 6378137;
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function wgs84ToMercator(lon: number, lat: number): [number, number] {
  const x = lon * DEG2RAD * EARTH_R;
  const y = Math.log(Math.tan(Math.PI / 4 + lat * DEG2RAD / 2)) * EARTH_R;
  return [x, y];
}

function mercatorToWgs84(x: number, y: number): [number, number] {
  const lon = (x / EARTH_R) * RAD2DEG;
  const lat = (Math.atan(Math.exp(y / EARTH_R)) * 2 - Math.PI / 2) * RAD2DEG;
  return [lon, lat];
}

// ---------------------------------------------------------------------------
// GeoJSON → jsts (EPSG:3857)
// ---------------------------------------------------------------------------

function coordsToMercator(lon: number, lat: number) {
  const [x, y] = wgs84ToMercator(lon, lat);
  return { x, y };
}

function geojsonToJts(geometry: any): any {
  const type: string = geometry?.type;
  if (!type) return null;

  switch (type) {
    case 'Point': {
      const [lon, lat] = geometry.coordinates as [number, number];
      return TS.point(coordsToMercator(lon, lat));
    }
    case 'MultiPoint': {
      const pts = (geometry.coordinates as [number, number][]).map(([lon, lat]) =>
        TS.point(coordsToMercator(lon, lat))
      );
      return TS.multiPoint(pts);
    }
    case 'LineString': {
      const coords = (geometry.coordinates as [number, number][]).map(([lon, lat]) =>
        coordsToMercator(lon, lat)
      );
      return TS.lineString(coords);
    }
    case 'MultiLineString': {
      const ls = (geometry.coordinates as [number, number][][]).map((ring) =>
        TS.lineString(ring.map(([lon, lat]) => coordsToMercator(lon, lat)))
      );
      return TS.multiLineString(ls);
    }
    case 'Polygon': {
      const ring = (geometry.coordinates[0] as [number, number][]).map(([lon, lat]) =>
        coordsToMercator(lon, lat)
      );
      return TS.polygon(ring);
    }
    case 'GeometryCollection': {
      const geoms = (geometry.geometries as any[]).map(geojsonToJts).filter(Boolean);
      return geoms.length === 1 ? geoms[0] : TS.collect(geoms);
    }
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// jsts Geometry → WGS84 coordinate arrays
// ---------------------------------------------------------------------------

function jtsCoordToWgs84(coord: any): [number, number] {
  return mercatorToWgs84(coord.x, coord.y);
}

function jtsGeometryToWgs84Positions(jtsGeom: any): Cesium.Cartesian3[] {
  const coords: any[] = jtsGeom.getCoordinates();
  return coords.map((c: any) => {
    const [lon, lat] = jtsCoordToWgs84(c);
    return Cesium.Cartesian3.fromDegrees(lon, lat, 0);
  });
}

// ---------------------------------------------------------------------------
// Style descriptor ID → Cesium visual properties
// ---------------------------------------------------------------------------

interface TacticalVisual {
  strokeColor: Cesium.Color;
  fillColor: Cesium.Color;
  strokeWidth: number;
  dashed: boolean;
  hatched: boolean;
}

const tacticalTextCache = new Map<string, string>();
const tacticalShapeCache = new Map<string, string>();

function getAffiliationColor(sidc: string): Cesium.Color {
  if (!sidc || sidc.length < 2) return Cesium.Color.YELLOW;
  switch (sidc[1].toUpperCase()) {
    case 'F': case 'A': case 'M': case 'D': return Cesium.Color.DODGERBLUE;
    case 'H': case 'S': case 'J': case 'K': return Cesium.Color.RED;
    case 'N': case 'L':                      return Cesium.Color.LIMEGREEN;
    default:                                  return Cesium.Color.YELLOW;
  }
}

function descriptorIdToVisual(id: string, sidc: string): TacticalVisual {
  const aff = getAffiliationColor(sidc);
  const base: TacticalVisual = {
    strokeColor: aff,
    fillColor: aff.withAlpha(0.25),
    strokeWidth: 4,
    dashed: false,
    hatched: false,
  };

  if (id.includes('hatch-fill'))    return { ...base, hatched: true, fillColor: aff.withAlpha(0.15) };
  if (id.includes('dashed-stroke')) return { ...base, dashed: true };
  if (id.includes('solid-fill'))    return { ...base, fillColor: aff.withAlpha(0.18) };
  if (id.includes('fence-stroke'))  return { ...base, strokeColor: Cesium.Color.BLACK, strokeWidth: 2 };
  if (id.includes('wasp-stroke'))   return { ...base, strokeColor: Cesium.Color.ORANGE, dashed: true };
  if (id.includes('solid-stroke'))  return { ...base };
  if (id.includes('default-stroke')) return { ...base };
  return base;
}

function parseColor(value: any, fallback: Cesium.Color): Cesium.Color {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try {
    return Cesium.Color.fromCssColorString(value.trim());
  } catch {
    return fallback;
  }
}

function extractFontSize(font: unknown, fallback = 15): number {
  if (typeof font !== 'string') return fallback;
  const match = font.match(/(\d+(?:\.\d+)?)px/);
  if (!match) return fallback;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function measureTextWidth(ctx: CanvasRenderingContext2D, lines: string[]): number {
  return lines.reduce((max, line) => Math.max(max, ctx.measureText(line).width), 0);
}

function getTextBillboardDataUri(
  text: string,
  options: {
    fillColor: Cesium.Color;
    haloColor: Cesium.Color;
    haloWidth: number;
    fontSize: number;
  },
): string | null {
  const normalized = text?.trim();
  if (!normalized || typeof document === 'undefined') return null;

  const cacheKey = `${normalized}|${options.fillColor.toCssColorString()}|${options.haloColor.toCssColorString()}|${options.haloWidth}|${options.fontSize}`;
  const cached = tacticalTextCache.get(cacheKey);
  if (cached) return cached;

  const lines = normalized.split('\n');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const dpr = Math.max(1, Math.ceil(window.devicePixelRatio || 1));
  const fontSpec = `700 ${options.fontSize}px Tahoma, Arial, sans-serif`;
  ctx.font = fontSpec;
  const lineHeight = Math.ceil(options.fontSize * 1.3);
  const paddingX = 8;
  const paddingY = 6;
  const width = Math.ceil(measureTextWidth(ctx, lines) + paddingX * 2);
  const height = Math.ceil(lineHeight * lines.length + paddingY * 2);

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.scale(dpr, dpr);
  ctx.font = fontSpec;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';

  const centerX = width / 2;
  lines.forEach((line, index) => {
    const y = paddingY + lineHeight * index + lineHeight / 2;
    ctx.lineWidth = Math.max(2, options.haloWidth * 2);
    ctx.strokeStyle = options.haloColor.toCssColorString();
    ctx.strokeText(line, centerX, y);
    ctx.fillStyle = options.fillColor.toCssColorString();
    ctx.fillText(line, centerX, y);
  });

  const uri = canvas.toDataURL('image/png');
  tacticalTextCache.set(cacheKey, uri);
  return uri;
}

function getRegularShapeDataUri(
  descriptor: Record<string, any>,
  visual: TacticalVisual,
): string | null {
  const points = Number(descriptor['shape-points']);
  if (!Number.isFinite(points) || points < 3 || typeof document === 'undefined') return null;

  const cacheKey = JSON.stringify({
    points,
    radius: descriptor['shape-radius'],
    radius2: descriptor['shape-radius-2'],
    angle: descriptor['shape-angle'],
    scale: descriptor['shape-scale'],
    stroke: descriptor['shape-line-color'],
    strokeWidth: descriptor['shape-line-width'],
    fill: descriptor['shape-fill-color'],
    visualStroke: visual.strokeColor.toCssColorString(),
  });
  const cached = tacticalShapeCache.get(cacheKey);
  if (cached) return cached;

  const radius = Number(descriptor['shape-radius']) || 8;
  const radius2 = Number(descriptor['shape-radius-2']);
  const rotation = Number(descriptor['shape-angle']) || 0;
  const scaleValue = Array.isArray(descriptor['shape-scale']) ? descriptor['shape-scale'] : [1, 1];
  const scaleX = Number(scaleValue[0]) || 1;
  const scaleY = Number(scaleValue[1]) || scaleX;
  const strokeWidth = Number(descriptor['shape-line-width']) || Math.max(1, visual.strokeWidth / 2);
  const strokeColor = parseColor(descriptor['shape-line-color'], visual.strokeColor);
  const fillColor = parseColor(descriptor['shape-fill-color'], Cesium.Color.TRANSPARENT);

  const maxRadius = Math.max(radius, Number.isFinite(radius2) ? radius2 : radius);
  const size = Math.ceil(maxRadius * 6);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const dpr = Math.max(1, Math.ceil(window.devicePixelRatio || 1));
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;

  ctx.scale(dpr, dpr);
  ctx.translate(size / 2, size / 2);
  ctx.scale(scaleX, scaleY);
  ctx.rotate(rotation);
  ctx.beginPath();
  for (let i = 0; i < points; i++) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * i) / points;
    const currentRadius = Number.isFinite(radius2) && radius2 > 0 && i % 2 === 1 ? radius2 : radius;
    const x = Math.cos(angle) * currentRadius;
    const y = Math.sin(angle) * currentRadius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  if (fillColor.alpha > 0) {
    ctx.fillStyle = fillColor.toCssColorString();
    ctx.fill();
  }
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = strokeColor.toCssColorString();
  ctx.stroke();

  const uri = canvas.toDataURL('image/png');
  tacticalShapeCache.set(cacheKey, uri);
  return uri;
}

function getTextOrigins(anchor: unknown): {
  horizontalOrigin: Cesium.HorizontalOrigin;
  verticalOrigin: Cesium.VerticalOrigin;
} {
  if (typeof anchor === 'string') {
    if (anchor.includes('left')) {
      return {
        horizontalOrigin: Cesium.HorizontalOrigin.RIGHT,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
      };
    }
    if (anchor.includes('right')) {
      return {
        horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
      };
    }
    if (anchor.includes('top')) {
      return {
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      };
    }
    if (anchor.includes('bottom')) {
      return {
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.TOP,
      };
    }
  }

  return {
    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
    verticalOrigin: Cesium.VerticalOrigin.CENTER,
  };
}

function renderTextDescriptor(
  viewer: Cesium.Viewer,
  descriptor: Record<string, any>,
  id: string,
): boolean {
  if (!descriptor?.geometry || !descriptor['text-field']) return false;
  if (descriptor.geometry.getGeometryType?.() !== 'Point') return false;

  const text = String(descriptor['text-field']).trim();
  if (!text) return false;

  const [lon, lat] = jtsCoordToWgs84(descriptor.geometry.getCoordinate());
  const fillColor = parseColor(descriptor['text-color'], Cesium.Color.BLACK);
  const haloColor = parseColor(descriptor['text-halo-color'], Cesium.Color.WHITE);
  const fontSize = extractFontSize(descriptor['text-font'], 15);
  const haloWidth = Number(descriptor['text-halo-width']) || 3;
  const image = getTextBillboardDataUri(text, {
    fillColor,
    haloColor,
    haloWidth,
    fontSize,
  });
  if (!image) return false;

  const offset = Array.isArray(descriptor['text-offset']) ? descriptor['text-offset'] : [0, 0];
  const rotation = Number(descriptor['text-rotate']);
  const origins = getTextOrigins(descriptor['text-anchor']);

  viewer.entities.add({
    id,
    position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
    billboard: {
      image,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      horizontalOrigin: origins.horizontalOrigin,
      verticalOrigin: origins.verticalOrigin,
      pixelOffset: new Cesium.Cartesian2(Number(offset[0]) || 0, Number(offset[1]) || 0),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      ...(Number.isFinite(rotation) ? { rotation } : {}),
    },
  });

  return true;
}

function renderShapeDescriptor(
  viewer: Cesium.Viewer,
  descriptor: Record<string, any>,
  visual: TacticalVisual,
  id: string,
): boolean {
  if (!descriptor?.geometry || descriptor.geometry.getGeometryType?.() !== 'Point') return false;
  if (!descriptor['shape-points']) return false;

  const image = getRegularShapeDataUri(descriptor, visual);
  if (!image) return false;

  const [lon, lat] = jtsCoordToWgs84(descriptor.geometry.getCoordinate());
  const offset = Array.isArray(descriptor['shape-offset']) ? descriptor['shape-offset'] : [0, 0];
  const rotation = Number(descriptor['shape-rotate']);

  viewer.entities.add({
    id,
    position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
    billboard: {
      image,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      pixelOffset: new Cesium.Cartesian2(Number(offset[0]) || 0, Number(offset[1]) || 0),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      ...(Number.isFinite(rotation) ? { rotation } : {}),
    },
  });

  return true;
}

// ---------------------------------------------------------------------------
// Render one jsts geometry as Cesium entities
// ---------------------------------------------------------------------------

function renderJtsGeometry(
  viewer: Cesium.Viewer,
  jtsGeom: any,
  visual: TacticalVisual,
  id: string,
): void {
  const type: string = jtsGeom.getGeometryType();

  switch (type) {
    case 'Point': {
      const [lon, lat] = jtsCoordToWgs84(jtsGeom.getCoordinate());
      viewer.entities.add({
        id,
        position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
        point: {
          pixelSize: 8,
          color: visual.strokeColor,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });
      break;
    }
    case 'MultiPoint': {
      const points = typeof jtsGeom.getNumGeometries === 'function'
        ? Array.from({ length: jtsGeom.getNumGeometries() }, (_, idx) => jtsGeom.getGeometryN(idx))
        : [];
      points.forEach((pointGeom: any, idx: number) => {
        renderJtsGeometry(viewer, pointGeom, visual, `${id}-${idx}`);
      });
      break;
    }
    case 'LineString':
    case 'LinearRing': {
      const positions = jtsGeometryToWgs84Positions(jtsGeom);
      if (positions.length < 2) break;
      const material: any = visual.dashed
        ? new Cesium.PolylineDashMaterialProperty({ color: visual.strokeColor, dashLength: 16 })
        : visual.strokeColor;
      viewer.entities.add({
        id,
        polyline: {
          positions,
          width: visual.strokeWidth,
          clampToGround: true,
          material,
        },
      });
      break;
    }
    case 'Polygon': {
      const extRing = jtsGeom.getExteriorRing();
      const hierarchy = new Cesium.PolygonHierarchy(
        jtsGeometryToWgs84Positions(extRing),
      );
      // inner rings (holes)
      const numHoles = jtsGeom.getNumInteriorRing();
      for (let h = 0; h < numHoles; h++) {
        hierarchy.holes.push(
          new Cesium.PolygonHierarchy(jtsGeometryToWgs84Positions(jtsGeom.getInteriorRingN(h)))
        );
      }
      viewer.entities.add({
        id: `${id}-fill`,
        polygon: {
          hierarchy,
          material: visual.fillColor,
          outline: false,
          perPositionHeight: false,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });
      // outline as polyline (better control)
      const outlinePositions = jtsGeometryToWgs84Positions(extRing);
      if (outlinePositions.length >= 2) {
        const outMat: any = visual.dashed
          ? new Cesium.PolylineDashMaterialProperty({ color: visual.strokeColor, dashLength: 16 })
          : visual.strokeColor;
        viewer.entities.add({
          id: `${id}-outline`,
          polyline: {
            positions: outlinePositions,
            width: visual.strokeWidth,
            clampToGround: true,
            material: outMat,
          },
        });
      }
      break;
    }
    case 'MultiLineString':
    case 'MultiPolygon':
    case 'GeometryCollection': {
      const n = jtsGeom.getNumGeometries();
      for (let i = 0; i < n; i++) {
        renderJtsGeometry(viewer, jtsGeom.getGeometryN(i), visual, `${id}-${i}`);
      }
      break;
    }
    default:
      break;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface TacticalFeatureForRender {
  id?: string | number;
  /** GeoJSON geometry already in WGS84 degrees */
  geometry: any;
  properties?: Record<string, any>;
  style?: Record<string, any>;
  meta?: Record<string, any>;
}

/**
 * Render a tactical feature using Odin's exact style computation.
 * Falls back to a simple styled polyline/polygon if the SIDC has no dedicated function.
 *
 * @param viewer       Cesium Viewer
 * @param feature      Feature with WGS84 geometry
 * @param scenarioId   For entity ID namespacing
 * @param index        For entity ID namespacing
 * @param resolution   Map resolution m/px (default: 30 ≈ zoom-12 tactical view)
 */
export function renderTacticalFeature(
  viewer: Cesium.Viewer,
  feature: TacticalFeatureForRender,
  scenarioId: string,
  index: number,
  resolution = 30,
): boolean {
  const props = feature.properties ?? {};
  const s = { ...(feature.style ?? {}), ...props };

  const sidc: string =
    s?.sidc ?? s?.SIDC ?? s?.symbolCode ?? s?.symbol_code ??
    s?.['symbol-code'] ?? s?.['symbolCode'] ??
    feature.meta?.sidc ?? feature.meta?.SIDC ?? '';

  if (!sidc) return false;

  const paramSidc = parameterizeSidc(sidc);
  if (!paramSidc) return false;

  const jtsGeom = geojsonToJts(feature.geometry);
  if (!jtsGeom) return false;

  const descriptors = computeTacticalDescriptors(paramSidc, sidc, jtsGeom, resolution, {
    ...feature.meta,
    ...(feature.style ?? {}),
    ...props,
    modifiers: {
      ...(feature.meta?.modifiers ?? {}),
      ...(((feature.style ?? {}) as Record<string, any>).modifiers ?? {}),
      ...((props as Record<string, any>).modifiers ?? {}),
      ...feature.meta,
      ...(feature.style ?? {}),
      ...props,
    },
  });
  if (!descriptors || descriptors.length === 0) return false;

  const baseId = `odin-tactical-${scenarioId}-${feature.id ?? 'f'}-${index}`;

  descriptors.forEach((desc, di) => {
    if (!desc?.geometry) return;
    const visual = descriptorIdToVisual(desc.id ?? '', sidc);
    if (renderTextDescriptor(viewer, desc, `${baseId}-txt-${di}`)) return;
    if (renderShapeDescriptor(viewer, desc, visual, `${baseId}-shape-${di}`)) return;
    renderJtsGeometry(viewer, desc.geometry, visual, `${baseId}-${di}`);
  });

  return true;
}
