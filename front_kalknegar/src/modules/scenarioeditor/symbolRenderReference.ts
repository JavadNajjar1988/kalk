import type OlMap from "ol/Map";
import { getPointResolution } from "ol/proj";
import type { SymbolRenderReference } from "@/types/scenarioModels";

const DEFAULT_POINT_SIZE_PX = 36;

export function mapRenderMetrics(map: OlMap) {
  const view = map.getView();
  const projection = view.getProjection();
  const resolution = view.getResolution() ?? 1;
  const center = view.getCenter() ?? [0, 0];
  const metersPerPixel = getPointResolution(projection, resolution, center, "m");
  return {
    resolution,
    metersPerPixel,
    scale: (metersPerPixel * 96) / 0.0254,
  };
}

export function captureSymbolRenderReference(
  map: OlMap,
  renderer: SymbolRenderReference["renderer"],
  pointSizePx = DEFAULT_POINT_SIZE_PX,
): SymbolRenderReference {
  const metrics = mapRenderMetrics(map);
  return {
    version: 1,
    renderer,
    authoredResolution: metrics.resolution,
    authoredScale: metrics.scale,
    pointSizeMeters: metrics.metersPerPixel * pointSizePx,
  };
}

export function pointSymbolScale(
  reference: SymbolRenderReference | undefined,
  currentMetersPerPixel: number,
  baseSizePx = DEFAULT_POINT_SIZE_PX,
) {
  if (!reference?.pointSizeMeters || currentMetersPerPixel <= 0) return 1;
  return reference.pointSizeMeters / currentMetersPerPixel / baseSizePx;
}
