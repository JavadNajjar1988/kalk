// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { initializeProjectServices } from "./projectServices.js";

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
