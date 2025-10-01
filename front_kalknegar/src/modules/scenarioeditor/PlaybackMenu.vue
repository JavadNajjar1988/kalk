<script setup lang="ts">
import {
  IconChevronDown,
  IconClockEnd,
  IconClockStart,
  IconPause,
  IconPlay,
  IconSpeedometer,
  IconSpeedometerSlow,
} from "@iconify-prerendered/vue-mdi";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePlaybackStore } from "@/stores/playbackStore";
import { injectStrict } from "@/utils";
import { activeScenarioKey } from "@/components/injects";
import { useTimeFormatStore } from "@/stores/timeFormatStore";

const { store } = injectStrict(activeScenarioKey);
const tm = useTimeFormatStore();

const playback = usePlaybackStore();
</script>

<template>
  <div class="sm:flex items-center gap-1">
    <button
      class="inline-flex items-center justify-center rounded-md p-1.5 text-slate-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600 hover:text-slate-800 dark:hover:text-white focus:ring-2 focus:ring-white focus:outline-hidden focus:ring-inset disabled:opacity-50 sm:block"
      title="اجرا / توقف سناریو"
      @click="playback.togglePlayback()"
    >
      <IconPause v-if="playback.playbackRunning" class="block h-6 w-6" />
      <IconPlay v-else class="block h-6 w-6" />
    </button>
    <DropdownMenu>
      <DropdownMenuTrigger
        class="items-center justify-center rounded-md p-1.5 text-slate-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600 hover:text-slate-800 dark:hover:text-white focus:ring-2 focus:ring-white focus:outline-hidden focus:ring-inset disabled:opacity-50 sm:block"
        ><IconChevronDown class="block h-6 w-6"
      /></DropdownMenuTrigger>
      <DropdownMenuContent :side-offset="10">
        <DropdownMenuItem @select.prevent="playback.togglePlayback()">
          <IconPause v-if="playback.playbackRunning" class="mr-2 h-4 w-4" />
          <IconPlay v-else class="mr-2 h-4 w-4" />
          <span>{{ playback.playbackRunning ? "توقف" : "پخش" }}</span>
          <DropdownMenuShortcut>k, alt+p</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem @select.prevent="playback.increaseSpeed()">
          <IconSpeedometer class="mr-2 h-4 w-4" />
          <span>افزایش سرعت</span>
          <DropdownMenuShortcut>&gt;</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem @select.prevent="playback.decreaseSpeed()">
          <IconSpeedometerSlow class="mr-2 h-4 w-4" />
          <span>کاهش سرعت</span>
          <DropdownMenuShortcut>&lt;</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem v-model="playback.playbackLooping" @select.prevent>
          پخش حلقه‌ای
        </DropdownMenuCheckboxItem>

        <DropdownMenuItem
          inset
          @select.prevent="playback.addMarker(store.state.currentTime)"
        >
          افزودن نشانگر
          <span class="ml-1"
            >({{
              playback.startMarker && playback.endMarker
                ? 2
                : playback.startMarker || playback.endMarker
                  ? 1
                  : 0
            }}
            / 2)</span
          >
        </DropdownMenuItem>
        <DropdownMenuItem
          inset
          @select.prevent="playback.clearMarkers()"
          :disabled="!playback.startMarker && !playback.endMarker"
        >
          پاک کردن نشانگرها
        </DropdownMenuItem>
        <DropdownMenuItem v-if="playback.startMarker !== undefined" disabled>
          <IconClockStart class="mr-2 h-4 w-4" />
          <span>{{
            tm.scenarioFormatter.format(playback.startMarker)
          }}</span></DropdownMenuItem
        >
        <DropdownMenuItem v-if="playback.endMarker !== undefined" disabled>
          <IconClockEnd class="mr-2 h-4 w-4" />
          <span>{{
            tm.scenarioFormatter.format(playback.endMarker)
          }}</span></DropdownMenuItem
        >
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
