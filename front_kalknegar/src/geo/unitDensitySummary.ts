import Feature from "ol/Feature";
import VectorLayer from "ol/layer/Vector";
import ClusterSource from "ol/source/Cluster";
import type VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style, Text } from "ol/style";
import type { FeatureLike } from "ol/Feature";
import type { NUnit } from "@/types/internalModels";
import type { UnitSymbolOptions } from "@/types/scenarioModels";
import { Sidc } from "@/symbology/sidc";
import { symbolGenerator } from "@/symbology/milsymbwrapper";
import { useSettingsStore, useSymbolSettingsStore } from "@/stores/settingsStore";
import { createMilSymbolStyle } from "@/geo/unitStyles";

type UnitLike = Pick<NUnit, "id" | "sidc" | "_state" | "symbolOptions" | "textAmplifiers">;

const ECHELON_ORDER = [
  "00",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
];

export const UNIT_DENSITY_DISTANCE_PX = 64;
export const UNIT_DENSITY_MIN_DISTANCE_PX = 24;

const styleCache = new Map<string, Style>();

export function clearUnitDensityStyleCache() {
  styleCache.clear();
}

function echelonIndex(echelon: string) {
  const index = ECHELON_ORDER.indexOf(echelon);
  return index >= 0 ? index : 0;
}

function minEchelonForCount(count: number) {
  if (count >= 8) return "21";
  if (count >= 4) return "18";
  if (count >= 2) return null;
  return null;
}

export function promoteEchelonForCluster(echelon: string, count: number) {
  if (count < 2) return echelon;

  const baseIndex = echelonIndex(echelon);
  const nextEchelon = ECHELON_ORDER[Math.min(ECHELON_ORDER.length - 1, baseIndex + 1)];
  const minimum = minEchelonForCount(count);
  if (!minimum) return nextEchelon;

  return echelonIndex(minimum) > echelonIndex(nextEchelon) ? minimum : nextEchelon;
}

export function summarySidcForUnits(units: UnitLike[]) {
  const representative = units[0];
  if (!representative) return "10031000000000000000";

  const sidc = new Sidc(representative._state?.sidc || representative.sidc);
  sidc.emt = promoteEchelonForCluster(sidc.emt, units.length);
  return sidc.toString();
}

export function unitDensityFeatureOpacity({
  hasDensitySummary,
}: {
  hasDensitySummary: boolean;
}) {
  return hasDensitySummary ? 0.35 : 1;
}

export function isDensityCluster(feature: FeatureLike) {
  const members = feature.get("features");
  return Array.isArray(members) && members.length > 1;
}

export function createUnitDensityLayer(options: {
  source: VectorSource;
  getUnitById: (id: string) => NUnit | undefined;
  getCombinedSymbolOptions: (unit: NUnit) => UnitSymbolOptions;
  onDensityChange?: (hasDensitySummary: boolean) => void;
}) {
  const clusterSource = new ClusterSource({
    source: options.source,
    distance: UNIT_DENSITY_DISTANCE_PX,
    minDistance: UNIT_DENSITY_MIN_DISTANCE_PX,
  });

  const style = (feature: FeatureLike) => {
    const members = feature.get("features") as Feature[] | undefined;
    if (!Array.isArray(members) || members.length < 2) return undefined;

    const units = members
      .map((member) => options.getUnitById(String(member.getId())))
      .filter(Boolean) as NUnit[];
    if (units.length < 2) return undefined;

    const representative = units[0];
    const settingsStore = useSettingsStore();
    const symbolSettings = useSymbolSettingsStore();
    const summarySidc = summarySidcForUnits(units);
    const cacheKey = [
      summarySidc,
      units.length,
      settingsStore.mapIconSize,
      window.devicePixelRatio || 1,
    ].join(":");

    if (!styleCache.has(cacheKey)) {
      const symbolOptions = options.getCombinedSymbolOptions(representative);
      const milSymbol = symbolGenerator(summarySidc, {
        size: settingsStore.mapIconSize * (window.devicePixelRatio || 1) * 1.12,
        uniqueDesignation: `${units.length}`,
        outlineColor: "white",
        outlineWidth: 10,
        ...symbolSettings.symbolOptions,
        ...symbolOptions,
      });
      const summaryStyle = createMilSymbolStyle(milSymbol);
      summaryStyle.setText(
        new Text({
          text: `x${units.length}`,
          font: "700 13px sans-serif",
          offsetY: 38,
          fill: new Fill({ color: "#082f3a" }),
          stroke: new Stroke({ color: "rgba(255,255,255,0.95)", width: 4 }),
        }),
      );
      summaryStyle.setZIndex(1000 + units.length);
      styleCache.set(cacheKey, summaryStyle);
    }

    return styleCache.get(cacheKey);
  };

  const layer = new VectorLayer({
    source: clusterSource,
    style,
    declutter: true,
    updateWhileAnimating: true,
    updateWhileInteracting: true,
    properties: {
      title: "Unit density summary",
      selectable: false,
    },
  });
  layer.setZIndex(20);

  const notifyDensity = () => {
    options.onDensityChange?.(clusterSource.getFeatures().some(isDensityCluster));
  };
  clusterSource.on("change", notifyDensity);

  return layer;
}
