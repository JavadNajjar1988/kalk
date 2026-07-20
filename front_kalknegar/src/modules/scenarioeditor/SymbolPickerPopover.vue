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
import { Button } from "@/components/ui/button";
import NewMilitarySymbol from "@/components/NewMilitarySymbol.vue";

interface Props {
  symbolOptions: UnitSymbolOptions;
  addUnit: (sidc: string) => void;
  disabled?: boolean;
}

const props = defineProps<Props>();

const { getModalSidc } = injectStrict(sidcModalKey);

const { iconItems, customIcon, customSidc, symbolPage } = useToolbarUnitSymbolData();
const store = useMainToolbarStore();

const isOpen = ref(false);
const symbolTabs = [
  { title: "زمینی", sidc: "30031000001211000000", id: "land" },
  { title: "دریایی", sidc: "10033000001201000000", id: "sea" },
  { title: "هوایی", sidc: "30030100001101000000", id: "air" },
  { title: "تجهیزات", sidc: "10031500001202000000", id: "equipment" },
  { title: "فضایی", sidc: "10030500001106000000", id: "space" },
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
    customIcon.value.text = "نماد سفارشی";
    props.addUnit(newSidcValue.sidc);
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
    <PopoverTrigger as-child>
      <Button
        variant="ghost"
        size="icon"
        :disabled="disabled"
        :title="disabled ? 'ابتدا یک یگان والدِ باز را انتخاب کنید' : 'انتخاب نماد'"
        @click="store.clearToolbar()"
      >
        <IconChevronUp class="size-6" :class="{ 'scale-150 text-red-800': isOpen }" />
        <span class="sr-only">انتخاب نماد</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent
      dir="rtl"
      class="w-[min(26rem,calc(100vw-1rem))] overflow-hidden rounded-2xl p-0"
      align="center"
      side="top"
      :sideOffset="10"
      @keydown.esc.stop="isOpen = false"
    >
      <header
        class="border-border bg-muted/40 flex items-start justify-between gap-3 border-b p-3"
      >
        <div>
          <h2 class="text-sm font-semibold">انتخاب سریع نماد</h2>
          <p class="text-muted-foreground mt-0.5 text-xs">
            نماد را انتخاب کنید، سپس روی نقشه بگذارید.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          class="shrink-0 gap-1.5"
          @click="handleChangeSymbol()"
        >
          <AddSymbolIcon class="size-4" />
          کتابخانه کامل
        </Button>
      </header>

      <Tabs v-model="symbolPage" class="w-full">
        <div class="border-border border-b p-2">
          <TabsList class="grid h-auto w-full grid-cols-5">
            <TabsTrigger
              v-for="{ id, title, sidc } in symbolTabs"
              :key="id"
              :value="id"
              :title="title"
              class="h-14 min-w-0 flex-col gap-0.5 px-1 text-[11px]"
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
              <span class="max-w-full truncate">{{ title }}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div class="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto p-3 sm:grid-cols-5">
          <PanelSymbolButton
            v-for="{ sidc, text } in iconItems"
            :key="sidc"
            :sidc="sidc"
            :title="text"
            :symbol-options="symbolOptions"
            class="bg-background/70 hover:bg-accent h-16 w-full flex-col gap-1 rounded-xl border"
            @click="onAddUnit(sidc)"
          >
            <span class="w-full truncate px-1 text-[10px]">{{ text }}</span>
          </PanelSymbolButton>
          <PanelSymbolButton
            :sidc="customSidc"
            :title="customIcon.text"
            :symbol-options="symbolOptions"
            class="bg-background/70 hover:bg-accent h-16 w-full flex-col gap-1 rounded-xl border"
            @click="onAddUnit(customSidc)"
          >
            <span class="w-full truncate px-1 text-[10px]">{{ customIcon.text }}</span>
          </PanelSymbolButton>
          <Button
            variant="outline"
            type="button"
            class="h-16 w-full flex-col gap-1 rounded-xl border-dashed"
            @click="handleChangeSymbol()"
            title="انتخاب از کتابخانه کامل"
          >
            <AddSymbolIcon class="size-5" />
            <span class="text-[10px]">نماد دیگر</span>
          </Button>
        </div>
      </Tabs>
    </PopoverContent>
  </Popover>
</template>
