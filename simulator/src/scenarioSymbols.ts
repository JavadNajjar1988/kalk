import * as Cesium from 'cesium';
import { Symbol as SignsSymbol } from '@syncpoint/signs';
import type { BackendScenario } from './scenarioPins';

type PositionLike = number[];

interface ScenarioContentLike {
  sides?: SideLike[];
  layers?: ScenarioLayerLike[];
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
  location?: PositionLike;
  state?: Array<{ location?: PositionLike }>;
  subUnits?: UnitLike[];
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
const MILITARY_SYMBOL_HEIGHT_METERS = getEnvNumber('VITE_MILITARY_SYMBOL_HEIGHT', 300);

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

function parseColor(value: any, fallback: Cesium.Color): Cesium.Color {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  try {
    return Cesium.Color.fromCssColorString(trimmed);
  } catch {
    return fallback;
  }
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
  const image = getSymbolDataUri(options.sidc, options.size, { infoFields: true });
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
  const sidc = properties?.sidc || properties?.['symbol-code'] || feature.meta?.sidc;
  const name = properties?.name || feature.meta?.name || feature.meta?.description;

  const strokeColor = parseColor(properties?.stroke || feature.style?.stroke, Cesium.Color.YELLOW);
  const fillColor = parseColor(properties?.fill || feature.style?.fill, Cesium.Color.YELLOW.withAlpha(0.3));
  const strokeWidthRaw = properties?.strokeWidth || feature.style?.strokeWidth;
  const strokeWidth = Number.isFinite(Number(strokeWidthRaw)) ? Number(strokeWidthRaw) : 2;

  const addSymbolAt = (pos: { lon: number; lat: number; height: number }) => {
    if (!sidc) return;
    addBillboard(viewer, {
      id: `tactical-${scenarioId}-${feature.id ?? index}`,
      sidc,
      position: { ...pos, height: 0 },
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
          id: `tactical-${scenarioId}-${feature.id ?? index}-${idx}`,
          sidc,
          position: { ...p, height: 0 },
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
          id: `tactical-line-${scenarioId}-${feature.id ?? index}`,
          polyline: {
            positions: points.map((p) => toCartesian(p.lon, p.lat, 0)),
            width: strokeWidth,
            clampToGround: true,
            material: strokeColor,
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
            id: `tactical-line-${scenarioId}-${feature.id ?? index}-${segIndex}`,
            polyline: {
              positions: points.map((p) => toCartesian(p.lon, p.lat, 0)),
              width: strokeWidth,
              clampToGround: true,
              material: strokeColor,
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
          id: `tactical-polygon-${scenarioId}-${feature.id ?? index}`,
          polygon: {
            hierarchy: points.map((p) => toCartesian(p.lon, p.lat, 0)),
            material: fillColor,
            outline: true,
            outlineColor: strokeColor,
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
            id: `tactical-polygon-${scenarioId}-${feature.id ?? index}-${polyIndex}`,
            polygon: {
              hierarchy: points.map((p) => toCartesian(p.lon, p.lat, 0)),
              material: fillColor,
              outline: true,
              outlineColor: strokeColor,
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            },
          });
        }
        const center = getCentroid(points);
        if (center) addSymbolAt(center);
      });
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
      addBillboard(viewer, {
        id: `unit-${scenario.id}-${unit.id ?? index}`,
        sidc: unit.sidc,
        position: { lon: pos.lon, lat: pos.lat, height: MILITARY_SYMBOL_HEIGHT_METERS },
        size: DEFAULT_MILITARY_SIZE,
        label: unit.name,
        clampToGround: false,
      });
    });

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
  });
}
