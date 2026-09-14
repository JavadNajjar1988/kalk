<script setup lang="ts">
import InputGroup from "@/components/InputGroup.vue";
import { useForm } from "@/composables/forms";
import SimpleSelect from "@/components/SimpleSelect.vue";
import { activeScenarioKey } from "@/components/injects";
import { injectStrict, sortBy } from "@/utils";
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from "vue";
import { klona } from "klona";
import type { EUnitSupply, NUnitSupply } from "@/types/internalModels";
import FormFooter from "@/modules/scenarioeditor/FormFooter.vue";
import { Button } from "@/components/ui/button";
import ResourcePicker from "@/modules/scenarioeditor/ResourcePicker.vue";
import type { ResourceSearchResultDto } from "@/services/api/resourceApiService";

interface Form extends NUnitSupply {}

const props = withDefaults(
  defineProps<{ heading?: string; usedSupplies?: EUnitSupply[] }>(),
  {
    heading: "افزودن تدارکات واحد",
  },
);

const { store } = injectStrict(activeScenarioKey);
const modelValue = defineModel<Form>();
const emit = defineEmits<{ cancel: [void]; submit: [form: Form] }>();

const usedItems = computed(() => (props.usedSupplies ?? []).map((i) => i.id));
const { supplyClassMap, supplyUomMap } = store.state;

const supplyCategories = computed(() => {
  const sc = Object.values(store.state.supplyCategoryMap)
    .filter((v) => !usedItems.value.includes(v.id))
    .map((sc) => {
      const supplyClass = supplyClassMap[sc?.supplyClass ?? ""]?.name ?? "";
      const uomObj = supplyUomMap[sc?.uom ?? ""];
      const uom = uomObj?.code ?? uomObj?.name ?? "";
      return {
        label: `${sc.name}`,
        value: sc.id,
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
const formElement = useTemplateRef<HTMLFormElement>("formElement");
const showPicker = ref(false);
const pendingResource = ref<ResourceSearchResultDto | null>(null);
const formError = ref<string | null>(null);
const selectedCatalogItem = computed(() => {
  if (pendingResource.value?.id === form.value.id) return pendingResource.value;
  const item = store.state.supplyCategoryMap[form.value.id];
  return item?.resourceId ? item : undefined;
});
const canSubmit = computed(() => {
  const count = Number(form.value.count);
  const hasItem = Boolean(
    form.value.id &&
      (store.state.supplyCategoryMap[form.value.id] ||
        pendingResource.value?.id === form.value.id),
  );
  return hasItem && Number.isInteger(count) && count >= 1;
});

onMounted(async () => {
  await nextTick();
  formElement.value?.scrollIntoView({ block: "nearest" });
});

function onSubmit() {
  if (!canSubmit.value) {
    formError.value = "یک قلم معتبر انتخاب کنید و مقدار اولیه را دست‌کم یک قرار دهید.";
    return;
  }
  form.value.count = Number(form.value.count);
  const selectedResource = pendingResource.value;
  if (selectedResource) {
    store.update((state) => {
      state.supplyCategoryMap[selectedResource.id] = {
        id: selectedResource.id,
        name: selectedResource.name,
        description: selectedResource.description ?? undefined,
        resourceId: selectedResource.id,
      };
    });
    pendingResource.value = null;
  }
  formError.value = null;
  handleSubmit();
  emit("submit", klona(form.value));
}

function onPickResource(resource: ResourceSearchResultDto) {
  const linkedItem = Object.values(store.state.supplyCategoryMap).find(
    (item) => item.resourceId === resource.id,
  );
  if (linkedItem) {
    pendingResource.value = null;
    form.value.id = linkedItem.id;
    return;
  }
  pendingResource.value = resource;
  form.value.id = resource.id;
}

watch(
  supplyCategories,
  () => {
    if (supplyCategories.value.length && !form.value.id) {
      form.value.id = supplyCategories.value[0].value;
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
          v-if="supplyCategories.length"
          label="قلم تدارکاتی"
          v-model="form.id"
          :items="supplyCategories"
        />
        <InputGroup label="مقدار اولیه" type="number" min="1" v-model="form.count" />
      </div>
      <div class="flex items-center gap-2">
        <Button type="button" size="sm" variant="outline" @click="showPicker = true">
          انتخاب از منابع تدارکات و مهمات
        </Button>
        <p class="text-muted-foreground text-xs">
          یک قلم مرجع را انتخاب کنید تا پیوند آن در سناریو حفظ شود.
        </p>
      </div>
      <div
        v-if="selectedCatalogItem"
        class="border-primary/30 bg-primary/10 text-foreground rounded-xl border px-4 py-3 text-sm"
      >
        <span class="font-semibold">{{ selectedCatalogItem.name }}</span>
        از مدیریت منابع انتخاب شده است.
      </div>
      <p v-if="!supplyCategories.length && !selectedCatalogItem" class="text-sm text-gray-500">
        قلمی در سناریو وجود ندارد؛ از مدیریت منابع انتخاب کنید.
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
      :types="['logistics', 'ammunition']"
      title="انتخاب قلم تدارکاتی از مدیریت منابع"
      @select="onPickResource"
    />
  </form>
</template>
