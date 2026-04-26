<script setup lang="ts">
import { ref } from "vue";
import { Button } from "@/components/ui/button";
import {
  resourceApiService,
  type ResourceMediaDto,
} from "@/services/api/resourceApiService";

interface Props {
  resourceId?: string;
  caption?: string;
  credits?: string;
  creditsUrl?: string;
  buttonLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  buttonLabel: "آپلود تصویر",
});

const emit = defineEmits<{
  (e: "uploaded", media: ResourceMediaDto): void;
  (e: "error", message: string): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const errorMsg = ref<string | null>(null);

function trigger() {
  fileInput.value?.click();
}

async function onFileChange(ev: Event) {
  const input = ev.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  errorMsg.value = null;
  uploading.value = true;
  try {
    const media = await resourceApiService.uploadMedia(file, {
      resourceId: props.resourceId,
      caption: props.caption,
      credits: props.credits,
      creditsUrl: props.creditsUrl,
    });
    emit("uploaded", media);
  } catch (e: any) {
    const msg = e?.message || "خطا در آپلود فایل";
    errorMsg.value = msg;
    emit("error", msg);
  } finally {
    uploading.value = false;
    input.value = "";
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="onFileChange"
    />
    <Button
      type="button"
      size="sm"
      variant="outline"
      :disabled="uploading"
      @click="trigger"
    >
      {{ uploading ? "در حال آپلود…" : props.buttonLabel }}
    </Button>
    <p v-if="errorMsg" class="text-xs text-red-600">{{ errorMsg }}</p>
  </div>
</template>
