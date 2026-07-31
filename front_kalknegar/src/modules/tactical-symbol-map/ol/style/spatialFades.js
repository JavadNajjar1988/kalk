import * as TS from "../ts";
import { spatialMaskGeometries } from "./spatialCuts";

const hasGeometry = (geometry) =>
  geometry && typeof geometry.getNumPoints === "function" && geometry.getNumPoints() > 0;

const withOpacity = (entry, opacity) => ({
  ...entry,
  "line-opacity": Math.min(Number(entry["line-opacity"] ?? 1), opacity),
  "shape-opacity": Math.min(Number(entry["shape-opacity"] ?? 1), opacity),
  "icon-opacity": Math.min(Number(entry["icon-opacity"] ?? 1), opacity),
});

export default (styles, fades, read) => {
  if (!Array.isArray(styles) || typeof read !== "function") return styles;
  const masks = spatialMaskGeometries(fades, read);
  if (!masks.length) return styles;

  return styles.flatMap((entry) => {
    if (!entry?.geometry) return [entry];
    try {
      const outside = TS.difference([entry.geometry, ...masks]);
      const inside = TS.intersection([entry.geometry, TS.union(masks)]);
      return [
        ...(hasGeometry(outside) ? [{ ...entry, geometry: outside }] : []),
        ...(hasGeometry(inside)
          ? [withOpacity({ ...entry, geometry: inside }, 0.15)]
          : []),
      ];
    } catch {
      return [entry];
    }
  });
};
