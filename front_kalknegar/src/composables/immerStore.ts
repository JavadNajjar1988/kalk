/**
 * A custom store based on https://github.com/Korijn/vue-store
 */
import { createEventHook } from "@vueuse/core";
import { computed, reactive, ref, shallowReactive, toRaw } from "vue";
import type { Patch } from "immer";
import { enablePatches, produceWithPatches, setAutoFreeze } from "immer";
import { applyPatch } from "rfc6902";
import { nextUndoSequence } from "@/utils/undoSequence";

enablePatches();
setAutoFreeze(false);
function applyPatchWrapper<T>(state: T, patches: Patch[]) {
  const convertedPatches = patches.map(({ value, path, op }) => {
    return { value, op, path: `/${path.join("/")}` };
  });
  applyPatch(state, convertedPatches);
}

export interface MetaEntry<T = string> {
  label: T;
  value: string | number;
}

interface UndoEntry<T = string> {
  patches: Patch[];
  inversePatches: Patch[];
  meta?: MetaEntry<T>;
  sequence: number;
}

export function useImmerStore<T extends object, M>(baseState: T) {
  const state = reactive(baseState);

  const past = shallowReactive<UndoEntry<M>[]>([]);
  const future = shallowReactive<UndoEntry<M>[]>([]);
  const changeCounter = ref(0);

  const canUndo = computed(() => past.length > 0);
  const canRedo = computed(() => future.length > 0);
  const undoSequence = computed(() => past[past.length - 1]?.sequence ?? 0);
  const redoSequence = computed(() => future[0]?.sequence ?? 0);

  const undoRedoHook = createEventHook<{
    patch: Patch[];
    meta?: MetaEntry<M>;
    action: "undo" | "redo";
  }>();

  const update = (
    updater: (currentState: T) => void,
    meta?: MetaEntry<M>,
    force = false,
  ) => {
    const [, patches, inversePatches] = produceWithPatches(toRaw(state), updater);
    if (patches.length === 0 && !force) return;
    applyPatchWrapper(state, patches);
    past.push({ patches, inversePatches, meta, sequence: nextUndoSequence() });
    future.splice(0);
    changeCounter.value++;
  };

  function groupUpdate(updates: () => void, meta?: MetaEntry<M>) {
    const preLength = past.length;
    updates();
    const diff = past.length - preLength;
    if (diff <= 0) return;
    let elems: UndoEntry<M>[] = [];
    for (let i = 0; i < diff; i++) elems.push(past.pop()!);
    let mergedPatches: Patch[] = [];
    let mergedInversePatches: Patch[] = [];
    elems.forEach(({ patches, inversePatches }) => {
      mergedPatches.push(...patches);
      mergedInversePatches.push(...inversePatches);
    });
    past.push({
      patches: mergedPatches,
      inversePatches: mergedInversePatches,
      meta,
      sequence: Math.max(...elems.map(entry => entry.sequence)),
    });
  }

  const undo = () => {
    if (!canUndo.value) return false;
    const { patches, inversePatches, meta, sequence } = past.pop()!;
    applyPatchWrapper(state, inversePatches);
    future.unshift({ patches, inversePatches, meta, sequence });
    changeCounter.value++;
    undoRedoHook.trigger({ patch: inversePatches, meta, action: "undo" });
    return true;
  };

  const redo = () => {
    if (!canRedo.value) return false;
    const { patches, inversePatches, meta, sequence } = future.shift()!;
    applyPatchWrapper(state, patches);
    past.push({ patches, inversePatches, meta, sequence });
    changeCounter.value++;
    undoRedoHook.trigger({ patch: patches, meta, action: "redo" });
    return true;
  };

  const clearUndoRedoStack = () => {
    past.splice(0);
    future.splice(0);
  };

  const markChanged = () => {
    changeCounter.value++;
  };

  return {
    state,
    update,
    redo,
    undo,
    clearUndoRedoStack,
    canRedo,
    canUndo,
    undoSequence,
    redoSequence,
    changeCounter,
    markChanged,
    groupUpdate,
    onUndoRedo: undoRedoHook.on,
  };
}
