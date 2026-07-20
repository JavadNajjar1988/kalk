import type { EntityId } from "@/types/base";
import type { NUnit } from "@/types/internalModels";

export interface SelectedWaypointStateTarget {
  unitId: EntityId;
  stateIndex: number;
  stateId: EntityId;
}

interface PathModeStateTargetInputs {
  selectedWaypointIds: Set<string>;
  selectedUnitIds: Set<EntityId>;
}

export function getPathModeStateTargets(
  units: NUnit[],
  { selectedWaypointIds, selectedUnitIds }: PathModeStateTargetInputs,
): SelectedWaypointStateTarget[] {
  const targets: SelectedWaypointStateTarget[] = [];

  if (selectedWaypointIds.size) {
    for (const unit of units) {
      unit.state?.forEach((stateEntry, stateIndex) => {
        if (stateEntry.id && selectedWaypointIds.has(stateEntry.id)) {
          targets.push({
            unitId: unit.id,
            stateIndex,
            stateId: stateEntry.id,
          });
        }
      });
    }
    return targets;
  }

  if (!selectedUnitIds.size) return [];
  for (const unit of units) {
    if (!selectedUnitIds.has(unit.id)) continue;
    unit.state?.forEach((stateEntry, stateIndex) => {
      if (stateEntry.id && stateEntry.location) {
        targets.push({
          unitId: unit.id,
          stateIndex,
          stateId: stateEntry.id,
        });
      }
    });
  }
  return targets;
}
