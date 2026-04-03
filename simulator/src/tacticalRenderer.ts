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
import { parameterizeSidc, computeStyleDescriptors } from './tacticalStyles';

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
  if (id.includes('wasp-stroke'))   return { ...base, strokeColor: Cesium.Color.ORANGE, dashed: true };
  if (id.includes('solid-stroke'))  return { ...base };
  if (id.includes('default-stroke')) return { ...base };
  return base;
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

  const descriptors = computeStyleDescriptors(paramSidc, jtsGeom, resolution);
  if (!descriptors || descriptors.length === 0) return false;

  const visual = descriptorIdToVisual(descriptors[0]?.id ?? '', sidc);
  const baseId = `odin-tactical-${scenarioId}-${feature.id ?? 'f'}-${index}`;

  descriptors.forEach((desc, di) => {
    if (!desc?.geometry) return;
    const textField = desc['text-field'] as string | undefined;
    const geomType = desc.geometry.getGeometryType?.();
    if (textField && geomType === 'Point') {
      const raw = String(textField).replace(/^["']|["']$/g, '');
      const rotation = Number(desc['text-rotate']);
      const [lon, lat] = jtsCoordToWgs84(desc.geometry.getCoordinate());
      viewer.entities.add({
        id: `${baseId}-txt-${di}`,
        position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
        label: {
          text: raw,
          font: 'bold 14px sans-serif',
          fillColor: visual.strokeColor,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          ...(Number.isFinite(rotation) ? { rotation } : {}),
        } as Cesium.LabelGraphics.ConstructorOptions,
      });
      return;
    }
    renderJtsGeometry(viewer, desc.geometry, visual, `${baseId}-${di}`);
  });

  return true;
}
