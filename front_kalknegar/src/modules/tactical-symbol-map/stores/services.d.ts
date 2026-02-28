import type { Ref } from "vue";
import type { StoreDefinition } from "pinia";

export declare const useServicesStore: StoreDefinition<
    "services",
    {},
    {},
    {
        projectUUID: Ref<string | null>;
        projectStore: Ref<any>;
        preferencesStore: Ref<any>;
        sessionStore: Ref<any>;
        emitter: Ref<any>;
        store: Ref<any>;
        featureStore: Ref<any>;
        searchIndex: Ref<any>;
        selection: Ref<any>;
        osdDriver: Ref<any>;
        ipcRenderer: Ref<any>;
        initialize: () => Promise<{
            projectStore: any;
            preferencesStore: any;
            sessionStore: any;
            emitter: any;
        }>;
        getServices: () => {
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
        };
    }
>;
