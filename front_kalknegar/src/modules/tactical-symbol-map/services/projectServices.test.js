// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  chooseProjectServices,
  initializeProjectServices,
} from "./projectServices.js";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function createLocalStorageMock() {
  const values = new Map();
  return {
    getItem: vi.fn((key) => values.get(key) ?? null),
    setItem: vi.fn((key, value) => values.set(key, String(value))),
    removeItem: vi.fn((key) => values.delete(key)),
    clear: vi.fn(() => values.clear()),
  };
}

describe("initializeProjectServices", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
    vi.stubGlobal("crypto", { randomUUID: () => "test-uuid" });
  });

  it("falls back to an in-memory database when browser IndexedDB is unavailable", async () => {
    const services = await initializeProjectServices("test-no-indexeddb");

    expect(services.store).toBeTruthy();
    expect(services.searchIndex).toBeTruthy();
    expect(services.preferencesStore).toBeTruthy();
    expect(services.store.tuples).toBeTypeOf("function");
  }, 30000);

  it("publishes only the service instance that survives fallback", async () => {
    const publishedCores = [];
    const services = await initializeProjectServices("test-atomic-fallback", {
      onCoreReady: (coreServices) => {
        publishedCores.push(coreServices);
      },
    });

    expect(publishedCores).toHaveLength(1);
    expect(publishedCores[0].emitter).toBe(services.emitter);
    expect(publishedCores[0].store).toBe(services.store);
  }, 30000);
});

describe("chooseProjectServices", () => {
  it("keeps the persistent service when timeout fires after core readiness", async () => {
    const persistent = { emitter: {}, store: {} };
    const persistentDone = deferred();
    const timeout = deferred();
    const onCoreReady = vi.fn();
    const startFallback = vi.fn();

    const result = chooseProjectServices({
      startPersistent: async (publishCore) => {
        await publishCore(persistent);
        return persistentDone.promise;
      },
      startFallback,
      timeout: timeout.promise,
      onCoreReady,
    });

    await vi.waitFor(() => expect(onCoreReady).toHaveBeenCalledWith(persistent));
    timeout.reject(new Error("timeout"));
    await Promise.resolve();
    expect(startFallback).not.toHaveBeenCalled();

    persistentDone.resolve(persistent);
    await expect(result).resolves.toBe(persistent);
    expect(startFallback).not.toHaveBeenCalled();
  });

  it("uses fallback when persistent startup fails before core readiness", async () => {
    const failure = new Error("indexeddb unavailable");
    const fallback = { emitter: {}, store: {} };
    const onCoreReady = vi.fn();
    const startFallback = vi.fn(async (publishCore) => {
      await publishCore(fallback);
      return fallback;
    });

    await expect(chooseProjectServices({
      startPersistent: async () => {
        throw failure;
      },
      startFallback,
      timeout: new Promise(() => {}),
      onCoreReady,
    })).resolves.toBe(fallback);

    expect(startFallback).toHaveBeenCalledOnce();
    expect(onCoreReady).toHaveBeenCalledTimes(1);
    expect(onCoreReady).toHaveBeenCalledWith(fallback);
  });

  it("does not publish a late persistent core after fallback starts", async () => {
    const persistentGate = deferred();
    const timeout = deferred();
    const persistent = { emitter: { id: "persistent" }, store: {} };
    const fallback = { emitter: { id: "fallback" }, store: {} };
    const onCoreReady = vi.fn();

    const result = chooseProjectServices({
      startPersistent: async (publishCore) => {
        await persistentGate.promise;
        await publishCore(persistent);
        return persistent;
      },
      startFallback: async (publishCore) => {
        await publishCore(fallback);
        return fallback;
      },
      timeout: timeout.promise,
      onCoreReady,
    });

    timeout.reject(new Error("timeout"));
    await expect(result).resolves.toBe(fallback);
    persistentGate.resolve();
    await Promise.resolve();

    expect(onCoreReady).toHaveBeenCalledTimes(1);
    expect(onCoreReady).toHaveBeenCalledWith(fallback);
  });

  it("propagates persistent failure after its core was published", async () => {
    const persistent = { emitter: {}, store: {} };
    const persistentDone = deferred();
    const startFallback = vi.fn();
    const failure = new Error("schema failed");

    const result = chooseProjectServices({
      startPersistent: async (publishCore) => {
        await publishCore(persistent);
        return persistentDone.promise;
      },
      startFallback,
      timeout: new Promise(() => {}),
      onCoreReady: vi.fn(),
    });

    persistentDone.reject(failure);
    await expect(result).rejects.toBe(failure);
    expect(startFallback).not.toHaveBeenCalled();
  });
});
