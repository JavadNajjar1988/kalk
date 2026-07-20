import { useToggle } from "@vueuse/core";
import { defineStore } from "pinia";
import { ref } from "vue";

export type RecordingMix = {
  hierarchy: boolean;
  geometry: boolean;
  location: boolean;
  tacticalLocation: boolean;
  tacticalGeometry: boolean;
};

export const DEFAULT_RECORDING_MIX: RecordingMix = {
  hierarchy: false,
  geometry: false,
  location: true,
  tacticalLocation: false,
  tacticalGeometry: false,
};

export const useRecordingStore = defineStore("recordingStore", () => {
  const isRecordingHierarchy = ref(DEFAULT_RECORDING_MIX.hierarchy);
  const toggleRecordingHierarchy = useToggle(isRecordingHierarchy);

  const isRecordingGeometry = ref(DEFAULT_RECORDING_MIX.geometry);
  const toggleRecordingGeometry = useToggle(isRecordingGeometry);

  const isRecordingLocation = ref(DEFAULT_RECORDING_MIX.location);
  const toggleRecordingLocation = useToggle(isRecordingLocation);

  const isRecordingTacticalLocation = ref(DEFAULT_RECORDING_MIX.tacticalLocation);
  const toggleRecordingTacticalLocation = useToggle(isRecordingTacticalLocation);

  const isRecordingTacticalGeometry = ref(DEFAULT_RECORDING_MIX.tacticalGeometry);
  const toggleRecordingTacticalGeometry = useToggle(isRecordingTacticalGeometry);

  const getRecordingMix = (): RecordingMix => ({
    hierarchy: isRecordingHierarchy.value,
    geometry: isRecordingGeometry.value,
    location: isRecordingLocation.value,
    tacticalLocation: isRecordingTacticalLocation.value,
    tacticalGeometry: isRecordingTacticalGeometry.value,
  });

  const applyRecordingMix = (mix: RecordingMix) => {
    isRecordingHierarchy.value = mix.hierarchy;
    isRecordingGeometry.value = mix.geometry;
    isRecordingLocation.value = mix.location;
    isRecordingTacticalLocation.value = mix.tacticalLocation;
    isRecordingTacticalGeometry.value = mix.tacticalGeometry;
  };

  const stopAllRecording = () => {
    applyRecordingMix({
      hierarchy: false,
      geometry: false,
      location: false,
      tacticalLocation: false,
      tacticalGeometry: false,
    });
  };

  return {
    applyRecordingMix,
    getRecordingMix,
    isRecordingHierarchy,
    toggleRecordingHierarchy,
    isRecordingGeometry,
    toggleRecordingGeometry,
    isRecordingLocation,
    toggleRecordingLocation,
    isRecordingTacticalLocation,
    toggleRecordingTacticalLocation,
    isRecordingTacticalGeometry,
    toggleRecordingTacticalGeometry,
    stopAllRecording,
  };
});
