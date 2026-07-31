import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Interaction from "ol/interaction/Interaction";
import type OlMap from "ol/Map";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Circle, Fill, Stroke, Style } from "ol/style";
import type { EnvironmentalEraseZone } from "@/types/scenarioModels";
import { buildEnvironmentalEraseZone } from "./environmentErase";

interface EmitterLike {
  on(event: string, handler: (payload?: any) => void): void;
  off(event: string, handler: (payload?: any) => void): void;
}

interface Options {
  map: OlMap;
  environmentLayer: VectorLayer<VectorSource>;
  applyZone: (conditionId: string, zone: EnvironmentalEraseZone) => void;
}

const normalizeBrushSize = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(1, Math.min(5, Math.round(numeric))) : 3;
};

const cursorRadius = (size: number) => 5 + normalizeBrushSize(size) * 2;

export function createEnvironmentEraseInteraction({
  map,
  environmentLayer,
  applyZone,
}: Options) {
  let mode: "fade" | "cut" = "fade";
  let brushSize = 3;
  let brushing = false;
  let targets = new globalThis.Map<string, number[][]>();
  let emitter: EmitterLike | undefined;

  const overlaySource = new VectorSource({ useSpatialIndex: false });
  const overlayLayer = new VectorLayer({ source: overlaySource, zIndex: 1000 });
  overlayLayer.setMap(map);

  function showCursor(coordinate?: number[]) {
    overlaySource.clear();
    if (!coordinate) return;
    const cursor = new Feature(new Point(coordinate));
    cursor.setStyle(
      new Style({
        image: new Circle({
          radius: cursorRadius(brushSize),
          stroke: new Stroke({ color: "rgba(255,80,80,0.95)", width: 2 }),
          fill: new Fill({ color: "rgba(255,80,80,0.16)" }),
        }),
      }),
    );
    overlaySource.addFeature(cursor);
  }

  function conditionIdAt(event: any) {
    return map.forEachFeatureAtPixel(
      event.pixel,
      (feature, layer) => {
        if (layer !== environmentLayer) return undefined;
        const condition = feature.get("condition");
        return condition?.id as string | undefined;
      },
      {
        hitTolerance: cursorRadius(brushSize),
        layerFilter: (layer) => layer === environmentLayer,
      },
    );
  }

  function appendCoordinate(coordinate: number[]) {
    const resolution = map.getView().getResolution() ?? 1;
    targets.forEach((path) => {
      const previous = path[path.length - 1];
      if (
        !previous ||
        Math.hypot(previous[0] - coordinate[0], previous[1] - coordinate[1]) >=
          resolution * 2
      ) {
        path.push([...coordinate]);
      }
    });
  }

  function persist() {
    const view = map.getView();
    const projection = view.getProjection();
    const radius = (view.getResolution() ?? 1) * cursorRadius(brushSize);
    targets.forEach((coordinates, conditionId) => {
      if (!coordinates.length) return;
      applyZone(
        conditionId,
        buildEnvironmentalEraseZone(mode, coordinates, radius, projection),
      );
    });
  }

  function reset(save = false) {
    if (save) persist();
    brushing = false;
    targets = new globalThis.Map();
    showCursor();
  }

  const interaction = new Interaction({
    handleEvent(event) {
      if (!interaction.getActive()) return true;
      const original = event.originalEvent as PointerEvent | undefined;
      const primary =
        original?.pointerType === "touch" || Boolean((original?.buttons ?? 0) & 1);

      if (event.type === "pointermove" && !brushing) {
        showCursor(conditionIdAt(event) ? event.coordinate : undefined);
        return true;
      }
      if (event.type === "pointerdown" && primary) {
        const id = conditionIdAt(event);
        if (!id) return true;
        targets = new globalThis.Map([[id, [[...event.coordinate]]]]);
        brushing = true;
        showCursor(event.coordinate);
        event.stopPropagation();
        return false;
      }
      if (brushing && (event.type === "pointerdrag" || event.type === "pointermove")) {
        appendCoordinate(event.coordinate);
        showCursor(event.coordinate);
        event.stopPropagation();
        return false;
      }
      if (brushing && event.type === "pointerup") {
        appendCoordinate(event.coordinate);
        event.stopPropagation();
        reset(true);
        return false;
      }
      if (brushing && event.type === "pointercancel") {
        reset(false);
        return false;
      }
      return true;
    },
  });
  interaction.setActive(false);
  map.addInteraction(interaction);

  const startFade = (payload?: any) => {
    mode = "fade";
    brushSize = normalizeBrushSize(payload?.brushSize);
    interaction.setActive(true);
  };
  const startCut = (payload?: any) => {
    mode = "cut";
    brushSize = normalizeBrushSize(payload?.brushSize);
    interaction.setActive(true);
  };
  const resize = (payload?: any) => {
    brushSize = normalizeBrushSize(payload?.brushSize);
  };
  const cancel = () => {
    interaction.setActive(false);
    reset(false);
  };

  function bindEmitter(next?: EmitterLike) {
    if (emitter === next) return;
    if (emitter) {
      emitter.off("ERASE_FADE_START", startFade);
      emitter.off("ERASE_CUT_START", startCut);
      emitter.off("command/erase/brush-size", resize);
      emitter.off("command/erase/cancel", cancel);
    }
    emitter = next;
    if (emitter) {
      emitter.on("ERASE_FADE_START", startFade);
      emitter.on("ERASE_CUT_START", startCut);
      emitter.on("command/erase/brush-size", resize);
      emitter.on("command/erase/cancel", cancel);
    }
  }

  function dispose() {
    bindEmitter();
    reset(false);
    map.removeInteraction(interaction);
    overlayLayer.setMap(null);
  }

  return { interaction, bindEmitter, dispose };
}
