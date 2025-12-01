import * as Cesium from 'cesium';

// Set Cesium Ion access token (you can get a free token from cesium.com)
// For now, we'll use OpenStreetMap which doesn't require a token
// If you want to use Cesium Ion imagery, get a free token from https://cesium.com/ion/
// Cesium.Ion.defaultAccessToken = 'YOUR_TOKEN_HERE';

// Helper function to resolve tile server base URL (same as dashboard)
const resolveTileServerBase = (): string => {
  const raw = (import.meta as any).env?.VITE_TILESERVER_URL as string | undefined;
  if (raw && raw.trim().length > 0) {
    return raw.trim().replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:8480`;
  }
  return 'http://127.0.0.1:8480';
};

export function createCesiumViewer(containerId: string): Cesium.Viewer {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container with id "${containerId}" not found`);
  }

  // Create Cesium Viewer without default imagery (we'll add it manually)
  const viewer = new Cesium.Viewer(container, {
    terrainProvider: new Cesium.EllipsoidTerrainProvider(),
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false, // Disable home button
    sceneModePicker: false, // Disable mode picker since we're using 3D
    navigationHelpButton: false,
    animation: false,
    timeline: false,
    fullscreenButton: false, // Disable fullscreen button
    vrButton: false,
    selectionIndicator: true,
    infoBox: true,
    shouldAnimate: false,
    requestRenderMode: false, // Ensure continuous rendering
  });
  
  // Remove default imagery layer (Bing Maps or other default)
  viewer.imageryLayers.removeAll();

  const tileServerBase = resolveTileServerBase();

  // Add map layers from dashboard (same as dashboard mapSlice.ts)
  // Strategy: Add OpenStreetMap first (always works), then try to add offline map on top
  
  // 1. Add OpenStreetMap as base layer (always works, good fallback)
  try {
    const osmImagery = new Cesium.UrlTemplateImageryProvider({
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c'],
      maximumLevel: 19,
      credit: '© OpenStreetMap contributors'
    });
    viewer.imageryLayers.addImageryProvider(osmImagery);
    console.log('✅ OpenStreetMap imagery provider added successfully');
    
    // Verify the layer was added
    console.log('Total imagery layers:', viewer.imageryLayers.length);
    viewer.imageryLayers.layerAdded.addEventListener(() => {
      console.log('✅ Imagery layer added event fired');
    });
  } catch (osmError) {
    console.error('❌ Failed to add OpenStreetMap imagery:', osmError);
    
    // Fallback: Try satellite imagery
    try {
      const satelliteImagery = new Cesium.UrlTemplateImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maximumLevel: 19,
        credit: '© Esri'
      });
      viewer.imageryLayers.addImageryProvider(satelliteImagery);
      console.log('✅ Satellite imagery added as fallback');
    } catch (satError) {
      console.error('❌ All imagery providers failed:', satError);
    }
  }
  
  // 2. Try to add offline map from tile server (if available, will be on top)
  // Note: Cesium uses standard Web Mercator (Y from top), tile server uses TMS (Y from bottom)
  // We need to create a custom imagery provider that flips Y coordinate
  // First, check if tile server is accessible
  const checkTileServer = async () => {
    try {
      const healthUrl = `${tileServerBase}/health`;
      const response = await fetch(healthUrl);
      if (response.ok) {
        console.log('✅ Tile server is accessible:', tileServerBase);
        return true;
      }
    } catch (error) {
      console.warn('⚠️ Tile server not accessible, using OpenStreetMap:', error);
    }
    return false;
  };
  
  // Try to add offline map
  checkTileServer().then((isAvailable) => {
    if (isAvailable) {
      try {
        const mapFilename = 'maps'; // Default map name (without .mbtiles extension)
        const tileServerUrl = `${tileServerBase}/data/${mapFilename}/{z}/{x}/{y}.png`;
        
        // Create a custom imagery provider that handles TMS Y coordinate flipping
        class TMSImageryProvider extends Cesium.UrlTemplateImageryProvider {
          constructor(options: any) {
            super(options);
          }
          
          requestImage(x: number, y: number, level: number): any {
            // Flip Y coordinate for TMS: TMS Y = (2^level - 1) - Web Mercator Y
            const tmsY = Math.pow(2, level) - 1 - y;
            const url = this.url
              .replace('{z}', String(level))
              .replace('{x}', String(x))
              .replace('{y}', String(tmsY));
            
            // Use the parent's requestImage with the flipped Y
            return Cesium.ImageryProvider.loadImage(this, url);
          }
        }
        
        const offlineImagery = new TMSImageryProvider({
          url: tileServerUrl,
          maximumLevel: 19,
          credit: 'نقشه آفلاین',
          tilingScheme: new Cesium.WebMercatorTilingScheme(),
        });
        
        // Add offline map and make it the base layer (remove OpenStreetMap if offline works)
        viewer.imageryLayers.addImageryProvider(offlineImagery);
        
        // Monitor if offline map loads successfully
        viewer.scene.globe.tileLoadProgressEvent.addEventListener(() => {
          // Check if offline map tiles are loading
          const layers = viewer.imageryLayers;
          if (layers.length > 1) {
            // Offline map is on top, hide OpenStreetMap
            const osmLayer = layers.get(0);
            if (osmLayer) {
              // Check if it's OpenStreetMap by checking the URL pattern
              const provider = osmLayer.imageryProvider as any;
              if (provider && provider.url && provider.url.includes('openstreetmap.org')) {
                osmLayer.show = false;
                console.log('✅ نقشه آفلاین فعال شد - OpenStreetMap به عنوان fallback نگه داشته شد');
              }
            }
          }
        });
        
        console.log('🔄 در حال تلاش برای بارگذاری نقشه آفلاین:', tileServerUrl);
      } catch (error) {
        console.warn('❌ خطا در افزودن نقشه آفلاین (از OpenStreetMap استفاده می‌شود):', error);
      }
    } else {
      console.log('ℹ️ نقشه آنلاین (OpenStreetMap) در حال استفاده است');
    }
  });

  // Set scene mode to 3D (globe)
  viewer.scene.mode = Cesium.SceneMode.SCENE3D;
  console.log('Cesium scene mode set to 3D (globe)');

  // Enable lighting for 3D mode (optional, can be disabled if preferred)
  viewer.scene.globe.enableLighting = true;
  
  // Wait for imagery to load before setting view
  viewer.scene.globe.tileLoadProgressEvent.addEventListener(() => {
    console.log('Cesium tiles loading...');
  });
  
  // Set initial view for 2D mode after a short delay to ensure scene is ready
  setTimeout(() => {
    const centerLongitude = 51.3890;
    const centerLatitude = 35.6892;
    
    try {
      // For 3D mode, use setView with Cartesian3
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(centerLongitude, centerLatitude, 10000000.0),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-90),
          roll: 0.0
        }
      });
      console.log('Cesium camera set to 3D view');
      
      // Force a render to ensure the map is displayed
      viewer.scene.requestRender();
    } catch (err) {
      console.error('Error setting Cesium camera view:', err);
      // Fallback: try with Cartesian3
      try {
        const cartesian = Cesium.Cartesian3.fromDegrees(centerLongitude, centerLatitude, 0);
        viewer.camera.setView({
          destination: cartesian
        });
        viewer.scene.requestRender();
        console.log('Cesium camera set using fallback method');
      } catch (fallbackErr) {
        console.error('Fallback camera setting also failed:', fallbackErr);
      }
    }
  }, 100);

  // For 3D mode, enable terrain (optional - can use EllipsoidTerrainProvider for flat terrain)
  // viewer.terrainProvider = Cesium.createWorldTerrain(); // Uncomment for real terrain
  viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider(); // Using flat terrain for now

  // Hide Cesium attribution/logo
  const creditContainer = viewer.cesiumWidget.creditContainer as HTMLElement;
  if (creditContainer) {
    creditContainer.style.display = 'none';
  }
  
  // Sample entities removed - you can add your own entities here as needed

  // Enable auto-rotation for the globe
  let autoRotationEnabled = true;
  let rotationSpeed = 0.0002; // Rotation speed (radians per frame)
  let isUserInteracting = false;
  
  // Track user interaction to pause auto-rotation
  viewer.cesiumWidget.screenSpaceEventHandler.setInputAction(() => {
    isUserInteracting = true;
    setTimeout(() => {
      isUserInteracting = false;
    }, 2000); // Resume auto-rotation after 2 seconds of no interaction
  }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
  
  viewer.cesiumWidget.screenSpaceEventHandler.setInputAction(() => {
    isUserInteracting = true;
    setTimeout(() => {
      isUserInteracting = false;
    }, 2000);
  }, Cesium.ScreenSpaceEventType.MIDDLE_DOWN);
  
  viewer.cesiumWidget.screenSpaceEventHandler.setInputAction(() => {
    isUserInteracting = true;
    setTimeout(() => {
      isUserInteracting = false;
    }, 2000);
  }, Cesium.ScreenSpaceEventType.RIGHT_DOWN);
  
  // Function to handle auto-rotation around vertical axis (North-South axis)
  function rotateGlobe() {
    if (autoRotationEnabled && 
        viewer.scene.mode === Cesium.SceneMode.SCENE3D && 
        !isUserInteracting) {
      // Rotate the camera around the globe's vertical axis (North-South)
      // Simply rotate the camera around the Z-axis (vertical axis)
      viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, rotationSpeed);
    }
  }
  
  // Start auto-rotation using Cesium's render loop
  viewer.scene.postRender.addEventListener(rotateGlobe);
  
  // Zoom controls are enabled by default in Cesium
  // Mouse wheel: scroll to zoom in/out
  // Touch: pinch to zoom (on mobile devices)
  // The default Cesium zoom behavior should work without additional configuration
  console.log('Zoom controls enabled (mouse wheel and touch pinch - default Cesium behavior)');
  
  // Export controls for external use
  (viewer as any).setAutoRotation = (enabled: boolean) => {
    autoRotationEnabled = enabled;
  };
  
  (viewer as any).setRotationSpeed = (speed: number) => {
    rotationSpeed = speed;
  };
  
  console.log('Cesium viewer created successfully with auto-rotation and zoom controls');

  return viewer;
}

export type { Viewer as CesiumViewer } from 'cesium';

