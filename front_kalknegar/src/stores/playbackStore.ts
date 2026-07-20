import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useToggle } from "@vueuse/core";

export const PLAYBACK_BASE_SPEED_MS = 6 * 60 * 60 * 1000;
export const PLAYBACK_SPEED_MULTIPLIERS = [-4, -3, -2, 1, 2, 3, 4] as const;

export type PlaybackSpeedMultiplier = (typeof PLAYBACK_SPEED_MULTIPLIERS)[number];

export const PLAYBACK_SPEED_BY_MULTIPLIER_MS: Record<PlaybackSpeedMultiplier, number> = {
  [-4]: 30 * 60 * 1000,
  [-3]: 60 * 60 * 1000,
  [-2]: 3 * 60 * 60 * 1000,
  1: PLAYBACK_BASE_SPEED_MS,
  2: 12 * 60 * 60 * 1000,
  3: 24 * 60 * 60 * 1000,
  4: 48 * 60 * 60 * 1000,
};

export const usePlaybackStore = defineStore("playbackStore", () => {
  const playbackSpeedMultiplier = ref<PlaybackSpeedMultiplier>(1);
  const playbackSpeed = computed(
    () => PLAYBACK_SPEED_BY_MULTIPLIER_MS[playbackSpeedMultiplier.value],
  );

  const startMarker = ref<number>();
  const endMarker = ref<number>();

  const [playbackRunning, togglePlayback] = useToggle(false);
  const [playbackLooping, toggleLooping] = useToggle(false);

  function setSpeedMultiplier(multiplier: PlaybackSpeedMultiplier) {
    playbackSpeedMultiplier.value = multiplier;
  }

  function increaseSpeed() {
    const index = PLAYBACK_SPEED_MULTIPLIERS.indexOf(playbackSpeedMultiplier.value);
    playbackSpeedMultiplier.value =
      PLAYBACK_SPEED_MULTIPLIERS[
        Math.min(index + 1, PLAYBACK_SPEED_MULTIPLIERS.length - 1)
      ];
  }

  function decreaseSpeed() {
    const index = PLAYBACK_SPEED_MULTIPLIERS.indexOf(playbackSpeedMultiplier.value);
    playbackSpeedMultiplier.value = PLAYBACK_SPEED_MULTIPLIERS[Math.max(index - 1, 0)];
  }

  function addMarker(marker: number) {
    if (startMarker.value === undefined) {
      startMarker.value = marker;
    } else if (endMarker.value === undefined) {
      endMarker.value = marker;
    } else {
      if (marker < endMarker.value) {
        startMarker.value = marker;
      } else {
        endMarker.value = marker;
      }
    }
  }

  function clearMarkers() {
    startMarker.value = undefined;
    endMarker.value = undefined;
  }

  return {
    playbackSpeed,
    playbackSpeedMultiplier,
    setSpeedMultiplier,
    playbackRunning,
    togglePlayback,
    increaseSpeed,
    decreaseSpeed,
    startMarker,
    endMarker,
    addMarker,
    playbackLooping,
    toggleLooping,
    clearMarkers,
  };
});
