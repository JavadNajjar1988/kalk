export default async services => {
  console.log('🗺️ tileLayers.js: Creating tile layers...', { services: !!services, tileLayerStore: !!services?.tileLayerStore })
  const { tileLayerStore } = services
  
  if (!tileLayerStore) {
    console.error('❌ tileLayers.js: tileLayerStore is missing!')
    throw new Error('tileLayerStore is required')
  }
  
  try {
    const layers = await tileLayerStore.tileLayers()
    console.log('✅ tileLayers.js: Tile layers created', { 
      isArray: Array.isArray(layers),
      count: Array.isArray(layers) ? layers.length : 'not array',
      layers: layers,
      layerDetails: Array.isArray(layers) ? layers.map((l, i) => ({
        index: i,
        type: l?.constructor?.name,
        layersCount: l?.getLayers?.()?.getLength?.() || 'N/A'
      })) : []
    })
    
    if (!Array.isArray(layers) || layers.length === 0) {
      console.warn('⚠️ tileLayers.js: No tile layers returned, this might cause issues')
    }
    
    return layers
  } catch (error) {
    console.error('❌ tileLayers.js: Failed to create tile layers:', error)
    console.error('❌ tileLayers.js: Error stack:', error.stack)
    throw error
  }
}
