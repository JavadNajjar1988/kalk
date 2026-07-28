import Feature from "ol/Feature";
import GeoJSON from "ol/format/GeoJSON";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import MultiPolygon from "ol/geom/MultiPolygon";
import type SimpleGeometry from "ol/geom/SimpleGeometry";
import { getCenter } from "ol/extent";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Icon, Stroke, Style, Text } from "ol/style";
import type { EnvironmentalCondition } from "@/types/scenarioModels";
import {
  DEFAULT_METOC_SIDC,
  isEnvironmentalConditionActive,
} from "@/scenariostore/environment";
import { symbolGenerator } from "@/symbology/milsymbwrapper";
import { presetForCondition } from "./environmentPresets";

function iconSource(condition: EnvironmentalCondition) {
  try {
    const sidc = condition.metocSidc ?? DEFAULT_METOC_SIDC[condition.kind];
    const svg = symbolGenerator(sidc, { size: 30 }).asSVG();
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  } catch {
    return undefined;
  }
}

function markerCoordinate(geometry: SimpleGeometry) {
  if (geometry instanceof Polygon) return geometry.getInteriorPoint().getCoordinates();
  if (geometry instanceof MultiPolygon) {
    return geometry.getInteriorPoints().getFirstCoordinate();
  }
  return getCenter(geometry.getExtent());
}

export function createEnvironmentMapLayer() {
  const source = new VectorSource();
  const layer = new VectorLayer({
    source,
    zIndex: 35,
    properties: { title: "شرایط محیطی", environmentalOverlay: true },
    style: (feature) => {
      const condition = feature.get("condition") as EnvironmentalCondition;
      const preset = presetForCondition(condition.kind, condition.parameters);
      const color = preset.color;
      if (feature.getGeometry() instanceof Point) {
        const src = iconSource(condition);
        return new Style({
          image: src ? new Icon({ src, anchor: [0.5, 0.5], scale: 0.9 }) : undefined,
          text: src
            ? undefined
            : new Text({
                text: preset.label,
                fill: new Fill({ color: "#fff" }),
                backgroundFill: new Fill({ color }),
                padding: [3, 5, 3, 5],
              }),
        });
      }
      return new Style({
        fill: new Fill({ color: `${color}30` }),
        stroke: new Stroke({ color, width: 2, lineDash: [8, 5] }),
      });
    },
  });
  const format = new GeoJSON();

  function refresh(
    conditions: EnvironmentalCondition[],
    timestamp: number,
    projection: string,
  ) {
    source.clear();
    conditions
      .filter(
        (condition) =>
          condition.scope === "area" &&
          condition.geometry &&
          isEnvironmentalConditionActive(condition, timestamp),
      )
      .forEach((condition) => {
        const geometry = format.readGeometry(condition.geometry!, {
          dataProjection: "EPSG:4326",
          featureProjection: projection,
        });
        if (!("getExtent" in geometry)) return;
        source.addFeature(new Feature({ geometry, condition }));
        if (!(geometry instanceof Point)) {
          source.addFeature(
            new Feature({
              geometry: new Point(markerCoordinate(geometry as SimpleGeometry)),
              condition,
            }),
          );
        }
      });
  }

  return { layer, refresh };
}
