import skkm from './skkm.json'

<<<<<<< Updated upstream
const parameterized = sidc => sidc
  ? `${sidc[0]}*${sidc[2]}*${sidc.substring(4, 10)}`
  : null

export const symbols = skkm.reduce((acc, descriptor) => {
  const sidc = parameterized(descriptor.sidc)
  acc[sidc] = {
    parameterized: sidc,
    sidc: descriptor.sidc,
    class: descriptor.class,
    hierarchy: descriptor.hierarchy,
    dimensions: [],
    scope: 'SKKM',
    geometry: { type: 'Point' }
  }
  return acc
}, {})
=======
const parameterized = (sidc: string | null | undefined) => sidc
  ? `${sidc[0]}*${sidc[2]}*${sidc.substring(4, 10)}`
  : null

export const symbols = (skkm as any[]).reduce((acc: any, descriptor: any) => {
  const sidc = parameterized(descriptor.sidc)
  if (sidc) {
    acc[sidc] = {
      parameterized: sidc,
      sidc: descriptor.sidc,
      class: descriptor.class,
      hierarchy: descriptor.hierarchy,
      dimensions: [],
      scope: 'SKKM',
      geometry: { type: 'Point' }
    }
  }
  return acc
}, {} as Record<string, any>)

>>>>>>> Stashed changes
