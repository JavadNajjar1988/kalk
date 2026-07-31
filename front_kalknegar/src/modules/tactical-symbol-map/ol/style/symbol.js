import Signal from "@syncpoint/signal";
import { MODIFIERS } from "../../symbology/2525c.js";

/**
 *
 */
export default ($) => {
  $.shape = Signal.link(
    (properties, currentResolution, geometry) => {
      const sidc = properties.sidc;
      const modifiers = Object.entries(properties)
        .filter(([key, value]) => MODIFIERS[key] && value)
        .reduce(
          (acc, [key, value]) => R.tap((acc) => (acc[MODIFIERS[key]] = value), acc),
          {},
        );

      const authoredResolution = Number(properties?.renderReference?.authoredResolution);
      const resolutionScale =
        Number.isFinite(authoredResolution) &&
        authoredResolution > 0 &&
        currentResolution > 0
          ? authoredResolution / currentResolution
          : 1;

      return [
        {
          id: "style:2525c/symbol",
          "symbol-code": sidc,
          "symbol-modifiers": modifiers,
          "symbol-resolution-scale": resolutionScale,
          "symbol-current-resolution": currentResolution,
          "symbol-center": geometry?.getCoordinates?.(),
          "symbol-spatial-cuts": properties.spatialCuts,
          "symbol-spatial-fades": properties.spatialFades,
        },
      ];
    },
    [$.properties, $.centerResolution, $.geometry],
  );

  $.selection = $.selectionMode.map((mode) =>
    mode === "multiselect" ? [{ id: "style:rectangle-handle" }] : [],
  );

  $.styles = Signal.link((...styles) => styles.reduce(R.concat), [$.shape, $.selection]);

  return $.styles.ap($.styleRegistry).ap($.styleFactory);
};
