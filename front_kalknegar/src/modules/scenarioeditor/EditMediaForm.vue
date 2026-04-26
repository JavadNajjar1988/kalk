<script lang="ts" setup>
import { type Media } from "@/types/scenarioModels";
import InputGroup from "@/components/InputGroup.vue";
import { computed, ref, watch } from "vue";
import { klona } from "klona";
import { Button } from "@/components/ui/button";
import ResourceMediaUploader from "./ResourceMediaUploader.vue";
import {
  resourceApiService,
  type ResourceMediaDto,
} from "@/services/api/resourceApiService";

const props = defineProps<{ media?: Media | null }>();
const emit = defineEmits(["cancel", "update"]);

const form = ref<Media>({
  mediaId: undefined,
  resourceId: undefined,
  url: "",
  caption: "",
  credits: "",
  creditsUrl: "",
});

watch(
  () => props.media,
  (media) => {
    form.value = {
      mediaId: media?.mediaId,
      resourceId: media?.resourceId,
      url: media?.url ?? "",
      caption: media?.caption ?? "",
      credits: media?.credits ?? "",
      creditsUrl: media?.creditsUrl ?? "",
    };
  },
  { immediate: true },
);

const previewUrl = computed(() => {
  if (form.value.mediaId) {
    return resourceApiService.buildMediaUrl(form.value.mediaId);
  }
  return form.value.url || "";
});

function onUploaded(media: ResourceMediaDto) {
  form.value.mediaId = media.id;
  if (media.caption && !form.value.caption) form.value.caption = media.caption;
  if (media.credits && !form.value.credits) form.value.credits = media.credits;
  if (media.credits_url && !form.value.creditsUrl)
    form.value.creditsUrl = media.credits_url;
  // پاک‌کردن URL خام؛ سناریو از این پس به resource ارجاع می‌دهد
  form.value.url = "";
}

function clearMediaRef() {
  form.value.mediaId = undefined;
}

const onFormSubmit = () => {
  emit("update", klona(form.value));
};
</script>
<template>
  <form @submit.prevent="onFormSubmit" class="mt-0 mb-6 space-y-4">
    <div v-if="previewUrl" class="overflow-hidden rounded-md border">
      <img :src="previewUrl" alt="preview" class="max-h-40 w-full object-cover" />
    </div>

    <div class="flex flex-col gap-2">
      <ResourceMediaUploader
        :resource-id="form.resourceId"
        :caption="form.caption"
        :credits="form.credits"
        :credits-url="form.creditsUrl"
        :button-label="form.mediaId ? 'جایگزینی تصویر از منابع' : 'آپلود به مدیریت منابع'"
        @uploaded="onUploaded"
      />
      <p v-if="form.mediaId" class="text-muted-foreground flex items-center gap-2 text-xs">
        <span>متصل به منبع: <code>{{ form.mediaId }}</code></span>
        <button type="button" class="text-red-600 hover:underline" @click="clearMediaRef">
          حذف ارجاع
        </button>
      </p>
    </div>

    <details class="text-xs">
      <summary class="text-muted-foreground cursor-pointer select-none">
        گزینه‌های پیشرفته (سازگاری با سناریوهای قدیمی)
      </summary>
      <div class="mt-2 space-y-3">
        <InputGroup
          label="آدرس مستقیم تصویر"
          description="فقط برای سازگاری با سناریوهای قبلی استفاده کنید"
          v-model="form.url"
        />
      </div>
    </details>

    <InputGroup label="عنوان" v-model="form.caption" />
    <InputGroup label="اعتبار" v-model="form.credits" />
    <InputGroup label="آدرس اعتبار" v-model="form.creditsUrl" />

    <div class="flex items-center justify-end space-x-2">
      <Button type="submit" size="sm">ذخیره</Button>
      <Button variant="outline" size="sm" @click="emit('cancel')">لغو</Button>
    </div>
  </form>
</template>
