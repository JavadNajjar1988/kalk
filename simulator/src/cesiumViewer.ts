import * as Cesium from 'cesium';

// Simple terrain-aware "gravity" tuning
const ENABLE_TERRAIN_FOLLOW = true; // clamp model to ground/tiles
const ENABLE_AUTO_MODEL_FLYTO = false; // keep initial globe view unless enabled
const MODEL_GRAVITY_ACCEL = 9.81; // m/s^2 downward
const MODEL_MAX_FALL_SPEED = 120; // m/s cap to avoid tunneling through the ground
const MODEL_GROUND_OFFSET = 1; // meters above terrain/tiles to sit on surface
const MODEL_FLY_RANGE = 30000; // meters for camera range when focusing model
const INITIAL_VIEW_HEIGHT = 2000000; // meters altitude for initial view focused on Iran
const PATH_VISUAL_OFFSET = 5; // meters to lift the drawn path for visibility when zoomed in
const EXPLOSION_DURATION = 6; // seconds
const EXPLOSION_MIN_RADIUS = 20;
const EXPLOSION_MAX_RADIUS = 40;
const SMOKE_DURATION = EXPLOSION_DURATION * 1.2;
const SMOKE_MAX_RADIUS = 15; // tight to impact
const PLUME_DURATION = SMOKE_DURATION;
const PLUME_MAX_RADIUS = 12; // very small plume
const PLUME_HEIGHT_OFFSET = 6; // minimal lift
let ENABLE_CLOUDS = false; // CloudCollection disabled to avoid renderer errors
const CLOUD_LIFETIME_MS = SMOKE_DURATION * 1000;
const CLOUD_START_SCALE = 20;
const CLOUD_PEAK_SCALE = 90;
const CLOUD_END_SCALE = 60;
const CLOUD_MAX_SIZE_START = new Cesium.Cartesian3(50, 30, 20);
const CLOUD_MAX_SIZE_PEAK = new Cesium.Cartesian3(100, 70, 50);
const CLOUD_MAX_SIZE_END = new Cesium.Cartesian3(80, 55, 40);

// تنظیم Cesium Ion access token (توکن کاربر) از env
const ION_TOKEN = (import.meta as any).env?.VITE_CESIUM_ION_TOKEN as string | undefined;
if (ION_TOKEN && ION_TOKEN.trim().length > 0) {
  Cesium.Ion.defaultAccessToken = ION_TOKEN.trim();
} else {
  console.warn('⚠️ VITE_CESIUM_ION_TOKEN تعریف نشده است؛ امکانات Ion در دسترس نخواهد بود.');
}

// Global variables for model entities
let tankModelEntity: Cesium.Entity | undefined;
let modelPinEntity: Cesium.Entity | undefined;
let isModelAnimationPlaying = true; // Track animation state
let modelPositionProperty: Cesium.ConstantPositionProperty | undefined;
let detachTerrainFollower: (() => void) | undefined;
let autoRotationEnabled = false;
let hasAutoFocusedOnModel = false;
let pathSamples: Cesium.SampledPositionProperty | undefined;
let pathWaypointTimes: Cesium.JulianDate[] = [];
let lastTriggeredWaypointIndex = -1;
let explosionWatcherAttached = false;
let explosionClouds: Cesium.CloudCollection | undefined;
let explosionWatcher: ((clock: Cesium.Clock) => void) | undefined;
let cloudAnimations: {
  cloud: Cesium.Cloud;
  start: Cesium.JulianDate;
  duration: number;
}[] = [];
let cloudUpdaterHandler: ((clock: Cesium.Clock) => void) | undefined;
let cloudUpdaterAttached = false;
let smokeSpriteCanvas: HTMLCanvasElement | undefined;
let loggedInvalidGroundHeight = false;

const cleanupTasks: Array<() => void> = [];
const registerCleanup = (fn: () => void) => cleanupTasks.push(fn);
function runCleanup(viewer: Cesium.Viewer) {
  cleanupTasks.splice(0).forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
  try {
    disableClouds(viewer);
  } catch {
    /* ignore */
  }
  try {
    if (detachTerrainFollower) {
      detachTerrainFollower();
      detachTerrainFollower = undefined;
    }
  } catch {
    /* ignore */
  }
  try {
    if (explosionWatcher) {
      viewer.clock.onTick.removeEventListener(explosionWatcher);
    }
  } catch {
    /* ignore */
  }
  try {
    if (cloudUpdaterHandler) {
      viewer.clock.onTick.removeEventListener(cloudUpdaterHandler);
    }
  } catch {
    /* ignore */
  }
}
function installViewerCleanup(viewer: Cesium.Viewer) {
  if (typeof window === 'undefined') return;
  if ((viewer as any)._cleanupHookAttached) return;
  const handler = () => runCleanup(viewer);
  window.addEventListener('unload', handler);
  registerCleanup(() => window.removeEventListener('unload', handler));
  (viewer as any)._cleanupHookAttached = true;
}

// Scratch objects reused each frame to avoid allocations
const scratchCartographic = new Cesium.Cartographic();
const scratchCartesian = new Cesium.Cartesian3();
const scratchCartesian2 = new Cesium.Cartesian3();

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
    if (
      !current ||
      !Number.isFinite(current.x) ||
      !Number.isFinite(current.y) ||
      !Number.isFinite(current.z)
    ) {
      return;
    }

    const carto = Cesium.Cartographic.fromCartesian(current, Cesium.Ellipsoid.WGS84, scratchCartographic);
    if (
      !carto ||
      !Number.isFinite(carto.longitude) ||
      !Number.isFinite(carto.latitude) ||
      !Number.isFinite(carto.height)
    ) {
      return;
    }
    if (!Number.isFinite(carto.height)) {
      carto.height = 0;
    }
    const dt =
      physicsState.lastUpdate === undefined
        ? 0
        : Cesium.JulianDate.secondsDifference(time, physicsState.lastUpdate);
    physicsState.lastUpdate = Cesium.JulianDate.clone(time, physicsState.lastUpdate);

    let surfaceHeight: number | undefined;
    try {
      const clampedCart = scene.clampToHeight(
        Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, carto.height, scratchCartesian2),
        undefined,
        scratchCartesian2
      );
      if (clampedCart) {
        const cc = Cesium.Cartographic.fromCartesian(clampedCart, Cesium.Ellipsoid.WGS84, scratchCartographic);
        surfaceHeight = cc?.height;
      }
    } catch (err) {
      // ignore clamp errors, fall back to sampleHeight
    }
    if (!Number.isFinite(surfaceHeight)) {
      surfaceHeight =
        scene.sampleHeight(carto) ?? viewer.scene.globe.getHeight(carto) ?? carto.height ?? 0;
    }
    const desiredHeight = (surfaceHeight ?? 0) + offsetMeters;
    if (!Number.isFinite(desiredHeight)) {
      return;
    }

    // Even if there is no delta time yet, make sure we never sit below the ground
    if (dt <= 0) {
      if (carto.height < desiredHeight) {
        positionProperty.setValue(
          Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, desiredHeight, Cesium.Ellipsoid.WGS84)
        );
      }
      return;
    }

    // Hard clamp to surface height (disable vertical drift)
    physicsState.verticalVelocity = 0;
    let nextHeight = desiredHeight;

    positionProperty.setValue(
      Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, nextHeight, Cesium.Ellipsoid.WGS84)
    );
  };

  viewer.scene.preRender.addEventListener(follow);
  return () => viewer.scene.preRender.removeEventListener(follow);
}

function isFiniteCartesian(c: Cesium.Cartesian3 | undefined): c is Cesium.Cartesian3 {
  return !!c && Number.isFinite(c.x) && Number.isFinite(c.y) && Number.isFinite(c.z);
}

function disableClouds(viewer: Cesium.Viewer) {
  cloudAnimations = [];
  if (explosionClouds && !explosionClouds.isDestroyed?.()) {
    try {
      viewer.scene.primitives.remove(explosionClouds);
    } catch {
      /* ignore */
    }
  }
  explosionClouds = undefined;
}

function ensureCloudCollection(viewer: Cesium.Viewer): Cesium.CloudCollection | undefined {
  if (!ENABLE_CLOUDS) return undefined;
  if (!explosionClouds || explosionClouds.isDestroyed?.()) {
    try {
      explosionClouds = viewer.scene.primitives.add(
        new Cesium.CloudCollection({
          noiseDetail: 16.0,
          noiseOffset: Cesium.Cartesian3.ZERO,
        })
      );
    } catch (err) {
      console.warn('CloudCollection not supported, disabling volumetric clouds:', err);
      ENABLE_CLOUDS = false;
      disableClouds(viewer);
      return undefined;
    }
  }
  return explosionClouds;
}

function ensureCloudUpdater(viewer: Cesium.Viewer) {
  if (!ENABLE_CLOUDS) {
    cloudAnimations = [];
    return;
  }
  if (cloudUpdaterAttached) return;
  cloudUpdaterHandler = (clock) => {
    if (!cloudAnimations.length) return;
    if (!ENABLE_CLOUDS || !explosionClouds || explosionClouds.isDestroyed?.()) {
      cloudAnimations = [];
      return;
    }
    const now = clock.currentTime;
    cloudAnimations = cloudAnimations.filter((anim) => {
      const t = Cesium.JulianDate.secondsDifference(now, anim.start);
      if (t < 0) return true;
      if (t > anim.duration) {
        try {
          anim.cloud.show = false;
          const clouds = explosionClouds;
          if (clouds && !clouds.isDestroyed?.()) {
            clouds.remove(anim.cloud);
          }
        } catch {
          /* ignore */
        }
        return false;
      }

      const norm = Cesium.Math.clamp(t / anim.duration, 0, 1);
      const growPhase = Math.min(norm / 0.6, 1);
      const fadePhase = norm < 0.7 ? 0 : (norm - 0.7) / 0.3;

      const scale = norm < 0.6
        ? Cesium.Math.lerp(CLOUD_START_SCALE, CLOUD_PEAK_SCALE, growPhase)
        : Cesium.Math.lerp(CLOUD_PEAK_SCALE, CLOUD_END_SCALE, fadePhase);
      const maxSize = new Cesium.Cartesian3(
        norm < 0.6
          ? Cesium.Math.lerp(CLOUD_MAX_SIZE_START.x, CLOUD_MAX_SIZE_PEAK.x, growPhase)
          : Cesium.Math.lerp(CLOUD_MAX_SIZE_PEAK.x, CLOUD_MAX_SIZE_END.x, fadePhase),
        norm < 0.6
          ? Cesium.Math.lerp(CLOUD_MAX_SIZE_START.y, CLOUD_MAX_SIZE_PEAK.y, growPhase)
          : Cesium.Math.lerp(CLOUD_MAX_SIZE_PEAK.y, CLOUD_MAX_SIZE_END.y, fadePhase),
        norm < 0.6
          ? Cesium.Math.lerp(CLOUD_MAX_SIZE_START.z, CLOUD_MAX_SIZE_PEAK.z, growPhase)
          : Cesium.Math.lerp(CLOUD_MAX_SIZE_PEAK.z, CLOUD_MAX_SIZE_END.z, fadePhase)
      );

      const alphaBase = 0.9 * (1 - Math.pow(norm, 1.3));
      const color = Cesium.Color.fromBytes(255, 140, 60).withAlpha(Cesium.Math.clamp(alphaBase, 0, 0.8));

      anim.cloud.scale = new Cesium.Cartesian2(scale, scale * 0.65);
      anim.cloud.maximumSize = maxSize;
      anim.cloud.color = color;
      anim.cloud.brightness = 1.1 - 0.3 * norm;
      return true;
    });
  };
  viewer.clock.onTick.addEventListener(cloudUpdaterHandler);
  registerCleanup(() => {
    if (cloudUpdaterHandler) {
      viewer.clock.onTick.removeEventListener(cloudUpdaterHandler);
    }
  });
  cloudUpdaterAttached = true;
}

function getSmokeSprite(): HTMLCanvasElement {
  if (smokeSpriteCanvas) return smokeSpriteCanvas;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grd = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size / 2);
    grd.addColorStop(0, 'rgba(255,160,80,0.9)');
    grd.addColorStop(0.4, 'rgba(120,80,60,0.6)');
    grd.addColorStop(1, 'rgba(40,40,40,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, size, size);
  }
  smokeSpriteCanvas = canvas;
  return canvas;
}

function spawnExplosion(viewer: Cesium.Viewer, position: Cesium.Cartesian3) {
  if (!isFiniteCartesian(position)) return;

  // Compute a stable, ground-clamped position without using clampToHeight (avoid undefined worker states)
  const cartoBase = Cesium.Cartographic.fromCartesian(position, Cesium.Ellipsoid.WGS84, scratchCartographic);
  if (
    !cartoBase ||
    !Number.isFinite(cartoBase.longitude) ||
    !Number.isFinite(cartoBase.latitude)
  ) {
    return;
  }
  const carto = new Cesium.Cartographic(
    cartoBase.longitude,
    cartoBase.latitude,
    Number.isFinite(cartoBase.height) ? cartoBase.height : 0
  );
  const sampledHeight =
    viewer.scene.sampleHeight(carto) ?? viewer.scene.globe.getHeight(carto) ?? carto.height ?? 0;
  const finalHeight = Number.isFinite(sampledHeight) ? sampledHeight : 0;

  const pos = Cesium.Cartesian3.fromRadians(
    carto.longitude,
    carto.latitude,
    finalHeight + MODEL_GROUND_OFFSET,
    undefined,
    scratchCartesian2
  );
  if (!isFiniteCartesian(pos)) return;
  const startTime = viewer.clock.currentTime.clone();
  const stopTime = Cesium.JulianDate.addSeconds(startTime, EXPLOSION_DURATION, new Cesium.JulianDate());
  const smokeStopTime = Cesium.JulianDate.addSeconds(startTime, SMOKE_DURATION, new Cesium.JulianDate());
  const radiusCb = new Cesium.CallbackProperty((time) => {
    const t = Cesium.JulianDate.secondsDifference(time, startTime);
    if (t < 0 || t > EXPLOSION_DURATION) return 0;
    return Cesium.Math.lerp(EXPLOSION_MIN_RADIUS, EXPLOSION_MAX_RADIUS, t / EXPLOSION_DURATION);
  }, false);
  const colorCb = new Cesium.CallbackProperty((time) => {
    const t = Cesium.JulianDate.secondsDifference(time, startTime);
    const alpha = Cesium.Math.clamp(1 - t / EXPLOSION_DURATION, 0, 1);
    return Cesium.Color.ORANGE.withAlpha(alpha);
  }, false);

  // Shockwave on the ground
  viewer.entities.add({
    position: pos,
    availability: new Cesium.TimeIntervalCollection([
      new Cesium.TimeInterval({ start: startTime, stop: stopTime }),
    ]),
    ellipse: {
      semiMajorAxis: radiusCb,
      semiMinorAxis: radiusCb,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      material: new Cesium.ColorMaterialProperty(colorCb),
      outline: false,
    },
  });

  // Smoke puff (ground-clamped, growing and fading)
  const smokeRadiusCb = new Cesium.CallbackProperty((time) => {
    const t = Cesium.JulianDate.secondsDifference(time, startTime);
    if (t < 0 || t > SMOKE_DURATION) return 0;
    const k = Cesium.Math.clamp(t / SMOKE_DURATION, 0, 1);
    return Cesium.Math.lerp(EXPLOSION_MIN_RADIUS * 0.3, SMOKE_MAX_RADIUS, k);
  }, false);
  const smokeColorCb = new Cesium.CallbackProperty((time) => {
    const t = Cesium.JulianDate.secondsDifference(time, startTime);
    const alpha = Cesium.Math.clamp(1 - t / SMOKE_DURATION, 0, 1) * 0.6;
    return Cesium.Color.fromBytes(80, 80, 80).withAlpha(alpha);
  }, false);

  viewer.entities.add({
    position: pos,
    availability: new Cesium.TimeIntervalCollection([
      new Cesium.TimeInterval({ start: startTime, stop: smokeStopTime }),
    ]),
    ellipse: {
      semiMajorAxis: smokeRadiusCb,
      semiMinorAxis: smokeRadiusCb,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      material: new Cesium.ColorMaterialProperty(smokeColorCb),
      outline: false,
    },
  });

  // Rising orange plume (ellipse slightly above ground)
  const plumeStopTime = Cesium.JulianDate.addSeconds(startTime, PLUME_DURATION, new Cesium.JulianDate());
  const plumeRadiusCb = new Cesium.CallbackProperty((time) => {
    const t = Cesium.JulianDate.secondsDifference(time, startTime);
    if (t < 0 || t > PLUME_DURATION) return 0;
    const k = Cesium.Math.clamp(t / PLUME_DURATION, 0, 1);
    return Cesium.Math.lerp(EXPLOSION_MIN_RADIUS * 0.4, PLUME_MAX_RADIUS, k);
  }, false);
  const plumeColorCb = new Cesium.CallbackProperty((time) => {
    const t = Cesium.JulianDate.secondsDifference(time, startTime);
    const alpha = Cesium.Math.clamp(1 - t / PLUME_DURATION, 0, 1) * 0.5;
    return Cesium.Color.fromBytes(255, 150, 60).withAlpha(alpha);
  }, false);

  viewer.entities.add({
    position: Cesium.Cartesian3.fromElements(pos.x, pos.y, pos.z + PLUME_HEIGHT_OFFSET, new Cesium.Cartesian3()),
    availability: new Cesium.TimeIntervalCollection([
      new Cesium.TimeInterval({ start: startTime, stop: plumeStopTime }),
    ]),
    ellipse: {
      semiMajorAxis: plumeRadiusCb,
      semiMinorAxis: plumeRadiusCb,
      heightReference: Cesium.HeightReference.NONE,
      material: new Cesium.ColorMaterialProperty(plumeColorCb),
      outline: false,
    },
  });

  // Billboard-based smoke blob (safe alternative to volumetric cloud)
  const billboardStart = Cesium.JulianDate.clone(startTime);
  const billboardStop = Cesium.JulianDate.addSeconds(startTime, PLUME_DURATION, new Cesium.JulianDate());
  const billboardScaleCb = new Cesium.CallbackProperty((time) => {
    const t = Cesium.JulianDate.secondsDifference(time, billboardStart);
    if (t < 0 || t > PLUME_DURATION) return 0;
    const norm = Cesium.Math.clamp(t / PLUME_DURATION, 0, 1);
    const grow = Math.min(norm / 0.6, 1);
    const shrink = norm < 0.7 ? 0 : (norm - 0.7) / 0.3;
    return norm < 0.6
      ? Cesium.Math.lerp(4.0, 12.0, grow)
      : Cesium.Math.lerp(12.0, 8.0, shrink);
  }, false);
  const billboardColorCb = new Cesium.CallbackProperty((time) => {
    const t = Cesium.JulianDate.secondsDifference(time, billboardStart);
    const norm = Cesium.Math.clamp(t / PLUME_DURATION, 0, 1);
    const alpha = Cesium.Math.clamp(1 - norm, 0, 1) * 0.7;
    return Cesium.Color.fromBytes(255, 150, 60).withAlpha(alpha);
  }, false);

  viewer.entities.add({
    position: Cesium.Cartesian3.fromElements(pos.x, pos.y, pos.z + PLUME_HEIGHT_OFFSET * 1.2, new Cesium.Cartesian3()),
    availability: new Cesium.TimeIntervalCollection([
      new Cesium.TimeInterval({ start: billboardStart, stop: billboardStop }),
    ]),
    billboard: {
      image: getSmokeSprite(),
      scale: billboardScaleCb,
      color: billboardColorCb,
      heightReference: Cesium.HeightReference.NONE,
      alignedAxis: Cesium.Cartesian3.UNIT_Z,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });

  // Dark cap smoke slightly higher, growing then fading
  const capStopTime = Cesium.JulianDate.addSeconds(startTime, PLUME_DURATION, new Cesium.JulianDate());
  const capRadiusCb = new Cesium.CallbackProperty((time) => {
    const t = Cesium.JulianDate.secondsDifference(time, startTime);
    if (t < 0 || t > PLUME_DURATION) return 0;
    const k = Cesium.Math.clamp(t / PLUME_DURATION, 0, 1);
    return Cesium.Math.lerp(EXPLOSION_MIN_RADIUS * 0.3, PLUME_MAX_RADIUS * 0.7, k);
  }, false);
  const capColorCb = new Cesium.CallbackProperty((time) => {
    const t = Cesium.JulianDate.secondsDifference(time, startTime);
    const alpha = Cesium.Math.clamp(1 - t / PLUME_DURATION, 0, 1) * 0.7;
    return Cesium.Color.fromBytes(60, 60, 60).withAlpha(alpha);
  }, false);

  viewer.entities.add({
    position: Cesium.Cartesian3.fromElements(pos.x, pos.y, pos.z + PLUME_HEIGHT_OFFSET * 1.6, new Cesium.Cartesian3()),
    availability: new Cesium.TimeIntervalCollection([
      new Cesium.TimeInterval({ start: startTime, stop: capStopTime }),
    ]),
    ellipse: {
      semiMajorAxis: capRadiusCb,
      semiMinorAxis: capRadiusCb,
      heightReference: Cesium.HeightReference.NONE,
      material: new Cesium.ColorMaterialProperty(capColorCb),
      outline: false,
    },
  });

  // Volumetric-ish cloud (using CloudCollection) with orange/gray tint
  const clouds = ensureCloudCollection(viewer);
  if (ENABLE_CLOUDS && clouds) {
    const cloud = clouds.add({
      position: pos,
      scale: new Cesium.Cartesian2(CLOUD_START_SCALE, CLOUD_START_SCALE * 0.65),
      maximumSize: CLOUD_MAX_SIZE_START,
      color: Cesium.Color.fromBytes(255, 140, 60, 160),
      slice: 0.3,
      brightness: 1.1,
    });
    cloudAnimations.push({
      cloud,
      start: startTime.clone(),
      duration: SMOKE_DURATION,
    });
    ensureCloudUpdater(viewer);
  }
}

function attachExplosionWatcher(viewer: Cesium.Viewer) {
  if (explosionWatcherAttached) return;
  explosionWatcher = (clock) => {
    if (!pathWaypointTimes.length || !pathSamples) return;
    const current = clock.currentTime;
    if (Cesium.JulianDate.lessThan(current, pathWaypointTimes[0])) {
      lastTriggeredWaypointIndex = -1;
      return;
    }
    let idx = -1;
    for (let i = 0; i < pathWaypointTimes.length; i++) {
      if (Cesium.JulianDate.lessThanOrEquals(pathWaypointTimes[i], current)) {
        idx = i;
      } else {
        break;
      }
    }
    if (idx > lastTriggeredWaypointIndex && idx >= 0) {
      lastTriggeredWaypointIndex = idx;
      const rawPos = pathSamples.getValue(current, new Cesium.Cartesian3());
      if (isFiniteCartesian(rawPos)) {
        spawnExplosion(viewer, rawPos);
      }
    }
  };
  viewer.clock.onTick.addEventListener(explosionWatcher);
  registerCleanup(() => {
    if (explosionWatcher) {
      viewer.clock.onTick.removeEventListener(explosionWatcher);
    }
  });
  explosionWatcherAttached = true;
}

function applyPathGraphics(entity: Cesium.Entity) {
  entity.path = new Cesium.PathGraphics({
    show: true,
    leadTime: Number.POSITIVE_INFINITY,
    trailTime: Number.POSITIVE_INFINITY,
    width: 20,
    resolution: 1,
    material: new Cesium.PolylineGlowMaterialProperty({
      glowPower: 0.5,
      color: Cesium.Color.fromCssColorString('#ff00ff').withAlpha(0.9),
    }),
  });
}

// Build a simple path for the model to follow and drive the Cesium clock
async function startModelPath(viewer: Cesium.Viewer) {
  if (!tankModelEntity || !modelPositionProperty) {
    console.warn('Cannot start model path; model not ready');
    return;
  }

  // When using a sampled path, stop the terrain follower that expects setValue()
  if (detachTerrainFollower) {
    detachTerrainFollower();
    detachTerrainFollower = undefined;
  }

  // Define a larger loop over Tehran area
  const waypoints = [
    { lon: 51.3890, lat: 35.6892, height: MODEL_GROUND_OFFSET }, // center-ish
    { lon: 51.36, lat: 35.72,  height: MODEL_GROUND_OFFSET },
    { lon: 51.41, lat: 35.75,  height: MODEL_GROUND_OFFSET },
    { lon: 51.46, lat: 35.72,  height: MODEL_GROUND_OFFSET },
    { lon: 51.48, lat: 35.68,  height: MODEL_GROUND_OFFSET },
    { lon: 51.44, lat: 35.65,  height: MODEL_GROUND_OFFSET },
    { lon: 51.38, lat: 35.64,  height: MODEL_GROUND_OFFSET },
    { lon: 51.34, lat: 35.66,  height: MODEL_GROUND_OFFSET },
    { lon: 51.36, lat: 35.69,  height: MODEL_GROUND_OFFSET },
    { lon: 51.3890, lat: 35.6892, height: MODEL_GROUND_OFFSET }, // close loop
  ];

  // Sample terrain heights for all waypoints to keep model glued to surface
  try {
    const cartos = waypoints.map(
      (wp) => new Cesium.Cartographic(Cesium.Math.toRadians(wp.lon), Cesium.Math.toRadians(wp.lat), wp.height)
    );
    const updated = await Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, cartos);
    updated.forEach((c, idx) => {
      if (Number.isFinite(c.height)) {
        waypoints[idx].height = c.height + MODEL_GROUND_OFFSET;
      }
    });
    // Refine with clampToHeight against tiles if available
    waypoints.forEach((wp, idx) => {
      try {
        const cart = Cesium.Cartesian3.fromDegrees(wp.lon, wp.lat, wp.height);
        const clamped = viewer.scene.clampToHeight(cart, undefined, scratchCartesian2);
        if (clamped) {
          const cc = Cesium.Cartographic.fromCartesian(clamped, Cesium.Ellipsoid.WGS84, scratchCartographic);
          if (cc && Number.isFinite(cc.height)) {
            waypoints[idx].height = cc.height + MODEL_GROUND_OFFSET;
          }
        }
      } catch (err) {
        // ignore clamp errors
      }
    });
  } catch (e) {
    console.warn('Terrain sampling failed for path; using default heights', e);
  }

  const SEGMENT_SECONDS = 120; // slower pace per waypoint segment
    const start = Cesium.JulianDate.now();
    const stop = Cesium.JulianDate.addSeconds(
      start,
      SEGMENT_SECONDS * Math.max(1, waypoints.length - 1),
      new Cesium.JulianDate()
  );

  const samples = new Cesium.SampledPositionProperty();
  samples.setInterpolationOptions({
    interpolationDegree: 1,
    interpolationAlgorithm: Cesium.LinearApproximation,
  });

  waypoints.forEach((wp, idx) => {
    const t = Cesium.JulianDate.addSeconds(start, idx * SEGMENT_SECONDS, new Cesium.JulianDate());
    // Store zero-height samples; actual clamping is done in the callback for perfect ground contact
    samples.addSample(t, Cesium.Cartesian3.fromDegrees(wp.lon, wp.lat, 0));
  });
  samples.addSample(stop, Cesium.Cartesian3.fromDegrees(waypoints[0].lon, waypoints[0].lat, 0));

  // Drive clock for the path
  viewer.clock.startTime = start.clone();
  viewer.clock.stopTime = stop.clone();
  viewer.clock.currentTime = start.clone();
  viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
  viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER;
  viewer.clock.multiplier = 5;
  viewer.clock.shouldAnimate = true;

  pathSamples = samples;
  const clampedCallback = new Cesium.CallbackProperty((time, result) => {
    if (!pathSamples) return undefined;
    const target = pathSamples.getValue(time, scratchCartesian);
    if (!target) return undefined;
    let groundHeight: number | undefined;
    try {
      const clamped = viewer.scene.clampToHeight(target, undefined, scratchCartesian2);
      if (clamped) {
        const cc = Cesium.Cartographic.fromCartesian(clamped, Cesium.Ellipsoid.WGS84, scratchCartographic);
        groundHeight = cc?.height;
      }
    } catch (err) {
      // ignore clamp errors
    }
    const carto = Cesium.Cartographic.fromCartesian(target, Cesium.Ellipsoid.WGS84, scratchCartographic);
    const h = groundHeight ?? viewer.scene.sampleHeight(carto) ?? viewer.scene.globe.getHeight(carto) ?? carto.height ?? 0;
    if (!Number.isFinite(h) && !loggedInvalidGroundHeight) {
      loggedInvalidGroundHeight = true;
    }
    return Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, h + MODEL_GROUND_OFFSET, undefined, result);
  }, false);

  modelPositionProperty = clampedCallback as any;
  tankModelEntity.position = modelPositionProperty;
  tankModelEntity.orientation = new Cesium.VelocityOrientationProperty(samples);
  tankModelEntity.availability = new Cesium.TimeIntervalCollection([
    new Cesium.TimeInterval({ start, stop }),
  ]);
  pathWaypointTimes = [];
  waypoints.forEach((_, idx) => {
    const t = Cesium.JulianDate.addSeconds(start, idx * SEGMENT_SECONDS, new Cesium.JulianDate());
    pathWaypointTimes.push(t);
  });
  pathWaypointTimes.push(stop.clone());
  lastTriggeredWaypointIndex = -1;
  attachExplosionWatcher(viewer);

  // Add a bold polyline for the path so it is always visible
  // Draw the visual path clamped to ground so it never goes below tiles/terrain
  const polylinePositions = waypoints.map((wp) =>
    Cesium.Cartesian3.fromDegrees(wp.lon, wp.lat)
  );
  // close loop visually
  polylinePositions.push(Cesium.Cartesian3.fromDegrees(waypoints[0].lon, waypoints[0].lat));

  const existingPathLine = viewer.entities.getById('model-path-line');
  if (existingPathLine) {
    viewer.entities.remove(existingPathLine);
  }
  viewer.entities.add({
    id: 'model-path-line',
    polyline: {
      positions: polylinePositions,
      width: 18,
      arcType: Cesium.ArcType.GEODESIC,
      clampToGround: true,
      material: new Cesium.PolylineOutlineMaterialProperty({
        color: Cesium.Color.fromCssColorString('#ff00ff').withAlpha(0.9),
        outlineWidth: 2,
        outlineColor: Cesium.Color.BLACK,
      }),
    },
  });

  const pin = viewer.entities.getById('model-pin-tehran');
  if (pin) {
    pin.position = modelPositionProperty;
    modelPinEntity = pin;
  }
  const debugBox = viewer.entities.getById('debug-model-box');
  if (debugBox) {
    debugBox.position = modelPositionProperty;
  }
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
  installViewerCleanup(viewer);
  
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
          try {
            const clamped = viewer.scene.clampToHeight(pos, undefined, scratchCartesian2);
            if (clamped) {
              const cc = Cesium.Cartographic.fromCartesian(clamped, Cesium.Ellipsoid.WGS84, scratchCartographic);
              if (cc && Number.isFinite(cc.longitude) && Number.isFinite(cc.latitude) && Number.isFinite(cc.height)) {
                modelPositionProperty.setValue(Cesium.Cartesian3.fromRadians(cc.longitude, cc.latitude, cc.height + MODEL_GROUND_OFFSET));
              }
            }
          } catch (err) {
            // ignore clamp errors
          }
          
          tankModelEntity = viewer.entities.add({
            id: 'tank-model',
            position: modelPositionProperty,
            model: {
              uri: CESIUM_MODEL_URI,
              scale: 5.0, // realistic scale
              minimumPixelSize: 32, // smaller minimum for distance
              maximumScale: 5000, // cap to avoid huge jumps
              runAnimations: isModelAnimationPlaying, // Use the animation state variable
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            },
          });
          applyPathGraphics(tankModelEntity);
          
          console.log('Tank model entity created:', tankModelEntity);
          
          // Terrain follower runs only while position property is a constant
          if (detachTerrainFollower) {
            detachTerrainFollower();
          }
          if (ENABLE_TERRAIN_FOLLOW && modelPositionProperty && (modelPositionProperty as any).setValue) {
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
          
          startModelPath(viewer);
          
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
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
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
              scale: 5.0,
              minimumPixelSize: 32,
              maximumScale: 5000,
              runAnimations: true,
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            },
          });
          
          console.log('Tank model created without terrain sampling:', tankModelEntity);

          if (detachTerrainFollower) {
            detachTerrainFollower();
          }
          if (ENABLE_TERRAIN_FOLLOW && modelPositionProperty && (modelPositionProperty as any).setValue) {
            detachTerrainFollower = enableTerrainFollowing(viewer, modelPositionProperty, MODEL_GROUND_OFFSET);
          }

          if (!hasAutoFocusedOnModel && tankModelEntity && ENABLE_AUTO_MODEL_FLYTO) {
            hasAutoFocusedOnModel = true;
            viewer.flyTo(tankModelEntity, {
              offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-30), MODEL_FLY_RANGE),
              duration: 1.5,
            }).catch(() => {});
          }

          startModelPath(viewer);
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
            scale: 5.0,
            minimumPixelSize: 32,
            maximumScale: 5000,
            runAnimations: true,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
        });
        applyPathGraphics(tankModelEntity);
        
        console.log('Tank model created in catch block:', tankModelEntity);

        if (detachTerrainFollower) {
          detachTerrainFollower();
        }
        if (ENABLE_TERRAIN_FOLLOW && modelPositionProperty && (modelPositionProperty as any).setValue) {
          detachTerrainFollower = enableTerrainFollowing(viewer, modelPositionProperty, MODEL_GROUND_OFFSET);
        }

        if (!hasAutoFocusedOnModel && tankModelEntity && ENABLE_AUTO_MODEL_FLYTO) {
          hasAutoFocusedOnModel = true;
          viewer.flyTo(tankModelEntity, {
            offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-30), MODEL_FLY_RANGE),
            duration: 1.5,
          }).catch(() => {});
        }

        startModelPath(viewer);
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
            if (tankModelEntity.model) {
              tankModelEntity.model.runAnimations = isModelAnimationPlaying;
              viewer.scene.requestRender();
            }
            console.log('Model animation state updated:', isModelAnimationPlaying);
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

  // Auto-rotation disabled for inspection/debug
  console.log('Auto-rotation disabled for inspection/debug');

  return viewer;
}

export type { Viewer as CesiumViewer } from 'cesium';

