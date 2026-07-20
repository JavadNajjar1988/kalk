/**
 * tacticalStyles.ts
 *
 * Imports Odin's pure-geometry style functions (they depend only on jsts + ramda,
 * NO OpenLayers dependency) and exposes a single SIDC-based lookup.
 *
 * The style functions all share the signature:
 *   fn({ TS, geometry, resolution, PI, PI_OVER_2, PI_OVER_3, read }) -> StyleDescriptor[]
 *
 * where StyleDescriptor = { id: string, geometry: jsts.Geometry, ... }
 */

import { TS } from './tacticalTs';

// ---------------------------------------------------------------------------
// Odin style function files — copied into simulator/src/odinStyles/
// These are pure geometry functions (only depend on ramda + TS object).
// ---------------------------------------------------------------------------

// LineString styles
import G_F_LT    from './odinStyles/linestring-styles/G_F_LT.js';
import G_G_GLC   from './odinStyles/linestring-styles/G_G_GLC.js';
import G_G_GLF   from './odinStyles/linestring-styles/G_G_GLF.js';
import G_G_OLKA  from './odinStyles/linestring-styles/G_G_OLKA.js';
import G_G_OLKGM from './odinStyles/linestring-styles/G_G_OLKGM.js';
import G_G_OLKGS from './odinStyles/linestring-styles/G_G_OLKGS.js';
import G_G_PF    from './odinStyles/linestring-styles/G_G_PF.js';
import G_M_BCF   from './odinStyles/linestring-styles/G_M_BCF.js';
import G_M_BCL   from './odinStyles/linestring-styles/G_M_BCL.js';
import G_M_BCR   from './odinStyles/linestring-styles/G_M_BCR.js';
import G_M_OADC  from './odinStyles/linestring-styles/G_M_OADC.js';
import G_M_OADU  from './odinStyles/linestring-styles/G_M_OADU.js';
import G_M_OAR   from './odinStyles/linestring-styles/G_M_OAR.js';
import G_M_OAW   from './odinStyles/linestring-styles/G_M_OAW.js';
import G_M_OEF   from './odinStyles/linestring-styles/G_M_OEF.js';
import G_M_OGL   from './odinStyles/linestring-styles/G_M_OGL.js';
import G_M_OMC   from './odinStyles/linestring-styles/G_M_OMC.js';
import G_M_OS    from './odinStyles/linestring-styles/G_M_OS.js';
import G_M_OWA   from './odinStyles/linestring-styles/G_M_OWA.js';
import G_M_OWCD  from './odinStyles/linestring-styles/G_M_OWCD.js';
import G_M_OWCS  from './odinStyles/linestring-styles/G_M_OWCS.js';
import G_M_OWCT  from './odinStyles/linestring-styles/G_M_OWCT.js';
import G_M_OWD   from './odinStyles/linestring-styles/G_M_OWD.js';
import G_M_OWH   from './odinStyles/linestring-styles/G_M_OWH.js';
import G_M_OWL   from './odinStyles/linestring-styles/G_M_OWL.js';
import G_M_OWS   from './odinStyles/linestring-styles/G_M_OWS.js';
import G_M_OWU   from './odinStyles/linestring-styles/G_M_OWU.js';
import G_M_SL    from './odinStyles/linestring-styles/G_M_SL.js';
import G_M_SW    from './odinStyles/linestring-styles/G_M_SW.js';
import G_O_HN    from './odinStyles/linestring-styles/G_O_HN.js';
import G_S_LCH   from './odinStyles/linestring-styles/G_S_LCH.js';
import G_S_LCM   from './odinStyles/linestring-styles/G_S_LCM.js';
import G_T_A     from './odinStyles/linestring-styles/G_T_A.js';
import G_T_AS    from './odinStyles/linestring-styles/G_T_AS.js';
import G_T_F     from './odinStyles/linestring-styles/G_T_F.js';
import lineLabelRegistry from './odinStyles/linestring-styles/labels.js';
import linePlacement from './odinStyles/linestring-styles/placement.js';

// Polygon styles
import G_G_GAF   from './odinStyles/polygon-styles/G_G_GAF.js';
import G_G_PY    from './odinStyles/polygon-styles/G_G_PY.js';
import G_G_SAE   from './odinStyles/polygon-styles/G_G_SAE.js';
import G_M_OGB   from './odinStyles/polygon-styles/G_M_OGB.js';
import G_M_OGF   from './odinStyles/polygon-styles/G_M_OGF.js';
import G_M_OGR   from './odinStyles/polygon-styles/G_M_OGR.js';
import G_M_SP    from './odinStyles/polygon-styles/G_M_SP.js';

// Multipoint styles
import G_F_AXC   from './odinStyles/multipoint-styles/G_F_AXC.js';
import G_G_DLP   from './odinStyles/multipoint-styles/G_G_DLP.js';
import G_G_OAS   from './odinStyles/multipoint-styles/G_G_OAS.js';
import G_M_NM    from './odinStyles/multipoint-styles/G_M_NM.js';
import G_T_E     from './odinStyles/multipoint-styles/G_T_E.js';
import G_T_O     from './odinStyles/multipoint-styles/G_T_O.js';
import G_T_Q     from './odinStyles/multipoint-styles/G_T_Q.js';
import G_T_S     from './odinStyles/multipoint-styles/G_T_S.js';
import G_T_Ux    from './odinStyles/multipoint-styles/G_T_Ux.js';
// Corridor / composite tactical graphics (axis of advance, breach, ambush, …)
import corridorStyles from './odinStyles/corridor-styles/index.js';

type StyleFn = (ctx: any) => any[];

const { DEFAULT: _corridorDefault, ERROR: _corridorError, ...CORRIDOR_REGISTRY } =
  corridorStyles as Record<string, StyleFn>;

// ---------------------------------------------------------------------------
// SIDC normalization — matches Odin's parameterize()
// Input:  'G*TAAA----' (15-char or any length)
// Output: 'G*T*AA----'  (10-char key matching the style index)
// ---------------------------------------------------------------------------
export function parameterizeSidc(sidc: string): string {
  if (!sidc || sidc.length < 10) return '';
  // positions: 0 schema, 1 affiliation(*), 2 battle-dimension, 3 status(*), 4-9 function-id (6 chars)
  return `${sidc[0]}*${sidc[2]}*${sidc.substring(4, 10)}`;
}

// ---------------------------------------------------------------------------
// Style registry — corridor-styles + linestring + polygon + multipoint (Odin parity)
// ---------------------------------------------------------------------------

const FILL_HATCH: StyleFn    = ({ geometry }) => [{ id: 'style:2525c/hatch-fill', geometry }];

const circleStyle = (id: string): StyleFn => ({ TS: ts, geometry }) => {
  const [C, A] = ts.coordinates(geometry);
  const seg = ts.segment([C, A]);
  const buffer = ts.pointBuffer(ts.point(C))(seg.getLength());
  return [{ id, geometry: buffer }];
};

const CIRCLE        = circleStyle('style:2525c/default-stroke');
const FILLED_CIRCLE = circleStyle('style:2525c/hatch-fill');

const fanLike = (label: string | null): StyleFn => G_T_Ux(label);

const STYLE_REGISTRY: Record<string, StyleFn> = {
  ...CORRIDOR_REGISTRY,
  // --- LineString ---
  'G*F*LT----': G_F_LT,
  'G*F*LTF---': G_F_LT,
  'G*F*LTS---': G_F_LT,
  'G*G*GLC---': G_G_GLC,
  'G*G*GLF---': G_G_GLF,
  'G*G*OLKA--': G_G_OLKA,
  'G*G*OLKGM-': G_G_OLKGM,
  'G*G*OLKGS-': G_G_OLKGS,
  'G*G*PF----': G_G_PF,
  'G*M*BCF---': G_M_BCF,
  'G*M*BCL---': G_M_BCL,
  'G*M*BCR---': G_M_BCR,
  'G*M*OADC--': G_M_OADC,
  'G*M*OADU--': G_M_OADU,
  'G*M*OAR---': G_M_OAR,
  'G*M*OAW---': G_M_OAW,
  'G*M*OEF---': G_M_OEF,
  'G*M*OGL---': G_M_OGL,
  'G*M*OMC---': G_M_OMC,
  'G*M*OS----': G_M_OS,
  'G*M*OWA---': G_M_OWA,
  'G*M*OWCD--': G_M_OWCD,
  'G*M*OWCS--': G_M_OWCS,
  'G*M*OWCT--': G_M_OWCT,
  'G*M*OWD---': G_M_OWD,
  'G*M*OWH---': G_M_OWH,
  'G*M*OWL---': G_M_OWL,
  'G*M*OWS---': G_M_OWS,
  'G*M*OWU---': G_M_OWU,
  'G*M*SL----': G_M_SL,
  'G*M*SW----': G_M_SW,
  'G*O*HN----': G_O_HN,
  'G*S*LCH---': G_S_LCH,
  'G*S*LCM---': G_S_LCM,
  'G*T*A-----': G_T_A,
  'G*T*AS----': G_T_AS,
  'G*T*F-----': G_T_F,

  // --- Polygon ---
  'G*G*GAF---': G_G_GAF,
  'G*G*PY----': G_G_PY,
  'G*G*SAE---': G_G_SAE,
  'G*M*OGB---': G_M_OGB,
  'G*M*OGF---': G_M_OGF,
  'G*M*OGR---': G_M_OGR,
  'G*M*OGZ---': G_M_OGB,
  'G*M*SP----': G_M_SP,
  'G*F*ACNI--': FILL_HATCH,
  'G*F*ACNR--': FILL_HATCH,
  'G*F*AKBI--': FILL_HATCH,
  'G*F*AKBR--': FILL_HATCH,
  'G*F*AKPI--': FILL_HATCH,
  'G*F*AKPR--': FILL_HATCH,
  'G*G*AAW---': FILL_HATCH,
  'G*G*GAY---': FILL_HATCH,
  'G*M*NB----': FILL_HATCH,
  'G*M*NC----': FILL_HATCH,
  'G*M*NR----': FILL_HATCH,

  // --- Multipoint / Fan ---
  'G*F*AXC---': G_F_AXC,
  'G*G*DLP---': G_G_DLP,
  'G*G*OAS---': G_G_OAS,
  'G*M*NM----': G_M_NM,
  'G*T*E-----': G_T_E,
  'G*T*O-----': G_T_O,
  'G*T*Q-----': G_T_Q,
  'G*T*S-----': G_T_S,
  'G*T*US----': fanLike('"S"'),
  'G*T*UG----': fanLike('"G"'),
  'G*T*UC----': fanLike('"C"'),
  'G*G*GAS---': fanLike(null),

  // --- Circle (2-point: center + edge) ---
  'G*F*ATC---': CIRCLE,
  'G*F*ACSC--': CIRCLE,
  'G*F*ACAC--': CIRCLE,
  'G*F*ACFC--': CIRCLE,
  'G*F*ACNC--': FILLED_CIRCLE,
  'G*F*ACRC--': CIRCLE,
  'G*F*ACPC--': CIRCLE,
  'G*F*ACEC--': CIRCLE,
  'G*F*ACDC--': CIRCLE,
  'G*F*ACZC--': CIRCLE,
  'G*F*ACBC--': CIRCLE,
  'G*F*ACVC--': CIRCLE,
  'G*F*AKBC--': FILLED_CIRCLE,
  'G*F*AKPC--': FILLED_CIRCLE,
};

type StyleSource = 'corridor' | 'line' | 'polygon' | 'multipoint' | 'merged';

const LINE_STYLE_KEYS = new Set<string>([
  'G*F*LT----',
  'G*F*LTF---',
  'G*F*LTS---',
  'G*G*GLC---',
  'G*G*GLF---',
  'G*G*OLKA--',
  'G*G*OLKGM-',
  'G*G*OLKGS-',
  'G*G*PF----',
  'G*M*BCF---',
  'G*M*BCL---',
  'G*M*BCR---',
  'G*M*OADC--',
  'G*M*OADU--',
  'G*M*OAR---',
  'G*M*OAW---',
  'G*M*OEF---',
  'G*M*OGL---',
  'G*M*OMC---',
  'G*M*OS----',
  'G*M*OWA---',
  'G*M*OWCD--',
  'G*M*OWCS--',
  'G*M*OWCT--',
  'G*M*OWD---',
  'G*M*OWH---',
  'G*M*OWL---',
  'G*M*OWS---',
  'G*M*OWU---',
  'G*M*SL----',
  'G*M*SW----',
  'G*O*HN----',
  'G*S*LCH---',
  'G*S*LCM---',
  'G*T*A-----',
  'G*T*AS----',
  'G*T*F-----',
]);

const POLYGON_STYLE_KEYS = new Set<string>([
  'G*G*GAF---',
  'G*G*PY----',
  'G*G*SAE---',
  'G*M*OGB---',
  'G*M*OGF---',
  'G*M*OGR---',
  'G*M*OGZ---',
  'G*M*SP----',
  'G*F*ACNI--',
  'G*F*ACNR--',
  'G*F*AKBI--',
  'G*F*AKBR--',
  'G*F*AKPI--',
  'G*F*AKPR--',
  'G*G*AAW---',
  'G*G*GAY---',
  'G*M*NB----',
  'G*M*NC----',
  'G*M*NR----',
]);

const MULTIPOINT_STYLE_KEYS = new Set<string>([
  'G*F*AXC---',
  'G*G*DLP---',
  'G*G*OAS---',
  'G*M*NM----',
  'G*T*E-----',
  'G*T*O-----',
  'G*T*Q-----',
  'G*T*S-----',
  'G*T*US----',
  'G*T*UG----',
  'G*T*UC----',
  'G*G*GAS---',
  'G*F*ATC---',
  'G*F*ACSC--',
  'G*F*ACAC--',
  'G*F*ACFC--',
  'G*F*ACNC--',
  'G*F*ACRC--',
  'G*F*ACPC--',
  'G*F*ACEC--',
  'G*F*ACDC--',
  'G*F*ACZC--',
  'G*F*ACBC--',
  'G*F*ACVC--',
  'G*F*AKBC--',
  'G*F*AKPC--',
]);

function buildSidcLookupCandidates(paramSidc: string): string[] {
  if (!paramSidc) return [];

  const candidates: string[] = [];
  const push = (value: string | null | undefined) => {
    if (!value || candidates.includes(value)) return;
    candidates.push(value);
  };

  push(paramSidc);

  for (let i = paramSidc.length - 1; i >= 4; i -= 1) {
    const char = paramSidc[i];
    if (char === '*' || char === '-') continue;
    push(`${paramSidc.slice(0, i)}${'-'.repeat(paramSidc.length - i)}`);
  }

  return candidates;
}

function getPreferredStyleSources(jtsGeom: any): StyleSource[] {
  const geometryType = jtsGeom?.getGeometryType?.();
  switch (geometryType) {
    case 'GeometryCollection':
      return ['corridor', 'multipoint', 'line', 'polygon', 'merged'];
    case 'MultiPoint':
      return ['multipoint', 'corridor', 'merged'];
    case 'Point':
      return ['multipoint', 'merged'];
    case 'LineString':
    case 'LinearRing':
    case 'MultiLineString':
      return ['line', 'corridor', 'merged'];
    case 'Polygon':
    case 'MultiPolygon':
      return ['polygon', 'multipoint', 'merged'];
    default:
      return ['corridor', 'line', 'polygon', 'multipoint', 'merged'];
  }
}

function getStyleFnFromSource(source: StyleSource, key: string): StyleFn | null {
  switch (source) {
    case 'corridor':
      return (CORRIDOR_REGISTRY as Record<string, StyleFn>)[key] ?? null;
    case 'line':
      return LINE_STYLE_KEYS.has(key) ? STYLE_REGISTRY[key] : null;
    case 'polygon':
      return POLYGON_STYLE_KEYS.has(key) ? STYLE_REGISTRY[key] : null;
    case 'multipoint':
      return MULTIPOINT_STYLE_KEYS.has(key) ? STYLE_REGISTRY[key] : null;
    case 'merged':
      return STYLE_REGISTRY[key] ?? null;
    default:
      return null;
  }
}

function normalizeCorridorGeometry(jtsGeom: any, resolution: number): any {
  if (!jtsGeom?.getGeometryType) return jtsGeom;

  const type = jtsGeom.getGeometryType();
  let lineString: any | null = null;
  let point: any | null = null;

  if (type === 'GeometryCollection') {
    const parts = TS.geometries(jtsGeom);
    lineString = parts.find((geom: any) => geom?.getGeometryType?.() === 'LineString') ?? null;
    point = parts.find((geom: any) => geom?.getGeometryType?.() === 'Point') ?? null;
  } else if (type === 'LineString') {
    lineString = jtsGeom;
  } else {
    return jtsGeom;
  }

  if (lineString && point) {
    return TS.collect([lineString, point]);
  }

  if (!lineString) return jtsGeom;

  const segments = TS.segments(lineString);
  if (!segments.length) return jtsGeom;

  const minLength = Math.min(...segments.map((segment: any) => segment.getLength()));
  const width = Math.min(minLength / 2, resolution * 50);
  const start = TS.coordinate(TS.startPoint(lineString));
  const angle = segments[0].angle() - TS.PI_OVER_2;
  const pointCoord = TS.projectCoordinate(start)([angle, width / 2]);
  const generatedPoint = TS.point(pointCoord);

  return TS.collect([lineString, generatedPoint]);
}

function prepareGeometryForSource(source: StyleSource, jtsGeom: any, resolution: number): any {
  if (source === 'corridor') {
    return normalizeCorridorGeometry(jtsGeom, resolution);
  }
  return jtsGeom;
}

export type StyleDescriptor = {
  id: string;
  geometry: any;      // jsts Geometry
  [key: string]: any; // extra style props (text, shape, etc.)
};

type LabelSpec = Record<string, any>;

const ECHELON_TEXT: Record<string, string> = {
  A: '(+)',
  B: 'o',
  C: 'oo',
  D: 'ooo',
  E: '|',
  F: '||',
  G: '|||',
  H: 'X',
  I: 'XX',
  J: 'XXX',
  K: 'XXXX',
  L: 'XXXXX',
  M: 'XXXXXX',
  N: '++',
};

function flattenSpecs(input: any): LabelSpec[] {
  if (!Array.isArray(input)) return input && typeof input === 'object' ? [input] : [];
  return input.flatMap((entry) => flattenSpecs(entry));
}

function getEchelonText(sidc: string): string {
  if (!sidc || sidc.length < 12) return '';
  return ECHELON_TEXT[sidc[11]] ?? '';
}

function normalizeModifierContext(input: Record<string, any> = {}): Record<string, any> {
  const modifiers =
    input.modifiers && typeof input.modifiers === 'object'
      ? (input.modifiers as Record<string, any>)
      : {};

  return {
    ...input,
    ...modifiers,
  };
}

function stringifyLabelValue(value: unknown): string | null {
  if (value === null || value === undefined || value === false) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function evaluateTextField(
  textField: unknown,
  context: { modifiers: Record<string, any>; echelon: string },
): string | null {
  if (Array.isArray(textField)) {
    const lines = textField
      .map((entry) => evaluateTextField(entry, context))
      .filter((entry): entry is string => !!entry);
    return lines.length > 0 ? lines.join('\n') : null;
  }

  if (typeof textField !== 'string') {
    return stringifyLabelValue(textField);
  }

  const expression = textField.trim();
  if (!expression) return null;

  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(expression)) {
    if (expression === 'echelon') return stringifyLabelValue(context.echelon);
    return stringifyLabelValue(context.modifiers[expression]);
  }

  try {
    const evaluator = new Function(
      'modifiers',
      'echelon',
      `return (${expression});`,
    ) as (modifiers: Record<string, any>, echelon: string) => unknown;
    return stringifyLabelValue(evaluator(context.modifiers, context.echelon));
  } catch {
    const fallbackKey = expression.replace(/^modifiers\./, '');
    return stringifyLabelValue(context.modifiers[fallbackKey]);
  }
}

function evaluateLabelSpecs(
  specs: LabelSpec[],
  context: { modifiers: Record<string, any>; echelon: string },
): StyleDescriptor[] {
  return specs.reduce<StyleDescriptor[]>((acc, spec) => {
    if (!spec || typeof spec !== 'object') return acc;
    if (!Object.prototype.hasOwnProperty.call(spec, 'text-field')) {
      acc.push(spec as StyleDescriptor);
      return acc;
    }

    const resolvedText = evaluateTextField(spec['text-field'], context);
    if (!resolvedText) return acc;

    acc.push({
      ...(spec as StyleDescriptor),
      'text-field': resolvedText,
    });
    return acc;
  }, []);
}

function getLinePlacementGeometry(jtsGeom: any): any {
  const geometryType = jtsGeom?.getGeometryType?.();
  if (geometryType !== 'MultiLineString') return jtsGeom;
  if (typeof jtsGeom.getNumGeometries !== 'function' || jtsGeom.getNumGeometries() === 0) {
    return jtsGeom;
  }

  let longest = jtsGeom.getGeometryN(0);
  for (let i = 1; i < jtsGeom.getNumGeometries(); i++) {
    const candidate = jtsGeom.getGeometryN(i);
    if ((candidate?.getLength?.() ?? 0) > (longest?.getLength?.() ?? 0)) {
      longest = candidate;
    }
  }
  return longest;
}

function computeLineLabelDescriptors(
  paramSidc: string,
  sidc: string,
  jtsGeom: any,
  contextInput: Record<string, any>,
): StyleDescriptor[] {
  const rawSpecs = flattenSpecs((lineLabelRegistry as Record<string, any>)[paramSidc] ?? []);
  if (rawSpecs.length === 0) return [];

  try {
    const placementGeometry = getLinePlacementGeometry(jtsGeom);
    const placedSpecs = flattenSpecs(linePlacement(placementGeometry)(rawSpecs));
    return evaluateLabelSpecs(placedSpecs, {
      modifiers: normalizeModifierContext(contextInput),
      echelon: getEchelonText(sidc),
    });
  } catch (err) {
    console.warn(`[tacticalStyles] line label placement failed for ${paramSidc}:`, err);
    return [];
  }
}

/**
 * Look up and call the Odin style function for a given parameterized SIDC.
 *
 * @param paramSidc  Parameterized SIDC (from parameterizeSidc())
 * @param jtsGeom    jsts geometry in EPSG:3857 (meters)
 * @param resolution Map resolution in m/px (default: 30 ≈ zoom-12 tactical view)
 */
const DEFAULT_STYLE: StyleFn = ({ geometry }) => [{ id: 'style:2525c/default-stroke', geometry }];

type ResolvedStyleDescriptors = {
  descriptors: StyleDescriptor[];
  source: StyleSource;
  matchedKey: string;
  geometry: any;
};

export function computeStyleDescriptors(
  paramSidc: string,
  jtsGeom: any,
  resolution = 30,
): ResolvedStyleDescriptors | null {
  const candidates = buildSidcLookupCandidates(paramSidc);
  const sources = getPreferredStyleSources(jtsGeom);

  for (const candidate of candidates) {
    for (const source of sources) {
      const fn = getStyleFnFromSource(source, candidate);
      if (!fn) continue;

      const preparedGeometry = prepareGeometryForSource(source, jtsGeom, resolution);

      try {
        const ctx = {
          TS,
          geometry: preparedGeometry,
          resolution,
          PI: Math.PI,
          PI_OVER_2: Math.PI / 2,
          PI_OVER_3: Math.PI / 3,
          DEG2RAD: Math.PI / 180,
          read: (g: any) => g,
        };

        return {
          descriptors: fn(ctx) as StyleDescriptor[],
          source,
          matchedKey: candidate,
          geometry: preparedGeometry,
        };
      } catch (err) {
        console.warn(`[tacticalStyles] style function failed for ${candidate} via ${source}:`, err);
      }
    }
  }

  try {
    return {
      descriptors: DEFAULT_STYLE({ geometry: jtsGeom }),
      source: 'merged',
      matchedKey: paramSidc,
      geometry: jtsGeom,
    };
  } catch {
    return null;
  }
}

export function computeTacticalDescriptors(
  paramSidc: string,
  sidc: string,
  jtsGeom: any,
  resolution = 30,
  contextInput: Record<string, any> = {},
): StyleDescriptor[] | null {
  const resolved = computeStyleDescriptors(paramSidc, jtsGeom, resolution);
  if (!resolved || resolved.descriptors.length === 0) return resolved?.descriptors ?? null;

  const geometryType = resolved.geometry?.getGeometryType?.();
  if (
    resolved.source !== 'line' ||
    (geometryType !== 'LineString' && geometryType !== 'LinearRing' && geometryType !== 'MultiLineString')
  ) {
    return resolved.descriptors;
  }

  const labelDescriptors = computeLineLabelDescriptors(resolved.matchedKey, sidc, resolved.geometry, contextInput);
  return [...resolved.descriptors, ...labelDescriptors];
}
