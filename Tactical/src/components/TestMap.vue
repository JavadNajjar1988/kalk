<template>
  <div class="test-map-container">
    <div id="test-map" class="test-map"></div>
  </div>
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
  console.log('🗺️ TestMap: Initializing...')
  
  setTimeout(() => {
    const mapElement = document.getElementById('test-map')
    console.log('TestMap: Element:', mapElement)
    console.log('TestMap: Size:', mapElement?.offsetWidth, 'x', mapElement?.offsetHeight)
    
    if (!mapElement) {
      console.error('❌ TestMap: Element not found')
      return
    }
    
    try {
      const view = new View({
        center: [0, 0],
        zoom: 2
      })
      
      mapInstance = new Map({
        target: 'test-map',
        layers: [
          new TileLayer({
            source: new OSM()
          })
        ],
        view: view
      })
      
      console.log('✅ TestMap: Initialized successfully')
      console.log('TestMap: Map instance:', mapInstance)
    } catch (error) {
      console.error('❌ TestMap: Failed:', error)
    }
  }, 200)
})

onUnmounted(() => {
  if (mapInstance) {
    mapInstance.setTarget(null)
    mapInstance = null
  }
})
</script>

<style scoped>
.test-map-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
}

.test-map {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>

