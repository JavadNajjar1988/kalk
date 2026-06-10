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
    const projectServices = await initializeProjectServices(projectUUID);
    const snapshot = getTacticalSnapshotFromMetadata(metadata);
    if (snapshot) {
      await importTacticalSnapshot(projectServices.store, snapshot);
    }

    // Write into servicesStore so map-layer bootstrapping can observe readiness.
    (servicesStore as any).projectUUID =
      writeMaybeRef((servicesStore as any).projectUUID, projectUUID) ??
      (servicesStore as any).projectUUID;
    (servicesStore as any).projectStore =
      writeMaybeRef((servicesStore as any).projectStore, projectServices.projectStore) ??
      (servicesStore as any).projectStore;
    (servicesStore as any).preferencesStore =
      writeMaybeRef(
        (servicesStore as any).preferencesStore,
        projectServices.preferencesStore,
      ) ?? (servicesStore as any).preferencesStore;
    (servicesStore as any).sessionStore =
      writeMaybeRef((servicesStore as any).sessionStore, projectServices.sessionStore) ??
      (servicesStore as any).sessionStore;
    (servicesStore as any).emitter =
      writeMaybeRef((servicesStore as any).emitter, projectServices.emitter) ??
      (servicesStore as any).emitter;
    (servicesStore as any).store =
      writeMaybeRef((servicesStore as any).store, projectServices.store) ??
      (servicesStore as any).store;
    (servicesStore as any).featureStore =
      writeMaybeRef((servicesStore as any).featureStore, projectServices.featureStore) ??
      (servicesStore as any).featureStore;
    (servicesStore as any).searchIndex =
      writeMaybeRef((servicesStore as any).searchIndex, projectServices.searchIndex) ??
      (servicesStore as any).searchIndex;
    (servicesStore as any).selection =
      writeMaybeRef((servicesStore as any).selection, projectServices.selection) ??
      (servicesStore as any).selection;
    (servicesStore as any).osdDriver =
      writeMaybeRef((servicesStore as any).osdDriver, projectServices.osdDriver) ??
      (servicesStore as any).osdDriver;
    (servicesStore as any).ipcRenderer =
      writeMaybeRef((servicesStore as any).ipcRenderer, projectServices.ipcRenderer) ??
      (servicesStore as any).ipcRenderer;

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
