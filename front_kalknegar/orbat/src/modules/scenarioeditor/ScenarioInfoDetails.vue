<template>
  <div>
    <form v-if="isEditMode" @submit.prevent="onFormSubmit" class="space-y-4">
      <SimpleMarkdownInput
        label="توضیحات"
        v-model="form.description"
        description="از نحو مارک‌داون برای قالب‌بندی استفاده کنید"
      />
      <DescriptionItem label="زمان شروع"
        >{{ computedStartTime.format() }}
        <PlainButton @click="openTimeModal()" class="ml-2">تغییر</PlainButton>
      </DescriptionItem>
      <TimezoneSelect label="منطقه زمانی" v-model="form.timeZone" />
      <RadioGroupList :items="standardSettings" v-model="form.symbologyStandard" />
      <div class="flex justify-end space-x-2">
        <PrimaryButton type="submit">به‌روزرسانی</PrimaryButton>
        <PlainButton type="button" @click="toggleEditMode()">لغو</PlainButton>
      </div>
    </form>
    <div v-else class="space-y-4 p-0">
      <DescriptionItem label="توضیحات">
        <div class="prose-sm prose dark:prose-invert" v-html="hDescription"></div>
      </DescriptionItem>

      <DescriptionItem label="زمان شروع"
        >{{ computedStartTime.format() }}
      </DescriptionItem>
      <DescriptionItem label="نام منطقه زمانی">{{ state.info.timeZone }}</DescriptionItem>
      <DescriptionItem label="استاندارد نمادشناسی"
        >{{ state.info.symbologyStandard }}
      </DescriptionItem>

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
import dayjs from "dayjs";
import RadioGroupList from "@/components/RadioGroupList.vue";
import { useSymbolSettingsStore } from "@/stores/settingsStore";
import { injectStrict } from "@/utils";
import { activeScenarioKey, timeModalKey } from "@/components/injects";
import { useNotifications } from "@/composables/notifications";

const { send } = useNotifications();

const { store, io } = injectStrict(activeScenarioKey);
const { getModalTimestamp } = injectStrict(timeModalKey);

const standardSettings = [
  {
    value: "2525",
    name: "MIL-STD-2525D",
    description: "نسخه آمریکایی",
  },
  {
    value: "app6",
    name: "APP-6",
    description: "نسخه ناتو",
  },
];

const TimezoneSelect = defineAsyncComponent(
  () => import("@/components/TimezoneSelect.vue"),
);

const SimpleMarkdownInput = defineAsyncComponent(
  () => import("@/components/SimpleMarkdownInput.vue"),
);

const settingsStore = useSymbolSettingsStore();
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

const computedStartTime = computed(() => {
  try {
    return dayjs(form.value.startTime).tz(form.value.timeZone);
  } catch (e) {
    return dayjs(form.value.startTime);
  }
});

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
  const {
    state: { info },
  } = store;
  updateScenarioInfo(form.value);

  if (info.symbologyStandard) settingsStore.symbologyStandard = info.symbologyStandard;
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
