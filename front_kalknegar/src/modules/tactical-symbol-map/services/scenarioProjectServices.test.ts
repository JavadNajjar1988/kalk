import { beforeEach, describe, expect, it, vi } from "vitest";
import { ensureScenarioTacticalServices } from "./scenarioProjectServices";

const { initializeProjectServices } = vi.hoisted(() => ({
  initializeProjectServices: vi.fn(),
}));

vi.mock("@/modules/tactical-symbol-map/services/projectServices.js", () => ({
  initializeProjectServices,
}));

function createServicesStore() {
  return {
    projectUUID: null as string | null,
    projectStore: null,
    preferencesStore: null,
    sessionStore: null,
    emitter: null,
    store: null,
    featureStore: null,
    searchIndex: null,
    selection: null,
    osdDriver: null,
    ipcRenderer: null,
    getServices() {
      return {
        projectUUID: this.projectUUID,
        projectStore: this.projectStore,
        preferencesStore: this.preferencesStore,
        sessionStore: this.sessionStore,
        emitter: this.emitter,
        store: this.store,
        featureStore: this.featureStore,
        searchIndex: this.searchIndex,
        selection: this.selection,
        osdDriver: this.osdDriver,
        ipcRenderer: this.ipcRenderer,
      };
    },
  };
}

function createReadyServices(id: string) {
  return {
    projectStore: { id: `projectStore:${id}` },
    preferencesStore: { id: `preferencesStore:${id}` },
    sessionStore: { id: `sessionStore:${id}` },
    emitter: { id: `emitter:${id}` },
    store: { id: `store:${id}` },
    featureStore: { id: `featureStore:${id}` },
    searchIndex: { id: `searchIndex:${id}` },
    selection: { id: `selection:${id}` },
    osdDriver: { id: `osdDriver:${id}` },
    ipcRenderer: { id: `ipcRenderer:${id}` },
  };
}

describe("ensureScenarioTacticalServices", () => {
  beforeEach(() => {
    initializeProjectServices.mockReset();
  });

  it("shares one in-flight initialization for the same scenario", async () => {
    const servicesStore = createServicesStore();
    const services = createReadyServices("shared");

    initializeProjectServices.mockResolvedValue(services);

    const first = ensureScenarioTacticalServices({
      scenarioId: "scenario-1",
      servicesStore,
    });
    const second = ensureScenarioTacticalServices({
      scenarioId: "scenario-1",
      servicesStore,
    });

    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(initializeProjectServices).toHaveBeenCalledTimes(1);
    expect(firstResult).toBe(services);
    expect(secondResult).toBe(services);
    expect(servicesStore.store).toBe(services.store);
  });
});
