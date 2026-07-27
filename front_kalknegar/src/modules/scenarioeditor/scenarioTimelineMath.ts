import { MS_PER_DAY } from "@/utils/time";
import { type NScenarioEvent } from "@/types/internalModels";
import type { EnvironmentalCondition, ScenarioPhase } from "@/types/scenarioModels";

export type TimelineAction = "zoomIn" | "zoomOut" | "addScenarioEvent";

export interface EventWithX {
  x: number;
  event: NScenarioEvent;
}

export interface BinWithX {
  x: number;
  count: number;
}

export interface PhaseWithX {
  x: number;
  width: number;
  phase: ScenarioPhase;
}

export interface EnvironmentWithX {
  x: number;
  width: number;
  condition: EnvironmentalCondition;
}

export interface TacticalTimelineMarker {
  t: number;
  count: number;
}

export interface TacticalMarkerWithX {
  x: number;
  count: number;
}

export interface HistogramBin {
  t: number;
  count: number;
}

export interface TimelineViewportState {
  centerTimestamp: number;
  viewportWidth: number;
  majorWidth: number;
}

export interface TimelineRenderInputs {
  events: NScenarioEvent[];
  histogram: HistogramBin[];
  tacticalMarkers?: TacticalTimelineMarker[];
  phases?: ScenarioPhase[];
  environmentalConditions?: EnvironmentalCondition[];
  minTimestamp: number;
  maxTimestamp: number;
  majorWidth: number;
  tzOffsetMinutes: number;
}

export interface TimelineRenderOutputs {
  eventsWithX: EventWithX[];
  binsWithX: BinWithX[];
  tacticalMarkersWithX: TacticalMarkerWithX[];
  phasesWithX: PhaseWithX[];
  environmentWithX: EnvironmentWithX[];
}

export function getMsPerPixel(majorWidth: number) {
  return MS_PER_DAY / majorWidth;
}

export function toLocalX(clientX: number, hostRectLeft: number) {
  return clientX - hostRectLeft;
}

export function calculatePixelDateFromViewport(
  localX: number,
  state: TimelineViewportState,
) {
  const center = state.viewportWidth / 2;
  const diff = localX - center;
  const newDate = state.centerTimestamp + diff * getMsPerPixel(state.majorWidth);
  const date = new Date(newDate);
  date.setUTCSeconds(0, 0);
  return { date, diff };
}

export function roundToNearestQuarterHour(date: Date) {
  date.setUTCMinutes(Math.round(date.getUTCMinutes() / 15) * 15);
  return date;
}

export function mapEventsToX({
  events,
  minTimestamp,
  maxTimestamp,
  majorWidth,
  tzOffsetMinutes,
}: TimelineRenderInputs) {
  const pxPerMs = majorWidth / MS_PER_DAY;
  const offsetMs = tzOffsetMinutes * 60 * 1000;
  return events
    .filter((event) => event.startTime >= minTimestamp && event.startTime <= maxTimestamp)
    .map((event) => ({
      x: (event.startTime - minTimestamp + offsetMs) * pxPerMs,
      event,
    }));
}

export function mapHistogramToX({
  histogram,
  minTimestamp,
  maxTimestamp,
  majorWidth,
  tzOffsetMinutes,
}: TimelineRenderInputs) {
  const pxPerMs = majorWidth / MS_PER_DAY;
  const offsetMs = tzOffsetMinutes * 60 * 1000;
  return histogram
    .filter((bin) => bin.t >= minTimestamp && bin.t <= maxTimestamp)
    .map((bin) => ({
      x: (bin.t - minTimestamp + offsetMs) * pxPerMs,
      count: bin.count,
    }));
}

export function mapPhasesToX({
  phases = [],
  minTimestamp,
  maxTimestamp,
  majorWidth,
  tzOffsetMinutes,
}: TimelineRenderInputs) {
  const pxPerMs = majorWidth / MS_PER_DAY;
  const offsetMs = tzOffsetMinutes * 60 * 1000;

  return phases
    .filter((phase) => {
      const start = Number(phase.startTime);
      const end = phase.endTime === undefined ? maxTimestamp : Number(phase.endTime);
      return (
        Number.isFinite(start) &&
        Number.isFinite(end) &&
        end > start &&
        start <= maxTimestamp &&
        end >= minTimestamp
      );
    })
    .map((phase) => {
      const start = Math.max(Number(phase.startTime), minTimestamp);
      const end = Math.min(
        phase.endTime === undefined ? maxTimestamp : Number(phase.endTime),
        maxTimestamp,
      );
      return {
        x: (start - minTimestamp + offsetMs) * pxPerMs,
        width: Math.max((end - start) * pxPerMs, 3),
        phase,
      };
    });
}

export function mapEnvironmentToX({
  environmentalConditions = [],
  minTimestamp,
  maxTimestamp,
  majorWidth,
  tzOffsetMinutes,
}: TimelineRenderInputs) {
  const pxPerMs = majorWidth / MS_PER_DAY;
  const offsetMs = tzOffsetMinutes * 60 * 1000;
  return environmentalConditions
    .filter((condition) => {
      const start = Number(condition.startTime);
      const end =
        condition.endTime === undefined ? maxTimestamp : Number(condition.endTime);
      return (
        Number.isFinite(start) &&
        Number.isFinite(end) &&
        end > start &&
        start <= maxTimestamp &&
        end >= minTimestamp
      );
    })
    .map((condition) => {
      const start = Math.max(Number(condition.startTime), minTimestamp);
      const end = Math.min(
        condition.endTime === undefined
          ? maxTimestamp
          : Number(condition.endTime),
        maxTimestamp,
      );
      return {
        x: (start - minTimestamp + offsetMs) * pxPerMs,
        width: Math.max((end - start) * pxPerMs, 3),
        condition,
      };
    });
}

export function collectTacticalTimelineMarkers(
  timedFeatureTuples: Array<[string, unknown]>,
): TacticalTimelineMarker[] {
  const counts = new Map<number, number>();

  timedFeatureTuples.forEach(([, states]) => {
    if (!Array.isArray(states)) return;
    states.forEach((state) => {
      if (!state || typeof state !== "object") return;
      const timestamp = Number((state as { t?: unknown }).t);
      if (!Number.isFinite(timestamp)) return;
      counts.set(timestamp, (counts.get(timestamp) ?? 0) + 1);
    });
  });

  return [...counts.entries()]
    .map(([t, count]) => ({ t, count }))
    .sort((a, b) => a.t - b.t);
}

export function mapTacticalMarkersToX({
  tacticalMarkers,
  minTimestamp,
  maxTimestamp,
  majorWidth,
  tzOffsetMinutes,
}: Omit<TimelineRenderInputs, "events" | "histogram"> & {
  tacticalMarkers: TacticalTimelineMarker[];
}) {
  const pxPerMs = majorWidth / MS_PER_DAY;
  const offsetMs = tzOffsetMinutes * 60 * 1000;
  return tacticalMarkers
    .filter((marker) => marker.t >= minTimestamp && marker.t <= maxTimestamp)
    .map((marker) => ({
      x: (marker.t - minTimestamp + offsetMs) * pxPerMs,
      count: marker.count,
    }));
}

export function buildTimelineRenderData(
  inputs: TimelineRenderInputs,
): TimelineRenderOutputs {
  return {
    eventsWithX: mapEventsToX(inputs),
    binsWithX: mapHistogramToX(inputs),
    tacticalMarkersWithX: mapTacticalMarkersToX({
      ...inputs,
      tacticalMarkers: inputs.tacticalMarkers ?? [],
    }),
    phasesWithX: mapPhasesToX(inputs),
    environmentWithX: mapEnvironmentToX(inputs),
  };
}
