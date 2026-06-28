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
type ParentLike = Pick<NUnit, "id" | "sidc" | "name" | "shortName" | "symbolOptions">;

export interface UnitDensitySummaryOverride {
  label?: string;
  sidc?: string;
  symbolOptions?: UnitSymbolOptions;
  source?: UnitDensitySummarySource;
}

export type UnitDensitySummaryOverrides = Record<string, UnitDensitySummaryOverride>;
export const UNIT_DENSITY_SUMMARIES_METADATA_KEY = "unitDensitySummaries";
export type UnitDensitySummarySource = "manual" | "orbat" | "automatic";

const UNIT_DENSITY_SUMMARY_SOURCE_LABELS: Record<UnitDensitySummarySource, string> = {
  manual: "\u062f\u0633\u062a\u06cc",
  orbat: "\u0622\u0631\u0627\u06cc\u0634 \u0646\u0628\u0631\u062f",
  automatic: "\u062e\u0648\u062f\u06a9\u0627\u0631",
};

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

export function unitDensitySummarySourceLabel(source: UnitDensitySummarySource) {
  return UNIT_DENSITY_SUMMARY_SOURCE_LABELS[source];
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

export function applyEchelonToSummarySidc(sidcValue: string, echelon: string) {
  const sidc = new Sidc(sidcValue);
  sidc.emt = echelon;
  return sidc.toString();
}

function inferEchelonFromName(name = "") {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return undefined;

  if (
    normalized.includes("\u0633\u067e\u0627\u0647") ||
    normalized.startsWith("\u0642.") ||
    normalized.includes("corps")
  ) {
    return "22";
  }
  if (
    normalized.includes("\u0644\u0634\u06a9\u0631") ||
    normalized.includes("division")
  ) {
    return "21";
  }
  if (
    normalized.includes("\u062a\u06cc\u067e") ||
    normalized.includes("brigade")
  ) {
    return "18";
  }
  if (
    normalized.includes("\u0647\u0646\u06af") ||
    normalized.includes("regiment")
  ) {
    return "17";
  }
  if (
    normalized.includes("\u06af\u0631\u062f\u0627\u0646") ||
    normalized.includes("battalion")
  ) {
    return "15";
  }
  if (
    normalized.includes("\u06af\u0631\u0648\u0647\u0627\u0646") ||
    normalized.includes("company")
  ) {
    return "14";
  }

  return undefined;
}

export function sidcWithInferredParentEchelon(parent: ParentLike) {
  if (!parent.sidc) return parent.sidc;

  const sidc = new Sidc(parent.sidc);
  if (sidc.emt && sidc.emt !== "00") return parent.sidc;

  const inferredEchelon = inferEchelonFromName(
    [parent.shortName, parent.name].filter(Boolean).join(" "),
  );
  return inferredEchelon
    ? applyEchelonToSummarySidc(parent.sidc, inferredEchelon)
    : parent.sidc;
}

export function unitDensitySummaryKey(units: UnitLike[]) {
  return units
    .map((unit) => unit.id)
    .filter(Boolean)
    .sort()
    .join("|");
}

export function shouldOpenUnitDensitySummaryEditor(
  units: UnitLike[],
  overrides: UnitDensitySummaryOverrides = {},
  forceEdit = false,
) {
  if (forceEdit) return true;
  return !overrides[unitDensitySummaryKey(units)];
}

export function resolveUnitDensitySummary(
  units: UnitLike[],
  overrides: UnitDensitySummaryOverrides = {},
  parentSummary?: UnitDensitySummaryOverride,
) {
  const overrideKey = unitDensitySummaryKey(units);
  const override = overrides[overrideKey];
  if (override?.source === "automatic") {
    return {
      label: undefined,
      sidc: summarySidcForUnits(units),
      symbolOptions: undefined,
      overrideKey,
      source: "automatic" as const,
    };
  }

  if (override?.source === "manual" || (override && !override.source)) {
    return {
      label: override.label,
      sidc: override.sidc || parentSummary?.sidc || summarySidcForUnits(units),
      symbolOptions: override.symbolOptions ?? parentSummary?.symbolOptions,
      overrideKey,
      source: "manual" as const,
    };
  }

  if (parentSummary) {
    return {
      label: parentSummary.label,
      sidc: parentSummary.sidc || summarySidcForUnits(units),
      symbolOptions: parentSummary.symbolOptions,
      overrideKey,
      source: "orbat" as const,
    };
  }

  return {
    label: undefined,
    sidc: summarySidcForUnits(units),
    symbolOptions: undefined,
    overrideKey,
    source: "automatic" as const,
  };
}

export function commonParentSummaryForUnits(
  units: UnitLike[],
  getParents: (unitId: string) => ParentLike[],
): UnitDensitySummaryOverride | undefined {
  if (units.length < 2) return undefined;

  const parentPaths = units.map((unit) => getParents(unit.id));
  if (parentPaths.some((parents) => parents.length === 0)) return undefined;

  const firstPath = parentPaths[0];
  for (let index = firstPath.length - 1; index >= 0; index--) {
    const candidate = firstPath[index];
    if (
      parentPaths.every((parents) =>
        parents.some((parent) => parent.id === candidate.id),
      )
    ) {
      return {
        label: candidate.shortName || candidate.name,
        sidc: sidcWithInferredParentEchelon(candidate),
        symbolOptions: candidate.symbolOptions,
      };
    }
  }

  return undefined;
}

export function getUnitDensitySummaryOverrides(
  metadata?: Record<string, any>,
): UnitDensitySummaryOverrides {
  return metadata?.[UNIT_DENSITY_SUMMARIES_METADATA_KEY] ?? {};
}

export function setUnitDensitySummaryOverride(
  metadata: Record<string, any> | undefined,
  key: string,
  override: UnitDensitySummaryOverride,
) {
  const nextOverrides = {
    ...getUnitDensitySummaryOverrides(metadata),
    [key]: override,
  };

  return {
    ...(metadata ?? {}),
    [UNIT_DENSITY_SUMMARIES_METADATA_KEY]: nextOverrides,
  };
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
  getSummaryOverrides?: () => UnitDensitySummaryOverrides;
  getParentSummary?: (units: NUnit[]) => UnitDensitySummaryOverride | undefined;
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
    const summary = resolveUnitDensitySummary(
      units,
      options.getSummaryOverrides?.() ?? {},
      options.getParentSummary?.(units),
    );
    const cacheKey = [
      summary.sidc,
      summary.label ?? "",
      summary.source,
      JSON.stringify(summary.symbolOptions ?? {}),
      units.length,
      settingsStore.mapIconSize,
      window.devicePixelRatio || 1,
    ].join(":");

    if (!styleCache.has(cacheKey)) {
      const symbolOptions =
        summary.symbolOptions ?? options.getCombinedSymbolOptions(representative);
      const milSymbol = symbolGenerator(summary.sidc, {
        size: settingsStore.mapIconSize * (window.devicePixelRatio || 1) * 1.12,
        uniqueDesignation: summary.label || `${units.length}`,
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
          textAlign: "center",
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
