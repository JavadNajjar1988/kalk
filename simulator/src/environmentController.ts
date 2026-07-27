export interface SimulatorEnvironmentalCondition {
  id: string;
  kind?: string;
  type?: string;
  scope?: 'global' | 'area';
  startTime: string | number;
  endTime?: string | number;
  enabled?: boolean;
  priority?: number;
  geometry?: {
    type: string;
    coordinates: any;
  };
  parameters?: Record<string, any>;
  value?: number;
}

type EffectMode =
  | 'none'
  | 'rain'
  | 'snow'
  | 'fog'
  | 'dust'
  | 'smoke'
  | 'fire'
  | 'thunderstorm'
  | 'night';

function asEpoch(value: string | number | undefined, fallback: number) {
  if (value === undefined) return fallback;
  const numeric = typeof value === 'number' ? value : new Date(value).getTime();
  return Number.isFinite(numeric) ? numeric : fallback;
}

function pointInRing(point: [number, number], ring: number[][]) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const [x, y] = ring[index];
    const [previousX, previousY] = ring[previous];
    const intersects =
      y > point[1] !== previousY > point[1] &&
      point[0] <
        ((previousX - x) * (point[1] - y)) / (previousY - y || Number.EPSILON) + x;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function geometryContainsPoint(
  geometry: SimulatorEnvironmentalCondition['geometry'],
  point: [number, number],
  radiusMeters = 1000,
) {
  if (!geometry) return false;
  const tolerance = Math.max(radiusMeters, 1) / 111_320;
  if (geometry.type === 'Point') {
    const [x, y] = geometry.coordinates as [number, number];
    return Math.hypot(point[0] - x, point[1] - y) <= tolerance;
  }
  if (geometry.type === 'LineString') {
    const coordinates = geometry.coordinates as number[][];
    return coordinates.slice(1).some((current, index) => {
      const previous = coordinates[index];
      const dx = current[0] - previous[0];
      const dy = current[1] - previous[1];
      const lengthSquared = dx * dx + dy * dy || 1;
      const ratio = Math.max(
        0,
        Math.min(
          1,
          ((point[0] - previous[0]) * dx + (point[1] - previous[1]) * dy) /
            lengthSquared,
        ),
      );
      return (
        Math.hypot(
          point[0] - (previous[0] + ratio * dx),
          point[1] - (previous[1] + ratio * dy),
        ) <= tolerance
      );
    });
  }
  const polygonContains = (polygon: number[][][]) =>
    polygon.length > 0 &&
    pointInRing(point, polygon[0]) &&
    !polygon.slice(1).some(ring => pointInRing(point, ring));
  if (geometry.type === 'Polygon') return polygonContains(geometry.coordinates);
  if (geometry.type === 'MultiPolygon')
    return geometry.coordinates.some((polygon: number[][][]) => polygonContains(polygon));
  return false;
}

export function resolveSimulatorEnvironment(
  conditions: SimulatorEnvironmentalCondition[],
  timestamp: number,
  point: [number, number],
) {
  return conditions
    .filter(condition => {
      const active =
        condition.enabled !== false &&
        asEpoch(condition.startTime, Number.POSITIVE_INFINITY) <= timestamp &&
        timestamp < asEpoch(condition.endTime, Number.POSITIVE_INFINITY);
      if (!active) return false;
      return (
        condition.scope !== 'area' ||
        geometryContainsPoint(
          condition.geometry,
          point,
          Number(
            condition.parameters?.radiusMeters ??
              condition.parameters?.corridorWidthMeters ??
              1000,
          ),
        )
      );
    })
    .sort((first, second) => {
      const priority = (second.priority ?? 0) - (first.priority ?? 0);
      if (priority !== 0) return priority;
      if (first.scope !== second.scope) return first.scope === 'area' ? -1 : 1;
      return asEpoch(second.startTime, 0) - asEpoch(first.startTime, 0);
    });
}

interface Drop {
  x: number;
  y: number;
  speed: number;
  length: number;
  drift: number;
}

export class EnvironmentEffectController {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly conditions: SimulatorEnvironmentalCondition[];
  private drops: Drop[] = [];
  private mode: EffectMode = 'none';
  private intensity = 0;
  private animationFrame = 0;
  private lastSignature = '';

  constructor(host: HTMLElement, conditions: SimulatorEnvironmentalCondition[]) {
    this.conditions = conditions;
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('aria-hidden', 'true');
    Object.assign(this.canvas.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      zIndex: '3',
      pointerEvents: 'none',
    });
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Weather effect canvas is not available');
    this.context = context;
    host.appendChild(this.canvas);
    this.resize();
    window.addEventListener('resize', this.resize);
    this.animationFrame = requestAnimationFrame(this.render);
  }

  private resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const bounds = this.canvas.parentElement?.getBoundingClientRect();
    this.canvas.width = Math.max(1, Math.floor((bounds?.width ?? innerWidth) * ratio));
    this.canvas.height = Math.max(1, Math.floor((bounds?.height ?? innerHeight) * ratio));
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.drops = [];
  };

  update(timestamp: number, longitude: number, latitude: number) {
    const resolved = resolveSimulatorEnvironment(
      this.conditions,
      timestamp,
      [longitude, latitude],
    );
    const precipitation = resolved.find(
      condition => (condition.kind ?? condition.type) === 'precipitation',
    );
    const fog = resolved.find(
      condition => (condition.kind ?? condition.type) === 'fog',
    );
    const special = resolved.find(condition =>
      ['thunderstorm', 'dust_storm', 'blizzard', 'smoke', 'fire'].includes(
        condition.kind ?? condition.type ?? '',
      ),
    );
    const illumination = resolved.find(
      condition => (condition.kind ?? condition.type) === 'illumination',
    );
    const precipitationMode = precipitation?.parameters?.mode;
    const specialKind = special?.kind ?? special?.type;
    const nextMode: EffectMode =
      specialKind === 'thunderstorm'
        ? 'thunderstorm'
        : specialKind === 'dust_storm'
          ? 'dust'
          : specialKind === 'blizzard'
            ? 'snow'
            : specialKind === 'smoke'
              ? 'smoke'
              : specialKind === 'fire'
                ? 'fire'
                : precipitation
      ? precipitationMode === 'snow'
        ? 'snow'
        : 'rain'
      : fog
        ? 'fog'
        : illumination?.parameters?.phase === 'night'
          ? 'night'
        : 'none';
    const rawIntensity =
      special?.parameters?.intensity ??
      precipitation?.parameters?.intensity ??
      fog?.parameters?.intensity ??
      (illumination ? Math.max(0.15, 1 - Number(illumination.parameters?.lux ?? 10) / 100) : undefined) ??
      precipitation?.value ??
      fog?.value ??
      0;
    const nextIntensity = Math.max(0, Math.min(1, Number(rawIntensity)));
    const signature = `${nextMode}:${nextIntensity}`;
    if (signature === this.lastSignature) return;
    this.lastSignature = signature;
    this.mode = nextMode;
    this.intensity = nextIntensity;
    this.drops = [];
  }

  private render = () => {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.context.clearRect(0, 0, width, height);
    if (['fog', 'dust', 'smoke', 'fire', 'night'].includes(this.mode)) {
      const gradient = this.context.createLinearGradient(0, 0, 0, height);
      const tint =
        this.mode === 'dust'
          ? ['176, 132, 73', '120, 83, 45']
          : this.mode === 'smoke'
            ? ['95, 95, 100', '45, 45, 50']
            : this.mode === 'fire'
              ? ['125, 80, 55', '55, 45, 45']
              : this.mode === 'night'
                ? ['5, 15, 40', '1, 5, 20']
                : ['220, 230, 235', '190, 205, 215'];
      gradient.addColorStop(0, `rgba(${tint[0]}, ${0.12 + this.intensity * 0.2})`);
      gradient.addColorStop(1, `rgba(${tint[1]}, ${0.2 + this.intensity * 0.35})`);
      this.context.fillStyle = gradient;
      this.context.fillRect(0, 0, width, height);
    } else if (
      this.mode === 'rain' ||
      this.mode === 'snow' ||
      this.mode === 'thunderstorm'
    ) {
      const target = Math.round((this.mode === 'snow' ? 110 : 180) * this.intensity);
      while (this.drops.length < target) {
        this.drops.push({
          x: Math.random() * width,
          y: Math.random() * height,
          speed: this.mode === 'snow' ? 0.8 + Math.random() * 1.5 : 8 + Math.random() * 9,
          length: this.mode === 'snow' ? 2 + Math.random() * 3 : 10 + Math.random() * 16,
          drift: this.mode === 'snow' ? -0.5 + Math.random() : -2,
        });
      }
      this.context.strokeStyle = `rgba(185, 225, 255, ${0.3 + this.intensity * 0.55})`;
      this.context.fillStyle = `rgba(245, 250, 255, ${0.45 + this.intensity * 0.5})`;
      this.context.lineWidth = 1.2;
      this.drops.forEach(drop => {
        if (this.mode === 'snow') {
          this.context.beginPath();
          this.context.arc(drop.x, drop.y, drop.length, 0, Math.PI * 2);
          this.context.fill();
        } else {
          this.context.beginPath();
          this.context.moveTo(drop.x, drop.y);
          this.context.lineTo(drop.x + drop.drift, drop.y + drop.length);
          this.context.stroke();
        }
        drop.x += drop.drift;
        drop.y += drop.speed;
        if (drop.y > height + drop.length || drop.x < -20) {
          drop.x = Math.random() * width;
          drop.y = -drop.length;
        }
      });
      if (this.mode === 'thunderstorm' && Math.random() < 0.012 * this.intensity) {
        this.context.fillStyle = `rgba(235, 245, 255, ${0.25 + this.intensity * 0.35})`;
        this.context.fillRect(0, 0, width, height);
      }
    }
    this.animationFrame = requestAnimationFrame(this.render);
  };

  dispose() {
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener('resize', this.resize);
    this.canvas.remove();
  }
}
