<script setup lang="ts">
import { cn } from "@/lib/utils";
import {
  DropdownMenuContent,
  type DropdownMenuContentEmits,
  type DropdownMenuContentProps,
  DropdownMenuPortal,
  useForwardPropsEmits,
} from "reka-ui";
import { computed, type HTMLAttributes } from "vue";

const props = withDefaults(
  defineProps<
    DropdownMenuContentProps & {
      class?: HTMLAttributes["class"];
      portal?: boolean;
    }
  >(),
  {
    sideOffset: 12,
    portal: true,
  },
);
const emits = defineEmits<DropdownMenuContentEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);

const ORBAT_MENU_STYLE = {
  "--color-accent": "oklch(0.97 0.001 106.424)",
  "--color-accent-foreground": "oklch(0.216 0.006 56.043)",
  backgroundColor: "oklch(1 0 0)",
  color: "oklch(0.147 0.004 49.25)",
  borderColor: "oklch(0.923 0.003 48.717)",
  opacity: "1",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
} as Record<string, string>;
</script>

<template>
  <template v-if="props.portal">
    <DropdownMenuPortal>
      <DropdownMenuContent
        data-slot="dropdown-menu-content"
        v-bind="forwarded"
        dir="rtl"
        :style="ORBAT_MENU_STYLE"
        :class="
          cn(
            'dropdown-menu-content text-right rtl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--reka-dropdown-menu-content-available-height) min-w-[8rem] origin-(--reka-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md [&_[data-slot=dropdown-menu-item]]:w-full [&_[data-slot=dropdown-menu-item]]:justify-end [&_[data-slot=dropdown-menu-item]]:text-right [&_[data-slot=dropdown-menu-sub-trigger]]:w-full [&_[data-slot=dropdown-menu-sub-trigger]]:justify-end [&_[data-slot=dropdown-menu-sub-trigger]]:text-right [&_a]:w-full [&_a]:justify-end [&_a]:text-right',
            props.class,
          )
        "
      >
        <slot />
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </template>
  <template v-else>
    <DropdownMenuContent
      data-slot="dropdown-menu-content"
      v-bind="forwarded"
      dir="rtl"
      :style="ORBAT_MENU_STYLE"
      :class="
          cn(
            'dropdown-menu-content text-right rtl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--reka-dropdown-menu-content-available-height) min-w-[8rem] origin-(--reka-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md [&_[data-slot=dropdown-menu-item]]:w-full [&_[data-slot=dropdown-menu-item]]:justify-end [&_[data-slot=dropdown-menu-item]]:text-right [&_[data-slot=dropdown-menu-sub-trigger]]:w-full [&_[data-slot=dropdown-menu-sub-trigger]]:justify-end [&_[data-slot=dropdown-menu-sub-trigger]]:text-right [&_a]:w-full [&_a]:justify-end [&_a]:text-right',
            props.class,
          )
      "
    >
      <slot />
    </DropdownMenuContent>
  </template>
</template>
