export interface DayNightTimeSource {
  setTime(time: Date): void;
}

export function syncDayNightWithTimeline(source: DayNightTimeSource, timestamp: number) {
  source.setTime(new Date(timestamp));
}
