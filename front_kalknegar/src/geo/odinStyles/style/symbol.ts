import * as R from 'ramda'
import Signal from '@syncpoint/signal'
import { MODIFIERS } from '../symbology/2525c'

<<<<<<< Updated upstream
/**
 *
 */
export default $ => {
  $.shape = $.properties.map(properties => {
    const sidc = properties.sidc
    const modifiers = Object.entries(properties)
      .filter(([key, value]) => MODIFIERS[key] && value)
      .reduce((acc, [key, value]) => R.tap(acc => (acc[MODIFIERS[key]] = value), acc), {})
=======
export default ($: any) => {
  $.shape = $.properties.map((properties: any) => {
    const sidc = properties.sidc
    const modifiers = Object.entries(properties)
      .filter(([key, value]) => MODIFIERS[key] && value)
      .reduce((acc: any, [key, value]) => R.tap((acc: any) => (acc[MODIFIERS[key]] = value), acc), {})
>>>>>>> Stashed changes

    return [{
      id: 'style:2525c/symbol',
      'symbol-code': sidc,
      'symbol-modifiers': modifiers
    }]
  }, [])

<<<<<<< Updated upstream
  $.selection = $.selectionMode.map(mode =>
=======
  $.selection = $.selectionMode.map((mode: string) =>
>>>>>>> Stashed changes
    mode === 'multiselect'
      ? [{ id: 'style:rectangle-handle' }]
      : []
  )

  $.styles = Signal.link(
<<<<<<< Updated upstream
    (...styles) => styles.reduce(R.concat),
=======
    (...styles: any[]) => styles.reduce(R.concat),
>>>>>>> Stashed changes
    [
      $.shape,
      $.selection
    ]
  )

  return $.styles
    .ap($.styleRegistry)
    .ap($.styleFactory)
}
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
