import type { ResourceDto } from "@/services/api/resourceApiService";
import type { NScenarioFeature } from "@/types/internalModels";
import { nanoid } from "@/utils";

export type EquipmentParticipationStatus =
  | "planned"
  | "deployed"
  | "active"
  | "completed"
  | "cancelled"
  | "unavailable";

export interface EquipmentPlacementOptions {
  quantity: number;
  participationStatus: EquipmentParticipationStatus;
  unitId?: string;
  unitName?: string;
  visibleFromT?: number;
}

function textValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

export function resolveEquipmentSidc(resource: ResourceDto): string | undefined {
  const metadata = resource.metadata ?? {};
  const candidate =
    textValue(metadata.sidc) ??
    textValue(metadata.advancedSidc) ??
    textValue(metadata.militarySymbolSidc);
  return candidate && /^[0-9A-Z]{20}$/i.test(candidate)
    ? candidate.toUpperCase()
    : undefined;
}

export function createPositionedEquipmentFeature(
  resource: ResourceDto,
  coordinates: number[],
  options: EquipmentPlacementOptions,
): Omit<NScenarioFeature, "_pid"> {
  const metadata = resource.metadata ?? {};
  const sidc = resolveEquipmentSidc(resource);
  const equipmentType =
    textValue(metadata.equipmentType) ??
    textValue(metadata.type) ??
    textValue(resource.description) ??
    "عمومی";
  const quantity = Math.max(1, Math.trunc(Number(options.quantity) || 1));

  return {
    type: "Feature",
    id: `equipment-${nanoid()}`,
    geometry: { type: "Point", coordinates },
    meta: {
      type: "Point",
      name: resource.name,
      description: resource.description ?? undefined,
      ...(options.visibleFromT !== undefined
        ? { visibleFromT: options.visibleFromT }
        : {}),
    },
    properties: {
      resourceId: resource.id,
      equipmentId: resource.id,
      resourceCode: resource.code ?? undefined,
      equipmentType,
      quantity,
      participationStatus: options.participationStatus,
      unitId: options.unitId,
      unitName: options.unitName,
    },
    style: {
      "marker-color": "#b45309",
      "marker-size": "medium",
      "marker-symbol": "square",
      stroke: "#92400e",
      "stroke-width": 2,
      fill: "#f59e0b",
      "fill-opacity": 0.2,
      showLabel: true,
      ...(sidc ? { militarySymbolSidc: sidc } : {}),
    },
  } as Omit<NScenarioFeature, "_pid">;
}
