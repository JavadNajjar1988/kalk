import dayjs from "dayjs";

import "@/dayjs";
import { toPersianDigits } from "@/utils";

export interface MapTimeDisplay {
  date: string;
  time: string;
}

export function formatMapTimeDisplay(timestamp: number, timeZone = "UTC"): MapTimeDisplay {
  const zonedTime = dayjs(timestamp).tz(timeZone).calendar("jalali").locale("fa");

  return {
    date: toPersianDigits(zonedTime.format("DD MMMM YYYY").replace(/\s+/g, " ").trim()),
    time: toPersianDigits(zonedTime.format("HH:mm")),
  };
}
