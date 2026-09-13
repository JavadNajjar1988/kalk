<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MilitarySymbol from "@/components/MilitarySymbol.vue";
import { PhCrosshair, PhMapPin, PhPackage } from "@phosphor-icons/vue";
import type { ResourceDto } from "@/services/api/resourceApiService";
import {
  resolveEquipmentSidc,
  type EquipmentParticipationStatus,
} from "./equipmentResourceFactory";

interface UnitOption {
  id: string;
  name: string;
}

const props = defineProps<{
  open: boolean;
  resource: ResourceDto | null;
  units: UnitOption[];
  defaultUnitId?: string | null;
}>();

const emit = defineEmits<{
  (event: "update:open", value: boolean): void;
  (
    event: "confirm",
    value: {
      quantity: number;
      participationStatus: EquipmentParticipationStatus;
      unitId?: string;
    },
  ): void;
}>();

const quantity = ref(1);
const participationStatus = ref<EquipmentParticipationStatus>("planned");
const unitId = ref("");
const dialogOpen = computed({
  get: () => props.open,
  set: (value) => emit("update:open", value),
});
const sidc = computed(() =>
  props.resource ? resolveEquipmentSidc(props.resource) : undefined,
);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    quantity.value = 1;
    participationStatus.value = "planned";
    unitId.value = props.defaultUnitId ?? "";
  },
);

function confirm() {
  emit("confirm", {
    quantity: Math.max(1, Math.trunc(Number(quantity.value) || 1)),
    participationStatus: participationStatus.value,
    unitId: unitId.value || undefined,
  });
  dialogOpen.value = false;
}
</script>

<template>
  <Dialog v-model:open="dialogOpen">
    <DialogContent
      dir="rtl"
      class="overflow-hidden border-slate-200 bg-white p-0 text-right shadow-2xl sm:max-w-lg dark:border-slate-700 dark:bg-slate-950"
    >
      <div
        class="border-b border-amber-200 bg-gradient-to-l from-amber-50 via-orange-50/60 to-white px-6 py-5 dark:border-amber-900/60 dark:from-amber-950/40 dark:via-slate-950 dark:to-slate-950"
      >
        <DialogHeader class="text-right">
          <div class="mb-3 flex items-center gap-3">
            <div
              class="flex size-11 items-center justify-center rounded-xl border border-amber-200 bg-white shadow-sm dark:border-amber-800 dark:bg-slate-900"
            >
              <MilitarySymbol v-if="sidc" :sidc="sidc" :size="28" />
              <PhPackage v-else class="size-6 text-amber-700 dark:text-amber-400" />
            </div>
            <div class="min-w-0">
              <DialogTitle class="truncate text-right text-lg font-bold">
                {{ resource?.name || "استقرار تجهیز" }}
              </DialogTitle>
              <DialogDescription class="mt-1 text-right text-xs">
                مشخصات استقرار را تعیین کنید؛ سپس محل آن را روی نقشه انتخاب کنید.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div
          v-if="resource?.code"
          class="inline-flex rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-xs text-amber-800 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-300"
        >
          کد مرجع: {{ resource.code }}
        </div>
      </div>

      <div class="space-y-5 px-6 py-5">
        <div class="grid grid-cols-2 gap-4">
          <label class="space-y-2 text-sm">
            <span class="font-medium text-slate-700 dark:text-slate-200">تعداد</span>
            <Input v-model="quantity" type="number" min="1" class="h-10 rounded-xl" />
          </label>
          <label class="space-y-2 text-sm">
            <span class="font-medium text-slate-700 dark:text-slate-200"
              >وضعیت در عملیات</span
            >
            <select
              v-model="participationStatus"
              class="border-input bg-background focus:ring-ring h-10 w-full rounded-xl border px-3 text-sm outline-none focus:ring-2"
            >
              <option value="planned">برنامه‌ریزی‌شده</option>
              <option value="deployed">اعزام‌شده</option>
              <option value="active">فعال در عملیات</option>
              <option value="completed">پایان‌یافته</option>
              <option value="unavailable">خارج از دسترس</option>
            </select>
          </label>
        </div>

        <label class="block space-y-2 text-sm">
          <span class="font-medium text-slate-700 dark:text-slate-200">یگان مرتبط</span>
          <select
            v-model="unitId"
            class="border-input bg-background focus:ring-ring h-10 w-full rounded-xl border px-3 text-sm outline-none focus:ring-2"
          >
            <option value="">موقعیت مستقل؛ بدون اتصال به یگان</option>
            <option v-for="unit in units" :key="unit.id" :value="unit.id">
              {{ unit.name }}
            </option>
          </select>
          <span class="text-muted-foreground block text-xs">
            این انتخاب فقط وابستگی عملیاتی را ثبت می‌کند و رکورد اصلی تجهیز را تغییر
            نمی‌دهد.
          </span>
        </label>

        <div
          class="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300"
        >
          <PhMapPin class="size-5 shrink-0" />
          پس از تأیید، نشانگر ماوس به حالت تعیین موقعیت تغییر می‌کند.
        </div>
      </div>

      <div
        class="flex justify-start gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/60"
      >
        <Button class="gap-2 rounded-xl" @click="confirm">
          <PhCrosshair class="size-4" />
          انتخاب موقعیت روی نقشه
        </Button>
        <Button variant="outline" class="rounded-xl" @click="dialogOpen = false">
          انصراف
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
