<template>
  <div class="space-y-0.5 pt-1 text-sm leading-5">
    <slot name="header" />
    <div class="px-2 pb-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        class="w-full justify-center gap-2"
        :disabled="
          resourceLoading || !activeParentId || unitActions.isUnitLocked(activeParentId)
        "
        @click="resourcePickerOpen = true"
      >
        <IconDatabase class="size-4" />
        {{ resourceLoading ? "در حال دریافت یگان…" : "افزودن یگان از مدیریت منابع" }}
      </Button>
      <p v-if="resourceError" class="mt-1 text-xs text-red-600">
        {{ resourceError }}
      </p>
      <p v-else-if="!activeParentId && sides.length" class="mt-1 text-xs text-slate-500">
        ابتدا محل قرارگیری یگان را در آرایش نبرد انتخاب کنید.
      </p>
    </div>
    <OrbatSide
      v-for="side in sides"
      :key="side.id"
      :side="side"
      @unit-action="onUnitAction"
      @unit-click="onUnitClick"
      @side-action="onSideAction"
      :hide-filter="hideFilter"
    />
    <OrbatPanelAddSide
      v-if="sides.length < 2"
      :simple="sides.length >= 1"
      class="mt-4"
      @add="addSide()"
    />
  </div>
  <ResourcePicker
    v-model:open="resourcePickerOpen"
    type="units"
    title="انتخاب یگان از مدیریت منابع"
    @select="onUnitResourceSelect"
  />
  <div
    v-if="isDragging && isCopying"
    class="fixed top-4 right-1/2 z-50 rounded-xl border border-blue-300 bg-blue-100 bg-white p-3 text-center text-sm text-blue-800 shadow-lg dark:border-blue-600 dark:bg-blue-900/50 dark:bg-slate-800 dark:text-blue-200"
  >
    <p>حالت کپی کشیدن <span v-if="isCopyingState">(شامل وضعیت)</span></p>
  </div>
  <div
    v-if="showHierarchyDragStatus"
    class="fixed top-4 right-1/2 z-50 translate-x-1/2 rounded-xl border border-red-300 bg-red-50 p-3 text-center text-sm text-red-900 shadow-lg dark:border-red-700 dark:bg-red-950/80 dark:text-red-100"
  >
    <p>
      ضبط سلسله‌مراتب فعال است؛ رها کردن واحد، جابجایی زمانی در آرایش نبرد ثبت می‌شود.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import OrbatPanelAddSide from "@/components/OrbatPanelAddSide.vue";
import { injectStrict, triggerPostMoveFlash } from "@/utils";
import { activeParentKey, activeScenarioKey } from "@/components/injects";
import OrbatSide from "@/components/OrbatSide.vue";
import type { NSide, NSideGroup, NUnit } from "@/types/internalModels";
import { type SideAction, SideActions } from "@/types/constants";
import { type DropTarget } from "@/components/types";
import { useUnitActions } from "@/composables/scenarioActions";
import { useEventBus, useEventListener } from "@vueuse/core";
import { orbatUnitClick } from "@/components/eventKeys";
import { useSelectedItems } from "@/stores/selectedStore";
import { inputEventFilter } from "@/components/helpers";
import { addUnitHierarchy, parseApplicationOrbat } from "@/importexport/convertUtils";
import {
  createOrbatClipboardData,
  getInternalOrbatClipboardData,
  setInternalOrbatClipboardData,
} from "@/components/mapContextMenuOrbatActions";
import { type EntityId } from "@/types/base";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { isSideDragItem, isSideGroupDragItem, isUnitDragItem } from "@/types/draggables";
import { useRecordingStore } from "@/stores/recordingStore";
import { Button } from "@/components/ui/button";
import { PhDatabase as IconDatabase } from "@phosphor-icons/vue";
import ResourcePicker from "./ResourcePicker.vue";
import {
  resourceApiService,
  type ResourceSearchResultDto,
} from "@/services/api/resourceApiService";
import { createUnitFromResource } from "./unitResourceFactory";
import { Sidc } from "@/symbology/sidc";
import { getNextEchelonBelow } from "@/symbology/helpers";

import {
  extractInstruction,
  type Instruction,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";

interface Props {
  hideFilter?: boolean;
}

const props = withDefaults(defineProps<Props>(), { hideFilter: false });
const activeScenario = injectStrict(activeScenarioKey);
const { store, unitActions, io, time } = activeScenario;
const activeParentId = injectStrict(activeParentKey);

const isDragging = ref(false);
const isDraggingUnit = ref(false);
const isCopying = ref(false);
const isCopyingState = ref(false);
const resourcePickerOpen = ref(false);
const resourceLoading = ref(false);
const resourceError = ref<string | null>(null);

const { state, groupUpdate } = store;
const { changeUnitParent, addSide } = unitActions;
const recordStore = useRecordingStore();
const showHierarchyDragStatus = computed(
  () => isDraggingUnit.value && recordStore.isRecordingHierarchy,
);
const bus = useEventBus(orbatUnitClick);

useEventListener(document, "paste", onPaste);
useEventListener(document, "copy", onCopy);
const sides = computed(() => {
  return state.sides.map((id) => state.sideMap[id]);
});

function fallbackSidcForParent(parentId: EntityId): string {
  const parentUnit = state.unitMap[parentId];
  if (parentUnit) {
    const sidc = new Sidc(parentUnit.sidc);
    sidc.emt = getNextEchelonBelow(sidc.emt);
    return sidc.toString();
  }

  const sideGroup = state.sideGroupMap[parentId];
  const side = sideGroup ? state.sideMap[sideGroup._pid] : state.sideMap[parentId];
  const sidc = new Sidc("10031000000000000000");
  if (side?.standardIdentity) sidc.standardIdentity = side.standardIdentity;
  return sidc.toString();
}

async function onUnitResourceSelect(resource: ResourceSearchResultDto) {
  const parentId = activeParentId.value;
  if (!parentId || unitActions.isUnitLocked(parentId)) return;
  resourceLoading.value = true;
  resourceError.value = null;
  try {
    const detail = await resourceApiService.getById(resource.id);
    const existingUnit = Object.values(state.unitMap).find(
      (unit) => unit?.linkedResourceId === detail.id,
    );
    if (existingUnit) {
      selectedUnitIds.value = new Set([existingUnit.id]);
      activeUnitId.value = existingUnit.id;
      resourceError.value =
        "این یگان پیش‌تر به سناریو افزوده شده است؛ همان یگان برای ویرایش انتخاب شد.";
      return;
    }
    const unitId = unitActions.addUnit(
      createUnitFromResource(detail, fallbackSidcForParent(parentId)),
      parentId,
    );
    const parent =
      state.unitMap[parentId] ?? state.sideGroupMap[parentId] ?? state.sideMap[parentId];
    if (parent) parent._isOpen = true;
    selectedUnitIds.value = new Set([unitId]);
    activeUnitId.value = unitId;
  } catch (error: any) {
    resourceError.value = error?.message || "افزودن یگان از مدیریت منابع ناموفق بود.";
  } finally {
    resourceLoading.value = false;
  }
}

const { onUnitAction } = useUnitActions();
const { selectedUnitIds, activeUnitId } = useSelectedItems();

let dndCleanup: () => void = () => {};
onMounted(() => {
  dndCleanup = monitorForElements({
    canMonitor: ({ source }) =>
      isUnitDragItem(source.data) ||
      isSideGroupDragItem(source.data) ||
      isSideDragItem(source.data),
    onDragStart: ({ location, source }) => {
      isDragging.value = true;
      isCopying.value = location.initial.input.ctrlKey || location.initial.input.metaKey;
      isCopyingState.value = isCopying.value && location.initial.input.altKey;
      isDraggingUnit.value = isUnitDragItem(source.data);
    },

    onDrop: ({ source, location }) => {
      isDragging.value = false;
      isDraggingUnit.value = false;
      const destination = location.current.dropTargets[0];
      if (!destination) {
        return;
      }
      const instruction = extractInstruction(destination.data);
      const sourceData = source.data;
      const destinationData = destination.data;
      if (!instruction) return;
      const isDuplicateAction =
        location.initial.input.ctrlKey || location.initial.input.metaKey;
      const isDuplicateState = isDuplicateAction && location.initial.input.altKey;
      if (isUnitDragItem(sourceData)) {
        const target = mapInstructionToTarget(instruction);
        if (isUnitDragItem(destinationData)) {
          onUnitDrop(sourceData.unit, destinationData.unit, target, {
            isDuplicateAction,
            isDuplicateState,
          });
          if (instruction.type === "make-child") {
            destinationData.unit._isOpen = true;
          }
        } else if (isSideGroupDragItem(destinationData)) {
          onUnitDrop(sourceData.unit, destinationData.sideGroup, target, {
            isDuplicateAction,
            isDuplicateState,
          });
        } else if (isSideDragItem(destinationData)) {
          onUnitDrop(sourceData.unit, destinationData.side, "on", {
            isDuplicateAction,
            isDuplicateState,
          });
        }
        const unitId = sourceData.unit.id;
        nextTick(() => {
          const el = document.getElementById(`ou-${unitId}`);
          if (el) {
            triggerPostMoveFlash(el);
          }
        });
      } else if (isSideGroupDragItem(sourceData)) {
        const target = mapInstructionToTarget(instruction);
        if (isSideGroupDragItem(destinationData)) {
          let sourceId = sourceData.sideGroup.id;
          groupUpdate(() => {
            if (isDuplicateAction) {
              sourceId = unitActions.cloneSideGroup(sourceId, {
                includeState: isDuplicateState,
              })!;
            }
            unitActions.changeSideGroupParent(
              sourceId,
              destinationData.sideGroup.id,
              target,
            );
          });

          nextTick(() => {
            const el = document.getElementById(`osg-${sourceId}`);
            if (el) {
              triggerPostMoveFlash(el);
            }
          });
        } else if (isSideDragItem(destinationData)) {
          let sourceId = sourceData.sideGroup.id;
          groupUpdate(() => {
            if (isDuplicateAction) {
              sourceId = unitActions.cloneSideGroup(sourceId, {
                includeState: isDuplicateState,
              })!;
            }
            unitActions.changeSideGroupParent(sourceId, destinationData.side.id, "on");
          });
          nextTick(() => {
            const el = document.getElementById(`os-${sourceId}`);
            if (el) {
              triggerPostMoveFlash(el);
            }
          });
        }
      } else if (isSideDragItem(sourceData)) {
        const target = mapInstructionToTarget(instruction);
        groupUpdate(() => {
          let sourceId = sourceData.side.id;
          if (isDuplicateAction) {
            sourceId = unitActions.cloneSide(sourceData.side.id, {
              includeState: isDuplicateState,
            })!;
          }
          if (isSideDragItem(destinationData)) {
            unitActions.moveSide(sourceId, destinationData.side.id, target);
            nextTick(() => {
              const el = document.getElementById(`os-${sourceId}`);
              if (el) {
                triggerPostMoveFlash(el);
              }
            });
          }
        });
      }
    },
  });
});

onUnmounted(() => {
  dndCleanup();
});

function mapInstructionToTarget(instruction: Instruction): DropTarget {
  if (instruction.type === "make-child") {
    return "on";
  } else if (instruction.type === "reorder-above") {
    return "above";
  } else {
    return "below";
  }
}

function onUnitDrop(
  unit: NUnit,
  destinationUnit: NUnit | NSideGroup | NSide,
  target: DropTarget,
  options: { isDuplicateAction?: boolean; isDuplicateState?: boolean } = {},
) {
  const isDuplicateAction = options.isDuplicateAction ?? false;
  const isDuplicateState = options.isDuplicateState ?? false;
  groupUpdate(() => {
    const selUnits = selectedUnitIds.value.has(unit.id)
      ? new Set([...selectedUnitIds.value])
      : new Set([unit.id]);
    selUnits.delete(destinationUnit.id);
    for (const id of selUnits) {
      let unitId = id;
      if (isDuplicateAction) {
        unitId = unitActions.cloneUnit(id, {
          includeSubordinates: true,
          includeState: isDuplicateState,
        })!;
      }
      if (recordStore.isRecordingHierarchy) {
        unitActions.recordUnitHierarchyMove(unitId, destinationUnit.id, target);
      } else {
        changeUnitParent(unitId, destinationUnit.id, target);
      }
    }
  });
  if (isDuplicateState) {
    time.setCurrentTime(state.currentTime);
  }
}

function onUnitClick(unit: NUnit, event: MouseEvent) {
  const ids = selectedUnitIds.value;
  if (event.shiftKey) {
    const selectedIds = calculateSelectedUnitIds(unit.id);
    selectedIds.forEach((id) => {
      ids.add(id);
    });
  } else if (event.ctrlKey || event.metaKey) {
    if (ids.has(unit.id)) {
      ids.delete(unit.id);
    } else {
      ids.add(unit.id);
    }
  } else {
    activeUnitId.value = unit.id;
    activeParentId.value = unit.id;
  }
  bus.emit(unit);
}

function calculateSelectedUnitIds(newUnitId: EntityId): EntityId[] {
  const lastSelectedId = [...selectedUnitIds.value].pop();
  if (lastSelectedId === undefined) return [newUnitId];
  const allOpenUnits: EntityId[] = [];
  for (const side of state.sides) {
    unitActions.walkSide(side, (unit) => {
      allOpenUnits.push(unit.id);
      if (!unit._isOpen) return false;
    });
  }
  const lastSelectedIndex = allOpenUnits.indexOf(lastSelectedId);
  const newUnitIndex = allOpenUnits.indexOf(newUnitId);
  if (lastSelectedIndex === -1 || newUnitIndex === -1) return [newUnitId];
  return allOpenUnits.slice(
    Math.min(lastSelectedIndex, newUnitIndex),
    Math.max(lastSelectedIndex, newUnitIndex) + 1,
  );
}

function onSideAction(side: NSide, action: SideAction) {
  if (action === SideActions.Delete) {
    unitActions.deleteSide(side.id);
  } else if (action === SideActions.MoveDown) {
    unitActions.reorderSide(side.id, "down");
  } else if (action === SideActions.MoveUp) {
    unitActions.reorderSide(side.id, "up");
  } else if (action === SideActions.Add) {
    addSide();
  } else if (action === SideActions.Lock) {
    unitActions.updateSide(side.id, { locked: true }, { noUndo: true });
  } else if (action === SideActions.Unlock) {
    unitActions.updateSide(side.id, { locked: false }, { noUndo: true });
  } else if (action === SideActions.Clone) {
    unitActions.cloneSide(side.id);
  } else if (action === SideActions.CloneWithState) {
    unitActions.cloneSide(side.id, { includeState: true });
  } else if (action === SideActions.Hide) {
    unitActions.updateSide(side.id, { isHidden: true });
  } else if (action === SideActions.Show) {
    unitActions.updateSide(side.id, { isHidden: false });
  }
}

function getUnitIdFromElement(element: Element | null | undefined): string | undefined {
  if (element?.tagName == "LI" && element?.id.startsWith("ou-")) {
    return element.id.slice(3);
  }
}

function onCopy(c: ClipboardEvent) {
  if (!inputEventFilter(c)) return;

  const target = document.activeElement as HTMLElement;
  const unitId = getUnitIdFromElement(target.closest('li[id^="ou-"]'));

  // only copy if an ORBAT item has focus
  if (!unitId) return;

  const clipboardData = createOrbatClipboardData({
    targetIds: [...selectedUnitIds.value],
    state,
    stringifyObject: io.stringifyObject,
  });
  if (!clipboardData) return;

  setInternalOrbatClipboardData(clipboardData.applicationOrbat);
  c.clipboardData?.setData("application/orbat", clipboardData.applicationOrbat);
  c.clipboardData?.setData("text/plain", clipboardData.textPlain);

  c.preventDefault();
}

function onPaste(e: ClipboardEvent) {
  if (!inputEventFilter(e)) return;
  const target = document.activeElement as HTMLElement;

  const parentId = getUnitIdFromElement(target.closest('li[id^="ou-"]'));
  // only paste if an ORBAT item has focus
  if (!parentId) return;
  const applicationOrbat = e.clipboardData?.types.includes("application/orbat")
    ? e.clipboardData?.getData("application/orbat")
    : getInternalOrbatClipboardData();
  if (!applicationOrbat) return;

  const pastedOrbat = parseApplicationOrbat(applicationOrbat);
  pastedOrbat?.forEach((unit) => addUnitHierarchy(unit, parentId, activeScenario));
  unitActions.getUnitById(parentId)._isOpen = true;

  e.preventDefault();
}
</script>
