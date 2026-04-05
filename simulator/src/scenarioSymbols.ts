import * as Cesium from 'cesium';
import ms from 'milsymbol';
import { symbolGenerator } from './milsymbwrapper';
import type { BackendScenario } from './scenarioPins';
import { renderTacticalFeature } from './tacticalRenderer';

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
  shortName?: string;
  sidc?: string;
  location?: PositionLike;
  state?: Array<{ t?: any; location?: PositionLike; via?: PositionLike[] }>;
  symbolOptions?: Record<string, any>;
  textAmplifiers?: Record<string, string>;
  rangeRings?: RangeRingLike[];
  subUnits?: UnitLike[];
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

const symbolCache = new Map<
  string,
  {
    image: string;
  }
>();
const labelImageCache = new Map<string, string>();
const unitStateSampleCache = new WeakMap<
  UnitLike,
  {
    samples: Array<{ tMs: number; pos: { lon: number; lat: number; height: number } }>;
    staticPos: { lon: number; lat: number; height: number } | null;
  }
>();
const unitIdCache = new WeakMap<UnitLike, string>();
let persianFontReadyPromise: Promise<void> | null = null;

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

function getTacticalImageDataUri(sidc: string, size: number, options?: Record<string, any>): string | null {
  const rendered = getRenderedMilSymbol(sidc, size, { infoFields: true, ...(options || {}) });
  if (rendered) return rendered.image;

  // Fallback: milsymbol without custom color-mode wrapping
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

async function ensurePersianLabelFont(): Promise<void> {
  if (persianFontReadyPromise) return persianFontReadyPromise;

  persianFontReadyPromise = (async () => {
    if (typeof document === 'undefined' || typeof FontFace === 'undefined') return;

    const fontsToLoad = [
      new FontFace('SimulatorLabel', 'url(/simulator/fonts/Yekan.woff2)', {
        style: 'normal',
        weight: '400',
      }),
      new FontFace('SimulatorLabel', 'url(/simulator/fonts/Yekan-Bold.woff2)', {
        style: 'normal',
        weight: '700',
      }),
    ];

    await Promise.all(
      fontsToLoad.map(async (font) => {
        try {
          const loaded = await font.load();
          document.fonts.add(loaded);
        } catch (err) {
          console.warn('Failed to load simulator label font:', err);
        }
      }),
    );

    try {
      await Promise.all([
        document.fonts.load('400 16px SimulatorLabel'),
        document.fonts.load('700 16px SimulatorLabel'),
      ]);
    } catch (err) {
      console.warn('Failed to warm up simulator label font:', err);
    }
  })();

  return persianFontReadyPromise;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function getUnitLabelImageDataUri(text: string): string | null {
  const normalized = text?.trim();
  if (!normalized) return null;

  const cached = labelImageCache.get(normalized);
  if (cached) return cached;

  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const dpr = Math.max(1, Math.ceil(window.devicePixelRatio || 1));
  const fontSize = 18;
  const paddingX = 16;
  const paddingY = 10;
  const fontSpec = `700 ${fontSize}px SimulatorLabel, IranSans, Tahoma, sans-serif`;

  ctx.font = fontSpec;
  const metrics = ctx.measureText(normalized);
  const textWidth = Math.ceil(metrics.width);
  const textHeight = Math.ceil(fontSize * 1.5);
  const width = textWidth + paddingX * 2;
  const height = textHeight + paddingY * 2;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.scale(dpr, dpr);
  ctx.font = fontSpec;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'right';
  try {
    ctx.direction = 'rtl';
  } catch {}

  roundRect(ctx, 0.5, 0.5, width - 1, height - 1, 12);
  ctx.fillStyle = 'rgba(10, 12, 18, 0.78)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.82)';
  ctx.strokeText(normalized, width - paddingX, height / 2 + 1);

  ctx.fillStyle = '#ffffff';
  ctx.fillText(normalized, width - paddingX, height / 2 + 1);

  const uri = canvas.toDataURL('image/png');
  labelImageCache.set(normalized, uri);
  return uri;
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
// SIDC-based tactical styling helpers
// ---------------------------------------------------------------------------

function getAffiliationColor(sidc: string | undefined | null): Cesium.Color {
  if (!sidc || sidc.length < 2) return Cesium.Color.YELLOW;
  switch (sidc[1].toUpperCase()) {
    case 'F': case 'A': case 'M': case 'D':
      return Cesium.Color.DODGERBLUE;
    case 'H': case 'S': case 'J': case 'K':
      return Cesium.Color.RED;
    case 'N': case 'L':
      return Cesium.Color.LIMEGREEN;
    default:
      return Cesium.Color.YELLOW;
  }
}

function isOffensiveSymbol(sidc: string | undefined | null): boolean {
  if (!sidc || sidc.length < 6 || sidc[0] !== 'G') return false;
  const fn = sidc.substring(4).replace(/[-*]/g, '');
  return /^(OA|OL|A[A-Z]|PA|SA)/.test(fn);
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

function getExpandedUnitSamples(unit: UnitLike): Array<{ tMs: number; pos: { lon: number; lat: number; height: number } }> {
  const cached = unitStateSampleCache.get(unit);
  if (cached) return cached.samples;

  const samples: Array<{ tMs: number; pos: { lon: number; lat: number; height: number } }> = [];
  if (Array.isArray(unit.state) && unit.state.length > 0) {
    const rawSamples = unit.state
      .map((s) => {
        const tMs = parseScenarioTimeToEpochMs(s?.t);
        const pos = parsePosition(s?.location as any);
        const via = Array.isArray(s?.via)
          ? s.via
              .map((entry) => parsePosition(entry))
              .filter((entry): entry is { lon: number; lat: number; height: number } => !!entry)
          : [];
        return tMs !== null && pos ? { tMs, pos, via } : null;
      })
      .filter(
        (
          entry,
        ): entry is {
          tMs: number;
          pos: { lon: number; lat: number; height: number };
          via: Array<{ lon: number; lat: number; height: number }>;
        } => !!entry,
      )
      .sort((a, b) => a.tMs - b.tMs);

    if (rawSamples.length > 0) {
      samples.push({ tMs: rawSamples[0].tMs, pos: rawSamples[0].pos });
      for (let i = 1; i < rawSamples.length; i++) {
        const previous = rawSamples[i - 1];
        const current = rawSamples[i];
        const span = current.tMs - previous.tMs;
        const viaPoints = current.via;

        if (span > 0 && viaPoints.length > 0) {
          viaPoints.forEach((viaPoint, viaIndex) => {
            const interpolatedTime = previous.tMs + Math.round((span * (viaIndex + 1)) / (viaPoints.length + 1));
            samples.push({ tMs: interpolatedTime, pos: viaPoint });
          });
        }

        samples.push({ tMs: current.tMs, pos: current.pos });
      }
    }
  }

  unitStateSampleCache.set(unit, {
    samples,
    staticPos: getUnitPosition(unit),
  });
  return samples;
}

function getUnitPositionAtTime(
  unit: UnitLike,
  epochMs: number,
): { lon: number; lat: number; height: number } | null {
  const samples = getExpandedUnitSamples(unit);
  const staticPos = unitStateSampleCache.get(unit)?.staticPos ?? getUnitPosition(unit);

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

/** شناسه پایدار برای موجودیت‌های فرزند (هم‌خوان با `unit-${scenarioId}-${unit.id ?? index}`). */
function getUnitStableId(unit: UnitLike, unitIndex: number): string {
  const cached = unitIdCache.get(unit);
  if (cached) return cached;
  const id =
    unit.id != null && String(unit.id).trim() !== ''
      ? String(unit.id)
      : String(unitIndex);
  unitIdCache.set(unit, id);
  return id;
}

function buildUnitIndex(units: UnitLike[]): Map<string, UnitLike> {
  const map = new Map<string, UnitLike>();
  units.forEach((unit, index) => {
    map.set(getUnitStableId(unit, index), unit);
  });
  return map;
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
  }
) {
  const image = getTacticalImageDataUri(options.sidc, options.size, {});
  if (!image) return;

  const heightReference = options.clampToGround
    ? Cesium.HeightReference.CLAMP_TO_GROUND
    : Cesium.HeightReference.RELATIVE_TO_GROUND;

  const entity = viewer.entities.add({
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
  const points = getExpandedUnitSamples(unit).map((sample) => sample.pos);

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

function createUnitPositionCallback(
  viewer: Cesium.Viewer,
  unit: UnitLike,
  height = 0,
): Cesium.CallbackPositionProperty {
  return new Cesium.CallbackPositionProperty(() => {
    const epochMs = getCurrentEpochMs(viewer.clock.currentTime);
    const pos = getUnitPositionAtTime(unit, epochMs);
    if (!pos) return undefined;
    return toCartesian(pos.lon, pos.lat, height);
  }, false);
}

function addTacticalGeometry(
  viewer: Cesium.Viewer,
  geometry: GeoJsonGeometryLike,
  feature: ScenarioFeatureLike,
  layer: ScenarioLayerLike | undefined,
  scenarioId: string,
  index: number
) {
  const gType = geometry?.type ?? '';
  const properties = getFeatureProperties(feature);
  const s: Record<string, any> = { ...(feature.style || {}), ...(properties || {}) };

  const sidc =
    s?.sidc ?? s?.SIDC ?? s?.symbolCode ?? s?.symbol_code ??
    s?.['symbol-code'] ?? s?.['symbolCode'] ??
    feature.meta?.sidc ?? feature.meta?.SIDC;

  const name =
    properties?.name ?? properties?.Name ??
    feature.meta?.name ?? feature.meta?.Name ?? feature.meta?.description;

  // ---- Path A: exact tactical renderer (same family search as KalkNegar) ----
  // Try this for every non-plain-point tactical geometry before any billboard fallback.
  if (sidc && gType !== 'Point') {
    const rendered = renderTacticalFeature(
      viewer,
      { id: feature.id, geometry, properties: feature.properties, style: feature.style, meta: feature.meta },
      scenarioId,
      index,
    );
    if (rendered) return;
  }

  // ---- Explicit style vs SIDC-derived style ----
  const hasExplicitStroke = !!(s.stroke || s['stroke-color']);
  const hasExplicitFill = !!(s.fill || s['fill-color']);

  const explicitStroke = hasExplicitStroke
    ? parseColorWithOpacity(s.stroke || s['stroke-color'], s['stroke-opacity'])
    : null;
  const explicitFill = hasExplicitFill
    ? parseColorWithOpacity(s.fill || s['fill-color'], s['fill-opacity'], 0.3)
    : null;

  const strokeWidth = Number(s['stroke-width']) || Number(s.strokeWidth) || 3;
  const strokeStyle: string = s['stroke-style'] || 'solid';

  const affiliationColor = getAffiliationColor(sidc);
  const offensive = isOffensiveSymbol(sidc);

  const effectiveStroke = explicitStroke ?? affiliationColor;
  const effectiveFill = explicitFill ?? affiliationColor.withAlpha(0.25);
  const effectiveWidth = Math.max(strokeWidth, 5);

  const tacticalMaterial: any = offensive
    ? new Cesium.PolylineArrowMaterialProperty(effectiveStroke)
    : buildLineMaterial(effectiveStroke, strokeStyle);

  // Billboard only for point-type geometries
  const addSymbolAt = (pos: { lon: number; lat: number; height: number }) => {
    if (!sidc) return;
    addBillboard(viewer, {
      id: `tactical-${scenarioId}-${feature.id ?? 'feature'}-${index}`,
      sidc,
      position: { ...pos },
      size: DEFAULT_TACTICAL_SIZE,
      label: name,
      clampToGround: true,
      symbolOptions: {
        outlineColor: 'white',
        outlineWidth: 8,
      },
    });
  };

  const addGenericPointAt = (
    pos: { lon: number; lat: number; height: number },
    suffix = '',
  ) => {
    viewer.entities.add({
      id: `tactical-point-${scenarioId}-${feature.id ?? 'feature'}-${index}${suffix}`,
      position: toCartesian(pos.lon, pos.lat, pos.height),
      point: {
        pixelSize: 10,
        color: effectiveStroke,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  };

  // Label-only for line/area geometries (no floating billboard)
  const addCentroidLabel = (pos: { lon: number; lat: number; height: number }, suffix = '') => {
    if (!name) return;
    viewer.entities.add({
      id: `tactical-label-${scenarioId}-${feature.id ?? 'feature'}-${index}${suffix}`,
      position: toCartesian(pos.lon, pos.lat, 0),
      label: {
        text: name,
        font: '13px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  };

  switch (geometry.type) {
    // ---- Point: billboard (icon) on surface ----
    case 'Point': {
      const pos = parsePosition(geometry.coordinates);
      if (pos) addSymbolAt(pos);
      break;
    }
    case 'MultiPoint': {
      const points = flattenCoordinates(geometry.coordinates);
      points.forEach((p, idx) => {
        addGenericPointAt(p, `-${idx}`);
      });
      const center = getCentroid(points);
      if (center) addCentroidLabel(center);
      break;
    }

    // ---- Lines: polyline on surface, color/arrow from SIDC ----
    case 'LineString': {
      const points = flattenCoordinates(geometry.coordinates);
      if (points.length >= 2) {
        viewer.entities.add({
          id: `tactical-line-${scenarioId}-${feature.id ?? 'feature'}-${index}`,
          polyline: {
            positions: points.map((p) => toCartesian(p.lon, p.lat, 0)),
            width: effectiveWidth,
            clampToGround: true,
            material: tacticalMaterial,
          },
        });
      }
      const center = getCentroid(points);
      if (center) addCentroidLabel(center);
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
              width: effectiveWidth,
              clampToGround: true,
              material: tacticalMaterial,
            },
          });
        }
      });
      const allPts = segments.flatMap((seg: any) => flattenCoordinates(seg));
      const center = getCentroid(allPts);
      if (center) addCentroidLabel(center);
      break;
    }

    // ---- Polygons: filled area on surface ----
    case 'Polygon': {
      const rings = Array.isArray(geometry.coordinates) ? geometry.coordinates : [];
      const outerRing = rings[0];
      const points = flattenCoordinates(outerRing);
      if (points.length >= 3) {
        viewer.entities.add({
          id: `tactical-polygon-${scenarioId}-${feature.id ?? 'feature'}-${index}`,
          polygon: {
            hierarchy: points.map((p) => toCartesian(p.lon, p.lat, 0)),
            material: effectiveFill,
            outline: true,
            outlineColor: effectiveStroke,
            perPositionHeight: false,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
        });
      }
      const center = getCentroid(points);
      if (center) addCentroidLabel(center);
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
              material: effectiveFill,
              outline: true,
              outlineColor: effectiveStroke,
              perPositionHeight: false,
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            },
          });
        }
      });
      const allPts = polygons.flatMap((poly: any) => {
        const ring = Array.isArray(poly) ? poly[0] : [];
        return flattenCoordinates(ring);
      });
      const center = getCentroid(allPts);
      if (center) addCentroidLabel(center);
      break;
    }

    // ---- Circle: ellipse on surface ----
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
            material: effectiveFill,
            outline: true,
            outlineColor: effectiveStroke,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
        });
        addCentroidLabel({ ...circlePos, height: 0 });
      }
      break;
    }

    // ---- GeometryCollection: recurse ----
    case 'GeometryCollection': {
      const geometries = Array.isArray(geometry.geometries) ? geometry.geometries : [];
      geometries.forEach((g, gIndex) => {
        addTacticalGeometry(viewer, g, feature, layer, scenarioId, index + gIndex);
      });
      break;
    }

    // ---- Unknown: best-effort billboard at centroid ----
    default: {
      const points = flattenCoordinates(geometry.coordinates);
      const center = getCentroid(points);
      if (center) addGenericPointAt(center, '-fallback');
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
  await ensurePersianLabelFont();

  scenarios.forEach((scenario) => {
    const content = scenario.content as ScenarioContentLike | undefined;
    if (!content || typeof content !== 'object') return;

    const units = getScenarioUnits(content);
    const unitIndex = buildUnitIndex(units);
    units.forEach((unit, index) => {
      if (!unit.sidc) return;

      const image = unitSymbolDataUri(
        unit.sidc,
        DEFAULT_MILITARY_SIZE,
        unit.symbolOptions,
        unit.textAmplifiers,
      );
      if (!image) return;

      const unitEntityId = `unit-${scenario.id}-${unit.id ?? index}`;
      const unitPosition = createUnitPositionCallback(viewer, unit);
      const labelText = unit.shortName || unit.name || '';
      const labelImage = labelText ? getUnitLabelImageDataUri(labelText) : null;

      viewer.entities.add({
        id: unitEntityId,
        position: unitPosition,
        billboard: {
          image,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          scale: 0.6,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });

      if (labelImage) {
        viewer.entities.add({
          id: `${unitEntityId}-label`,
          position: createUnitPositionCallback(viewer, unit, 24),
          billboard: {
            image: labelImage,
            horizontalOrigin: Cesium.HorizontalOrigin.RIGHT,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            pixelOffset: new Cesium.Cartesian2(-72, -30),
            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            scale: 1,
          },
        });
      }

      addUnitTrack(viewer, scenario.id, unit, index);
      addRangeRings(viewer, scenario.id, unit, index);
    });

    // --- Path 1: content.layers (standard ORBAT features) ---
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

    // --- Path 2: metadata.tacticalSymbols (Odin/Orbit tactical graphics) ---
    const tuples = content.metadata?.tacticalSymbols?.tuples;
    if (Array.isArray(tuples) && tuples.length > 0) {
      const tacticalFeatures = extractTacticalFeatures(tuples);
      tacticalFeatures.forEach((feature, index) => {
        const geometry = getFeatureGeometry(feature);
        if (!geometry) return;
        addTacticalGeometry(viewer, geometry, feature, undefined, scenario.id, 90000 + index);
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
