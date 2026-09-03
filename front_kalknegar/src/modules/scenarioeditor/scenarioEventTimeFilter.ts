import dayjs from "@/dayjs";
import type { NScenarioEvent } from "@/types/internalModels";

export type EventTimeFilterMode = "all" | "day" | "week" | "month" | "custom";

export interface EventTimeFilterBounds {
  from: number;
  to: number;
}

function parseDateTime(value: string): number | undefined {
  if (!value) return undefined;
  const timestamp = new Date(value).valueOf();
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

export function getEventTimeFilterBounds(input: {
  mode: EventTimeFilterMode;
  currentTime: number;
  customFrom?: string;
  customTo?: string;
}): EventTimeFilterBounds | null {
  if (input.mode === "all") return null;

  if (input.mode === "custom") {
    const fromValue = parseDateTime(input.customFrom ?? "");
    const toValue = parseDateTime(input.customTo ?? "");
    const from = fromValue ?? Number.NEGATIVE_INFINITY;
    const to = toValue ?? Number.POSITIVE_INFINITY;
    return from <= to ? { from, to } : { from: to, to: from };
  }

  const current = dayjs(input.currentTime);
  if (input.mode === "day") {
    return { from: current.startOf("day").valueOf(), to: current.endOf("day").valueOf() };
  }
  if (input.mode === "week") {
    return { from: current.startOf("week").valueOf(), to: current.endOf("week").valueOf() };
  }
  return { from: current.startOf("month").valueOf(), to: current.endOf("month").valueOf() };
}

export function filterScenarioEventsByTime(
  events: NScenarioEvent[],
  bounds: EventTimeFilterBounds | null,
): NScenarioEvent[] {
  if (!bounds) return events;
  return events.filter(
    (event) => event.startTime >= bounds.from && event.startTime <= bounds.to,
  );
}
