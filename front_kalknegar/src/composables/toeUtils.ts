import { ref } from "vue";
import type { ColumnDef } from "@tanstack/vue-table";
import type { EUnitEquipment, EUnitPersonnel, EUnitSupply } from "@/types/internalModels";
import { toPersianDigits } from "@/utils/persianNumbers";

export function useToeEditableItems<T>() {
  const editMode = ref(false);
  const editedId = ref<string | null>();
  const showAddForm = ref(false);
  const rerender = ref(true);
  const selectedItems = ref<T[]>([]);

  return { editMode, editedId, showAddForm, rerender, selectedItems };
}

const participationStatusLabels: Record<string, string> = {
  planned: "برنامه‌ریزی‌شده",
  deployed: "اعزام‌شده",
  active: "فعال",
  completed: "پایان‌یافته",
  cancelled: "لغوشده",
  unavailable: "خارج از دسترس",
  wounded: "مجروح",
  killed: "شهید",
  transferred: "منتقل‌شده",
};

export function createToeTableColumns(options: { personnel?: boolean } = {}) {
  const columns: ColumnDef<EUnitEquipment | EUnitPersonnel>[] = [
    { id: "name", header: "نام", accessorKey: "name", size: 120 },
    ...(options.personnel
      ? [
          {
            id: "operationalRole",
            header: "نقش عملیاتی",
            accessorKey: "operationalRole",
            size: 130,
          },
          {
            id: "participationStatus",
            header: "وضعیت حضور",
            accessorFn: (item: EUnitPersonnel) =>
              participationStatusLabels[item.participationStatus ?? ""] ?? "—",
            size: 110,
          },
        ]
      : []),
    {
      id: "assigned",
      header: "تخصیص",
      accessorKey: "count",
      size: 80,
      meta: { align: "right" },
    },
    {
      id: "onHand",
      header: "موجود",
      accessorKey: "onHand",
      size: 80,
      meta: { align: "right" },
    },
    {
      id: "percentage",
      header: "درصد",
      accessorFn: (f) => asPercent(f),
      size: 80,
      meta: { align: "right" },
    },
  ];
  return columns;
}

export function asPercent(item: EUnitSupply | EUnitEquipment | EUnitPersonnel) {
  const percentage = Math.floor(((item.onHand ?? 1) / item.count) * 100);
  return toPersianDigits(`${percentage}%`);
}
