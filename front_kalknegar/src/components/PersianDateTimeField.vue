<script setup lang="ts">
import { computed, ref, watch } from "vue";
import dayjs from "@/dayjs";
import { toPersianDigits } from "@/utils/persianNumbers";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    required?: boolean;
    dateOnly?: boolean;
  }>(),
  {
    label: "تاریخ و زمان",
    required: false,
    dateOnly: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const open = ref(false);
const viewYear = ref(1400);
const viewMonth = ref(0);
const selectedDay = ref(1);
const hour = ref(0);
const minute = ref(0);

const weekDays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const monthNames = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

function jalaliFromValue(value: string) {
  const parsed = value ? dayjs(value) : dayjs();
  const safe = parsed.isValid() ? parsed : dayjs();
  return safe.calendar("jalali");
}

function syncFromValue(value: string) {
  const jalali = jalaliFromValue(value);
  viewYear.value = jalali.year();
  viewMonth.value = jalali.month();
  selectedDay.value = jalali.date();
  hour.value = jalali.hour();
  minute.value = jalali.minute();
}

watch(() => props.modelValue, syncFromValue, { immediate: true });

const monthDate = computed(() =>
  dayjs().calendar("jalali").year(viewYear.value).month(viewMonth.value).date(1),
);
const daysInMonth = computed(() => monthDate.value.daysInMonth());
const startOffset = computed(() => (monthDate.value.day() + 1) % 7);
const calendarCells = computed(() => [
  ...Array.from({ length: startOffset.value }, () => null),
  ...Array.from({ length: daysInMonth.value }, (_, index) => index + 1),
]);

const displayValue = computed(() => {
  if (!props.modelValue) return "";
  const jalali = jalaliFromValue(props.modelValue);
  const format = props.dateOnly ? "YYYY/MM/DD" : "YYYY/MM/DD - HH:mm";
  return toPersianDigits(jalali.format(format));
});

function moveMonth(delta: number) {
  const moved = monthDate.value.add(delta, "month");
  viewYear.value = moved.year();
  viewMonth.value = moved.month();
}

function selectDay(day: number) {
  selectedDay.value = day;
  const jalali = dayjs()
    .calendar("jalali")
    .year(viewYear.value)
    .month(viewMonth.value)
    .date(day)
    .hour(props.dateOnly ? 0 : hour.value)
    .minute(props.dateOnly ? 0 : minute.value)
    .second(0)
    .millisecond(0);
  const gregorian = jalali.calendar("gregory");
  emit(
    "update:modelValue",
    gregorian.format(props.dateOnly ? "YYYY-MM-DD" : "YYYY-MM-DDTHH:mm"),
  );
  if (props.dateOnly) open.value = false;
}

function applyTime() {
  selectDay(selectedDay.value);
  open.value = false;
}

function clearValue() {
  emit("update:modelValue", "");
  open.value = false;
}
</script>

<template>
  <label class="relative block text-xs">
    <span>{{ label }}<span v-if="required"> *</span></span>
    <button
      type="button"
      class="bg-background mt-1 flex min-h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-right"
      :aria-label="`${label} شمسی`"
      @click="open = !open"
    >
      <span :class="{ 'text-muted-foreground': !displayValue }">
        {{ displayValue || "انتخاب تاریخ شمسی" }}
      </span>
      <span aria-hidden="true">▣</span>
    </button>

    <div
      v-if="open"
      class="bg-background absolute right-0 z-50 mt-1 w-[min(19rem,90vw)] rounded-md border p-3 shadow-lg"
    >
      <div class="mb-2 flex items-center justify-between">
        <button
          type="button"
          class="rounded p-1 hover:bg-slate-100"
          @click="moveMonth(1)"
        >
          ‹
        </button>
        <strong>{{ monthNames[viewMonth] }} {{ toPersianDigits(viewYear) }}</strong>
        <button
          type="button"
          class="rounded p-1 hover:bg-slate-100"
          @click="moveMonth(-1)"
        >
          ›
        </button>
      </div>
      <div class="grid grid-cols-7 gap-1 text-center">
        <span
          v-for="weekDay in weekDays"
          :key="weekDay"
          class="text-muted-foreground py-1 text-[11px]"
        >
          {{ weekDay }}
        </span>
        <span v-for="(day, index) in calendarCells" :key="`${day}-${index}`">
          <button
            v-if="day"
            type="button"
            class="aspect-square w-full rounded text-xs hover:bg-sky-100"
            :class="{
              'bg-sky-600 text-white hover:bg-sky-600': day === selectedDay,
            }"
            @click="selectDay(day)"
          >
            {{ toPersianDigits(day) }}
          </button>
        </span>
      </div>
      <div v-if="!dateOnly" class="mt-3 flex items-end gap-2 border-t pt-3">
        <label class="flex-1">
          <span class="text-muted-foreground">ساعت</span>
          <input
            v-model.number="hour"
            type="number"
            min="0"
            max="23"
            class="mt-1 w-full rounded border bg-transparent p-1.5"
          />
        </label>
        <label class="flex-1">
          <span class="text-muted-foreground">دقیقه</span>
          <input
            v-model.number="minute"
            type="number"
            min="0"
            max="59"
            class="mt-1 w-full rounded border bg-transparent p-1.5"
          />
        </label>
        <button
          type="button"
          class="rounded bg-sky-600 px-3 py-2 text-white"
          @click="applyTime"
        >
          تأیید
        </button>
      </div>
      <button
        v-if="!required && modelValue"
        type="button"
        class="mt-2 text-xs text-red-600"
        @click="clearValue"
      >
        پاک کردن
      </button>
    </div>
  </label>
</template>
