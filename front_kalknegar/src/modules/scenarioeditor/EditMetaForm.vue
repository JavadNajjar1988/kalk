<script lang="ts" setup>
import InputGroup from "@/components/InputGroup.vue";
import { computed, defineAsyncComponent, ref, watch } from "vue";
import BaseButton from "@/components/BaseButton.vue";
import { klona } from "klona";
import type { NScenarioEvent, NScenarioFeature, NUnit } from "@/types/internalModels";

const SimpleMarkdownInput = defineAsyncComponent(
  () => import("@/components/SimpleMarkdownInput.vue"),
);

const props = defineProps<{ item?: NUnit | NScenarioFeature | NScenarioEvent | null }>();
const emit = defineEmits(["cancel", "update"]);

type ItemMetaForm = {
  name: string;
  shortName?: string;
  description: string;
  externalUrl: string;
  title: string;
  subTitle: string;
};

const form = ref<Partial<ItemMetaForm>>({
  name: "",
  shortName: "",
  description: "",
  externalUrl: "",
  title: "",
  subTitle: "",
});

const isScenarioFeatureType = (
  item: NUnit | NScenarioFeature | NScenarioEvent,
): item is NScenarioFeature => {
  return "type" in item && item.type == "Feature";
};

const isScenarioEventType = (
  item: NUnit | NScenarioFeature | NScenarioEvent,
): item is NScenarioEvent => {
  return "startTime" in item || ("_type" in item && item._type === "scenario");
};

const isUnitType = (item: NUnit | NScenarioFeature | NScenarioEvent): item is NUnit => {
  return "sidc" in item;
};

const isUnit = computed(() => {
  return props.item && !isUnitType(props.item);
});

const isScenarioEvent = computed(() => {
  return props.item && isScenarioEventType(props.item);
});

watch(
  () => props.item,
  (item) => {
    if (!item) return;
    if (isScenarioFeatureType(item)) {
      form.value = {
        name: item?.meta?.name ?? "",
        description: item?.meta?.description ?? "",
        externalUrl: item?.meta?.externalUrl ?? "",
      };
    } else if (isUnitType(item)) {
      form.value = {
        name: item?.name ?? "",
        shortName: item?.shortName ?? "",
        description: item?.description ?? "",
        externalUrl: item?.externalUrl ?? "",
      };
    } else if (isScenarioEventType(item)) {
      form.value = {
        title: item?.title ?? "",
        subTitle: item?.subTitle ?? "",
        description: item?.description ?? "",
        externalUrl: item?.externalUrl ?? "",
      };
    }
  },
  { immediate: true },
);

const onFormSubmit = () => {
  emit("update", klona(form.value));
};
</script>
<template>
  <form @submit.prevent="onFormSubmit" class="mt-0 mb-6 space-y-4">
    <template v-if="isScenarioEvent">
      <InputGroup label="عنوان" v-model="form.title" id="title-input" autofocus />
      <!--      <InputGroup label="Sub title" v-model="form.subTitle" />-->
    </template>

    <template v-else>
      <InputGroup label="نام" v-model="form.name" id="name-input" autofocus />
      <InputGroup
        v-if="isUnit"
        label="نام کوتاه"
        description="نام جایگزین"
        v-model="form.shortName"
      />
    </template>
    <SimpleMarkdownInput
      label="توضیحات"
      v-model="form.description"
      description="از نحو نوشتار markdown برای قالب‌بندی استفاده کنید"
    />
    <InputGroup label="آدرس خارجی" description="" v-model="form.externalUrl" />

    <div class="flex items-center justify-end space-x-2">
      <BaseButton type="submit" small primary>ذخیره</BaseButton>
      <BaseButton small @click="emit('cancel')">لغو</BaseButton>
    </div>
  </form>
</template>
