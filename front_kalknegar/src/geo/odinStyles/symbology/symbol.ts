import { Symbol } from '@syncpoint/signs'
<<<<<<< Updated upstream
import * as MILSTD from '../symbology/2525c'

const defaultOptions = { size: 30 }

const format = sidc => sidc.match(/S.G.U/)
  ? sidc // // keep echelon for units
  : MILSTD.format(sidc, { echelon: '-' })

export const svg = (sidc, options = defaultOptions) => {
  if (!sidc) return null
  const symbol = new Symbol(format(sidc), options)
  return symbol.asSVG()
}

// Default export for compatibility
export default {
  svg,
  format
}
=======
import * as MILSTD from './2525c'

const defaultOptions = { size: 30 }

const format = (sidc: string | null | undefined): string | null => {
  if (!sidc) return null
  return sidc.match(/S.G.U/)
    ? sidc // keep echelon for units
    : MILSTD.format(sidc, { echelon: '-' })
}

export const svg = (sidc: string | null | undefined, options: any = defaultOptions): string | null => {
  if (!sidc) return null
  const formatted = format(sidc)
  if (!formatted) return null
  const symbol = new Symbol(formatted, options)
  return symbol.asSVG()
}

>>>>>>> Stashed changes
