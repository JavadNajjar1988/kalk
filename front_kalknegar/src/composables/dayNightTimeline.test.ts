import { describe, expect, it, vi } from "vitest";
import { syncDayNightWithTimeline } from "./dayNightTimeline";

describe("day/night timeline synchronization", () => {
  it("updates the terminator source with the scenario timestamp", () => {
    const setTime = vi.fn();

    syncDayNightWithTimeline({ setTime }, 1_753_776_000_000);

    expect(setTime).toHaveBeenCalledOnce();
    expect(setTime.mock.calls[0][0]).toEqual(new Date(1_753_776_000_000));
  });
});
