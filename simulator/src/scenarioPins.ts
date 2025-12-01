import * as Cesium from 'cesium';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

interface BackendScenario {
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
function getScenarioCenter(s: BackendScenario, index: number, total: number): { lon: number; lat: number } {
  const c = s.content || {};

  // 1) اگر در metadata.mapCenter مختصات داشتیم
  const metaCenter = c?.metadata?.mapCenter || c?.meta?.mapCenter || c?.settings?.map?.center;
  if (metaCenter && typeof metaCenter.longitude === 'number' && typeof metaCenter.latitude === 'number') {
    return { lon: metaCenter.longitude, lat: metaCenter.latitude };
  }

  // 2) اگر در events یا واحدها مختصات داشتیم (حالت عمومی ORBAT)
  const units = Array.isArray(c.units) ? c.units : Array.isArray(c?.sides?.[0]?.units) ? c.sides[0].units : [];
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

export async function addScenarioPins(viewer: Cesium.Viewer): Promise<void> {
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
      return;
    }

    const json = (await res.json()) as ApiResponse<BackendScenario[]>;
    if (!json.success || !Array.isArray(json.data)) {
      console.error('Invalid scenarios API response:', json);
      return;
    }

    const scenarios = json.data;
    console.log(`Loaded ${scenarios.length} scenarios for pins`);

    if (scenarios.length === 0) {
      return;
    }

    // افزودن پین برای هر سناریو
    scenarios.forEach((scenario, index) => {
      const { lon, lat } = getScenarioCenter(scenario, index, scenarios.length);

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


