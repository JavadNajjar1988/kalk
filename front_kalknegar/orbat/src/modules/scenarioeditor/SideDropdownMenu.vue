<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical } from "lucide-vue-next";
import { Button } from "@/components/ui/button";

import { type SideAction, SideActions } from "@/types/constants";
import { computed } from "vue";
import { type MenuItemData } from "@/components/types";

const props = defineProps<{
  isLocked: boolean;
  isHidden?: boolean;
}>();

const emit = defineEmits<{
  action: [value: SideAction];
}>();

const sideMenuItems = computed((): MenuItemData<SideAction>[] => [
  { label: "ویرایش", action: SideActions.Edit, disabled: props.isLocked },
  { label: "افزودن گروه", action: SideActions.AddGroup, disabled: props.isLocked },
  { label: "حذف طرف", action: SideActions.Delete, disabled: props.isLocked },
  { label: "انتقال به بالا", action: SideActions.MoveUp, disabled: props.isLocked },
  { label: "انتقال به پایین", action: SideActions.MoveDown, disabled: props.isLocked },
  { label: "افزودن طرف", action: SideActions.Add, disabled: props.isLocked },
  { label: "تکثیر", action: SideActions.Clone, disabled: props.isLocked },
  {
    label: "تکثیر (با وضعیت)",
    action: SideActions.CloneWithState,
    disabled: props.isLocked,
  },
  props.isLocked
    ? { label: "باز کردن قفل طرف", action: SideActions.Unlock }
    : { label: "قفل کردن طرف", action: SideActions.Lock },
  props.isHidden
    ? { label: "نمایش طرف", action: SideActions.Show }
    : { label: "مخفی کردن طرف", action: SideActions.Hide },
]);
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as="child" class="mr-2">
      <Button variant="ghost" size="icon" class="text-muted-foreground">
        <EllipsisVertical />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="min-w-52" align="end">
      <DropdownMenuLabel>اعمال طرف</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        v-for="item in sideMenuItems"
        @select="emit('action', item.action)"
        :key="item.action"
        :disabled="item.disabled"
      >
        <span>{{ item.label }}</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
