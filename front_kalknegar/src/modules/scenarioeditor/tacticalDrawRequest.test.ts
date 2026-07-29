import { describe, expect, it, vi } from "vitest";
import { requestTacticalDraw } from "./tacticalDrawRequest";

describe("requestTacticalDraw", () => {
  it("delivers the command once the map draw listener is ready", async () => {
    const emit = vi
      .fn()
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    const accepted = await requestTacticalDraw(
      { emit },
      "symbol:G*F*LCC---",
      { attempts: 3, intervalMs: 0 },
    );

    expect(accepted).toBe(true);
    expect(emit).toHaveBeenCalledTimes(3);
    expect(emit).toHaveBeenLastCalledWith("command/entry/draw", {
      id: "symbol:G*F*LCC---",
    });
  });

  it("reports when no map draw listener becomes available", async () => {
    const emit = vi.fn(() => false);

    await expect(
      requestTacticalDraw(
        { emit },
        "symbol:G*F*LCC---",
        { attempts: 2, intervalMs: 0 },
      ),
    ).resolves.toBe(false);
  });

  it("includes Boundary metadata in the accepted draw command", async () => {
    const emit = vi.fn(() => true);
    const boundary = {
      echelonCode: "D" as const,
      leftUnitId: "u-left",
      rightUnitId: "u-right",
      leftDesignation: "گردان ۱",
      rightDesignation: "گردان ۲",
    };

    await requestTacticalDraw(
      { emit },
      "symbol:G*G*GLB---",
      { attempts: 1, intervalMs: 0, boundary },
    );

    expect(emit).toHaveBeenCalledWith("command/entry/draw", {
      id: "symbol:G*G*GLB---",
      boundary,
    });
  });
});
