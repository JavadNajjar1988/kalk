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
    clipboard: null,
    undo: null,
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
        clipboard: this.clipboard,
        undo: this.undo,
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
    clipboard: { id: `clipboard:${id}` },
    undo: { id: `undo:${id}` },
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

  it("publishes map services before the search index finishes bootstrapping", async () => {
    const servicesStore = createServicesStore();
    const services = createReadyServices("staged");
    let finishBootstrap!: () => void;
    const bootstrapFinished = new Promise<void>((resolve) => {
      finishBootstrap = resolve;
    });

    initializeProjectServices.mockImplementation(async (_projectUUID, options) => {
      await options.onCoreReady(services);
      await bootstrapFinished;
      return services;
    });

    const initialization = ensureScenarioTacticalServices({
      scenarioId: "scenario-staged",
      servicesStore,
    });

    await vi.waitFor(() => {
      expect(servicesStore.store).toBe(services.store);
    });
    expect(servicesStore.featureStore).toBe(services.featureStore);
    expect(servicesStore.searchIndex).toBeNull();

    finishBootstrap();
    await initialization;

    expect(servicesStore.searchIndex).toBe(services.searchIndex);
  });

  it("resolves core and library readiness without starting a second initializer", async () => {
    const servicesStore = createServicesStore();
    const services = createReadyServices("readiness");
    let publishCore!: () => Promise<void>;
    let publishLibrary!: () => Promise<void>;
    let finishBootstrap!: () => void;
    const bootstrapFinished = new Promise<void>((resolve) => {
      finishBootstrap = resolve;
    });

    initializeProjectServices.mockImplementation(async (_projectUUID, options) => {
      publishCore = () => options.onCoreReady(services);
      publishLibrary = () => options.onLibraryReady(services);
      await bootstrapFinished;
      return services;
    });

    const coreRequest = ensureScenarioTacticalServices({
      scenarioId: "scenario-readiness",
      servicesStore,
      waitFor: "core",
    });
    const libraryRequest = ensureScenarioTacticalServices({
      scenarioId: "scenario-readiness",
      servicesStore,
      waitFor: "library",
    });
    const completeRequest = ensureScenarioTacticalServices({
      scenarioId: "scenario-readiness",
      servicesStore,
      waitFor: "complete",
    });

    await vi.waitFor(() => expect(publishCore).toBeTypeOf("function"));
    await publishCore();
    await expect(coreRequest).resolves.toBe(services);
    expect(servicesStore.store).toBe(services.store);
    expect(servicesStore.searchIndex).toBeNull();

    await publishLibrary();
    await expect(libraryRequest).resolves.toBe(services);
    expect(servicesStore.searchIndex).toBe(services.searchIndex);
    expect(initializeProjectServices).toHaveBeenCalledTimes(1);

    finishBootstrap();
    await expect(completeRequest).resolves.toBe(services);
  });
});
