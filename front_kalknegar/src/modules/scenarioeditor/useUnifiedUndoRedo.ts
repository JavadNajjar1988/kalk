import { computed, onUnmounted, ref, watch, type ComputedRef } from "vue";
import { useServicesStore } from "@/modules/tactical-symbol-map/stores/services.js";

type UndoService = {
  on: (event: string, handler: () => void) => void;
  off: (event: string, handler: () => void) => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  undoSequence: () => number;
  redoSequence: () => number;
  undo: () => boolean | Promise<boolean>;
  redo: () => boolean | Promise<boolean>;
};

type ScenarioUndoStore = {
  canUndo: ComputedRef<boolean>;
  canRedo: ComputedRef<boolean>;
  undoSequence: ComputedRef<number>;
  redoSequence: ComputedRef<number>;
  undo: () => boolean;
  redo: () => boolean;
};

export const shouldUseTacticalUndo = (
  tacticalAvailable: boolean,
  tacticalSequence: number,
  scenarioAvailable: boolean,
  scenarioSequence: number,
) =>
  tacticalAvailable &&
  (!scenarioAvailable || tacticalSequence >= scenarioSequence);

export const shouldUseTacticalRedo = (
  tacticalAvailable: boolean,
  tacticalSequence: number,
  scenarioAvailable: boolean,
  scenarioSequence: number,
) =>
  tacticalAvailable &&
  (!scenarioAvailable ||
    (tacticalSequence > 0 && tacticalSequence <= scenarioSequence));

export function useUnifiedUndoRedo(scenarioStore: ScenarioUndoStore) {
  const servicesStore = useServicesStore();
  const tacticalCanUndo = ref(false);
  const tacticalCanRedo = ref(false);
  let tacticalUndo: UndoService | null = null;

  const refreshTacticalState = () => {
    tacticalCanUndo.value = tacticalUndo?.canUndo() ?? false;
    tacticalCanRedo.value = tacticalUndo?.canRedo() ?? false;
  };

  const bindTacticalUndo = () => {
    const nextUndo = servicesStore.getServices().undo as UndoService | null;
    if (nextUndo === tacticalUndo) {
      refreshTacticalState();
      return;
    }

    tacticalUndo?.off("changed", refreshTacticalState);
    tacticalUndo = nextUndo;
    tacticalUndo?.on("changed", refreshTacticalState);
    refreshTacticalState();
  };

  watch(() => servicesStore.getServices().undo, bindTacticalUndo, {
    immediate: true,
  });

  onUnmounted(() => {
    tacticalUndo?.off("changed", refreshTacticalState);
  });

  const canUndo = computed(
    () => tacticalCanUndo.value || scenarioStore.canUndo.value,
  );
  const canRedo = computed(
    () => tacticalCanRedo.value || scenarioStore.canRedo.value,
  );

  const undo = async () => {
    const activeTacticalUndo = tacticalUndo;
    const tacticalSequence = activeTacticalUndo?.undoSequence() ?? 0;
    const scenarioSequence = scenarioStore.undoSequence.value;
    if (
      activeTacticalUndo &&
      shouldUseTacticalUndo(
        activeTacticalUndo?.canUndo() ?? false,
        tacticalSequence,
        scenarioStore.canUndo.value,
        scenarioSequence,
      )
    ) {
      await activeTacticalUndo.undo();
      refreshTacticalState();
      return true;
    }
    return scenarioStore.undo();
  };

  const redo = async () => {
    const activeTacticalUndo = tacticalUndo;
    const tacticalSequence = activeTacticalUndo?.redoSequence() ?? 0;
    const scenarioSequence = scenarioStore.redoSequence.value;
    if (
      activeTacticalUndo &&
      shouldUseTacticalRedo(
        activeTacticalUndo?.canRedo() ?? false,
        tacticalSequence,
        scenarioStore.canRedo.value,
        scenarioSequence,
      )
    ) {
      await activeTacticalUndo.redo();
      refreshTacticalState();
      return true;
    }
    return scenarioStore.redo();
  };

  return { undo, redo, canUndo, canRedo };
}
