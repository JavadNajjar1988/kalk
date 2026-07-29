import type { EntityId } from "@/types/base";
import type { BoundaryEchelonCode } from "@/symbology/boundaryEchelons";

type DrawEmitter = {
  emit: (event: string, payload?: unknown) => boolean | void;
};

export interface BoundaryDrawOptions {
  echelonCode: BoundaryEchelonCode;
  leftUnitId?: EntityId;
  rightUnitId?: EntityId;
  leftDesignation?: string;
  rightDesignation?: string;
}

type DrawRequestOptions = {
  attempts?: number;
  intervalMs?: number;
  boundary?: BoundaryDrawOptions;
};

const wait = (delay: number) =>
  new Promise<void>((resolve) => globalThis.setTimeout(resolve, delay));

/**
 * The symbol search can finish a little before tactical map interactions are
 * registered. Retry only while no draw listener exists; once accepted, the
 * command is emitted exactly once.
 */
export async function requestTacticalDraw(
  emitter: DrawEmitter,
  id: string,
  { attempts = 30, intervalMs = 50, boundary }: DrawRequestOptions = {},
) {
  const command = boundary ? { id, boundary } : { id };
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (emitter.emit("command/entry/draw", command)) return true;
    if (attempt < attempts - 1) await wait(intervalMs);
  }
  return false;
}
