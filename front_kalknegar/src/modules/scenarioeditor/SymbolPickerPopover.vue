<script setup lang="ts">
import { IconChevronUp, IconPlus as AddSymbolIcon } from "@iconify-prerendered/vue-mdi";
import PanelSymbolButton from "@/components/PanelSymbolButton.vue";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ref } from "vue";
import { useToolbarUnitSymbolData } from "@/composables/mainToolbarData";
import { useMainToolbarStore } from "@/stores/mainToolbarStore";
import { type UnitSymbolOptions } from "@/types/scenarioModels";
import { injectStrict } from "@/utils";
import { sidcModalKey } from "@/components/injects";
import DotsMenu from "@/components/DotsMenu.vue";
import type { MenuItemData } from "@/components/types.ts";
import { Button } from "@/components/ui/button";
import NewMilitarySymbol from "@/components/NewMilitarySymbol.vue";

interface Props {
  symbolOptions: UnitSymbolOptions;
  addUnit: (sidc: string) => void;
}

const props = defineProps<Props>();

const { getModalSidc } = injectStrict(sidcModalKey);

const { iconItems, customIcon, customSidc, symbolPage } = useToolbarUnitSymbolData();
const store = useMainToolbarStore();

const isOpen = ref(false);
const symbolTabs = ref([
  { title: "زمینی", sidc: "30031000001211000000", id: "land" },
  { title: "دریایی", sidc: "10033000001201000000", id: "sea" },
  { title: "هوایی", sidc: "30030100001101000000", id: "air" },
]);

const panelItems: MenuItemData[] = [
  { label: "افزودن نماد به پانل", action: () => handleChangeSymbol() },
];

async function handleChangeSymbol() {
  const newSidcValue = await getModalSidc(customSidc.value, {
    title: "انتخاب نماد",
    hideModifiers: true,
    hideSymbolColor: true,
    symbolOptions: props.symbolOptions,
  });
  if (newSidcValue !== undefined) {
    customIcon.value.code = newSidcValue.sidc;
    props.addUnit(customSidc.value);
    isOpen.value = false;
  }
}

function onAddUnit(sidc: string) {
  props.addUnit(sidc);
  isOpen.value = false;
}
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger title="انتخاب نمادها" @click="store.clearToolbar()" as-child>
      <Button variant="ghost" size="icon">
        <IconChevronUp class="size-6" :class="{ 'scale-150 text-red-800': isOpen }" />
      </Button>
    </PopoverTrigger>
    <PopoverContent
      class="symbol-picker-popover p-2 px-1"
      align="center"
      side="top"
      :sideOffset="10"
      @keydown.esc.stop="isOpen = false"
    >
      <div class="symbol-picker-header">
        <Tabs v-model="symbolPage" class="symbol-picker-tabs-root w-full">
        <TabsList class="symbol-picker-tabs border-border flex h-10 w-full">
          <TabsTrigger
            v-for="{ id, title, sidc } in symbolTabs"
            :key="id"
            :value="id"
            :title="title"
          >
            <NewMilitarySymbol
              :sidc="sidc"
              :title="title"
              :size="15"
              class="size-6"
              :options="{
                monoColor: 'currentColor',
                strokeWidth: 8,
              }"
            />
          </TabsTrigger>
          <DotsMenu :items="panelItems" class="" />
        </TabsList>
        </Tabs>
      </div>

      <div class="symbol-picker-body">
        <div class="symbol-picker-grid grid h-20 grid-cols-5 place-items-center items-center gap-2">
        <PanelSymbolButton
          class=""
          v-for="{ sidc, text } in iconItems"
          :key="sidc"
          :sidc="sidc"
          :title="text"
          :symbol-options="symbolOptions"
          @click="onAddUnit(sidc)"
        />
        <PanelSymbolButton
          class=""
          :sidc="customSidc"
          :title="customIcon.text"
          :symbol-options="symbolOptions"
          @click="onAddUnit(customSidc)"
        />
        <Button
          variant="ghost"
          size="icon"
          type="button"
          @click="handleChangeSymbol()"
          title="افزودن نماد"
        >
          <AddSymbolIcon class="size-5" />
        </Button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
<style scoped>
.symbol-picker-popover {
  background-color: #e6ebec !important;
  background-image: none !important;
  border: 1px solid #c1c9cb !important;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.14) !important;
  opacity: 1 !important;
  filter: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.symbol-picker-header {
  background-color: #d7dddd !important;
  background-image: none !important;
  border: 1px solid #bcc4c6 !important;
  border-radius: 17px;
  padding: 2px 4px;
  margin: 0;
  opacity: 1 !important;
  filter: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.symbol-picker-tabs-root {
  background-color: transparent !important;
}

.symbol-picker-tabs {
  background-color: #d7dddd !important;
  border: 0 !important;
  border-radius: 14px !important;
  opacity: 1 !important;
  filter: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.symbol-picker-body {
  margin-top: 6px;
  background-color: #e6ebec !important;
  background-image: none !important;
  opacity: 1 !important;
}

.symbol-picker-grid {
  background-color: var(--surface-panel);
  direction: ltr;
}

.symbol-picker-popover :deep([data-slot="tabs-list"]) {
  background-color: #d7dddd !important;
  border: 0 !important;
  box-shadow: none !important;
  opacity: 1 !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.symbol-picker-tabs :deep([data-slot="tabs-trigger"]) {
  background-color: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

.symbol-picker-tabs :deep([data-slot="tabs-trigger"][data-state="active"]) {
  background-color: #e9eded !important;
  border-color: #c1c9cb !important;
  color: #1f2933 !important;
  box-shadow: none !important;
}
</style>
