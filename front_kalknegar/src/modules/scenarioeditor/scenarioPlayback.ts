export type PlaybackLoopRange = {
  start: number;
  end: number;
};

export function hasEventPlaybackLoopRange(eventTimes: number[]) {
  return getSortedEventTimes(eventTimes).length > 2;
}

export function getEventPlaybackLoopRange(
  eventTimes: number[],
): PlaybackLoopRange | null {
  const sortedTimes = getSortedEventTimes(eventTimes);
  if (sortedTimes.length <= 2) return null;

  return {
    start: sortedTimes[0],
    end: sortedTimes[sortedTimes.length - 1],
  };
}

export function advanceScenarioPlaybackTime(input: {
  currentTime: number;
  speedPerSecond: number;
  elapsedMs: number;
  looping: boolean;
  eventTimes: number[];
}) {
  const elapsedSeconds = input.elapsedMs / 1000;
  const timeStep = input.speedPerSecond * elapsedSeconds;
  const nextTime = input.currentTime + timeStep;
  if (!input.looping || timeStep === 0) return nextTime;

  const range = getEventPlaybackLoopRange(input.eventTimes);
  if (!range) return nextTime;

  if (nextTime >= range.end) return range.start;

  return nextTime;
}

function getSortedEventTimes(eventTimes: number[]) {
  return eventTimes
    .filter((eventTime) => Number.isFinite(eventTime))
    .sort((a, b) => a - b);
}
