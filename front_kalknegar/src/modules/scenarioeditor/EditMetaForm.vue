<script lang="ts" setup>
import InputGroup from "@/components/InputGroup.vue";
import { computed, defineAsyncComponent, ref, watch } from "vue";
import BaseButton from "@/components/BaseButton.vue";
import { Button } from "@/components/ui/button";
import { klona } from "klona";
import type { NScenarioEvent, NScenarioFeature, NUnit } from "@/types/internalModels";
import ResourcePicker from "./ResourcePicker.vue";
import type { ResourceSearchResultDto } from "@/services/api/resourceApiService";
import { activeScenarioKey } from "@/components/injects";
import { injectStrict } from "@/utils";

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
  /** ارجاع به منبع داخلی (resource.id) به‌جای لینک خارجی خام. */
  linkedResourceId?: string;
  linkedResourceLabel?: string;
  phaseId?: string;
};

const form = ref<Partial<ItemMetaForm>>({
  name: "",
  shortName: "",
  description: "",
  externalUrl: "",
  title: "",
  subTitle: "",
  linkedResourceId: undefined,
  linkedResourceLabel: undefined,
  phaseId: undefined,
});

const { store } = injectStrict(activeScenarioKey);
const scenarioPhases = computed(() =>
  [...store.state.phases].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
);

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

// FIX: قبلاً منطق معکوس بود (`!isUnitType`) که باعث می‌شد فیلد «نام کوتاه»
// برای واحدها رندر نشود. اکنون فقط هنگام واحد بودن نمایش داده می‌شود.
const isUnit = computed(() => {
  return !!props.item && isUnitType(props.item);
});

const isScenarioEvent = computed(() => {
  return !!props.item && isScenarioEventType(props.item);
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
        linkedResourceId: (item?.meta as any)?.linkedResourceId ?? undefined,
        linkedResourceLabel: (item?.meta as any)?.linkedResourceLabel ?? undefined,
      };
    } else if (isUnitType(item)) {
      form.value = {
        name: item?.name ?? "",
        shortName: item?.shortName ?? "",
        description: item?.description ?? "",
        externalUrl: item?.externalUrl ?? "",
        linkedResourceId: (item as any)?.linkedResourceId ?? undefined,
        linkedResourceLabel: (item as any)?.linkedResourceLabel ?? undefined,
      };
    } else if (isScenarioEventType(item)) {
      form.value = {
        title: item?.title ?? "",
        subTitle: item?.subTitle ?? "",
        description: item?.description ?? "",
        externalUrl: item?.externalUrl ?? "",
        linkedResourceId: (item as any)?.linkedResourceId ?? undefined,
        linkedResourceLabel: (item as any)?.linkedResourceLabel ?? undefined,
        phaseId: item.phaseId ?? undefined,
      };
    }
  },
  { immediate: true },
);

const showPicker = ref(false);
function openPicker() {
  showPicker.value = true;
}
function onPickResource(r: ResourceSearchResultDto) {
  form.value.linkedResourceId = r.id;
  form.value.linkedResourceLabel = r.name;
}
function clearLinkedResource() {
  form.value.linkedResourceId = undefined;
  form.value.linkedResourceLabel = undefined;
}

const onFormSubmit = () => {
  emit("update", klona(form.value));
};
</script>
<template>
  <form @submit.prevent="onFormSubmit" class="mt-0 mb-6 space-y-4">
    <template v-if="isScenarioEvent">
      <InputGroup label="عنوان" v-model="form.title" id="title-input" autofocus />
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

    <label v-if="isScenarioEvent" class="block space-y-1 text-sm">
      <span>فاز سناریو</span>
      <select
        v-model="form.phaseId"
        class="bg-background w-full rounded-md border px-3 py-2"
      >
        <option :value="undefined">بدون فاز</option>
        <option v-for="phase in scenarioPhases" :key="phase.id" :value="phase.id">
          {{ phase.name }}
        </option>
      </select>
      <span class="text-muted-foreground block text-xs">
        برای دسته‌بندی رویداد در بازه عملیاتی مربوطه استفاده می‌شود.
      </span>
    </label>

    <div class="space-y-2">
      <label class="text-sm">منبع پیوست‌شده</label>
      <div v-if="form.linkedResourceId" class="flex items-center gap-2 text-sm">
        <span class="bg-muted rounded px-2 py-1">
          {{ form.linkedResourceLabel || form.linkedResourceId }}
        </span>
        <button
          type="button"
          class="text-xs text-red-600 hover:underline"
          @click="clearLinkedResource"
        >
          حذف ارجاع
        </button>
      </div>
      <Button type="button" size="sm" variant="outline" @click="openPicker">
        {{ form.linkedResourceId ? "تغییر منبع" : "انتخاب از مدیریت منابع" }}
      </Button>
      <p class="text-muted-foreground text-xs">
        به‌جای لینک خارجی خام، یک منبع از کاتالوگ مدیریت منابع را انتخاب کنید.
      </p>
    </div>

    <details class="text-xs">
      <summary class="text-muted-foreground cursor-pointer select-none">
        آدرس خارجی (سازگاری با سناریوهای قدیمی)
      </summary>
      <div class="mt-2">
        <InputGroup label="آدرس خارجی" description="" v-model="form.externalUrl" />
      </div>
    </details>

    <div class="flex items-center justify-end space-x-2">
      <BaseButton type="submit" small primary>ذخیره</BaseButton>
      <BaseButton small @click="emit('cancel')">لغو</BaseButton>
    </div>

    <ResourcePicker
      v-model:open="showPicker"
      title="انتخاب منبع داخلی برای این واحد/رخداد"
      @select="onPickResource"
    />
  </form>
</template>
