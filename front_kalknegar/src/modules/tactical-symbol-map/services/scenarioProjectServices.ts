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
  waitFor?: Readiness;
}

type Readiness = "core" | "library" | "complete";

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
};

type InitializationRecord = Record<Readiness, Deferred<any>>;

const initializationByProjectUUID = new Map<string, InitializationRecord>();

function createDeferred<T>(): Deferred<T> {
  let settled = false;
  let resolvePromise!: (value: T) => void;
  let rejectPromise!: (error: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return {
    promise,
    resolve(value) {
      if (settled) return;
      settled = true;
      resolvePromise(value);
    },
    reject(error) {
      if (settled) return;
      settled = true;
      rejectPromise(error);
    },
  };
}

function createInitializationRecord(): InitializationRecord {
  return {
    core: createDeferred(),
    library: createDeferred(),
    complete: createDeferred(),
  };
}

function hasCoreServices(services: any): boolean {
  return Boolean(
    services?.store &&
      services?.featureStore &&
      services?.emitter &&
      services?.sessionStore &&
      services?.selection &&
      services?.osdDriver &&
      services?.ipcRenderer &&
      services?.clipboard &&
      services?.undo,
  );
}

function hasLibraryServices(services: any): boolean {
  return hasCoreServices(services) && Boolean(services?.searchIndex);
}

const readMaybeRef = (value: any) =>
  value &&
  typeof value === "object" &&
  Object.prototype.hasOwnProperty.call(value, "value")
    ? value.value
    : value;

const writeMaybeRef = (target: any, value: any) => {
  if (
    target &&
    typeof target === "object" &&
    Object.prototype.hasOwnProperty.call(target, "value")
  ) {
    target.value = value;
    return target;
  }
  return value;
};

export async function ensureScenarioTacticalServices({
  scenarioId,
  metadata,
  servicesStore,
  waitFor = "complete",
}: EnsureScenarioServicesOptions) {
  const projectUUID = tacticalProjectUUIDForScenarioId(scenarioId);
  const currentServices = servicesStore.getServices();

  const existingInitialization = initializationByProjectUUID.get(projectUUID);
  if (existingInitialization) {
    return existingInitialization[waitFor].promise;
  }

  if (readMaybeRef((servicesStore as any).projectUUID) === projectUUID) {
    if (waitFor === "core" && hasCoreServices(currentServices)) {
      return currentServices;
    }
    if (waitFor !== "core" && hasLibraryServices(currentServices)) {
      return currentServices;
    }
  }

  const record = createInitializationRecord();
  initializationByProjectUUID.set(projectUUID, record);

  void (async () => {
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

    try {
      const projectServices = await initializeProjectServices(projectUUID, {
        onCoreReady: async (coreServices: any) => {
          await hydrateSnapshot(coreServices);
          publishServices(coreServices, false);
          record.core.resolve(coreServices);
        },
        onLibraryReady: async (libraryServices: any) => {
          await hydrateSnapshot(libraryServices);
          publishServices(libraryServices, true);
          record.core.resolve(libraryServices);
          record.library.resolve(libraryServices);
        },
      });

      // Mock/legacy initializers may omit one or both staged callbacks.
      await hydrateSnapshot(projectServices);
      publishServices(projectServices, true);
      record.core.resolve(projectServices);
      record.library.resolve(projectServices);
      record.complete.resolve(projectServices);
    } catch (error) {
      record.core.reject(error);
      record.library.reject(error);
      record.complete.reject(error);
    } finally {
      if (initializationByProjectUUID.get(projectUUID) === record) {
        initializationByProjectUUID.delete(projectUUID);
      }
    }
  })();

  return record[waitFor].promise;
}
