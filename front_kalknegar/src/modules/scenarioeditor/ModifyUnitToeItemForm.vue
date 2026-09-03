<script setup lang="ts">
import InputGroup from "@/components/InputGroup.vue";
import { useForm } from "@/composables/forms";
import { activeScenarioKey } from "@/components/injects";
import { injectStrict } from "@/utils";
import { computed, watch } from "vue";
import { klona } from "klona";
import type {
  EUnitEquipment,
  EUnitSupply,
  NUnitEquipment,
  NUnitPersonnel,
} from "@/types/internalModels";
import FormFooter from "@/modules/scenarioeditor/FormFooter.vue";
import InputCheckbox from "@/components/InputCheckbox.vue";
import { type ToeEditStore } from "@/stores/toeStore";
import { useTimeFormatStore } from "@/stores/timeFormatStore";
import SimpleSelect from "@/components/SimpleSelect.vue";

type Form = NUnitEquipment | NUnitPersonnel;

const props = withDefaults(
  defineProps<{ itemData: EUnitEquipment | EUnitSupply; editStore: ToeEditStore }>(),
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

const participationStatuses = [
  { value: "planned", label: "برنامه‌ریزی‌شده" },
  { value: "deployed", label: "اعزام‌شده" },
  { value: "active", label: "فعال در عملیات" },
  { value: "completed", label: "پایان‌یافته" },
  { value: "cancelled", label: "لغوشده" },
  { value: "unavailable", label: "خارج از دسترس" },
];

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
    emit("updateCount", {
      id: form.value.id,
      count: form.value.count,
      participationStatus: form.value.participationStatus,
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

    <FormFooter @cancel="emit('cancel')" showNextToggle />
  </form>
</template>
