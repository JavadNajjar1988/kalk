import * as R from "ramda";
import Signal from "@syncpoint/signal";
import transform from "./_transform";
import { specialization } from "../../symbology/2525c.js";
import { GeometryProperties } from "../../components/properties/geometries.js";

import _rewrite from "./_rewrite";
import _evalSync from "./_evalSync";
import _clip from "./_clip";
import _applyFadeZones from "./_applyFadeZones";
import _applySpatialCuts, { normalizeSpatialCuts } from "./spatialCuts";
import _applySpatialFades from "./spatialFades";
import { normalizeFadeZones } from "./fadeZones";

const EMPTY_OBJECT = {};
export default (specifics) => ($) => {
  const [read, write, pointResolution] = transform($.geometry);
  $.read = read;
  $.rewrite = write.map((fn) => (xs) => xs.map(_rewrite(fn)));
  $.pointResolution = pointResolution;
  $.renderCenterResolution = Signal.link(
    (currentResolution, properties) =>
      Number(properties?.renderReference?.authoredResolution) || currentResolution,
    [$.centerResolution, $.properties],
  );
  $.resolution = $.renderCenterResolution.ap($.pointResolution);
  $.jtsGeometry = $.geometry.ap($.read);
  $.clip = $.resolution.map(_clip);

  // Derive additional properties from geometry,
  // which might be used in labels (an, am).
  $.specialization = $.sidc.map((sidc) => specialization(sidc) || null);
  $.geometryProperties = Signal.link(
    (specialization, geometry) => {
      const fn = GeometryProperties[specialization];
      return fn ? fn(geometry) : EMPTY_OBJECT;
    },
    [$.specialization, $.jtsGeometry],
  );
  $.evalSync = Signal.link(_evalSync, [$.sidc, $.properties, $.geometryProperties]);

  specifics($);

  $.fadeZones = $.properties.map((p) => normalizeFadeZones(p?.fadeZones));
  $.spatialCuts = $.properties.map((p) => normalizeSpatialCuts(p?.spatialCuts));
  $.spatialFades = $.properties.map((p) => normalizeSpatialCuts(p?.spatialFades));
  if (!$.fadeBaseGeometry) {
    $.fadeBaseGeometry = $.jtsSmoothenedGeometry || $.jtsGeometry;
  }

  $.cutShape = Signal.link(_applySpatialCuts, [$.shape, $.spatialCuts, $.read]);

  $.styles = Signal.link(
    (...styles) => styles.reduce(R.concat),
    [$.cutShape, $.labels, $.selection],
  );

  $.spatiallyFadedStyles = Signal.link(_applySpatialFades, [
    $.styles,
    $.spatialFades,
    $.read,
  ]);

  $.fadedStyles = Signal.link(_applyFadeZones, [
    $.spatiallyFadedStyles,
    $.fadeZones,
    $.fadeBaseGeometry,
  ]);

  return $.fadedStyles
    .ap($.styleRegistry)
    .ap($.evalSync)
    .ap($.clip)
    .ap($.rewrite)
    .ap($.styleFactory);
};
