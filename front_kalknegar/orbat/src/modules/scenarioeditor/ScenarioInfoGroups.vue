<script setup lang="ts">
import { activeScenarioKey } from "@/components/injects";
import { injectStrict } from "@/utils";
import { computed, ref } from "vue";
import BaseButton from "@/components/BaseButton.vue";
import TableHeader from "@/components/TableHeader.vue";
import type { NRangeRingGroup } from "@/types/internalModels";
import DotsMenu from "@/components/DotsMenu.vue";
import { useNotifications } from "@/composables/notifications";
import { useScenarioInfoPanelStore } from "@/stores/scenarioInfoPanelStore";
import InputGroup from "@/components/InputGroup.vue";

const scn = injectStrict(activeScenarioKey);
const store = useScenarioInfoPanelStore();
const { send } = useNotifications();

const groups = computed(() => {
  return Object.values(scn.store.state.rangeRingGroupMap);
});

const itemActions = [
  { label: "ویرایش", action: "edit" },
  { label: "حذف", action: "delete" },
];

const editedId = ref();
const form = ref<Omit<NRangeRingGroup, "id">>({ name: "" });
const addForm = ref<Omit<NRangeRingGroup, "id">>({ name: "" });

function startEdit(data: NRangeRingGroup) {
  editedId.value = data.id;
  const { id, ...rest } = data;
  form.value = rest;
}

function onSubmit() {
  scn.unitActions.updateRangeRingGroup(editedId.value, form.value!);
  editedId.value = null;
}

function cancelEdit() {
  editedId.value = null;
}

function onItemAction(item: NRangeRingGroup, action: string) {
  switch (action) {
    case "edit":
      startEdit(item);
      break;
    case "delete":
      const success = scn.unitActions.deleteRangeRingGroup(item.id);
      if (!success) {
        send({
          type: "error",
          message: "نمی‌توان گروه در حال استفاده را حذف کرد.",
        });
      }
      break;
  }
}

function onAddSubmit() {
  // check if name exists
  if (groups.value.find((e) => e.name === addForm.value.name)) {
    send({
      type: "error",
      message: "گروه با این نام قبلاً وجود دارد.",
    });
    return;
  }
  scn.unitActions.addRangeRingGroup({ ...addForm.value });
  addForm.value = { name: "" };
}
</script>

<template>
  <div class="prose dark:prose-invert max-w-none">
    <TableHeader description="گروه‌های حلقه برد موجود در این سناریو.">
      <Button variant="outline" @click="store.toggleAddGroup()">
        {{ store.showAddGroup ? "مخفی کردن فرم" : "افزودن" }}
      </Button>
    </TableHeader>
    <form
      v-if="store.showAddGroup"
      @submit.prevent="onAddSubmit"
      class="not-prose grid grid-cols-3 gap-2"
    >
      <InputGroup autofocus label="نام" required v-model="addForm.name" />
      <div class="col-span-2 flex items-start gap-3">
        <BaseButton type="submit" small primary class="self-center">+افزودن</BaseButton>
      </div>
    </form>
    <form @submit.prevent="onSubmit">
      <table>
        <thead>
          <tr>
            <th>نام</th>

            <td></td>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="eq in groups"
            :key="eq.id"
            @dblclick="startEdit(eq)"
            class="cursor-pointer"
          >
            <template v-if="eq.id === editedId">
              <td>
                <input
                  type="text"
                  @vue:mounted="({ el }: any) => el.focus()"
                  v-model="form.name"
                  class="h-full w-full text-sm"
                  placeholder="نام"
                />
              </td>
              <td class="" colspan="3">
                <div class="flex">
                  <BaseButton small type="submit" secondary class="ml-2">ذخیره</BaseButton>
                  <BaseButton small class="ml-2" @click="cancelEdit()">لغو</BaseButton>
                </div>
              </td>
            </template>
            <template v-else>
              <td>{{ eq.name }}</td>
              <td class="not-prose w-6">
                <DotsMenu :items="itemActions" @action="onItemAction(eq, $event)" />
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </form>
  </div>
</template>
