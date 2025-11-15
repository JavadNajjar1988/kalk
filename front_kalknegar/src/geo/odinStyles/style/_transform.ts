import * as R from 'ramda'
import { transform } from '../geometry'
import { destructure } from '../signal'

export default R.compose(
  destructure(['read', 'write', 'pointResolution']),
  R.map(transform)
)
