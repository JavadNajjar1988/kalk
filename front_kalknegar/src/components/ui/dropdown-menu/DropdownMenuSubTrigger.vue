<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
import { reactiveOmit } from "@vueuse/core";
import { ChevronRight } from "lucide-vue-next";
import {
  DropdownMenuSubTrigger,
  type DropdownMenuSubTriggerProps,
  useForwardProps,
} from "reka-ui";

const props = defineProps<
  DropdownMenuSubTriggerProps & { class?: HTMLAttributes["class"]; inset?: boolean }
>();

const delegatedProps = reactiveOmit(props, "class", "inset");
const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <DropdownMenuSubTrigger
    data-slot="dropdown-menu-sub-trigger"
    v-bind="forwardedProps"
    :class="
      cn(
        'focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex w-full justify-end text-right cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pr-8',
        props.class,
      )
    "
  >
    <ChevronRight class="ml-auto rotate-180 size-4" />
    <slot />
  </DropdownMenuSubTrigger>
</template>
