import * as Cesium from 'cesium';

// تنظیم Cesium Ion access token (توکن کاربر)
Cesium.Ion.defaultAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxZDc3NTY2Ni0wN2E0LTQ1MzMtYWY3OC02NTlhMzgxNDNhNTEiLCJpZCI6MzY1NDQ2LCJpYXQiOjE3NjQ1Nzg2MDB9.tY9HMk_DfrqUhMPnsvjWR_EoCFAv6No8lkyZwJTvJdY';

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

  // آدرس پایه tile server برای نقشه‌های آفلاین
  const tileServerBase = resolveTileServerBase();

  // Add base imagery using Cesium Ion World Imagery (به‌جای OpenStreetMap)
  Cesium.IonImageryProvider.fromAssetId(3)
    .then((ionImagery) => {
      viewer.imageryLayers.addImageryProvider(ionImagery);
      console.log('✅ Cesium Ion World Imagery added as base layer');
    })
    .catch((ionError) => {
      console.error('❌ Failed to add Cesium Ion imagery, falling back to OSM:', ionError);

      // Fallback: OpenStreetMap به‌صورت آنلاین
      try {
        const osmImagery = new Cesium.UrlTemplateImageryProvider({
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          subdomains: ['a', 'b', 'c'],
          maximumLevel: 19,
          credit: '© OpenStreetMap contributors'
        });
        viewer.imageryLayers.addImageryProvider(osmImagery);
        console.log('✅ OpenStreetMap imagery provider added successfully (fallback)');
      } catch (osmError) {
        console.error('❌ Failed to add OpenStreetMap imagery:', osmError);
      }
    });

  // 2. افزودن لایه نقشه آفلاین (اگر tileserver در حال اجرا باشد)
  try {
    const offlineUrl = `${tileServerBase}/data/maps.mbtiles/{z}/{x}/{y}.png`;
    const offlineImagery = new Cesium.UrlTemplateImageryProvider({
      url: offlineUrl,
      maximumLevel: 19,
      credit: 'نقشه آفلاین'
    });
    // لایه آفلاین را به‌عنوان لایه بالایی اضافه می‌کنیم، بدون دست‌کاری لایه OSM
    viewer.imageryLayers.addImageryProvider(offlineImagery);
    console.log('✅ Offline imagery layer added on top of base map:', offlineUrl);
  } catch (offlineError) {
    console.warn('⚠️ Failed to add offline imagery layer, continuing with online maps:', offlineError);
  }

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

  // --- پین تستی ساده روی ایران (مثلاً تهران) ---
  try {
    const tehranPosition = Cesium.Cartesian3.fromDegrees(51.3890, 35.6892, 0);
    viewer.entities.add({
      id: 'debug-tehran-pin',
      position: tehranPosition,
      point: {
        pixelSize: 14,
        color: Cesium.Color.LIME,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
      label: {
        text: 'تهران (تستی)',
        font: '18px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -20),
      },
    });
    console.log('✅ Debug pin for Tehran added');
  } catch (e) {
    console.error('Failed to add debug Tehran pin:', e);
  }
  
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

  // For 3D mode, enable terrain
  // ابتدا از EllipsoidTerrainProvider به‌عنوان fallback استفاده می‌کنیم
  viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();

  // سپس تلاش می‌کنیم World Terrain را از طریق Cesium Ion فعال کنیم
  Cesium
    .createWorldTerrainAsync({
      requestVertexNormals: true,
      requestWaterMask: true,
    })
    .then((terrainProvider) => {
      viewer.terrainProvider = terrainProvider;
      console.log('✅ Cesium World Terrain enabled via Ion');
    })
    .catch((error) => {
      console.warn('⚠️ Failed to enable World Terrain. Using ellipsoid terrain instead:', error);
      // در صورت خطا همان EllipsoidTerrainProvider باقی می‌ماند
    });

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

