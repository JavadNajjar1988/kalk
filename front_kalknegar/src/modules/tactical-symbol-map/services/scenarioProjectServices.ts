import { initializeProjectServices } from "@/modules/tactical-symbol-map/services/projectServices.js";
import {
  getTacticalSnapshotFromMetadata,
  importTacticalSnapshot,
  tacticalProjectUUIDForScenarioId,
} from "@/modules/tactical-symbol-map/services/scenarioSnapshot";

type ServicesStoreLike = {
  projectUUID: any;
  projectStore: any;
  preferencesStore: any;
  sessionStore: any;
  emitter: any;
  store: any;
  featureStore: any;
  searchIndex: any;
  selection: any;
  osdDriver: any;
  ipcRenderer: any;
  clipboard?: any;
  undo?: any;
  getServices: () => any;
};

interface EnsureScenarioServicesOptions {
  scenarioId: string;
  metadata?: Record<string, any>;
  servicesStore: ServicesStoreLike;
}

const initializationByProjectUUID = new Map<string, Promise<any>>();

function hasReadyServices(services: any): boolean {
  return Boolean(
    services?.store &&
      services?.featureStore &&
      services?.searchIndex &&
      services?.emitter &&
      services?.sessionStore &&
      services?.selection &&
      services?.osdDriver &&
      services?.ipcRenderer &&
      services?.clipboard &&
      services?.undo,
  );
}

export async function ensureScenarioTacticalServices({
  scenarioId,
  metadata,
  servicesStore,
}: EnsureScenarioServicesOptions) {
  const projectUUID = tacticalProjectUUIDForScenarioId(scenarioId);
  const currentServices = servicesStore.getServices();

  // Pinia setup-stores expose refs for state fields. Support both "ref" and "plain value" stores.
  const readMaybeRef = (v: any) =>
    v && typeof v === "object" && Object.prototype.hasOwnProperty.call(v, "value")
      ? v.value
      : v;
  const writeMaybeRef = (target: any, value: any) => {
    if (
      target &&
      typeof target === "object" &&
      Object.prototype.hasOwnProperty.call(target, "value")
    ) {
      target.value = value;
    } else return value;
  };

  if (
    readMaybeRef((servicesStore as any).projectUUID) === projectUUID &&
    hasReadyServices(currentServices)
  ) {
    return currentServices;
  }

  const existingInitialization = initializationByProjectUUID.get(projectUUID);
  if (existingInitialization) {
    return existingInitialization;
  }

  const initialization = (async () => {
    const snapshot = getTacticalSnapshotFromMetadata(metadata);
    const hydratedStores = new WeakSet<object>();

    const hydrateSnapshot = async (projectServices: any) => {
      const tacticalStore = projectServices?.store;
      if (!snapshot || !tacticalStore || hydratedStores.has(tacticalStore)) {
        return;
      }
      await importTacticalSnapshot(tacticalStore, snapshot);
      hydratedStores.add(tacticalStore);
    };

    const writeService = (key: keyof ServicesStoreLike, value: any) => {
      if (value === undefined) return;
      (servicesStore as any)[key] =
        writeMaybeRef((servicesStore as any)[key], value) ??
        (servicesStore as any)[key];
    };

    const publishServices = (projectServices: any, includeSearchIndex: boolean) => {
      writeService("projectUUID", projectUUID);
      writeService("projectStore", projectServices.projectStore);
      writeService("preferencesStore", projectServices.preferencesStore);
      writeService("sessionStore", projectServices.sessionStore);
      writeService("emitter", projectServices.emitter);
      writeService("store", projectServices.store);
      writeService("featureStore", projectServices.featureStore);
      if (includeSearchIndex) {
        writeService("searchIndex", projectServices.searchIndex);
      }
      writeService("selection", projectServices.selection);
      writeService("osdDriver", projectServices.osdDriver);
      writeService("ipcRenderer", projectServices.ipcRenderer);
      writeService("clipboard", projectServices.clipboard);
      writeService("undo", projectServices.undo);
    };

    const projectServices = await initializeProjectServices(projectUUID, {
      onCoreReady: async (coreServices: any) => {
        await hydrateSnapshot(coreServices);
        // Publish only what map rendering needs. The symbol search index is
        // published after its full bootstrap completes below.
        publishServices(coreServices, false);
      },
    });

    // Mock/legacy initializers may not invoke onCoreReady.
    await hydrateSnapshot(projectServices);
    publishServices(projectServices, true);

    return projectServices;
  })();

  initializationByProjectUUID.set(projectUUID, initialization);
  try {
    return await initialization;
  } finally {
    if (initializationByProjectUUID.get(projectUUID) === initialization) {
      initializationByProjectUUID.delete(projectUUID);
    }
  }
}
