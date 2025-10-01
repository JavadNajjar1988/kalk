<script setup lang="ts">
import { type TableColumn } from "@/modules/scenarioeditor/types";

interface Props {
  columns: TableColumn[];
}

const props = defineProps<Props>();
</script>
<template>
  <colgroup>
    <col class="w-10" />
    <col />
    <col />
    <col class="w-1/4" />
  </colgroup>
  <thead class="bg-blue-300/20 dark:bg-blue-400/10 backdrop-blur-sm rounded-t-lg">
    <tr>
      <th scope="col" class="sticky top-0 z-10">
        <div
          class="-m-[1.5px] bg-white dark:bg-gray-900 py-3.5 pr-3 pl-6 text-right text-sm font-semibold text-gray-900"
        >
          &nbsp;
        </div>
      </th>
      <th scope="col" class="sticky top-0 z-10">
        <div
          class="-m-[1.5px] bg-white dark:bg-gray-900 py-3.5 pr-3 pl-6 text-right text-sm font-semibold text-gray-900"
        >
          واحد
        </div>
      </th>

      <th
        v-for="column in columns"
        :key="column.value"
        scope="col"
        class="sticky top-0 z-10"
      >
        <div
          class="-my-[2px] -ml-[2px] bg-white dark:bg-gray-900 py-3.5 pr-3 pl-3 text-right text-sm font-semibold text-gray-900"
        >
          {{ column.label }}
        </div>
      </th>
    </tr>
  </thead>
</template>
