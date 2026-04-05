import * as Cesium from 'cesium';

const ION_TOKEN = (import.meta as any).env?.VITE_CESIUM_ION_TOKEN as string | undefined;
const HAS_EXPLICIT_ION_TOKEN = !!(ION_TOKEN && ION_TOKEN.trim().length > 0);

if (HAS_EXPLICIT_ION_TOKEN) {
  Cesium.Ion.defaultAccessToken = ION_TOKEN.trim();
} else {
  console.warn('VITE_CESIUM_ION_TOKEN تعریف نشده است؛ امکانات Ion غیرفعال می‌ماند.');
}

const cleanupTasks: Array<() => void> = [];
const registerCleanup = (fn: () => void) => cleanupTasks.push(fn);

function runCleanup() {
  cleanupTasks.splice(0).forEach((fn) => {
    try {
      fn();
    } catch {
      // ignore cleanup failures
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
  baseMapId?: BaseMapId;
  offlineUrlTemplate?: string;
}

const PUBLIC_OSM_URL_TEMPLATE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

function normalizeCesiumUrlTemplate(template: string): string {
  return template.replace(/\{\-y\}/g, '{reverseY}');
}

function resolveImageryUrlTemplate(
  baseMapId?: BaseMapId,
  offlineUrlTemplate?: string,
): string | null {
  const id = String(baseMapId || 'osm');

  if (id === 'None') return null;

  if (id.startsWith('offline-')) {
    if (offlineUrlTemplate && offlineUrlTemplate.trim().length > 0) {
      return normalizeCesiumUrlTemplate(offlineUrlTemplate.trim());
    }
    console.warn('[Cesium] No url_template for', id, 'using public OSM until offline map is available.');
    return PUBLIC_OSM_URL_TEMPLATE;
  }

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

  try {
    viewer.imageryLayers.removeAll();
  } catch {
    // ignore
  }

  if (!selectedUrl) {
    console.log('Basemap set to None (no imagery layers).');
    return;
  }

  try {
    const isOsmTemplate = selectedUrl.includes('{s}.tile.openstreetmap.org');
    const imagery = new Cesium.UrlTemplateImageryProvider({
      url: selectedUrl,
      subdomains: isOsmTemplate ? ['a', 'b', 'c'] : undefined,
      maximumLevel: 19,
      credit: isOsmTemplate ? '© OpenStreetMap contributors' : 'Basemap',
    });
    viewer.imageryLayers.addImageryProvider(imagery);
    console.log('Basemap imagery applied:', config.baseMapId || 'default', '->', selectedUrl);
  } catch (error) {
    console.warn('Failed to apply basemap imagery.', error);
  }
}

function addOpenStreetMapFallback(viewer: Cesium.Viewer, reason: string) {
  try {
    const osmImagery = new Cesium.UrlTemplateImageryProvider({
      url: PUBLIC_OSM_URL_TEMPLATE,
      subdomains: ['a', 'b', 'c'],
      maximumLevel: 19,
      credit: '© OpenStreetMap contributors',
    });
    viewer.imageryLayers.addImageryProvider(osmImagery);
    console.log(`OpenStreetMap imagery provider added successfully (${reason})`);
  } catch (error) {
    console.error('Failed to add OpenStreetMap imagery:', error);
  }
}

export function createCesiumViewer(containerId: string, config: CesiumBaseMapConfig = {}): Cesium.Viewer {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container with id "${containerId}" not found`);
  }

  const viewer = new Cesium.Viewer(container, {
    terrainProvider: new Cesium.EllipsoidTerrainProvider(),
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    animation: false,
    timeline: false,
    fullscreenButton: false,
    vrButton: false,
    selectionIndicator: true,
    infoBox: true,
    shouldAnimate: true,
    requestRenderMode: false,
  });

  installViewerCleanup(viewer);
  viewer.imageryLayers.removeAll();

  applyBasemapImagery(viewer, config);

  if (viewer.imageryLayers.length === 0 && config.baseMapId !== 'None') {
    if (HAS_EXPLICIT_ION_TOKEN) {
      Cesium.IonImageryProvider.fromAssetId(3)
        .then((ionImagery) => {
          viewer.imageryLayers.addImageryProvider(ionImagery);
          console.log('Cesium Ion World Imagery added as fallback base layer');
        })
        .catch((error) => {
          console.error('Failed to add Cesium Ion imagery, falling back to OSM:', error);
          addOpenStreetMapFallback(viewer, 'Ion fallback');
        });
    } else {
      console.log('Skipping Cesium Ion imagery fallback because no explicit token is configured.');
      addOpenStreetMapFallback(viewer, 'non-Ion fallback');
    }
  }

  viewer.scene.mode = Cesium.SceneMode.SCENE3D;
  console.log('Cesium scene mode set to 3D (globe)');

  viewer.scene.globe.enableLighting = true;
  viewer.scene.globe.show = true;

  let lastTileLoadState = -1;
  viewer.scene.globe.tileLoadProgressEvent.addEventListener((numberOfPendingLoads: number) => {
    const nextState = numberOfPendingLoads > 0 ? 1 : 0;
    if (nextState === lastTileLoadState) return;
    lastTileLoadState = nextState;

    if (numberOfPendingLoads > 0) {
      console.log(`Cesium tiles loading... (${numberOfPendingLoads} pending)`);
    } else {
      console.log('All Cesium tiles loaded');
    }
  });

  viewer.scene.imageryLayers.layerRemoved.addEventListener(() => {
    console.warn('An imagery layer was removed');
  });

  setTimeout(() => {
    if (viewer.imageryLayers.length === 0 && config.baseMapId !== 'None') {
      console.error('No imagery layers found, adding fallback...');
      addOpenStreetMapFallback(viewer, 'late fallback');
    } else {
      console.log(`Found ${viewer.imageryLayers.length} imagery layer(s)`);
    }
  }, 2000);

  viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();

  if (HAS_EXPLICIT_ION_TOKEN) {
    Cesium.createWorldTerrainAsync({
      requestVertexNormals: true,
      requestWaterMask: true,
    })
      .then((terrainProvider) => {
        viewer.terrainProvider = terrainProvider;
        console.log('Cesium World Terrain enabled via Ion');
      })
      .catch((error) => {
        console.warn('Failed to enable World Terrain. Using ellipsoid terrain instead:', error);
      });
  } else {
    console.log('Skipping Cesium World Terrain because no explicit Ion token is configured.');
  }

  const creditContainer = viewer.cesiumWidget.creditContainer as HTMLElement;
  if (creditContainer) {
    creditContainer.style.display = 'none';
  }

  viewer.scene.globe.depthTestAgainstTerrain = true;
  setupDraggableEntities(viewer);

  return viewer;
}

function setupDraggableEntities(viewer: Cesium.Viewer) {
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  let pickedEntity: Cesium.Entity | undefined;

  handler.setInputAction((click: any) => {
    const pickedObject = viewer.scene.pick(click.position);
    if (Cesium.defined(pickedObject) && pickedObject.id instanceof Cesium.Entity) {
      pickedEntity = pickedObject.id as Cesium.Entity;
      viewer.scene.screenSpaceCameraController.enableInputs = false;
    }
  }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

  handler.setInputAction((movement: any) => {
    if (!pickedEntity) return;
    const ray = viewer.camera.getPickRay(movement.endPosition);
    if (!ray) return;
    const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
    if (cartesian) {
      pickedEntity.position = new Cesium.ConstantPositionProperty(cartesian) as any;
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

  handler.setInputAction(() => {
    if (!pickedEntity) return;
    pickedEntity = undefined;
    viewer.scene.screenSpaceCameraController.enableInputs = true;
  }, Cesium.ScreenSpaceEventType.LEFT_UP);
}

export type { Viewer as CesiumViewer } from 'cesium';
