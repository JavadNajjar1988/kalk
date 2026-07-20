<script setup lang="ts">
import { activeScenarioKey } from "@/components/injects";
import { injectStrict } from "@/utils";
import { computed, ref, triggerRef } from "vue";
import TableHeader from "@/components/TableHeader.vue";
import type { NPersonnelData, NSupplyUoM } from "@/types/internalModels";
import { useNotifications } from "@/composables/notifications";
import type { ColumnDef } from "@tanstack/vue-table";
import ToeGridHeader from "@/modules/scenarioeditor/ToeGridHeader.vue";
import ToeGrid from "@/modules/grid/ToeGrid.vue";
import InlineFormWrapper from "@/modules/scenarioeditor/InlineFormWrapper.vue";
import { useSupplyUoMTableStore } from "@/stores/tableStores";
import { useToeEditableItems } from "@/composables/toeUtils";
import AddSupplyUoMForm from "@/modules/scenarioeditor/AddSupplyUoMForm.vue";

const scn = injectStrict(activeScenarioKey);
const { send } = useNotifications();

const { editMode, editedId, showAddForm, rerender, selectedItems } =
  useToeEditableItems<NSupplyUoM>();
const tableStore = useSupplyUoMTableStore();

const supplyUnits = computed(() => {
  scn.store.state.settingsStateCounter && rerender.value;
  return Object.values(scn.store.state.supplyUomMap);
});

const columns: ColumnDef<NSupplyUoM>[] = [
  { id: "name", header: "نام", accessorKey: "name", size: 100 },
  { id: "code", header: "مخفف", accessorKey: "code", size: 80 },
  { id: "type", header: "نوع", accessorKey: "type", size: 100 },
  {
    id: "description",
    header: "توضیحات",
    accessorKey: "description",
    size: 100,
  },
];

const addForm = ref<Omit<NSupplyUoM, "id">>({
  name: "",
  code: "",
  description: "",
  type: "",
});

function onSubmit(e: NPersonnelData) {
  const { id, ...rest } = e;
  scn.unitActions.updateSupplyUom(id, rest);
  editedId.value = null;
  triggerRef(rerender);
}

function cancelEdit() {
  editedId.value = null;
}

function onAddSubmit(formData: Omit<NSupplyUoM, "id">) {
  // check if name exists
  if (supplyUnits.value.find((e) => e.name === formData.name)) {
    send({
      type: "error",
      message: "واحد اندازه‌گیری/صدور با این نام قبلاً وجود دارد.",
    });
    return;
  }
  scn.unitActions.addSupplyUom({ ...formData });
  addForm.value = { ...addForm.value, name: "", code: "", description: "" };
}

function onDelete() {
  const notDeletedItems: NSupplyUoM[] = [];
  scn.store.groupUpdate(() => {
    selectedItems.value.forEach((e) => {
      const success = scn.unitActions.deleteSupplyUom(e.id);
      if (!success) {
        send({
          type: "error",
          message: `${e.name}: نمی‌توان آیتم در حال استفاده را حذف کرد.`,
        });
        notDeletedItems.push(e);
      }
    });
  });
  triggerRef(editMode);
  selectedItems.value = notDeletedItems;
}
</script>

<template>
  <div class="">
    <TableHeader
      description="فهرست واحدهای اندازه‌گیری/صدور موجود در این سناریو."
    />
    <ToeGridHeader
      v-model:editMode="editMode"
      v-model:addMode="showAddForm"
      editLabel="ویرایش واحد اندازه‌گیری/صدور"
      :selected-count="selectedItems.length"
      :hideEdit="supplyUnits.length === 0"
      @delete="onDelete()"
    />
    <AddSupplyUoMForm
      v-if="showAddForm"
      v-model="addForm"
      @cancel="showAddForm = false"
      @submit="onAddSubmit"
      heading="افزودن واحد اندازه‌گیری/صدور جدید"
    />
    <ToeGrid
      v-if="supplyUnits.length"
      :columns="columns"
      :data="supplyUnits"
      v-model:editedId="editedId"
      :select="editMode"
      v-model:selected="selectedItems"
      v-model:editMode="editMode"
      :tableStore="tableStore"
    >
      <template #inline-form="{ row }">
        <InlineFormWrapper class="pr-6">
          <AddSupplyUoMForm
            :model-value="row"
            @submit="onSubmit($event as NPersonnelData)"
            @cancel="cancelEdit()"
            heading="ویرایش واحد اندازه‌گیری/صدور"
          />
        </InlineFormWrapper>
      </template>
    </ToeGrid>
    <p v-else class="prose prose-sm dark:prose-invert">
      از دکمه <kbd>افزودن</kbd> برای افزودن واحد اندازه‌گیری/صدور جدید به این سناریو استفاده کنید.
    </p>
  </div>
</template>
