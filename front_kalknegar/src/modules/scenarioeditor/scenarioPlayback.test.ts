import { describe, expect, it } from "vitest";

import {
  advanceScenarioPlaybackTime,
  getEventPlaybackLoopRange,
  hasEventPlaybackLoopRange,
} from "./scenarioPlayback";
import { PLAYBACK_SPEED_BY_MULTIPLIER_MS } from "@/stores/playbackStore";

describe("scenario playback event loop range", () => {
  it("requires more than two events before event-bounded looping is available", () => {
    expect(hasEventPlaybackLoopRange([1000, 2000])).toBe(false);
    expect(hasEventPlaybackLoopRange([3000, 1000, 2000])).toBe(true);
  });

  it("uses the first and last scenario event times as the loop range", () => {
    expect(getEventPlaybackLoopRange([3000, 1000, 2000])).toEqual({
      start: 1000,
      end: 3000,
    });
  });

  it("wraps forward playback to the first event when passing the last event", () => {
    expect(
      advanceScenarioPlaybackTime({
        currentTime: 2900,
        speedPerSecond: 200,
        elapsedMs: 1000,
        looping: true,
        eventTimes: [1000, 2000, 3000],
      }),
    ).toBe(1000);
  });

  it("treats all configured speed values as forward movement", () => {
    expect(
      advanceScenarioPlaybackTime({
        currentTime: 1100,
        speedPerSecond: 200,
        elapsedMs: 1000,
        looping: true,
        eventTimes: [1000, 2000, 3000],
      }),
    ).toBe(1300);
  });

  it("continues normally when looping is disabled or unavailable", () => {
    expect(
      advanceScenarioPlaybackTime({
        currentTime: 2900,
        speedPerSecond: 200,
        elapsedMs: 1000,
        looping: false,
        eventTimes: [1000, 2000, 3000],
      }),
    ).toBe(3100);
    expect(
      advanceScenarioPlaybackTime({
        currentTime: 2900,
        speedPerSecond: 200,
        elapsedMs: 1000,
        looping: true,
        eventTimes: [1000, 3000],
      }),
    ).toBe(3100);
  });

  it("applies speed values per elapsed second instead of per animation frame", () => {
    expect(
      advanceScenarioPlaybackTime({
        currentTime: 0,
        speedPerSecond: PLAYBACK_SPEED_BY_MULTIPLIER_MS[1],
        elapsedMs: 1000,
        looping: false,
        eventTimes: [],
      }),
    ).toBe(6 * 60 * 60 * 1000);

    expect(
      advanceScenarioPlaybackTime({
        currentTime: 0,
        speedPerSecond: PLAYBACK_SPEED_BY_MULTIPLIER_MS[1],
        elapsedMs: 500,
        looping: false,
        eventTimes: [],
      }),
    ).toBe(3 * 60 * 60 * 1000);
  });

  it("uses negative-labeled presets as slower forward playback", () => {
    expect(
      advanceScenarioPlaybackTime({
        currentTime: 0,
        speedPerSecond: PLAYBACK_SPEED_BY_MULTIPLIER_MS[-4],
        elapsedMs: 1000,
        looping: false,
        eventTimes: [],
      }),
    ).toBe(30 * 60 * 1000);

    expect(
      advanceScenarioPlaybackTime({
        currentTime: 0,
        speedPerSecond: PLAYBACK_SPEED_BY_MULTIPLIER_MS[-3],
        elapsedMs: 1000,
        looping: false,
        eventTimes: [],
      }),
    ).toBe(60 * 60 * 1000);

    expect(
      advanceScenarioPlaybackTime({
        currentTime: 0,
        speedPerSecond: PLAYBACK_SPEED_BY_MULTIPLIER_MS[-2],
        elapsedMs: 1000,
        looping: false,
        eventTimes: [],
      }),
    ).toBe(3 * 60 * 60 * 1000);
  });
});
