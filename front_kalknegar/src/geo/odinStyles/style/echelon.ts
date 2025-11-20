import * as R from 'ramda'
import { echelonCode } from '../symbology/2525c'
<<<<<<< Updated upstream
import A from './resources/A.png'
import B from './resources/B.png'
import C from './resources/C.png'
import D from './resources/D.png'
import E from './resources/E.png'
import F from './resources/F.png'
import G from './resources/G.png'
import H from './resources/H.png'
import I from './resources/I.png'
import J from './resources/J.png'
import K from './resources/K.png'
import L from './resources/L.png'
import M from './resources/M.png'
import N from './resources/N.png'

export const echelons = {
  A: { width: 24, height: 25, url: A, text: '∅' },
  B: { width: 12, height: 12, url: B, text: '●' },
  C: { width: 26, height: 12, url: C, text: '●●' },
  D: { width: 40, height: 12, url: D, text: '●●●' },
  E: { width: 6, height: 29, url: E, text: '❙' },
  F: { width: 28, height: 29, url: F, text: ' ❙ ❙ ' },
  G: { width: 50, height: 29, url: G, text: ' ❙ ❙ ❙ ' },
  H: { width: 26, height: 29, url: H, text: 'X' },
  I: { width: 64, height: 29, url: I, text: 'X X' },
  J: { width: 101, height: 29, url: J, text: 'X X X' },
  K: { width: 138, height: 29, url: K, text: 'X X X X' },
  L: { width: 176, height: 29, url: L, text: 'X X X X X' },
  M: { width: 213, height: 29, url: M, text: 'X X X X X X' },
  N: { width: 65, height: 24, url: N, text: ' ＋＋ ' }
}

export default context => {
  const { sidc } = context
=======

// Note: در صورت نیاز می‌توانید تصاویر echelon را از ODINv2 کپی کنید
// برای حالا فقط متن استفاده می‌شود
export const echelons: Record<string, { width: number; height: number; url?: string; text: string }> = {
  A: { width: 24, height: 25, text: '∅' },
  B: { width: 12, height: 12, text: '●' },
  C: { width: 26, height: 12, text: '●●' },
  D: { width: 40, height: 12, text: '●●●' },
  E: { width: 6, height: 29, text: '❙' },
  F: { width: 28, height: 29, text: ' ❙ ❙ ' },
  G: { width: 50, height: 29, text: ' ❙ ❙ ❙ ' },
  H: { width: 26, height: 29, text: 'X' },
  I: { width: 64, height: 29, text: 'X X' },
  J: { width: 101, height: 29, text: 'X X X' },
  K: { width: 138, height: 29, text: 'X X X X' },
  L: { width: 176, height: 29, text: 'X X X X X' },
  M: { width: 213, height: 29, text: 'X X X X X X' },
  N: { width: 65, height: 24, text: ' ＋＋ ' }
}

export default (context: any) => {
  const { sidc } = context
  if (!sidc) return R.identity
  
>>>>>>> Stashed changes
  const code = echelonCode(sidc)
  const echelon = echelons[code]

  if (!echelon) return R.identity

<<<<<<< Updated upstream
  return props => {
=======
  return (props: any) => {
>>>>>>> Stashed changes
    const iconImage = props['icon-image']
    if (iconImage !== 'echelon') return props
    return {
      ...props,
      'icon-height': echelon.height,
      'icon-width': echelon.width,
      'icon-url': echelon.url,
      'icon-scale': 0.4
    }
  }
}
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
