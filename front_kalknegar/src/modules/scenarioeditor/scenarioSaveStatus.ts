export type ScenarioSaveState = "idle" | "saving" | "saved" | "error";
export type ScenarioSaveTone = "muted" | "dirty" | "saving" | "saved" | "error";

export interface ScenarioSaveStatusInput {
  isDemoScenario: boolean;
  saveState: ScenarioSaveState;
  dirty: boolean;
  lastSavedAt: Date | null;
  locale?: string;
  timeZone?: string;
}

export interface ScenarioSaveStatus {
  label: string;
  title: string;
  tone: ScenarioSaveTone;
}

export function buildScenarioSaveDotClass(tone: ScenarioSaveTone) {
  switch (tone) {
    case "saving":
      return "animate-pulse bg-sky-500";
    case "saved":
      return "bg-emerald-500";
    case "dirty":
      return "bg-amber-500";
    case "error":
      return "bg-red-500";
    default:
      return "bg-slate-400";
  }
}

function formatSavedTime(date: Date, locale: string, timeZone?: string) {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(date);
}

export function buildScenarioSaveStatus({
  isDemoScenario,
  saveState,
  dirty,
  lastSavedAt,
  locale = "fa-IR",
  timeZone,
}: ScenarioSaveStatusInput): ScenarioSaveStatus {
  if (isDemoScenario) {
    return {
      label: "نمونه؛ ذخیره خودکار غیرفعال",
      title: "سناریوهای نمونه به صورت خودکار ذخیره نمی‌شوند.",
      tone: "muted",
    };
  }

  if (saveState === "saving") {
    return {
      label: "در حال ذخیره...",
      title: "تغییرات در حال ذخیره در سناریوی فعلی است.",
      tone: "saving",
    };
  }

  if (saveState === "error") {
    return {
      label: "خطا در ذخیره",
      title: "آخرین تلاش ذخیره ناموفق بود. تغییرات بعدی دوباره ذخیره می‌شوند.",
      tone: "error",
    };
  }

  if (dirty) {
    return {
      label: "ذخیره نشده",
      title: "تغییرات جدید هنوز ذخیره نشده‌اند.",
      tone: "dirty",
    };
  }

  if (lastSavedAt) {
    return {
      label: `ذخیره شد ${formatSavedTime(lastSavedAt, locale, timeZone)}`,
      title: "آخرین تغییرات در سناریوی فعلی ذخیره شده‌اند.",
      tone: "saved",
    };
  }

  return {
    label: "ذخیره خودکار فعال",
    title: "تغییرات این سناریو به صورت خودکار ذخیره می‌شوند.",
    tone: "muted",
  };
}
