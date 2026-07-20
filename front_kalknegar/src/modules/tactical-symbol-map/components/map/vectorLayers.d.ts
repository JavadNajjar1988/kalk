import type VectorLayer from "ol/layer/Vector";
import type { VectorSources } from "./vectorSources";
import type { LayerStyles } from "./layerStyles";

export interface VectorLayers {
    featureLayer: VectorLayer;
    highlightLayer: VectorLayer;
    selectedLayer: VectorLayer;
}

declare function createVectorLayers(sources: VectorSources, styles: LayerStyles): VectorLayers;
export default createVectorLayers;
