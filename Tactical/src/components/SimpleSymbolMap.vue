<template>
  <div class="simple-symbol-map-container">
    <div class="map-wrapper">
      <div ref="mapRef" id="simple-symbol-map" class="map"></div>
    </div>
    <div class="symbol-panel">
      <div class="symbol-attributes">
        <div class="attribute-section">
          <label class="attribute-label">وابستگی</label>
          <div class="attribute-options">
            <button
              v-for="aff in affiliations"
              :key="aff.code"
              class="attribute-option"
              :class="{ active: selectedHostility === aff.code }"
              @click="selectHostility(aff.code)"
              :title="aff.labelPersian"
            >
              <div class="attribute-icon" v-html="aff.icon"></div>
              <span class="attribute-text">{{ aff.labelPersian }}</span>
            </button>
          </div>
        </div>
        <div class="attribute-section">
          <label class="attribute-label">وضعیت</label>
          <div class="attribute-options">
            <button
              v-for="stat in statuses"
              :key="stat.code"
              class="attribute-option"
              :class="{ active: selectedStatus === stat.code }"
              @click="selectStatus(stat.code)"
              :title="stat.labelPersian"
            >
              <div class="attribute-icon" v-html="stat.icon"></div>
              <span class="attribute-text">{{ stat.labelPersian }}</span>
            </button>
          </div>
        </div>
      </div>
      <SimpleSymbolMapSidebar v-if="services" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, provide, watch } from 'vue'
import { useRoute } from 'vue-router'
import 'ol/ol.css'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import SimpleSymbolMapSidebar from './SimpleSymbolMapSidebar.vue'
import { initializeProjectServices } from '../services/projectServices.js'
import '../epsg/index.js'
import defaultInteractions from '../ol/interaction'
import vectorSources from './map/vectorSources'
import createMapView from './map/view'
import createLayerStyles from './map/layerStyles'
import createVectorLayers from './map/vectorLayers'
import createTileLayers from './map/tileLayers'
import registerEventHandlers from './map/eventHandlers'
import registerGraticules from './map/graticules'
import './map/Map.css'
import * as ID from '../ids.js'
import * as MILSTD from '../symbology/2525c.js'
import { svg } from '../symbology/symbol.js'

const mapRef = ref(null)
const route = useRoute()
let mapInstance = null
const selectedHostility = ref('F') // Default: Friend
const selectedStatus = ref('P') // Default: Present
const services = ref(null)

// Provide services as reactive ref for child components
provide('services', services)

// Create a simple unit symbol SIDC for icon rendering
const baseSIDC = 'SFGPUCI----K---'

// Affiliation options with icons
const affiliations = [
  { 
    code: 'U', 
    label: 'Unknown',
    labelPersian: 'نامشخص',
    icon: svg(MILSTD.format(baseSIDC, { identity: 'U', status: 'P' }), { size: 24 })
  },
  { 
    code: 'F', 
    label: 'Friend',
    labelPersian: 'دوست',
    icon: svg(MILSTD.format(baseSIDC, { identity: 'F', status: 'P' }), { size: 24 })
  },
  { 
    code: 'H', 
    label: 'Hostile',
    labelPersian: 'دشمن',
    icon: svg(MILSTD.format(baseSIDC, { identity: 'H', status: 'P' }), { size: 24 })
  },
  { 
    code: 'N', 
    label: 'Neutral',
    labelPersian: 'خنثی',
    icon: svg(MILSTD.format(baseSIDC, { identity: 'N', status: 'P' }), { size: 24 })
  }
]

// Status options with icons (using simple checkbox icons)
const statuses = [
  { 
    code: 'P', 
    label: 'Present',
    labelPersian: 'حاضر',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="16" height="16" stroke="#333" stroke-width="2" fill="white"/></svg>'
  },
  { 
    code: 'A', 
    label: 'Planned / Anticipated',
    labelPersian: 'برنامه‌ریزی شده / پیش‌بینی شده',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="16" height="16" stroke="#333" stroke-width="2" stroke-dasharray="4 2" fill="white"/></svg>'
  }
]

// Select hostility (affiliation)
const selectHostility = (code) => {
  selectedHostility.value = code
  // Store in services for draw-interaction to use
  if (services.value && services.value.emitter) {
    services.value.emitter.emit('hostility/selected', { code })
  }
}

// Select status
const selectStatus = (code) => {
  selectedStatus.value = code
  // Store in services for draw-interaction to use
  if (services.value && services.value.emitter) {
    services.value.emitter.emit('status/selected', { code })
  }
}

// Initialize map and services
const initializeMap = async () => {
  if (!mapRef.value) return
  
  try {
    // Get project UUID from route or use default
    const projectUUID = route.params.id || 'default-project'
    
    // Initialize project services
    const projectServices = await initializeProjectServices(projectUUID)
    services.value = projectServices
    
    // Wait for all async operations
    const [view, sources, tileLayers] = await Promise.all([
      createMapView(projectServices),
      vectorSources(projectServices),
      createTileLayers(projectServices)
    ])
    
    const layerStyles = createLayerStyles(projectServices, sources)
    const vectorLayers = createVectorLayers(sources, layerStyles)
    
    // Create map
    mapInstance = new Map({
      target: 'simple-symbol-map',
      layers: [
        ...tileLayers,
        ...Object.values(vectorLayers)
      ],
      view: view,
      controls: []
    })
    
    // Register interactions
    defaultInteractions({ 
      services: projectServices, 
      map: mapInstance, 
      sources, 
      vectorLayers,
      styles: layerStyles
    })
    
    // Register event handlers
    registerEventHandlers({ services: projectServices, sources, vectorLayers, map: mapInstance })
    
    // Register graticules
    await registerGraticules({ services: projectServices, map: mapInstance })
    
    // Listen for hostility changes
    if (projectServices.emitter) {
      projectServices.emitter.on('hostility/selected', ({ code }) => {
        selectedHostility.value = code
      })
    }
    
  } catch (error) {
    console.error('Failed to initialize map:', error)
  }
}

onMounted(() => {
  initializeMap()
})

onUnmounted(() => {
  if (mapInstance) {
    mapInstance.setTarget(null)
    mapInstance = null
  }
})
</script>

<style scoped>
.simple-symbol-map-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: row;
  background: #f0f0f0;
}

.map-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.map {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.symbol-panel {
  width: 350px;
  background: white;
  border-left: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.symbol-attributes {
  padding: 0.75rem;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f8f8;
}

.attribute-section {
  margin-bottom: 1rem;
}

.attribute-section:last-child {
  margin-bottom: 0;
}

.attribute-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  text-align: left;
}

.attribute-options {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.attribute-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 70px;
}

.attribute-option:hover {
  border-color: #999;
  background: #f5f5f5;
}

.attribute-option.active {
  border-color: #1976d2;
  background: #e3f2fd;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}

.attribute-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.attribute-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.attribute-text {
  font-size: 0.7rem;
  color: #333;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
}

.symbol-categories {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.category-section {
  margin-bottom: 0.5rem;
}

.category-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
  background: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.category-title:hover {
  background: #e8e8e8;
}

.category-icon {
  font-size: 0.8rem;
  color: #666;
}

.category-symbols {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  padding: 0.5rem;
  margin-top: 0.25rem;
}

.symbol-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.symbol-item:hover {
  border-color: #1976d2;
  background: #f0f7ff;
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.symbol-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.symbol-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.symbol-name {
  font-size: 0.8rem;
  color: #666;
  text-align: center;
  line-height: 1.2;
}
</style>

