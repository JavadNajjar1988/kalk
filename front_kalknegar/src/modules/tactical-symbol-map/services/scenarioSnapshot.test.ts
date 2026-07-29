import { describe, expect, it, vi } from "vitest";
import {
  exportTacticalSnapshot,
  getTacticalSnapshotFromMetadata,
  importTacticalSnapshot,
} from "./scenarioSnapshot";

describe("scenarioSnapshot", () => {
  it("does not treat tactical stores with a prototype value method as refs", async () => {
    const feature = { type: "Feature", geometry: { type: "Point", coordinates: [3, 4] } };

    class StoreWithValueMethod {
      db = {};
      batch = vi.fn();
      tuples = vi.fn(async (prefix: string) =>
        prefix === "feature:" ? [["feature:prototype", feature]] : [],
      );

      value() {
        return null;
      }
    }

    const store = new StoreWithValueMethod();

    const snapshot = await exportTacticalSnapshot(store as any);

    expect(store.tuples).toHaveBeenCalledWith("feature:");
    expect(snapshot.tuples).toEqual([["feature:prototype", feature]]);
  });

  it("exports tactical snapshot from a ref-wrapped store", async () => {
    const feature = { type: "Feature", geometry: { type: "Point", coordinates: [1, 2] } };
    const store = {
      db: {},
      batch: vi.fn(),
      tuples: vi.fn(async (prefix: string) =>
        prefix === "feature:" ? [["feature:test", feature]] : [],
      ),
    };

    const snapshot = await exportTacticalSnapshot({ value: store } as any);

    expect(store.tuples).toHaveBeenCalledWith("feature:");
    expect(snapshot.tuples).toEqual([["feature:test", feature]]);
  });

  it("normalizes legacy ISO tactical timestamps to numbers", () => {
    const isoTimestamp = "1981-11-29T01:15:00Z";
    const invalidTimestamp = "not-a-date";

    const snapshot = getTacticalSnapshotFromMetadata({
      tacticalSymbols: {
        version: 1,
        tuples: [
          [
            "timed+feature:feature:test",
            [
              { t: isoTimestamp, properties: { label: "advance" } },
              { t: invalidTimestamp, properties: { label: "invalid" } },
            ],
          ],
        ],
      },
    });

    expect(snapshot?.tuples[0][1]).toEqual([
      {
        t: Date.parse(isoTimestamp),
        properties: { label: "advance" },
      },
      {
        t: invalidTimestamp,
        properties: { label: "invalid" },
      },
    ]);
  });

  it("preserves local tactical entries during legacy recovery", async () => {
    const operations: Array<{ type: string; key: string; value?: unknown }> = [];
    const store = {
      db: {},
      tuples: vi.fn(async (prefix: string) =>
        prefix === "feature:"
          ? [["feature:local", { type: "Feature" }]]
          : [],
      ),
      batch: vi.fn(async (_db, nextOperations) => {
        operations.push(...nextOperations);
      }),
    };

    await importTacticalSnapshot(
      store as any,
      {
        version: 1,
        tuples: [["layer:server", { name: "Server layer" }]],
      },
      { preserveLocalEntries: true },
    );

    expect(operations).not.toContainEqual(
      expect.objectContaining({ type: "del", key: "feature:local" }),
    );
    expect(operations).toContainEqual(
      expect.objectContaining({ type: "put", key: "layer:server" }),
    );
  });
});
