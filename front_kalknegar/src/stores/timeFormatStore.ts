import { computed, ref, watchEffect } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { defineStore } from "pinia";
import { injectStrict } from "@/utils";
import { activeScenarioKey } from "@/components/injects";
import type { TScenario } from "@/scenariostore";
import type { RadioGroupItem } from "@/components/types";

export type TimeFormat = "iso" | "local" | "military" | "custom";

export interface TimeFormatSettings {
  timeFormat: TimeFormat;
  locale: string;
  dateStyle: Intl.DateTimeFormatOptions["dateStyle"];
  timeStyle: Intl.DateTimeFormatOptions["timeStyle"];
}

export const timeFormatItems: RadioGroupItem<TimeFormat>[] = [
  { name: "تاریخ و زمان شمسی", value: "local" },
];

export const intlItems = [
  { label: "کامل", value: "full" },
  { label: "بلند", value: "long" },
  { label: "متوسط", value: "medium" },
  { label: "کوتاه", value: "short" },
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

export function createFormatter(
  timeZone: string,
  settings: TimeFormatSettings,
  { dateOnly = false } = {},
) {
  const buildFormatter = (locale: string, zone: string) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: zone,
      dateStyle: settings.dateStyle,
      ...(dateOnly ? {} : { timeStyle: settings.timeStyle }),
    });

  try {
    return buildFormatter(settings.locale, timeZone);
  } catch {
    return buildFormatter("fa-IR", "UTC");
  }
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
