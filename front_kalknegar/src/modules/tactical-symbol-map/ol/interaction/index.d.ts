import type OLMap from "ol/Map";
import type { VectorSources } from "../../components/map/vectorSources";
import type { LayerStyles } from "../../components/map/layerStyles";

export interface TacticalInteractionOptions {
    hitTolerance: number;
    map: OLMap;
    services: any;
    sources: VectorSources;
    styles: LayerStyles;
    recordingStore?: {
        isRecordingTacticalLocation?: boolean;
        isRecordingTacticalGeometry?: boolean;
    };
    getScenarioTime?: () => number;
    getPlaybackRange?: () => {
        start?: number;
        end?: number;
    };
}

declare function tacticalInteractions(options: TacticalInteractionOptions): void;
export default tacticalInteractions;
