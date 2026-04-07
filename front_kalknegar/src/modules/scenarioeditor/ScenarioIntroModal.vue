<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const props = defineProps<{
  title?: string | null;
  summary?: string | null;
  videoUrl: string;
}>();

const open = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{
  complete: [neverShowAgain: boolean];
}>();

const neverAgain = ref(false);
const videoError = ref(false);
const videoRef = ref<HTMLVideoElement | null>(null);
const playing = ref(false);
const closingViaButton = ref(false);

watch(
  () => open.value,
  (v, prev) => {
    if (v) {
      neverAgain.value = false;
      videoError.value = false;
      playing.value = false;
      return;
    }
    if (prev === true && v === false && !closingViaButton.value) {
      videoRef.value?.pause();
      emit("complete", neverAgain.value);
    }
    if (!v) {
      nextTick(() => {
        closingViaButton.value = false;
      });
    }
  },
);

function bulletLines(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function togglePlay() {
  const el = videoRef.value;
  if (!el) return;
  if (el.paused) {
    void el.play();
    playing.value = true;
  } else {
    el.pause();
    playing.value = false;
  }
}

function onVideoPlay() {
  playing.value = true;
}
function onVideoPause() {
  playing.value = false;
}

function finish() {
  closingViaButton.value = true;
  videoRef.value?.pause();
  emit("complete", neverAgain.value);
  open.value = false;
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogScrollContent
      :class="
        cn(
          'max-h-[90vh] max-w-[calc(100%-1rem)] overflow-y-auto sm:max-w-3xl',
          'border border-border bg-card',
        )
      "
    >
      <DialogHeader>
        <DialogTitle class="text-right text-lg font-semibold">
          {{ title?.trim() || "معرفی سناریو" }}
        </DialogTitle>
        <DialogDescription class="sr-only">
          ویدئو و خلاصهٔ معرفی سناریو قبل از شروع کار با نقشه
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-4 pt-2">
        <div v-if="videoUrl" class="relative overflow-hidden rounded-md bg-black/80">
          <video
            v-show="!videoError"
            ref="videoRef"
            :src="videoUrl"
            class="max-h-[50vh] w-full object-contain"
            playsinline
            preload="metadata"
            @error="videoError = true"
            @play="onVideoPlay"
            @pause="onVideoPause"
          />
          <div
            v-if="videoError"
            class="flex min-h-[120px] items-center justify-center p-4 text-center text-sm text-muted-foreground"
          >
            ویدئو بارگذاری نشد. می‌توانید با متن زیر ادامه دهید.
          </div>
          <div v-if="videoUrl && !videoError" class="flex flex-wrap items-center justify-center gap-2 border-t border-white/10 bg-black/40 p-2">
            <button
              type="button"
              class="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
              @click="togglePlay"
            >
              {{ playing ? "توقف" : "پخش" }}
            </button>
          </div>
        </div>

        <div v-if="bulletLines(summary).length" class="text-right text-sm leading-relaxed text-foreground">
          <p class="mb-2 font-medium text-muted-foreground">خلاصه</p>
          <ul class="list-disc space-y-1 pr-5">
            <li v-for="(line, i) in bulletLines(summary)" :key="i">{{ line }}</li>
          </ul>
        </div>

        <label class="flex cursor-pointer items-center justify-end gap-2 text-sm text-muted-foreground">
          <span>این توضیحات را دیگر نشان نده</span>
          <input v-model="neverAgain" type="checkbox" class="size-4 rounded border-input" />
        </label>

        <div class="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <button
            type="button"
            class="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            @click="finish"
          >
            رد کردن
          </button>
          <button
            type="button"
            class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            @click="finish"
          >
            شروع سناریو
          </button>
        </div>
      </div>
    </DialogScrollContent>
  </Dialog>
</template>
