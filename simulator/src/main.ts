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
const focusScenarioButton = document.getElementById('focusScenarioButton');
const scenarioDebugPanel = document.getElementById('scenarioDebugPanel');

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
let currentScenarioName = '';
let currentScenarioRectangle: Cesium.Rectangle | null = null;

function setDebugStatus(lines: string[]) {
  if (!scenarioDebugPanel) return;
  scenarioDebugPanel.innerHTML = lines.join('<br>');
}

function focusScenarioLocation(immediate = false) {
  if (!cesiumViewer) {
    console.warn('[Simulator] Cesium viewer is not ready yet.');
    setDebugStatus([
      '<strong>وضعیت:</strong> viewer هنوز آماده نیست',
      `<strong>سناریو:</strong> ${currentScenarioName || scenarioId || 'نامشخص'}`,
    ]);
    return;
  }

  if (currentScenarioRectangle) {
    if (immediate) {
      cesiumViewer.camera.setView({
        destination: currentScenarioRectangle,
      });
    } else {
      cesiumViewer.camera.flyTo({
        destination: currentScenarioRectangle,
        duration: 2.2,
      });
    }
  } else if (cesiumViewer.entities?.values?.length) {
    cesiumViewer.zoomTo(cesiumViewer.entities).catch(() => {
      cesiumViewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(originLon, originLat, 120000),
        duration: 1.8,
        orientation: {
          heading: 0,
          pitch: Cesium.Math.toRadians(-55),
          roll: 0,
        },
      });
    });
  } else {
    cesiumViewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(originLon, originLat, 120000),
      duration: 1.8,
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-55),
        roll: 0,
      },
    });
  }

  console.log('[Simulator] Focusing scenario location:', {
    scenario: currentScenarioName || scenarioId || 'unknown',
    lon: originLon,
    lat: originLat,
    entities: cesiumViewer.entities?.values?.length ?? 0,
    hasRectangle: !!currentScenarioRectangle,
  });
}

if (focusScenarioButton) {
  focusScenarioButton.addEventListener('click', () => {
    focusScenarioLocation();
  });
}

async function initializeCesium() {
  try {
    const { createCesiumViewer } = await import('./cesiumViewer');
    cesiumViewer = createCesiumViewer('cesiumContainer');
    console.log('Cesium viewer initialized');

    // پس از آماده شدن Cesium، پین‌ها و نمادهای سناریوها را اضافه کن
    try {
      const { fetchScenarios, fetchScenarioById, addScenarioPins, getScenarioCenter, getScenarioRectangle } = await import('./scenarioPins');
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
        currentScenarioName = scenarios[0]?.name || '';
        currentScenarioRectangle = getScenarioRectangle(scenarios[0]);
        console.log(`✅ Origin set to scenario center: ${originLon}, ${originLat}`);
      }

      const scenarioSymbols = await import('./scenarioSymbols');

      // Setup Cesium clock bounds so our time-dynamic entities (unit motion / visibility) update.
      try {
        const bounds = scenarioSymbols.getScenarioTimeBounds(scenarios);
        if (bounds) {
          const multiplierRaw = (import.meta as any).env?.VITE_SIM_CLOCK_MULTIPLIER;
          const multiplier = Number.isFinite(Number(multiplierRaw)) ? Number(multiplierRaw) : 60; // seconds per real second

          (cesiumViewer as any).clock.startTime = bounds.start;
          (cesiumViewer as any).clock.stopTime = bounds.stop;
          (cesiumViewer as any).clock.currentTime = bounds.start;
          (cesiumViewer as any).clock.clockRange = Cesium.ClockRange.LOOP_STOP;
          (cesiumViewer as any).clock.multiplier = multiplier;
          (cesiumViewer as any).clock.shouldAnimate = true;

          console.log('[Simulator] Cesium clock bounds set:', {
            start: bounds.start.toString(),
            stop: bounds.stop.toString(),
            multiplier,
          });
        } else {
          console.warn('[Simulator] Could not compute scenario time bounds; keeping default Cesium clock.');
        }
      } catch (e) {
        console.warn('[Simulator] Failed to setup Cesium clock:', e);
      }

      await scenarioSymbols.addScenarioSymbols(cesiumViewer as any, scenarios);
      const summary = scenarioSymbols.summarizeScenarioRender(scenarios);

      setDebugStatus([
        `<strong>سناریو:</strong> ${currentScenarioName || scenarioId || 'نامشخص'}`,
        `<strong>مرکز:</strong> ${originLon.toFixed(4)}, ${originLat.toFixed(4)}`,
        `<strong>واحدها:</strong> ${summary.visibleUnits} قابل‌نمایش از ${summary.totalUnits}`,
        `<strong>مسیرها:</strong> ${summary.trackedUnits}`,
        `<strong>فیچرها:</strong> ${summary.layerFeatures} | <strong>رویدادها:</strong> ${summary.events}`,
        `<strong>entity:</strong> ${cesiumViewer.entities?.values?.length ?? 0}`,
      ]);

      if (scenarios.length > 0) {
        window.setTimeout(() => {
          focusScenarioLocation(true);
        }, 350);
      }
    } catch (pinError) {
      console.error('Failed to add scenario pins/symbols:', pinError);
      setDebugStatus([
        '<strong>خطا:</strong> بارگذاری سناریو یا نمادها شکست خورد',
        `<strong>جزئیات:</strong> ${pinError instanceof Error ? pinError.message : String(pinError)}`,
      ]);
    }

    // Initialize coordinate converter
    // If scenarios were loaded, we use the first one's center. Otherwise (0,0).
    coordinateConverter = new CoordinateConverter(originLon, originLat, 0);

    // Export for potential use in other modules
    (window as any).cesiumViewer = cesiumViewer;
    (window as any).coordinateConverter = coordinateConverter;
    (window as any).flyToScenarioLocation = focusScenarioLocation;

    // Sync Babylon.js camera with Cesium camera
    syncCameras();

    // Mark scene as ready after Cesium is initialized
    if (!sceneReady) {
      sceneReady = true;
      checkReady();
    }
  } catch (error) {
    console.error('Failed to initialize Cesium:', error);
    setDebugStatus([
      '<strong>خطا:</strong> راه‌اندازی Cesium شکست خورد',
      `<strong>جزئیات:</strong> ${error instanceof Error ? error.message : String(error)}`,
    ]);
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

