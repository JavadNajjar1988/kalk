import * as R from 'ramda'
import { echelonCode } from '../symbology/2525c'
import { echelons } from './echelon'
import { Jexl } from 'jexl'

const jexl = new Jexl()

<<<<<<< Updated upstream
/**
 *
 */
const evalSync = context => {
  const evalSync = textField => Array.isArray(textField)
    ? textField.map(evalSync).filter(Boolean).join('\n')
    : jexl.evalSync(textField, context)

  const replace = properties => {
    properties = Array.isArray(properties) ? properties : [properties]
    return properties.reduce((acc, spec) => {
      if (!spec['text-field']) acc.push(spec)
      else {
        const textField = evalSync(spec['text-field'])
=======
const evalSync = (context: any) => {
  const evalSyncFn = (textField: any): string => Array.isArray(textField)
    ? textField.map(evalSyncFn).filter(Boolean).join('\n')
    : jexl.evalSync(textField, context)

  const replace = (properties: any): any[] => {
    properties = Array.isArray(properties) ? properties : [properties]
    return properties.reduce((acc: any[], spec: any) => {
      if (!spec['text-field']) acc.push(spec)
      else {
        const textField = evalSyncFn(spec['text-field'])
>>>>>>> Stashed changes
        if (textField) acc.push({ ...spec, 'text-field': textField })
      }

      return acc
    }, [])
  }

  return R.chain(replace)
}

<<<<<<< Updated upstream
export default (sidc, props1, props2) => {
=======
export default (sidc: string | null, props1: any, props2: any): any => {
  if (!sidc) return R.identity
  
>>>>>>> Stashed changes
  const code = echelonCode(sidc)
  const echelon =
    (code === '*' || code === '-')
      ? ''
      : echelons[code]?.text

  return evalSync({
    modifiers: { ...props1, ...props2 },
    echelon
  })
}
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
