import dayjs from "@/dayjs";
import { INTERNAL_NAMES, TIMESTAMP_NAMES } from "@/types/internalModels";

function collectTacticalTimedStates(value: any): WeakSet<object> {
  const timedStates = new WeakSet<object>();
  const tuples = value?.metadata?.tacticalSymbols?.tuples;

  if (!Array.isArray(tuples)) return timedStates;

  for (const tuple of tuples) {
    if (
      !Array.isArray(tuple) ||
      typeof tuple[0] !== "string" ||
      !tuple[0].startsWith("timed+feature:") ||
      !Array.isArray(tuple[1])
    ) {
      continue;
    }

    for (const state of tuple[1]) {
      if (state && typeof state === "object") {
        timedStates.add(state);
      }
    }
  }

  return timedStates;
}

export function stringifyScenarioObject(value: any, timeZone = "UTC"): string {
  const tacticalTimedStates = collectTacticalTimedStates(value);

  return JSON.stringify(
    value,
    function (name, val) {
      if (name === "t" && tacticalTimedStates.has(this)) return val;
      if (val === undefined) return undefined;
      if (INTERNAL_NAMES.includes(name)) return undefined;
      if (TIMESTAMP_NAMES.includes(name)) {
        return dayjs(val).tz(timeZone).format();
      }
      return val;
    },
    "  ",
  );
}
