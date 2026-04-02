import * as Cesium from 'cesium';
import { Symbol as SignsSymbol } from '@syncpoint/signs';
import ms from 'milsymbol';
import type { BackendScenario } from './scenarioPins';

type PositionLike = number[];

interface ScenarioContentLike {
  sides?: SideLike[];
  layers?: ScenarioLayerLike[];
  metadata?: {
    tacticalSymbols?: {
      version: number;
      tuples: Array<[string, any]>;
    };
    [key: string]: any;
  };
}

interface SideLike {
  name?: string;
  groups?: SideGroupLike[];
  subUnits?: UnitLike[];
}

interface SideGroupLike {
  subUnits?: UnitLike[];
}

interface UnitLike {
  id?: string;
  name?: string;
  sidc?: string;
  shortName?: string;
  location?: PositionLike;
  state?: Array<{ location?: PositionLike }>;
  subUnits?: UnitLike[];
  symbolOptions?: Record<string, any>;
  textAmplifiers?: Record<string, string>;
}

interface ScenarioLayerLike {
  name?: string;
  isHidden?: boolean;
  features?: ScenarioFeatureLike[];
}

interface ScenarioFeatureLike {
  id?: string | number;
  geometry?: GeoJsonGeometryLike;
  properties?: Record<string, any>;
  style?: Record<string, any>;
  meta?: Record<string, any>;
  state?: Array<{ geometry?: GeoJsonGeometryLike; properties?: Record<string, any> }>;
}

interface GeoJsonGeometryLike {
  type: string;
  coordinates?: any;
  geometries?: GeoJsonGeometryLike[];
}

const DEFAULT_TACTICAL_SIZE = getEnvNumber('VITE_TACTICAL_SYMBOL_SIZE', 72);
const DEFAULT_MILITARY_SIZE = getEnvNumber('VITE_MILITARY_SYMBOL_SIZE', 80);

const symbolCache = new Map<string, string>();

function getEnvNumber(name: string, fallback: number): number {
  const raw = (import.meta as any).env?.[name];
  if (raw === undefined || raw === null) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function getSymbolDataUri(sidc: string, size: number, options?: Record<string, any>): string | null {
  const normalizedSidc = sidc?.trim();
  if (!normalizedSidc) return null;
  const cacheKey = `${normalizedSidc}|${size}|${JSON.stringify(options || {})}`;
  const cached = symbolCache.get(cacheKey);
  if (cached) return cached;
  try {
    const symbol = new SignsSymbol(normalizedSidc, { size, ...options });
    const svg = symbol.asSVG();
    const uri = toDataUri(svg);
    symbolCache.set(cacheKey, uri);
    return uri;
  } catch (err) {
    console.warn('Failed to build symbol SVG:', normalizedSidc, err);
    return null;
  }
}

function getTacticalImageDataUri(sidc: string, size: number, options?: Record<string, any>): string | null {
  // First try @syncpoint/signs (same approach you had for tactical)
  const uri = getSymbolDataUri(sidc, size, { infoFields: true, ...(options || {}) });
  if (uri) return uri;

  // Fallback: try milsymbol (more permissive for some SIDC variants)
  // NOTE: unitSymbolDataUri caches separately; that's fine.
  return unitSymbolDataUri(sidc, size, options || {}, undefined);
}

function replaceAt(text: string, index: number, replace: string): string {
  return text.substring(0, index) + replace + text.substring(index + 1);
}

const unitSymbolCache = new Map<string, string>();

function unitSymbolDataUri(sidc: string, size: number, symbolOptions?: Record<string, any>, textAmplifiers?: Record<string, string>): string | null {
  const normalizedSidc = sidc?.trim();
  if (!normalizedSidc) return null;
  const cacheKey = `ms|${normalizedSidc}|${size}|${JSON.stringify(symbolOptions || {})}|${JSON.stringify(textAmplifiers || {})}`;
  const cached = unitSymbolCache.get(cacheKey);
  if (cached) return cached;

  let adjustedSidc = normalizedSidc;
  let opts: Record<string, any> = {
    size,
    outlineColor: 'white',
    outlineWidth: 8,
    infoFields: true,
    ...(textAmplifiers || {}),
    ...(symbolOptions || {}),
  };

  if (adjustedSidc[3] === '7') {
    adjustedSidc = replaceAt(adjustedSidc, 3, '3');
  } else if (adjustedSidc[3] === '8') {
    adjustedSidc = replaceAt(adjustedSidc, 3, '3');
  }

  try {
    const sym = new ms.Symbol(adjustedSidc, opts);
    const svg = sym.asSVG();
    const uri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    unitSymbolCache.set(cacheKey, uri);
    return uri;
  } catch (err) {
    console.warn('Failed to build milsymbol SVG:', normalizedSidc, err);
    return null;
  }
}

function parseColorWithOpacity(colorStr: any, opacity: any, defaultOpacity = 1.0): Cesium.Color {
  if (typeof colorStr !== 'string' || !colorStr.trim()) {
    return Cesium.Color.YELLOW.withAlpha(defaultOpacity);
  }
  try {
    const color = Cesium.Color.fromCssColorString(colorStr.trim());
    const alpha = Number.isFinite(Number(opacity)) ? Number(opacity) : defaultOpacity;
    return color.withAlpha(alpha);
  } catch {
    return Cesium.Color.YELLOW.withAlpha(defaultOpacity);
  }
}

function buildLineMaterial(
  color: Cesium.Color,
  strokeStyle: string,
): Cesium.Color | Cesium.PolylineDashMaterialProperty {
  if (strokeStyle === 'dashed') {
    return new Cesium.PolylineDashMaterialProperty({ color, dashLength: 16 });
  }
  if (strokeStyle === 'dotted') {
    return new Cesium.PolylineDashMaterialProperty({ color, dashLength: 4 });
  }
  return color;
}

// ---------------------------------------------------------------------------
// EPSG:3857 (Web Mercator) → WGS84 (lon/lat degrees) conversion
// ---------------------------------------------------------------------------

const EARTH_RADIUS = 6378137;
const RAD2DEG = 180 / Math.PI;

function mercatorToWgs84(x: number, y: number): { lon: number; lat: number } {
  const lon = (x / EARTH_RADIUS) * RAD2DEG;
  const lat = (Math.atan(Math.exp(y / EARTH_RADIUS)) * 2 - Math.PI / 2) * RAD2DEG;
  return { lon, lat };
}

function isWebMercator(coord: number[]): boolean {
  if (!Array.isArray(coord) || coord.length < 2) return false;
  return Math.abs(coord[0]) > 180 || Math.abs(coord[1]) > 90;
}

function convertCoordinate(coord: number[]): number[] {
  if (!isWebMercator(coord)) return coord;
  const { lon, lat } = mercatorToWgs84(coord[0], coord[1]);
  return coord.length > 2 ? [lon, lat, coord[2]] : [lon, lat];
}

function convertCoordinatesArray(coords: any): any {
  if (!Array.isArray(coords)) return coords;
  if (coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    return convertCoordinate(coords);
  }
  return coords.map((c: any) => convertCoordinatesArray(c));
}

function convertGeometryCoords(geometry: GeoJsonGeometryLike): GeoJsonGeometryLike {
  if (!geometry) return geometry;
  if (geometry.type === 'GeometryCollection' && Array.isArray(geometry.geometries)) {
    return {
      ...geometry,
      geometries: geometry.geometries.map(convertGeometryCoords),
    };
  }
  if (geometry.coordinates !== undefined) {
    return {
      ...geometry,
      coordinates: convertCoordinatesArray(geometry.coordinates),
    };
  }
  return geometry;
}

// ---------------------------------------------------------------------------
// Extract tactical features from metadata.tacticalSymbols.tuples
// ---------------------------------------------------------------------------

function extractTacticalFeatures(
  tuples: Array<[string, any]>,
): ScenarioFeatureLike[] {
  const hiddenKeys = new Set<string>();
  tuples.forEach(([key]) => {
    if (key.startsWith('hidden+feature:')) {
      const featureKey = 'feature:' + key.slice('hidden+feature:'.length);
      hiddenKeys.add(featureKey);
    }
  });

  const styleMap = new Map<string, Record<string, any>>();
  tuples.forEach(([key, value]) => {
    if (key.startsWith('style+feature:') && value && typeof value === 'object') {
      const featureKey = 'feature:' + key.slice('style+feature:'.length);
      styleMap.set(featureKey, value);
    }
  });

  const features: ScenarioFeatureLike[] = [];
  tuples.forEach(([key, value]) => {
    if (!key.startsWith('feature:')) return;
    if (hiddenKeys.has(key)) return;
    if (!value || typeof value !== 'object') return;

    // Odin/Orbit ممکن است بعضی entryها را به شکل GeoJSON Feature واقعی یا یک ساختار مشابه بدهد.
    // برای جلوگیری از حذف شدن نمادها، فقط وجود geometry را شرط می‌گذاریم.
    const geom = (value as any).geometry ?? (value as any).geom;
    if (!geom || typeof geom !== 'object') return;

    const featureId = key.split('/').pop() || key;
    const convertedGeometry = convertGeometryCoords(geom as GeoJsonGeometryLike);
    const style = styleMap.get(key);

    features.push({
      id: featureId,
      geometry: convertedGeometry,
      properties: (value as any).properties || {},
      style: style || {},
      meta: (value as any).meta || {},
    });
  });

  return features;
}

function parsePosition(pos: PositionLike | undefined | null): { lon: number; lat: number; height: number } | null {
  if (!Array.isArray(pos) || pos.length < 2) return null;
  const lon = Number(pos[0]);
  const lat = Number(pos[1]);
  const height = Number.isFinite(Number(pos[2])) ? Number(pos[2]) : 0;
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  return { lon, lat, height };
}

function getUnitPosition(unit: UnitLike): { lon: number; lat: number; height: number } | null {
  const direct = parsePosition(unit.location);
  if (direct) return direct;
  if (Array.isArray(unit.state)) {
    for (const s of unit.state) {
      const pos = parsePosition(s?.location);
      if (pos) return pos;
    }
  }
  return null;
}

function collectUnitsFromSide(side: SideLike): UnitLike[] {
  const units: UnitLike[] = [];
  if (Array.isArray(side.subUnits)) {
    units.push(...side.subUnits);
  }
  if (Array.isArray(side.groups)) {
    side.groups.forEach((group) => {
      if (Array.isArray(group.subUnits)) {
        units.push(...group.subUnits);
      }
    });
  }
  return units;
}

function collectUnitsRecursive(units: UnitLike[], out: UnitLike[]) {
  units.forEach((unit) => {
    out.push(unit);
    if (Array.isArray(unit.subUnits)) {
      collectUnitsRecursive(unit.subUnits, out);
    }
  });
}

function getScenarioUnits(content: ScenarioContentLike): UnitLike[] {
  const rootUnits: UnitLike[] = [];
  if (Array.isArray(content.sides)) {
    content.sides.forEach((side) => {
      rootUnits.push(...collectUnitsFromSide(side));
    });
  }
  const all: UnitLike[] = [];
  collectUnitsRecursive(rootUnits, all);
  return all;
}

function getFeatureGeometry(feature: ScenarioFeatureLike): GeoJsonGeometryLike | null {
  if (feature.geometry) return feature.geometry;
  if (Array.isArray(feature.state)) {
    for (const s of feature.state) {
      if (s?.geometry) return s.geometry;
    }
  }
  return null;
}

function getFeatureProperties(feature: ScenarioFeatureLike): Record<string, any> {
  if (feature.properties) return feature.properties;
  if (Array.isArray(feature.state)) {
    for (const s of feature.state) {
      if (s?.properties) return s.properties;
    }
  }
  return {};
}

function toCartesian(lon: number, lat: number, height = 0): Cesium.Cartesian3 {
  return Cesium.Cartesian3.fromDegrees(lon, lat, height);
}

function flattenCoordinates(coords: any): Array<{ lon: number; lat: number; height: number }> {
  if (!Array.isArray(coords)) return [];
  if (coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    const pos = parsePosition(coords as PositionLike);
    return pos ? [pos] : [];
  }
  const out: Array<{ lon: number; lat: number; height: number }> = [];
  coords.forEach((c) => out.push(...flattenCoordinates(c)));
  return out;
}

function getCentroid(points: Array<{ lon: number; lat: number; height: number }>) {
  if (!points.length) return null;
  const sum = points.reduce(
    (acc, p) => {
      acc.lon += p.lon;
      acc.lat += p.lat;
      acc.height += p.height;
      return acc;
    },
    { lon: 0, lat: 0, height: 0 }
  );
  return {
    lon: sum.lon / points.length,
    lat: sum.lat / points.length,
    height: sum.height / points.length,
  };
}

function addBillboard(
  viewer: Cesium.Viewer,
  options: {
    id: string;
    sidc: string;
    position: { lon: number; lat: number; height: number };
    size: number;
    label?: string;
    clampToGround: boolean;
  }
) {
  const image = getTacticalImageDataUri(options.sidc, options.size, {});
  if (!image) return;

  const heightReference = options.clampToGround
    ? Cesium.HeightReference.CLAMP_TO_GROUND
    : Cesium.HeightReference.RELATIVE_TO_GROUND;

  viewer.entities.add({
    id: options.id,
    position: toCartesian(options.position.lon, options.position.lat, options.position.height),
    billboard: {
      image,
      heightReference,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      scale: 0.6,
      // برای اینکه هم‌راستا با `depthTestAgainstTerrain` رفتار کند،
      // depth test را بی‌نهایت غیرفعال نکنیم.
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    label: options.label
      ? {
        text: options.label,
        font: '14px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -18),
        heightReference,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      }
      : undefined,
  });
}

function addTacticalGeometry(
  viewer: Cesium.Viewer,
  geometry: GeoJsonGeometryLike,
  feature: ScenarioFeatureLike,
  scenarioId: string,
  index: number
) {
  const properties = getFeatureProperties(feature);
  const s: Record<string, any> = { ...(feature.style || {}), ...(properties || {}) };

  // Odin ممکن است sidc را با کلیدهای متفاوتی ذخیره کند.
  // اینجا چند نام رایج را پوشش می‌دهیم تا Featureها به خاطر sidcِ خالی حذف نشوند.
  const sidc =
    s?.sidc ??
    s?.SIDC ??
    s?.symbolCode ??
    s?.symbol_code ??
    s?.['symbol-code'] ??
    s?.['symbolCode'] ??
    feature.meta?.sidc ??
    feature.meta?.SIDC;

  const name =
    properties?.name ??
    properties?.Name ??
    feature.meta?.name ??
    feature.meta?.Name ??
    feature.meta?.description;

  const strokeColor = parseColorWithOpacity(
    s.stroke || s['stroke-color'],
    s['stroke-opacity'],
  );
  const fillColor = parseColorWithOpacity(
    s.fill || s['fill-color'],
    s['fill-opacity'],
    0.3,
  );
  const strokeWidth = Number(s['stroke-width']) || Number(s.strokeWidth) || 2;
  const strokeStyle: string = s['stroke-style'] || 'solid';
  const lineMaterial = buildLineMaterial(strokeColor, strokeStyle);

  const addSymbolAt = (pos: { lon: number; lat: number; height: number }) => {
    if (!sidc) return;
    addBillboard(viewer, {
      // همیشه index را در id بیاوریم تا collision و overwrite در GeometryCollection رخ ندهد.
      id: `tactical-${scenarioId}-${feature.id ?? 'feature'}-${index}`,
      sidc,
      // اگر در مختصات مقدار height/z داشته باشیم، گم نشود.
      // CLAMP_TO_GROUND در هر صورت روی زمین می‌چسباند؛ ولی این کار در حالت fallback کمک می‌کند.
      position: { ...pos },
      size: DEFAULT_TACTICAL_SIZE,
      label: name,
      clampToGround: true,
    });
  };

  switch (geometry.type) {
    case 'Point': {
      const pos = parsePosition(geometry.coordinates);
      if (pos) addSymbolAt(pos);
      break;
    }
    case 'MultiPoint': {
      const points = flattenCoordinates(geometry.coordinates);
      points.forEach((p, idx) => {
        if (!sidc) return;
        addBillboard(viewer, {
          id: `tactical-${scenarioId}-${feature.id ?? 'feature'}-${index}-${idx}`,
          sidc,
          position: { ...p },
          size: DEFAULT_TACTICAL_SIZE,
          label: name,
          clampToGround: true,
        });
      });
      break;
    }
    case 'LineString': {
      const points = flattenCoordinates(geometry.coordinates);
      if (points.length >= 2) {
        viewer.entities.add({
          id: `tactical-line-${scenarioId}-${feature.id ?? 'feature'}-${index}`,
          polyline: {
            positions: points.map((p) => toCartesian(p.lon, p.lat, 0)),
            width: strokeWidth,
            clampToGround: true,
            material: lineMaterial,
          },
        });
      }
      const center = getCentroid(points);
      if (center) addSymbolAt(center);
      break;
    }
    case 'MultiLineString': {
      const segments = Array.isArray(geometry.coordinates) ? geometry.coordinates : [];
      segments.forEach((segment: any, segIndex: number) => {
        const points = flattenCoordinates(segment);
        if (points.length >= 2) {
          viewer.entities.add({
            id: `tactical-line-${scenarioId}-${feature.id ?? 'feature'}-${index}-${segIndex}`,
            polyline: {
              positions: points.map((p) => toCartesian(p.lon, p.lat, 0)),
              width: strokeWidth,
              clampToGround: true,
              material: lineMaterial,
            },
          });
        }
        const center = getCentroid(points);
        if (center) addSymbolAt(center);
      });
      break;
    }
    case 'Polygon': {
      const rings = Array.isArray(geometry.coordinates) ? geometry.coordinates : [];
      const outerRing = rings[0];
      const points = flattenCoordinates(outerRing);
      if (points.length >= 3) {
        viewer.entities.add({
          id: `tactical-polygon-${scenarioId}-${feature.id ?? 'feature'}-${index}`,
          polygon: {
            hierarchy: points.map((p) => toCartesian(p.lon, p.lat, 0)),
            material: fillColor,
            outline: true,
            outlineColor: strokeColor,
            perPositionHeight: false,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
        });
      }
      const center = getCentroid(points);
      if (center) addSymbolAt(center);
      break;
    }
    case 'MultiPolygon': {
      const polygons = Array.isArray(geometry.coordinates) ? geometry.coordinates : [];
      polygons.forEach((poly: any, polyIndex: number) => {
        const outerRing = Array.isArray(poly) ? poly[0] : [];
        const points = flattenCoordinates(outerRing);
        if (points.length >= 3) {
          viewer.entities.add({
            id: `tactical-polygon-${scenarioId}-${feature.id ?? 'feature'}-${index}-${polyIndex}`,
            polygon: {
              hierarchy: points.map((p) => toCartesian(p.lon, p.lat, 0)),
              material: fillColor,
              outline: true,
              outlineColor: strokeColor,
              perPositionHeight: false,
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            },
          });
        }
        const center = getCentroid(points);
        if (center) addSymbolAt(center);
      });
      break;
    }
    case 'Circle': {
      const circlePos = parsePosition(geometry.coordinates);
      const radius = Number(feature.meta?.radius) || 500;
      if (circlePos) {
        viewer.entities.add({
          id: `tactical-circle-${scenarioId}-${feature.id ?? 'feature'}-${index}`,
          position: toCartesian(circlePos.lon, circlePos.lat, 0),
          ellipse: {
            semiMajorAxis: radius,
            semiMinorAxis: radius,
            material: fillColor,
            outline: true,
            outlineColor: strokeColor,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
        });
        addSymbolAt(circlePos);
      }
      break;
    }
    case 'GeometryCollection': {
      const geometries = Array.isArray(geometry.geometries) ? geometry.geometries : [];
      geometries.forEach((g, gIndex) => {
        addTacticalGeometry(viewer, g, feature, scenarioId, index + gIndex);
      });
      break;
    }
    default: {
      const points = flattenCoordinates(geometry.coordinates);
      const center = getCentroid(points);
      if (center) addSymbolAt(center);
    }
  }
}

export async function addScenarioSymbols(
  viewer: Cesium.Viewer,
  scenarios: BackendScenario[]
): Promise<void> {
  scenarios.forEach((scenario) => {
    const content = scenario.content as ScenarioContentLike | undefined;
    if (!content || typeof content !== 'object') return;

    const units = getScenarioUnits(content);
    units.forEach((unit, index) => {
      const pos = getUnitPosition(unit);
      if (!pos || !unit.sidc) return;

      const image = unitSymbolDataUri(
        unit.sidc,
        DEFAULT_MILITARY_SIZE,
        unit.symbolOptions,
        unit.textAmplifiers,
      );
      if (!image) return;

      viewer.entities.add({
        id: `unit-${scenario.id}-${unit.id ?? index}`,
        position: toCartesian(pos.lon, pos.lat, 0),
        billboard: {
          image,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          scale: 0.6,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: unit.name
          ? {
            text: unit.name,
            font: '14px sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -18),
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          }
          : undefined,
      });
    });

    // --- Path 1: content.layers (standard ORBAT features) ---
    if (Array.isArray(content.layers)) {
      content.layers.forEach((layer, layerIndex) => {
        if (layer?.isHidden) return;
        const features = Array.isArray(layer.features) ? layer.features : [];
        features.forEach((feature, index) => {
          const geometry = getFeatureGeometry(feature);
          if (!geometry) return;
          addTacticalGeometry(viewer, geometry, feature, scenario.id, layerIndex * 10000 + index);
        });
      });
    }

    // --- Path 2: metadata.tacticalSymbols (Odin/Orbit tactical graphics) ---
    const tuples = content.metadata?.tacticalSymbols?.tuples;
    if (Array.isArray(tuples) && tuples.length > 0) {
      const tacticalFeatures = extractTacticalFeatures(tuples);
      console.log(`[scenarioSymbols] Rendering ${tacticalFeatures.length} tactical features from metadata.tacticalSymbols`);
      tacticalFeatures.forEach((feature, index) => {
        const geometry = getFeatureGeometry(feature);
        if (!geometry) return;
        addTacticalGeometry(viewer, geometry, feature, scenario.id, 90000 + index);
      });
    }
  });
}
