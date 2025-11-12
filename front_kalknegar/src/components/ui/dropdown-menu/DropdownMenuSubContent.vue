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
</script>

<template>
  <DropdownMenuPortal>
    <DropdownMenuSubContent
      data-slot="dropdown-menu-sub-content"
      v-bind="forwarded"
      dir="rtl"
      :class="
        cn(
          'dropdown-menu-sub-content text-right rtl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-[70] min-w-[8rem] origin-(--reka-dropdown-menu-content-transform-origin) overflow-visible rounded-md border p-1 shadow-lg [&_[data-slot=dropdown-menu-item]]:w-full [&_[data-slot=dropdown-menu-item]]:justify-end [&_[data-slot=dropdown-menu-item]]:text-right [&_[data-slot=dropdown-menu-sub-trigger]]:w-full [&_[data-slot=dropdown-menu-sub-trigger]]:justify-end [&_[data-slot=dropdown-menu-sub-trigger]]:text-right backdrop-blur-md backdrop-saturate-150 rtl:mr-3',
          props.class,
        )
      "
    >
      <slot />
    </DropdownMenuSubContent>
  </DropdownMenuPortal>
</template>
<style scoped>
.dropdown-menu-sub-content {
  background-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 35%, transparent);
}

:global(.dark) .dropdown-menu-sub-content {
  background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

@supports (backdrop-filter: blur(1px)) {
  .dropdown-menu-sub-content {
    background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
  }
  
  :global(.dark) .dropdown-menu-sub-content {
    background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
  }
}
</style>
