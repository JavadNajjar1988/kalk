import type { EntityId } from "@/types/base";
import type { NUnit } from "@/types/internalModels";
import * as MILSTD from "@/modules/tactical-symbol-map/symbology/2525c.js";

const BOUNDARY_SIDC = "G*G*GLB---";

export function placementModeForSidc(sidc: string | null): "configure-boundary" | "draw" {
  if (!sidc) return "draw";
  return MILSTD.parameterized(sidc) === BOUNDARY_SIDC ? "configure-boundary" : "draw";
}

export function selectedBoundaryUnits(
  units: readonly NUnit[],
  selectedIds: readonly EntityId[],
): { leftUnit: NUnit | null; rightUnit: NUnit | null } {
  const unitById = new Map(units.map((unit) => [unit.id, unit]));
  const selectedUnits = selectedIds
    .map((id) => unitById.get(id))
    .filter((unit): unit is NUnit => Boolean(unit))
    .slice(0, 2);

  return {
    leftUnit: selectedUnits[0] || null,
    rightUnit: selectedUnits[1] || null,
  };
}

export function unitDesignation(unit: NUnit | null): string | undefined {
  const designation = unit?.shortName?.trim() || unit?.name?.trim();
  return designation || undefined;
}
