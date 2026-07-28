<template>
  <!-- Loading State -->
  <div v-if="loading" class="loading-container">
    <div class="spinner"></div>
    <p>در حال بارگذاری...</p>
  </div>
  
  <!-- Error State -->
  <div v-else-if="error" class="error-container">
    <div class="error-message">
      <h3>خطا</h3>
      <p>{{ error }}</p>
      <button @click="goBack">بازگشت</button>
    </div>
  </div>
  
  <!-- Map with Toolbar -->
  <div v-else-if="projectServices !== null" class="project-container">
    <Toolbar />
    <div class="content">
      <div class="map-container">
        <Map />
      </div>
      <div class="map-overlay">
        <Sidebar v-if="sidebarShowing" />
        <div class="properties-container">
          <Properties v-if="properties === 'properties' || !properties" />
          <Styles v-if="properties === 'styles'" />
          <Sharing v-if="properties === 'sharing'" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, provide, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useServices } from '../composables/useServices.js'
import { useMemento } from '../composables/useMemento.js'
import { initializeProjectServices } from '../services/projectServices.js'
import Map from './Map.vue'
import Toolbar from './Toolbar.vue'
import Sidebar from './sidebar/Sidebar.vue'
import Properties from './properties/Properties.vue'
import Styles from './properties/Styles.vue'
import Sharing from './properties/Sharing.vue'

const router = useRouter()
const route = useRoute()
const globalServices = useServices()
const loading = ref(true)
const error = ref(null)
const projectServices = ref(null)
const [sidebarShowing] = useMemento('ui.sidebar.showing', true)
const [properties] = useMemento('ui.properties', '')

provide('services', projectServices)

const goBack = () => {
  if (window.history.state?.back) {
    router.back()
    return
  }
  router.replace('/')
}

onMounted(async () => {
  const projectUUID = route.params.id
  console.log('📦 Project.vue: Component mounted', { projectUUID })
  
  try {
    loading.value = true
    error.value = null
    
    console.log('🔄 Project.vue: Initializing project services...')
    const services = await initializeProjectServices(projectUUID)
    console.log('✅ Project.vue: Project services initialized', { services: !!services, keys: services ? Object.keys(services) : [] })
    
    projectServices.value = services
    console.log('✅ Project.vue: projectServices.value set', { projectServices: !!projectServices.value })
    
    loading.value = false
    console.log('✅ Project.vue: Loading completed')
  } catch (err) {
    console.error('❌ Project.vue: Failed to load project:', err)
    console.error('❌ Project.vue: Error stack:', err.stack)
    error.value = err.message || 'خطا'
    loading.value = false
  }
})
</script>

<style>
/* Loading */
.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #ddd;
  border-top: 5px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error */
.error-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
}

.error-message {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
}

/* Project Container */
.project-container {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
  background: #f0f0f0 !important;
}

.content {
  flex-grow: 1;
  position: relative;
  overflow: hidden;
  display: flex;
}

/* Map Container */
.map-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.map-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 100;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: stretch;
}

.properties-container {
  display: flex;
  align-items: stretch;
}
</style>
