import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder, StandardMaterial, Color3, Color4 } from '@babylonjs/core';
import '@babylonjs/core/Helpers/sceneHelpers';

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
const hasSplashBeenShown = localStorage.getItem(SPLASH_SHOWN_KEY) === 'true';

// Get splash screen elements
const splashScreen = document.getElementById('splashScreen');
const splashVideoElement = document.getElementById('splashVideo');
const splashVideo = splashVideoElement instanceof HTMLVideoElement ? splashVideoElement : null;

// Get header element
const header = document.getElementById('header');
const backToDashboardButton = document.getElementById('backToDashboard');

// Function to hide splash screen and show canvas
function hideSplashScreen() {
  if (hideSplashScreen.called) return; // Prevent multiple calls
  hideSplashScreen.called = true;
  
  // Mark splash as shown in localStorage
  localStorage.setItem(SPLASH_SHOWN_KEY, 'true');
  
  if (splashScreen) {
    splashScreen.classList.add('hidden');
    setTimeout(() => {
      splashScreen.style.display = 'none';
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
    // If splash screen doesn't exist, just show canvas
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

// Create Babylon.js engine
const engine = new Engine(canvas, true, {
  preserveDrawingBuffer: true,
  stencil: true,
});

// Create scene
const scene = new Scene(engine);

// Create camera
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

// Attach camera controls to canvas
// In Babylon.js, the method is attachControl (singular)
camera.attachControl(canvas, true);

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

  // Create ground plane
  const ground = MeshBuilder.CreateGround('ground', { width: 20, height: 20 }, scene);
  const groundMaterial = new StandardMaterial('groundMaterial', scene);
  groundMaterial.diffuseColor = new Color3(0.2, 0.3, 0.2);
  groundMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
  ground.material = groundMaterial;
  ground.position.y = 0;

  // Create multiple objects for a more interesting scene
  const box = MeshBuilder.CreateBox('box', { size: 2 }, scene);
  box.position = new Vector3(-3, 1, 0);
  const boxMaterial = new StandardMaterial('boxMaterial', scene);
  boxMaterial.diffuseColor = new Color3(0.4, 0.6, 0.8);
  boxMaterial.specularColor = new Color3(0.5, 0.5, 0.5);
  box.material = boxMaterial;

  // Create a sphere
  const sphere = MeshBuilder.CreateSphere('sphere', { diameter: 2, segments: 32 }, scene);
  sphere.position = new Vector3(3, 1, 0);
  const sphereMaterial = new StandardMaterial('sphereMaterial', scene);
  sphereMaterial.diffuseColor = new Color3(0.8, 0.4, 0.4);
  sphereMaterial.specularColor = new Color3(0.5, 0.5, 0.5);
  sphere.material = sphereMaterial;

  // Create a cylinder
  const cylinder = MeshBuilder.CreateCylinder('cylinder', { height: 3, diameter: 1.5 }, scene);
  cylinder.position = new Vector3(0, 1.5, -3);
  const cylinderMaterial = new StandardMaterial('cylinderMaterial', scene);
  cylinderMaterial.diffuseColor = new Color3(0.6, 0.6, 0.4);
  cylinderMaterial.specularColor = new Color3(0.5, 0.5, 0.5);
  cylinder.material = cylinderMaterial;

  // Create a torus
  const torus = MeshBuilder.CreateTorus('torus', { diameter: 2, thickness: 0.5, tessellation: 32 }, scene);
  torus.position = new Vector3(0, 2, 3);
  const torusMaterial = new StandardMaterial('torusMaterial', scene);
  torusMaterial.diffuseColor = new Color3(0.6, 0.4, 0.8);
  torusMaterial.specularColor = new Color3(0.5, 0.5, 0.5);
  torus.material = torusMaterial;

  // Set sky color
  scene.clearColor = new Color4(0.1, 0.1, 0.15, 1.0);

  // Update camera position for better view
  camera.setTarget(Vector3.Zero());
  camera.alpha = -Math.PI / 2;
  camera.beta = Math.PI / 2.5;
  camera.radius = 15;
}

// Setup main scene
setupMainScene();

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
    return;
  }
  
  const elapsedTime = Date.now() - splashStartTime;
  const minTimePassed = elapsedTime >= SPLASH_MIN_DURATION;
  
  console.log(`checkReady called - sceneReady: ${sceneReady}, videoFinished: ${videoFinished}, elapsed: ${elapsedTime}ms, minPassed: ${minTimePassed}`);
  
  if (sceneReady && videoFinished) {
    if (minTimePassed) {
      console.log(`Splash displayed for ${elapsedTime}ms (>= ${SPLASH_MIN_DURATION}ms), hiding now`);
      hideSplashScreen();
    } else {
      // Wait for minimum time to pass
      const remainingTime = SPLASH_MIN_DURATION - elapsedTime;
      console.log(`Splash displayed for ${elapsedTime}ms, needs ${remainingTime}ms more to reach minimum duration`);
      hideTimeout = window.setTimeout(() => {
        const finalElapsed = Date.now() - splashStartTime!;
        console.log(`Splash displayed for ${finalElapsed}ms (>= ${SPLASH_MIN_DURATION}ms), hiding now`);
        hideSplashScreen();
      }, remainingTime);
    }
  }
}

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

// If splash has been shown before, skip it and go directly to main scene
if (hasSplashBeenShown) {
  if (splashScreen) {
    splashScreen.style.display = 'none';
  }
  if (canvas) {
    canvas.classList.add('visible');
  }
  if (header) {
    header.classList.add('visible');
  }
  initializeMainScene();
  sceneReady = true;
  videoFinished = true;
} else {
  // Initialize splash timer immediately when splash is shown
  initializeSplashTimer();
  
  // Mark scene as ready after first render
  scene.onReadyObservable.addOnce(() => {
    sceneReady = true;
    console.log('Scene ready');
    checkReady();
  });

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
  if (!hasSplashBeenShown && !sceneReady) {
    sceneReady = true;
    checkReady();
  }
});

// Handle window resize
window.addEventListener('resize', () => {
  engine.resize();
});

// Export for potential use in other modules
export { scene, engine, camera };

