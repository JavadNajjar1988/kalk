<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUiStore } from "@/stores/uiStore";

import type { ScenarioActions, UiAction } from "@/types/constants";
import { useRoute } from "vue-router";
import { useMapSettingsStore } from "@/stores/mapSettingsStore";
import { storeToRefs } from "pinia";
import { useMeasurementsStore } from "@/stores/geoStore";
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";
import { injectStrict } from "@/utils";
import { activeScenarioKey } from "@/components/injects";
import { Bars3Icon } from "@heroicons/vue/24/outline";

const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smallerOrEqual("md");

const emit = defineEmits<{
  action: [value: ScenarioActions];
  uiAction: [value: UiAction];
}>();

const {
  store: { undo, redo, canRedo, canUndo },
} = injectStrict(activeScenarioKey);

const route = useRoute();
const uiSettings = useUiStore();

const { coordinateFormat, showLocation, showScaleLine, showDayNightTerminator } =
  storeToRefs(useMapSettingsStore());

const { measurementUnit } = storeToRefs(useMeasurementsStore());

// Function to redirect to dashboard
const goToDashboard = () => {
  const parentOrigin = window.parent !== window 
    ? (document.referrer ? new URL(document.referrer).origin : window.location.origin)
    : window.location.origin;
  window.location.href = parentOrigin;
};
</script>

<template>
  <div class="flex items-center">
    <DropdownMenu>
      <DropdownMenuTrigger as="button" dir="rtl" class="header-icon-button hamburger-button relative inline-flex items-center justify-center rounded-md p-1.5">
        <Bars3Icon class="h-5 w-5 transition-all duration-300" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        class="header-menu-content text-right rtl:mr-2"
        align="end"
        :side-offset="12"
        dir="rtl"
      >
      <DropdownMenuItem @select="goToDashboard" class="font-medium flex w-full justify-end text-right">
        بازگشت به داشبورد
      </DropdownMenuItem>

      <DropdownMenuSeparator />
      <DropdownMenuItem @select="emit('uiAction', 'showSearch')"
        >جستجو
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>فایل</DropdownMenuSubTrigger>
        <DropdownMenuSubContent side="left" align="start">
          <DropdownMenuItem @select="emit('action', 'exportJson')"
            >دانلود سناریو
          </DropdownMenuItem>
          <DropdownMenuItem @select="emit('action', 'save')">
            ذخیره سناریو
          </DropdownMenuItem>
          <DropdownMenuItem @select="emit('action', 'loadNew')">
            بارگذاری سناریو...
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem @select="emit('action', 'export')">
            صادرات داده‌های سناریو...
          </DropdownMenuItem>
          <DropdownMenuItem @select="emit('action', 'exportToImage')">
            صادرات به عنوان تصویر
          </DropdownMenuItem>
          <DropdownMenuItem @select="emit('action', 'import')">
            وارد کردن داده...
          </DropdownMenuItem>
          <DropdownMenuItem @select="emit('action', 'exportToClipboard')">
            کپی سناریو به کلیپ‌بورد
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem @select="emit('action', 'duplicate')">
            تکثیر سناریو
          </DropdownMenuItem>
          <DropdownMenuItem @select="emit('action', 'showInfo')">
            نمایش اطلاعات سناریو
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger><span>ویرایش</span></DropdownMenuSubTrigger>
        <DropdownMenuSubContent side="left" align="start">
          <DropdownMenuItem @select="undo()" :disabled="!canUndo">
            بازگردانی
            <DropdownMenuShortcut class="mr-4">Ctrl/⌘ Z</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem @select="redo()" :disabled="!canRedo">
            تکرار
            <DropdownMenuShortcut class="mr-4">Ctrl/⌘ shift Z</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger><span>نمایش</span></DropdownMenuSubTrigger>
        <DropdownMenuSubContent side="left" align="start">
          <DropdownMenuCheckboxItem v-model="uiSettings.showToolbar" @select.prevent
            >نوار ابزار نقشه
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem v-model="uiSettings.showTimeline" @select.prevent
            >خط زمان
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            v-if="!isMobile"
            v-model="uiSettings.showLeftPanel"
            @select.prevent
            >پنل آرایش نبرد
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            v-model="uiSettings.showOrbatBreadcrumbs"
            @select.prevent
            >مسیر واحد</DropdownMenuCheckboxItem
          >
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem v-model="showScaleLine" @select.prevent>
            خط مقیاس
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem v-model="showLocation" @select.prevent>
            موقعیت نشانگر
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem v-model="showDayNightTerminator" @select.prevent>
            خط روز/شب
          </DropdownMenuCheckboxItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger inset
              ><span class="pr0">واحدهای اندازه‌گیری</span></DropdownMenuSubTrigger
            >
            <DropdownMenuSubContent side="left" align="start" :side-offset="-300">
              <DropdownMenuRadioGroup v-model="measurementUnit">
                <DropdownMenuRadioItem value="metric" @select.prevent
                  >متریک
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="imperial" @select.prevent
                  >امپریال
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="nautical" @select.prevent
                  >دریایی
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger inset>فرمت مختصات</DropdownMenuSubTrigger>
            <DropdownMenuSubContent side="left" align="start">
              <DropdownMenuRadioGroup v-model="coordinateFormat">
                <DropdownMenuRadioItem value="DegreeMinuteSeconds" @select.prevent
                  >درجه، دقیقه، ثانیه
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="DecimalDegrees" @select.prevent
                  >درجه اعشاری
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="MGRS" @select.prevent
                  >MGRS
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSeparator />
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>ابزارها</DropdownMenuSubTrigger>
        <DropdownMenuSubContent side="left" align="start">
          <DropdownMenuItem @select="emit('action', 'browseSymbols')"
            >مرور نمادها
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
     
      </DropdownMenuContent>
    </DropdownMenu>
    <span class="mr-2 hidden text-sm font-semibold tracking-tight text-foreground sm:block">کالک نگار</span>
  </div>
</template>
<style scoped>
.header-menu-content {
  min-width: 14rem;
}
</style>
