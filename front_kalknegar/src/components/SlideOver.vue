<script setup lang="ts">
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type SlideOverProps = {
  title?: string;
  left?: boolean;
  widthClass?: string;
};

withDefaults(defineProps<SlideOverProps>(), {
  widthClass: "sm:max-w-[360px]",
});
const isOpen = defineModel<boolean>();
</script>
<template>
  <Sheet v-model:open="isOpen" :side="left ? 'left' : 'right'">
    <SheetContent
      :side="left ? 'left' : 'right'"
      class="w-full overflow-y-auto pb-6"
      :class="widthClass"
    >
      <SheetHeader class="">
        <SheetTitle>
          <slot name="title">{{ title }}</slot>
        </SheetTitle>
      </SheetHeader>
      <div class="px-4">
        <slot />
      </div>
    </SheetContent>
  </Sheet>
</template>
