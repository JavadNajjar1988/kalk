<script setup lang="ts">
import type { ScenarioWMSLayer } from "@/types/scenarioGeoModels";
import InputGroup from "@/components/InputGroup.vue";
import { ref, watch } from "vue";
import BaseButton from "@/components/BaseButton.vue";
import { getChangedValues } from "@/utils";
import { type ScenarioWMSLayerUpdate } from "@/types/internalModels";
import { useFocusOnMount } from "@/components/helpers";
import DescriptionItem from "@/components/DescriptionItem.vue";
import { useMapLayerInfo } from "@/composables/geoMapLayers";
import { Button } from "@/components/ui/button";

interface Props {
  layer: ScenarioWMSLayer;
}
const props = defineProps<Props>();
const emit = defineEmits(["update", "action"]);

const { status, isInitialized, layerTypeLabel } = useMapLayerInfo(props.layer);

watch(status, (v) => {
  if (v === "initialized") {
    emit("action", "zoom");
  }
});

const editMode = ref(false);
const { focusId } = useFocusOnMount();

const formData = ref({
  url: props.layer.url,
  layers: props.layer.layers,
  imageFormat: props.layer.imageFormat ?? "image/png",
});

watch(
  () => props.layer,
  (v) => {
    editMode.value = v._isNew ?? false;
    formData.value = {
      url: v.url,
      layers: v.layers,
      imageFormat: v.imageFormat ?? "image/png",
    };
  },
  { immediate: true },
);

function submit() {
  const diff = getChangedValues({ ...formData.value }, props.layer);
  emit("update", diff as ScenarioWMSLayerUpdate);
  editMode.value = false;
}
</script>

<template>
  <section>
    <header class="flex justify-end">
      <span class="badge">{{ layerTypeLabel }}</span>
    </header>
    <form v-if="editMode" @submit.prevent="submit" class="space-y-3 p-1">
      <InputGroup :id="focusId" v-model="formData.url" label="آدرس پایه سرویس WMS" type="url" />
      <InputGroup v-model="formData.layers" label="نام لایه OGC (LAYERS)" />
      <InputGroup v-model="formData.imageFormat" label="فرمت تصویر (FORMAT)" placeholder="image/png" />
      <div class="flex justify-end gap-2">
        <BaseButton type="button" variant="ghost" @click="editMode = false">انصراف</BaseButton>
        <BaseButton type="submit">ذخیره</BaseButton>
      </div>
    </form>
    <div v-else>
      <DescriptionItem label="آدرس WMS" dd-class="truncate">{{ layer.url || "تنظیم نشده" }}</DescriptionItem>
      <DescriptionItem label="LAYERS">{{ layer.layers || "—" }}</DescriptionItem>
      <DescriptionItem label="FORMAT">{{ layer.imageFormat || "image/png" }}</DescriptionItem>
      <footer class="mt-4 flex justify-end space-x-2">
        <Button variant="outline" size="sm" @click="editMode = true">ویرایش</Button>
      </footer>
    </div>
    <p v-if="!isInitialized" class="mt-2 text-sm text-gray-500">
      این لایه هنوز مقداردهی اولیه نشده است.
    </p>
  </section>
</template>
