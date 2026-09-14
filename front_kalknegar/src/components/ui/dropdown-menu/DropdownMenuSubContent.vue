<script setup lang="ts">
import { cn } from "@/lib/utils";
import {
  DropdownMenuSubContent,
  DropdownMenuPortal,
  type DropdownMenuSubContentEmits,
  type DropdownMenuSubContentProps,
  useForwardPropsEmits,
} from "reka-ui";
import { computed, type HTMLAttributes } from "vue";

const props = defineProps<
  DropdownMenuSubContentProps & { class?: HTMLAttributes["class"] }
>();
const emits = defineEmits<DropdownMenuSubContentEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
defineOptions({ inheritAttrs: false });

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
  <DropdownMenuPortal>
    <DropdownMenuSubContent
      data-slot="dropdown-menu-sub-content"
      v-bind="forwarded"
      dir="rtl"
      :style="ORBAT_MENU_STYLE"
      :class="
        cn(
          'dropdown-menu-sub-content text-right rtl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-[90] min-w-[8rem] origin-(--reka-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg [&_[data-slot=dropdown-menu-item]]:w-full [&_[data-slot=dropdown-menu-item]]:justify-end [&_[data-slot=dropdown-menu-item]]:text-right [&_[data-slot=dropdown-menu-sub-trigger]]:w-full [&_[data-slot=dropdown-menu-sub-trigger]]:justify-end [&_[data-slot=dropdown-menu-sub-trigger]]:text-right rtl:mr-3',
          props.class,
        )
      "
  >
    <slot />
  </DropdownMenuSubContent>
</DropdownMenuPortal>
</template>
