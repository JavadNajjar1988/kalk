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
console.log('%c6. API Base URL (resolved):', 'color: #F44336; font-weight: bold;', resolveApiBase());
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
const timelinePanel = document.getElementById('timelinePanel');
const timelineCurrentLabel = document.getElementById('timelineCurrentLabel');
const timelineCurrentSubLabel = document.getElementById('timelineCurrentSubLabel');
const timelineStartLabel = document.getElementById('timelineStartLabel');
const timelineEndLabel = document.getElementById('timelineEndLabel');
const timelineTicks = document.getElementById('timelineTicks');
const timelineProgressLabel = document.getElementById('timelineProgressLabel');
const timelineTimezoneLabel = document.getElementById('timelineTimezoneLabel');
const timelineSliderElement = document.getElementById('timelineSlider');
const timelinePlayPauseButtonElement = document.getElementById('timelinePlayPauseButton');
const timelineStopButtonElement = document.getElementById('timelineStopButton');
const timelineSpeedSelectElement = document.getElementById('timelineSpeedSelect');

const timelineSlider = timelineSliderElement instanceof HTMLInputElement ? timelineSliderElement : null;
const timelinePlayPauseButton =
  timelinePlayPauseButtonElement instanceof HTMLButtonElement ? timelinePlayPauseButtonElement : null;
const timelineStopButton =
  timelineStopButtonElement instanceof HTMLButtonElement ? timelineStopButtonElement : null;
const timelineSpeedSelect =
  timelineSpeedSelectElement instanceof HTMLSelectElement ? timelineSpeedSelectElement : null;

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
let currentCountryOverviewName = '';
let currentScenarioTimeZone = 'UTC';
let currentTimelineBounds: { startMs: number; stopMs: number } | null = null;
let currentTimelineBaseMultiplier = 1;
let currentTimelineSpeedFactor = 1;
let currentTimelinePlaying = true;
let isTimelineScrubbing = false;
let resumeTimelinePlaybackAfterScrub = false;
let hasTimelineControlsBound = false;
let hasTimelineClockListener = false;
let lastTimelineUiRefresh = 0;

const TIMELINE_SLIDER_MAX = 1000;
const timelineFormatterCache = new Map<string, Intl.DateTimeFormat>();

function setDebugStatus(lines: string[]) {
  if (!scenarioDebugPanel) return;
  scenarioDebugPanel.innerHTML = lines.join('<br>');
}

function getRecommendedClockMultiplier(_bounds: { start: Cesium.JulianDate; stop: Cesium.JulianDate }): number {
  const envMultiplierRaw = (import.meta as any).env?.VITE_SIM_CLOCK_MULTIPLIER;
  const envMultiplier = Number(envMultiplierRaw);
  if (Number.isFinite(envMultiplier) && envMultiplier > 0) {
    return envMultiplier;
  }

  // KalkNegar default: 30 minutes of scenario time per RAF frame at 60 FPS.
  return ((1000 * 60 * 30) / 1000) * 60;
}

function formatPersianNumber(value: number, maximumFractionDigits = 0): string {
  return value.toLocaleString('fa-IR', {
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits,
  });
}

function getTimelineFormatter(
  key: string,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const cacheKey = `${key}|${timeZone}|${JSON.stringify(options)}`;
  const cached = timelineFormatterCache.get(cacheKey);
  if (cached) return cached;

  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      timeZone,
      ...options,
    });
  } catch {
    formatter = new Intl.DateTimeFormat('fa-IR', {
      timeZone,
      ...options,
    });
  }

  timelineFormatterCache.set(cacheKey, formatter);
  return formatter;
}

function formatTimelineDateTime(ms: number, timeZone: string): string {
  return getTimelineFormatter('full', timeZone, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(ms));
}

function formatTimelineEdge(ms: number, timeZone: string): string {
  return getTimelineFormatter('edge', timeZone, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(ms));
}

function formatTimelineTick(ms: number, timeZone: string, spanMs: number): string {
  if (spanMs <= 1000 * 60 * 60 * 24) {
    return getTimelineFormatter('tick-hour', timeZone, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(ms));
  }

  if (spanMs <= 1000 * 60 * 60 * 24 * 5) {
    return getTimelineFormatter('tick-short', timeZone, {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(ms));
  }

  return getTimelineFormatter('tick-date', timeZone, {
    month: 'long',
    day: '2-digit',
  }).format(new Date(ms));
}

function formatTimelineDuration(spanMs: number): string {
  const totalMinutes = Math.max(0, Math.round(spanMs / 60000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];

  if (days > 0) parts.push(`${formatPersianNumber(days)} روز`);
  if (hours > 0) parts.push(`${formatPersianNumber(hours)} ساعت`);
  if (parts.length === 0 || (parts.length < 2 && minutes > 0)) {
    parts.push(`${formatPersianNumber(minutes)} دقیقه`);
  }

  return parts.slice(0, 2).join(' و ');
}

function clampTimelineMs(value: number): number {
  if (!currentTimelineBounds) return value;
  return Math.min(currentTimelineBounds.stopMs, Math.max(currentTimelineBounds.startMs, value));
}

function getCurrentClockMs(): number | null {
  if (!cesiumViewer?.clock?.currentTime) return null;
  return Cesium.JulianDate.toDate(cesiumViewer.clock.currentTime).getTime();
}

function getTimelinePercentForMs(ms: number): number {
  if (!currentTimelineBounds) return 0;
  const span = Math.max(1, currentTimelineBounds.stopMs - currentTimelineBounds.startMs);
  const clamped = clampTimelineMs(ms);
  return ((clamped - currentTimelineBounds.startMs) / span) * 100;
}

function getTimelineMsFromSliderValue(value: number): number {
  if (!currentTimelineBounds) return 0;
  const normalized = Math.max(0, Math.min(TIMELINE_SLIDER_MAX, value)) / TIMELINE_SLIDER_MAX;
  return Math.round(
    currentTimelineBounds.startMs +
      normalized * (currentTimelineBounds.stopMs - currentTimelineBounds.startMs),
  );
}

function setTimelineSliderProgress(percent: number) {
  if (!timelineSlider) return;
  timelineSlider.style.setProperty('--timeline-progress', `${Math.max(0, Math.min(100, percent))}%`);
}

function setTimelinePanelVisible(visible: boolean) {
  if (!timelinePanel) return;
  timelinePanel.classList.toggle('visible', visible);
}

function renderTimelineTicks() {
  if (!timelineTicks || !currentTimelineBounds) return;
  timelineTicks.innerHTML = '';

  const span = currentTimelineBounds.stopMs - currentTimelineBounds.startMs;
  const width = timelineTicks.clientWidth || 900;
  const tickSegments = width > 960 ? 6 : width > 760 ? 5 : width > 560 ? 4 : 3;

  for (let index = 0; index <= tickSegments; index += 1) {
    const ratio = index / tickSegments;
    const timestamp = Math.round(currentTimelineBounds.startMs + span * ratio);
    const tick = document.createElement('div');
    tick.className = 'timeline-tick';
    tick.style.left = `${ratio * 100}%`;
    tick.textContent = formatTimelineTick(timestamp, currentScenarioTimeZone, span);
    timelineTicks.appendChild(tick);
  }
}

function updateTimelineButtons() {
  if (!timelinePlayPauseButton) return;
  timelinePlayPauseButton.textContent = currentTimelinePlaying ? 'توقف' : 'پخش';
  timelinePlayPauseButton.setAttribute('aria-pressed', String(currentTimelinePlaying));
}

function setTimelineClockTime(ms: number) {
  if (!cesiumViewer?.clock) return;
  const clamped = clampTimelineMs(ms);
  cesiumViewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date(clamped));
  cesiumViewer.scene?.requestRender?.();
}

function applyTimelineSpeedFactor(factor: number) {
  currentTimelineSpeedFactor = factor;
  if (cesiumViewer?.clock) {
    cesiumViewer.clock.multiplier = currentTimelineBaseMultiplier * currentTimelineSpeedFactor;
  }
}

function setTimelinePlaybackState(playing: boolean) {
  if (playing && currentTimelineBounds) {
    const currentMs = getCurrentClockMs() ?? currentTimelineBounds.startMs;
    if (currentMs >= currentTimelineBounds.stopMs - 500) {
      setTimelineClockTime(currentTimelineBounds.startMs);
    }
  }

  currentTimelinePlaying = playing;
  if (cesiumViewer?.clock) {
    cesiumViewer.clock.canAnimate = true;
    cesiumViewer.clock.shouldAnimate = playing;
  }
  updateTimelineButtons();
}

function stopTimelinePlayback() {
  setTimelinePlaybackState(false);
  if (currentTimelineBounds) {
    setTimelineClockTime(currentTimelineBounds.startMs);
  }
  refreshTimelineUi(true);
}

function refreshTimelineUi(force = false) {
  if (!currentTimelineBounds) return;

  const now = performance.now();
  if (!force && now - lastTimelineUiRefresh < 80) return;
  lastTimelineUiRefresh = now;

  const currentMs = clampTimelineMs(getCurrentClockMs() ?? currentTimelineBounds.startMs);
  const percent = getTimelinePercentForMs(currentMs);
  const span = currentTimelineBounds.stopMs - currentTimelineBounds.startMs;

  if (!isTimelineScrubbing && timelineSlider) {
    timelineSlider.value = String(Math.round((percent / 100) * TIMELINE_SLIDER_MAX));
  }
  setTimelineSliderProgress(percent);

  if (timelineCurrentLabel) {
    timelineCurrentLabel.textContent = formatTimelineDateTime(currentMs, currentScenarioTimeZone);
  }
  if (timelineCurrentSubLabel) {
    timelineCurrentSubLabel.textContent =
      `سناریو: ${currentScenarioName || 'نامشخص'} | منطقه زمانی: ${currentScenarioTimeZone} | سرعت: ${formatPersianNumber(currentTimelineSpeedFactor, currentTimelineSpeedFactor % 1 === 0 ? 0 : 2)}×`;
  }
  if (timelineStartLabel) {
    timelineStartLabel.textContent = formatTimelineEdge(currentTimelineBounds.startMs, currentScenarioTimeZone);
  }
  if (timelineEndLabel) {
    timelineEndLabel.textContent = formatTimelineEdge(currentTimelineBounds.stopMs, currentScenarioTimeZone);
  }
  if (timelineProgressLabel) {
    timelineProgressLabel.textContent =
      `پیشرفت: ${formatPersianNumber(percent)}٪ • بازه: ${formatTimelineDuration(span)}`;
  }
  if (timelineTimezoneLabel) {
    timelineTimezoneLabel.textContent = `منطقه زمانی: ${currentScenarioTimeZone}`;
  }

  updateTimelineButtons();
}

function handleTimelineClockTick() {
  if (!currentTimelineBounds) return;

  const currentMs = getCurrentClockMs();
  if (currentMs === null) return;

  if (currentTimelinePlaying && currentMs >= currentTimelineBounds.stopMs - 250) {
    setTimelineClockTime(currentTimelineBounds.stopMs);
    setTimelinePlaybackState(false);
    refreshTimelineUi(true);
    return;
  }

  refreshTimelineUi();
}

function bindTimelineControls() {
  if (hasTimelineControlsBound) return;
  hasTimelineControlsBound = true;

  timelinePlayPauseButton?.addEventListener('click', () => {
    setTimelinePlaybackState(!currentTimelinePlaying);
    refreshTimelineUi(true);
  });

  timelineStopButton?.addEventListener('click', () => {
    stopTimelinePlayback();
  });

  timelineSpeedSelect?.addEventListener('change', () => {
    const value = Number(timelineSpeedSelect.value);
    applyTimelineSpeedFactor(Number.isFinite(value) && value > 0 ? value : 1);
    refreshTimelineUi(true);
  });

  timelineSlider?.addEventListener('pointerdown', () => {
    resumeTimelinePlaybackAfterScrub = currentTimelinePlaying;
    isTimelineScrubbing = true;
    setTimelinePlaybackState(false);
  });

  timelineSlider?.addEventListener('input', () => {
    const value = Number(timelineSlider.value);
    setTimelineClockTime(getTimelineMsFromSliderValue(value));
    refreshTimelineUi(true);
  });

  const finishScrub = () => {
    if (!isTimelineScrubbing) return;
    isTimelineScrubbing = false;
    if (resumeTimelinePlaybackAfterScrub) {
      setTimelinePlaybackState(true);
    }
    refreshTimelineUi(true);
  };

  timelineSlider?.addEventListener('change', finishScrub);
  timelineSlider?.addEventListener('pointerup', finishScrub);
  timelineSlider?.addEventListener('keyup', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      finishScrub();
    }
  });

  window.addEventListener('resize', () => {
    if (currentTimelineBounds) {
      renderTimelineTicks();
      refreshTimelineUi(true);
    }
  });
}

function configureTimeline(
  scenarios: any[],
  bounds: { start: Cesium.JulianDate; stop: Cesium.JulianDate },
  baseMultiplier: number,
) {
  const firstScenario = scenarios[0];
  currentScenarioTimeZone = firstScenario?.content?.timeZone || firstScenario?.timeZone || 'UTC';
  currentTimelineBounds = {
    startMs: Cesium.JulianDate.toDate(bounds.start).getTime(),
    stopMs: Cesium.JulianDate.toDate(bounds.stop).getTime(),
  };
  currentTimelineBaseMultiplier = baseMultiplier;
  currentTimelineSpeedFactor = 1;

  if (timelineSpeedSelect) {
    timelineSpeedSelect.value = '1';
  }

  renderTimelineTicks();
  setTimelinePanelVisible(true);
  applyTimelineSpeedFactor(currentTimelineSpeedFactor);
  setTimelinePlaybackState(true);
  refreshTimelineUi(true);
}

function makeRectangle(west: number, south: number, east: number, north: number): Cesium.Rectangle {
  return Cesium.Rectangle.fromDegrees(west, south, east, north);
}

function rectangleContains(rectangle: Cesium.Rectangle, lon: number, lat: number): boolean {
  const west = Cesium.Math.toDegrees(rectangle.west);
  const east = Cesium.Math.toDegrees(rectangle.east);
  const south = Cesium.Math.toDegrees(rectangle.south);
  const north = Cesium.Math.toDegrees(rectangle.north);
  return lon >= west && lon <= east && lat >= south && lat <= north;
}

function buildExpandedRectangle(
  lon: number,
  lat: number,
  spanLon = 10,
  spanLat = 7,
): Cesium.Rectangle {
  const halfLon = spanLon / 2;
  const halfLat = spanLat / 2;
  return makeRectangle(lon - halfLon, lat - halfLat, lon + halfLon, lat + halfLat);
}

function getCountryOverview(
  lon: number,
  lat: number,
): { name: string; rectangle: Cesium.Rectangle } {
  const candidates = [
    { name: 'ایران', rectangle: makeRectangle(44.0, 24.0, 64.5, 40.8) },
    { name: 'عراق', rectangle: makeRectangle(38.5, 28.0, 49.0, 37.8) },
    { name: 'سوریه', rectangle: makeRectangle(35.5, 32.0, 42.7, 37.5) },
    { name: 'ترکیه', rectangle: makeRectangle(25.5, 35.0, 45.5, 42.8) },
    { name: 'افغانستان', rectangle: makeRectangle(60.0, 29.0, 75.5, 38.8) },
    { name: 'پاکستان', rectangle: makeRectangle(60.5, 23.0, 77.6, 37.2) },
    { name: 'عربستان', rectangle: makeRectangle(34.0, 15.5, 56.5, 33.8) },
    { name: 'لبنان', rectangle: makeRectangle(35.0, 33.0, 36.8, 34.9) },
    { name: 'اسرائیل/فلسطین', rectangle: makeRectangle(34.0, 29.2, 35.9, 33.6) },
    { name: 'اردن', rectangle: makeRectangle(34.8, 29.0, 39.6, 33.5) },
  ];

  const match = candidates.find((candidate) => rectangleContains(candidate.rectangle, lon, lat));
  if (match) return match;

  return {
    name: 'نمای منطقه‌ای',
    rectangle: buildExpandedRectangle(lon, lat),
  };
}

function showCountryOverview(
  overview: { name: string; rectangle: Cesium.Rectangle } | null,
  immediate = true,
) {
  if (!cesiumViewer || !overview) return;

  if (immediate) {
    cesiumViewer.camera.setView({
      destination: overview.rectangle,
    });
    return;
  }

  cesiumViewer.camera.flyTo({
    destination: overview.rectangle,
    duration: 1.8,
  });
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

bindTimelineControls();

function resolveApiBase(): string {
  const envUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  const { protocol, hostname, origin } = window.location;
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  if (isLocalHost) {
    return `${protocol}//${hostname}:8002/api`;
  }
  return `${origin.replace(/\/+$/, '')}/api`;
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
      const { fetchScenarios, fetchScenarioById, getScenarioCenter, getScenarioRectangle } = await import('./scenarioPins');
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

      // Update origin based on the first scenario if available
      if (scenarios.length > 0) {
        const center = getScenarioCenter(scenarios[0], 0, 1);
        originLon = center.lon;
        originLat = center.lat;
        currentScenarioName = scenarios[0]?.name || '';
        currentScenarioRectangle = getScenarioRectangle(scenarios[0]);
        const countryOverview = getCountryOverview(center.lon, center.lat);
        currentCountryOverviewName = countryOverview.name;
        console.log(`✅ Origin set to scenario center: ${originLon}, ${originLat}`);
        showCountryOverview(countryOverview, true);
      }

      const scenarioSymbols = await import('./scenarioSymbols');

      // Setup Cesium clock bounds so our time-dynamic entities (unit motion / visibility) update.
      try {
        const bounds = scenarioSymbols.getScenarioTimeBounds(scenarios);
        if (bounds) {
          const multiplier = getRecommendedClockMultiplier(bounds);

          (cesiumViewer as any).clock.startTime = bounds.start;
          (cesiumViewer as any).clock.stopTime = bounds.stop;
          (cesiumViewer as any).clock.currentTime = bounds.start;
          (cesiumViewer as any).clock.clockRange = Cesium.ClockRange.CLAMPED;
          (cesiumViewer as any).clock.multiplier = multiplier;
          (cesiumViewer as any).clock.canAnimate = true;
          (cesiumViewer as any).clock.shouldAnimate = true;

          if (!hasTimelineClockListener) {
            (cesiumViewer as any).clock.onTick.addEventListener(handleTimelineClockTick);
            hasTimelineClockListener = true;
          }

          configureTimeline(scenarios, bounds, multiplier);

          console.log('[Simulator] Cesium clock bounds set:', {
            start: bounds.start.toString(),
            stop: bounds.stop.toString(),
            multiplier,
          });
        } else {
          console.warn('[Simulator] Could not compute scenario time bounds; keeping default Cesium clock.');
          setTimelinePanelVisible(false);
        }
      } catch (e) {
        console.warn('[Simulator] Failed to setup Cesium clock:', e);
        setTimelinePanelVisible(false);
      }

      await scenarioSymbols.addScenarioSymbols(cesiumViewer as any, scenarios);
      const summary = scenarioSymbols.summarizeScenarioRender(scenarios);

      setDebugStatus([
        `<strong>سناریو:</strong> ${currentScenarioName || scenarioId || 'نامشخص'}`,
        `<strong>نمای آغاز:</strong> ${currentCountryOverviewName || 'منطقه سناریو'}`,
        `<strong>مرکز:</strong> ${originLon.toFixed(4)}, ${originLat.toFixed(4)}`,
        `<strong>واحدها:</strong> ${summary.visibleUnits} قابل‌نمایش از ${summary.totalUnits}`,
        `<strong>مسیرها:</strong> ${summary.trackedUnits}`,
        `<strong>فیچرها:</strong> ${summary.layerFeatures} | <strong>رویدادها:</strong> ${summary.events}`,
        `<strong>پخش زمان:</strong> x${Math.round((cesiumViewer as any).clock.multiplier ?? 1)}`,
        `<strong>entity:</strong> ${cesiumViewer.entities?.values?.length ?? 0}`,
      ]);

      if (scenarios.length > 0) {
        window.setTimeout(() => {
          focusScenarioLocation(false);
        }, 1800);
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

