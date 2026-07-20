import * as R from 'ramda'
import { transform } from '../../model/geometry.js'
import { destructure } from '../../shared/signal'

export default R.compose(
  destructure(['read', 'write', 'pointResolution']),
  R.map(transform)
)
