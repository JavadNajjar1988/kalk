import * as R from 'ramda'
import Signal from '@syncpoint/signal'
<<<<<<< Updated upstream
import { STYLES } from '../interaction/measure/style'
import { baseStyle } from '../interaction/measure/baseStyle'

export default $ => {
  $.geometryType = $.geometry.map(geometry => geometry.getType())
  $.selected = $.selectionMode.map(mode => mode !== 'default')
  $.baseStyle = $.selected.map(baseStyle)
  $.styleFN = $.geometryType.map(type => STYLES[type])
  $.geometryStyle = $.geometry.ap($.styleFN)

  return Signal.link(
    (...styles) => styles.reduce(R.concat),
    [
      $.baseStyle,
      $.geometryStyle
    ]
  )
}
=======

// Note: این فایل نیاز به STYLES و baseStyle دارد که در interaction/measure تعریف شده‌اند
// برای حالا یک نسخه ساده ایجاد می‌کنیم
export default ($: any) => {
  $.geometryType = $.geometry.map((geometry: any) => geometry.getType())
  $.selected = $.selectionMode.map((mode: string) => mode !== 'default')
  
  // Placeholder - باید از interaction/measure استفاده شود
  return Signal.of([])
}

>>>>>>> Stashed changes
