<script setup lang="ts">
import { cn } from "@/lib/utils";
import {
  SwitchRoot,
  type SwitchRootEmits,
  type SwitchRootProps,
  SwitchThumb,
  useForwardPropsEmits,
} from "reka-ui";
import { computed, type HTMLAttributes } from "vue";

const props = defineProps<SwitchRootProps & { class?: HTMLAttributes["class"] }>();

const emits = defineEmits<SwitchRootEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <SwitchRoot
    data-slot="switch"
    v-bind="forwarded"
    :class="
      cn(
        'peer data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-blue-100/20 dark:bg-blue-400/5 focus-visible:border-blue-400 focus-visible:ring-blue-400/50 dark:data-[state=unchecked]:bg-blue-400/10 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-blue-300/40 dark:border-blue-400/20 shadow-lg shadow-blue-500/3 transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  >
    <SwitchThumb
      data-slot="switch-thumb"
      :class="
        cn(
          'bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform ltr:data-[state=checked]:translate-x-[calc(100%-2px)] ltr:data-[state=unchecked]:translate-x-0 rtl:data-[state=checked]:-translate-x-[calc(100%-2px)] rtl:data-[state=unchecked]:translate-x-0',
        )
      "
    >
      <slot name="thumb" />
    </SwitchThumb>
  </SwitchRoot>
</template>
