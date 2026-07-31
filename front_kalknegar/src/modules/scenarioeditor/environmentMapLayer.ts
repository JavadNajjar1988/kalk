import Feature from "ol/Feature";
import GeoJSON from "ol/format/GeoJSON";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import MultiPolygon from "ol/geom/MultiPolygon";
import type SimpleGeometry from "ol/geom/SimpleGeometry";
import { getCenter } from "ol/extent";
import { get as getProjection } from "ol/proj";
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
import { findMetocSymbol, metocSymbolAsPreset } from "./metocCatalog";
import { renderMetocGeometry, renderMetocIcon } from "./metocRenderer";
import { applyEnvironmentalEraseZones } from "./environmentErase";
import { pointSymbolScale } from "./symbolRenderReference";

function iconSource(condition: EnvironmentalCondition) {
  try {
    const sidc = condition.metocSidc ?? DEFAULT_METOC_SIDC[condition.kind];
    const svg = symbolGenerator(sidc, { size: 30 }).asSVG();
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  } catch {
    return undefined;
  }
}

function colorWithOpacity(color: string | undefined, opacity = 1) {
  if (!color) return undefined;
  if (!color.startsWith("#") || color.length !== 7) return color;
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
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
  let refreshRevision = 0;
  const layer = new VectorLayer({
    source,
    zIndex: 35,
    properties: { title: "شرایط محیطی", environmentalOverlay: true },
    style: environmentFeatureStyle,
  });
  const format = new GeoJSON();
  const legacyArtifactCache = new Map<
    string,
    { sidc: string; geometry: string; artifact: GeoJSON.FeatureCollection }
  >();

  function refresh(
    conditions: EnvironmentalCondition[],
    timestamp: number,
    projection: string,
    scale: number,
  ) {
    const revision = ++refreshRevision;
    const metersPerUnit = getProjection(projection)?.getMetersPerUnit() ?? 1;
    source.clear();
    conditions
      .filter(
        (condition) =>
          condition.scope === "area" &&
          condition.geometry &&
          isEnvironmentalConditionActive(condition, timestamp),
      )
      .forEach((condition) => {
        const standardSymbol = findMetocSymbol(condition.metocSidc);
        const geometry = format.readGeometry(condition.geometry!, {
          dataProjection: "EPSG:4326",
          featureProjection: projection,
        });
        if (!("getExtent" in geometry)) return;
        const fallbackFeature = new Feature({ geometry, condition, metersPerUnit });
        const fallbackFeatures = applyEnvironmentalEraseZones(
          fallbackFeature,
          condition,
          projection,
        );
        source.addFeatures(fallbackFeatures);

        if (geometry instanceof Point && standardSymbol) {
          renderMetocIcon(standardSymbol.sidc, 36)
            .then((src) => {
              if (revision !== refreshRevision) return;
              fallbackFeatures.forEach((feature) => {
                feature.set("metocIcon", src);
                feature.changed();
              });
            })
            .catch(() => undefined);
          return;
        }

        if (!(geometry instanceof Point) && standardSymbol) {
          const geometryKey = JSON.stringify(condition.geometry);
          const cached = legacyArtifactCache.get(condition.id);
          const storedArtifact = condition.renderReference?.artifact;
          const artifact =
            storedArtifact ??
            (cached?.sidc === standardSymbol.sidc && cached.geometry === geometryKey
              ? cached.artifact
              : undefined);
          const pending = artifact
            ? Promise.resolve(artifact)
            : renderMetocGeometry(
                standardSymbol.sidc,
                condition.geometry!,
                standardSymbol.geometry,
                condition.renderReference?.authoredScale ?? scale,
              );
          pending
            .then((rendered) => {
              if (revision !== refreshRevision || !rendered?.features.length) return;
              if (!storedArtifact) {
                legacyArtifactCache.set(condition.id, {
                  sidc: standardSymbol.sidc,
                  geometry: geometryKey,
                  artifact: rendered,
                });
              }
              fallbackFeatures.forEach((feature) => source.removeFeature(feature));
              const renderedFeatures = format.readFeatures(rendered, {
                dataProjection: "EPSG:4326",
                featureProjection: projection,
              });
              const preparedFeatures = renderedFeatures.flatMap((feature, index) => {
                feature.set("condition", condition);
                feature.set("metersPerUnit", metersPerUnit);
                feature.set("symbolInstanceId", condition.id);
                feature.set("renderComponentId", `${condition.id}:${index}`);
                feature.set("metocRendered", true);
                return applyEnvironmentalEraseZones(feature, condition, projection);
              });
              source.addFeatures(preparedFeatures);
            })
            .catch(() => undefined);
          return;
        }

        if (!(geometry instanceof Point)) {
          const marker = new Feature({
            geometry: new Point(markerCoordinate(geometry as SimpleGeometry)),
            condition,
            metersPerUnit,
          });
          source.addFeatures(applyEnvironmentalEraseZones(marker, condition, projection));
        }
      });
  }

  return { layer, refresh };
}

export function environmentFeatureStyle(featureLike: any, resolution: number) {
  const feature = featureLike as Feature;
  const condition = feature.get("condition") as EnvironmentalCondition;
  const environmentOpacity = Number(feature.get("environmentOpacity") ?? 1);
  const standardSymbol = findMetocSymbol(condition.metocSidc);
  const preset = standardSymbol
    ? metocSymbolAsPreset(standardSymbol)
    : presetForCondition(condition.kind, condition.parameters, condition.metocSidc);
  const color = preset.color;
  if (feature.get("metocRendered")) {
    const strokeColor =
      colorWithOpacity(
        feature.get("strokeColor"),
        Number(feature.get("lineOpacity") ?? 1) * environmentOpacity,
      ) ?? color;
    const fillColor = colorWithOpacity(
      feature.get("fillColor"),
      Number(feature.get("fillOpacity") ?? 0.25) * environmentOpacity,
    );
    const label = String(feature.get("label") ?? "");
    return new Style({
      fill: fillColor ? new Fill({ color: fillColor }) : undefined,
      stroke: new Stroke({
        color: strokeColor,
        width: Number(feature.get("strokeWidth") ?? feature.get("strokeWeight") ?? 2),
      }),
      text: label
        ? new Text({
            text: label,
            fill: new Fill({ color: strokeColor }),
            backgroundFill: new Fill({ color: "rgba(255,255,255,0.82)" }),
            padding: [2, 3, 2, 3],
          })
        : undefined,
    });
  }
  if (feature.getGeometry() instanceof Point) {
    const src = feature.get("metocIcon") ?? iconSource(condition);
    const metersPerUnit = Number(feature.get("metersPerUnit") ?? 1);
    const referenceScale = pointSymbolScale(
      condition.renderReference,
      resolution * metersPerUnit,
    );
    return new Style({
      image: src
        ? new Icon({
            src,
            anchor: [0.5, 0.5],
            scale: 0.9 * referenceScale,
            opacity: environmentOpacity,
          })
        : undefined,
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
    fill: new Fill({ color: colorWithOpacity(color, 0.19 * environmentOpacity) }),
    stroke: new Stroke({
      color: colorWithOpacity(color, environmentOpacity),
      width: 2,
      lineDash: [8, 5],
    }),
  });
}
