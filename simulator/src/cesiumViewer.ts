import * as Cesium from 'cesium';

// Simple terrain-aware "gravity" tuning
// Constants mostly removed or unused


// تنظیم Cesium Ion access token (توکن کاربر) از env
const ION_TOKEN = (import.meta as any).env?.VITE_CESIUM_ION_TOKEN as string | undefined;
if (ION_TOKEN && ION_TOKEN.trim().length > 0) {
  Cesium.Ion.defaultAccessToken = ION_TOKEN.trim();
} else {
  console.warn('⚠️ VITE_CESIUM_ION_TOKEN تعریف نشده است؛ امکانات Ion در دسترس نخواهد بود.');
}

// Global variables for model entities
// Demo variables removed


const cleanupTasks: Array<() => void> = [];
const registerCleanup = (fn: () => void) => cleanupTasks.push(fn);
function runCleanup() {
  cleanupTasks.splice(0).forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}
function installViewerCleanup(viewer: Cesium.Viewer) {
  if (typeof window === 'undefined') return;
  if ((viewer as any)._cleanupHookAttached) return;
  const handler = () => runCleanup();
  window.addEventListener('unload', handler);
  registerCleanup(() => window.removeEventListener('unload', handler));
  (viewer as any)._cleanupHookAttached = true;
}

export type BaseMapId =
  | 'osm'
  | 'osm-de'
  | 'grayBasemap'
  | 'openTopoMap'
  | 'esriWorldImagery'
  | 'kartverketTopo4'
  | 'None'
  | `offline-${number}`
  | string;

export interface CesiumBaseMapConfig {
  /** Base map chosen in KalkNegar scenario settings. */
  baseMapId?: BaseMapId;
  /**
   * Optional URL template to use when baseMapId is "offline-<id>".
   * Commonly comes from backend `OfflineMap.url_template`.
   */
  offlineUrlTemplate?: string;
}

/** Global OSM raster tiles (same layer name `osm` as in KalkNegar; mapConfig lists a local copy for offline editing only). */
const PUBLIC_OSM_URL_TEMPLATE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

function normalizeCesiumUrlTemplate(template: string): string {
  // OpenLayers uses {-y} for TMS; Cesium uses {reverseY}.
  return template.replace(/\{\-y\}/g, '{reverseY}');
}

function resolveImageryUrlTemplate(
  baseMapId?: BaseMapId,
  offlineUrlTemplate?: string
): string | null {
  const id = String(baseMapId || 'osm');

  if (id === 'None') return null;

  // Offline maps registered via dashboard are named "offline-<id>" in KalkNegar.
  if (id.startsWith('offline-')) {
    if (offlineUrlTemplate && offlineUrlTemplate.trim().length > 0) {
      return normalizeCesiumUrlTemplate(offlineUrlTemplate.trim());
    }
    console.warn(
      '[Cesium] No url_template for',
      id,
      '— using public OSM until the offline map is available from the API.'
    );
    return PUBLIC_OSM_URL_TEMPLATE;
  }

  // Keep ids aligned with `front_kalknegar/public/config/mapConfig.json` (names / baseMapId).
  // Use public OSM here so the simulator works without a local TileServer on :8480.
  switch (id) {
    case 'osm':
      return PUBLIC_OSM_URL_TEMPLATE;
    case 'osm-de':
      return 'https://tile.openstreetmap.de/{z}/{x}/{y}.png';
    case 'grayBasemap':
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
    case 'openTopoMap':
      return 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png';
    case 'esriWorldImagery':
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    case 'kartverketTopo4':
      return 'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png';
    default:
      return null;
  }
}

export function applyBasemapImagery(viewer: Cesium.Viewer, config: CesiumBaseMapConfig = {}): void {
  const selectedUrl = resolveImageryUrlTemplate(config.baseMapId, config.offlineUrlTemplate);

  // Clear imagery layers; keep terrain untouched.
  try {
    viewer.imageryLayers.removeAll();
  } catch {}

  if (!selectedUrl) {
    console.log('🗺️ Basemap set to None (no imagery layers).');
    return;
  }

  try {
    const isOsmTemplate = selectedUrl.includes('{s}.tile.openstreetmap.org');
    const imagery = new Cesium.UrlTemplateImageryProvider({
      url: selectedUrl,
      subdomains: isOsmTemplate ? ['a', 'b', 'c'] : undefined,
      maximumLevel: 19,
      credit: isOsmTemplate ? '© OpenStreetMap contributors' : 'Basemap'
    });
    viewer.imageryLayers.addImageryProvider(imagery);
    console.log('✅ Basemap imagery applied (live):', config.baseMapId || 'default', '→', selectedUrl);
  } catch (e) {
    console.warn('⚠️ Failed to apply basemap imagery (live).', e);
  }
}



export function createCesiumViewer(containerId: string, config: CesiumBaseMapConfig = {}): Cesium.Viewer {
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
    shouldAnimate: true, // keep Cesium clock running so model animations play
    requestRenderMode: false, // Ensure continuous rendering
  });
  installViewerCleanup(viewer);

  // Remove default imagery layer (Bing Maps or other default)
  viewer.imageryLayers.removeAll();

  applyBasemapImagery(viewer, config);

  // Fallback imagery using Cesium Ion World Imagery (only if we still have none)
  if (viewer.imageryLayers.length === 0) {
    Cesium.IonImageryProvider.fromAssetId(3)
      .then((ionImagery) => {
        viewer.imageryLayers.addImageryProvider(ionImagery);
        console.log('✅ Cesium Ion World Imagery added as fallback base layer');
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
  }

  // Set scene mode to 3D (globe)
  viewer.scene.mode = Cesium.SceneMode.SCENE3D;
  console.log('Cesium scene mode set to 3D (globe)');

  // Enable lighting for 3D mode (optional, can be disabled if preferred)
  viewer.scene.globe.enableLighting = true;

  // اطمینان از اینکه globe نمایش داده می‌شود
  viewer.scene.globe.show = true;

  // Wait for imagery to load before setting view
  let lastTileLoadState = -1;
  viewer.scene.globe.tileLoadProgressEvent.addEventListener((numberOfPendingLoads: number) => {
    const nextState = numberOfPendingLoads > 0 ? 1 : 0;
    if (nextState === lastTileLoadState) return;
    lastTileLoadState = nextState;

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

  // Default view is now handled by the scenario or stays at global view until data loads.
  // Debug code for Tehran pin and tank model has been removed.

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

  // Occlusion: units behind terrain are hidden realistically
  viewer.scene.globe.depthTestAgainstTerrain = true;

  // Allow drag-nd-drop of entities (Sandtable style planning)
  setupDraggableEntities(viewer);

  return viewer;
}

/**
 * Adds drag-and-drop interaction for any pickable entity on the globe.
 */
function setupDraggableEntities(viewer: Cesium.Viewer) {
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  let pickedEntity: Cesium.Entity | undefined = undefined;

  // Select entity on left down
  handler.setInputAction(function (click: any) {
    const pickedObject = viewer.scene.pick(click.position);
    if (Cesium.defined(pickedObject) && pickedObject.id instanceof Cesium.Entity) {
      pickedEntity = pickedObject.id as Cesium.Entity;
      viewer.scene.screenSpaceCameraController.enableInputs = false; // Disable camera to drag
    }
  }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

  // Move entity while mouse moves
  handler.setInputAction(function (movement: any) {
    if (pickedEntity) {
      const ray = viewer.camera.getPickRay(movement.endPosition);
      if (ray) {
        // Pick against globe (terrain)
        const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        if (cartesian) {
          pickedEntity.position = new Cesium.ConstantPositionProperty(cartesian) as any;
        }
      }
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

  // Release entity
  handler.setInputAction(function () {
    if (pickedEntity) {
      pickedEntity = undefined;
      viewer.scene.screenSpaceCameraController.enableInputs = true; // Re-enable camera
    }
  }, Cesium.ScreenSpaceEventType.LEFT_UP);
}

export type { Viewer as CesiumViewer } from 'cesium';

