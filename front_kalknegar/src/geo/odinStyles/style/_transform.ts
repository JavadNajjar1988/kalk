import * as R from 'ramda'
import { transform } from '../geometry'
<<<<<<< Updated upstream
import { destructure } from '../signal'
=======
import { destructure } from '../shared/signal'
>>>>>>> Stashed changes

export default R.compose(
  destructure(['read', 'write', 'pointResolution']),
  R.map(transform)
)
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
