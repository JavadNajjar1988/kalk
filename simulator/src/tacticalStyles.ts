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

export type StyleDescriptor = {
  id: string;
  geometry: any;      // jsts Geometry
  [key: string]: any; // extra style props (text, shape, etc.)
};

/**
 * Look up and call the Odin style function for a given parameterized SIDC.
 *
 * @param paramSidc  Parameterized SIDC (from parameterizeSidc())
 * @param jtsGeom    jsts geometry in EPSG:3857 (meters)
 * @param resolution Map resolution in m/px (default: 30 ≈ zoom-12 tactical view)
 */
const DEFAULT_STYLE: StyleFn = ({ geometry }) => [{ id: 'style:2525c/default-stroke', geometry }];

export function computeStyleDescriptors(
  paramSidc: string,
  jtsGeom: any,
  resolution = 30,
): StyleDescriptor[] | null {
  const fn = STYLE_REGISTRY[paramSidc] ?? DEFAULT_STYLE;

  try {
    const ctx = {
      TS,
      geometry: jtsGeom,
      resolution,
      PI: Math.PI,
      PI_OVER_2: Math.PI / 2,
      PI_OVER_3: Math.PI / 3,
      // Odin passes a `read` function that converts internal geometry to jts.
      // Since we already supply a jts geometry, `read` is identity.
      read: (g: any) => g,
    };
    return fn(ctx) as StyleDescriptor[];
  } catch (err) {
    console.warn(`[tacticalStyles] style function failed for ${paramSidc}:`, err);
    // Last resort fallback: render geometry as-is
    return [{ id: 'style:2525c/default-stroke', geometry: jtsGeom }];
  }
}
