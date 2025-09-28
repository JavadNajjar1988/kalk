<template>
  <form class="space-y-4" @submit.prevent="fetchScenario">
    <InputGroup v-model="scenarioUrl" label="آدرس" />
    <p class="text-sm">
      لطفاً توجه داشته باشید که میزبان سناریو باید برای اجازه درخواست‌های CORS پیکربندی شده باشد.
    </p>

    <p v-if="isError" class="text-sm text-red-600">
      {{ errorMessage }}
    </p>
    <p v-if="sharableUrl" class="prose prose-sm">
      <a :href="sharableUrl" target="_blank">{{ sharableUrl }}</a>
      <BaseButton class="ml-2" small @click="copy(sharableUrl)"
        >کپی به کلیپ‌بورد
      </BaseButton>
    </p>
    <p class="flex justify-end gap-2 pt-4">
      <BaseButton type="button" small @click="emit('cancel')"
        >انصراف</BaseButton>
      <BaseButton type="button" small @click="createSharableUrl()"
        >ایجاد URL قابل اشتراک
      </BaseButton>
      <BaseButton type="submit" primary small>بارگذاری از URL</BaseButton>
    </p>
  </form>
</template>

<script setup lang="ts">
import { type Scenario } from "@/types/scenarioModels";
import InputGroup from "@/components/InputGroup.vue";
import { computed, ref } from "vue";
import BaseButton from "@/components/BaseButton.vue";
import { isUrl } from "@/utils";
import { useClipboard } from "@vueuse/core";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  url: { type: String, default: "" },
});

const emit = defineEmits(["loaded", "cancel"]);

const scenarioUrl = ref(props.url);
const isError = ref(false);
const errorMessage = ref("");
const isValidUrl = computed(() => isUrl(scenarioUrl.value));
const sharableUrl = ref("");

const { copy } = useClipboard();

async function fetchScenario() {
  const url = scenarioUrl.value;
  if (!isValidUrl.value) {
    isError.value = true;
    errorMessage.value = `آدرس ${url} معتبر نیست.`;
    return;
  }
  try {
    const response = await fetch(url);
    const jsonData = (await response.json()) as Scenario;
    if (jsonData?.type === "ORBAT-mapper") {
      emit("loaded", jsonData);
    } else {
      isError.value = true;
      errorMessage.value = `آدرس ${url} یک فایل سناریوی معتبر نیست.`;
    }
  } catch (e: any) {
    console.error("Failed to load", url);
    isError.value = true;
    errorMessage.value = `بارگذاری ${url} ناموفق بود: ${e?.message}`;
  }
}

function createSharableUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("loadScenarioURL", scenarioUrl.value);
  sharableUrl.value = url.toString();

  navigator.clipboard.writeText(url.toString());
}
</script>
