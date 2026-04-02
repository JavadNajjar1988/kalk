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

// تعیین آدرس پایه API مشابه داشبورد
function resolveApiBase(): string {
  const envUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    // پیش‌فرض بک‌اند روی پورت 8000
    return `${protocol}//${hostname}:8000/api`;
  }

  return 'http://127.0.0.1:8000/api';
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


