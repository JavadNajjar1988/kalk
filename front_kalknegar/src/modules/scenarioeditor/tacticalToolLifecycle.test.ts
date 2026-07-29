import { describe, expect, it, vi } from "vitest";
import { cancelTacticalErase } from "./tacticalToolLifecycle";

describe("tactical tool lifecycle", () => {
  it("cancels the tactical eraser when another map tool takes control", () => {
    const emit = vi.fn();

    cancelTacticalErase({
      emit,
      on: vi.fn(),
      off: vi.fn(),
    });

    expect(emit).toHaveBeenCalledWith("command/erase/cancel");
    expect(emit).toHaveBeenCalledWith("command/draw/cancel", {
      originatorId: "scenario-map-toolbar",
    });
  });

  it("is safe before tactical services are ready", () => {
    expect(() => cancelTacticalErase(null)).not.toThrow();
  });
});
