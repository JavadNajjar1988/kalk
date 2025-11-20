import * as TS from '../ts'
import _bboxes from './_bbox'

<<<<<<< Updated upstream
/**
 *
 */
export default resolution => {
  return styles => {
    const bboxes = _bboxes(resolution, styles)
    if (bboxes.length === 0) return styles

    const clip = geometry => TS.difference([geometry, ...bboxes])
    const lineString = geometry => TS.lineString(geometry.getCoordinates())
    const geometry = styles.some(props => props['text-clipping'] === 'line')
=======
export default (resolution: number) => {
  return (styles: any[]) => {
    const bboxes = _bboxes(resolution, styles)
    if (bboxes.length === 0) return styles

    const clip = (geometry: any) => TS.difference([geometry, ...bboxes])
    const lineString = (geometry: any) => TS.lineString(geometry.getCoordinates())
    const geometry = styles.some((props: any) => props['text-clipping'] === 'line')
>>>>>>> Stashed changes
      ? lineString(styles[0].geometry)
      : styles[0].geometry

    // Replace primary geometry with clipped geometry:
    styles[0].geometry = clip(geometry)

    return styles
  }
}
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
