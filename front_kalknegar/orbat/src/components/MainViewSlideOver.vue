<template>
  <SlideOver v-model="open" title="تنظیمات">
    <TabView gap="gap-x-2">
      <TabItem label="نمای نقشه">
        <MapSettingsPanel />
      </TabItem>
      <TabItem label="لایه‌های نقشه">
        <LayersPanel />
      </TabItem>
      <TabItem label="آرایش نبرد">
        <div class="space-y-4 p-1">
          <NumberInputGroup
            InputGroup
            label="اندازه نماد نقشه"
            v-model="settings.mapIconSize"
          />
          <NumberInputGroup
            InputGroup
            label="اندازه نماد آرایش نبرد"
            v-model="settings.orbatIconSize"
          />
          <ToggleField v-model="settings.orbatShortName"
            >استفاده از نام‌های کوتاه در آرایش نبرد
          </ToggleField>
          <ToggleField v-model="symbolSettings.simpleStatusModifier"
            >استفاده از تغییردهنده وضعیت ساده
          </ToggleField>
          <ToggleField v-model="uiSettings.debugMode">حالت اشکال‌یابی</ToggleField>
          <ToggleField v-if="uiSettings.debugMode" v-model="isDarkMode"
            >حالت تاریک
          </ToggleField>
        </div>
      </TabItem>
      <TabItem label="زمان و تاریخ">
        <TimeDateSettingsPanel />
      </TabItem>
    </TabView>
  </SlideOver>
</template>

<script setup lang="ts">
import LayersPanel from "./LayersPanel.vue";
import { useDark, useVModel } from "@vueuse/core";
import SlideOver from "./SlideOver.vue";
import TabView from "./TabView.vue";
import TabItem from "./TabItem.vue";
import { useSettingsStore, useSymbolSettingsStore } from "@/stores/settingsStore";
import NumberInputGroup from "./NumberInputGroup.vue";
import MapSettingsPanel from "@/components/MapSettingsPanel.vue";
import ToggleField from "@/components/ToggleField.vue";
import { useUiStore } from "@/stores/uiStore";
import TimeDateSettingsPanel from "@/components/TimeDateSettingsPanel.vue";

const props = defineProps({ modelValue: Boolean });

const open = useVModel(props, "modelValue");
const settings = useSettingsStore();
const symbolSettings = useSymbolSettingsStore();
const uiSettings = useUiStore();
const isDarkMode = useDark({ initialValue: "light" });
</script>
