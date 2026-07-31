import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import LineString from "ol/geom/LineString";
import type Geometry from "ol/geom/Geometry";
import { get as getProjection, transform } from "ol/proj";
import type { ProjectionLike } from "ol/proj";
import type {
  EnvironmentalCondition,
  EnvironmentalEraseZone,
} from "@/types/scenarioModels";
// @ts-expect-error The legacy JSTS bridge is JavaScript-only.
import * as TS from "@/modules/tactical-symbol-map/ol/ts";

interface ErasePiece {
  geometry: any;
  opacity: number;
}

function hasGeometry(geometry: any) {
  return geometry && !geometry.isEmpty?.() && geometry.getNumPoints?.() > 0;
}

function eraseMask(zone: EnvironmentalEraseZone, projection: ProjectionLike) {
  if (!zone.coordinates.length || zone.radiusMeters <= 0) return undefined;
  const projected = zone.coordinates.map((coordinate) =>
    transform(coordinate, "EPSG:4326", projection),
  );
  const path =
    projected.length === 1 ? new Point(projected[0]) : new LineString(projected);
  const metersPerUnit = getProjection(projection)?.getMetersPerUnit() ?? 1;
  return TS.simpleBuffer(TS.read(path))(zone.radiusMeters / metersPerUnit);
}

function splitPiece(piece: ErasePiece, mask: any, mode: "fade" | "cut") {
  try {
    const outside = TS.difference([piece.geometry, mask]);
    if (mode === "cut") {
      return hasGeometry(outside) ? [{ ...piece, geometry: outside }] : [];
    }
    const inside = TS.intersection([piece.geometry, mask]);
    return [
      ...(hasGeometry(outside) ? [{ ...piece, geometry: outside }] : []),
      ...(hasGeometry(inside)
        ? [{ geometry: inside, opacity: Math.min(piece.opacity, 0.15) }]
        : []),
    ];
  } catch {
    return [piece];
  }
}

export function applyEnvironmentalEraseZones(
  feature: Feature<Geometry>,
  condition: EnvironmentalCondition,
  projection: ProjectionLike,
) {
  const geometry = feature.getGeometry();
  if (!geometry || !condition.eraseZones?.length) return [feature];

  let pieces: ErasePiece[] = [{ geometry: TS.read(geometry), opacity: 1 }];
  for (const zone of condition.eraseZones) {
    const mask = eraseMask(zone, projection);
    if (mask) pieces = pieces.flatMap((piece) => splitPiece(piece, mask, zone.mode));
    if (!pieces.length) break;
  }

  return pieces.map((piece) => {
    const result = feature.clone();
    result.setGeometry(TS.write(piece.geometry));
    result.set("environmentOpacity", piece.opacity);
    return result;
  });
}

export function buildEnvironmentalEraseZone(
  mode: "fade" | "cut",
  coordinates: number[][],
  radiusMapUnits: number,
  projection: ProjectionLike,
): EnvironmentalEraseZone {
  const metersPerUnit = getProjection(projection)?.getMetersPerUnit() ?? 1;
  const geographic = coordinates.map(
    (coordinate) => transform(coordinate, projection, "EPSG:4326") as GeoJSON.Position,
  );
  return {
    mode,
    coordinates: geographic,
    radiusMeters: Math.max(0.1, radiusMapUnits * metersPerUnit),
  };
}
