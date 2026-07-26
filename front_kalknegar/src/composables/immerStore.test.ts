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
    const sequence = store.undoSequence.value;
    expect(sequence).toBeGreaterThan(0);

    store.undo();
    expect(store.changeCounter.value).toBe(2);
    expect(store.undoSequence.value).toBe(0);
    expect(store.redoSequence.value).toBe(sequence);

    store.redo();
    expect(store.changeCounter.value).toBe(3);
    expect(store.undoSequence.value).toBe(sequence);
    expect(store.redoSequence.value).toBe(0);
  });

  it("marks external changes dirty without adding undo history", () => {
    const store = useImmerStore<{ value: number }, "update">({ value: 1 });

    store.markChanged();

    expect(store.changeCounter.value).toBe(1);
    expect(store.canUndo.value).toBe(false);
  });
});
