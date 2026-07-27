import type {
  EnvironmentalKind,
  EnvironmentalParameters,
} from "@/types/scenarioModels";

export interface EnvironmentPreset {
  id: string;
  label: string;
  kind: EnvironmentalKind;
  emoji: string;
  color: string;
  metocSidc?: string;
  parameters: EnvironmentalParameters;
}

export const ENVIRONMENT_PRESETS: EnvironmentPreset[] = [
  {
    id: "rain",
    label: "باران",
    kind: "precipitation",
    emoji: "🌧️",
    color: "#0284c7",
    metocSidc: "W-S-WSR-LI",
    parameters: { mode: "rain", intensity: 0.6 },
  },
  {
    id: "snow",
    label: "برف",
    kind: "precipitation",
    emoji: "🌨️",
    color: "#64748b",
    metocSidc: "W-S-WSS-LI",
    parameters: { mode: "snow", intensity: 0.6 },
  },
  {
    id: "hail",
    label: "تگرگ",
    kind: "precipitation",
    emoji: "⛈️",
    color: "#475569",
    metocSidc: "W-S-WSGRL-",
    parameters: { mode: "hail", intensity: 0.6 },
  },
  {
    id: "fog",
    label: "مه",
    kind: "fog",
    emoji: "🌫️",
    color: "#64748b",
    metocSidc: "W-S-WSFGSO",
    parameters: { intensity: 0.6, visibilityMeters: 800 },
  },
  {
    id: "wind",
    label: "باد",
    kind: "wind",
    emoji: "💨",
    color: "#0891b2",
    parameters: { speedMps: 10, directionDeg: 0 },
  },
  {
    id: "visibility",
    label: "محدوده دید",
    kind: "visibility",
    emoji: "👁️",
    color: "#7c3aed",
    parameters: { rangeMeters: 1000 },
  },
  {
    id: "temperature",
    label: "دما",
    kind: "temperature",
    emoji: "🌡️",
    color: "#dc2626",
    parameters: { celsius: 20 },
  },
  {
    id: "wet-ground",
    label: "زمین خیس",
    kind: "surface_condition",
    emoji: "💧",
    color: "#92400e",
    parameters: { condition: "wet", intensity: 0.6 },
  },
  {
    id: "muddy-ground",
    label: "زمین گل‌آلود",
    kind: "surface_condition",
    emoji: "🟤",
    color: "#78350f",
    parameters: { condition: "muddy", intensity: 0.7 },
  },
  {
    id: "cloud",
    label: "پوشش ابر",
    kind: "cloud_cover",
    emoji: "☁️",
    color: "#475569",
    parameters: { coverage: 0.7 },
  },
];

export function presetForCondition(
  kind: EnvironmentalKind,
  parameters: EnvironmentalParameters,
) {
  return (
    ENVIRONMENT_PRESETS.find((preset) => {
      if (preset.kind !== kind) return false;
      if ("mode" in preset.parameters && "mode" in parameters) {
        return preset.parameters.mode === parameters.mode;
      }
      if ("condition" in preset.parameters && "condition" in parameters) {
        return preset.parameters.condition === parameters.condition;
      }
      return true;
    }) ?? ENVIRONMENT_PRESETS[0]
  );
}
