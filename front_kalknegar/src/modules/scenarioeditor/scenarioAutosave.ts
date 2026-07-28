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
  let pendingTarget: ScenarioAutosaveTarget | null = null;

  const run = async (target: ScenarioAutosaveTarget) => {
    if (target.isDemoScenario || !target.isDirty()) {
      return;
    }

    pendingTarget = target;
    if (inFlight) {
      return inFlight;
    }

    inFlight = (async () => {
      while (pendingTarget) {
        const nextTarget = pendingTarget;
        pendingTarget = null;
        if (!nextTarget.isDemoScenario && nextTarget.isDirty()) {
          await nextTarget.save();
        }
      }
    })();

    try {
      await inFlight;
    } finally {
      inFlight = null;
    }
  };

  const waitForIdle = async () => {
    await inFlight;
  };

  return { run, waitForIdle };
}
