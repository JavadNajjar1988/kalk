<script setup lang="ts">
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  IconClockOutline,
  IconZoomInOutline,
  IconZoomOutOutline,
  IconAddCircleOutline as AddEventIcon,
} from "@iconify-prerendered/vue-mdi";
import { useUiStore } from "@/stores/uiStore";

const props = defineProps<{ formattedHoveredDate: string }>();
const emit = defineEmits<{
  action: [value: string];
}>();

const uiSettings = useUiStore();

function onContextMenuUpdate(open: boolean) {}

function onContextMenu(e: MouseEvent) {}
</script>

<template>
  <ContextMenu @update:open="onContextMenuUpdate">
    <ContextMenuTrigger as-child>
      <slot :onContextMenu="onContextMenu" />
    </ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuLabel class="flex items-center">
        <IconClockOutline class="mr-2 size-5" />
        {{ formattedHoveredDate }}
      </ContextMenuLabel>
      <ContextMenuSeparator />
      <ContextMenuItem @select.prevent="emit('action', 'zoomIn')">
        <IconZoomInOutline class="mr-2 size-5" />
        بزرگ‌نمایی
      </ContextMenuItem>
      <ContextMenuItem @select.prevent="emit('action', 'zoomOut')">
        <IconZoomOutOutline class="mr-2 size-5" />
        کوچک‌نمایی
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem @select="emit('action', 'addScenarioEvent')">
        <AddEventIcon class="mr-2 size-5" />
        افزودن رویداد سناریو
      </ContextMenuItem>
      <ContextMenuItem inset @select="uiSettings.showTimeline = false"
        ><span class="ml-1">مخفی کردن خط زمان</span></ContextMenuItem
      >
    </ContextMenuContent>
  </ContextMenu>
</template>
