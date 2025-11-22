import * as TS from '../ts'
<<<<<<< Updated upstream
import * as Math from '../Math'

export default (geometry, resolution) => ({ TS, ...Math, geometry, resolution })
=======
import * as Math from '../shared/Math'

export default (geometry: any, resolution: number): any => ({ TS, ...Math, geometry, resolution })

>>>>>>> Stashed changes
