<template>
  <div
    class="relative w-full rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-4 ring-offset-2 focus-within:ring-2 hover:border-gray-500 dark:hover:border-gray-400"
    @dragover.prevent
    @drop.prevent="onDrop"
  >
    <button
      class="flex h-full w-full cursor-pointer flex-col items-center justify-center text-sm font-medium text-gray-900 hover:text-gray-700 dark:text-gray-100 dark:hover:text-gray-200"
      @click="toggleModal()"
    >
      <IconWebPlus class="h-10 w-10 text-gray-500 dark:text-gray-400" />

      <p class="mt-2 text-center text-gray-900 dark:text-gray-100">بارگذاری از URL</p>
    </button>

    <p
      v-if="isError"
      class="absolute bottom-2 left-0 w-full text-center text-base text-red-900"
    >
      لطفاً یک فایل سناریوی معتبر انتخاب کنید.
    </p>
    <NewSimpleModal v-model="showModal" dialog-title="بارگذاری سناریو از URL">
      <LoadScenarioUrlForm
        class="mt-4"
        @loaded="emit('loaded', $event)"
        @cancel="showModal = false"
        :url="initialUrl"
      />
    </NewSimpleModal>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useToggle } from "@vueuse/core";
import { type Scenario } from "@/types/scenarioModels";
import { isUrl } from "@/utils";
import { IconWebPlus } from "@iconify-prerendered/vue-mdi";
import SimpleModal from "@/components/SimpleModal.vue";
import LoadScenarioUrlForm from "@/modules/scenarioeditor/LoadScenarioUrlForm.vue";
import { useRoute } from "vue-router";
import NewSimpleModal from "@/components/NewSimpleModal.vue";

const emit = defineEmits(["update:modelValue", "loaded"]);

const [showModal, toggleModal] = useToggle(false);
const isError = ref(false);
const route = useRoute();

const initialUrl = ref("");

onMounted(() => {
  const loadScenarioURL = (route.query.loadScenarioURL as string) ?? "";
  if (loadScenarioURL) {
    initialUrl.value = loadScenarioURL;
    // Don't automatically open modal - let user choose from main page
    // showModal.value = true;
  }
});

async function fetchScenario(url: string) {
  try {
    const response = await fetch(url);
    const jsonData = (await response.json()) as Scenario;
    if (jsonData?.type === "ORBAT-mapper") {
      emit("loaded", jsonData);
    }
  } catch (e) {
    console.error("Failed to load", url);
  }
}

async function onDrop(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  const possibleURL = e.dataTransfer?.getData("text/uri-list");
  if (possibleURL && isUrl(possibleURL)) {
    //load json from url fetch async
    await fetchScenario(possibleURL);
  }
}
</script>
