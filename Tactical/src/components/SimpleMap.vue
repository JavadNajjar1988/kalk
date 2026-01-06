<template>
  <div id="simple-map" class="simple-map"></div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import 'ol/ol.css'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'

let mapInstance = null

onMounted(() => {
  console.log('🗺️ Initializing simple map...')
  
  // Wait for next tick to ensure DOM is ready
  setTimeout(() => {
    try {
      const mapElement = document.getElementById('simple-map')
      if (!mapElement) {
        console.error('❌ Map element not found')
        return
      }
      
      const view = new View({
        center: [0, 0],
        zoom: 2
      })
      
      mapInstance = new Map({
        target: 'simple-map',
        layers: [
          new TileLayer({
            source: new OSM()
          })
        ],
        view: view
      })
      
      console.log('✅ Simple map initialized')
    } catch (error) {
      console.error('❌ Failed to initialize simple map:', error)
    }
  }, 100)
})

onUnmounted(() => {
  if (mapInstance) {
    mapInstance.setTarget(null)
    mapInstance = null
  }
})
</script>

<style>
.simple-map {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
}
</style>

