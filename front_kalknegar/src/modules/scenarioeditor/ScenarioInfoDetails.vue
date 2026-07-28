<template>
  <div>
    <form v-if="isEditMode" @submit.prevent="onFormSubmit" class="space-y-4">
      <SimpleMarkdownInput
        label="توضیحات"
        v-model="form.description"
        description="از نحو مارک‌داون برای قالب‌بندی استفاده کنید"
      />
      <DescriptionItem label="زمان شروع"
        >{{ computedStartTime }}
        <PlainButton @click="openTimeModal()" class="ml-2">تغییر</PlainButton>
      </DescriptionItem>
      <div class="flex justify-end space-x-2">
        <PrimaryButton type="submit">به‌روزرسانی</PrimaryButton>
        <PlainButton type="button" @click="toggleEditMode()">لغو</PlainButton>
      </div>
    </form>
    <div v-else class="space-y-4 p-0">
      <DescriptionItem label="توضیحات">
        <div
          class="prose prose-sm text-foreground dark:prose-invert max-w-none text-right [&_*]:text-inherit [&_li]:text-right [&_p]:text-right"
          v-html="hDescription"
        ></div>
      </DescriptionItem>

      <DescriptionItem label="زمان شروع">{{ computedStartTime }}</DescriptionItem>

      <DescriptionItem label="تعداد واحدها"
        >{{ Object.keys(state.unitMap).length }}
      </DescriptionItem>

      <div class="flex items-center space-x-2">
        <PlainButton @click="toggleEditMode()">ویرایش</PlainButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from "vue";
import DescriptionItem from "@/components/DescriptionItem.vue";
import PrimaryButton from "@/components/PrimaryButton.vue";
import { renderMarkdown } from "@/composables/formatting";
import { useToggle } from "@vueuse/core";
import PlainButton from "@/components/PlainButton.vue";
import { type ScenarioInfo } from "@/types/scenarioModels";
import { injectStrict } from "@/utils";
import { activeScenarioKey, timeModalKey } from "@/components/injects";
import { useNotifications } from "@/composables/notifications";
import { jalaliDateTimeFormatter } from "@/utils/jalaliFormatters";

const { send } = useNotifications();

const { store, io } = injectStrict(activeScenarioKey);
const { getModalTimestamp } = injectStrict(timeModalKey);

const SimpleMarkdownInput = defineAsyncComponent(
  () => import("@/components/SimpleMarkdownInput.vue"),
);

const { state } = store;

const isEditMode = ref(false);
const toggleEditMode = useToggle(isEditMode);

const hDescription = computed(() => renderMarkdown(state.info.description || ""));

let form = ref<ScenarioInfo>({
  name: "",
  description: "",
  startTime: 0,
  timeZone: "UTC",
  symbologyStandard: "2525",
});

watch(
  isEditMode,
  (v) => {
    const { name, description, startTime, timeZone, symbologyStandard } =
      store.state.info;
    form.value = {
      name,
      description,
      startTime,
      timeZone,
      symbologyStandard,
    };
  },
  { immediate: true },
);

const computedStartTime = computed(() =>
  jalaliDateTimeFormatter(Number(form.value.startTime)),
);

function onDownload() {
  io.downloadAsJson();
}

function onSave() {
  io.saveToIndexedDb();
  send({ message: "سناریو در IndexedDB ذخیره شد" });
}

function onLoad() {
  io.loadFromLocalStorage();
  send({ message: "سناریو از حافظه محلی بارگذاری شد" });
}

function onFormSubmit() {
  updateScenarioInfo(form.value);
  isEditMode.value = false;
}

function updateScenarioInfo(data: Partial<ScenarioInfo>) {
  store.update((s) => {
    Object.assign(s.info, { ...data });
  });
}

async function openTimeModal() {
  const newTime = await getModalTimestamp(form.value.startTime!, {
    timeZone: form.value.timeZone,
    title: "تنظیم زمان شروع سناریو",
  });
  if (newTime !== undefined) {
    form.value.startTime = newTime;
  }
}
</script>
