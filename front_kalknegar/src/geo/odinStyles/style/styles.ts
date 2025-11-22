import * as R from 'ramda'
import { parameterized } from '../symbology/2525c'
import Signal from '@syncpoint/signal'
import * as Geometry from '../geometry'
import styleRegistry from './styleRegistry'
import symbol from './symbol'
import polygon from './polygon'
import linestring from './linestring'
import multipoint from './multipoint'
import corridor from './corridor'
import marker from './marker'
import measure from './measure'
import fallback from './fallback'
import { styleFactory } from './styleFactory'
<<<<<<< Updated upstream
import * as ID from '../ids'
=======
>>>>>>> Stashed changes

import _colorScheme from './_colorScheme'
import _schemeStyle from './_schemeStyle'
import _effectiveStyle from './_effectiveStyle'

<<<<<<< Updated upstream
export default feature => {
  const { $ } = feature

  $.sidc = $.properties.map(R.prop('sidc'))
=======
// Note: ID helper functions - باید از ids import شوند
const isMarkerId = (id: string | number | undefined): boolean => {
  if (!id || typeof id !== 'string') return false
  return id.startsWith('marker:')
}

const isMeasureId = (id: string | number | undefined): boolean => {
  if (!id || typeof id !== 'string') return false
  return id.startsWith('measure:')
}

export default (feature: any) => {
  const { $ } = feature

  $.sidc = $.properties.map((props: any) => R.prop('sidc', props))
>>>>>>> Stashed changes
  $.parameterizedSIDC = $.sidc.map(parameterized)
  $.colorScheme = Signal.link(_colorScheme, [$.globalStyle, $.layerStyle, $.featureStyle])
  $.schemeStyle = Signal.link(_schemeStyle, [$.sidc, $.colorScheme])
  $.effectiveStyle = Signal.link(_effectiveStyle, [$.globalStyle, $.schemeStyle, $.layerStyle, $.featureStyle])
  $.styleRegistry = $.effectiveStyle
    .map(styleRegistry)
<<<<<<< Updated upstream
    .map(fn => xs => xs.map(fn))
  $.styleFactory = Signal.of(xs => xs.flatMap(styleFactory))
=======
    .map((fn: any) => (xs: any[]) => xs.map(fn))
  $.styleFactory = Signal.of((xs: any[]) => xs.flatMap(styleFactory))
>>>>>>> Stashed changes

  const featureId = feature.getId()
  const geometryType = Geometry.geometryType(feature.getGeometry())

<<<<<<< Updated upstream
  if (ID.isMarkerId(featureId)) return marker($)
  else if (ID.isMeasureId(featureId)) return measure($)
=======
  if (isMarkerId(featureId)) return marker($)
  else if (isMeasureId(featureId)) return measure($)
>>>>>>> Stashed changes
  else if (geometryType === 'Point') return symbol($)
  else if (geometryType === 'Polygon') return polygon($)
  else if (geometryType === 'LineString') return linestring($)
  else if (geometryType === 'MultiPoint') return multipoint($)
  else if (geometryType === 'LineString:Point') return corridor($)
  else return fallback($)
}
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
