import { computed } from 'vue'
import { useServices } from './useServices.js'
import Emitter from '../shared/emitter.js'

/**
 * Get or create a scoped emitter for a specific key
 */
export function useEmitter(key) {
  const services = useServices()
  
  // For project-specific services, we need to get them from inject
  // For now, we'll create emitters on the services object
  if (!services.emitters) {
    services.emitters = {}
  }
  
  if (!services.emitters[key]) {
    services.emitters[key] = new Emitter()
  }
  
  return services.emitters[key]
}

