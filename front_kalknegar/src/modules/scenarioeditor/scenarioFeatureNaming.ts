import type {
  ScenarioFeature,
  ScenarioFeatureType,
} from "@/types/scenarioGeoModels";
import type { NScenarioFeature } from "@/types/internalModels";

export const DEFAULT_SCENARIO_LAYER_NAME = "ویژگی‌ها";
export const DEFAULT_NEW_SCENARIO_LAYER_NAME = "لایه جدید";
export const DEFAULT_SCENARIO_FEATURE_NAME = "ویژگی";

const legacyLayerNameMap: Record<string, string> = {
  Features: DEFAULT_SCENARIO_LAYER_NAME,
  "New layer": DEFAULT_NEW_SCENARIO_LAYER_NAME,
};

export const scenarioFeatureTypeLabels: Record<ScenarioFeatureType, string> = {
  Point: "نقطه",
  LineString: "خط",
  Polygon: "چندضلعی",
  Circle: "دایره",
  MultiPoint: "چندنقطه‌ای",
  MultiLineString: "چندخطی",
  MultiPolygon: "چندچندضلعی",
  GeometryCollection: "مجموعه هندسه",
};

function toPersianNumber(value: number): string {
  return value.toLocaleString("fa-IR");
}

export function getScenarioLayerDisplayName(name: string): string {
  return legacyLayerNameMap[name] ?? name;
}

export function getScenarioFeatureTypeLabel(
  type: ScenarioFeatureType | string | undefined,
): string {
  if (!type) return DEFAULT_SCENARIO_FEATURE_NAME;
  return scenarioFeatureTypeLabels[type as ScenarioFeatureType] ?? type;
}

export function getScenarioFeatureDefaultName(
  type: ScenarioFeatureType | string | undefined,
  sequence: number,
): string {
  return `${getScenarioFeatureTypeLabel(type)} ${toPersianNumber(sequence)}`;
}

export function getScenarioFeatureDisplayName(
  feature: Pick<NScenarioFeature | ScenarioFeature, "meta" | "geometry" | "type">,
): string {
  return (
    feature.meta.name ||
    getScenarioFeatureTypeLabel(feature.meta.type || feature.geometry?.type) ||
    String(feature.type || DEFAULT_SCENARIO_FEATURE_NAME)
  );
}
