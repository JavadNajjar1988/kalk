import type OLMap from "ol/Map";
import type { VectorSources } from "./vectorSources";
import type { VectorLayers } from "./vectorLayers";

export interface EventHandlerOptions {
    services: any;
    sources: VectorSources;
    vectorLayers: VectorLayers;
    map: OLMap;
}

declare function registerEventHandlers(options: EventHandlerOptions): void;
export default registerEventHandlers;
