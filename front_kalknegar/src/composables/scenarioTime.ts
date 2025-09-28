import { type MaybeRef } from "@vueuse/core";
import { computed, ref, unref, watch } from "vue";
import dayjs from "@/dayjs";
import { 
  jalaliFormDateFormatter,
  formatJalaliTimestamp,
  toJalali 
} from "@/utils/jalaliFormatters";

export function useDateElements({
  timestamp,
  isLocal,
  timeZone = "UTC",
}: {
  timestamp: number;
  isLocal: MaybeRef<boolean>;
  timeZone: MaybeRef<string>;
}) {
  const date = ref("");
  const hour = ref(12);
  const minute = ref(0);

  const inputDateTime = computed(() => {
    return unref(isLocal)
      ? dayjs.utc(unref(timestamp)).tz(unref(timeZone))
      : dayjs.utc(unref(timestamp));
  });
  watch(
    inputDateTime,
    (v) => {
      // استفاده از فرمت تاریخ شمسی برای فرم‌ها
      date.value = jalaliFormDateFormatter(v.valueOf());
      hour.value = v.hour();
      minute.value = v.minute();
    },
    { immediate: true },
  );

  const resDateTime = computed(() => {
    try {
      if (unref(isLocal))
        return dayjs.tz(`${date.value} ${hour.value}:${minute.value}`, unref(timeZone));
      return dayjs.utc(`${date.value} ${hour.value}:${minute.value}`);
    } catch (e) {
      return dayjs(0);
    }
  });
  return { date, hour, minute, resDateTime };
}

export function useYMDElements({
  timestamp,
  isLocal,
  timeZone = "UTC",
}: {
  timestamp: number;
  isLocal: MaybeRef<boolean>;
  timeZone: MaybeRef<string>;
}) {
  const year = ref(2000);
  const month = ref(1);
  const day = ref(1);
  const hour = ref(12);
  const minute = ref(0);

  const inputDateTime = computed(() => {
    return unref(isLocal)
      ? dayjs.utc(unref(timestamp)).tz(unref(timeZone))
      : dayjs.utc(unref(timestamp));
  });
  watch(
    inputDateTime,
    (v) => {
      // استفاده از تاریخ شمسی برای سال، ماه و روز
      const jalaliDate = v.calendar('jalali');
      year.value = jalaliDate.year();
      month.value = jalaliDate.month() + 1; // dayjs months are 0-indexed
      day.value = jalaliDate.date();
      hour.value = v.hour();
      minute.value = v.minute();
    },
    { immediate: true },
  );

  const resDateTime = computed(() => {
    try {
      // تبدیل تاریخ شمسی به میلادی برای پردازش داخلی
      // Create a Jalali date and convert back to Gregorian
      const jalaliDate = dayjs().calendar('jalali').year(year.value).month(month.value - 1).date(day.value);
      const gregorianDate = jalaliDate.calendar('gregory'); // Convert back to Gregorian
      
      if (unref(isLocal)) {
        return gregorianDate.tz(unref(timeZone)).hour(hour.value).minute(minute.value);
      }
      return gregorianDate.utc().hour(hour.value).minute(minute.value);
    } catch (e) {
      console.warn('Error converting Jalali date:', e);
      // Fallback to original logic
      if (unref(isLocal))
        return dayjs.tz(
          `${year.value}-${month.value}-${day.value} ${hour.value}:${minute.value}`,
          unref(timeZone),
        );
      return dayjs.utc(`${year.value}-${month.value}-${day.value}`);
    }
  });
  return { year, month, day, hour, minute, resDateTime };
}
