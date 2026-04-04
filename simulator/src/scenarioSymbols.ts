import * as Cesium from 'cesium';
import type { BackendScenario } from './scenarioPins';
import { symbolGenerator } from './milsymbwrapper';

type PositionLike = number[];
interface RangeRingLike {
  name?: string;
  range?: number;
  uom?: 'm' | 'km' | 'ft' | 'mi' | 'nmi';
  hidden?: boolean;
  style?: Record<string, any>;
}

interface ScenarioContentLike {
  sides?: SideLike[];
  layers?: ScenarioLayerLike[];
  events?: ScenarioEventLike[];
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
  shortName?: string;
  sidc?: string;
  location?: PositionLike;
  state?: Array<{ t?: any; location?: PositionLike }>;
  symbolOptions?: Record<string, any>;
  textAmplifiers?: Record<string, string>;
  rangeRings?: RangeRingLike[];
  subUnits?: UnitLike[];
  _state?: { sidc?: string } | null;
}

interface ScenarioLayerLike {
  name?: string;
  isHidden?: boolean;
  features?: ScenarioFeatureLike[];
  visibleFromT?: any;
  visibleUntilT?: any;
}

interface ScenarioFeatureLike {
  id?: string | number;
  geometry?: GeoJsonGeometryLike;
  properties?: Record<string, any>;
  style?: Record<string, any>;
  meta?: Record<string, any>;
  state?: Array<{ t?: any; geometry?: GeoJsonGeometryLike; properties?: Record<string, any> }>;
}

interface GeoJsonGeometryLike {
  type: string;
  coordinates?: any;
  geometries?: GeoJsonGeometryLike[];
}

interface ScenarioEventLike {
  id?: string;
  title?: string;
  subTitle?: string;
  description?: string;
  startTime?: any;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  where?: EventWhereLike;
}

type EventWhereLike = EventUnitsWhereLike | EventGeometryWhereLike;

interface EventUnitsWhereLike {
  type: 'units';
  units?: string[];
}

interface EventGeometryWhereLike {
  type: 'geometry';
  geometry?: GeoJsonGeometryLike;
}

export interface ScenarioRenderSummary {
  totalUnits: number;
  visibleUnits: number;
  trackedUnits: number;
  layerFeatures: number;
  events: number;
}

const DEFAULT_TACTICAL_SIZE = getEnvNumber('VITE_TACTICAL_SYMBOL_SIZE', 72);
const DEFAULT_MILITARY_SIZE = getEnvNumber('VITE_MILITARY_SYMBOL_SIZE', 80);
const MILITARY_SYMBOL_HEIGHT_METERS = getEnvNumber('VITE_MILITARY_SYMBOL_HEIGHT', 300);
const RANGE_RING_HEIGHT_METERS = getEnvNumber('VITE_RANGE_RING_HEIGHT', 5);

const symbolCache = new Map<
  string,
  {
    image: string;
  }
>();
const unitStateSampleCache = new WeakMap<
  UnitLike,
  {
    samples: Array<{ tMs: number; pos: { lon: number; lat: number; height: number } }>;
    staticPos: { lon: number; lat: number; height: number } | null;
  }
>();
const unitIdCache = new WeakMap<UnitLike, string>();

function getEnvNumber(name: string, fallback: number): number {
  const raw = (import.meta as any).env?.[name];
  if (raw === undefined || raw === null) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getRenderedMilSymbol(
  sidc: string,
  size: number,
  options?: Record<string, any>,
): {
  image: string;
} | null {
  const normalizedSidc = sidc?.trim();
  if (!normalizedSidc) return null;
  const cacheKey = `${normalizedSidc}|${size}|${JSON.stringify(options || {})}`;
  const cached = symbolCache.get(cacheKey);
  if (cached) return cached;
  try {
    const symbol = symbolGenerator(normalizedSidc, { size, ...options });
    const rendered = {
      image: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(symbol.asSVG())}`,
    };
    symbolCache.set(cacheKey, rendered);
    return rendered;
  } catch (err) {
    console.warn('Failed to build military symbol:', normalizedSidc, err);
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

function parseScenarioTimeToEpochMs(t: any): number | null {
  if (t === undefined || t === null) return null;
  if (typeof t === 'number') {
    // Heuristic: assume seconds if it's small; otherwise milliseconds.
    return t < 1e12 ? Math.floor(t * 1000) : Math.floor(t);
  }
  if (typeof t === 'string') {
    const d = new Date(t);
    const ms = d.getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  return null;
}

function getCurrentEpochMs(time: Cesium.JulianDate): number {
  return Cesium.JulianDate.toDate(time).getTime();
}

function getUnitPositionAtTime(
  unit: UnitLike,
  epochMs: number,
): { lon: number; lat: number; height: number } | null {
  const cached = unitStateSampleCache.get(unit);
  if (!cached) {
    const samples: Array<{ tMs: number; pos: { lon: number; lat: number; height: number } }> = [];
    if (Array.isArray(unit.state) && unit.state.length > 0) {
      for (const s of unit.state) {
        const tMs = parseScenarioTimeToEpochMs(s?.t);
        const pos = parsePosition(s?.location as any);
        if (tMs !== null && pos) samples.push({ tMs, pos });
      }
      samples.sort((a, b) => a.tMs - b.tMs);
    }
    unitStateSampleCache.set(unit, {
      samples,
      staticPos: getUnitPosition(unit),
    });
  }

  const { samples, staticPos } = unitStateSampleCache.get(unit)!;

  if (samples.length === 0) return staticPos;

  if (epochMs <= samples[0].tMs) return samples[0].pos;
  if (epochMs >= samples[samples.length - 1].tMs) return samples[samples.length - 1].pos;

  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i];
    const b = samples[i + 1];
    if (epochMs >= a.tMs && epochMs <= b.tMs) {
      const span = b.tMs - a.tMs;
      const w = span > 0 ? (epochMs - a.tMs) / span : 0;
      return {
        lon: a.pos.lon + (b.pos.lon - a.pos.lon) * w,
        lat: a.pos.lat + (b.pos.lat - a.pos.lat) * w,
        height: a.pos.height + (b.pos.height - a.pos.height) * w,
      };
    }
  }

  // Shouldn't happen, but fallback.
  return samples[0].pos;
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

function buildUnitIndex(units: UnitLike[]): Map<string, UnitLike> {
  const map = new Map<string, UnitLike>();
  units.forEach((unit, index) => {
    const fallbackId = `unit-${index}`;
    const key = unit.id ? String(unit.id) : fallbackId;
    unitIdCache.set(unit, key);
    map.set(key, unit);
  });
  return map;
}

function getUnitStableId(unit: UnitLike, fallbackIndex = 0): string {
  return unit.id ? String(unit.id) : unitIdCache.get(unit) ?? `unit-${fallbackIndex}`;
}

function getUnitSidc(unit: UnitLike): string {
  return String(unit._state?.sidc || unit.sidc || '').trim();
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

function getVisibilityPredicate(
  layer: ScenarioLayerLike | undefined,
  feature: ScenarioFeatureLike | undefined,
): (epochMs: number) => boolean {
  const fromRaw =
    feature?.meta?.visibleFromT ??
    (feature as any)?.visibleFromT ??
    layer?.visibleFromT;
  const untilRaw =
    feature?.meta?.visibleUntilT ??
    (feature as any)?.visibleUntilT ??
    layer?.visibleUntilT;

  const fromMs = parseScenarioTimeToEpochMs(fromRaw);
  const untilMs = parseScenarioTimeToEpochMs(untilRaw);

  return (epochMs: number) => {
    if (fromMs !== null && epochMs < fromMs) return false;
    if (untilMs !== null && epochMs > untilMs) return false;
    return true;
  };
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

function toDistanceMeters(value: number | undefined, uom: RangeRingLike['uom']): number | null {
  if (!Number.isFinite(Number(value))) return null;
  const numeric = Number(value);
  switch (uom) {
    case 'km':
      return numeric * 1000;
    case 'ft':
      return numeric * 0.3048;
    case 'mi':
      return numeric * 1609.344;
    case 'nmi':
      return numeric * 1852;
    case 'm':
    default:
      return numeric;
  }
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

function getSeverityColor(severity: ScenarioEventLike['severity']): Cesium.Color {
  switch (severity) {
    case 'critical':
      return Cesium.Color.RED;
    case 'high':
      return Cesium.Color.ORANGE;
    case 'medium':
      return Cesium.Color.YELLOW;
    case 'low':
    default:
      return Cesium.Color.CYAN;
  }
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
    symbolOptions?: Record<string, any>;
    showPredicate?: (epochMs: number) => boolean;
  }
) {
  const renderedSymbol = getRenderedMilSymbol(options.sidc, options.size, options.symbolOptions);
  if (!renderedSymbol) return;

  const heightReference = options.clampToGround
    ? Cesium.HeightReference.CLAMP_TO_GROUND
    : Cesium.HeightReference.RELATIVE_TO_GROUND;

  const entity = viewer.entities.add({
    id: options.id,
    position: toCartesian(options.position.lon, options.position.lat, options.position.height),
    billboard: {
      image: renderedSymbol.image,
      heightReference,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      scale: 0.8,
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

  return entity;
}

function addRangeRings(
  viewer: Cesium.Viewer,
  scenarioId: string,
  unit: UnitLike,
  unitIndex: number,
) {
  if (!Array.isArray(unit.rangeRings) || unit.rangeRings.length === 0) return;

  const unitId = getUnitStableId(unit, unitIndex);
  unit.rangeRings.forEach((ring, ringIndex) => {
    if (!ring || ring.hidden) return;
    const radiusMeters = toDistanceMeters(ring.range, ring.uom);
    if (!radiusMeters || radiusMeters <= 0) return;

    const stroke = parseColor(ring.style?.stroke, Cesium.Color.YELLOW.withAlpha(0.95));
    const fill = parseColor(ring.style?.fill, stroke.withAlpha(0.08));

    viewer.entities.add({
      id: `range-ring-${scenarioId}-${unitId}-${ringIndex}`,
      position: new Cesium.CallbackPositionProperty(() => {
        const epochMs = getCurrentEpochMs(viewer.clock.currentTime);
        const pos = getUnitPositionAtTime(unit, epochMs);
        if (!pos) return undefined;
        return toCartesian(pos.lon, pos.lat, RANGE_RING_HEIGHT_METERS);
      }, false),
      ellipse: {
        semiMajorAxis: radiusMeters,
        semiMinorAxis: radiusMeters,
        material: fill,
        outline: true,
        outlineColor: stroke,
        outlineWidth: Number.isFinite(Number(ring.style?.strokeWidth)) ? Number(ring.style?.strokeWidth) : 2,
        height: RANGE_RING_HEIGHT_METERS,
        classificationType: Cesium.ClassificationType.TERRAIN,
      },
    });

    viewer.entities.add({
      id: `range-ring-label-${scenarioId}-${unitId}-${ringIndex}`,
      position: new Cesium.CallbackPositionProperty(() => {
        const epochMs = getCurrentEpochMs(viewer.clock.currentTime);
        const pos = getUnitPositionAtTime(unit, epochMs);
        if (!pos) return undefined;
        const latOffset = radiusMeters / 111_320;
        return toCartesian(pos.lon, pos.lat + latOffset, RANGE_RING_HEIGHT_METERS + 10);
      }, false),
      label: {
        text: ring.name ? `${ring.name} - ${ring.range}${ring.uom ?? 'm'}` : `${ring.range}${ring.uom ?? 'm'}`,
        font: '12px sans-serif',
        fillColor: stroke,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  });
}

function addUnitTrack(
  viewer: Cesium.Viewer,
  scenarioId: string,
  unit: UnitLike,
  unitIndex: number,
) {
  if (!Array.isArray(unit.state) || unit.state.length < 2) return;

  const points = unit.state
    .map((s) => parsePosition(s?.location))
    .filter((pos): pos is { lon: number; lat: number; height: number } => !!pos);

  if (points.length < 2) return;

  viewer.entities.add({
    id: `unit-track-${scenarioId}-${getUnitStableId(unit, unitIndex)}`,
    polyline: {
      positions: points.map((p) => toCartesian(p.lon, p.lat, 10)),
      width: 3,
      clampToGround: true,
      material: Cesium.Color.CYAN.withAlpha(0.75),
    },
  });
}

function addTacticalGeometry(
  viewer: Cesium.Viewer,
  geometry: GeoJsonGeometryLike,
  feature: ScenarioFeatureLike,
  layer: ScenarioLayerLike | undefined,
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

  const showPredicate = getVisibilityPredicate(layer, feature);

  const addSymbolAt = (pos: { lon: number; lat: number; height: number }) => {
    if (!sidc) return;
    addBillboard(viewer, {
      id: `tactical-${scenarioId}-${feature.id ?? index}`,
      sidc,
      position: { ...pos, height: 0 },
      size: DEFAULT_TACTICAL_SIZE,
      label: name,
      clampToGround: true,
      symbolOptions: {
        outlineColor: 'white',
        outlineWidth: 8,
      },
      showPredicate,
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
          showPredicate,
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
            height: 0,
            classificationType: Cesium.ClassificationType.TERRAIN,
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
              height: 0,
              classificationType: Cesium.ClassificationType.TERRAIN,
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
        addTacticalGeometry(viewer, g, feature, layer, scenarioId, index + gIndex);
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

function addEventHighlights(
  viewer: Cesium.Viewer,
  scenario: BackendScenario,
  content: ScenarioContentLike,
  unitIndex: Map<string, UnitLike>,
) {
  if (!Array.isArray(content.events)) return;

  content.events.forEach((event, eventIndex) => {
    const eventTimeMs = parseScenarioTimeToEpochMs(event.startTime);
    const eventColor = getSeverityColor(event.severity);
    const eventText = event.title || event.subTitle || `رویداد ${eventIndex + 1}`;
    const addEventPoint = (pos: { lon: number; lat: number; height: number }, suffix: string) => {
      viewer.entities.add({
        id: `event-${scenario.id}-${event.id ?? eventIndex}-${suffix}`,
        position: toCartesian(pos.lon, pos.lat, 40),
        point: {
          pixelSize: 12,
          color: eventColor,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: eventText,
          font: '13px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -18),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        description: event.description || eventText,
      });
    };

    const where = event.where;
    if (!where) return;

    if (where.type === 'units' && Array.isArray(where.units)) {
      where.units.forEach((unitId, unitWhereIndex) => {
        const unit = unitIndex.get(String(unitId));
        if (!unit) return;
        const pos = eventTimeMs !== null ? getUnitPositionAtTime(unit, eventTimeMs) : getUnitPosition(unit);
        if (!pos) return;
        addEventPoint(pos, `unit-${unitWhereIndex}`);
      });
      return;
    }

    if (where.type === 'geometry' && where.geometry) {
      addTacticalGeometry(
        viewer,
        where.geometry,
        {
          id: `event-geometry-${event.id ?? eventIndex}`,
          geometry: where.geometry,
          properties: {
            name: eventText,
            stroke: eventColor.toCssColorString(),
            fill: eventColor.withAlpha(0.15).toCssColorString(),
            strokeWidth: 3,
          },
          meta: {
            name: eventText,
          },
        },
        undefined,
        scenario.id,
        900000 + eventIndex,
      );

      const center = getCentroid(flattenCoordinates(where.geometry.coordinates));
      if (center) {
        addEventPoint(center, 'geometry');
      }
    }
  });
}

export async function addScenarioSymbols(
  viewer: Cesium.Viewer,
  scenarios: BackendScenario[]
): Promise<void> {
  scenarios.forEach((scenario) => {
    const content = scenario.content as ScenarioContentLike | undefined;
    if (!content || typeof content !== 'object') return;

    const units = getScenarioUnits(content);
    const unitIndex = buildUnitIndex(units);
    units.forEach((unit, index) => {
      const resolvedSidc = getUnitSidc(unit);
      if (!resolvedSidc) return;

      const uniqueDesignation = unit.shortName || unit.name || '';
      const renderedSymbol = getRenderedMilSymbol(
        resolvedSidc,
        DEFAULT_MILITARY_SIZE * Math.max(1, window.devicePixelRatio || 1),
        {
          uniqueDesignation,
          outlineColor: 'white',
          outlineWidth: 8,
          ...(unit.textAmplifiers || {}),
          ...(unit.symbolOptions || {}),
        },
      );
      if (!renderedSymbol) return;

      viewer.entities.add({
        id: `unit-${scenario.id}-${getUnitStableId(unit, index)}`,
        position: new Cesium.CallbackPositionProperty(() => {
          const epochMs = getCurrentEpochMs(viewer.clock.currentTime);
          const pos = getUnitPositionAtTime(unit, epochMs);
          if (!pos) return undefined;
          return toCartesian(pos.lon, pos.lat, MILITARY_SYMBOL_HEIGHT_METERS);
        }, false),
        billboard: {
          image: renderedSymbol.image,
          heightReference: Cesium.HeightReference.NONE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          scale: 0.9,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });

      addUnitTrack(viewer, scenario.id, unit, index);
      addRangeRings(viewer, scenario.id, unit, index);
    });

    if (Array.isArray(content.layers)) {
      content.layers.forEach((layer, layerIndex) => {
        if (layer?.isHidden) return;
        const features = Array.isArray(layer.features) ? layer.features : [];
        features.forEach((feature, index) => {
          const geometry = getFeatureGeometry(feature);
          if (!geometry) return;
          addTacticalGeometry(viewer, geometry, feature, layer, scenario.id, layerIndex * 10000 + index);
        });
      });
    }

    addEventHighlights(viewer, scenario, content, unitIndex);
  });
}

export function summarizeScenarioRender(scenarios: BackendScenario[]): ScenarioRenderSummary {
  let totalUnits = 0;
  let visibleUnits = 0;
  let trackedUnits = 0;
  let layerFeatures = 0;
  let events = 0;

  scenarios.forEach((scenario) => {
    const content = scenario.content as ScenarioContentLike | undefined;
    if (!content || typeof content !== 'object') return;

    const units = getScenarioUnits(content);
    totalUnits += units.length;
    visibleUnits += units.filter((unit) => !!unit.sidc && !!getUnitPosition(unit)).length;
    trackedUnits += units.filter((unit) => Array.isArray(unit.state) && unit.state.length >= 2).length;
    layerFeatures += Array.isArray(content.layers)
      ? content.layers.reduce((sum, layer) => sum + (Array.isArray(layer?.features) ? layer.features.length : 0), 0)
      : 0;
    events += Array.isArray(content.events) ? content.events.length : 0;
  });

  return {
    totalUnits,
    visibleUnits,
    trackedUnits,
    layerFeatures,
    events,
  };
}

// Used by simulator entrypoint to set viewer.clock bounds.
export function getScenarioTimeBounds(
  scenarios: BackendScenario[],
): { start: Cesium.JulianDate; stop: Cesium.JulianDate } | null {
  let minMs: number | null = null;
  let maxMs: number | null = null;

  const consider = (ms: number | null) => {
    if (ms === null) return;
    minMs = minMs === null ? ms : Math.min(minMs, ms);
    maxMs = maxMs === null ? ms : Math.max(maxMs, ms);
  };

  scenarios.forEach((scenario) => {
    const content = scenario.content as any;
    if (!content || typeof content !== 'object') return;

    consider(parseScenarioTimeToEpochMs(content?.startTime ?? content?.meta?.startTime));
    if (Array.isArray(content?.events)) {
      content.events.forEach((event: ScenarioEventLike) => consider(parseScenarioTimeToEpochMs(event?.startTime)));
    }

    const units = getScenarioUnits(content as ScenarioContentLike);
    units.forEach((unit) => {
      if (Array.isArray(unit.state)) {
        unit.state.forEach((s) => consider(parseScenarioTimeToEpochMs((s as any)?.t)));
      }
    });
  });

  if (minMs === null || maxMs === null) return null;
  if (minMs === maxMs) maxMs = minMs + 60 * 60 * 1000; // +1 hour

  return {
    start: Cesium.JulianDate.fromDate(new Date(minMs)),
    stop: Cesium.JulianDate.fromDate(new Date(maxMs)),
  };
}
