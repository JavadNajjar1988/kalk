import { initializeProjectServices } from "@/modules/tactical-symbol-map/services/projectServices.js";
import {
  getTacticalSnapshotFromMetadata,
  importTacticalSnapshot,
  tacticalProjectUUIDForScenarioId,
} from "@/modules/tactical-symbol-map/services/scenarioSnapshot";

type ServicesStoreLike = {
  projectUUID: string | null;
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
  getServices: () => any;
};

interface EnsureScenarioServicesOptions {
  scenarioId: string;
  metadata?: Record<string, any>;
  servicesStore: ServicesStoreLike;
}

function hasReadyServices(services: any): boolean {
  return Boolean(
    services?.store &&
      services?.featureStore &&
      services?.searchIndex &&
      services?.emitter &&
      services?.sessionStore &&
      services?.selection &&
      services?.osdDriver &&
      services?.ipcRenderer,
  );
}

export async function ensureScenarioTacticalServices({
  scenarioId,
  metadata,
  servicesStore,
}: EnsureScenarioServicesOptions) {
  const projectUUID = tacticalProjectUUIDForScenarioId(scenarioId);
  const currentServices = servicesStore.getServices();

  if (servicesStore.projectUUID === projectUUID && hasReadyServices(currentServices)) {
    return currentServices;
  }

  const projectServices = await initializeProjectServices(projectUUID);
  const snapshot = getTacticalSnapshotFromMetadata(metadata);
  if (snapshot) {
    await importTacticalSnapshot(projectServices.store, snapshot);
  }

  servicesStore.projectUUID = projectUUID;
  servicesStore.projectStore = projectServices.projectStore;
  servicesStore.preferencesStore = projectServices.preferencesStore;
  servicesStore.sessionStore = projectServices.sessionStore;
  servicesStore.emitter = projectServices.emitter;
  servicesStore.store = projectServices.store;
  servicesStore.featureStore = projectServices.featureStore;
  servicesStore.searchIndex = projectServices.searchIndex;
  servicesStore.selection = projectServices.selection;
  servicesStore.osdDriver = projectServices.osdDriver;
  servicesStore.ipcRenderer = projectServices.ipcRenderer;

  return projectServices;
}
