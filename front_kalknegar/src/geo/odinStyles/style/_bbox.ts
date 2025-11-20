import * as TS from '../ts'
<<<<<<< Updated upstream
import { PI_OVER_2 } from '../Math'
=======
import { PI_OVER_2 } from '../shared/Math'
>>>>>>> Stashed changes

const canvas = document.createElement('canvas')
const context = canvas.getContext('2d')

<<<<<<< Updated upstream
/**
 *
 */
const textBoundingBox = (resolution, style) => {
=======
const textBoundingBox = (resolution: number, style: any): any => {
>>>>>>> Stashed changes
  const textField = style['text-field']
  if (!textField) return null
  if (style['text-clipping'] === 'none') return null

  // Prepare bounding box geometry (dimensions only, including padding).
  const lines = textField.split('\n')
<<<<<<< Updated upstream
  const [maxWidthPx, maxHeightPx] = lines.reduce((acc, line) => {
=======
  const [maxWidthPx, maxHeightPx] = lines.reduce((acc: number[], line: string) => {
    if (!context) return acc
>>>>>>> Stashed changes
    context.font = style['text-font']
    const metrics = context.measureText(line)
    const width = metrics.width
    const height = 1.2 * lines.length * ((metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent))
    if (width > acc[0]) acc[0] = width
    if (height > acc[1]) acc[1] = height
    return acc
  }, [0, 0])

  const { x, y } = style.geometry.getCoordinates()[0]
  const padding = style['text-padding'] || 0
  const dx = (maxWidthPx / 2 + padding) * resolution
  const dy = (maxHeightPx / 2 + padding) * resolution

  const x1 = x - dx
  const x2 = x + dx
  const y1 = y - dy
  const y2 = y + dy
  const points = [[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]]
  const geometry = TS.polygon(points.map(TS.coordinate))

  // Transform geometry (rotate/translate) to match
  // label options offset, justify and rotate.

  const rotate = style['text-rotate'] || 0
  const justify = style['text-justify'] || 'center'
  const [offsetX, offsetY] = style['text-offset'] || [0, 0]

<<<<<<< Updated upstream
  const flipX = { start: -1, end: 1, center: 0 }
  const flipY = rotate < -PI_OVER_2 || rotate > PI_OVER_2 ? -1 : 1
  const tx = (-offsetX + flipX[justify] * (maxWidthPx / 2)) * resolution
=======
  const flipX: Record<string, number> = { start: -1, end: 1, center: 0 }
  const flipY = rotate < -PI_OVER_2 || rotate > PI_OVER_2 ? -1 : 1
  const tx = (-offsetX + (flipX[justify] || 0) * (maxWidthPx / 2)) * resolution
>>>>>>> Stashed changes
  const ty = flipY * offsetY * resolution

  const theta = 2 * Math.PI - rotate
  const at = TS.AffineTransformation.translationInstance(-(x + tx), -(y + ty))
  at.rotate(theta)
  at.translate(x, y)

  return at.transform(geometry)
}

<<<<<<< Updated upstream

/**
 *
 */
const iconBoundingBox = (resolution, style) => {
=======
const iconBoundingBox = (resolution: number, style: any): any => {
>>>>>>> Stashed changes
  const scale = style['icon-scale']
  if (!scale) return null

  const width = style['icon-width'] * scale / 4
  const height = style['icon-height'] * scale / 4
  const rotate = style['icon-rotate'] || 0
  const padding = style['icon-padding'] || 0
  const { x, y } = style.geometry.getCoordinates()[0]

  const x1 = x - (width + padding) * resolution
  const x2 = x + (width + padding) * resolution
  const y1 = y - (height + padding) * resolution
  const y2 = y + (height + padding) * resolution
  const points = [[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]]
  const theta = 2 * Math.PI - rotate
  const geometry = TS.polygon(points.map(TS.coordinate))
  const rotation = TS.AffineTransformation.rotationInstance(theta, x, y)
  return rotation.transform(geometry)
}

<<<<<<< Updated upstream
const bbox = resolution => style => {
=======
const bbox = (resolution: number) => (style: any): any => {
>>>>>>> Stashed changes
  if (style['text-field']) return textBoundingBox(resolution, style)
  else if (style['icon-image']) return iconBoundingBox(resolution, style)
  else return null
}

<<<<<<< Updated upstream
/**
 *
 */
export default (resolution, styles) => styles
  .map(bbox(resolution))
  .filter(Boolean)
=======
export default (resolution: number, styles: any[]): any[] => styles
  .map(bbox(resolution))
  .filter(Boolean)

>>>>>>> Stashed changes
