import type { Feature, FeatureCollection, Geometry, GeoJsonProperties } from "geojson";
import { nanoid } from "nanoid";

import type { NScenarioFeature } from "@/types/internalModels";
import type { FeatureId, ScenarioFeatureType } from "@/types/scenarioGeoModels";

const STYLE_KEYS = [
  "stroke",
  "stroke-opacity",
  "stroke-width",
  "stroke-style",
  "fill",
  "fill-opacity",
  "marker-size",
  "marker-color",
  "marker-symbol",
] as const;

const SUPPORTED_GEOMETRIES = new Set<ScenarioFeatureType>([
  "Point",
  "LineString",
  "Polygon",
  "MultiPoint",
  "MultiLineString",
  "MultiPolygon",
  "GeometryCollection",
]);

function featureName(properties: GeoJsonProperties, index: number) {
  const candidates = [properties?.name, properties?.title, properties?.label];
  const value = candidates.find(
    (candidate) => typeof candidate === "string" && candidate.trim(),
  );
  return typeof value === "string"
    ? value.trim()
    : `عارضه ${index.toLocaleString("fa-IR")}`;
}

function simpleStyle(properties: GeoJsonProperties) {
  if (!properties) return {};
  return Object.fromEntries(
    STYLE_KEYS.filter((key) => properties[key] !== undefined).map((key) => [
      key,
      properties[key],
    ]),
  );
}

function isSupportedGeometry(geometry: Geometry | null): geometry is Geometry {
  return Boolean(
    geometry && SUPPORTED_GEOMETRIES.has(geometry.type as ScenarioFeatureType),
  );
}

export function createEditableScenarioFeatures(
  collection: FeatureCollection,
  layerId: FeatureId,
): NScenarioFeature[] {
  return collection.features.flatMap((feature: Feature, index) => {
    if (!isSupportedGeometry(feature.geometry)) return [];
    const properties = { ...(feature.properties ?? {}) };
    const name = featureName(properties, index + 1);
    return [
      {
        type: "Feature",
        id: nanoid(),
        _pid: layerId,
        geometry: structuredClone(feature.geometry),
        properties: {
          ...properties,
          type: feature.geometry.type,
          name,
        },
        meta: {
          type: feature.geometry.type as ScenarioFeatureType,
          name,
          description:
            typeof properties.description === "string"
              ? properties.description
              : undefined,
        },
        style: simpleStyle(properties),
      },
    ];
  });
}
