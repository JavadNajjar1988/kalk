export type ScenarioAutosaveTarget = {
  isDemoScenario: boolean;
  isDirty: () => boolean;
  save: () => Promise<unknown>;
};

export interface TacticalBatchEvent {
  source?: string;
  operations?: Array<{ key?: string; type?: string; [key: string]: unknown }>;
}

export function shouldMarkTacticalBatchDirty(event: TacticalBatchEvent | null | undefined) {
  if (event?.source === "scenario/tactical-snapshot") {
    return false;
  }

  const operations = event?.operations ?? [];
  return operations.some((operation) => operation.key !== "scenario:time");
}

export interface TacticalBatchChangeOptions {
  event: TacticalBatchEvent | null | undefined;
  localReady: boolean;
  isReady: boolean;
  isDemoScenario: boolean;
  markChanged: () => void;
  saveNow: () => unknown;
}

export function handleTacticalBatchChange({
  event,
  localReady,
  isReady,
  isDemoScenario,
  markChanged,
  saveNow,
}: TacticalBatchChangeOptions) {
  if (
    !localReady ||
    !isReady ||
    isDemoScenario ||
    !shouldMarkTacticalBatchDirty(event)
  ) {
    return false;
  }

  markChanged();
  saveNow();
  return true;
}

export function createScenarioAutosaveQueue() {
  let inFlight: Promise<void> | null = null;
  let pending = false;

  const run = async (target: ScenarioAutosaveTarget) => {
    if (target.isDemoScenario || !target.isDirty()) {
      return;
    }

    if (inFlight) {
      pending = true;
      return inFlight;
    }

    inFlight = (async () => {
      do {
        pending = false;

        if (!target.isDemoScenario && target.isDirty()) {
          await target.save();
        }
      } while (pending && !target.isDemoScenario && target.isDirty());
    })();

    try {
      await inFlight;
    } finally {
      inFlight = null;
    }
  };

  return { run };
}
