<script setup lang="ts">
import InputGroup from "@/components/InputGroup.vue";
import { useForm } from "@/composables/forms";
import { activeScenarioKey, timeModalKey } from "@/components/injects";
import { injectStrict } from "@/utils";
import { computed, ref, watch } from "vue";
import { klona } from "klona";
import type {
  EUnitEquipment,
  EUnitPersonnel,
  EUnitSupply,
  NUnitEquipment,
  NUnitPersonnel,
  ToeMode,
} from "@/types/internalModels";
import FormFooter from "@/modules/scenarioeditor/FormFooter.vue";
import InputCheckbox from "@/components/InputCheckbox.vue";
import { type ToeEditStore } from "@/stores/toeStore";
import { useTimeFormatStore } from "@/stores/timeFormatStore";
import SimpleSelect from "@/components/SimpleSelect.vue";
import DescriptionItem from "@/components/DescriptionItem.vue";
import PlainButton from "@/components/PlainButton.vue";
import { formatDateString } from "@/geo/utils";

type Form = NUnitEquipment | NUnitPersonnel;

const props = withDefaults(
  defineProps<{
    itemData: EUnitEquipment | EUnitPersonnel | EUnitSupply;
    editStore: ToeEditStore;
    mode: ToeMode;
  }>(),
  {},
);

const emit = defineEmits<{
  cancel: [void];
  diffOnHand: [form: Form];
  updateOnHand: [form: Form];
  updateCount: [form: Form];
}>();
const modelValue = defineModel<Form>();

watch(
  () => props.itemData,
  () => {
    modelValue.value = klona(props.itemData);
  },
  { immediate: true },
);

const { time } = injectStrict(activeScenarioKey);
const { getModalTimestamp } = injectStrict(timeModalKey);

const fmt = useTimeFormatStore();

const formattedTime = computed(() =>
  fmt.scenarioFormatter.format(+time.scenarioTime.value),
);

const { form } = useForm<Form>(
  {
    id: "",
    count: 1,
  },
  modelValue,
);
const personnelForm = computed(() => form.value as NUnitPersonnel);
const timeError = ref<string | null>(null);

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

function resetForm() {
  modelValue.value = klona(props.itemData);
}

function onSubmit(e: KeyboardEvent | Event) {
  // prevent double form submission with ctrl/meta+enter
  if (e instanceof KeyboardEvent && e.target instanceof HTMLInputElement) {
    return;
  }

  if (props.editStore.isOnHandMode) {
    if (props.editStore.isDiffMode) {
      emit("diffOnHand", {
        id: form.value.id,
        onHand: props.editStore.diffValue,
        count: -1,
      });
    } else {
      emit("updateOnHand", {
        id: form.value.id,
        onHand: form.value.onHand,
        count: -1,
      });
    }
  } else {
    if (
      props.mode === "personnel" &&
      personnelForm.value.participationStartTime !== undefined &&
      personnelForm.value.participationEndTime !== undefined &&
      personnelForm.value.participationEndTime <
        personnelForm.value.participationStartTime
    ) {
      timeError.value = "زمان پایان حضور نمی‌تواند پیش از زمان شروع باشد.";
      return;
    }
    timeError.value = null;
    emit("updateCount", {
      id: form.value.id,
      count: form.value.count,
      participationStatus: form.value.participationStatus,
      ...(props.mode === "personnel"
        ? {
            operationalRole: personnelForm.value.operationalRole,
            participationStartTime: personnelForm.value.participationStartTime,
            participationEndTime: personnelForm.value.participationEndTime,
            participationNotes: personnelForm.value.participationNotes,
            sourceReference: personnelForm.value.sourceReference,
          }
        : {}),
    });
  }
}

watch([() => props.editStore.isOnHandMode, () => props.editStore.isDiffMode], () => {
  resetForm();
});
</script>

<template>
  <form
    @submit.prevent="onSubmit"
    @keyup.esc.stop="emit('cancel')"
    @keyup.ctrl.enter="onSubmit"
    @keyup.meta.enter="onSubmit"
  >
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold">{{ itemData.name }}</h3>
      <div class="flex items-center gap-1"></div>
    </div>
    <div class="mt-4">
      <InputCheckbox
        v-model="editStore.isOnHandMode"
        :label="`ویرایش آیتم در ${formattedTime}`"
        description=""
      />
    </div>
    <section class="mt-4 grid grid-cols-2 items-start gap-6">
      <InputGroup
        label="مقدار اولیه"
        type="number"
        :disabled="editStore.isOnHandMode"
        v-model="form.count"
        min="0"
        :autofocus="!editStore.isOnHandMode"
      />
      <SimpleSelect
        v-if="!editStore.isOnHandMode"
        label="وضعیت در این عملیات"
        v-model="form.participationStatus"
        :items="participationStatuses"
      />
      <InputGroup
        label="موجود / در دسترس"
        type="number"
        :disabled="!editStore.isOnHandMode || editStore.isDiffMode"
        v-model="form.onHand"
        min="0"
        :autofocus="editStore.isOnHandMode && !editStore.isDiffMode"
      />
      <template v-if="editStore.isOnHandMode">
        <InputCheckbox
          label="حالت افزودن/کم کردن"
          description=""
          v-model="editStore.isDiffMode"
        />
        <InputGroup
          v-if="editStore.isDiffMode"
          label="افزودن/کم کردن"
          type="number"
          :autofocus="editStore.isDiffMode"
          v-model="editStore.diffValue"
        />
      </template>
    </section>

    <section
      v-if="mode === 'personnel' && !editStore.isOnHandMode"
      class="mt-5 space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/40"
    >
      <InputGroup
        label="نقش یا مسئولیت عملیاتی"
        v-model="personnelForm.operationalRole"
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
            تغییر
          </PlainButton>
        </DescriptionItem>
        <DescriptionItem label="پایان حضور">
          {{ formatDateString(personnelForm.participationEndTime, time.timeZone.value) }}
          <PlainButton
            type="button"
            class="mr-2"
            @click="selectParticipationTime('participationEndTime')"
          >
            تغییر
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
        />
      </label>
      <InputGroup label="منبع اطلاعات" v-model="personnelForm.sourceReference" />
      <p v-if="timeError" class="text-xs text-red-600">{{ timeError }}</p>
    </section>

    <FormFooter @cancel="emit('cancel')" showNextToggle />
  </form>
</template>
