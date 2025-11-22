import { Circle, Fill, Stroke, Style } from 'ol/style'

<<<<<<< Updated upstream
export default (options = {}) => {
=======
export default (options: any = {}) => {
>>>>>>> Stashed changes
  const fill = new Fill({ color: 'rgba(255,255,255,0.3)' })
  const strokeColor = options.strokeColor ?? '#888'
  const stroke = new Stroke({ color: strokeColor, width: 1.25 })
  return new Style({
    geometry: options.geometry,
    image: new Circle({ fill, stroke, radius: 5 }),
    fill,
    stroke
  })
}
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
