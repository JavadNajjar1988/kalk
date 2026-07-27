import type {
  EnvironmentalKind,
  EnvironmentalParameters,
} from "@/types/scenarioModels";

export interface EnvironmentFieldOption {
  value: string;
  label: string;
}

export interface EnvironmentField {
  key: string;
  label: string;
  type: "number" | "select";
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: EnvironmentFieldOption[];
}

export interface EnvironmentPreset {
  id: string;
  category: "atmosphere" | "terrain" | "infrastructure";
  label: string;
  kind: EnvironmentalKind;
  emoji: string;
  color: string;
  metocSidc?: string;
  parameters: EnvironmentalParameters;
  fields: EnvironmentField[];
}

const intensity: EnvironmentField = {
  key: "intensity",
  label: "شدت",
  type: "number",
  min: 0,
  max: 1,
  step: 0.1,
};
const visibility: EnvironmentField = {
  key: "visibilityMeters",
  label: "برد دید",
  type: "number",
  unit: "متر",
  min: 0,
};

export const ENVIRONMENT_PRESETS: EnvironmentPreset[] = [
  {
    id: "rain",
    category: "atmosphere",
    label: "باران",
    kind: "precipitation",
    emoji: "🌧️",
    color: "#0284c7",
    metocSidc: "W-S-WSR-LI",
    parameters: { mode: "rain", intensity: 0.6, rateMmPerHour: 8 },
    fields: [
      intensity,
      { key: "rateMmPerHour", label: "نرخ بارش", type: "number", unit: "mm/h", min: 0 },
    ],
  },
  {
    id: "snow",
    category: "atmosphere",
    label: "برف",
    kind: "precipitation",
    emoji: "🌨️",
    color: "#64748b",
    metocSidc: "W-S-WSS-LI",
    parameters: { mode: "snow", intensity: 0.6, rateMmPerHour: 5 },
    fields: [intensity, { key: "rateMmPerHour", label: "نرخ بارش", type: "number", unit: "mm/h", min: 0 }],
  },
  {
    id: "hail",
    category: "atmosphere",
    label: "تگرگ",
    kind: "precipitation",
    emoji: "⛈️",
    color: "#475569",
    metocSidc: "W-S-WSGRL-",
    parameters: { mode: "hail", intensity: 0.6, diameterMm: 8 },
    fields: [intensity, { key: "diameterMm", label: "قطر دانه", type: "number", unit: "mm", min: 0 }],
  },
  {
    id: "thunderstorm",
    category: "atmosphere",
    label: "رعدوبرق",
    kind: "thunderstorm",
    emoji: "🌩️",
    color: "#4338ca",
    metocSidc: "W-S-WSTMH-",
    parameters: { intensity: 0.7, lightningPerMinute: 5 },
    fields: [intensity, { key: "lightningPerMinute", label: "تعداد صاعقه", type: "number", unit: "در دقیقه", min: 0 }],
  },
  {
    id: "dust-storm",
    category: "atmosphere",
    label: "گردوغبار",
    kind: "dust_storm",
    emoji: "🌪️",
    color: "#a16207",
    metocSidc: "W-S-WSDSLM",
    parameters: { intensity: 0.7, visibilityMeters: 500 },
    fields: [intensity, visibility],
  },
  {
    id: "blizzard",
    category: "atmosphere",
    label: "کولاک",
    kind: "blizzard",
    emoji: "🌬️",
    color: "#64748b",
    parameters: { intensity: 0.8, visibilityMeters: 300, windSpeedMps: 18 },
    fields: [intensity, visibility, { key: "windSpeedMps", label: "سرعت باد", type: "number", unit: "m/s", min: 0 }],
  },
  {
    id: "fog",
    category: "atmosphere",
    label: "مه",
    kind: "fog",
    emoji: "🌫️",
    color: "#64748b",
    metocSidc: "W-S-WSFGSO",
    parameters: { intensity: 0.6, visibilityMeters: 800 },
    fields: [intensity, visibility],
  },
  {
    id: "smoke",
    category: "atmosphere",
    label: "دود",
    kind: "smoke",
    emoji: "💨",
    color: "#52525b",
    parameters: { intensity: 0.7, visibilityMeters: 600 },
    fields: [intensity, visibility],
  },
  {
    id: "fire",
    category: "atmosphere",
    label: "آتش‌سوزی",
    kind: "fire",
    emoji: "🔥",
    color: "#dc2626",
    parameters: { intensity: 0.7, spreadRateMph: 50 },
    fields: [intensity, { key: "spreadRateMph", label: "سرعت گسترش", type: "number", unit: "m/h", min: 0 }],
  },
  {
    id: "wind",
    category: "atmosphere",
    label: "باد",
    kind: "wind",
    emoji: "💨",
    color: "#0891b2",
    parameters: { speedMps: 10, directionDeg: 0, gustMps: 14 },
    fields: [
      { key: "speedMps", label: "سرعت", type: "number", unit: "m/s", min: 0 },
      { key: "directionDeg", label: "جهت", type: "number", unit: "درجه", min: 0, max: 359 },
      { key: "gustMps", label: "سرعت تندباد", type: "number", unit: "m/s", min: 0 },
    ],
  },
  {
    id: "visibility",
    category: "atmosphere",
    label: "محدوده دید",
    kind: "visibility",
    emoji: "👁️",
    color: "#7c3aed",
    parameters: { rangeMeters: 1000 },
    fields: [{ key: "rangeMeters", label: "برد دید", type: "number", unit: "متر", min: 0 }],
  },
  {
    id: "temperature",
    category: "atmosphere",
    label: "دما",
    kind: "temperature",
    emoji: "🌡️",
    color: "#dc2626",
    parameters: { celsius: 20 },
    fields: [{ key: "celsius", label: "دما", type: "number", unit: "°C" }],
  },
  {
    id: "humidity",
    category: "atmosphere",
    label: "رطوبت",
    kind: "humidity",
    emoji: "💧",
    color: "#0ea5e9",
    parameters: { percent: 60 },
    fields: [{ key: "percent", label: "رطوبت نسبی", type: "number", unit: "%", min: 0, max: 100 }],
  },
  {
    id: "pressure",
    category: "atmosphere",
    label: "فشار هوا",
    kind: "pressure",
    emoji: "🧭",
    color: "#0369a1",
    parameters: { hPa: 1013 },
    fields: [{ key: "hPa", label: "فشار", type: "number", unit: "hPa", min: 800, max: 1100 }],
  },
  {
    id: "cloud",
    category: "atmosphere",
    label: "پوشش ابر",
    kind: "cloud_cover",
    emoji: "☁️",
    color: "#475569",
    parameters: { coverage: 0.7, baseMeters: 1200 },
    fields: [{ ...intensity, key: "coverage", label: "پوشش" }, { key: "baseMeters", label: "ارتفاع پایه ابر", type: "number", unit: "متر", min: 0 }],
  },
  {
    id: "illumination",
    category: "atmosphere",
    label: "روشنایی",
    kind: "illumination",
    emoji: "🌙",
    color: "#7c3aed",
    parameters: { lux: 10, phase: "night" },
    fields: [
      { key: "lux", label: "شدت روشنایی", type: "number", unit: "lux", min: 0 },
      { key: "phase", label: "وضعیت", type: "select", options: [
        { value: "day", label: "روز" }, { value: "dawn", label: "سپیده‌دم" },
        { value: "dusk", label: "غروب" }, { value: "night", label: "شب" },
      ] },
    ],
  },
  ...[
    ["dry-ground", "زمین خشک", "dry", "🏜️", "#a16207"],
    ["wet-ground", "زمین خیس", "wet", "💧", "#92400e"],
    ["muddy-ground", "زمین گل‌آلود", "muddy", "🟤", "#78350f"],
    ["icy-ground", "زمین یخ‌زده", "icy", "🧊", "#0891b2"],
    ["snow-ground", "زمین برفی", "snow_covered", "❄️", "#64748b"],
  ].map(([id, label, condition, emoji, color]) => ({
    id,
    category: "terrain" as const,
    label,
    kind: "surface_condition" as const,
    emoji,
    color,
    parameters: { condition, intensity: 0.6 },
    fields: [intensity],
  })),
  {
    id: "flood",
    category: "terrain",
    label: "آب‌گرفتگی/سیلاب",
    kind: "flood",
    emoji: "🌊",
    color: "#0369a1",
    parameters: { depthMeters: 0.5, flowMps: 0.3 },
    fields: [
      { key: "depthMeters", label: "عمق", type: "number", unit: "متر", min: 0 },
      { key: "flowMps", label: "سرعت جریان", type: "number", unit: "m/s", min: 0 },
    ],
  },
  {
    id: "soil-bearing",
    category: "terrain",
    label: "تحمل خاک",
    kind: "soil_bearing",
    emoji: "⚖️",
    color: "#854d0e",
    parameters: { kPa: 100, soilType: "soil" },
    fields: [
      { key: "kPa", label: "ظرفیت تحمل", type: "number", unit: "kPa", min: 0 },
      { key: "soilType", label: "جنس سطح", type: "select", options: [
        { value: "soil", label: "خاک" }, { value: "sand", label: "شن" },
        { value: "rock", label: "سنگ" }, { value: "asphalt", label: "آسفالت" },
      ] },
    ],
  },
  {
    id: "slope",
    category: "terrain",
    label: "شیب",
    kind: "slope",
    emoji: "📐",
    color: "#65a30d",
    parameters: { degrees: 15, aspectDeg: 0 },
    fields: [
      { key: "degrees", label: "شیب", type: "number", unit: "درجه", min: 0, max: 90 },
      { key: "aspectDeg", label: "جهت شیب", type: "number", unit: "درجه", min: 0, max: 359 },
    ],
  },
  {
    id: "roughness",
    category: "terrain",
    label: "ناهمواری",
    kind: "roughness",
    emoji: "⛰️",
    color: "#57534e",
    parameters: { level: 3 },
    fields: [{ key: "level", label: "درجه ناهمواری", type: "number", min: 1, max: 5, step: 1 }],
  },
  {
    id: "vegetation",
    category: "terrain",
    label: "پوشش گیاهی",
    kind: "vegetation",
    emoji: "🌳",
    color: "#15803d",
    parameters: { density: 0.6, heightMeters: 3 },
    fields: [{ ...intensity, key: "density", label: "تراکم" }, { key: "heightMeters", label: "ارتفاع متوسط", type: "number", unit: "متر", min: 0 }],
  },
  {
    id: "elevation",
    category: "terrain",
    label: "ارتفاع",
    kind: "elevation",
    emoji: "🏔️",
    color: "#475569",
    parameters: { metersAsl: 1000 },
    fields: [{ key: "metersAsl", label: "ارتفاع از سطح دریا", type: "number", unit: "متر" }],
  },
  {
    id: "road",
    category: "infrastructure",
    label: "وضعیت جاده",
    kind: "road_condition",
    emoji: "🛣️",
    color: "#334155",
    parameters: { condition: "open", maxSpeedKph: 60 },
    fields: [
      { key: "condition", label: "وضعیت", type: "select", options: [
        { value: "open", label: "باز" }, { value: "damaged", label: "آسیب‌دیده" },
        { value: "blocked", label: "مسدود" }, { value: "mined", label: "مین‌گذاری‌شده" },
      ] },
      { key: "maxSpeedKph", label: "حداکثر سرعت", type: "number", unit: "km/h", min: 0 },
    ],
  },
  {
    id: "bridge",
    category: "infrastructure",
    label: "وضعیت پل",
    kind: "bridge_condition",
    emoji: "🌉",
    color: "#475569",
    parameters: { condition: "operational", loadClass: 40 },
    fields: [
      { key: "condition", label: "وضعیت", type: "select", options: [
        { value: "operational", label: "عملیاتی" }, { value: "damaged", label: "آسیب‌دیده" },
        { value: "destroyed", label: "منهدم" },
      ] },
      { key: "loadClass", label: "کلاس بار", type: "number", min: 0 },
    ],
  },
  {
    id: "water-crossing",
    category: "infrastructure",
    label: "گذرگاه آبی",
    kind: "water_crossing",
    emoji: "🚙",
    color: "#0e7490",
    parameters: { depthMeters: 0.4, widthMeters: 20, flowMps: 0.5 },
    fields: [
      { key: "depthMeters", label: "عمق", type: "number", unit: "متر", min: 0 },
      { key: "widthMeters", label: "عرض", type: "number", unit: "متر", min: 0 },
      { key: "flowMps", label: "سرعت جریان", type: "number", unit: "m/s", min: 0 },
    ],
  },
];

export function presetForCondition(
  kind: EnvironmentalKind,
  parameters: EnvironmentalParameters,
) {
  return (
    ENVIRONMENT_PRESETS.find((preset) => {
      if (preset.kind !== kind) return false;
      if (preset.parameters.mode && parameters.mode) {
        return preset.parameters.mode === parameters.mode;
      }
      if (preset.parameters.condition && parameters.condition) {
        return preset.parameters.condition === parameters.condition;
      }
      return true;
    }) ?? ENVIRONMENT_PRESETS[0]
  );
}
