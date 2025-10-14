<template>
  <div class="tsd-segment-rules">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-medium text-gray-900 dark:text-white">قواعد پاره‌خط‌ها</h3>
      <button class="px-2 py-1 text-xs rounded bg-green-600 text-white">افزودن قاعده</button>
    </div>
    <div class="space-y-2">
      <div class="tsd-rule bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-3 text-xs">
        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="block mb-1 text-[11px] text-gray-500 dark:text-gray-400">از نقطه</label>
            <input class="w-full px-2 py-1 border rounded" />
          </div>
          <div>
            <label class="block mb-1 text-[11px] text-gray-500 dark:text-gray-400">به نقطه</label>
            <input class="w-full px-2 py-1 border rounded" />
          </div>
          <div>
            <label class="block mb-1 text-[11px] text-gray-500 dark:text-gray-400">SVG</label>
            <input class="w-full px-2 py-1 border rounded" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// اسکلت اولیه
</script>

<style scoped>
.tsd-segment-rules {}
</style>


