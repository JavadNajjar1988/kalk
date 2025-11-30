import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';
import '@babylonjs/core/Helpers/sceneHelpers';

// Get the canvas element
const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
if (!canvas) {
  throw new Error('Canvas element not found');
}

// Remove loading indicator
const loading = document.getElementById('loading');
if (loading) {
  loading.remove();
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

// Create light
const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
light.intensity = 0.7;

// Create a simple box
const box = MeshBuilder.CreateBox('box', { size: 2 }, scene);

// Create material
const material = new StandardMaterial('boxMaterial', scene);
material.diffuseColor = new Color3(0.4, 0.6, 0.8);
material.specularColor = new Color3(0.5, 0.5, 0.5);
box.material = material;

// Create ground
const ground = MeshBuilder.CreateGround('ground', { width: 10, height: 10 }, scene);
const groundMaterial = new StandardMaterial('groundMaterial', scene);
groundMaterial.diffuseColor = new Color3(0.3, 0.3, 0.3);
ground.material = groundMaterial;

// Animation loop
engine.runRenderLoop(() => {
  scene.render();
});

// Handle window resize
window.addEventListener('resize', () => {
  engine.resize();
});

// Export for potential use in other modules
export { scene, engine, camera };

