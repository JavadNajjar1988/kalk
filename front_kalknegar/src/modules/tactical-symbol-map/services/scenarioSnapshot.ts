import * as L from "@/modules/tactical-symbol-map/shared/level/index.js";

export const TACTICAL_METADATA_KEY = "tacticalSymbols";
const TACTICAL_SNAPSHOT_VERSION = 1 as const;

const SNAPSHOT_PREFIXES = [
  "layer:",
  "feature:",
  "timed+feature:",
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

type MaybeRef<T> = T | { value: T | null | undefined } | null | undefined;

function readMaybeRef<T>(value: MaybeRef<T>): T | null | undefined {
  if (
    value &&
    typeof value === "object" &&
    Object.prototype.hasOwnProperty.call(value, "value")
  ) {
    return (value as { value: T | null | undefined }).value;
  }
  return value as T | null | undefined;
}

export function isTacticalStoreReady(
  store: MaybeRef<TacticalStoreLike>,
): store is TacticalStoreLike | { value: TacticalStoreLike } {
  const resolved = readMaybeRef(store);
  return Boolean(resolved?.tuples && resolved?.batch);
}

function resolveTacticalStore(store: MaybeRef<TacticalStoreLike>): TacticalStoreLike {
  const resolved = readMaybeRef(store);
  if (!resolved?.tuples || !resolved?.batch) {
    throw new TypeError("Tactical store is not initialized");
  }
  return resolved;
}

function isTuple(value: unknown): value is TacticalTuple {
  return Array.isArray(value) && value.length === 2 && typeof value[0] === "string";
}

function normalizeTimedFeatureTuple(tuple: TacticalTuple): TacticalTuple {
  const [key, value] = tuple;
  if (!key.startsWith("timed+feature:") || !Array.isArray(value)) {
    return tuple;
  }

  return [
    key,
    value.map((state) => {
      if (!state || typeof state !== "object" || typeof state.t !== "string") {
        return state;
      }

      const timestamp = Date.parse(state.t);
      return Number.isFinite(timestamp) ? { ...state, t: timestamp } : state;
    }),
  ];
}

function normalizeSnapshot(value: unknown): TacticalSymbolsSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const snapshot = value as Partial<TacticalSymbolsSnapshot>;
  if (snapshot.version !== TACTICAL_SNAPSHOT_VERSION) {
    return null;
  }
  const tuples = Array.isArray(snapshot.tuples)
    ? snapshot.tuples.filter(isTuple).map(normalizeTimedFeatureTuple)
    : [];
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
  inputStore: MaybeRef<TacticalStoreLike>,
): Promise<TacticalSymbolsSnapshot> {
  const store = resolveTacticalStore(inputStore);
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
  inputStore: MaybeRef<TacticalStoreLike>,
  snapshot: TacticalSymbolsSnapshot | null | undefined,
): Promise<void> {
  const store = resolveTacticalStore(inputStore);
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
