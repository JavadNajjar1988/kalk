import { defineStore } from 'pinia'
import { ref } from 'vue'
import ProjectStore from '../store/web/ProjectStore.js'
import PreferencesStore from '../store/web/PreferencesStore.js'
import SessionStore from '../store/web/SessionStore.js'
import Emitter from '../shared/emitter.js'

/**
 * Services Store - مدیریت مرکزی سرویس‌های اپلیکیشن
 */
export const useServicesStore = defineStore('services', () => {
  // Services
  const projectStore = ref(null)
  const preferencesStore = ref(null)
  const sessionStore = ref(null)
  const emitter = ref(null)
  const store = ref(null) // Main data store
  
  // Initialize services
  const initialize = async () => {
    try {
      // Initialize Emitter (for event communication)
      emitter.value = new Emitter()
      console.log('✅ Emitter initialized')
      
      // Initialize ProjectStore (web version using localStorage)
      projectStore.value = new ProjectStore()
      console.log('✅ ProjectStore initialized')
      
      // Initialize PreferencesStore
      preferencesStore.value = new PreferencesStore()
      console.log('✅ PreferencesStore initialized')
      
      // Initialize SessionStore
      sessionStore.value = new SessionStore()
      console.log('✅ SessionStore initialized')
      
      console.log('✅ All services initialized successfully')
      return {
        projectStore: projectStore.value,
        preferencesStore: preferencesStore.value,
        sessionStore: sessionStore.value,
        emitter: emitter.value
      }
    } catch (error) {
      console.error('❌ Failed to initialize services:', error)
      throw error
    }
  }
  
  // Get services object for components
  const getServices = () => ({
    projectStore: projectStore.value,
    preferencesStore: preferencesStore.value,
    sessionStore: sessionStore.value,
    emitter: emitter.value,
    store: store.value
  })
  
  return {
    projectStore,
    preferencesStore,
    sessionStore,
    emitter,
    store,
    initialize,
    getServices
  }
})

