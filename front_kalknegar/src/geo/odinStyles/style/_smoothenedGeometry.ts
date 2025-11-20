import { smooth } from './chaikin'

<<<<<<< Updated upstream
/**
 *
 */
export default (simplifiedGeometry, lineSmoothing) => lineSmoothing
  ? smooth(simplifiedGeometry)
  : simplifiedGeometry
=======
export default (simplifiedGeometry: any, lineSmoothing: boolean): any => lineSmoothing
  ? smooth(simplifiedGeometry)
  : simplifiedGeometry

>>>>>>> Stashed changes
