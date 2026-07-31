<template>
  <SlideOver v-model="open" title="تنظیمات" width-class="sm:max-w-[440px]">
    <TabView
      compact
      gap="gap-x-3"
      extra-class="-mx-4 px-4"
      tab-class="!mt-3 pb-2"
    >
      <TabItem label="نمای نقشه">
        <MapSettingsPanel />
      </TabItem>
      <TabItem label="لایه‌های نقشه">
        <LayersPanel />
      </TabItem>
      <TabItem label="آرایش نبرد">
        <div class="space-y-3 py-3">
          <section class="bg-card rounded-md border p-3">
            <h3 class="text-foreground text-sm font-semibold">ظاهر نمادها</h3>
            <div class="mt-3 grid grid-cols-2 gap-3">
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
            </div>
          </section>
          <section class="bg-card rounded-md border p-3">
            <h3 class="text-foreground text-sm font-semibold">برچسب و وضعیت</h3>
            <div class="mt-3 space-y-2">
              <CheckboxField v-model="settings.orbatShortName">
                استفاده از نام‌های کوتاه در آرایش نبرد
              </CheckboxField>
              <CheckboxField v-model="symbolSettings.simpleStatusModifier">
                استفاده از تغییردهنده وضعیت ساده
              </CheckboxField>
            </div>
          </section>
        </div>
      </TabItem>
      <TabItem label="زمان و تاریخ">
        <TimeDateSettingsPanel />
      </TabItem>
      <TabItem label="تنظیمات چارت">
        <OrbatChartSettings class="py-4" chart-mode />
      </TabItem>
    </TabView>
  </SlideOver>
</template>

<script setup lang="ts">
import LayersPanel from "./LayersPanel.vue";
import { useVModel } from "@vueuse/core";
import SlideOver from "./SlideOver.vue";
import TabView from "./TabView.vue";
import TabItem from "./TabItem.vue";
import { useSettingsStore, useSymbolSettingsStore } from "@/stores/settingsStore";
import NumberInputGroup from "./NumberInputGroup.vue";
import MapSettingsPanel from "@/components/MapSettingsPanel.vue";
import CheckboxField from "@/components/CheckboxField.vue";
import TimeDateSettingsPanel from "@/components/TimeDateSettingsPanel.vue";
import OrbatChartSettings from "@/modules/charteditor/OrbatChartSettings.vue";

const props = defineProps({ modelValue: Boolean });

const open = useVModel(props, "modelValue");
const settings = useSettingsStore();
const symbolSettings = useSymbolSettingsStore();
</script>
