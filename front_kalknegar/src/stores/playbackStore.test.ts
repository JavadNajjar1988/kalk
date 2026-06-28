import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import {
  PLAYBACK_BASE_SPEED_MS,
  PLAYBACK_SPEED_BY_MULTIPLIER_MS,
  PLAYBACK_SPEED_MULTIPLIERS,
  usePlaybackStore,
} from "./playbackStore";

describe("playbackStore speed presets", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("uses 6 scenario hours per real second as the 1x base speed", () => {
    const playback = usePlaybackStore();

    expect(PLAYBACK_BASE_SPEED_MS).toBe(6 * 60 * 60 * 1000);
    expect(playback.playbackSpeed).toBe(PLAYBACK_BASE_SPEED_MS);
    expect(playback.playbackSpeedMultiplier).toBe(1);
  });

  it("offers the requested slow and fast speed multipliers", () => {
    expect(PLAYBACK_SPEED_MULTIPLIERS).toEqual([-4, -3, -2, 1, 2, 3, 4]);
  });

  it("maps every preset to forward-moving scenario time", () => {
    expect(PLAYBACK_SPEED_BY_MULTIPLIER_MS).toEqual({
      "-4": 30 * 60 * 1000,
      "-3": 60 * 60 * 1000,
      "-2": 3 * 60 * 60 * 1000,
      "1": 6 * 60 * 60 * 1000,
      "2": 12 * 60 * 60 * 1000,
      "3": 24 * 60 * 60 * 1000,
      "4": 48 * 60 * 60 * 1000,
    });
  });

  it("sets speed by multiplier and clamps keyboard stepping to available presets", () => {
    const playback = usePlaybackStore();

    playback.setSpeedMultiplier(3);
    expect(playback.playbackSpeed).toBe(24 * 60 * 60 * 1000);
    expect(playback.playbackSpeedMultiplier).toBe(3);

    playback.increaseSpeed();
    expect(playback.playbackSpeedMultiplier).toBe(4);
    expect(playback.playbackSpeed).toBe(48 * 60 * 60 * 1000);
    playback.increaseSpeed();
    expect(playback.playbackSpeedMultiplier).toBe(4);

    playback.setSpeedMultiplier(-3);
    expect(playback.playbackSpeed).toBe(60 * 60 * 1000);

    playback.decreaseSpeed();
    expect(playback.playbackSpeedMultiplier).toBe(-4);
    expect(playback.playbackSpeed).toBe(30 * 60 * 1000);
    playback.decreaseSpeed();
    expect(playback.playbackSpeedMultiplier).toBe(-4);
  });
});
