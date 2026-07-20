import * as ol from 'ol'

export default async services => {
  console.log('🗺️ view.js: Creating map view...', { services: !!services, sessionStore: !!services?.sessionStore, emitter: !!services?.emitter })
  const { sessionStore, emitter } = services
  
  if (!sessionStore) {
    console.error('❌ view.js: sessionStore is missing!')
    throw new Error('sessionStore is required')
  }
  
  const viewport = await sessionStore.get('viewport', sessionStore.DEFAULT_VIEWPORT)
  console.log('📐 view.js: Viewport settings:', viewport)
  const view = new ol.View({ ...viewport })
  console.log('✅ view.js: Map view created', view)

  view.on('change', ({ target: view }) => {
    sessionStore.put('viewport', {
      center: view.getCenter(),
      resolution: view.getResolution(),
      zoom: view.getZoom(),
      rotation: view.getRotation()
    })
  })

  emitter.on('map/flyto', ({ center }) => {
    const duration = 2000
    const zoom = view.getZoom()
    view.animate({ center, duration })
    view.animate(
      { zoom: zoom - 1, duration: duration / 2 },
      { zoom, duration: duration / 2 }
    )
  })

  emitter.on('map/goto', ({ center, resolution, rotation }) => {
    const duration = 1000
    view.animate({ center, resolution, rotation, duration })
  })

  return view
}
