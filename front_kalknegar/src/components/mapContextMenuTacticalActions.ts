import { clone } from "@/modules/tactical-symbol-map/model/Import.js";
import * as ID from "@/modules/tactical-symbol-map/ids.js";

type TacticalServices = {
  clipboard?: {
    copy?: () => Promise<unknown> | unknown;
    paste?: () => Promise<unknown> | unknown;
  };
  selection?: {
    set?: (entries: string[]) => void;
    selected?: (predicate?: (id: string) => boolean) => string[];
  };
  store?: {
    collectKeys: (ids: string[], include?: string[]) => Promise<string[]>;
    defaultLayerId: () => Promise<string | undefined>;
    delete: (ids: string[]) => Promise<unknown> | unknown;
    insert: (tuples: [string, unknown][]) => Promise<unknown> | unknown;
    tuples: (ids: string[]) => Promise<[string, unknown][]>;
  };
};

export function getTacticalOperationTargetIds({
  selectedIds,
  clickedIds,
}: {
  selectedIds: string[];
  clickedIds: string[];
}) {
  const targetIds = selectedIds.length ? selectedIds : clickedIds;
  return [...new Set(targetIds.filter(Boolean))];
}

export function isTacticalMapFeatureId(id: unknown): id is string {
  return typeof id === "string" && (ID.isFeatureId(id) || ID.isMarkerId(id));
}

function requireTacticalStore(services: TacticalServices) {
  if (!services.store) {
    throw new Error("Tactical symbol services are not ready.");
  }
  return services.store;
}

export async function copyTacticalTargets(
  services: TacticalServices,
  targetIds: string[],
) {
  if (!targetIds.length) return;
  services.selection?.set?.(targetIds);
  await services.clipboard?.copy?.();
}

export async function pasteTacticalTargets(services: TacticalServices) {
  await services.clipboard?.paste?.();
}

export async function duplicateTacticalTargets(
  services: TacticalServices,
  targetIds: string[],
  destinationLayerId?: string,
) {
  if (!targetIds.length) return;

  const store = requireTacticalStore(services);
  const keys = await store.collectKeys(targetIds, ["tags", "link", "style"]);
  const entries = await store.tuples(keys);
  const targetLayerId = destinationLayerId ?? (await store.defaultLayerId());
  const clonedTuples: [string, unknown][] = await clone(targetLayerId, entries);
  await store.insert(clonedTuples);

  const clonedIds = clonedTuples.map(([key]) => key).filter(isTacticalMapFeatureId);
  services.selection?.set?.(clonedIds);
}

export async function deleteTacticalTargets(
  services: TacticalServices,
  targetIds: string[],
) {
  if (!targetIds.length) return;
  services.selection?.set?.(targetIds);
  await requireTacticalStore(services).delete(targetIds);
}
