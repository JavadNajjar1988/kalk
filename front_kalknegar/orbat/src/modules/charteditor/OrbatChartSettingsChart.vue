<template>
  <div>
    <p class="text-sm text-gray-600">تنظیماتی که بر کل نمودار تأثیر می‌گذارد.</p>
    <template v-if="!chartMode">
      <InputGroupTemplate label="واحد ریشه" v-if="rootUnitStore.unit" class="my-4">
        <div class="flex items-start">
          <div class="mt-2 w-16 shrink-0">
            <MilSymbol
              :sidc="rootUnitStore.unit.sidc"
              :size="30"
              :modifiers="rootUnitStore.unit.symbolOptions"
            />
          </div>
          <div class="min-w-0 flex-auto">
            <p class="truncate pt-2 text-sm font-medium text-gray-700">
              {{ rootUnitStore.unit.name }}
            </p>
            <p class="truncate text-sm text-gray-500">
              {{ rootUnitStore.unit.shortName }}
            </p>
          </div>
          <div class="mt-4 flex-none">
            <IconButton @click="showSearch = true">
              <SearchIcon class="h-5 w-5" />
            </IconButton>
          </div>
        </div>
      </InputGroupTemplate>

      <CreateEmtpyDashed
        v-else
        @click="showSearch = true"
        :icon="$options.components?.SearchIcon"
        >انتخاب واحد ریشه
      </CreateEmtpyDashed>
    </template>
    <NumberInputGroup label="سطوح" v-model="options.maxLevels" />
    <div class="mt-4 w-full border-t border-gray-200" />
    <AccordionPanel label="تنظیمات صفحه">
      <SimpleSelect
        v-model="options.paperSize"
        label="اندازه صفحه"
        :items="canvasSizeItems"
      />
    </AccordionPanel>
    <AccordionPanel label="طرح‌بندی و فاصله‌گذاری">
      <NumberInputGroup label="فاصله سطح" v-model="options.levelPadding" />
      <NumberInputGroup label="فاصله درخت" v-model="options.treeOffset" />
      <NumberInputGroup label="فاصله انباشته" v-model="options.stackedOffset" />
      <SimpleSelect
        label="طرح‌بندی آخرین سطح"
        v-model="options.lastLevelLayout"
        :items="levelItems"
      />
      <SimpleSelect
        label="فاصله واحد"
        v-model="options.unitLevelDistance"
        :items="spacingItems"
      />
    </AccordionPanel>

    <AccordionPanel label="تنظیمات واحد">
      <NumberInputGroup label="اندازه نماد" v-model="options.symbolSize" />
      <NumberInputGroup label="اندازه فونت" v-model="options.fontSize" />
      <SimpleSelect
        label="ضخامت فونت"
        v-model="options.fontWeight"
        :items="fontWeightItems"
      />
      <SimpleSelect
        label="سبک فونت"
        v-model="options.fontStyle"
        :items="fontStyleItems"
      />
      <NumberInputGroup label="فاصله برچسب" v-model="options.labelOffset" />
      <SimpleSelect
        label="قرارگیری برچسب"
        v-model="options.labelPlacement"
        :items="labelPlacementItems"
      />
      <InputGroup label="رنگ فونت" type="color" v-model="options.fontColor" />
      <ToggleField v-model="options.useShortName">استفاده از نام‌های کوتاه واحد</ToggleField>
      <ToggleField v-model="options.hideLabel">مخفی کردن برچسب</ToggleField>
    </AccordionPanel>
    <AccordionPanel label="اتصال‌دهنده‌ها">
      <NumberInputGroup label="فاصله اتصال‌دهنده" v-model="options.connectorOffset" />
      <InputGroup label="ضخامت خط" type="number" v-model="options.lineWidth" />
      <InputGroup label="رنگ خط" type="color" v-model="options.lineColor" />
    </AccordionPanel>
    <AccordionPanel label="تجهیزات و پرسنل">
      <SettingsToe item-type="chart" />
    </AccordionPanel>

    <SearchModal v-model="showSearch" @select-unit="onUnitSelect" />
  </div>
</template>

<script setup lang="ts">
import InputGroup from "@/components/InputGroup.vue";
import { useChartSettingsStore, useRootUnitStore } from "./chartSettingsStore";
import SimpleSelect from "@/components/SimpleSelect.vue";
import {
  FontStyles,
  FontWeights,
  LabelPlacements,
  LevelLayouts,
  UnitLevelDistances,
} from "./orbatchart";
import ToggleField from "@/components/ToggleField.vue";
import { enum2Items, injectStrict } from "@/utils";
import { defineAsyncComponent, ref } from "vue";
import MilSymbol from "@/components/MilSymbol.vue";
import InputGroupTemplate from "@/components/InputGroupTemplate.vue";
import IconButton from "@/components/IconButton.vue";
import { MagnifyingGlassIcon as SearchIcon } from "@heroicons/vue/24/solid";
import CreateEmtpyDashed from "@/components/CreateEmtpyDashed.vue";
import { canvasSizeItems } from "./orbatchart/sizes";
import AccordionPanel from "@/components/AccordionPanel.vue";
import NumberInputGroup from "@/components/NumberInputGroup.vue";
import { activeScenarioKey } from "@/components/injects";
import SettingsToe from "@/modules/charteditor/SettingsToe.vue";

const props = defineProps({ chartMode: { type: Boolean, default: false } });

const SearchModal = defineAsyncComponent(() => import("@/components/SearchModal.vue"));

const {
  unitActions: { expandUnitWithSymbolOptions, getUnitById },
} = injectStrict(activeScenarioKey);

const options = useChartSettingsStore();
const levelItems = enum2Items(LevelLayouts);
const spacingItems = enum2Items(UnitLevelDistances);
const fontWeightItems = enum2Items(FontWeights);
const fontStyleItems = enum2Items(FontStyles);
const labelPlacementItems = enum2Items(LabelPlacements);
const rootUnitStore = useRootUnitStore();
const showSearch = ref(false);

const onUnitSelect = (unitId: string) => {
  const unit = expandUnitWithSymbolOptions(getUnitById(unitId));
  if (unit) rootUnitStore.unit = unit;
};
</script>
