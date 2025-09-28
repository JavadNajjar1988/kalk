<template>
  <form @submit.prevent="onAdd" class="mt-4 space-y-6">
    <SimpleSelect label="نوع لایه" :items="typeItems" v-model="layerType" />
    <div v-if="layerType === 'XYZLayer'" class="space-y-3">
      <InputGroup v-model="xyzUrl" label="آدرس XYZ (مثلاً http://localhost:8080/tiles/{z}/{x}/{y}.png)" />
      <div class="grid grid-cols-2 gap-2">
        <InputGroup v-model.number="minZoom" type="number" label="کمترین زوم" />
        <InputGroup v-model.number="maxZoom" type="number" label="بیشترین زوم" />
      </div>
    </div>
    <div v-else-if="layerType === 'TileJSONLayer'" class="space-y-3">
      <InputGroup v-model="tilejsonUrl" label="آدرس TileJSON (مثلاً http://localhost:8080/tiles/tile.json)" />
    </div>
    <AlertWarning v-if="isError && errorMessage" title="خطا">{{ errorMessage }}</AlertWarning>
    <footer class="flex items-center justify-end space-x-2 pt-4">
      <Button type="submit" size="sm">افزودن</Button>
      <Button size="sm" variant="outline" @click="emit('cancel')">لغو</Button>
    </footer>
  </form>
</template>

<script setup lang="ts">
import { ref } from "vue";
import SimpleSelect from "@/components/SimpleSelect.vue";
import { type SelectItem } from "@/components/types";
import InputGroup from "@/components/InputGroup.vue";
import AlertWarning from "@/components/AlertWarning.vue";
import { Button } from "@/components/ui/button";
import { useScenarioStore } from "@/scenariostore";
import { addMapLayer } from "@/modules/scenarioeditor/scenarioMapLayers";

const emit = defineEmits(["cancel", "loaded"]);

type BaseMapType = "XYZLayer" | "TileJSONLayer";

const typeItems: SelectItem<BaseMapType>[] = [
  { label: "XYZ", value: "XYZLayer" },
  { label: "TileJSON", value: "TileJSONLayer" },
];

const layerType = ref<BaseMapType>("XYZLayer");
const xyzUrl = ref("");
const minZoom = ref<number | undefined>(0);
const maxZoom = ref<number | undefined>(14);
const tilejsonUrl = ref("");
const isError = ref(false);
const errorMessage = ref("");

const scn = useScenarioStore();

async function onAdd() {
  try {
    if (layerType.value === "XYZLayer") {
      const layer = addMapLayer("XYZLayer", scn.geo);
      scn.geo.updateMapLayer(layer.id, {
        url: xyzUrl.value,
      });
    } else if (layerType.value === "TileJSONLayer") {
      const layer = addMapLayer("TileJSONLayer", scn.geo);
      scn.geo.updateMapLayer(layer.id, {
        url: tilejsonUrl.value,
      });
    }
    emit("loaded");
  } catch (e: any) {
    isError.value = true;
    errorMessage.value = e?.message || "نامشخص";
  }
}
</script>


