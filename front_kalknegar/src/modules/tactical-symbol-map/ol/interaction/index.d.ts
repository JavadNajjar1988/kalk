import type OLMap from "ol/Map";
import type { VectorSources } from "../../components/map/vectorSources";
import type { LayerStyles } from "../../components/map/layerStyles";

export interface TacticalInteractionOptions {
    hitTolerance: number;
    map: OLMap;
    services: any;
    sources: VectorSources;
    styles: LayerStyles;
}

declare function tacticalInteractions(options: TacticalInteractionOptions): void;
export default tacticalInteractions;
