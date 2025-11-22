import Signal from '@syncpoint/signal'
<<<<<<< Updated upstream
import styles from './corridor-styles/index'
=======
>>>>>>> Stashed changes
import graphics from './graphics'

import _context from './_context'
import _shape from './_shape'
import _selection from './_selection'

<<<<<<< Updated upstream
const specifics = $ => {
=======
// Note: این فایل‌ها باید از corridor-styles import شوند
// برای حالا placeholder ایجاد می‌کنیم
const styles: Record<string, any> = {}

const specifics = ($: any) => {
>>>>>>> Stashed changes
  $.context = Signal.link(_context, [$.jtsGeometry, $.resolution])
  $.shape = $.context.ap($.parameterizedSIDC.map(_shape(styles)))
  $.selection = Signal.link(_selection, [$.selectionMode, $.jtsGeometry])
  $.labels = Signal.of([])
}

export default graphics(specifics)
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
