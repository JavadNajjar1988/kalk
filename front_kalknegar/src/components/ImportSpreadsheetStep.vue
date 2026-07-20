<script setup lang="ts">
import { readSpreadsheet } from "@/extlib/xlsx-read-lazy";
import BaseButton from "@/components/BaseButton.vue";
import { useNotifications } from "@/composables/notifications";

import { injectStrict } from "@/utils";
import { activeScenarioKey } from "@/components/injects";
import type { ImportedFileInfo } from "@/importexport/fileHandling";
import { detectSpreadsheetDialect } from "@/importexport/spreadsheets/utils";
import { computed, h, ref, shallowRef } from "vue";
import type { Unit } from "@/types/scenarioModels";
import SymbolCodeSelect from "@/components/SymbolCodeSelect.vue";
import type { SymbolItem } from "@/types/constants";
import { addUnitHierarchy } from "@/importexport/convertUtils";
import InputCheckbox from "@/components/InputCheckbox.vue";
import type { CellContext, ColumnDef, InitialTableState } from "@tanstack/vue-table";
import DataGrid from "@/modules/grid/DataGrid.vue";
import OrbatCellRenderer from "@/components/OrbatCellRenderer.vue";
import { PhCaretRight as ChevronRightIcon } from "@phosphor-icons/vue";

interface Props {
  fileInfo: ImportedFileInfo;
}

const props = defineProps<Props>();
const emit = defineEmits(["cancel", "loaded"]);
const scenario = injectStrict(activeScenarioKey);
const {
  store: { state },
} = scenario;

const expandTemplates = ref(true);
const includeEquipment = ref(true);
const includePersonnel = ref(true);

const rootUnitItems = computed((): SymbolItem[] => {
  return Object.values(state.sideGroupMap)
    .map((value) => value.subUnits)
    .flat()
    .map((e) => state.unitMap[e])
    .map((u) => ({ text: u.name, code: u.id, sidc: u.sidc }));
});

const parentUnitId = ref(rootUnitItems.value[0].code as string);

function renderExpandCell({ getValue, row }: CellContext<Unit, string>) {
  return h(OrbatCellRenderer, {
    value: getValue(),
    sidc: row.original.sidc,
    expanded: row.getIsExpanded(),
    level: row.depth,
    canExpand: row.getCanExpand(),
    onToggle: row.getToggleExpandedHandler(),
    symbolOptions: {},
  });
}

const columns: ColumnDef<Unit, any>[] = [
  {
    accessorFn: (f) => f.name,
    id: "name",
    cell: renderExpandCell,
    header: ({ table, column }) => {
      return h(
        "button",
        {
          type: "button",
          title: "Expand/collapse all",
          onClick: table.getToggleAllRowsExpandedHandler(),
          class: "flex items-center gap-2",
        },
        [
          h(ChevronRightIcon, {
            class: [
              "size-6 transform transition-transform text-gray-500",
              table.getIsAllRowsExpanded() ? "rotate-90" : "",
            ],
          }),
          "واحد",
        ],
      );
    },
    enableGlobalFilter: true,
    size: 450,
    enableSorting: false,
  },
];

const initialTableState: InitialTableState = {
  //grouping: ["PARENT NAME"],
  expanded: true,
};

const { send } = useNotifications();

const workbook = readSpreadsheet(props.fileInfo.dataAsArrayBuffer);
const dialect = detectSpreadsheetDialect(workbook);
const importedUnits = shallowRef<Unit[]>([]);

async function onLoad(e: Event) {
  send({
    message: "Import functionality for this format is not available",
    type: "error",
  });
  emit("loaded");
}
</script>
<template>
  <div class="">
    <form @submit.prevent="onLoad" class="mt-4 flex max-h-[80vh] flex-col">
      <div class="shrink-0 overflow-auto">
        <div class="prose prose-sm max-w-none">
          <p>
            Import functionality is currently not available.
          </p>
        </div>

        <section class="mt-4 space-y-4 px-1">
        </section>
      </div>

      <footer class="flex shrink-0 items-center justify-end space-x-2 pt-4">
        <BaseButton type="submit" primary small>وارد کردن</BaseButton>
        <BaseButton small @click="emit('cancel')">لغو</BaseButton>
      </footer>
    </form>
  </div>
</template>
