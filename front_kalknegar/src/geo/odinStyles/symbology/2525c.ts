import * as R from 'ramda'
import data from './2525c.json'
import * as skkm from './skkm'

<<<<<<< Updated upstream
/* eslint-disable no-unused-vars */
=======
>>>>>>> Stashed changes
const SCHEMA = 0
const IDENTITY = 1 // a.k.a Standard Identity
const BATTLE_DIMENSION = 2
const STATUS = 3
const FUNCTION_ID = 4
const MODIFIER = 10
const MOBILITY = 10
const INSTALLATION = 10
const ECHELON = 11
<<<<<<< Updated upstream
/* eslint-enable no-unused-vars */

// E.g. 'GFGPOAO----****' (15) => 'G*G*OAO---' (10)
export const parameterized = sidc => sidc
  ? `${sidc[0]}*${sidc[2]}*${sidc.substring(4, 10)}`
  : null

export const schemaCode = sidc => sidc
  ? sidc[SCHEMA]
  : null

export const battleDimensionCode = sidc => sidc
=======

// E.g. 'GFGPOAO----****' (15) => 'G*G*OAO---' (10)
export const parameterized = (sidc: string | null | undefined): string | null => sidc
  ? `${sidc[0]}*${sidc[2]}*${sidc.substring(4, 10)}`
  : null

export const schemaCode = (sidc: string | null | undefined): string | null => sidc
  ? sidc[SCHEMA]
  : null

export const battleDimensionCode = (sidc: string | null | undefined): string | null => sidc
>>>>>>> Stashed changes
  ? sidc[BATTLE_DIMENSION]
  : null

// Standard Identity (ex. Affiliation)
<<<<<<< Updated upstream
export const identityCode = sidc => sidc
=======
export const identityCode = (sidc: string | null | undefined): string => sidc
>>>>>>> Stashed changes
  ? sidc[IDENTITY]
  : 'U'

// status or P - PRESENT
<<<<<<< Updated upstream
export const statusCode = sidc => sidc
  ? sidc[STATUS]
  : 'P'

export const functionIdCode = sidc => sidc
  ? sidc.substring(FUNCTION_ID, FUNCTION_ID + 6)
  : null

export const modifierCode = sidc => sidc
  ? sidc[MODIFIER]
  : '-'

export const echelonCode = sidc => sidc
  ? sidc[ECHELON]
  : '-'

export const mobilityCode = sidc => sidc
  ? sidc[MOBILITY] + sidc[MOBILITY + 1]
  : '--'

export const format = (sidc, options) => {
=======
export const statusCode = (sidc: string | null | undefined): string => sidc
  ? sidc[STATUS]
  : 'P'

export const functionIdCode = (sidc: string | null | undefined): string | null => sidc
  ? sidc.substring(FUNCTION_ID, FUNCTION_ID + 6)
  : null

export const modifierCode = (sidc: string | null | undefined): string => sidc
  ? sidc[MODIFIER]
  : '-'

export const echelonCode = (sidc: string | null | undefined): string => sidc
  ? sidc[ECHELON]
  : '-'

export const mobilityCode = (sidc: string | null | undefined): string => sidc
  ? sidc[MOBILITY] + sidc[MOBILITY + 1]
  : '--'

export interface FormatOptions {
  schema?: string
  identity?: string
  battleDimension?: string
  status?: string
  modifier?: string
  echelon?: string
  mobility?: string
  functionId?: string
}

export const format = (sidc: string | null | undefined, options: FormatOptions): string | null => {
>>>>>>> Stashed changes
  if (!sidc) return null

  let formatted = sidc
  if (options.schema) formatted = options.schema + formatted.substring(SCHEMA + 1)
  if (options.identity) formatted = formatted.substring(0, IDENTITY) + options.identity + formatted.substring(IDENTITY + 1)
  if (options.battleDimension) formatted = formatted.substring(0, BATTLE_DIMENSION) + options.battleDimension + formatted.substring(BATTLE_DIMENSION + 1)
  if (options.status) formatted = formatted.substring(0, STATUS) + options.status + formatted.substring(STATUS + 1)
  if (options.modifier) formatted = formatted.substring(0, MODIFIER) + options.modifier + formatted.substring(MODIFIER + 1)
  if (options.echelon) formatted = formatted.substring(0, ECHELON) + options.echelon + formatted.substring(ECHELON + 1)
  if (options.mobility) formatted = formatted.substring(0, MOBILITY) + options.mobility + formatted.substring(MOBILITY + 2)
  if (options.functionId) formatted = formatted.substring(0, FUNCTION_ID) + options.functionId + formatted.substring(FUNCTION_ID + 6)
  return formatted
}

<<<<<<< Updated upstream
export const MODIFIERS = {
=======
export const MODIFIERS: Record<string, string> = {
>>>>>>> Stashed changes
  aa: 'specialHeadquarters',
  ad: 'platformType',
  ae: 'equipmentTeardownTime',
  af: 'commonIdentifier',
  ah: 'headquartersElement',
  ao: 'engagementBar',
  ap: 'targetNumber',
  aq: 'guardedUnit',
  ar: 'specialDesignator',
  c: 'quantity', // also modifier R
  f: 'reinforcedReduced',
  j: 'evaluationRating',
  k: 'combatEffectiveness',
  g: 'staffComments',
  h: 'additionalInformation',
  m: 'higherFormation',
  n: 'hostile',
  p: 'iffSif',
  q: 'direction',
  r: 'quantity', // also modifier C
  t: 'uniqueDesignation',
  v: 'type',
  x: 'altitudeDepth',
  y: 'location',
  z: 'speed',
  w: 'dtg'
}

/**
 * 2525-C only
 */
<<<<<<< Updated upstream
export const symbols = data
  .filter(({ unsupported }) => !unsupported)
  .reduce((acc, descriptor) => {
    const sidc = parameterized(descriptor.sidc)
    const dimensions = descriptor.dimensions
      ? descriptor.dimensions.split(',').map(s => s.trim()).filter(R.identity)
=======
export const symbols = (data as any[])
  .filter(({ unsupported }: any) => !unsupported)
  .reduce((acc: any, descriptor: any) => {
    const sidc = parameterized(descriptor.sidc)
    if (!sidc) return acc
    
    const dimensions = descriptor.dimensions
      ? descriptor.dimensions.split(',').map((s: string) => s.trim()).filter(R.identity)
>>>>>>> Stashed changes
      : []

    acc[sidc] = {
      parameterized: sidc,
      sidc: descriptor.sidc,
      hierarchy: descriptor.hierarchy,
      scope: descriptor.scope,
      dimensions,
      // combine type and optional parameters under `geometry`:
      geometry: {
        type: descriptor.geometry,
        ...descriptor.parameters
      }
    }

    return acc
<<<<<<< Updated upstream
  }, {})
=======
  }, {} as Record<string, any>)
>>>>>>> Stashed changes

/**
 * 2525-C + SKKM
 */
<<<<<<< Updated upstream
export const descriptors = Object.entries(skkm.symbols).reduce((acc, [k, v]) => {
=======
export const descriptors = Object.entries(skkm.symbols).reduce((acc: any, [k, v]) => {
>>>>>>> Stashed changes
  acc[k] = v
  return acc
}, { ...symbols })

<<<<<<< Updated upstream
export const descriptor = sidc => {
  if (!sidc) return
  return descriptors[parameterized(sidc)]
}

export const geometry = sidc => {
  if (!sidc) return
  const descriptor = descriptors[parameterized(sidc)]
  return descriptor && descriptor.geometry
}

export const geometryType = sidc => {
  if (!sidc) return
  const descriptor = descriptors[parameterized(sidc)]
  return descriptor && descriptor.geometry && descriptor.geometry.type
}

export const className = sidc => {
  if (!sidc) return
  const descriptor = descriptors[parameterized(sidc)]
  if (!descriptor) return

  if (descriptor.scope === 'UNIT') return 'UNIT'
  else if (descriptor.scope === 'INSTALLATION') return 'INSTALLATION'
  else if (descriptor.scope === 'EQUIPMENT') return 'EQUIPMENT'
  else if (descriptor.scope === 'ACTIVITY') return 'ACTIVITY'
  else if (descriptor.scope === 'SKKM') return `SKKM/${descriptor.class}`
  // No geometry type defaults to POINT:
  else if (!descriptor.geometry) return 'POINT'
  else if (descriptor.geometry.type !== 'Point') {
    if (descriptor.parameterized === 'G*G*GLB---') return 'BOUNDARIES'
=======
export const descriptor = (sidc: string | null | undefined): any => {
  if (!sidc) return
  return descriptors[parameterized(sidc) || '']
}

export const geometry = (sidc: string | null | undefined): any => {
  if (!sidc) return
  const desc = descriptors[parameterized(sidc) || '']
  return desc && desc.geometry
}

export const geometryType = (sidc: string | null | undefined): string | null => {
  if (!sidc) return null
  const desc = descriptors[parameterized(sidc) || '']
  return desc && desc.geometry && desc.geometry.type
}

export const className = (sidc: string | null | undefined): string | null => {
  if (!sidc) return null
  const desc = descriptors[parameterized(sidc) || '']
  if (!desc) return null

  if (desc.scope === 'UNIT') return 'UNIT'
  else if (desc.scope === 'INSTALLATION') return 'INSTALLATION'
  else if (desc.scope === 'EQUIPMENT') return 'EQUIPMENT'
  else if (desc.scope === 'ACTIVITY') return 'ACTIVITY'
  else if (desc.scope === 'SKKM') return `SKKM/${desc.class}`
  // No geometry type defaults to POINT:
  else if (!desc.geometry) return 'POINT'
  else if (desc.geometry.type !== 'Point') {
    if (desc.parameterized === 'G*G*GLB---') return 'BOUNDARIES'
>>>>>>> Stashed changes
    else return 'GRAPHICS'
  } else return 'POINT'
}

<<<<<<< Updated upstream
export const specialization = sidc => {
  if (!sidc) return
  const descriptor = descriptors[parameterized(sidc)]
  if (!descriptor) return

  const { geometry } = descriptor
  if (descriptor.parameterized === 'G*G*GLB---') return 'BOUNDARIES'
  else if (geometry && geometry.layout === 'rectangle') return 'RECTANGLE'
  else if (geometry && geometry.layout === 'circle') return 'CIRCLE'
  else if (geometry && geometry.layout === 'corridor') return 'CORRIDOR'
  else return
}

// Default export for compatibility
export default {
  parameterized,
  schemaCode,
  battleDimensionCode,
  identityCode,
  statusCode,
  functionIdCode,
  modifierCode,
  echelonCode,
  mobilityCode,
  format,
  MODIFIERS,
  symbols,
  descriptors,
  descriptor,
  geometry,
  geometryType,
  className,
  specialization
}
=======
export const specialization = (sidc: string | null | undefined): string | null => {
  if (!sidc) return null
  const desc = descriptors[parameterized(sidc) || '']
  if (!desc) return null

  const { geometry } = desc
  if (desc.parameterized === 'G*G*GLB---') return 'BOUNDARIES'
  else if (geometry && geometry.layout === 'rectangle') return 'RECTANGLE'
  else if (geometry && geometry.layout === 'circle') return 'CIRCLE'
  else if (geometry && geometry.layout === 'corridor') return 'CORRIDOR'
  else return null
}

>>>>>>> Stashed changes
