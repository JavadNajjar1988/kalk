export declare function initializeProjectServices(
    projectUUID: string,
    options?: {
        onCoreReady?: (services: any) => void | Promise<void>;
        onLibraryReady?: (services: any) => void | Promise<void>;
    },
): Promise<{
    emitter: any;
    projectStore: any;
    preferencesStore: any;
    sessionStore: any;
    store: any;
    tileLayerStore: any;
    spatialIndex: any;
    featureStore: any;
    documentStore: any;
    searchIndex: any;
    coordinatesFormat: any;
    optionStore: any;
    undo: any;
    selection: any;
    osdDriver: any;
    ipcRenderer: any;
    clipboard: any;
    jsonDB: any;
    wkbDB: any;
    replicationProvider: { disabled: boolean };
    signals: Record<string, any>;
    commandRegistry: any;
}>;

export declare function chooseProjectServices(options: {
    startPersistent: (onCoreReady: (services: any) => void | Promise<void>) => Promise<any>;
    startFallback: (
        onCoreReady: (services: any) => void | Promise<void>,
        error: unknown,
    ) => Promise<any>;
    timeout: Promise<never>;
    onCoreReady?: (services: any) => void | Promise<void>;
}): Promise<any>;

export declare function bootstrapProjectIndexes(options: {
    services: any;
    tileLayerStore: { bootstrap: () => Promise<void> };
    spatialIndex: { bootstrap: () => Promise<void> };
    searchIndex: { bootstrap: () => Promise<void> };
    onLibraryReady?: (services: any) => void | Promise<void>;
}): Promise<void>;
