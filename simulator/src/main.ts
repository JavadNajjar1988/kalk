import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, Color3, Color4 } from '@babylonjs/core';
import '@babylonjs/core/Helpers/sceneHelpers';
import { CoordinateConverter } from './coordinateConverter';
import * as Cesium from 'cesium';

// Get scenario ID and token from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const scenarioId = urlParams.get('scenarioId');
const tokenFromUrl = urlParams.get('token');

// اگر token در URL بود، آن را در localStorage ذخیره کن
if (tokenFromUrl) {
  console.log('%c🔐 Token received from Dashboard, storing in localStorage', 'color: #4CAF50; font-weight: bold;');
  localStorage.setItem('access_token', tokenFromUrl);

  // پاک کردن token از URL برای امنیت (تا در history باقی نماند)
  const newUrl = new URL(window.location.href);
  newUrl.searchParams.delete('token');
  window.history.replaceState({}, '', newUrl.toString());
  console.log('%c✅ Token stored and removed from URL', 'color: #4CAF50;');
}

// ========== DEBUG START ==========
console.log('%c=== KALK SIMULATOR DEBUG INFO ===', 'background: #222; color: #bada55; font-size: 14px; font-weight: bold; padding: 10px;');
console.log('%c1. Current URL:', 'color: #4CAF50; font-weight: bold;', window.location.href);
console.log('%c2. Scenario ID from URL:', 'color: #2196F3; font-weight: bold;', scenarioId || '❌ NOT FOUND');
console.log('%c3. Token from URL:', 'color: #9C27B0; font-weight: bold;', tokenFromUrl ? '✅ RECEIVED' : '❌ NOT PROVIDED');
console.log('%c4. Has access token (localStorage):', 'color: #FF9800; font-weight: bold;', !!localStorage.getItem('access_token') ? '✅ YES' : '❌ NO');
console.log('%c5. Access token value:', 'color: #9C27B0;', localStorage.getItem('access_token')?.substring(0, 50) + '...' || 'null');
console.log('%c6. API Base URL (env):', 'color: #F44336; font-weight: bold;', (import.meta as any).env?.VITE_API_URL || '⚠️ Using default');
console.log('%c================================', 'background: #222; color: #bada55; font-size: 14px; padding: 10px;');
// ========== DEBUG END ==========

if (scenarioId) {
  console.log('%c✅ Loading scenario:', 'color: green; font-weight: bold;', scenarioId);
} else {
  console.warn('%c⚠️ No scenarioId in URL! Will load all scenarios as fallback', 'color: orange; font-weight: bold;');
}

// Get the canvas element
const canvasElement = document.getElementById('renderCanvas');
if (!canvasElement || !(canvasElement instanceof HTMLCanvasElement)) {
  throw new Error('Canvas element not found');
}
const canvas = canvasElement;

// Check if splash has been shown before
const SPLASH_SHOWN_KEY = 'kalk_simulator_splash_shown';
// Splash screen is currently disabled
const hasSplashBeenShown = true; // Always skip splash screen

// Get splash screen elements
const splashScreen = document.getElementById('splashScreen');
const splashVideoElement = document.getElementById('splashVideo');
const splashVideo = splashVideoElement instanceof HTMLVideoElement ? splashVideoElement : null;

// Get header element
const header = document.getElementById('header');
const backToDashboardButton = document.getElementById('backToDashboard');

// Get main container
const mainContainer = document.getElementById('mainContainer');

// Function to hide splash screen and show containers
function hideSplashScreen() {
  if (hideSplashScreen.called) return; // Prevent multiple calls
  hideSplashScreen.called = true;

  // Mark splash as shown in localStorage
  localStorage.setItem(SPLASH_SHOWN_KEY, 'true');

  if (splashScreen) {
    splashScreen.classList.add('hidden');
    setTimeout(() => {
      splashScreen.style.display = 'none';
      if (mainContainer) {
        mainContainer.classList.add('visible');
      }
      if (canvas) {
        canvas.classList.add('visible');
      }
      // Show header after splash is hidden
      if (header) {
        header.classList.add('visible');
      }
      // Initialize main scene after splash is hidden
      initializeMainScene();
    }, 500); // Wait for fade out animation
  } else {
    // If splash screen doesn't exist, just show containers
    if (mainContainer) {
      mainContainer.classList.add('visible');
    }
    if (canvas) {
      canvas.classList.add('visible');
    }
    if (header) {
      header.classList.add('visible');
    }
    initializeMainScene();
  }
}
hideSplashScreen.called = false; // Initialize flag

// Function to initialize main scene (can be called after splash)
function initializeMainScene() {
  // Scene is already set up, but we can add any post-splash initialization here
  // For example, start animations, enable interactions, etc.
  console.log('Main scene initialized');

  // Example: Add rotation animation to objects
  scene.meshes.forEach(mesh => {
    if (mesh.name === 'box' || mesh.name === 'sphere' || mesh.name === 'cylinder' || mesh.name === 'torus') {
      scene.registerBeforeRender(() => {
        mesh.rotation.y += 0.01;
      });
    }
  });
}

// Create Babylon.js engine with transparent background
const engine = new Engine(canvas, true, {
  preserveDrawingBuffer: true,
  stencil: true,
  alpha: true, // Enable alpha channel for transparency
});

// Create scene
const scene = new Scene(engine);

// Create camera - will be synced with Cesium camera
const camera = new ArcRotateCamera(
  'camera',
  -Math.PI / 2,
  Math.PI / 2.5,
  10,
  Vector3.Zero(),
  scene
);

// Set camera as active camera
scene.activeCamera = camera;

// Don't attach controls to canvas - we'll sync with Cesium camera instead
// camera.attachControl(canvas, true);

// Create main scene setup function
function setupMainScene() {
  // Clear existing meshes (if any)
  scene.meshes.forEach(mesh => {
    if (mesh.name !== 'camera' && mesh.name !== '__root__') {
      mesh.dispose();
    }
  });

  // Create environment lighting
  const hemisphericLight = new HemisphericLight('hemisphericLight', new Vector3(0, 1, 0), scene);
  hemisphericLight.intensity = 0.8;
  hemisphericLight.diffuse = new Color3(1, 1, 1);
  hemisphericLight.specular = new Color3(0.5, 0.5, 0.5);

  // Create directional light for better shadows
  const directionalLight = new HemisphericLight('directionalLight', new Vector3(-1, -1, -1), scene);
  directionalLight.intensity = 0.5;

  // Make Babylon.js scene transparent so Cesium shows through
  scene.clearColor = new Color4(0, 0, 0, 0); // Transparent background

  // (Babylon placeholder geometry removed; Cesium handles models instead)
}

// Setup main scene - will be called again after Cesium is initialized
// setupMainScene(); // Commented out - will be called after Cesium is ready

// Variables for splash screen logic
const SPLASH_MIN_DURATION = 11000; // 11 seconds in milliseconds
let sceneReady = false;
let videoFinished = false;
let hideTimeout: number | null = null;
let splashStartTime: number | null = null;
let splashInitialized = false;

// Initialize splash start time when splash is actually shown
function initializeSplashTimer() {
  if (!splashInitialized && !hasSplashBeenShown) {
    splashStartTime = Date.now();
    splashInitialized = true;
    console.log('Splash timer started at:', new Date(splashStartTime).toISOString());
  }
}

// Check if both scene and video are ready, and minimum time has passed
function checkReady() {
  if (hideTimeout !== null) return; // Already scheduled to hide
  if (hasSplashBeenShown) return; // Splash already shown, skip
  if (splashStartTime === null) {
    // Initialize timer if not already done
    initializeSplashTimer();
    // Continue checking even if timer wasn't initialized
  }

  const elapsedTime = splashStartTime ? Date.now() - splashStartTime : 0;
  const minTimePassed = elapsedTime >= SPLASH_MIN_DURATION;

  console.log(`checkReady called - sceneReady: ${sceneReady}, videoFinished: ${videoFinished}, elapsed: ${elapsedTime}ms, minPassed: ${minTimePassed}`);

  // If minimum time has passed, hide splash regardless of scene/video status
  if (minTimePassed && (sceneReady || videoFinished)) {
    console.log(`Splash displayed for ${elapsedTime}ms (>= ${SPLASH_MIN_DURATION}ms), hiding now`);
    hideSplashScreen();
    return;
  }

  if (sceneReady && videoFinished) {
    if (minTimePassed) {
      console.log(`Splash displayed for ${elapsedTime}ms (>= ${SPLASH_MIN_DURATION}ms), hiding now`);
      hideSplashScreen();
    } else {
      // Wait for minimum time to pass
      const remainingTime = SPLASH_MIN_DURATION - elapsedTime;
      console.log(`Splash displayed for ${elapsedTime}ms, needs ${remainingTime}ms more to reach minimum duration`);
      hideTimeout = window.setTimeout(() => {
        const finalElapsed = Date.now() - (splashStartTime || Date.now());
        console.log(`Splash displayed for ${finalElapsed}ms (>= ${SPLASH_MIN_DURATION}ms), hiding now`);
        hideSplashScreen();
      }, remainingTime);
    }
  }
}

// Ultimate fallback: ensure splash is hidden after maximum time
setTimeout(() => {
  if (!hasSplashBeenShown && splashScreen && splashScreen.style.display !== 'none') {
    console.warn('Splash timeout - forcing hide after 15 seconds');
    hideSplashScreen();
  }
}, 15000); // 15 seconds maximum

// Setup back to dashboard button
if (backToDashboardButton) {
  backToDashboardButton.addEventListener('click', (e) => {
    e.preventDefault();
    // Get dashboard URL from environment or use default
    const dashboardUrl = (import.meta as any).env?.VITE_DASHBOARD_URL || 'http://127.0.0.1:3000/';
    // Try to close current window if opened by parent, otherwise navigate
    if (window.opener) {
      window.close();
    } else {
      window.location.href = dashboardUrl;
    }
  });
}

// Initialize Cesium viewer and coordinate converter
let cesiumViewer: any = null;
let coordinateConverter: CoordinateConverter | null = null;
let originLon = 0;
let originLat = 0;

function resolveApiBase(): string {
  const envUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:8000/api`;
}

/**
 * Backend often returns url_template as a path like `/api/tile-cache/5/{z}/{x}/{y}`.
 * The browser would otherwise resolve that against the simulator origin (e.g. :3001) and 404.
 * Absolute URLs (TileServer, etc.) are left unchanged.
 */
function absolutizeTileUrlTemplate(template: string): string {
  const t = template.trim();
  if (!t) return t;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith('/')) {
    const apiBase = resolveApiBase();
    const origin = new URL(apiBase, window.location.href).origin;
    return new URL(t, origin).toString();
  }
  return t;
}

async function fetchOfflineMapUrlTemplateById(mapId: number): Promise<string | null> {
  try {
    const base = resolveApiBase();
    const url = `${base}/maps/${encodeURIComponent(String(mapId))}`;
    const headers: Record<string, string> = { Accept: 'application/json' };
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.warn(`[Simulator] GET ${url} → ${res.status} (offline map template unavailable)`);
      return null;
    }
    const json: any = await res.json();
    const data = json?.data ?? json;
    const template = data?.url_template;
    if (typeof template !== 'string' || !template.trim()) return null;
    const absolute = absolutizeTileUrlTemplate(template);
    console.log('🗺️ Offline map template resolved:', mapId, '→', absolute);
    return absolute;
  } catch (e) {
    console.warn('[Simulator] fetchOfflineMapUrlTemplateById failed', e);
    return null;
  }
}

function resolveWsBase(): string {
  const apiBase = resolveApiBase(); // e.g. http://host:8000/api
  const u = new URL(apiBase, window.location.href);
  const wsProto = u.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProto}//${u.host}${u.pathname.replace(/\/+$/, '')}`;
}

function subscribeScenarioRealtimeBasemap(scenarioId: string) {
  try {
    const wsBase = resolveWsBase(); // .../api
    const wsUrl = `${wsBase}/ws/scenarios/${encodeURIComponent(scenarioId)}`;
    const ws = new WebSocket(wsUrl);

    let pingTimer: number | null = null;
    ws.addEventListener('open', () => {
      console.log('🔌 Realtime connected:', wsUrl);
      // Keep the connection active; server loop waits for receive_text.
      pingTimer = window.setInterval(() => {
        try {
          ws.send('ping');
        } catch {}
      }, 20000);
    });

    ws.addEventListener('message', async (evt) => {
      try {
        const msg = JSON.parse(String(evt.data || '{}'));
        if (msg?.type !== 'basemap_changed') return;
        const baseMapId = msg?.baseMapId as string | undefined;
        if (!baseMapId || typeof baseMapId !== 'string') return;

        let offlineUrlTemplate: string | undefined;
        if (baseMapId.startsWith('offline-')) {
          const rawId = Number(baseMapId.replace('offline-', '').trim());
          if (Number.isFinite(rawId) && rawId > 0) {
            const template = await fetchOfflineMapUrlTemplateById(rawId);
            if (template) offlineUrlTemplate = template;
          }
        }

        const { applyBasemapImagery } = await import('./cesiumViewer');
        if (cesiumViewer) {
          applyBasemapImagery(cesiumViewer as any, { baseMapId, offlineUrlTemplate });
        }
      } catch (e) {
        console.warn('Realtime message parse/apply failed', e);
      }
    });

    ws.addEventListener('close', () => {
      console.warn('🔌 Realtime disconnected');
      if (pingTimer) window.clearInterval(pingTimer);
    });
    ws.addEventListener('error', (e) => {
      console.warn('Realtime websocket error', e);
    });
  } catch (e) {
    console.warn('Failed to subscribe realtime basemap updates', e);
  }
}

async function initializeCesium() {
  try {
    const { createCesiumViewer } = await import('./cesiumViewer');
    // Determine basemap from scenario settings (KalkNegar), if scenarioId provided.
    let baseMapId: string | undefined;
    let offlineUrlTemplate: string | undefined;
    try {
      const scenarioId =
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('scenarioId') : null;
      if (scenarioId) {
        const { fetchScenarioById } = await import('./scenarioPins');
        const scenario = await fetchScenarioById(scenarioId);
        baseMapId = scenario?.content?.settings?.map?.baseMapId ?? scenario?.content?.mapSettings?.baseMapId;
        if (typeof baseMapId === 'string' && baseMapId.startsWith('offline-')) {
          const rawId = Number(baseMapId.replace('offline-', '').trim());
          if (Number.isFinite(rawId) && rawId > 0) {
            const template = await fetchOfflineMapUrlTemplateById(rawId);
            if (template) {
              offlineUrlTemplate = template;
            }
          }
        }
        console.log('🗺️ Simulator basemap from scenario:', baseMapId ?? '(none)');
      }
    } catch (e) {
      console.warn('Failed to resolve basemap from scenario; using default imagery.', e);
    }

    cesiumViewer = createCesiumViewer('cesiumContainer', {
      baseMapId,
      offlineUrlTemplate,
    });
    console.log('Cesium viewer initialized');
    if (scenarioId) {
      subscribeScenarioRealtimeBasemap(scenarioId);
    }

    // پس از آماده شدن Cesium، پین‌ها و نمادهای سناریوها را اضافه کن
    try {
      const { fetchScenarios, fetchScenarioById, addScenarioPins, getScenarioCenter } = await import('./scenarioPins');
      const scenarioId =
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('scenarioId') : null;
      let scenarios: any[] = [];
      if (scenarioId) {
        const scenario = await fetchScenarioById(scenarioId);
        scenarios = scenario ? [scenario] : [];
      }
      if (!scenarios.length) {
        scenarios = await fetchScenarios();
      }
      await addScenarioPins(cesiumViewer as any, scenarios);

      // Update origin based on the first scenario if available
      if (scenarios.length > 0) {
        const center = getScenarioCenter(scenarios[0], 0, 1);
        originLon = center.lon;
        originLat = center.lat;
        console.log(`✅ Origin set to scenario center: ${originLon}, ${originLat}`);

        // Fly camera to scenario center so user sees the scenario immediately
        cesiumViewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(center.lon, center.lat, 50000),
          orientation: {
            heading: 0,
            pitch: Cesium.Math.toRadians(-45),
            roll: 0,
          },
          duration: 2.0,
        });
      }

      const { addScenarioSymbols } = await import('./scenarioSymbols');
      await addScenarioSymbols(cesiumViewer as any, scenarios);
    } catch (pinError) {
      console.error('Failed to add scenario pins/symbols:', pinError);
    }

    // Initialize coordinate converter
    // If scenarios were loaded, we use the first one's center. Otherwise (0,0).
    coordinateConverter = new CoordinateConverter(originLon, originLat, 0);

    // Export for potential use in other modules
    (window as any).cesiumViewer = cesiumViewer;
    (window as any).coordinateConverter = coordinateConverter;

    // Sync Babylon.js camera with Cesium camera
    syncCameras();

    // Mark scene as ready after Cesium is initialized
    if (!sceneReady) {
      sceneReady = true;
      checkReady();
    }
  } catch (error) {
    console.error('Failed to initialize Cesium:', error);
    // Even if Cesium fails, mark as ready so splash can hide
    if (!sceneReady) {
      sceneReady = true;
      checkReady();
    }
  }
}

// Sync Babylon.js camera with Cesium camera
function syncCameras() {
  if (!cesiumViewer || !coordinateConverter) return;

  // Track Cesium camera changes and update Babylon.js camera
  cesiumViewer.camera.changed.addEventListener(() => {
    if (!cesiumViewer || !coordinateConverter) return;

    const cesiumCamera = cesiumViewer.camera;
    const cartographic = cesiumCamera.positionCartographic;

    // Convert Cesium camera position to local coordinates
    const localPos = coordinateConverter.geographicToLocal(
      Cesium.Math.toDegrees(cartographic.longitude),
      Cesium.Math.toDegrees(cartographic.latitude),
      cartographic.height
    );

    // Update Babylon.js camera position
    camera.setTarget(localPos);

    // Calculate camera distance based on Cesium camera height
    // For 2D mode, use a fixed height or scale the height appropriately
    const distance = Math.max(100, cartographic.height * 0.001); // Convert to reasonable scale
    camera.radius = distance;

    // Sync camera angles
    // For 2D mode, camera is always looking straight down
    if (cesiumViewer.scene.mode === Cesium.SceneMode.SCENE2D) {
      camera.alpha = cesiumCamera.heading || 0;
      camera.beta = Math.PI / 2; // Always look straight down in 2D mode
    } else {
      camera.alpha = cesiumCamera.heading;
      camera.beta = Math.PI / 2 - cesiumCamera.pitch;
    }
  });
}

// If splash has been shown before, skip it and go directly to main scene
if (hasSplashBeenShown) {
  if (splashScreen) {
    splashScreen.style.display = 'none';
  }
  if (mainContainer) {
    mainContainer.classList.add('visible');
  }
  if (canvas) {
    canvas.classList.add('visible');
  }
  if (header) {
    header.classList.add('visible');
  }
  initializeCesium().then(() => {
    setupMainScene(); // Setup scene after Cesium is ready
  });
  initializeMainScene();
  sceneReady = true;
  videoFinished = true;
} else {
  // Initialize splash timer immediately when splash is shown
  initializeSplashTimer();

  // Initialize Cesium after a short delay to allow splash to show
  setTimeout(() => {
    initializeCesium().catch(err => {
      console.error('Cesium initialization error:', err);
      // Mark scene as ready even if Cesium fails
      if (!sceneReady) {
        sceneReady = true;
        checkReady();
      }
    });
  }, 1000);

  // Mark scene as ready after first render
  scene.onReadyObservable.addOnce(() => {
    if (!sceneReady) {
      sceneReady = true;
      console.log('Scene ready (from onReadyObservable)');
      checkReady();
    }
  });

  // Also mark as ready immediately if scene is already ready
  if (scene.isReady()) {
    if (!sceneReady) {
      sceneReady = true;
      console.log('Scene already ready');
      checkReady();
    }
  }

  // Handle video end
  if (splashVideo) {
    // Ensure video starts playing
    splashVideo.play().catch(err => {
      console.warn('Video autoplay failed:', err);
    });

    splashVideo.addEventListener('ended', () => {
      console.log('Video ended');
      videoFinished = true;
      checkReady();
    });

    // Also handle video errors or if it doesn't play
    splashVideo.addEventListener('error', () => {
      console.warn('Video failed to load, will wait for minimum duration');
      // Mark as finished but still respect minimum duration
      setTimeout(() => {
        if (!videoFinished) {
          videoFinished = true;
          checkReady();
        }
      }, 2000);
    });

    // Fallback: if video doesn't start playing after 2 seconds, mark as finished
    setTimeout(() => {
      if (!videoFinished && splashVideo.readyState === 0) {
        console.warn('Video not loading, marking as finished');
        videoFinished = true;
        checkReady();
      }
    }, 2000);
  } else {
    // No video, mark as finished but still wait for minimum duration
    console.log('No video element found');
    videoFinished = true;
    checkReady();
  }

}

// Animation loop
engine.runRenderLoop(() => {
  scene.render();
  // Mark scene as ready after first render (only if splash hasn't been shown)
  // Note: sceneReady might be set by Cesium initialization, so check here too
  if (!hasSplashBeenShown && !sceneReady) {
    sceneReady = true;
    console.log('Scene ready (from render loop)');
    checkReady();
  }
});

// Handle window resize
window.addEventListener('resize', () => {
  engine.resize();
});

// Export for potential use in other modules
export { scene, engine, camera };

