<template>
  <FloatingPanel class="pointer-events-auto flex items-center space-x-1 rounded-md p-1">
    <p class="text-muted-foreground hidden px-2 text-sm font-medium sm:block">قلم‌مو نماد</p>
    <div class="border-border mr-2 h-5 border-l" />
    <MainToolbarButton
      title="قلم‌مو"
      :active="Boolean(eraseMode)"
      @click="toggleBrush()"
    >
      <EraserIcon class="size-5" />
    </MainToolbarButton>
    <div
      v-if="eraseMode"
      class="bg-muted/70 border-border flex items-center rounded-md border p-0.5"
    >
      <button
        type="button"
        class="rounded px-2 py-1 text-xs font-medium transition-colors"
        :class="eraseMode === 'fade' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
        title="محو"
        @click="setBrushMode('fade')"
      >
        محو
      </button>
      <button
        type="button"
        class="rounded px-2 py-1 text-xs font-medium transition-colors"
        :class="eraseMode === 'cut' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
        title="حذف"
        @click="setBrushMode('cut')"
      >
        حذف
      </button>
    </div>
    <label
      v-if="eraseMode"
      class="text-muted-foreground flex items-center gap-2 px-1 text-xs"
      title="اندازه قلم‌مو"
    >
      <span class="hidden sm:inline">اندازه</span>
      <input
        v-model.number="brushSize"
        class="accent-primary h-5 w-20"
        type="range"
        min="1"
        max="5"
        step="1"
        @input="sendBrushSize()"
      />
    </label>
    <MainToolbarButton
      v-if="eraseMode"
      title="لغو (Esc)"
      @click="cancelErase()"
    >
      <CloseIcon class="size-5" />
    </MainToolbarButton>
    <div class="border-border mx-1 h-5 border-l" />
    <MainToolbarButton title="بستن نوار ابزار" @click="closeToolbar()">
      <CloseIcon class="size-5" />
    </MainToolbarButton>
  </FloatingPanel>
</template>

<script setup lang="ts">
import {
  PhEraser as EraserIcon,
  PhX as CloseIcon,
} from "@phosphor-icons/vue";
import FloatingPanel from "@/components/FloatingPanel.vue";
import MainToolbarButton from "@/components/MainToolbarButton.vue";
import { useMainToolbarStore } from "@/stores/mainToolbarStore";
import { useServicesStore } from "@/modules/tactical-symbol-map/stores/services.js";
import { onUnmounted, ref, watch } from "vue";
import { onKeyStroke } from "@vueuse/core";

const store = useMainToolbarStore();
const servicesStore = useServicesStore();

const eraseMode = ref<"fade" | "cut" | null>(null);
const brushSize = ref(3);

type TacticalEmitter = {
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler: (...args: any[]) => void) => void;
  emit: (event: string, payload?: unknown) => void;
};

let emitterRef: TacticalEmitter | null = null;

const onEraseActive = ({ mode, brushSize: nextBrushSize }: { mode: "fade" | "cut"; brushSize?: number }) => {
  eraseMode.value = mode;
  if (typeof nextBrushSize === "number") brushSize.value = nextBrushSize;
};

const onEraseInactive = () => {
  eraseMode.value = null;
};

const bindEmitter = () => {
  const services = servicesStore.getServices();
  const nextEmitter = services?.emitter as TacticalEmitter | null;
  if (!nextEmitter) return false;

  if (emitterRef !== nextEmitter) {
    if (emitterRef) {
      emitterRef.off("ui/erase/active", onEraseActive);
      emitterRef.off("ui/erase/inactive", onEraseInactive);
    }
    emitterRef = nextEmitter;
    nextEmitter.on("ui/erase/active", onEraseActive);
    nextEmitter.on("ui/erase/inactive", onEraseInactive);
  }

  return true;
};

watch(() => servicesStore.getServices().emitter, () => bindEmitter(), { immediate: true });

onUnmounted(() => {
  emitterRef?.off("ui/erase/active", onEraseActive);
  emitterRef?.off("ui/erase/inactive", onEraseInactive);
});

function startFade() {
  if (!bindEmitter() || !emitterRef) return;
  emitterRef.emit("ERASE_FADE_START", { brushSize: brushSize.value });
}

function startCut() {
  if (!bindEmitter() || !emitterRef) return;
  emitterRef.emit("ERASE_CUT_START", { brushSize: brushSize.value });
}

function toggleBrush() {
  if (eraseMode.value) {
    cancelErase();
    return;
  }
  startFade();
}

function setBrushMode(mode: "fade" | "cut") {
  if (mode === "fade") startFade();
  else startCut();
}

function sendBrushSize() {
  if (!eraseMode.value || !bindEmitter() || !emitterRef) return;
  emitterRef.emit("command/erase/brush-size", { brushSize: brushSize.value });
}

function cancelErase() {
  if (!bindEmitter() || !emitterRef) return;
  emitterRef.emit("command/erase/cancel");
}

function closeToolbar() {
  cancelErase();
  store.clearToolbar();
}

onKeyStroke("Escape", () => {
  if (eraseMode.value) cancelErase();
});
</script>
