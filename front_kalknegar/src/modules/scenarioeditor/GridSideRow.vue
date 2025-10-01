<script setup lang="ts">
import { ChevronRightIcon } from "@heroicons/vue/20/solid";

import type { TableColumn } from "@/modules/scenarioeditor/types";
import type { NSide } from "@/types/internalModels";
import GridEditableCell from "@/modules/scenarioeditor/GridEditableCell.vue";

interface Props {
  side: NSide;
  columns: TableColumn[];
  sideOpen: Map<NSide, boolean>;
  itemIndex: number;
  isActive: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(["toggle", "expand", "updateSide", "nextCell", "activeItem"]);
</script>
<template>
  <tr class="divide-x divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
    <td class="relative">
      <div v-if="isActive" class="absolute inset-y-0 right-0 w-0.5 bg-blue-500 dark:bg-blue-400"></div>
    </td>
    <td>
      <div
        :id="`cell-${itemIndex}-0`"
        @click="emit('toggle', side)"
        @keydown.enter.exact="emit('toggle', side)"
        tabindex="0"
        class="flex h-12 items-center px-4 py-2 pr-3 text-right font-bold font-medium whitespace-nowrap text-gray-900 hover:cursor-pointer sm:px-0"
      >
        <button @click.stop="emit('toggle', side)" class="ml-0">
          <ChevronRightIcon
            class="h-6 w-6 transform text-gray-600 dark:text-gray-400 transition-transform group-hover:text-gray-700 dark:group-hover:text-gray-300"
            :class="{
              'rotate-90': sideOpen.get(side) ?? true,
            }"
          />
        </button>

        <button class="ml-2 hover:underline">{{ side.name }}</button>
      </div>
    </td>
    <td class="">
      <GridEditableCell
        :value="side.name"
        :col-index="1"
        :row-index="itemIndex"
        @update="emit('updateSide', side.id, { name: $event })"
        @next-cell="emit('nextCell', $event)"
        @active="emit('activeItem', 'name')"
      />
    </td>
    <td :colspan="columns.length - 1"></td>
  </tr>
</template>
