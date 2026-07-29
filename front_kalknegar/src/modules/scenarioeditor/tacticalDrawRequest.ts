type DrawEmitter = {
  emit: (event: string, payload?: unknown) => boolean | void;
};

type DrawRequestOptions = {
  attempts?: number;
  intervalMs?: number;
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
  { attempts = 30, intervalMs = 50 }: DrawRequestOptions = {},
) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (emitter.emit("command/entry/draw", { id })) return true;
    if (attempt < attempts - 1) await wait(intervalMs);
  }
  return false;
}
