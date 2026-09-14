<script setup lang="ts">
import InputGroup from "@/components/InputGroup.vue";
import { useForm } from "@/composables/forms";
import SimpleSelect from "@/components/SimpleSelect.vue";
import { activeScenarioKey, timeModalKey } from "@/components/injects";
import { injectStrict, sortBy } from "@/utils";
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from "vue";
import { klona } from "klona";
import type {
  EUnitEquipment,
  EUnitPersonnel,
  NUnitEquipment,
  NUnitPersonnel,
  ToeMode,
} from "@/types/internalModels";
import FormFooter from "@/modules/scenarioeditor/FormFooter.vue";
import { Button } from "@/components/ui/button";
import ResourcePicker from "@/modules/scenarioeditor/ResourcePicker.vue";
import type { ResourceSearchResultDto } from "@/services/api/resourceApiService";
import DescriptionItem from "@/components/DescriptionItem.vue";
import PlainButton from "@/components/PlainButton.vue";
import { formatDateString } from "@/geo/utils";

type Form = NUnitEquipment | NUnitPersonnel;

const props = withDefaults(
  defineProps<{
    heading?: string;
    usedItems?: EUnitEquipment[] | EUnitPersonnel[];
    mode: ToeMode;
  }>(),
  {
    heading: "افزودن آیتم",
  },
);

const { store, time } = injectStrict(activeScenarioKey);
const { getModalTimestamp } = injectStrict(timeModalKey);
const modelValue = defineModel<Form>();
const emit = defineEmits<{ cancel: [void]; submit: [form: Form] }>();

const usedItems = computed(() => (props.usedItems ?? []).map((i) => i.id));

const itemCategories = computed(() => {
  const c =
    props.mode === "equipment" ? store.state.equipmentMap : store.state.personnelMap;
  const sc = Object.values(c)
    .filter((v) => !usedItems.value.includes(v.id))
    .map((ic) => {
      return {
        label: ic.name,
        value: ic.id,
      };
    });

  return sortBy(sc, "label");
});

const { form, handleSubmit } = useForm<Form>(
  {
    id: "",
    count: 1,
    participationStatus: "planned",
    participationStartTime:
      props.mode === "personnel" ? +time.scenarioTime.value : undefined,
  },
  modelValue,
);
const personnelForm = computed(() => form.value as NUnitPersonnel);
const formElement = useTemplateRef<HTMLFormElement>("formElement");
const timeError = ref<string | null>(null);
const formError = ref<string | null>(null);
const pendingResource = ref<ResourceSearchResultDto | null>(null);
const selectedCatalogItem = computed(() => {
  const map =
    props.mode === "equipment" ? store.state.equipmentMap : store.state.personnelMap;
  if (pendingResource.value?.id === form.value.id) return pendingResource.value;
  const item = map[form.value.id];
  return item?.resourceId ? item : undefined;
});
const canSubmit = computed(() => {
  const count = Number(form.value.count);
  const map =
    props.mode === "equipment" ? store.state.equipmentMap : store.state.personnelMap;
  const hasItem = Boolean(
    form.value.id &&
      (map[form.value.id] || pendingResource.value?.id === form.value.id),
  );
  return hasItem && Number.isInteger(count) && count >= 1;
});

onMounted(async () => {
  await nextTick();
  formElement.value?.scrollIntoView({ block: "nearest" });
});

function onSubmit() {
  if (!canSubmit.value) {
    formError.value = "یک مورد معتبر انتخاب کنید و مقدار اولیه را دست‌کم یک قرار دهید.";
    return;
  }
  form.value.count = Number(form.value.count);
  formError.value = null;
  if (
    props.mode === "personnel" &&
    personnelForm.value.participationStartTime !== undefined &&
    personnelForm.value.participationEndTime !== undefined &&
    personnelForm.value.participationEndTime < personnelForm.value.participationStartTime
  ) {
    timeError.value = "زمان پایان حضور نمی‌تواند پیش از زمان شروع باشد.";
    return;
  }
  timeError.value = null;
  const selectedResource = pendingResource.value;
  if (selectedResource) {
    if (props.mode === "equipment") {
      store.update((s) => {
        s.equipmentMap[selectedResource.id] = {
          id: selectedResource.id,
          name: selectedResource.name,
          description: selectedResource.description ?? undefined,
          resourceId: selectedResource.id,
        };
      });
    } else {
      store.update((s) => {
        s.personnelMap[selectedResource.id] = {
          id: selectedResource.id,
          name: selectedResource.name,
          description: selectedResource.description ?? undefined,
          resourceId: selectedResource.id,
        };
      });
    }
    pendingResource.value = null;
  }
  handleSubmit();
  emit("submit", klona(form.value));
}

watch(
  itemCategories,
  () => {
    if (itemCategories.value.length && !form.value.id) {
      form.value.id = itemCategories.value[0].value;
    }
  },
  { immediate: true },
);

watch(
  () => form.value.id,
  (id) => {
    if (pendingResource.value && pendingResource.value.id !== id) {
      pendingResource.value = null;
    }
    formError.value = null;
  },
);

// ---- اتصال به کاتالوگ مدیریت منابع -------------------------------------------

const showPicker = ref(false);
const pickerType = computed(() =>
  props.mode === "equipment" ? "equipment" : "personnel",
);

const participationStatuses = computed(() => [
  { value: "planned", label: "برنامه‌ریزی‌شده" },
  { value: "deployed", label: "اعزام‌شده" },
  { value: "active", label: "فعال در عملیات" },
  { value: "completed", label: "پایان‌یافته" },
  { value: "cancelled", label: "لغوشده" },
  { value: "unavailable", label: "خارج از دسترس" },
  ...(props.mode === "personnel"
    ? [
        { value: "wounded", label: "مجروح" },
        { value: "killed", label: "شهید" },
        { value: "transferred", label: "منتقل‌شده" },
      ]
    : []),
]);

async function selectParticipationTime(
  field: "participationStartTime" | "participationEndTime",
) {
  const current = personnelForm.value[field] ?? +time.scenarioTime.value;
  const value = await getModalTimestamp(current, {
    timeZone: time.timeZone.value,
    title:
      field === "participationStartTime" ? "شروع حضور در عملیات" : "پایان حضور در عملیات",
  });
  if (value !== undefined) personnelForm.value[field] = value;
}

function openPicker() {
  showPicker.value = true;
}

function onPickResource(r: ResourceSearchResultDto) {
  // اگر این منبع قبلاً به سناریو پیوند خورده، همان دسته داخلی را دوباره استفاده کن.
  // شناسه داخلی پس از بازکردن دوباره سناریو لزوماً با resourceId برابر نیست.
  const map =
    props.mode === "equipment" ? store.state.equipmentMap : store.state.personnelMap;
  const linkedItem = Object.values(map).find((item) => item.resourceId === r.id);
  if (linkedItem) {
    pendingResource.value = null;
    form.value.id = linkedItem.id;
    return;
  }

  pendingResource.value = r;
  form.value.id = r.id;
}
</script>

<template>
  <form
    ref="formElement"
    @submit.prevent="onSubmit"
    class=""
    @keyup.esc.stop="emit('cancel')"
  >
    <h3 class="text-sm font-semibold">{{ heading }}</h3>

    <section class="mt-4 space-y-3">
      <div class="grid grid-cols-2 gap-6">
        <SimpleSelect
          v-if="itemCategories.length"
          :label="mode === 'equipment' ? 'تجهیز' : 'پرسنل'"
          v-model="form.id"
          :items="itemCategories"
        />
        <InputGroup label="مقدار اولیه" type="number" min="1" v-model="form.count" />
        <SimpleSelect
          label="وضعیت در این عملیات"
          v-model="form.participationStatus"
          :items="participationStatuses"
        />
      </div>

      <div class="flex items-center gap-2">
        <Button type="button" size="sm" variant="outline" @click="openPicker">
          {{
            mode === "equipment" ? "انتخاب از کاتالوگ تجهیزات" : "انتخاب از کاتالوگ پرسنل"
          }}
        </Button>
        <p class="text-muted-foreground text-xs">
          از مدیریت منابع داشبورد یک ردیف را انتخاب کنید.
        </p>
      </div>

      <div
        v-if="selectedCatalogItem"
        class="border-primary/30 bg-primary/10 text-foreground rounded-xl border px-4 py-3 text-sm"
      >
        <span class="font-semibold">{{ selectedCatalogItem.name }}</span>
        انتخاب شده است. برای ایجاد پیوند و ثبت سابقه در یگان، دکمه «ثبت در یگان» را بزنید.
      </div>

      <div
        v-if="mode === 'personnel'"
        class="border-border bg-muted/40 space-y-4 rounded-xl border p-4"
      >
        <h4 class="text-foreground font-medium">
          سابقه حضور در این عملیات
        </h4>
        <InputGroup
          label="نقش یا مسئولیت عملیاتی"
          v-model="personnelForm.operationalRole"
          placeholder="برای نمونه: فرمانده محور جنوبی"
        />
        <div class="grid gap-3 sm:grid-cols-2">
          <DescriptionItem label="شروع حضور">
            {{
              formatDateString(personnelForm.participationStartTime, time.timeZone.value)
            }}
            <PlainButton
              type="button"
              class="mr-2"
              @click="selectParticipationTime('participationStartTime')"
            >
              انتخاب
            </PlainButton>
          </DescriptionItem>
          <DescriptionItem label="پایان حضور">
            {{
              formatDateString(personnelForm.participationEndTime, time.timeZone.value)
            }}
            <PlainButton
              type="button"
              class="mr-2"
              @click="selectParticipationTime('participationEndTime')"
            >
              انتخاب
            </PlainButton>
            <PlainButton
              v-if="personnelForm.participationEndTime !== undefined"
              type="button"
              @click="personnelForm.participationEndTime = undefined"
            >
              حذف
            </PlainButton>
          </DescriptionItem>
        </div>
        <label class="block space-y-2 text-sm">
          <span class="font-medium">توضیح عملکرد یا نتیجه حضور</span>
          <textarea
            v-model="personnelForm.participationNotes"
            rows="3"
            class="border-input bg-background focus:ring-ring w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
            placeholder="شرح کوتاهی از مسئولیت، تصمیم یا نتیجه حضور این شخص"
          />
        </label>
        <InputGroup
          label="منبع اطلاعات"
          v-model="personnelForm.sourceReference"
          placeholder="برای نمونه: گزارش روزانه، صفحه ۳۵"
        />
        <p v-if="timeError" class="text-xs text-red-600">{{ timeError }}</p>
      </div>

      <p v-if="!itemCategories.length" class="text-sm text-gray-500">
        آیتمی برای افزودن وجود ندارد. می‌توانید از کاتالوگ منابع انتخاب کنید.
      </p>
      <p v-if="formError" class="text-xs text-red-600">{{ formError }}</p>
    </section>

    <FormFooter
      @cancel="emit('cancel')"
      submitLabel="ثبت در یگان"
      :submitDisabled="!canSubmit"
    />

    <ResourcePicker
      v-model:open="showPicker"
      :type="pickerType"
      :title="
        mode === 'equipment' ? 'انتخاب تجهیز از کاتالوگ' : 'انتخاب پرسنل از کاتالوگ'
      "
      @select="onPickResource"
    />
  </form>
</template>
