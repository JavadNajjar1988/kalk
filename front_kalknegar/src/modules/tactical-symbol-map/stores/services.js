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
  const projectUUID = ref(null)
  const projectStore = ref(null)
  const preferencesStore = ref(null)
  const sessionStore = ref(null)
  const emitter = ref(null)
  const store = ref(null) // Main data store
  const featureStore = ref(null)
  const searchIndex = ref(null)
  const selection = ref(null)
  const osdDriver = ref(null)
  const ipcRenderer = ref(null)
  
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
    projectUUID: projectUUID.value,
    projectStore: projectStore.value,
    preferencesStore: preferencesStore.value,
    sessionStore: sessionStore.value,
    emitter: emitter.value,
      store: store.value,
      featureStore: featureStore.value,
      searchIndex: searchIndex.value,
      selection: selection.value,
      osdDriver: osdDriver.value,
      ipcRenderer: ipcRenderer.value
  })
  
  return {
    projectUUID,
    projectStore,
    preferencesStore,
    sessionStore,
    emitter,
    store,
    featureStore,
    searchIndex,
    selection,
    osdDriver,
    ipcRenderer,
    initialize,
    getServices
  }
})

