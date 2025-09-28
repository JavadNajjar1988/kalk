import { computed, ref, watchEffect } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { defineStore } from "pinia";
import { injectStrict, toPersianDigits } from "@/utils";
import { activeScenarioKey } from "@/components/injects";
import { formatDateString, formatDTG } from "@/geo/utils";
import type { TScenario } from "@/scenariostore";
import type { RadioGroupItem } from "@/components/types";
import { 
  jalaliDateTimeFormatter,
  jalaliTableDateFormatter,
  formatPersianDateShort,
  formatJalaliTimestamp
} from "@/utils/jalaliFormatters";

export type TimeFormat = "iso" | "local" | "military" | "custom";

export interface TimeFormatSettings {
  timeFormat: TimeFormat;
  locale: string;
  dateStyle: Intl.DateTimeFormatOptions["dateStyle"];
  timeStyle: Intl.DateTimeFormatOptions["timeStyle"];
}

export const timeFormatItems: RadioGroupItem<TimeFormat>[] = [
  { name: "ISO 8601", value: "iso" },
  { name: "تاریخ شمسی (محلی)", value: "local" },
  { name: "نظامی DTG", value: "military" },
];

export const intlItems = [
  { label: "Full", value: "full" },
  { label: "Long", value: "long" },
  { label: "Medium", value: "medium" },
  { label: "Short", value: "short" },
];

export const useTimeFormatSettingsStore = defineStore("timeFormatSettings", {
  state: () => {
    return {
      track: useLocalStorage("trackTimeFormat", {
        timeFormat: "local",
        locale: "fa-IR", // پیش‌فرض فارسی
        dateStyle: "short",
        timeStyle: "short",
      } as TimeFormatSettings),
      scenario: useLocalStorage("scenarioTimeFormat", {
        timeFormat: "local",
        locale: "fa-IR", // پیش‌فرض فارسی
        dateStyle: "medium",
        timeStyle: "short",
      } as TimeFormatSettings),
    };
  },
});

export const useTimeFormatStore = defineStore("timeFormat", () => {
  const s = useTimeFormatSettingsStore();

  const timeZone = ref("UTC");
  const trackFormatter = computed(() => {
    return createFormatter(timeZone.value, s.track);
  });

  const scenarioFormatter = computed(() => {
    return createFormatter(timeZone.value, s.scenario);
  });

  const scenarioDateFormatter = computed(() => {
    return createFormatter(timeZone.value, s.scenario, { dateOnly: true });
  });
  return { timeZone, trackFormatter, scenarioFormatter, scenarioDateFormatter };
});

function createFormatter(
  timeZone: string,
  settings: TimeFormatSettings,
  { dateOnly = false } = {},
) {
  if (settings.timeFormat === "iso") {
    if (dateOnly) {
      return {
        format: (value: number) => toPersianDigits(formatDateString(value, timeZone).split("T")[0]),
      };
    }
    return {
      format: (value: number) => toPersianDigits(formatDateString(value, timeZone)),
    };
  }
  if (settings.timeFormat === "military") {
    return {
      format: (value: number) => toPersianDigits(formatDTG(value, timeZone)),
    };
  }
  
  // استفاده از فرمت‌کننده‌های شمسی به عنوان پیش‌فرض
  // Use Jalali formatters as default for local format
  if (settings.locale === "fa-IR" || settings.locale === "fa" || !settings.locale) {
    if (dateOnly) {
      return {
        format: (value: number) => {
          if (settings.dateStyle === "full") {
            return formatJalaliTimestamp(value, 'dddd DD MMMM YYYY');
          } else if (settings.dateStyle === "long") {
            return formatJalaliTimestamp(value, 'DD MMMM YYYY');
          } else if (settings.dateStyle === "medium") {
            return formatJalaliTimestamp(value, 'DD MMMM YYYY');
          } else {
            return formatPersianDateShort(value);
          }
        },
      };
    }
    return {
      format: (value: number) => {
        if (settings.dateStyle === "full" && settings.timeStyle === "full") {
          return formatJalaliTimestamp(value, 'dddd DD MMMM YYYY در ساعت HH:mm:ss');
        } else if (settings.dateStyle === "long") {
          return formatJalaliTimestamp(value, 'DD MMMM YYYY HH:mm');
        } else if (settings.dateStyle === "medium") {
          return formatJalaliTimestamp(value, 'DD MMMM YYYY HH:mm');
        } else {
          return jalaliDateTimeFormatter(value);
        }
      },
    };
  }
  
  // Fallback to Intl.DateTimeFormat for non-Persian locales
  if (dateOnly) {
    const formatter = new Intl.DateTimeFormat(settings.locale || undefined, {
      timeZone,
      dateStyle: settings.dateStyle,
    });
    return {
      format: (value: number) => toPersianDigits(formatter.format(value)),
    };
  }
  const formatter = new Intl.DateTimeFormat(settings.locale || undefined, {
    timeZone,
    dateStyle: settings.dateStyle,
    timeStyle: settings.timeStyle,
  });
  return {
    format: (value: number) => toPersianDigits(formatter.format(value)),
  };
}

export function useTimeFormatterProvider(options: { activeScenario?: TScenario } = {}) {
  const { store } = options.activeScenario || injectStrict(activeScenarioKey);
  const s = useTimeFormatStore();
  watchEffect(() => {
    const { state } = store;
    const tz = state.info.timeZone;
    s.timeZone = tz ?? "UTC";
  });
}
