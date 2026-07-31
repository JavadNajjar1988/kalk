import Feature from "ol/Feature";
import GeoJSON from "ol/format/GeoJSON";
import type Geometry from "ol/geom/Geometry";
import type Draw from "ol/interaction/Draw";
import VectorLayer from "ol/layer/Vector";
import type OlMap from "ol/Map";
import VectorSource from "ol/source/Vector";
import { unByKey } from "ol/Observable";
import type { EventsKey } from "ol/events";
import type {
  EnvironmentalCondition,
  SymbolRenderReference,
} from "@/types/scenarioModels";
import type { MetocSymbol } from "./metocCatalog";
import { renderMetocGeometry, renderMetocIcon } from "./metocRenderer";
import { environmentFeatureStyle } from "./environmentMapLayer";

interface Options {
  map: OlMap;
  symbol: MetocSymbol;
  reference: SymbolRenderReference;
  name?: string;
  parameters?: EnvironmentalCondition["parameters"];
}

function geometryPointCount(geometry: GeoJSON.Geometry) {
  if (geometry.type === "Point") return 1;
  if (geometry.type === "LineString") return geometry.coordinates.length;
  if (geometry.type === "Polygon") {
    const ring = geometry.coordinates[0] ?? [];
    const first = ring[0];
    const last = ring[ring.length - 1];
    return ring.length > 1 && first?.[0] === last?.[0] && first?.[1] === last?.[1]
      ? ring.length - 1
      : ring.length;
  }
  return 0;
}

export function createMetocLivePreview({
  map,
  symbol,
  reference,
  name,
  parameters = {},
}: Options) {
  const source = new VectorSource();
  const layer = new VectorLayer({
    source,
    zIndex: 101,
    updateWhileInteracting: true,
    style: environmentFeatureStyle,
  });
  const format = new GeoJSON();
  const projection = map.getView().getProjection();
  const metersPerUnit = projection.getMetersPerUnit() ?? 1;
  const condition: EnvironmentalCondition = {
    id: `preview:${symbol.sidc}`,
    name,
    kind: "metoc",
    scope: "area",
    startTime: 0,
    parameters,
    metocSidc: symbol.sidc,
    renderReference: reference,
  };
  let revision = 0;
  let timer: number | undefined;
  let geometryListener: EventsKey | undefined;
  let drawStartListener: EventsKey | undefined;
  let drawAbortListener: EventsKey | undefined;
  let disposed = false;
  let latestArtifact: GeoJSON.FeatureCollection | undefined;

  map.addLayer(layer);

  function geometryObject(feature: Feature<Geometry>) {
    return format.writeGeometryObject(feature.getGeometry()!, {
      featureProjection: projection,
      dataProjection: "EPSG:4326",
    });
  }

  function showFallback(feature: Feature<Geometry>) {
    const preview = feature.clone();
    preview.set("condition", condition);
    preview.set("metersPerUnit", metersPerUnit);
    source.clear();
    source.addFeature(preview);
    return preview;
  }

  async function render(feature: Feature<Geometry>) {
    const currentRevision = ++revision;
    const geometry = geometryObject(feature);
    condition.geometry = geometry;
    const fallback = showFallback(feature);

    if (symbol.geometry === "Point") {
      try {
        const icon = await renderMetocIcon(symbol.sidc, 36);
        if (disposed || currentRevision !== revision) return undefined;
        fallback.set("metocIcon", icon);
        fallback.changed();
      } catch {
        // The fallback remains visible when the renderer cannot create an icon.
      }
      latestArtifact = undefined;
      return undefined;
    }

    if (geometryPointCount(geometry) < symbol.minPoints) return undefined;
    try {
      const artifact = await renderMetocGeometry(
        symbol.sidc,
        geometry,
        symbol.geometry,
        reference.authoredScale,
      );
      if (disposed || currentRevision !== revision || !artifact?.features.length) {
        return undefined;
      }
      const features = format.readFeatures(artifact, {
        dataProjection: "EPSG:4326",
        featureProjection: projection,
      });
      source.clear();
      features.forEach((item, index) => {
        item.set("condition", condition);
        item.set("metersPerUnit", metersPerUnit);
        item.set("metocRendered", true);
        item.set("symbolInstanceId", condition.id);
        item.set("renderComponentId", `${condition.id}:${index}`);
      });
      source.addFeatures(features);
      latestArtifact = artifact;
      return artifact;
    } catch {
      return undefined;
    }
  }

  function schedule(feature: Feature<Geometry>) {
    if (timer !== undefined) window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      timer = undefined;
      void render(feature);
    }, 60);
  }

  function watch(draw: Draw) {
    drawStartListener = draw.on("drawstart", ({ feature }) => {
      if (geometryListener) unByKey(geometryListener);
      geometryListener = feature.getGeometry()!.on("change", () => schedule(feature));
      schedule(feature);
    });
    drawAbortListener = draw.on("drawabort", () => source.clear());
  }

  async function finalize(feature: Feature<Geometry>) {
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timer = undefined;
    }
    const artifact = await render(feature);
    return artifact ?? latestArtifact;
  }

  function dispose() {
    disposed = true;
    revision += 1;
    if (timer !== undefined) window.clearTimeout(timer);
    if (geometryListener) unByKey(geometryListener);
    if (drawStartListener) unByKey(drawStartListener);
    if (drawAbortListener) unByKey(drawAbortListener);
    map.removeLayer(layer);
    source.clear();
  }

  return { layer, watch, finalize, dispose };
}
