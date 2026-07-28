export type TacticalEmitter = {
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler: (...args: any[]) => void) => void;
  emit: (event: string, payload?: unknown) => void;
};

export function cancelTacticalErase(emitter?: TacticalEmitter | null) {
  emitter?.emit("command/erase/cancel");
}
