import { createFormatter, type TimeFormatSettings } from "@/stores/timeFormatStore";

export interface MapTimeDisplay {
  date: string;
  time: string;
}

const defaultMapTimeSettings: TimeFormatSettings = {
  timeFormat: "local",
  locale: "fa-IR",
  dateStyle: "long",
  timeStyle: "short",
};

export function formatMapTimeDisplay(
  timestamp: number,
  timeZone = "UTC",
  settings: TimeFormatSettings = defaultMapTimeSettings,
): MapTimeDisplay {
  return {
    date: createFormatter(timeZone, settings, { dateOnly: true })
      .format(timestamp)
      .replace(/\s+/g, " ")
      .trim(),
    time: createFormatter(timeZone, settings, { timeOnly: true }).format(timestamp),
  };
}
