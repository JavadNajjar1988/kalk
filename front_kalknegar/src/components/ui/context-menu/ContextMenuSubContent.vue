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
          'context-menu-sub-content text-right rtl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-[70] min-w-[8rem] origin-(--reka-context-menu-content-transform-origin) overflow-visible rounded-2xl border p-1 shadow-xl backdrop-blur-lg',
          props.class,
        )
      "
    >
      <slot />
    </ContextMenuSubContent>
  </ContextMenuPortal>
</template>
<style scoped>
.context-menu-sub-content {
  background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
}

:global(.dark) .context-menu-sub-content {
  background-color: color-mix(in srgb, var(--color-primary) 5%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

@supports (backdrop-filter: blur(1px)) {
  .context-menu-sub-content {
    background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
  }
  
  :global(.dark) .context-menu-sub-content {
    background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
  }
}
</style>
