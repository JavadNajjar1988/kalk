import type { Style } from "ol/style";
import type { VectorSources } from "./vectorSources";

export interface LayerStyles {
    highlightStyle: Style[];
}

declare function createLayerStyles(services: any, sources: VectorSources): LayerStyles;
export default createLayerStyles;
