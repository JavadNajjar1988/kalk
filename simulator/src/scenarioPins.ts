import * as Cesium from 'cesium';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface BackendScenario {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
  content?: any;
}

type ScenarioPosition = { lon: number; lat: number };

function parsePositionLike(value: any): ScenarioPosition | null {
  if (Array.isArray(value) && value.length >= 2) {
    const lon = Number(value[0]);
    const lat = Number(value[1]);
    if (Number.isFinite(lon) && Number.isFinite(lat)) {
      return { lon, lat };
    }
  }

  if (value && typeof value === 'object') {
    const lon = Number(value.longitude ?? value.lon ?? value.lng);
    const lat = Number(value.latitude ?? value.lat);
    if (Number.isFinite(lon) && Number.isFinite(lat)) {
      return { lon, lat };
    }
  }

  return null;
}

function collectUnitPositions(unit: any, out: ScenarioPosition[]) {
  const direct = parsePositionLike(unit?.position ?? unit?.location);
  if (direct) out.push(direct);

  if (Array.isArray(unit?.state)) {
    unit.state.forEach((state: any) => {
      const pos = parsePositionLike(state?.position ?? state?.location);
      if (pos) out.push(pos);
    });
  }

  if (Array.isArray(unit?.subUnits)) {
    unit.subUnits.forEach((subUnit: any) => collectUnitPositions(subUnit, out));
  }
}

function collectScenarioPositions(content: any): ScenarioPosition[] {
  const positions: ScenarioPosition[] = [];

  const metaCenter = content?.metadata?.mapCenter || content?.meta?.mapCenter || content?.settings?.map?.center;
  const metaPos = parsePositionLike(metaCenter);
  if (metaPos) positions.push(metaPos);

  if (Array.isArray(content?.units)) {
    content.units.forEach((unit: any) => collectUnitPositions(unit, positions));
  }

  if (Array.isArray(content?.sides)) {
    content.sides.forEach((side: any) => {
      if (Array.isArray(side?.units)) {
        side.units.forEach((unit: any) => collectUnitPositions(unit, positions));
      }
      if (Array.isArray(side?.subUnits)) {
        side.subUnits.forEach((unit: any) => collectUnitPositions(unit, positions));
      }
      if (Array.isArray(side?.groups)) {
        side.groups.forEach((group: any) => {
          if (Array.isArray(group?.subUnits)) {
            group.subUnits.forEach((unit: any) => collectUnitPositions(unit, positions));
          }
        });
      }
    });
  }

  if (Array.isArray(content?.events)) {
    content.events.forEach((event: any) => {
      const geometry = event?.where?.geometry;
      if (!geometry?.coordinates) return;

      const stack = [geometry.coordinates];
      while (stack.length > 0) {
        const current = stack.pop();
        if (!Array.isArray(current)) continue;

        if (current.length >= 2 && typeof current[0] === 'number' && typeof current[1] === 'number') {
          const pos = parsePositionLike(current);
          if (pos) positions.push(pos);
        } else {
          current.forEach((item) => stack.push(item));
        }
      }
    });
  }

  return positions;
}

function getCentroid(positions: ScenarioPosition[]): ScenarioPosition | null {
  if (positions.length === 0) return null;

  const sum = positions.reduce(
    (acc, pos) => {
      acc.lon += pos.lon;
      acc.lat += pos.lat;
      return acc;
    },
    { lon: 0, lat: 0 }
  );

  return {
    lon: sum.lon / positions.length,
    lat: sum.lat / positions.length,
  };
}

export function getScenarioRectangle(s: BackendScenario): Cesium.Rectangle | null {
  const positions = collectScenarioPositions(s.content || {});
  if (positions.length === 0) return null;

  let west = positions[0].lon;
  let east = positions[0].lon;
  let south = positions[0].lat;
  let north = positions[0].lat;

  positions.forEach((pos) => {
    west = Math.min(west, pos.lon);
    east = Math.max(east, pos.lon);
    south = Math.min(south, pos.lat);
    north = Math.max(north, pos.lat);
  });

  const minSpan = 0.12;
  if (east - west < minSpan) {
    const pad = (minSpan - (east - west)) / 2;
    west -= pad;
    east += pad;
  }
  if (north - south < minSpan) {
    const pad = (minSpan - (north - south)) / 2;
    south -= pad;
    north += pad;
  }

  return Cesium.Rectangle.fromDegrees(west, south, east, north);
}

// تعیین آدرس پایه API مشابه داشبورد
function resolveApiBase(): string {
  const envUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname, origin } = window.location;
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
    if (isLocalHost) {
      return `${protocol}//${hostname}:8002/api`;
    }
    return `${origin.replace(/\/+$/, '')}/api`;
  }

  return 'http://127.0.0.1:8002/api';
}

function resolveKalknegarBase(): string {
  const raw = (import.meta as any).env?.VITE_KALKNEGAR_URL as string | undefined;
  if (raw && raw.trim().length > 0) {
    return raw.trim().replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:5180`;
  }

  return 'http://127.0.0.1:5180';
}

function buildDemoScenarioUrls(id: string): string[] {
  const normalizedId = id.startsWith('demo-') ? id.slice(5) : id;
  const encodedId = encodeURIComponent(normalizedId);
  const kalknegarBase = resolveKalknegarBase().replace(/\/+$/, '');
  const basePath = ((import.meta as any).env?.BASE_URL as string | undefined) || '/';
  const normalizedBasePath = basePath.startsWith('/') ? basePath : `/${basePath}`;

  const candidates = new Set<string>();

  const pushCandidate = (base: string, path: string) => {
    candidates.add(`${base.replace(/\/+$/, '')}${path}`);
  };

  pushCandidate(kalknegarBase, `/scenarios/${encodedId}.json`);

  if (!/\/kalknegar$/i.test(kalknegarBase)) {
    pushCandidate(kalknegarBase, `/kalknegar/scenarios/${encodedId}.json`);
  }

  if (typeof window !== 'undefined') {
    const origin = window.location.origin.replace(/\/+$/, '');
    pushCandidate(origin, `${normalizedBasePath.replace(/\/+$/, '/')}scenarios/${encodedId}.json`);
    pushCandidate(origin, `/kalknegar/scenarios/${encodedId}.json`);
    pushCandidate(origin, `/scenarios/${encodedId}.json`);
  }

  return Array.from(candidates);
}

async function fetchDemoScenarioById(id: string): Promise<BackendScenario | null> {
  const normalizedId = id.startsWith('demo-') ? id.slice(5) : id;
  const demoUrls = buildDemoScenarioUrls(id);

  try {
    console.log('%c[Simulator] Loading demo scenario from KalkNegar public JSON', 'color: #4CAF50; font-weight: bold;');
    console.log('  Demo URL candidates:', demoUrls);

    for (const demoUrl of demoUrls) {
      try {
        console.log('  Trying demo URL:', demoUrl);

        const res = await fetch(demoUrl, {
          headers: { Accept: 'application/json' },
        });

        if (!res.ok) {
          console.warn('[Simulator] Demo scenario URL did not respond with success:', demoUrl, res.status, res.statusText);
          continue;
        }

        const content = await res.json();
        if (!content || typeof content !== 'object') {
          console.warn('[Simulator] Demo scenario JSON is invalid for URL:', demoUrl, content);
          continue;
        }

        const scenario: BackendScenario = {
          id,
          name: String((content as any).name || normalizedId),
          description: (content as any).description ?? null,
          image: (content as any).image ?? null,
          content,
        };

        console.log('[Simulator] Demo scenario loaded successfully from:', demoUrl);
        console.log('  Scenario name:', scenario.name);
        return scenario;
      } catch (error) {
        console.warn('[Simulator] Exception while trying demo URL:', demoUrl, error);
      }
    }

    console.error('[Simulator] All demo scenario URLs failed for:', id);
    return null;
  } catch (error) {
    console.error('[Simulator] Exception while loading demo scenario JSON:', error);
    return null;
  }
}

// تلاش برای استخراج مرکز سناریو از content (در صورت موجود بودن)
export function getScenarioCenter(s: BackendScenario, index: number, total: number): { lon: number; lat: number } {
  const c = s.content || {};

  // 1) اگر در metadata.mapCenter مختصات داشتیم
  const metaCenter = c?.metadata?.mapCenter || c?.meta?.mapCenter || c?.settings?.map?.center;
  if (metaCenter && typeof metaCenter.longitude === 'number' && typeof metaCenter.latitude === 'number') {
    return { lon: metaCenter.longitude, lat: metaCenter.latitude };
  }

  // 2) اگر tacticalSymbols داشتیم (Odin/Orbit: EPSG:3857) - مرکز تقریبی حساب کن
  // این مسیر وقتی مهم می‌شود که `content.layers` و `content.units` خالی باشند.
  try {
    const tuples = c?.metadata?.tacticalSymbols?.tuples;
    if (Array.isArray(tuples) && tuples.length > 0) {
      const EARTH_RADIUS = 6378137;
      const RAD2DEG = 180 / Math.PI;

      const mercatorToWgs84 = (x: number, y: number) => {
        const lon = (x / EARTH_RADIUS) * RAD2DEG;
        const lat = (Math.atan(Math.exp(y / EARTH_RADIUS)) * 2 - Math.PI / 2) * RAD2DEG;
        return { lon, lat };
      };

      const isWebMercatorPair = (pair: any): pair is number[] => {
        if (!Array.isArray(pair) || pair.length < 2) return false;
        const x = Number(pair[0]);
        const y = Number(pair[1]);
        return Number.isFinite(x) && Number.isFinite(y) && (Math.abs(x) > 180 || Math.abs(y) > 90);
      };

      const findFirstCoordPair = (obj: any): number[] | null => {
        if (!obj) return null;
        if (obj.type === 'Point' && Array.isArray(obj.coordinates)) {
          return obj.coordinates as number[];
        }
        if (Array.isArray(obj.geometries)) {
          for (const g of obj.geometries) {
            const hit = findFirstCoordPair(g);
            if (hit) return hit;
          }
        }
        if (Array.isArray(obj.coordinates)) {
          const stack = [...obj.coordinates];
          while (stack.length) {
            const cur = stack.shift();
            if (isWebMercatorPair(cur)) return [Number(cur[0]), Number(cur[1])];
            if (Array.isArray(cur)) stack.push(...cur);
          }
        }
        return null;
      };

      const lonLats: Array<{ lon: number; lat: number }> = [];
      for (const tuple of tuples) {
        if (!Array.isArray(tuple)) continue;
        const [key, val] = tuple as [string, any];
        if (!key.startsWith('feature:')) continue;
        if (!val || typeof val !== 'object') continue;
        if (val.type !== 'Feature') continue;
        const geom = val.geometry;
        const pair = findFirstCoordPair(geom);
        if (!pair) continue;
        const { lon, lat } = mercatorToWgs84(pair[0], pair[1]);
        if (Number.isFinite(lon) && Number.isFinite(lat)) {
          lonLats.push({ lon, lat });
        }
      }

      if (lonLats.length > 0) {
        const sum = lonLats.reduce(
          (acc, p) => {
            acc.lon += p.lon;
            acc.lat += p.lat;
            return acc;
          },
          { lon: 0, lat: 0 },
        );
        return { lon: sum.lon / lonLats.length, lat: sum.lat / lonLats.length };
      }
    }
  } catch {
    // ignore - fallback to unit/iran center
  }

  // 2) اگر در events یا واحدها مختصات داشتیم (حالت عمومی ORBAT)
  const units = Array.isArray(c.units)
    ? c.units
    : Array.isArray(c?.sides?.[0]?.units)
      ? c.sides[0].units
      : [];
  const firstUnit = units.find((u: any) => u?.position && typeof u.position.longitude === 'number' && typeof u.position.latitude === 'number');
  if (firstUnit) {
    return {
      lon: firstUnit.position.longitude,
      lat: firstUnit.position.latitude,
    };
  }

  // 3) اگر هیچ مختصاتی نداریم، سناریوها را دور مرکز ایران پخش می‌کنیم تا حداقل دیده شوند
  const iranCenterLon = 53.6880;
  const iranCenterLat = 32.4279;

  const angle = (index / Math.max(1, total)) * Math.PI * 2;
  const radiusDeg = 1.5; // حدوداً ~۱۵۰ کیلومتر

  const lon = iranCenterLon + radiusDeg * Math.cos(angle);
  const lat = iranCenterLat + radiusDeg * Math.sin(angle);

  return { lon, lat };
}

export async function fetchScenarios(): Promise<BackendScenario[]> {
  try {
    const baseUrl = resolveApiBase();
    const url = `${baseUrl}/scenarios`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    // استفاده از همان توکن JWT که داشبورد استفاده می‌کند (در localStorage)
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('Fetching scenarios for pins from:', url);
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.error('Failed to fetch scenarios:', res.status, res.statusText);
      return [];
    }

    const json = (await res.json()) as ApiResponse<BackendScenario[]> | BackendScenario[];
    const scenarios = Array.isArray((json as ApiResponse<BackendScenario[]>).data)
      ? (json as ApiResponse<BackendScenario[]>).data
      : Array.isArray(json)
        ? json
        : [];
    if (scenarios.length === 0) {
      console.error('Invalid scenarios API response:', json);
      return [];
    }
    console.log(`Loaded ${scenarios.length} scenarios for pins`);

    return scenarios;
  } catch (error) {
    console.error('Error while fetching scenarios:', error);
    return [];
  }
}

export async function fetchScenarioById(id: string): Promise<BackendScenario | null> {
  if (!id) return null;

  if (id.startsWith('demo-')) {
    const demoScenario = await fetchDemoScenarioById(id);
    if (demoScenario) {
      return demoScenario;
    }
  }

  try {
    const baseUrl = resolveApiBase();
    const url = `${baseUrl}/scenarios/${encodeURIComponent(id)}`;
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('%c📡 Fetching specific scenario...', 'color: cyan; font-weight: bold;');
    console.log('  URL:', url);
    console.log('  Scenario ID:', id);
    console.log('  Has token:', !!token);

    const res = await fetch(url, { headers });

    console.log('  Response status:', res.status, res.statusText);

    if (!res.ok) {
      console.error('%c❌ Failed to fetch scenario:', 'color: red; font-weight: bold;', res.status, res.statusText);
      if (res.status === 401) {
        console.error('  → Authentication failed! Token might be expired. Please login again.');
      } else if (res.status === 404) {
        console.error('  → Scenario not found! ID:', id);
      }
      return null;
    }
    const json = (await res.json()) as ApiResponse<BackendScenario> | BackendScenario;
    const scenario = (json as ApiResponse<BackendScenario>).data ?? (json as BackendScenario);
    if (!scenario || typeof scenario !== 'object') {
      console.error('Invalid scenario API response:', json);
      return null;
    }

    console.log('%c✅ Scenario loaded successfully!', 'color: green; font-weight: bold;');
    console.log('  Name:', scenario.name || 'N/A');
    console.log('  ID:', scenario.id);
    console.log('  Has content:', !!scenario.content);
    if (scenario.content) {
      console.log('  Content keys:', Object.keys(scenario.content));
      console.log('  Number of sides:', scenario.content.sides?.length || 0);
      console.log('  Number of layers:', scenario.content.layers?.length || 0);
    }

    return scenario;
  } catch (error) {
    console.error('%c💥 Exception while fetching scenario:', 'color: red; font-weight: bold;', error);
    return null;
  }
}

export async function addScenarioPins(
  viewer: Cesium.Viewer,
  scenarios?: BackendScenario[]
): Promise<void> {
  try {
    const resolvedScenarios = scenarios ?? (await fetchScenarios());

    if (!resolvedScenarios.length) {
      return;
    }

    // افزودن پین برای هر سناریو
    resolvedScenarios.forEach((scenario, index) => {
      const { lon, lat } = getScenarioCenter(scenario, index, resolvedScenarios.length);

      const position = Cesium.Cartesian3.fromDegrees(lon, lat, 0);

      viewer.entities.add({
        id: `scenario-${scenario.id}`,
        position,
        point: {
          pixelSize: 12,
          color: Cesium.Color.YELLOW,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
        label: {
          text: scenario.name || 'سناریو',
          font: '16px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -20),
        },
        description: scenario.description || '',
      });
    });

    console.log('Scenario pins added to Cesium viewer');
  } catch (error) {
    console.error('Error while adding scenario pins:', error);
  }
}


