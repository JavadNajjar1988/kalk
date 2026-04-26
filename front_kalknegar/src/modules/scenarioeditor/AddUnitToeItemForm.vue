<script setup lang="ts">
import InputGroup from "@/components/InputGroup.vue";
import { useForm } from "@/composables/forms";
import SimpleSelect from "@/components/SimpleSelect.vue";
import { activeScenarioKey } from "@/components/injects";
import { injectStrict, sortBy } from "@/utils";
import { computed, ref, watch } from "vue";
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

const { store } = injectStrict(activeScenarioKey);
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
  },
  modelValue,
);

function onSubmit() {
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

// ---- اتصال به کاتالوگ مدیریت منابع -------------------------------------------

const showPicker = ref(false);
const pickerType = computed(() =>
  props.mode === "equipment" ? "equipment" : "personnel",
);

function openPicker() {
  showPicker.value = true;
}

function onPickResource(r: ResourceSearchResultDto) {
  // اطمینان از وجود رکورد در equipmentMap / personnelMap لوکال سناریو با ID = resourceId
  const map =
    props.mode === "equipment" ? store.state.equipmentMap : store.state.personnelMap;
  if (!map[r.id]) {
    if (props.mode === "equipment") {
      store.update((s) => {
        s.equipmentMap[r.id] = {
          id: r.id,
          name: r.name,
          description: r.description ?? undefined,
          resourceId: r.id,
        };
      });
    } else {
      store.update((s) => {
        s.personnelMap[r.id] = {
          id: r.id,
          name: r.name,
          description: r.description ?? undefined,
          resourceId: r.id,
        };
      });
    }
  }
  form.value.id = r.id;
}
</script>

<template>
  <form @submit.prevent="onSubmit" class="" @keyup.esc.stop="emit('cancel')">
    <h3 class="text-sm font-semibold">{{ heading }}</h3>

    <section class="mt-4 space-y-3">
      <div class="grid grid-cols-2 gap-6">
        <SimpleSelect
          v-if="itemCategories.length"
          label="دسته‌بندی تدارکات"
          v-model="form.id"
          :items="itemCategories"
        />
        <InputGroup label="مقدار اولیه" type="number" v-model="form.count" />
      </div>

      <div class="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          @click="openPicker"
        >
          {{ mode === "equipment"
            ? "انتخاب از کاتالوگ تجهیزات"
            : "انتخاب از کاتالوگ پرسنل" }}
        </Button>
        <p class="text-muted-foreground text-xs">
          از مدیریت منابع داشبورد یک ردیف را انتخاب کنید.
        </p>
      </div>

      <p v-if="!itemCategories.length" class="text-sm text-gray-500">
        آیتمی برای افزودن وجود ندارد. می‌توانید از کاتالوگ منابع انتخاب کنید.
      </p>
    </section>

    <FormFooter @cancel="emit('cancel')" submitLabel="افزودن" />

    <ResourcePicker
      v-model:open="showPicker"
      :type="pickerType"
      :title="mode === 'equipment' ? 'انتخاب تجهیز از کاتالوگ' : 'انتخاب پرسنل از کاتالوگ'"
      @select="onPickResource"
    />
  </form>
</template>
