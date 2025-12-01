import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder, StandardMaterial, Color3, Color4 } from '@babylonjs/core';
import '@babylonjs/core/Helpers/sceneHelpers';
import { CoordinateConverter } from './coordinateConverter';
import * as Cesium from 'cesium';

// Get scenario ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const scenarioId = urlParams.get('scenarioId');

if (scenarioId) {
  console.log('Loading scenario:', scenarioId);
  // TODO: Load scenario data from API or local storage
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

  // Wait for coordinate converter to be ready before placing objects
  if (coordinateConverter) {
    // Place 3D models at geographic locations
    // Example: Tank at Tehran coordinates
    const tankPos = coordinateConverter.geographicToLocal(51.3890, 35.6892, 0);
    const tank = MeshBuilder.CreateBox('tank', { width: 50, height: 25, depth: 75 }, scene);
    tank.position = tankPos;
    tank.position.y = 25; // Height above ground
    const tankMaterial = new StandardMaterial('tankMaterial', scene);
    tankMaterial.diffuseColor = new Color3(0.3, 0.3, 0.3);
    tankMaterial.specularColor = new Color3(0.2, 0.2, 0.2);
    tank.material = tankMaterial;

    // Example: Aircraft at a nearby location
    const aircraftPos = coordinateConverter.geographicToLocal(51.4, 35.7, 1000);
    const aircraft = MeshBuilder.CreateCylinder('aircraft', { height: 20, diameter: 40 }, scene);
    aircraft.position = aircraftPos;
    aircraft.rotation.z = Math.PI / 4;
    const aircraftMaterial = new StandardMaterial('aircraftMaterial', scene);
    aircraftMaterial.diffuseColor = new Color3(0.5, 0.5, 0.6);
    aircraftMaterial.specularColor = new Color3(0.3, 0.3, 0.3);
    aircraft.material = aircraftMaterial;

    // Add rotation animation to objects
    scene.registerBeforeRender(() => {
      tank.rotation.y += 0.005;
      aircraft.rotation.y += 0.01;
    });
  } else {
    // Fallback: create objects at origin if converter not ready
    const tank = MeshBuilder.CreateBox('tank', { width: 50, height: 25, depth: 75 }, scene);
    tank.position = new Vector3(0, 25, 0);
    const tankMaterial = new StandardMaterial('tankMaterial', scene);
    tankMaterial.diffuseColor = new Color3(0.3, 0.3, 0.3);
    tank.material = tankMaterial;
  }
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

async function initializeCesium() {
  try {
    const { createCesiumViewer } = await import('./cesiumViewer');
    cesiumViewer = createCesiumViewer('cesiumContainer');
    console.log('Cesium viewer initialized');
    
    // پس از آماده شدن Cesium، پین‌های سناریوها را اضافه کن
    try {
      const { addScenarioPins } = await import('./scenarioPins');
      await addScenarioPins(cesiumViewer as any);
    } catch (pinError) {
      console.error('Failed to add scenario pins:', pinError);
    }
    
    // Initialize coordinate converter with Tehran as origin
    coordinateConverter = new CoordinateConverter(51.3890, 35.6892, 0);
    
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

