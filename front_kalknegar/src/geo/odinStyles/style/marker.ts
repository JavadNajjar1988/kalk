import { Stroke, Circle, RegularShape, Style } from 'ol/style'
<<<<<<< Updated upstream

const crosshair = (color, radius = 30) => {
=======
import Signal from '@syncpoint/signal'

const crosshair = (color: string, radius: number = 30) => {
>>>>>>> Stashed changes
  const stroke = new Stroke({ color, width: 2 })
  const bigCircle = new Circle({ stroke, radius: 30 })
  const smallCircle = new Circle({ stroke, radius: radius / 15 })

  return [
    new Style({ image: bigCircle }),
    new Style({ image: smallCircle }),
    ...[0, 1, 2, 3].map(direction => new Style({
      image: new RegularShape({
        stroke,
        rotation: direction * Math.PI / 2,
        points: 2,
        radius: radius / 2,
        displacement: [0, 0.8 * radius]
      })
<<<<<<< Updated upstream
    }))]
}

export default $ =>
  $.selectionMode.map(mode =>
    mode === 'default'
      ? crosshair('black')
      : crosshair('red')
)
=======
    }))
  ]
}

export default ($: any) =>
  $.selectionMode.map((mode: string) =>
    mode === 'default'
      ? crosshair('black')
      : crosshair('red')
  )

>>>>>>> Stashed changes
