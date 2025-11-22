import * as R from 'ramda'
import * as olStyle from 'ol/style'
<<<<<<< Updated upstream
import { PI_OVER_2, PI } from '../Math'
=======
import { PI_OVER_2, PI } from '../shared/Math'
>>>>>>> Stashed changes
import { Symbol } from '@syncpoint/signs'
import * as patterns from './patterns'

const Styles = {
<<<<<<< Updated upstream
  stroke: options => new olStyle.Stroke(options),
  fill: options => new olStyle.Fill(options),
  text: options => new olStyle.Text(options),
  circle: options => new olStyle.Circle(options),
  regularShape: options => new olStyle.RegularShape(options),
  icon: options => new olStyle.Icon(options),
  style: options => new olStyle.Style(options)
}

const TEXT_ALIGN = {
=======
  stroke: (options: any) => new olStyle.Stroke(options),
  fill: (options: any) => new olStyle.Fill(options),
  text: (options: any) => new olStyle.Text(options),
  circle: (options: any) => new olStyle.Circle(options),
  regularShape: (options: any) => new olStyle.RegularShape(options),
  icon: (options: any) => new olStyle.Icon(options),
  style: (options: any) => new olStyle.Style(options)
}

const TEXT_ALIGN: Record<string, string> = {
>>>>>>> Stashed changes
  start: 'end',
  end: 'start',
  left: 'right',
  right: 'left',
  center: 'center'
}

<<<<<<< Updated upstream
const makeStroke = props => {
=======
const makeStroke = (props: any) => {
>>>>>>> Stashed changes
  if (!props['line-width']) return null
  return Styles.stroke({
    color: props['line-color'],
    lineCap: props['line-cap'],
    lineJoin: props['line-join'],
    lineDash: props['line-dash-array'],
    width: props['line-width']
  })
}

<<<<<<< Updated upstream
const makeFill = props => {
=======
const makeFill = (props: any) => {
>>>>>>> Stashed changes
  if (props['fill-color']) {
    return Styles.fill({ color: props['fill-color'] })
  } else if (props['fill-pattern']) {
    const color = patterns.fill({
      pattern: props['fill-pattern'],
      angle: props['fill-pattern-angle'],
      size: props['fill-pattern-size'],
      spacing: props['fill-pattern-spacing'],
      strokeColor: props['line-halo-color'],
      strokeWidth: props['line-halo-width'] + props['line-width'],
      strokeFillColor: props['line-color'],
      strokeFillWidth: props['line-width']
    })

<<<<<<< Updated upstream
=======
    if (!color) return null
>>>>>>> Stashed changes
    return new olStyle.Fill({ color })
  } else return null
}

<<<<<<< Updated upstream
const makeText = props => {
=======
const makeText = (props: any) => {
>>>>>>> Stashed changes
  if (!props['text-field']) return null

  const rotate = props['text-rotate']
  const rotationAnchor = props['text-rotation-anchor']
  const flipped = rotate ? rotate < -PI_OVER_2 || rotate > PI_OVER_2 : false
  const textAlign = props['text-justify'] || null
  const textOffset = props['text-offset'] || [0, 0]
  const offsetX = flipped ? -1 * textOffset[0] : textOffset[0]
  const offsetY = flipped && rotationAnchor === 'fix' ? -1 * textOffset[1] : textOffset[1]

  return Styles.text({
    font: props['text-font'],
    text: props['text-field'],
    rotation: rotate ? flipped ? rotate + PI : rotate : null,
    textAlign: textAlign ? flipped ? TEXT_ALIGN[textAlign] : textAlign : null,
    offsetX,
    offsetY,
    padding: props['text-padding'] && new Array(4).fill(props['text-padding']),
    fill: Styles.fill({ color: props['text-color'] }),
    stroke: props['text-halo-color'] && props['text-halo-width'] !== 0 && Styles.stroke({
      color: props['text-halo-color'],
      width: props['text-halo-width']
    }),
    backgroundFill: props['text-fill-color'] && Styles.fill({ color: props['text-fill-color'] }),
    backgroundStroke: props['text-line-color'] && Styles.stroke({
      color: props['text-line-color'],
      width: props['text-line-width']
    })
  })
}

<<<<<<< Updated upstream
const makeCircle = props => {
=======
const makeCircle = (props: any) => {
>>>>>>> Stashed changes
  const fill = Styles.fill({ color: props['circle-fill-color'] })
  const stroke = props['circle-line-color']
    ? Styles.stroke({
      color: props['circle-line-color'],
      width: props['circle-line-width']
    })
    : null

  return Styles.circle({
    fill,
    stroke,
    radius: props['circle-radius']
  })
}

<<<<<<< Updated upstream
const makeShape = props => {
=======
const makeShape = (props: any) => {
>>>>>>> Stashed changes
  const fillColor = props['shape-fill-color']
  const fill = fillColor ? Styles.fill({ color: fillColor }) : null
  const stroke = Styles.stroke({
    color: props['shape-line-color'],
    width: props['shape-line-width']
  })

  return Styles.regularShape({
    fill,
    stroke,
    radius: props['shape-radius'],
    radius2: props['shape-radius-2'],
    points: props['shape-points'],
    angle: props['shape-angle'],
    rotation: props['shape-rotate'],
    scale: props['shape-scale'],
    displacement: props['shape-offset']
  })
}

<<<<<<< Updated upstream
const makeSymbol = props => {
  const modes = { dark: 'Dark', medium: 'Medium', light: 'Light' }

  const fromEntries = entries => Object.fromEntries(entries)
  const entries = obj => Object.entries(obj)
=======
const makeSymbol = (props: any) => {
  const modes: Record<string, string> = { dark: 'Dark', medium: 'Medium', light: 'Light' }

  const fromEntries = (entries: [string, any][]) => Object.fromEntries(entries)
  const entries = (obj: any) => Object.entries(obj)
>>>>>>> Stashed changes
  const rejectNil = R.reject(([, v]) => R.isNil(v))
  const filter = R.compose(fromEntries, rejectNil, entries)

  const options = filter({
    colorMode: modes[props['color-scheme']],
    monoColor: props['symbol-color'],
    outlineColor: props['symbol-halo-color'],
    outlineWidth: props['symbol-halo-width'],
    infoFields: props['symbol-text'],
    infoSize: props['symbol-text-size'],
    infoColor: props['symbol-text-color'],
    infoOutlineColor: props['symbol-text-halo-color'],
    infoOutlineWidth: props['symbol-text-halo-width'],
    strokeWidth: props['symbol-line-width'],
    fill: props['symbol-fill'],
    fillOpacity: props['symbol-fill-opacity'],
    frame: props['symbol-frame'],
    size: props['symbol-size'] || 60,
    ...props['symbol-modifiers']
  })

  const symbol = new Symbol(props['symbol-code'], { ...options, infoFields: true })
  const { width, height } = symbol.getSize()

  return Styles.icon({
    anchor: [symbol.getAnchor().x, symbol.getAnchor().y],
    imgSize: [Math.floor(width), Math.floor(height)],
    src: 'data:image/svg+xml;utf8,' + symbol.asSVG(),
    anchorXUnits: 'pixels',
    anchorYUnits: 'pixels',
    scale: props['icon-scale'] || 0.5
  })
}

<<<<<<< Updated upstream
const makeIcon = props => {
=======
const makeIcon = (props: any) => {
>>>>>>> Stashed changes
  return Styles.icon({
    src: props['icon-url'],
    scale: props['icon-scale'] || 1,
    rotation: props['icon-rotate'] || 0
  })
}

<<<<<<< Updated upstream
const makeImage = props => {
=======
const makeImage = (props: any) => {
>>>>>>> Stashed changes
  if (props['circle-radius']) return makeCircle(props)
  else if (props['shape-radius']) return makeShape(props)
  else if (props['symbol-code']) return makeSymbol(props)
  else if (props['icon-url']) return makeIcon(props)
  else return null
}

<<<<<<< Updated upstream
const makeStyle = props => Array.isArray(props)
  ? props.map(makeStyle)
  : Styles.style(props)

/**
 *
 */
export const styleFactory = props => {
  const styleOptions = []
=======
const makeStyle = (props: any): any => Array.isArray(props)
  ? props.map(makeStyle)
  : Styles.style(props)

export const styleFactory = (props: any): any => {
  const styleOptions: any[] = []
>>>>>>> Stashed changes

  if (props['line-halo-width']) {
    styleOptions.push({
      geometry: props.geometry,
      stroke: makeStroke({
        'line-color': props['line-halo-color'],
        'line-dash-array': props['line-halo-dash-array'],
        'line-width': props['line-width'] + 2 * props['line-halo-width'],
        'line-cap': props['line-cap'],
        'line-join': props['line-join']
      })
    })
  }

  styleOptions.push({
    geometry: props.geometry,
    fill: makeFill(props),
    image: makeImage(props),
    stroke: makeStroke(props),
    text: makeText(props)
  })

  return makeStyle(styleOptions)
}
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
