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

  // اگر در آینده نیاز بود از tile server استفاده کنیم، از این مقدار استفاده می‌کنیم
  const tileServerBase = resolveTileServerBase();
  void tileServerBase; // فعلا فقط برای جلوگیری از هشدار استفاده نشده

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
    console.log('Total imagery layers:', viewer.imageryLayers.length);
    
    // Verify the layer was added
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
      console.warn('⚠️ No imagery available, map will show as solid color');
    }
  }
  
  // 2. (موقتا غیرفعال) تلاش برای اضافه کردن نقشه آفلاین از tile server
  // برای پایدار شدن رفتار نقشه، فعلا فقط از OpenStreetMap / Satellite استفاده می‌کنیم
  // اگر لازم شد بعدا منطق نقشه آفلاین را دوباره (به‌صورت امن‌تر) فعال می‌کنیم.

  // Set scene mode to 3D (globe)
  viewer.scene.mode = Cesium.SceneMode.SCENE3D;
  console.log('Cesium scene mode set to 3D (globe)');

  // Enable lighting for 3D mode (optional, can be disabled if preferred)
  viewer.scene.globe.enableLighting = true;
  
  // اطمینان از اینکه globe نمایش داده می‌شود
  viewer.scene.globe.show = true;
  
  // Wait for imagery to load before setting view
  viewer.scene.globe.tileLoadProgressEvent.addEventListener((numberOfPendingLoads: number) => {
    if (numberOfPendingLoads > 0) {
      console.log(`Cesium tiles loading... (${numberOfPendingLoads} pending)`);
    } else {
      console.log('✅ All Cesium tiles loaded');
    }
  });
  
  // بررسی خطاهای tile loading
  viewer.scene.imageryLayers.layerRemoved.addEventListener(() => {
    console.warn('⚠️ An imagery layer was removed');
  });
  
  // بررسی اینکه آیا imagery layers وجود دارند (بعد از 2 ثانیه)
  setTimeout(() => {
    if (viewer.imageryLayers.length === 0) {
      console.error('❌ No imagery layers found! Adding fallback...');
      // اضافه کردن یک imagery layer ساده
      try {
        const fallbackImagery = new Cesium.UrlTemplateImageryProvider({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          maximumLevel: 19,
          credit: '© Esri'
        });
        viewer.imageryLayers.addImageryProvider(fallbackImagery);
        console.log('✅ Fallback imagery added');
      } catch (error) {
        console.error('❌ Failed to add fallback imagery:', error);
      }
    } else {
      console.log(`✅ Found ${viewer.imageryLayers.length} imagery layer(s)`);
    }
  }, 2000);
  
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

