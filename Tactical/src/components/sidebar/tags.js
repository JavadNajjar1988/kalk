import ScopeTag from './ScopeTag.vue'
import SystemTag from './SystemTag.vue'
import UserTag from './UserTag.vue'
import PlusTag from './PlusTag.vue'

/**
 * Different tag flavor.
 */
export const TAG = {
  SCOPE: (props) => ({ component: ScopeTag, props }),
  SYSTEM: (props) => ({ component: SystemTag, props }),
  USER: (props) => ({ component: UserTag, props }),
  PLUS: (props) => ({ component: PlusTag, props })
}

