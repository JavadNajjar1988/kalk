import type { EntityId } from "@/types/base";
import type { ScenarioState } from "@/scenariostore/newScenarioStore";
import { serializeUnit } from "@/scenariostore/io";
import { orbatToText } from "@/importexport/convertUtils";

let internalApplicationOrbatClipboard: string | null = null;

export type OrbatClipboardData = {
  applicationOrbat: string;
  textPlain: string;
};

export function getOrbatOperationTargetIds({
  selectedIds,
  clickedIds,
}: {
  selectedIds: EntityId[];
  clickedIds: EntityId[];
}) {
  const targetIds = selectedIds.length ? selectedIds : clickedIds;
  return [...new Set(targetIds.filter(Boolean))];
}

export function getSingleOrbatPasteParentId(targetIds: EntityId[]) {
  return targetIds.length === 1 ? targetIds[0] : null;
}

export function createOrbatClipboardData({
  targetIds,
  state,
  stringifyObject,
}: {
  targetIds: EntityId[];
  state: ScenarioState;
  stringifyObject: (obj: unknown) => string;
}): OrbatClipboardData | null {
  const units = targetIds
    .filter((id) => state.unitMap[id])
    .map((id) => serializeUnit(id, state, { newId: true }));

  if (!units.length) return null;

  return {
    applicationOrbat: stringifyObject(units),
    textPlain: units.map((unit) => orbatToText(unit).join("")).join(""),
  };
}

export function setInternalOrbatClipboardData(applicationOrbat: string | null) {
  internalApplicationOrbatClipboard = applicationOrbat;
}

export function getInternalOrbatClipboardData() {
  return internalApplicationOrbatClipboard;
}
