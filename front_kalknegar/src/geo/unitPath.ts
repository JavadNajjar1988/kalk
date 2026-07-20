import type { Position } from "geojson";

export type PathMode = "straight" | "curved";

export interface BuildUnitPathOptions {
  samplesPerSegment?: number;
}

function clonePosition(position: Position): Position {
  return [...position];
}

function catmullRomPoint(
  p0: Position,
  p1: Position,
  p2: Position,
  p3: Position,
  t: number,
): Position {
  const t2 = t * t;
  const t3 = t2 * t;
  const x =
    0.5 *
    (2 * p1[0] +
      (-p0[0] + p2[0]) * t +
      (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
      (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
  const y =
    0.5 *
    (2 * p1[1] +
      (-p0[1] + p2[1]) * t +
      (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
      (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);

  return p1.length > 2 ? [x, y, p1[2]] : [x, y];
}

export function buildUnitPathCoordinates(
  coordinates: Position[],
  mode: PathMode = "straight",
  options: BuildUnitPathOptions = {},
): Position[] {
  if (mode !== "curved" || coordinates.length < 3) {
    return coordinates.map(clonePosition);
  }

  const samplesPerSegment = Math.max(4, Math.min(options.samplesPerSegment ?? 16, 48));
  const result: Position[] = [clonePosition(coordinates[0])];

  for (let i = 0; i < coordinates.length - 1; i++) {
    const p0 = coordinates[Math.max(0, i - 1)];
    const p1 = coordinates[i];
    const p2 = coordinates[i + 1];
    const p3 = coordinates[Math.min(coordinates.length - 1, i + 2)];

    for (let sample = 1; sample <= samplesPerSegment; sample++) {
      const t = sample / samplesPerSegment;
      result.push(
        sample === samplesPerSegment
          ? clonePosition(p2)
          : catmullRomPoint(p0, p1, p2, p3, t),
      );
    }
  }

  return result;
}
