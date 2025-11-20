import * as R from 'ramda'

<<<<<<< Updated upstream
/**
 *
 */
export default styles => sidc => {
  const tryer = (styles[sidc] || styles.DEFAULT)
  const catcher = (_, context) => (styles.ERROR || styles.DEFAULT)(context)
  return R.tryCatch(tryer, catcher)
}
=======
export default (styles: any) => (sidc: string | null) => {
  if (!sidc) return R.always([])
  
  const tryer = (styles[sidc] || styles.DEFAULT)
  const catcher = (_: any, context: any) => (styles.ERROR || styles.DEFAULT)(context)
  return R.tryCatch(tryer, catcher)
}

>>>>>>> Stashed changes
