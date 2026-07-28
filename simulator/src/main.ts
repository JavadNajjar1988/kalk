import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, Color3, Color4 } from '@babylonjs/core';
import '@babylonjs/core/Helpers/sceneHelpers';
import { CoordinateConverter } from './coordinateConverter';
import * as Cesium from 'cesium';
import { EnvironmentEffectController } from './environmentController';

// Timeline debug build tag (helps confirm newest bundle is loaded)
console.warn('[Timeline] debug build loaded', { tag: 'timeline-hour-ticks-2026-04-08-2' });

let hasLoggedHourTicks = false;

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
const scenarioTitleElement = document.getElementById('scenarioTitle');
const timelineHeaderPanel = document.getElementById('timelineHeaderPanel');
const timelineClockPanel = document.getElementById('timelineClockPanel');
const timelinePanel = document.getElementById('timelinePanel');
const timelineStartLabel = document.getElementById('timelineStartLabel');
const timelineEndLabel = document.getElementById('timelineEndLabel');
const timelineTicks = document.getElementById('timelineTicks');
const timelineTimezoneLabel = document.getElementById('timelineTimezoneLabel');
const timelineScrubberElement = document.getElementById('timelineScrubber');
const timelineScrubberHandleElement = document.getElementById('timelineScrubberHandle');
const timelineScrollBarElement = document.getElementById('timelineScrollBar');
const timelineScrollThumbElement = document.getElementById('timelineScrollThumb');
const timelinePlayPauseButtonElement = document.getElementById('timelinePlayPauseButton');
const timelineStopButtonElement = document.getElementById('timelineStopButton');
const timelineSpeedSelectElement = document.getElementById('timelineSpeedSelect');
const timelinePlayPauseIconElement = document.getElementById('timelinePlayPauseIcon');
const timelineZoomInButtonElement = document.getElementById('timelineZoomInButton');
const timelineZoomOutButtonElement = document.getElementById('timelineZoomOutButton');

const timelineScrubber =
  timelineScrubberElement instanceof HTMLDivElement ? timelineScrubberElement : null;
const timelineScrubberHandle =
  timelineScrubberHandleElement instanceof HTMLDivElement ? timelineScrubberHandleElement : null;
const timelineScrollBar =
  timelineScrollBarElement instanceof HTMLDivElement ? timelineScrollBarElement : null;
const timelineScrollThumb =
  timelineScrollThumbElement instanceof HTMLDivElement ? timelineScrollThumbElement : null;
const timelinePlayPauseButton =
  timelinePlayPauseButtonElement instanceof HTMLButtonElement ? timelinePlayPauseButtonElement : null;
const timelineStopButton =
  timelineStopButtonElement instanceof HTMLButtonElement ? timelineStopButtonElement : null;
const timelineSpeedSelect =
  timelineSpeedSelectElement instanceof HTMLSelectElement ? timelineSpeedSelectElement : null;
const timelinePlayPauseIcon =
  timelinePlayPauseIconElement instanceof SVGElement ? timelinePlayPauseIconElement : null;
const timelineZoomInButton =
  timelineZoomInButtonElement instanceof HTMLButtonElement ? timelineZoomInButtonElement : null;
const timelineZoomOutButton =
  timelineZoomOutButtonElement instanceof HTMLButtonElement ? timelineZoomOutButtonElement : null;

// Get main container
const mainContainer = document.getElementById('mainContainer');
let environmentEffectController: EnvironmentEffectController | null = null;

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

// Return to the page that launched the simulator, with a safe section fallback.
if (backToDashboardButton) {
  backToDashboardButton.addEventListener('click', (e) => {
    e.preventDefault();
    if (window.opener) {
      window.close();
      return;
    }

    if (document.referrer && window.history.length > 1) {
      window.history.back();
      return;
    }

    const dashboardUrl =
      (import.meta as any).env?.VITE_DASHBOARD_URL ||
      'http://127.0.0.1:3000';
    window.location.href = new URL('/dashboard/scenarios', dashboardUrl).toString();
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
let currentTimelineViewport: { startMs: number; stopMs: number } | null = null;
let currentTimelineBaseMultiplier = 1;
let currentTimelineSpeedFactor = 1;
let currentTimelinePlaying = true;
let isTimelineScrubbing = false;
let resumeTimelinePlaybackAfterScrub = false;
let hasTimelineControlsBound = false;
let hasTimelineClockListener = false;
let lastTimelineUiRefresh = 0;
let lastUserTimelineInteractionAt = 0;
let timelineNowLabelIntervalId: number | null = null;
let hasAutoStartedScenarioPlayback = false;

const MIN_VIEWPORT_SPAN_MS = 5 * 60 * 1000; // 5 minutes
const MAX_VIEWPORT_SPAN_RATIO = 1; // up to full span
const ZOOM_STEP = 1.6;
const AUTO_FOLLOW_DELAY_MS = 2500;
const AUTO_FOLLOW_AHEAD_RATIO = 0.7;
const timelineFormatterCache = new Map<string, Intl.DateTimeFormat>();

function setDebugStatus(lines: string[]) {
  if (!scenarioDebugPanel) return;
  scenarioDebugPanel.innerHTML = lines.join('<br>');
}

function setScenarioTitle(name: string) {
  if (!scenarioTitleElement) return;
  const trimmed = (name || '').trim();
  const value = trimmed ? trimmed : '—';
  scenarioTitleElement.textContent = value;
  scenarioTitleElement.dataset.value = value;
  scenarioTitleElement.style.opacity = trimmed ? '1' : '0.7';
  console.log('[Simulator] scenario title set:', value);
}

function getTimelineViewport(): { startMs: number; stopMs: number } | null {
  if (!currentTimelineBounds) return null;
  if (!currentTimelineViewport) {
    return { ...currentTimelineBounds };
  }
  return { ...currentTimelineViewport };
}

function setTimelineViewport(startMs: number, stopMs: number, refresh = true) {
  if (!currentTimelineBounds) return;
  const totalStart = currentTimelineBounds.startMs;
  const totalStop = currentTimelineBounds.stopMs;
  const totalSpan = Math.max(1, totalStop - totalStart);

  let s = Math.min(startMs, stopMs);
  let e = Math.max(startMs, stopMs);
  let span = Math.max(e - s, MIN_VIEWPORT_SPAN_MS);
  span = Math.min(span, totalSpan * MAX_VIEWPORT_SPAN_RATIO);

  if (e - s !== span) {
    // Re-center around midpoint if we adjusted span
    const mid = (s + e) / 2;
    s = mid - span / 2;
    e = mid + span / 2;
  }

  if (s < totalStart) {
    e += totalStart - s;
    s = totalStart;
  }
  if (e > totalStop) {
    const diff = e - totalStop;
    s -= diff;
    e = totalStop;
    if (s < totalStart) s = totalStart;
  }

  currentTimelineViewport = { startMs: s, stopMs: e };
  renderTimelineTicks();
  updateTimelineScrollBar();
  // Re-lock panel height after any viewport change (zoom/pan) to avoid layout jumps.
  lockTimelinePanelHeight();
  if (refresh) {
    refreshTimelineUi(true);
  }
}

function zoomTimeline(centerMs: number, factor: number) {
  if (!currentTimelineBounds || factor <= 0) return;
  const viewport = getTimelineViewport();
  if (!viewport) return;

  const span = viewport.stopMs - viewport.startMs;
  const newSpan = span / factor;
  console.warn('[Timeline] zoomTimeline()', { centerMs, factor, span, newSpan });
  setTimelineViewport(centerMs - newSpan / 2, centerMs + newSpan / 2);
}

function panTimeline(deltaMs: number) {
  if (!currentTimelineBounds) return;
  const viewport = getTimelineViewport();
  if (!viewport) return;
  console.warn('[Timeline] panTimeline()', { deltaMs, span: viewport.stopMs - viewport.startMs });
  setTimelineViewport(viewport.startMs + deltaMs, viewport.stopMs + deltaMs);
}

function noteUserTimelineInteraction() {
  lastUserTimelineInteractionAt = Date.now();
}

function shouldAutoFollow(): boolean {
  if (!currentTimelinePlaying) return false;
  if (isTimelineScrubbing) return false;
  return Date.now() - lastUserTimelineInteractionAt > AUTO_FOLLOW_DELAY_MS;
}

function autoFollowTimelineIfNeeded(currentMs: number) {
  if (!currentTimelineBounds) return;
  const viewport = getTimelineViewport();
  if (!viewport) return;
  const totalSpan = currentTimelineBounds.stopMs - currentTimelineBounds.startMs;
  const viewportSpan = viewport.stopMs - viewport.startMs;

  // If not zoomed (full span), nothing to follow.
  if (viewportSpan >= totalSpan * 0.999) return;
  if (!shouldAutoFollow()) return;

  const safeStart = viewport.startMs + viewportSpan * 0.15;
  const safeEnd = viewport.startMs + viewportSpan * 0.85;

  // If within the safe window, keep viewport stable.
  if (currentMs >= safeStart && currentMs <= safeEnd) return;

  // Recenter so currentMs lands around AUTO_FOLLOW_AHEAD_RATIO of the viewport span.
  const desiredStart = currentMs - viewportSpan * AUTO_FOLLOW_AHEAD_RATIO;
  setTimelineViewport(desiredStart, desiredStart + viewportSpan, false);
}

function updateTimelineScrollBar() {
  if (!timelineScrollBar || !timelineScrollThumb || !currentTimelineBounds) {
    if (!timelineScrollBar) console.warn('[Timeline] #timelineScrollBar missing');
    if (!timelineScrollThumb) console.warn('[Timeline] #timelineScrollThumb missing');
    if (!currentTimelineBounds) console.warn('[Timeline] bounds missing');
    return;
  }
  // Ensure it always occupies layout space (older sessions may have inline display:none).
  timelineScrollBar.style.display = '';
  const viewport = getTimelineViewport();
  if (!viewport) {
    timelineScrollBar.classList.remove('is-visible');
    timelineScrollBar.style.setProperty('opacity', '0', 'important');
    timelineScrollBar.style.setProperty('pointer-events', 'none', 'important');
    return;
  }

  const totalSpan = Math.max(1, currentTimelineBounds.stopMs - currentTimelineBounds.startMs);
  const viewportSpan = Math.max(1, viewport.stopMs - viewport.startMs);

  // Show whenever viewport is smaller than total (i.e. zoomed), regardless of rounding/centering.
  const shouldShow = viewportSpan < totalSpan - 1;

  // Diagnostic (throttled): log even when hidden.
  const now = performance.now();
  if ((updateTimelineScrollBar as any)._lastLog == null) (updateTimelineScrollBar as any)._lastLog = 0;
  if (now - (updateTimelineScrollBar as any)._lastLog > 600) {
    (updateTimelineScrollBar as any)._lastLog = now;
    console.log('[Timeline] scrollbar state', {
      shouldShow,
      hasViewportOverride: currentTimelineViewport !== null,
      viewportSpan,
      totalSpan,
      viewportStartDelta: Math.round(viewport.startMs - currentTimelineBounds.startMs),
      viewportStopDelta: Math.round(viewport.stopMs - currentTimelineBounds.stopMs),
    });
  }

  if (!shouldShow) {
    timelineScrollBar.classList.remove('is-visible');
    timelineScrollBar.style.setProperty('opacity', '0', 'important');
    timelineScrollBar.style.setProperty('pointer-events', 'none', 'important');
    return;
  }

  timelineScrollBar.classList.add('is-visible');
  timelineScrollBar.style.setProperty('opacity', '1', 'important');
  timelineScrollBar.style.setProperty('pointer-events', 'auto', 'important');

  const widthPercent = Math.max(4, (viewportSpan / totalSpan) * 100);
  const centerMs = (viewport.startMs + viewport.stopMs) / 2;
  const centerRatio = (centerMs - currentTimelineBounds.startMs) / totalSpan;
  const leftPercent = centerRatio * 100;

  timelineScrollThumb.style.width = `${widthPercent}%`;
  timelineScrollThumb.style.left = `${leftPercent}%`;
}

// Quick runtime sanity check (remove once confirmed)
if (!scenarioTitleElement) {
  console.warn('[Simulator] #scenarioTitle not found in DOM.');
} else {
  scenarioTitleElement.textContent = 'در حال بارگذاری سناریو...';
}

function resolveScenarioDisplayName(scenario: any): string {
  if (!scenario) return '';
  const candidates = [
    scenario?.content?.name,
    scenario?.content?.title,
    scenario?.content?.metadata?.title,
    scenario?.content?.metadata?.name,
    scenario?.name,
    scenario?.title,
    scenario?.scenarioTitle,
    scenario?.displayName,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return '';
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

/** همیشه نود فعلی در سند؛ مرجع کش‌شدهٔ بار اول می‌تواند به نود جدا (مثلاً HMR) اشاره کند و متن به المنت روی صفحه نرسد. */
function getLiveTimelineNowLabel(): HTMLElement | null {
  const el = document.getElementById('timelineNowLabel');
  return el instanceof HTMLElement ? el : null;
}

function safeFormatTimelineDateTime(ms: number, timeZone: string): string {
  try {
    return formatTimelineDateTime(ms, timeZone);
  } catch (e) {
    console.warn('[Timeline] safeFormatTimelineDateTime', e);
    return new Date(ms).toISOString();
  }
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

// formatTimelineTick removed: timeline marks rely on day labels/separators only.

function formatTimelineDayLabel(ms: number, timeZone: string, variant: 'narrow' | 'wide'): string {
  if (variant === 'narrow') {
    // Numeric only (no year): e.g. ۰۲/۱۲
    return getTimelineFormatter('day-label-narrow', timeZone, {
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(ms));
  }

  // Month name + numeric day (no year): e.g. اسفند ۰۲
  return getTimelineFormatter('day-label-wide', timeZone, {
    month: 'long',
    day: '2-digit',
  }).format(new Date(ms));
}

// formatTimelineDuration removed: progress label is hidden in the UI.

function clampTimelineMs(value: number): number {
  if (!currentTimelineBounds) return value;
  return Math.min(currentTimelineBounds.stopMs, Math.max(currentTimelineBounds.startMs, value));
}

function getCurrentClockMs(): number | null {
  if (!cesiumViewer?.clock?.currentTime) return null;
  return Cesium.JulianDate.toDate(cesiumViewer.clock.currentTime).getTime();
}

function getTimelinePercentForMs(ms: number): number {
  const viewport = getTimelineViewport();
  if (!viewport) return 0;
  const span = Math.max(1, viewport.stopMs - viewport.startMs);
  const clamped = Math.min(viewport.stopMs, Math.max(viewport.startMs, ms));
  return ((clamped - viewport.startMs) / span) * 100;
}

function getViewportMsFromScrubberX(clientX: number): number | null {
  if (!timelineScrubber) return null;
  const viewport = getTimelineViewport();
  if (!viewport) return null;
  const rect = timelineScrubber.getBoundingClientRect();
  if (!rect.width) return null;

  const x = Math.min(Math.max(clientX, rect.left), rect.right);
  const ratio = (x - rect.left) / rect.width;
  const ms = viewport.startMs + ratio * (viewport.stopMs - viewport.startMs);
  return Math.round(ms);
}

function setTimelineSliderProgress(percent: number) {
  if (!timelineScrubber || !timelineScrubberHandle) return;
  const clamped = Math.max(0, Math.min(100, percent));
  const rect = timelineScrubber.getBoundingClientRect();
  if (!rect.width) return;
  const x = rect.left + (clamped / 100) * rect.width;
  const relative = ((x - rect.left) / rect.width) * 100;
  timelineScrubberHandle.style.left = `${relative}%`;
}

function setTimelinePanelVisible(visible: boolean) {
  if (!timelinePanel) return;
  timelinePanel.classList.toggle('visible', visible);
  timelineHeaderPanel?.classList.toggle('visible', visible);
  timelineClockPanel?.classList.toggle('visible', visible);
  if (visible) {
    startTimelineNowLabelTicker();
    requestAnimationFrame(() => {
      updateTimelineScrollBar();
      positionTimelineStack();
      lockTimelinePanelHeight();
      requestAnimationFrame(() => positionTimelineStack());
    });
  } else {
    stopTimelineNowLabelTicker();
  }
}

/** پنل ردیف پایین: نوار زمان ← شمارشگر ← کنترل‌ها (از پایین صفحه به بالا) */
function positionTimelineStack() {
  if (!timelinePanel || !timelinePanel.classList.contains('visible')) return;

  // Currently, layout positioning is handled purely via CSS.
  // This function is kept for potential future layout-related side effects
  // (like scroll bar updates), but does not adjust element positions directly.
}

function lockTimelinePanelHeight() {
  if (!timelinePanel) return;
  if (!timelinePanel.classList.contains('visible')) return;
  // Lock height to prevent jumps when UI sub-elements toggle visibility.
  // Height is re-locked on window resize.
  const rect = timelinePanel.getBoundingClientRect();
  if (!rect.height) return;
  timelinePanel.style.height = `${Math.round(rect.height)}px`;
}

function renderTimelineTicks() {
  if (!timelineTicks || !currentTimelineBounds) return;
  timelineTicks.innerHTML = '';

  const viewport = getTimelineViewport();
  if (!viewport) return;

  const span = viewport.stopMs - viewport.startMs;
  const width = timelineTicks.getBoundingClientRect().width || timelineTicks.clientWidth || 900;
  const DAY_LABEL_WIDE_MIN_PX = 120;

  // 24-hour separators + per-day labels (relative to scenario start, not timezone-midnight)
  try {
    let hourTickCount = 0;
    const hourMs = 60 * 60 * 1000;
    const minuteMs = 60 * 1000;
    const dayMs = 24 * 60 * 60 * 1000;
    const origin = currentTimelineBounds.startMs;
    const boundaries: number[] = [];

    // Dynamic hour tick density based on current zoom.
    // Lower zoom -> fewer labels (6/12/18); higher zoom -> more (3h, 1h, 30m).
    const spanHours = Math.max(0.001, span / hourMs);
    const pxPerHour = width / spanHours;
    const stepMinutes = pxPerHour < 18 ? 360 : pxPerHour < 32 ? 180 : pxPerHour < 60 ? 60 : 30;

    const fmt2 = new Intl.NumberFormat('fa-IR', { minimumIntegerDigits: 2, useGrouping: false });

    function formatHourLabelFromOffsetMinutes(offsetMinutes: number): string {
      const h = Math.floor(offsetMinutes / 60) % 24;
      const m = Math.floor(offsetMinutes % 60);
      if (m === 0) return formatPersianNumber(h, 0);
      return `${formatPersianNumber(h, 0)}:${fmt2.format(m)}`;
    }

    // Build day boundaries (aligned to origin), spanning the viewport.
    // Important: this ensures "each day" segments are truly between day separators,
    // instead of starting at viewport.startMs (which can suppress hour ticks).
    const firstBoundary = origin + Math.floor((viewport.startMs - origin) / dayMs) * dayMs;
    for (let t = firstBoundary; t <= viewport.stopMs + 1; t += dayMs) {
      boundaries.push(t);
    }
    // Ensure final stop boundary exists
    if (boundaries.length === 0 || boundaries[boundaries.length - 1] < viewport.stopMs) {
      boundaries.push(viewport.stopMs);
    }

    // Day separators at internal boundaries (only those inside viewport)
    for (let i = 0; i < boundaries.length; i += 1) {
      const t = boundaries[i];
      if (t <= viewport.startMs || t >= viewport.stopMs) continue;
      const ratio = (t - viewport.startMs) / Math.max(1, span);
      const sep = document.createElement('div');
      sep.className = 'timeline-day-separator';
      sep.style.left = `${ratio * 100}%`;
      timelineTicks.appendChild(sep);
    }

    // Labels + hour ticks for each day segment visible in viewport
    for (let i = 0; i < boundaries.length - 1; i += 1) {
      const dayStart = boundaries[i];
      const dayStop = boundaries[i + 1];
      const segStart = Math.max(dayStart, viewport.startMs);
      const segStop = Math.min(dayStop, viewport.stopMs);
      if (segStop - segStart < minuteMs) continue;

      const segSpan = Math.max(1, segStop - segStart);
      const leftRatio = (segStart - viewport.startMs) / Math.max(1, span);
      const widthRatio = segSpan / Math.max(1, span);
      const centerMs = segStart + segSpan / 2;
      const segmentPx = width * widthRatio;
      const variant: 'narrow' | 'wide' = segmentPx >= DAY_LABEL_WIDE_MIN_PX ? 'wide' : 'narrow';

      const label = document.createElement('div');
      label.className = 'timeline-day-label';
      label.style.left = `${leftRatio * 100}%`;
      label.style.width = `${widthRatio * 100}%`;
      label.textContent = formatTimelineDayLabel(centerMs, currentScenarioTimeZone, variant);
      timelineTicks.appendChild(label);

      // Hour ticks inside this day segment (relative to true dayStart boundary).
      const viewportStartMs = segStart;
      const viewportStopMs = segStop;

      const addHourTick = (t: number, offsetMinutes: number) => {
        // Allow a tick exactly at viewport start; just avoid those outside.
        if (t < viewport.startMs || t > viewport.stopMs) return;
        const ratio = (t - viewport.startMs) / Math.max(1, span);
        const tick = document.createElement('div');
        tick.className = 'timeline-hour-tick';
        tick.style.left = `${ratio * 100}%`;

        // Avoid clutter: for 30m ticks, show labels for every tick; for 1h/3h also.
        // When step is 6h, labels are exactly 6/12/18.
        const text = document.createElement('span');
        text.className = 'timeline-hour-label';
        text.textContent = formatHourLabelFromOffsetMinutes(offsetMinutes);
        tick.appendChild(text);
        timelineTicks.appendChild(tick);
        hourTickCount += 1;
      };

      const startOffsetMinutes =
        Math.ceil(Math.max(0, (viewportStartMs - dayStart) / minuteMs) / stepMinutes) * stepMinutes;
      for (let off = startOffsetMinutes; off <= 24 * 60; off += stepMinutes) {
        const t = dayStart + off * minuteMs;
        if (t > viewportStopMs) break;
        if (t < viewportStartMs) continue;

        // For the 6-hour mode, avoid showing "0" to reduce clutter; keep 6/12/18 when they fall into view.
        if (stepMinutes === 360 && off === 0) continue;
        addHourTick(t, off);
      }
    }

    if (!hasLoggedHourTicks) {
      hasLoggedHourTicks = true;
      console.warn('[Timeline] hour ticks rendered', {
        hourTickCount,
        stepMinutes,
        pxPerHour: Math.round(pxPerHour * 10) / 10,
        viewportSpanHours: Math.round((span / hourMs) * 10) / 10,
      });
    }
    if (hourTickCount === 0) {
      console.warn('[Timeline] hour ticks rendered ZERO', {
        stepMinutes,
        pxPerHour: Math.round(pxPerHour * 10) / 10,
        viewportStartMs: viewport.startMs,
        viewportStopMs: viewport.stopMs,
        boundariesCount: boundaries.length,
      });
    }
  } catch (e) {
    console.warn('[Timeline] renderTimelineTicks failed', e);
  }

  // Intentionally no extra tick labels; day labels/separators cover the timeline markings.
}

function updateTimelineButtons() {
  if (!timelinePlayPauseButton) return;
  if (timelinePlayPauseIcon) {
    timelinePlayPauseIcon.innerHTML = currentTimelinePlaying
      ? '<rect x="7.4" y="7" width="2.1" height="10" rx="0.6" fill="currentColor" /><rect x="14.5" y="7" width="2.1" height="10" rx="0.6" fill="currentColor" />'
      : '<path d="M9.5 7.8c0-1.02 1.13-1.64 2-.99l6.2 4.7c.72.55.72 1.63 0 2.18l-6.2 4.7c-.87.65-2-.03-2-1.04V7.8Z" fill="currentColor" />';
  }
  timelinePlayPauseButton.setAttribute('aria-label', currentTimelinePlaying ? 'توقف' : 'پخش');
  timelinePlayPauseButton.title = currentTimelinePlaying ? 'توقف' : 'پخش';
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

  setTimelineSliderProgress(percent);

  const nowLabel = getLiveTimelineNowLabel();
  if (nowLabel) {
    nowLabel.textContent = safeFormatTimelineDateTime(currentMs, currentScenarioTimeZone);
  }
  if (timelineStartLabel) {
    timelineStartLabel.textContent = formatTimelineEdge(currentTimelineBounds.startMs, currentScenarioTimeZone);
  }
  if (timelineEndLabel) {
    timelineEndLabel.textContent = formatTimelineEdge(currentTimelineBounds.stopMs, currentScenarioTimeZone);
  }
  // Progress label intentionally hidden in UI.
  if (timelineTimezoneLabel) {
    timelineTimezoneLabel.textContent = `منطقه زمانی: ${currentScenarioTimeZone}`;
  }

  updateTimelineButtons();
}

function startTimelineNowLabelTicker() {
  if (timelineNowLabelIntervalId !== null) return;
  timelineNowLabelIntervalId = window.setInterval(() => {
    if (!currentTimelineBounds) return;
    const nowLabel = getLiveTimelineNowLabel();
    if (!nowLabel) return;
    const currentMs = clampTimelineMs(getCurrentClockMs() ?? currentTimelineBounds.startMs);
    nowLabel.textContent = safeFormatTimelineDateTime(currentMs, currentScenarioTimeZone);
  }, 200);
}

function stopTimelineNowLabelTicker() {
  if (timelineNowLabelIntervalId === null) return;
  window.clearInterval(timelineNowLabelIntervalId);
  timelineNowLabelIntervalId = null;
}

function handleTimelineClockTick() {
  if (environmentEffectController && cesiumViewer) {
    const cameraPosition = (cesiumViewer as any).camera?.positionCartographic;
    const currentMs = getCurrentClockMs();
    if (cameraPosition && currentMs !== null) {
      environmentEffectController.update(
        currentMs,
        Cesium.Math.toDegrees(cameraPosition.longitude),
        Cesium.Math.toDegrees(cameraPosition.latitude),
      );
    }
  }
  if (!currentTimelineBounds) return;

  const currentMs = getCurrentClockMs();
  if (currentMs === null) return;

  if (currentTimelinePlaying && currentMs >= currentTimelineBounds.stopMs - 250) {
    setTimelineClockTime(currentTimelineBounds.stopMs);
    setTimelinePlaybackState(false);
    refreshTimelineUi(true);
    return;
  }

  autoFollowTimelineIfNeeded(currentMs);
  refreshTimelineUi();
}

function bindTimelineControls() {
  if (hasTimelineControlsBound) return;
  hasTimelineControlsBound = true;
  console.warn('[Timeline] bindTimelineControls() bound');

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

  // Optional zoom buttons (in addition to Ctrl+wheel)
  timelineZoomInButton?.addEventListener('click', () => {
    if (!currentTimelineBounds) return;
    noteUserTimelineInteraction();
    const center = getCurrentClockMs() ?? currentTimelineBounds.startMs;
    console.warn('[Timeline] zoom in click', { center });
    zoomTimeline(center, ZOOM_STEP);
  });

  timelineZoomOutButton?.addEventListener('click', () => {
    if (!currentTimelineBounds) return;
    noteUserTimelineInteraction();
    const center = getCurrentClockMs() ?? currentTimelineBounds.startMs;
    console.warn('[Timeline] zoom out click', { center });
    zoomTimeline(center, 1 / ZOOM_STEP);
  });

  if (timelineScrubber && timelineScrubberHandle) {
    let isScrubbingPointer = false;
    let activePointerId: number | null = null;

    const updateFromPointer = (event: PointerEvent) => {
      const ms = getViewportMsFromScrubberX(event.clientX);
      if (ms === null) return;
      setTimelineClockTime(ms);
      refreshTimelineUi(true);
    };

    timelineScrubber.addEventListener('pointerdown', (event) => {
      resumeTimelinePlaybackAfterScrub = currentTimelinePlaying;
      isScrubbingPointer = true;
      isTimelineScrubbing = true;
      noteUserTimelineInteraction();
      activePointerId = event.pointerId;
      timelineScrubber.setPointerCapture(event.pointerId);
      setTimelinePlaybackState(false);
      updateFromPointer(event);
    });

    timelineScrubber.addEventListener('pointermove', (event) => {
      if (!isScrubbingPointer || activePointerId !== event.pointerId) return;
      noteUserTimelineInteraction();
      updateFromPointer(event);
    });

    const finishScrubPointer = (event: PointerEvent) => {
      if (!isScrubbingPointer || activePointerId !== event.pointerId) return;
      isScrubbingPointer = false;
      isTimelineScrubbing = false;
      try {
        timelineScrubber.releasePointerCapture(event.pointerId);
      } catch {}
      if (resumeTimelinePlaybackAfterScrub) {
        setTimelinePlaybackState(true);
      }
      refreshTimelineUi(true);
    };

    timelineScrubber.addEventListener('pointerup', finishScrubPointer);
    timelineScrubber.addEventListener('pointercancel', finishScrubPointer);

  }

  // Wheel: zoom with Ctrl, pan without (when pointer is over the whole timeline box)
  if (timelinePanel) {
    const getWheelRect = () => {
      const track = timelinePanel.querySelector('.timeline-track-shell') as HTMLElement | null;
      return (track ?? timelinePanel).getBoundingClientRect();
    };

    timelinePanel.addEventListener(
      'wheel',
      (event) => {
        if (!currentTimelineBounds) return;
        const viewport = getTimelineViewport();
        if (!viewport) return;

        // Avoid hijacking scrolling when user is interacting with dropdowns etc.
        const target = event.target as HTMLElement | null;
        if (target && (target.tagName === 'SELECT' || target.tagName === 'OPTION')) return;

        const rect = getWheelRect();
        if (!rect.width) return;

        event.preventDefault();

        const x = Math.min(Math.max(event.clientX, rect.left), rect.right);
        const ratio = (x - rect.left) / rect.width;
        const centerMs = viewport.startMs + ratio * (viewport.stopMs - viewport.startMs);

        if (event.ctrlKey) {
          noteUserTimelineInteraction();
          const factor = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
          zoomTimeline(centerMs, factor);
          updateTimelineScrollBar();
        } else {
          noteUserTimelineInteraction();
          const span = viewport.stopMs - viewport.startMs;
          const direction = event.deltaY > 0 ? 1 : -1;
          const deltaMs = direction * span * 0.2;
          panTimeline(deltaMs);
        }
      },
      { passive: false },
    );
  }

  // Scroll bar drag for panning viewport
  if (timelineScrollBar && timelineScrollThumb) {
    let isDraggingScroll = false;
    let activeScrollPointerId: number | null = null;

    const applyScrollFromPointer = (event: PointerEvent) => {
      if (!timelineScrollBar || !currentTimelineBounds) return;
      const rect = timelineScrollBar.getBoundingClientRect();
      if (!rect.width) return;
      const x = Math.min(Math.max(event.clientX, rect.left), rect.right);
      const ratio = (x - rect.left) / rect.width;
      const centerMs =
        currentTimelineBounds.startMs +
        ratio * (currentTimelineBounds.stopMs - currentTimelineBounds.startMs);
      const viewport = getTimelineViewport();
      if (!viewport) return;
      const span = viewport.stopMs - viewport.startMs;
      setTimelineViewport(centerMs - span / 2, centerMs + span / 2);
    };

    timelineScrollThumb.addEventListener('pointerdown', (event) => {
      isDraggingScroll = true;
      activeScrollPointerId = event.pointerId;
      timelineScrollThumb.setPointerCapture(event.pointerId);
      noteUserTimelineInteraction();
      applyScrollFromPointer(event);
    });

    timelineScrollThumb.addEventListener('pointermove', (event) => {
      if (!isDraggingScroll || activeScrollPointerId !== event.pointerId) return;
      noteUserTimelineInteraction();
      applyScrollFromPointer(event);
    });

    const finishScrollDrag = (event: PointerEvent) => {
      if (!isDraggingScroll || activeScrollPointerId !== event.pointerId) return;
      isDraggingScroll = false;
      try {
        timelineScrollThumb.releasePointerCapture(event.pointerId);
      } catch {}
    };

    timelineScrollThumb.addEventListener('pointerup', finishScrollDrag);
    timelineScrollThumb.addEventListener('pointercancel', finishScrollDrag);
  }

  window.addEventListener('resize', () => {
    if (currentTimelineBounds) {
      // Let the panel reflow for the new viewport, then lock again.
      if (timelinePanel) timelinePanel.style.height = '';
      renderTimelineTicks();
      updateTimelineScrollBar();
      positionTimelineStack();
      lockTimelinePanelHeight();
      refreshTimelineUi(true);
    }
  });
}

function configureTimeline(
  scenarios: any[],
  bounds: { start: Cesium.JulianDate; stop: Cesium.JulianDate },
  baseMultiplier: number,
  autoPlay = true,
) {
  const firstScenario = scenarios[0];
  currentScenarioTimeZone = firstScenario?.content?.timeZone || firstScenario?.timeZone || 'UTC';
  currentTimelineBounds = {
    startMs: Cesium.JulianDate.toDate(bounds.start).getTime(),
    stopMs: Cesium.JulianDate.toDate(bounds.stop).getTime(),
  };
  // Reset viewport so initial load shows full timeline (no zoom).
  currentTimelineViewport = null;
  lastUserTimelineInteractionAt = Date.now();
  currentTimelineBaseMultiplier = baseMultiplier;
  currentTimelineSpeedFactor = 1;

  if (timelineSpeedSelect) {
    timelineSpeedSelect.value = '1';
  }

  renderTimelineTicks();
  setTimelinePanelVisible(true);
  updateTimelineScrollBar();
  applyTimelineSpeedFactor(currentTimelineSpeedFactor);
  setTimelinePlaybackState(autoPlay);
  refreshTimelineUi(true);
  startTimelineNowLabelTicker();
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

function focusScenarioLocationAsync(immediate = false): Promise<void> {
  if (!cesiumViewer) return Promise.resolve();

  if (currentScenarioRectangle) {
    if (immediate) {
      cesiumViewer.camera.setView({ destination: currentScenarioRectangle });
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      try {
        cesiumViewer.camera.flyTo({
          destination: currentScenarioRectangle,
          duration: 2.2,
          complete: () => resolve(),
          cancel: () => resolve(),
        });
      } catch {
        resolve();
      }
    });
  }

  if (cesiumViewer.entities?.values?.length) {
    return Promise.resolve()
      .then(() => cesiumViewer.zoomTo(cesiumViewer.entities))
      .then(() => undefined)
      .catch(() => {
        return new Promise((resolve) => {
          try {
            cesiumViewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(originLon, originLat, 120000),
              duration: 1.8,
              orientation: {
                heading: 0,
                pitch: Cesium.Math.toRadians(-55),
                roll: 0,
              },
              complete: () => resolve(),
              cancel: () => resolve(),
            });
          } catch {
            resolve();
          }
        });
      });
  }

  return new Promise((resolve) => {
    try {
      cesiumViewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(originLon, originLat, 120000),
        duration: 1.8,
        orientation: {
          heading: 0,
          pitch: Cesium.Math.toRadians(-55),
          roll: 0,
        },
        complete: () => resolve(),
        cancel: () => resolve(),
      });
    } catch {
      resolve();
    }
  });
}

function autoStartScenarioPlaybackAfterInitialZoom() {
  if (hasAutoStartedScenarioPlayback) return;
  if (!cesiumViewer || !currentTimelineBounds) return;
  hasAutoStartedScenarioPlayback = true;

  focusScenarioLocationAsync(false).finally(() => {
    // اگر کاربر خودش پلی کرده باشد، دوباره دست نزنیم.
    if (currentTimelinePlaying) return;
    setTimelinePlaybackState(true);
    refreshTimelineUi(true);
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
        currentScenarioName = resolveScenarioDisplayName(scenarios[0]) || '';
        setScenarioTitle(currentScenarioName || scenarioId || '');
        currentScenarioRectangle = getScenarioRectangle(scenarios[0]);
        const countryOverview = getCountryOverview(center.lon, center.lat);
        currentCountryOverviewName = countryOverview.name;
        console.log(`✅ Origin set to scenario center: ${originLon}, ${originLat}`);
        showCountryOverview(countryOverview, true);
        const environmentHost = document.getElementById('mainContainer');
        const environmentalConditions =
          scenarios[0]?.content?.environmentalConditions ?? [];
        environmentEffectController?.dispose();
        if (environmentHost && Array.isArray(environmentalConditions)) {
          environmentEffectController = new EnvironmentEffectController(
            environmentHost,
            environmentalConditions,
          );
        }
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
          (cesiumViewer as any).clock.shouldAnimate = false;

          if (!hasTimelineClockListener) {
            (cesiumViewer as any).clock.onTick.addEventListener(handleTimelineClockTick);
            hasTimelineClockListener = true;
          }

          configureTimeline(scenarios, bounds, multiplier, false);

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
      setScenarioTitle(currentScenarioName || scenarioId || '');

      if (scenarios.length > 0) {
        window.setTimeout(() => {
          autoStartScenarioPlaybackAfterInitialZoom();
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

