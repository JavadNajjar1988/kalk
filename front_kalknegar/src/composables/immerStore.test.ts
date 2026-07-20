import { describe, expect, it } from "vitest";
import { useImmerStore } from "@/composables/immerStore";

describe("useImmerStore", () => {
  it("increments changeCounter for updates, undo, and redo", () => {
    const store = useImmerStore<{ value: number }, "update">({ value: 1 });

    expect(store.changeCounter.value).toBe(0);

    store.update(
      (state) => {
        state.value = 2;
      },
      { label: "update", value: "value" },
    );

    expect(store.changeCounter.value).toBe(1);

    store.undo();
    expect(store.changeCounter.value).toBe(2);

    store.redo();
    expect(store.changeCounter.value).toBe(3);
  });

  it("marks external changes dirty without adding undo history", () => {
    const store = useImmerStore<{ value: number }, "update">({ value: 1 });

    store.markChanged();

    expect(store.changeCounter.value).toBe(1);
    expect(store.canUndo.value).toBe(false);
  });
});
