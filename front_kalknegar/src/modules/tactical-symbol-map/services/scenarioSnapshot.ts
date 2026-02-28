import * as L from "@/modules/tactical-symbol-map/shared/level/index";

export const TACTICAL_METADATA_KEY = "tacticalSymbols";
const TACTICAL_SNAPSHOT_VERSION = 1 as const;

const SNAPSHOT_PREFIXES = [
  "layer:",
  "feature:",
  "marker:",
  "measure:",
  "style+layer:",
  "style+feature:",
  "style+marker:",
  "style+measure:",
  "hidden+layer:",
  "hidden+feature:",
  "hidden+marker:",
  "hidden+measure:",
  "locked+layer:",
  "locked+feature:",
  "locked+marker:",
  "locked+measure:",
  "restricted+layer:",
  "restricted+feature:",
  "restricted+marker:",
  "restricted+measure:",
  "tags+layer:",
  "tags+feature:",
  "tags+marker:",
  "tags+measure:",
  "default+layer:",
  "link+layer:",
  "link+feature:",
  "link+marker:",
  "link+measure:",
  "shared+layer:",
  "role+layer:",
];

export type TacticalTuple = [string, any];

export interface TacticalSymbolsSnapshot {
  version: typeof TACTICAL_SNAPSHOT_VERSION;
  tuples: TacticalTuple[];
}

interface TacticalStoreLike {
  db: any;
  tuples: (arg: string | string[]) => Promise<TacticalTuple[]>;
  batch: (db: any, operations: any[], options?: Record<string, any>) => Promise<void>;
}

function isTuple(value: unknown): value is TacticalTuple {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "string"
  );
}

function normalizeSnapshot(value: unknown): TacticalSymbolsSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const snapshot = value as Partial<TacticalSymbolsSnapshot>;
  if (snapshot.version !== TACTICAL_SNAPSHOT_VERSION) {
    return null;
  }
  const tuples = Array.isArray(snapshot.tuples) ? snapshot.tuples.filter(isTuple) : [];
  return {
    version: TACTICAL_SNAPSHOT_VERSION,
    tuples,
  };
}

async function collectCurrentKeys(store: TacticalStoreLike): Promise<string[]> {
  const keys = new Set<string>();
  for (const prefix of SNAPSHOT_PREFIXES) {
    const tuples = await store.tuples(prefix);
    for (const [key] of tuples) {
      keys.add(key);
    }
  }
  return [...keys];
}

export function tacticalProjectUUIDForScenarioId(scenarioId: string): string {
  return `kalknegar:${scenarioId}`;
}

export function getTacticalSnapshotFromMetadata(
  metadata?: Record<string, any> | null,
): TacticalSymbolsSnapshot | null {
  return normalizeSnapshot(metadata?.[TACTICAL_METADATA_KEY]);
}

export function withTacticalSnapshotInMetadata(
  metadata: Record<string, any> | undefined,
  snapshot: TacticalSymbolsSnapshot,
): Record<string, any> {
  const nextMetadata = { ...(metadata ?? {}) };
  if (snapshot.tuples.length > 0) {
    nextMetadata[TACTICAL_METADATA_KEY] = snapshot;
  } else {
    delete nextMetadata[TACTICAL_METADATA_KEY];
  }
  return nextMetadata;
}

export async function exportTacticalSnapshot(
  store: TacticalStoreLike,
): Promise<TacticalSymbolsSnapshot> {
  const byKey = new Map<string, any>();
  for (const prefix of SNAPSHOT_PREFIXES) {
    const tuples = await store.tuples(prefix);
    for (const [key, value] of tuples) {
      byKey.set(key, value);
    }
  }

  const tuples: TacticalTuple[] = [...byKey.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  );
  return {
    version: TACTICAL_SNAPSHOT_VERSION,
    tuples,
  };
}

export async function importTacticalSnapshot(
  store: TacticalStoreLike,
  snapshot: TacticalSymbolsSnapshot | null | undefined,
): Promise<void> {
  const normalized = normalizeSnapshot(snapshot);
  const next = new Map<string, any>(normalized?.tuples ?? []);
  const currentKeys = await collectCurrentKeys(store);

  const operations = [];
  for (const key of currentKeys) {
    if (!next.has(key)) {
      operations.push(L.delOp(key));
    }
  }
  for (const [key, value] of next.entries()) {
    operations.push(L.putOp(key, value));
  }

  if (operations.length === 0) {
    return;
  }

  await store.batch(store.db, operations, {
    source: "scenario/tactical-snapshot",
  });
}
