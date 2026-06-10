import { describe, expect, it, vi } from "vitest";
import { exportTacticalSnapshot } from "./scenarioSnapshot";

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
});
