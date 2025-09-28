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
import { ChevronDownIcon } from "@heroicons/vue/20/solid";
import { useUiStore } from "@/stores/uiStore";
import { LANDING_PAGE_ROUTE } from "@/router/names";

import type { ScenarioActions, UiAction } from "@/types/constants";
import { useRoute } from "vue-router";
import { useMapSettingsStore } from "@/stores/mapSettingsStore";
import { storeToRefs } from "pinia";
import { useMeasurementsStore } from "@/stores/geoStore";
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";
import { injectStrict } from "@/utils";
import { activeScenarioKey } from "@/components/injects";

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
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as="div" class="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-slate-700 dark:to-slate-600 relative rounded-xl px-3 py-2 transition-all duration-200 hover:shadow-lg">
      <button class="group flex items-center">
       
        <span class="ml-2 hidden font-medium tracking-tight text-slate-700 dark:text-slate-200 sm:block">کالک نگار</span>
        <ChevronDownIcon
          class="ml-1 h-5 w-5 text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-slate-100 transition-colors duration-200"
          aria-hidden="true"
        />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="" align="start" :side-offset="10">
      <DropdownMenuItem as-child>
        <router-link :to="{ name: LANDING_PAGE_ROUTE }" class="font-medium"
          >خانه
        </router-link>
      </DropdownMenuItem>

      <DropdownMenuSeparator />
      <DropdownMenuItem @select="emit('uiAction', 'showSearch')"
        >جستجو
        <DropdownMenuShortcut class="ml-4">Ctrl/⌘ K</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>فایل</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem @select="emit('action', 'exportJson')"
            >دانلود سناریو
          </DropdownMenuItem>
          <DropdownMenuItem @select="emit('action', 'save')">
            ذخیره سناریو
          </DropdownMenuItem>
          <DropdownMenuItem @select="emit('action', 'loadNew')">
            بارگذاری سناریو...
          </DropdownMenuItem>
          <DropdownMenuItem @select="emit('action', 'createNew')">
            سناریوی جدید...
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
        <DropdownMenuSubContent>
          <DropdownMenuItem @select="undo()" :disabled="!canUndo">
            بازگردانی
            <DropdownMenuShortcut class="ml-4">Ctrl/⌘ Z</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem @select="redo()" :disabled="!canRedo">
            تکرار
            <DropdownMenuShortcut class="ml-4">Ctrl/⌘ shift Z</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger><span class="mr-4">نمایش</span></DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
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
              ><span class="pr-4">واحدهای اندازه‌گیری</span></DropdownMenuSubTrigger
            >
            <DropdownMenuSubContent>
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
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup v-model="coordinateFormat">
                <DropdownMenuRadioItem value="dms" @select.prevent
                  >درجه، دقیقه، ثانیه
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dd" @select.prevent
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
        <DropdownMenuSubContent>
          <DropdownMenuItem @select="emit('action', 'browseSymbols')"
            >مرور نمادها
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
     
    </DropdownMenuContent>
  </DropdownMenu>
</template>
