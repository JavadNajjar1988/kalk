import * as Cesium from 'cesium';

// Simple terrain-aware "gravity" tuning
const ENABLE_TERRAIN_FOLLOW = false; // set true to re-enable terrain-aware gravity
const ENABLE_AUTO_MODEL_FLYTO = false; // keep initial globe view unless enabled
const MODEL_GRAVITY_ACCEL = 9.81; // m/s^2 downward
const MODEL_MAX_FALL_SPEED = 120; // m/s cap to avoid tunneling through the ground
const MODEL_GROUND_OFFSET = 5000; // meters above terrain/ellipsoid so it stays visible
const MODEL_FLY_RANGE = 30000; // meters for camera range when focusing model
const INITIAL_VIEW_HEIGHT = 2000000; // meters altitude for initial view focused on Iran

// تنظیم Cesium Ion access token (توکن کاربر)
Cesium.Ion.defaultAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxZDc3NTY2Ni0wN2E0LTQ1MzMtYWY3OC02NTlhMzgxNDNhNTEiLCJpZCI6MzY1NDQ2LCJpYXQiOjE3NjQ1Nzg2MDB9.tY9HMk_DfrqUhMPnsvjWR_EoCFAv6No8lkyZwJTvJdY';

// Global variables for model entities
let tankModelEntity: Cesium.Entity | undefined;
let modelPinEntity: Cesium.Entity | undefined;
let isModelAnimationPlaying = true; // Track animation state
let modelPositionProperty: Cesium.ConstantPositionProperty | undefined;
let detachTerrainFollower: (() => void) | undefined;
let hasAutoFocusedOnModel = false;

// Scratch objects reused each frame to avoid allocations
const scratchCartographic = new Cesium.Cartographic();
const scratchCartesian = new Cesium.Cartesian3();

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

// Keep the model glued to terrain while allowing it to "fall" onto the ground
function enableTerrainFollowing(
  viewer: Cesium.Viewer,
  positionProperty: Cesium.ConstantPositionProperty,
  offsetMeters: number
): () => void {
  const physicsState: {
    lastUpdate?: Cesium.JulianDate;
    verticalVelocity: number;
  } = {
    lastUpdate: undefined,
    verticalVelocity: 0,
  };

  const follow = (scene: Cesium.Scene, time: Cesium.JulianDate) => {
    const current = positionProperty.getValue(time, scratchCartesian);
    if (!current) return;

    const carto = Cesium.Cartographic.fromCartesian(current, Cesium.Ellipsoid.WGS84, scratchCartographic);
    const dt =
      physicsState.lastUpdate === undefined
        ? 0
        : Cesium.JulianDate.secondsDifference(time, physicsState.lastUpdate);
    physicsState.lastUpdate = Cesium.JulianDate.clone(time, physicsState.lastUpdate);

    const terrainHeight =
      scene.sampleHeight(carto) ?? viewer.scene.globe.getHeight(carto) ?? carto.height ?? 0;
    const desiredHeight = terrainHeight + offsetMeters;

    // Even if there is no delta time yet, make sure we never sit below the ground
    if (dt <= 0) {
      if (carto.height < desiredHeight) {
        positionProperty.setValue(
          Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, desiredHeight, Cesium.Ellipsoid.WGS84)
        );
      }
      return;
    }

    // Apply simple gravity
    physicsState.verticalVelocity = Math.max(
      physicsState.verticalVelocity - MODEL_GRAVITY_ACCEL * dt,
      -MODEL_MAX_FALL_SPEED
    );

    let nextHeight = carto.height + physicsState.verticalVelocity * dt;

    // Prevent tunneling below terrain; snap to surface if we hit it
    if (!Number.isFinite(nextHeight) || nextHeight < desiredHeight) {
      nextHeight = desiredHeight;
      physicsState.verticalVelocity = 0;
    }

    positionProperty.setValue(
      Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, nextHeight, Cesium.Ellipsoid.WGS84)
    );
  };

  viewer.scene.preRender.addEventListener(follow);
  return () => viewer.scene.preRender.removeEventListener(follow);
}

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
    shouldAnimate: true, // keep Cesium clock running so model animations play
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

    // اطمینان از اینکه تست عمق نسبت به Terrain فعال است تا مدل روی زمین قفل شود
    viewer.scene.globe.depthTestAgainstTerrain = true;

    // --- مدل تستی تانک انیمیشنی روی همان مختصات ---
    /*
    viewer.entities.add({
      id: 'debug-tank-animated',
      position: tehranPosition,
      model: {
        uri: '/Model/tank_animated/scene.gltf',
        minimumPixelSize: 64,
        maximumScale: 20000,
        scale: 1.0,
        runAnimations: true,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
      description: 'تانک انیمیشنی تستی روی تهران',
    });
    */

    // --- مدل تانک T-35 در موقعیت متفاوت ---
    // مختصات مدل (تهران)
    const MODEL_TEHRAN = { lon: 51.3890, lat: 35.6892, height: 0 };
    const CESIUM_MODEL_URI = '/Model/cesium/t-35_heavy_five-turret_tank/scene.gltf';
    
    // Test if model file is accessible
    fetch(CESIUM_MODEL_URI)
      .then(response => {
        if (response.ok) {
          console.log('✅ Model file is accessible:', CESIUM_MODEL_URI);
        } else {
          console.error('❌ Model file is not accessible:', CESIUM_MODEL_URI, response.status, response.statusText);
        }
      })
      .catch(error => {
        console.error('❌ Error accessing model file:', CESIUM_MODEL_URI, error);
      });
    
    // Place a sample glTF model clamped to ground (uses terrain height)
    try {
      const carto = Cesium.Cartographic.fromDegrees(MODEL_TEHRAN.lon, MODEL_TEHRAN.lat);
      Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, [carto])
        .then((updated) => {
          const h = Number.isFinite(updated[0]?.height) ? updated[0]!.height : 0;
          // قرارگیری بالا و واضح؛ وابسته به زمین نباشد
          const pos = Cesium.Cartesian3.fromDegrees(MODEL_TEHRAN.lon, MODEL_TEHRAN.lat, h + MODEL_GROUND_OFFSET); // ground-following offset
          
          console.log('Creating tank model at position:', pos);
          modelPositionProperty = new Cesium.ConstantPositionProperty(pos);
          
          tankModelEntity = viewer.entities.add({
            id: 'tank-model',
            position: modelPositionProperty,
            model: {
              uri: CESIUM_MODEL_URI,
              scale: 200.0, // Much larger scale for visibility
              minimumPixelSize: 256, // Larger minimum pixel size
              maximumScale: 500000, // Larger maximum scale
              runAnimations: isModelAnimationPlaying, // Use the animation state variable
              heightReference: Cesium.HeightReference.NONE,
            },
          });
          
          console.log('Tank model entity created:', tankModelEntity);
          
          if (detachTerrainFollower) {
            detachTerrainFollower();
          }
          if (ENABLE_TERRAIN_FOLLOW) {
            detachTerrainFollower = enableTerrainFollowing(viewer, modelPositionProperty, MODEL_GROUND_OFFSET);
          }

          // Auto-focus once when the model is created so it is visible
          if (!hasAutoFocusedOnModel && tankModelEntity && ENABLE_AUTO_MODEL_FLYTO) {
            hasAutoFocusedOnModel = true;
            viewer.flyTo(tankModelEntity, {
              offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-30), MODEL_FLY_RANGE),
              duration: 1.5,
            }).catch(() => {
              // swallow focus errors
            });
          }
          
          // Add error handling for model loading
          if (tankModelEntity.model) {
            // Log when model is ready
            setTimeout(() => {
              console.log('Model status check - entity exists:', !!tankModelEntity);
              if (tankModelEntity && tankModelEntity.model) {
                console.log('Model property exists on entity');
              }
            }, 3000);
          }
          
          // fallback debug box so location is always visible even if model fails to load
          viewer.entities.add({
            id: 'debug-model-box',
            position: modelPositionProperty,
            box: {
              dimensions: new Cesium.Cartesian3(20000.0, 20000.0, 20000.0), // Larger box
              material: Cesium.Color.YELLOW.withAlpha(0.5), // More visible yellow color
              outline: true,
              outlineColor: Cesium.Color.RED,
              outlineWidth: 3
            },
          });
          
          // Green pin for model visibility
          modelPinEntity = viewer.entities.add({
            id: 'model-pin-tehran',
            position: modelPositionProperty,
            point: {
              pixelSize: 64, // Larger point
              color: Cesium.Color.RED, // Red color for better visibility
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 4,
              heightReference: Cesium.HeightReference.NONE,
            },
            label: {
              text: 'مدل تانک T-35',
              font: '24px sans-serif', // Larger font
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 3,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -40), // Adjusted offset
            },
          });
          
          console.log('Tank model added at Tehran with terrain height:', h);
          console.log('Tank model entity:', tankModelEntity);
        })
        .catch((err) => {
          console.warn('Failed to sample terrain for model:', err);
          // Try without terrain sampling as fallback
          const pos = Cesium.Cartesian3.fromDegrees(MODEL_TEHRAN.lon, MODEL_TEHRAN.lat, MODEL_GROUND_OFFSET);
          modelPositionProperty = new Cesium.ConstantPositionProperty(pos);
          tankModelEntity = viewer.entities.add({
            id: 'tank-model',
            position: modelPositionProperty,
            model: {
              uri: CESIUM_MODEL_URI,
              scale: 200.0,
              minimumPixelSize: 256,
              maximumScale: 500000,
              runAnimations: true,
              heightReference: Cesium.HeightReference.NONE,
            },
          });
          
          console.log('Tank model created without terrain sampling:', tankModelEntity);

          if (detachTerrainFollower) {
            detachTerrainFollower();
          }
          if (ENABLE_TERRAIN_FOLLOW) {
            detachTerrainFollower = enableTerrainFollowing(viewer, modelPositionProperty, MODEL_GROUND_OFFSET);
          }

          if (!hasAutoFocusedOnModel && tankModelEntity && ENABLE_AUTO_MODEL_FLYTO) {
            hasAutoFocusedOnModel = true;
            viewer.flyTo(tankModelEntity, {
              offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-30), MODEL_FLY_RANGE),
              duration: 1.5,
            }).catch(() => {});
          }
        });
    } catch (err) {
      console.warn('Error placing tank model:', err);
      // Try without terrain sampling as fallback
      try {
        const pos = Cesium.Cartesian3.fromDegrees(MODEL_TEHRAN.lon, MODEL_TEHRAN.lat, MODEL_GROUND_OFFSET);
        modelPositionProperty = new Cesium.ConstantPositionProperty(pos);
        tankModelEntity = viewer.entities.add({
          id: 'tank-model',
          position: modelPositionProperty,
          model: {
            uri: CESIUM_MODEL_URI,
            scale: 200.0,
            minimumPixelSize: 256,
            maximumScale: 500000,
            runAnimations: true,
            heightReference: Cesium.HeightReference.NONE,
          },
        });
        
        console.log('Tank model created in catch block:', tankModelEntity);

        if (detachTerrainFollower) {
          detachTerrainFollower();
        }
        if (ENABLE_TERRAIN_FOLLOW) {
          detachTerrainFollower = enableTerrainFollowing(viewer, modelPositionProperty, MODEL_GROUND_OFFSET);
        }

        if (!hasAutoFocusedOnModel && tankModelEntity && ENABLE_AUTO_MODEL_FLYTO) {
          hasAutoFocusedOnModel = true;
          viewer.flyTo(tankModelEntity, {
            offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-30), MODEL_FLY_RANGE),
            duration: 1.5,
          }).catch(() => {});
        }
      } catch (fallbackErr) {
        console.error('Failed to create tank model even in fallback:', fallbackErr);
      }
    }
    
    // Function to navigate to the model
    const flyToModelPin = () => {
      try {
        console.log('Fly to model button clicked');
        console.log('Tank model entity:', tankModelEntity);
        console.log('Auto rotation enabled:', autoRotationEnabled);
        
        // Stop auto-rotation when focusing on model
        autoRotationEnabled = false;
        (viewer as any).autoRotationEnabled = false;
        
        // Reset rotation after a delay to resume auto-rotation
        setTimeout(() => {
          autoRotationEnabled = true;
          (viewer as any).autoRotationEnabled = true;
          console.log('Auto rotation resumed');
        }, 5000); // Resume after 5 seconds
        
        const focusPosition =
          modelPositionProperty?.getValue(Cesium.JulianDate.now()) ??
          tankModelEntity?.position?.getValue(Cesium.JulianDate.now());

        const doFly = () =>
          viewer.flyTo(tankModelEntity ?? focusPosition, {
            offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-35), MODEL_FLY_RANGE),
            duration: 1.5,
          });

        if (tankModelEntity || focusPosition) {
          console.log('Flying to tank model entity');
          doFly().catch(() => {
            // Fallback if flyTo fails
            console.log('FlyTo failed, using fallback camera movement');
            if (focusPosition) {
              viewer.camera.flyTo({
                destination: focusPosition,
                orientation: {
                  heading: 0,
                  pitch: Cesium.Math.toRadians(-35),
                  roll: 0,
                },
                duration: 1.5,
              });
            } else {
              viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(MODEL_TEHRAN.lon, MODEL_TEHRAN.lat, MODEL_FLY_RANGE * 2),
                orientation: {
                  heading: 0,
                  pitch: Cesium.Math.toRadians(-35),
                  roll: 0,
                },
                duration: 1.5,
              });
            }
          });
        } else {
          console.log('No tank model entity, using fallback camera movement');
          // Fallback to direct camera positioning
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(MODEL_TEHRAN.lon, MODEL_TEHRAN.lat, MODEL_FLY_RANGE * 2),
            orientation: {
              heading: 0,
              pitch: Cesium.Math.toRadians(-35),
              roll: 0,
            },
            duration: 1.5,
          });
        }
      } catch (err) {
        console.warn('Failed to fly to model pin:', err);
      }
    };
    
    // Export the flyToModelPin function globally for the HTML button
    (window as any).flyToModelPin = flyToModelPin;
    
    // Function to toggle model animation
    const toggleModelAnimation = () => {
      try {
        console.log('Toggle animation button clicked');
        console.log('Current animation state:', isModelAnimationPlaying);
        
        // Toggle the animation state
        isModelAnimationPlaying = !isModelAnimationPlaying;
        console.log('New animation state:', isModelAnimationPlaying);
        
        // Update the model's animation state if it exists
        if (tankModelEntity && tankModelEntity.model) {
          // Get the current model properties
          const currentPosition =
            modelPositionProperty?.getValue(Cesium.JulianDate.now()) ??
            tankModelEntity.position?.getValue(Cesium.JulianDate.now());
          
          if (currentPosition) {
            if (modelPositionProperty) {
              modelPositionProperty.setValue(currentPosition);
            }
            // Remove the old entity
            viewer.entities.remove(tankModelEntity);
            
            // Recreate the entity with the new animation state
            tankModelEntity = viewer.entities.add({
              id: 'tank-model',
              position: modelPositionProperty ?? currentPosition,
              model: {
                uri: CESIUM_MODEL_URI,
                scale: 200.0,
                minimumPixelSize: 256,
                maximumScale: 500000,
                runAnimations: isModelAnimationPlaying,
                heightReference: Cesium.HeightReference.NONE,
              },
            });
            
            console.log('Model recreated with animation state:', isModelAnimationPlaying);
          }
        } else {
          console.log('No tank model entity found to update animation state');
        }
      } catch (err) {
        console.warn('Failed to toggle model animation:', err);
      }
    };
    
    // Export the toggleModelAnimation function globally for the HTML button
    (window as any).toggleModelAnimation = toggleModelAnimation;
    
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
        destination: Cesium.Cartesian3.fromDegrees(centerLongitude, centerLatitude, INITIAL_VIEW_HEIGHT),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-90), // straight down over Tehran/Iran
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
  
  // Make autoRotationEnabled accessible globally
  (viewer as any).autoRotationEnabled = autoRotationEnabled;
  (viewer as any).setAutoRotation = (enabled: boolean) => {
    autoRotationEnabled = enabled;
    (viewer as any).autoRotationEnabled = enabled; // Update global reference
  };
  
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
    // Use the local variable which should be updated by the setter
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
  
  (viewer as any).setRotationSpeed = (speed: number) => {
    rotationSpeed = speed;
  };
  
  console.log('Cesium viewer created successfully with auto-rotation and zoom controls');

  return viewer;
}

export type { Viewer as CesiumViewer } from 'cesium';

