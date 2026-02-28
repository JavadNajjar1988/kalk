export interface VectorSources {
    featureSource: any;
    highlightSource: any;
    selectedSource: any;
    deselectedSource: any;
    modifiableSource: any;
    selectableSource: any;
    visibleSource: any;
}

declare function vectorSources(services: any): Promise<VectorSources>;
export default vectorSources;
