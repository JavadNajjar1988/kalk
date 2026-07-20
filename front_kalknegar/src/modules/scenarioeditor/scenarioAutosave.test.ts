import { describe, expect, it } from "vitest";
import {
  createScenarioAutosaveQueue,
  handleTacticalBatchChange,
  shouldMarkTacticalBatchDirty,
} from "./scenarioAutosave";

describe("createScenarioAutosaveQueue", () => {
  it("skips demo and clean scenarios", async () => {
    const queue = createScenarioAutosaveQueue();
    let saves = 0;

    await queue.run({
      isDemoScenario: true,
      isDirty: () => true,
      save: async () => {
        saves++;
      },
    });

    await queue.run({
      isDemoScenario: false,
      isDirty: () => false,
      save: async () => {
        saves++;
      },
    });

    expect(saves).toBe(0);
  });

  it("runs another save when changes arrive while a save is in flight", async () => {
    const queue = createScenarioAutosaveQueue();
    let dirty = true;
    let releaseFirstSave!: () => void;
    let saves = 0;

    const firstRun = queue.run({
      isDemoScenario: false,
      isDirty: () => dirty,
      save: async () => {
        saves++;

        if (saves === 1) {
          await new Promise<void>((resolve) => {
            releaseFirstSave = resolve;
          });
          return;
        }

        dirty = false;
      },
    });

    const secondRun = queue.run({
      isDemoScenario: false,
      isDirty: () => dirty,
      save: async () => {
        saves++;
      },
    });

    expect(saves).toBe(1);

    releaseFirstSave();
    await Promise.all([firstRun, secondRun]);

    expect(saves).toBe(2);
  });
});

describe("shouldMarkTacticalBatchDirty", () => {
  it("ignores initial snapshot imports and time-only sync batches", () => {
    expect(
      shouldMarkTacticalBatchDirty({
        source: "scenario/tactical-snapshot",
        operations: [{ type: "put", key: "feature:1" }],
      }),
    ).toBe(false);

    expect(
      shouldMarkTacticalBatchDirty({
        operations: [{ type: "put", key: "scenario:time" }],
      }),
    ).toBe(false);
  });

  it("marks tactical feature, layer, and style batches dirty", () => {
    expect(
      shouldMarkTacticalBatchDirty({
        operations: [{ type: "put", key: "feature:1" }],
      }),
    ).toBe(true);

    expect(
      shouldMarkTacticalBatchDirty({
        operations: [
          { type: "put", key: "scenario:time" },
          { type: "put", key: "style+feature:1" },
        ],
      }),
    ).toBe(true);
  });
});

describe("handleTacticalBatchChange", () => {
  it("marks real tactical edits dirty and triggers an immediate save", () => {
    let marks = 0;
    let saves = 0;

    const handled = handleTacticalBatchChange({
      event: { operations: [{ type: "put", key: "feature:1" }] },
      localReady: true,
      isReady: true,
      isDemoScenario: false,
      markChanged: () => {
        marks++;
      },
      saveNow: () => {
        saves++;
      },
    });

    expect(handled).toBe(true);
    expect(marks).toBe(1);
    expect(saves).toBe(1);
  });

  it("does not trigger saves for imported snapshots", () => {
    let saves = 0;

    const handled = handleTacticalBatchChange({
      event: {
        source: "scenario/tactical-snapshot",
        operations: [{ type: "put", key: "feature:1" }],
      },
      localReady: true,
      isReady: true,
      isDemoScenario: false,
      markChanged: () => {},
      saveNow: () => {
        saves++;
      },
    });

    expect(handled).toBe(false);
    expect(saves).toBe(0);
  });
});
