<script lang="ts" setup>
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVerticalIcon } from "@heroicons/vue/20/solid";
import { type Table } from "@tanstack/vue-table";
import { computed } from "vue";

const props = defineProps<{ table: Table<any> }>();
const cols = computed(() => props.table.getAllLeafColumns());
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <div class="z-10">
        <button
          type="button"
          class="rounded-full p-2 text-gray-500 hover:text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100 focus:outline-hidden dark:hover:text-gray-400"
        >
          <span class="sr-only">باز کردن گزینه‌ها</span>
          <EllipsisVerticalIcon class="size-5" aria-hidden="true" />
        </button>
      </div>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="text-right" align="end" dir="rtl">
      <DropdownMenuLabel>منوی جدول</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>ستون‌ها</DropdownMenuSubTrigger>
        <DropdownMenuSubContent class="text-right" dir="rtl">
          <template
            v-for="col in cols.filter((c) => typeof c.columnDef.header === 'string')"
          >
            <DropdownMenuCheckboxItem
              :modelValue="col.getIsVisible()"
              @update:modelValue="col.toggleVisibility($event)"
              @select.prevent
              :disabled="!col.getCanHide()"
            >
              {{ col.columnDef.header }}
            </DropdownMenuCheckboxItem>
          </template>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuItem @select="table.resetColumnSizing()"
        >بازنشانی عرض ستون‌ها</DropdownMenuItem
      >
    </DropdownMenuContent>
  </DropdownMenu>
</template>
