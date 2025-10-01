<script setup lang="ts">
import { cn } from "@/lib/utils";
import {
  ContextMenuSubContent,
  ContextMenuPortal,
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
</script>

<template>
  <ContextMenuPortal>
    <ContextMenuSubContent
      data-slot="context-menu-sub-content"
      v-bind="forwarded"
      dir="rtl"
      :class="
        cn(
          'text-right rtl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-[70] min-w-[8rem] origin-(--reka-context-menu-content-transform-origin) overflow-visible rounded-2xl border p-1 shadow-xl backdrop-blur-lg bg-blue-400/10 supports-[backdrop-filter]:bg-blue-400/15 border-blue-400/30 dark:border-blue-500/30',
          props.class,
        )
      "
    >
      <slot />
    </ContextMenuSubContent>
  </ContextMenuPortal>
</template>
