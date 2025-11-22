import * as Colors from './color-schemes'
import { identityCode, statusCode } from '../symbology/2525c'

<<<<<<< Updated upstream
/**
 *
 */
export default (sidc, colorScheme) => {
=======
export default (sidc: string | null, colorScheme: string): Record<string, any> => {
  if (!sidc) return {}
  
>>>>>>> Stashed changes
  const status = statusCode(sidc)
  const identity = identityCode(sidc)
  const simpleIdentity = identity === 'H' || identity === 'S'
    ? 'H'
    : '-'

  return {
    'binary-color': Colors.lineColor(colorScheme)(simpleIdentity), // black or red
    'line-color': Colors.lineColor(colorScheme)(identity),
    'fill-color': Colors.lineColor(colorScheme)(identity),
    'line-dash-array': status === 'A' ? [20, 10] : null,
    'line-halo-color': Colors.lineHaloColor(identity),
    'line-halo-dash-array': status === 'A' ? [20, 10] : null
  }
}
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
