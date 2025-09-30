<script setup lang="ts">
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type SlideOverProps = {
  title?: string;
  left?: boolean;
};

defineProps<SlideOverProps>();
const isOpen = defineModel<boolean>();
</script>
<template>
  <Sheet v-model:open="isOpen" :side="left ? 'left' : 'right'">
    <SheetContent
      :side="left ? 'left' : 'right'"
      class="overflow-y-auto pb-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-border shadow-xl sm:rounded-l-2xl rtl:sm:rounded-r-2xl rtl:sm:rounded-l-none sm:max-w-[520px] w-full"
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
