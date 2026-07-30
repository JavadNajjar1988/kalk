<template>
  <SlideOver v-model="open" title="تنظیمات" width-class="sm:max-w-[460px]">
    <p class="text-muted-foreground mb-2 text-sm leading-6">
      ظاهر نقشه، لایه‌ها و شیوه نمایش زمان را از اینجا تنظیم کنید.
    </p>
    <TabView gap="gap-x-4">
      <TabItem label="نمای نقشه">
        <MapSettingsPanel />
      </TabItem>
      <TabItem label="لایه‌های نقشه">
        <LayersPanel />
      </TabItem>
      <TabItem label="آرایش نبرد">
        <div class="space-y-4 py-4">
          <section class="bg-card rounded-xl border p-4 shadow-sm">
            <h3 class="text-foreground text-sm font-semibold">ظاهر نمادها</h3>
            <p class="text-muted-foreground mt-1 text-xs leading-5">
              اندازه نمادها را جداگانه برای نقشه و درخت آرایش نبرد تعیین کنید.
            </p>
            <div class="mt-4 space-y-4">
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
          <section class="bg-card rounded-xl border p-4 shadow-sm">
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
      <TabItem label="تنظیمات سناریو">
        <ScenarioSettingsPanel class="py-4" />
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
import ScenarioSettingsPanel from "@/modules/scenarioeditor/ScenarioSettingsPanel.vue";
import OrbatChartSettings from "@/modules/charteditor/OrbatChartSettings.vue";

const props = defineProps({ modelValue: Boolean });

const open = useVModel(props, "modelValue");
const settings = useSettingsStore();
const symbolSettings = useSymbolSettingsStore();
</script>
