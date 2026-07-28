import * as MILSTD from './symbology/2525c.js'

export const TAXONOMY_CATEGORIES = [
  { key: 'units', label: 'یگان‌ها و نیروها' },
  { key: 'equipment', label: 'تجهیزات و وسایل نقلیه' },
  { key: 'infrastructure', label: 'تأسیسات و زیرساخت‌ها' },
  { key: 'operations', label: 'عملیات و مأموریت‌ها' },
  { key: 'incidents', label: 'حوادث و تهدیدها' },
  { key: 'people', label: 'افراد و سازمان‌ها' },
  { key: 'general', label: 'علائم عمومی، فرماندهی و پشتیبانی' },
]

export const TAXONOMY_ENVIRONMENTS = [
  { key: 'land', label: 'زمینی' },
  { key: 'air', label: 'هوایی' },
  { key: 'surface', label: 'دریایی' },
  { key: 'subsurface', label: 'زیرسطحی' },
  { key: 'space', label: 'فضایی' },
  { key: 'joint', label: 'مشترک و عمومی' },
]

export const TAXONOMY_DRAWING_TYPES = [
  { key: 'point', label: 'نقطه‌ای' },
  { key: 'line', label: 'خطی' },
  { key: 'area', label: 'سطحی' },
]

export const TAXONOMY_STANDARDS = [
  { key: '2525c', label: 'MIL-STD-2525C' },
  { key: 'skkm', label: 'SKKM' },
]

const incidentPattern =
  /\b(incident|natural events?|hazardous|violent|criminal|civil disturbance|rape|damage|danger)\b/i
const peoplePattern =
  /\b(individual|nonmilitary group|non-military group|organization|terrorist)\b/i

const hierarchyText = (descriptor) =>
  Array.isArray(descriptor?.hierarchy) ? descriptor.hierarchy.join(' • ') : ''

export const classifyCategory = (descriptor) => {
  const hierarchy = hierarchyText(descriptor)
  const scope = String(descriptor?.scope || '').toUpperCase()

  // These semantic concepts take precedence over the broad MIL-STD scope.
  if (incidentPattern.test(hierarchy)) return 'incidents'
  if (peoplePattern.test(hierarchy)) return 'people'

  if (scope === 'UNIT') return 'units'
  if (scope === 'EQUIPMENT') return 'equipment'
  if (scope === 'INSTALLATION') return 'infrastructure'
  if (scope === 'ACTIVITY') return 'operations'

  if (/\binfrastructure\b/i.test(hierarchy)) return 'infrastructure'
  if (/\b(operations?|tasks?|psyop|activity)\b/i.test(hierarchy)) return 'operations'

  return 'general'
}

export const classifyEnvironment = (descriptor) => {
  const dimensions = Array.isArray(descriptor?.dimensions)
    ? descriptor.dimensions
    : String(descriptor?.dimensions || '').split(',')
  const normalized = dimensions.map((item) => item.trim().toUpperCase())

  if (normalized.includes('LAND')) return 'land'
  if (normalized.includes('AIR')) return 'air'
  if (normalized.includes('SURFACE') || normalized.includes('MARITIME')) return 'surface'
  if (normalized.includes('SUBSURFACE')) return 'subsurface'
  if (normalized.includes('SPACE')) return 'space'
  return 'joint'
}

export const classifyDrawingType = (descriptor) => {
  const geometryType = String(descriptor?.geometry?.type || 'Point').toLowerCase()
  if (geometryType.includes('polygon')) return 'area'
  if (geometryType.includes('line')) return 'line'
  return 'point'
}

export const classifyStandard = (descriptor) =>
  String(descriptor?.scope || '').toUpperCase() === 'SKKM' ? 'skkm' : '2525c'

export const descriptorForEntry = (entry) => {
  const sidc =
    entry?.sidc ||
    String(entry?.id || '')
      .replace(/^urn:symbol:/i, '')
      .replace(/^symbol:/i, '')
  return MILSTD.descriptor(sidc)
}

export const classifySymbolEntry = (entry) => {
  const descriptor = descriptorForEntry(entry) || {}
  return {
    category: classifyCategory(descriptor),
    environment: classifyEnvironment(descriptor),
    drawingType: classifyDrawingType(descriptor),
    standard: classifyStandard(descriptor),
  }
}
