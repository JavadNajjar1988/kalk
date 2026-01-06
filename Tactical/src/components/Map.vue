<template>
  <div
    ref="mapRef"
    id="map"
    class="map"
    tabindex="0"
  />
</template>

<script setup>
import { ref, inject, watch, onMounted, onUnmounted } from 'vue'
import 'ol/ol.css'
import * as ol from 'ol'
import { ScaleLine, Rotate } from 'ol/control'
import '../epsg/index.js'
import defaultInteractions from '../ol/interaction'
import vectorSources from './map/vectorSources'
import createMapView from './map/view'
import createLayerStyles from './map/layerStyles'
import createVectorLayers from './map/vectorLayers'
import createTileLayers from './map/tileLayers'
import registerEventHandlers from './map/eventHandlers'
import registerGraticules from './map/graticules'
import measure from '../ol/interaction/measure'
import print from './print'
import './map/Map.css'
import './map/ScaleLine.css'

// Get project-specific services from parent (reactive ref)
const servicesRef = inject('services')
const mapRef = ref(null)
let mapInstance = null
let resizeObserver = null

// Initialize map when services become available
const initializeMap = async (services) => {
  console.log('🗺️ Map.vue: initializeMap called', { services: !!services, mapInstance: !!mapInstance, mapRef: !!mapRef.value })
  
  if (!services || mapInstance) {
    console.log('⚠️ Map.vue: Skipping initialization', { services: !!services, mapInstance: !!mapInstance })
    return
  }
  
  if (!mapRef.value) {
    console.error('❌ Map.vue: mapRef.value is null')
    return
  }
  
  console.log('✅ Map.vue: Starting map initialization...')
  console.log('📏 Map.vue: Map element size:', mapRef.value.offsetWidth, 'x', mapRef.value.offsetHeight)
  
  try {
    console.log('🔄 Map.vue: Creating view, sources, and tile layers...')
    // Wait for all async operations
    const [view, sources, tileLayers] = await Promise.all([
      createMapView(services),
      vectorSources(services),
      createTileLayers(services)
    ])
    
    console.log('✅ Map.vue: View, sources, and tile layers created', {
      view: !!view,
      sources: !!sources,
      tileLayersCount: Array.isArray(tileLayers) ? tileLayers.length : 'not array',
      tileLayers: tileLayers
    })
    
    const styles = createLayerStyles(services, sources)
    const vectorLayers = createVectorLayers(sources, styles)

    const controlsTarget = document.getElementById('osd')
    const controls = [
      new Rotate({ target: controlsTarget }),
      new ScaleLine({ bar: true, text: true, minWidth: 128, target: controlsTarget })
    ]

    // Ensure tileLayers is an array
    const tileLayersArray = Array.isArray(tileLayers) ? tileLayers : [tileLayers].filter(Boolean)
    console.log('📊 Map.vue: Tile layers array:', tileLayersArray.length, tileLayersArray)
    
    const layers = [...tileLayersArray, ...Object.values(vectorLayers)]
    console.log('📊 Map.vue: Total layers:', layers.length, { 
      tileLayers: tileLayersArray.length, 
      vectorLayers: Object.keys(vectorLayers).length,
      layers: layers.map(l => ({ type: l.constructor.name, id: l.get?.('id') }))
    })

    // Ensure target element is ready
    if (!mapRef.value || mapRef.value.offsetWidth === 0 || mapRef.value.offsetHeight === 0) {
      console.error('❌ Map.vue: Map target element not ready', {
        exists: !!mapRef.value,
        width: mapRef.value?.offsetWidth,
        height: mapRef.value?.offsetHeight
      })
      throw new Error('Map target element not ready')
    }
    
    // Ensure we have at least one layer (add OSM fallback if needed)
    let finalLayers = layers
    const OSM = (await import('ol/source/OSM')).default
    const TileLayer = (await import('ol/layer/Tile')).default

    // Always add an OSM base layer on top of whatever we have.
    // If existing layers are empty, this guarantees visibility.
    const osmBase = new TileLayer({ source: new OSM(), zIndex: -10 })
    finalLayers = [osmBase, ...finalLayers]
    
    console.log('🗺️ Map.vue: Creating OpenLayers map instance...')
    mapInstance = new ol.Map({
      target: mapRef.value,
      controls,
      layers: finalLayers,
      view: view,
      interactions: []
    })
    
    console.log('✅ Map.vue: Map instance created', mapInstance)
    
    // Force immediate render
    console.log('🔄 Map.vue: Forcing map render...')
    mapInstance.updateSize()
    mapInstance.renderSync()
    mapInstance.updateSize()
    console.log('✅ Map.vue: Map rendered')

    defaultInteractions({
      hitTolerance: 3,
      map: mapInstance,
      services,
      sources,
      styles
    })

    registerEventHandlers({ services, sources, vectorLayers, map: mapInstance })
    registerGraticules({ services, map: mapInstance })
    print({ map: mapInstance, services })

    // Force map resize on container resize
    resizeObserver = new ResizeObserver(() => mapInstance.updateSize())
    resizeObserver.observe(mapRef.value)

    measure({ services, map: mapInstance })
    
    // Ensure canvas visibility
    const checkCanvas = (attempt = 0) => {
      setTimeout(() => {
        if (!mapInstance) return
        
        mapInstance.updateSize()
        
        const canvas = mapRef.value?.querySelector('canvas')
        const olViewport = mapRef.value?.querySelector('.ol-viewport')
        
        if (canvas) {
          // Force visibility
          canvas.style.display = 'block'
          canvas.style.visibility = 'visible'
          canvas.style.opacity = '1'
          
          // Force map element visibility
          mapRef.value.style.display = 'block'
          mapRef.value.style.visibility = 'visible'
          mapRef.value.style.opacity = '1'
          
          if (olViewport) {
            olViewport.style.display = 'block'
            olViewport.style.visibility = 'visible'
            olViewport.style.opacity = '1'
          }
          
          // Force canvas to be on top
          const allCanvases = mapRef.value.querySelectorAll('canvas')
          allCanvases.forEach((c, i) => {
            c.style.zIndex = (i + 1).toString()
            c.style.position = 'absolute'
          })
        } else if (attempt < 10) {
          checkCanvas(attempt + 1)
        }
      }, 300)
    }
    
    checkCanvas()
    console.log('✅ Map.vue: Map initialization completed successfully')
  } catch (error) {
    console.error('❌ Map.vue: Failed to initialize map:', error)
    console.error('❌ Map.vue: Error stack:', error.stack)
    throw error // Re-throw to see in console
  }
}

// Watch for services to become available - watch the value inside the ref
watch(() => servicesRef?.value, async (services) => {
  console.log('👀 Map.vue: Services watch triggered', { services: !!services, mapRef: !!mapRef.value, mapInstance: !!mapInstance })
  if (services && mapRef.value && !mapInstance) {
    console.log('⏳ Map.vue: Waiting for DOM to be ready...')
    // Wait for DOM to be ready
    await new Promise(resolve => setTimeout(resolve, 200))
    await initializeMap(services)
  }
}, { immediate: true })

onMounted(async () => {
  console.log('📦 Map.vue: Component mounted')
  // Wait for next tick to ensure refs are ready
  await new Promise(resolve => setTimeout(resolve, 100))
  
  console.log('🔍 Map.vue: Checking if services are available...', {
    servicesRef: !!servicesRef,
    servicesValue: !!servicesRef?.value,
    mapRef: !!mapRef.value,
    mapInstance: !!mapInstance
  })
  
  // If services are already available, initialize immediately
  if (servicesRef && servicesRef.value && mapRef.value && !mapInstance) {
    console.log('⏳ Map.vue: Services available, waiting for DOM...')
    // Wait for DOM to be ready
    await new Promise(resolve => setTimeout(resolve, 200))
    await initializeMap(servicesRef.value)
  } else {
    console.log('⏸️ Map.vue: Waiting for services or mapRef...')
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  if (mapInstance) {
    mapInstance.setTarget(null)
    mapInstance = null
  }
})
</script>
