<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { type SideAction, SideActions } from "@/types/constants";
import { computed } from "vue";
import { type MenuItemData } from "@/components/types";
import { EllipsisVertical } from "lucide-vue-next";
import { Button } from "@/components/ui/button";

const props = defineProps<{
  isLocked: boolean;
  isSideLocked: boolean;
  isSideHidden: boolean;
  isSideGroupLocked: boolean;
  isSideGroupHidden: boolean;
}>();

const emit = defineEmits<{
  action: [value: SideAction];
}>();

const sideGroupMenuItems = computed((): MenuItemData<SideAction>[] => [
  {
    label: "افزودن واحد ریشه",
    action: SideActions.AddSubordinate,
    disabled: props.isLocked,
  },
  { label: "ویرایش گروه", action: SideActions.Edit, disabled: props.isLocked },
  { label: "حذف گروه", action: SideActions.Delete, disabled: props.isLocked },
  { label: "انتقال به بالا", action: SideActions.MoveUp, disabled: props.isLocked },
  { label: "انتقال به پایین", action: SideActions.MoveDown, disabled: props.isLocked },
  { label: "تکثیر", action: SideActions.Clone, disabled: props.isLocked },
  {
    label: "تکثیر (با وضعیت)",
    action: SideActions.CloneWithState,
    disabled: props.isLocked,
  },
  props.isSideGroupLocked
    ? { label: "باز کردن قفل گروه", action: SideActions.Unlock, disabled: props.isSideLocked }
    : { label: "قفل کردن گروه", action: SideActions.Lock, disabled: props.isSideLocked },
  props.isSideGroupHidden
    ? { label: "نمایش گروه", action: SideActions.Show, disabled: props.isSideHidden }
    : { label: "مخفی کردن گروه", action: SideActions.Hide, disabled: props.isSideHidden },
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
      <DropdownMenuLabel>اعمال گروه</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        v-for="item in sideGroupMenuItems"
        @select="emit('action', item.action)"
        :key="item.action"
        :disabled="item.disabled"
      >
        <span>{{ item.label }}</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
