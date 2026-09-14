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
        'peer border-border bg-muted data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted focus-visible:border-ring focus-visible:ring-ring/40 inline-flex h-5 w-9 shrink-0 items-center rounded-full border shadow-inner transition-[background-color,border-color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  >
    <SwitchThumb
      data-slot="switch-thumb"
      :class="
        cn(
          'pointer-events-none block size-4 translate-x-0 rounded-full bg-white shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%+2px)]',
        )
      "
    >
      <slot name="thumb" />
    </SwitchThumb>
  </SwitchRoot>
</template>
