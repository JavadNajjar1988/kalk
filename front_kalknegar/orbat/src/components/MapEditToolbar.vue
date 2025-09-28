<script setup lang="ts">
import {
  PhCursor as IconCursorDefaultOutline,
  PhLockOpen as IconLockOpenVariantOutline,
  PhLock as IconLockOutline,
  PhMapPin as IconMapMarker,
  PhPencil as IconSquareEditOutline,
  PhTrash as IconTrashCanOutline,
  PhCircle as IconVectorCircleVariant,
  PhLineSegment as IconVectorLine,
  PhTriangle as IconVectorTriangle,
} from "@phosphor-icons/vue";
import ToolbarButton from "./ToolbarButton.vue";
import OLMap from "ol/Map";
import { toRef, watch } from "vue";
import VerticalToolbar from "./VerticalToolbar.vue";
import VectorLayer from "ol/layer/Vector";
import { useEditingInteraction } from "@/composables/geoEditing";
import { onKeyStroke, useToggle } from "@vueuse/core";
import Select from "ol/interaction/Select";
import { useUiStore } from "@/stores/uiStore";

interface Props {
  olMap: OLMap;
  layer: VectorLayer<any>;
  select?: Select;
  deleteEnabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), { deleteEnabled: false });
const emit = defineEmits(["add", "modify", "delete"]);

const [addMultiple, toggleAddMultiple] = useToggle(false);

const { startDrawing, currentDrawType, startModify, isModifying, cancel, isDrawing } =
  useEditingInteraction(props.olMap, toRef(props, "layer"), {
    emit,
    addMultiple: addMultiple,
    select: props.select,
  });

const uiStore = useUiStore();

watch(
  [isDrawing, isModifying],
  ([drawing, modifying]) => {
    uiStore.editToolbarActive = drawing || modifying;
  },
  { immediate: true },
);

onKeyStroke("Escape", (event) => {
  cancel();
});
</script>

<template>
  <div class="flex flex-col">
    <VerticalToolbar class="shadow-sm">
      <ToolbarButton
        top
        @click="toggleAddMultiple()"
        title="نگه داشتن ابزار انتخابی فعال پس از رسم "
      >
        <IconLockOutline v-if="addMultiple" class="h-5 w-5" />
        <IconLockOpenVariantOutline v-else class="h-5 w-5" />
      </ToolbarButton>
      <ToolbarButton title="انتخاب ویژگی‌ها" @click="cancel()" :active="!currentDrawType">
        <IconCursorDefaultOutline class="h-5 w-5" />
      </ToolbarButton>
      <ToolbarButton
        title="رسم نقطه"
        @click="startDrawing('Point')"
        :active="currentDrawType === 'Point'"
      >
        <IconMapMarker class="h-5 w-5" />
      </ToolbarButton>
      <ToolbarButton
        title="رسم خط شکسته"
        @click="startDrawing('LineString')"
        :active="currentDrawType === 'LineString'"
      >
        <IconVectorLine class="h-5 w-5" />
      </ToolbarButton>
      <ToolbarButton
        title="رسم چندضلعی"
        @click="startDrawing('Polygon')"
        :active="currentDrawType === 'Polygon'"
      >
        <IconVectorTriangle class="h-5 w-5" />
      </ToolbarButton>
      <ToolbarButton
        bottom
        title="رسم دایره"
        @click="startDrawing('Circle')"
        :active="currentDrawType === 'Circle'"
      >
        <IconVectorCircleVariant class="h-5 w-5" />
      </ToolbarButton>
    </VerticalToolbar>

    <VerticalToolbar class="mt-2 shadow-sm">
      <ToolbarButton
        top
        title="ویرایش ویژگی"
        @click="startModify()"
        :active="isModifying"
      >
        <IconSquareEditOutline class="h-5 w-5" />
      </ToolbarButton>
      <ToolbarButton
        bottom
        title="حذف ویژگی"
        :disabled="!deleteEnabled"
        @click="emit('delete')"
      >
        <IconTrashCanOutline class="h-5 w-5" />
      </ToolbarButton>
    </VerticalToolbar>
  </div>
</template>
