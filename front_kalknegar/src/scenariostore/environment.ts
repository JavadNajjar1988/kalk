import { klona } from "klona";
import { nanoid } from "@/utils";
import type {
  EnvironmentalCondition,
  EnvironmentalKind,
} from "@/types/scenarioModels";
import type { NewScenarioStore } from "./newScenarioStore";

export type EnvironmentalConditionInput = Omit<EnvironmentalCondition, "id"> & {
  id?: string;
};

export interface EnvironmentalValidationIssue {
  type: "invalid-range" | "missing-geometry" | "overlap";
  conditionId: string;
  relatedConditionId?: string;
}

export const DEFAULT_METOC_SIDC: Record<EnvironmentalKind, string | undefined> = {
  precipitation: "W-S-WSR-LI",
  visibility: undefined,
  wind: undefined,
  temperature: undefined,
  fog: "W-S-WSFGSO",
  surface_condition: undefined,
  cloud_cover: undefined,
  thunderstorm: "W-S-WSTMH-",
  dust_storm: "W-S-WSDSLM",
  blizzard: undefined,
  humidity: undefined,
  pressure: undefined,
  smoke: undefined,
  fire: undefined,
  illumination: undefined,
  flood: undefined,
  soil_bearing: undefined,
  slope: undefined,
  roughness: undefined,
  vegetation: undefined,
  road_condition: undefined,
  bridge_condition: undefined,
  water_crossing: undefined,
  elevation: undefined,
};

export function normalizeEnvironmentalCondition(
  condition: EnvironmentalCondition,
): EnvironmentalCondition {
  const legacyKind: Record<string, EnvironmentalKind> = {
    weather: "precipitation",
    precipitation: "precipitation",
    visibility: "visibility",
    wind: "wind",
    temperature: "temperature",
    terrain_condition: "surface_condition",
  };
  const kind = condition.kind ?? legacyKind[condition.type ?? ""] ?? "cloud_cover";
  const legacyValue = Number(condition.value ?? 0);
  const parameters =
    condition.parameters ??
    (kind === "precipitation"
      ? { mode: "rain" as const, intensity: Math.max(0, Math.min(1, legacyValue)) }
      : kind === "visibility"
        ? { rangeMeters: legacyValue }
        : kind === "wind"
          ? { speedMps: legacyValue, directionDeg: 0 }
          : kind === "temperature"
            ? { celsius: legacyValue }
            : kind === "surface_condition"
              ? { condition: "wet" as const, intensity: legacyValue }
              : { coverage: legacyValue });
  const legacyCoordinates = condition.affectedArea?.coordinates;
  const geometry =
    condition.geometry ??
    (condition.affectedArea?.type === "polygon" && legacyCoordinates?.length
      ? {
          type: "Polygon" as const,
          coordinates: [legacyCoordinates],
        }
      : undefined);
  return {
    ...condition,
    kind,
    parameters,
    geometry,
    scope: condition.scope ?? (geometry ? "area" : "global"),
    enabled: condition.enabled ?? true,
    priority: condition.priority ?? 0,
    metocSidc: condition.metocSidc ?? DEFAULT_METOC_SIDC[kind],
  };
}

function endOf(condition: EnvironmentalCondition) {
  return condition.endTime === undefined
    ? Number.POSITIVE_INFINITY
    : Number(condition.endTime);
}

export function validateEnvironmentalConditions(
  conditions: EnvironmentalCondition[],
): EnvironmentalValidationIssue[] {
  const issues: EnvironmentalValidationIssue[] = [];
  conditions.forEach((condition) => {
    if (endOf(condition) <= Number(condition.startTime)) {
      issues.push({ type: "invalid-range", conditionId: condition.id });
    }
    if (condition.scope === "area" && !condition.geometry) {
      issues.push({ type: "missing-geometry", conditionId: condition.id });
    }
  });

  conditions.forEach((condition, index) => {
    conditions.slice(index + 1).forEach((other) => {
      if (
        condition.enabled !== false &&
        other.enabled !== false &&
        condition.kind === other.kind &&
        Number(condition.startTime) < endOf(other) &&
        Number(other.startTime) < endOf(condition)
      ) {
        issues.push({
          type: "overlap",
          conditionId: condition.id,
          relatedConditionId: other.id,
        });
      }
    });
  });
  return issues;
}

export function isEnvironmentalConditionActive(
  condition: EnvironmentalCondition,
  timestamp: number,
) {
  return (
    condition.enabled !== false &&
    Number(condition.startTime) <= timestamp &&
    timestamp < endOf(condition)
  );
}

export function resolveEnvironmentalConditions(
  conditions: EnvironmentalCondition[],
  timestamp: number,
) {
  const byKind = new Map<EnvironmentalKind, EnvironmentalCondition>();
  conditions
    .filter((condition) => isEnvironmentalConditionActive(condition, timestamp))
    .sort((first, second) => {
      const priority = (second.priority ?? 0) - (first.priority ?? 0);
      if (priority !== 0) return priority;
      if (first.scope !== second.scope) return first.scope === "area" ? -1 : 1;
      return Number(second.startTime) - Number(first.startTime);
    })
    .forEach((condition) => {
      if (!byKind.has(condition.kind)) byKind.set(condition.kind, condition);
    });
  return [...byKind.values()];
}

export function useScenarioEnvironment(store: NewScenarioStore) {
  function addCondition(input: EnvironmentalConditionInput) {
    const id = input.id || nanoid();
    store.update(
      (state) => {
        state.environmentalConditions.push({
          ...klona(input),
          id,
          enabled: input.enabled ?? true,
          priority: input.priority ?? 0,
          metocSidc: input.metocSidc ?? DEFAULT_METOC_SIDC[input.kind],
        });
      },
      { label: "addEnvironmentalCondition", value: id },
    );
    return id;
  }

  function updateCondition(id: string, input: Partial<EnvironmentalConditionInput>) {
    store.update(
      (state) => {
        const index = state.environmentalConditions.findIndex(
          (condition) => condition.id === id,
        );
        if (index < 0) return;
        state.environmentalConditions[index] = {
          ...state.environmentalConditions[index],
          ...klona(input),
          id,
        };
      },
      { label: "updateEnvironmentalCondition", value: id },
    );
  }

  function deleteCondition(id: string) {
    store.update(
      (state) => {
        state.environmentalConditions = state.environmentalConditions.filter(
          (condition) => condition.id !== id,
        );
      },
      { label: "deleteEnvironmentalCondition", value: id },
    );
  }

  function setConditionEnabled(id: string, enabled: boolean) {
    updateCondition(id, { enabled });
  }

  return { addCondition, updateCondition, deleteCondition, setConditionEnabled };
}
