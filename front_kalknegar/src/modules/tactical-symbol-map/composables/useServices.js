import { useServicesStore } from '../stores/services.js'

/**
 * Composable برای دسترسی به services در کامپوننت‌های Vue
 */
export function useServices() {
  const servicesStore = useServicesStore()
  return servicesStore.getServices()
}

