import * as R from "ramda";
import * as olStyle from "ol/style";
import { PI_OVER_2, PI } from "../../shared/Math";
import { Symbol } from "@syncpoint/signs";
import * as patterns from "./patterns";
import * as TS from "../ts";
import GeoJSON from "ol/format/GeoJSON";

const Styles = {
  stroke: (options) => new olStyle.Stroke(options),
  fill: (options) => new olStyle.Fill(options),
  text: (options) => new olStyle.Text(options),
  circle: (options) => new olStyle.Circle(options),
  regularShape: (options) => new olStyle.RegularShape(options),
  icon: (options) => new olStyle.Icon(options),
  style: (options) => new olStyle.Style(options),
};

const NAMED_COLORS = {
  black: [0, 0, 0],
  white: [255, 255, 255],
  red: [255, 0, 0],
  brown: [165, 42, 42],
  gold: [255, 215, 0],
  green: [0, 128, 0],
  blue: [0, 0, 255],
  purple: [128, 0, 128],
  yellow: [255, 255, 0],
};

const TEXT_ALIGN = {
  start: "end",
  end: "start",
  left: "right",
  right: "left",
  center: "center",
};

const colorWithOpacity = (color, opacity) => {
  if (!color || opacity === undefined || opacity >= 1) return color;
  if (opacity <= 0) return "rgba(0,0,0,0)";

  const named = NAMED_COLORS[String(color).toLowerCase()];
  if (named) return `rgba(${named[0]},${named[1]},${named[2]},${opacity})`;

  const rgba = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/i.exec(
    color,
  );
  if (rgba) {
    return `rgba(${rgba[1]},${rgba[2]},${rgba[3]},${Math.min(1, parseFloat(rgba[4]) * opacity)})`;
  }

  const rgb = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(color);
  if (rgb) return `rgba(${rgb[1]},${rgb[2]},${rgb[3]},${opacity})`;

  const hex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  if (hex) {
    return `rgba(${parseInt(hex[1], 16)},${parseInt(hex[2], 16)},${parseInt(hex[3], 16)},${opacity})`;
  }

  return color;
};

const resolveOpacity = (props) =>
  props["line-opacity"] ?? props["shape-opacity"] ?? props["icon-opacity"];

const makeStroke = (props) => {
  if (!props["line-width"]) return null;
  const opacity = resolveOpacity(props);
  return Styles.stroke({
    color: colorWithOpacity(props["line-color"], opacity),
    lineCap: props["line-cap"],
    lineJoin: props["line-join"],
    lineDash: props["line-dash-array"],
    width: props["line-width"],
  });
};

const makeFill = (props) => {
  const opacity = resolveOpacity(props);
  if (props["fill-color"]) {
    return Styles.fill({ color: colorWithOpacity(props["fill-color"], opacity) });
  } else if (props["fill-pattern"]) {
    const color = patterns.fill({
      pattern: props["fill-pattern"],
      angle: props["fill-pattern-angle"],
      size: props["fill-pattern-size"],
      spacing: props["fill-pattern-spacing"],
      strokeColor: props["line-halo-color"],
      strokeWidth: props["line-halo-width"] + props["line-width"],
      strokeFillColor: props["line-color"],
      strokeFillWidth: props["line-width"],
    });

    return new olStyle.Fill({ color });
  } else return null;
};

const makeText = (props) => {
  if (!props["text-field"]) return null;

  const rotate = props["text-rotate"];
  const rotationAnchor = props["text-rotation-anchor"];
  const flipped = rotate ? rotate < -PI_OVER_2 || rotate > PI_OVER_2 : false;
  const textAlign = props["text-justify"] || null;
  const textOffset = props["text-offset"] || [0, 0];
  const offsetX = flipped ? -1 * textOffset[0] : textOffset[0];
  const offsetY =
    flipped && rotationAnchor === "fix" ? -1 * textOffset[1] : textOffset[1];

  return Styles.text({
    font: props["text-font"],
    text: props["text-field"],
    rotation: rotate ? (flipped ? rotate + PI : rotate) : null,
    textAlign: textAlign ? (flipped ? TEXT_ALIGN[textAlign] : textAlign) : null,
    offsetX,
    offsetY,
    padding: props["text-padding"] && new Array(4).fill(props["text-padding"]),
    fill: Styles.fill({ color: props["text-color"] }),
    stroke:
      props["text-halo-color"] &&
      props["text-halo-width"] !== 0 &&
      Styles.stroke({
        color: props["text-halo-color"],
        width: props["text-halo-width"],
      }),
    backgroundFill:
      props["text-fill-color"] && Styles.fill({ color: props["text-fill-color"] }),
    backgroundStroke:
      props["text-line-color"] &&
      Styles.stroke({
        color: props["text-line-color"],
        width: props["text-line-width"],
      }),
  });
};

const makeCircle = (props) => {
  const opacity = resolveOpacity(props);
  const fill = Styles.fill({
    color: colorWithOpacity(props["circle-fill-color"], opacity),
  });
  const stroke = props["circle-line-color"]
    ? Styles.stroke({
        color: colorWithOpacity(props["circle-line-color"], opacity),
        width: props["circle-line-width"],
      })
    : null;

  return Styles.circle({
    fill,
    stroke,
    radius: props["circle-radius"],
  });
};

const makeShape = (props) => {
  const opacity = resolveOpacity(props);
  const fillColor = props["shape-fill-color"];
  const fill = fillColor
    ? Styles.fill({ color: colorWithOpacity(fillColor, opacity) })
    : null;
  const stroke = Styles.stroke({
    color: colorWithOpacity(props["shape-line-color"], opacity),
    width: props["shape-line-width"],
  });

  return Styles.regularShape({
    fill,
    stroke,
    radius: props["shape-radius"],
    radius2: props["shape-radius-2"],
    points: props["shape-points"],
    angle: props["shape-angle"],
    rotation: props["shape-rotate"],
    scale: props["shape-scale"],
    displacement: props["shape-offset"],
  });
};

const paintBrushMask = (context, mask, center, mapUnitsPerPixel) => {
  const coordinates = Array.isArray(mask?.coordinates) ? mask.coordinates : [];
  const radius = Number(mask?.radius);
  if (!coordinates.length || !Number.isFinite(radius) || radius <= 0) return false;

  context.beginPath();
  coordinates.forEach((coordinate, index) => {
    if (!Array.isArray(coordinate)) return;
    const x = (coordinate[0] - center[0]) / mapUnitsPerPixel;
    const y = (center[1] - coordinate[1]) / mapUnitsPerPixel;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  if (coordinates.length === 1) {
    const coordinate = coordinates[0];
    context.arc(
      (coordinate[0] - center[0]) / mapUnitsPerPixel,
      (center[1] - coordinate[1]) / mapUnitsPerPixel,
      radius / mapUnitsPerPixel,
      0,
      Math.PI * 2,
    );
    context.fill();
  } else {
    context.lineWidth = (radius * 2) / mapUnitsPerPixel;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.stroke();
  }
  return true;
};

const maskedSymbolCanvas = (source, anchor, props) => {
  const cuts = Array.isArray(props["symbol-spatial-cuts"])
    ? props["symbol-spatial-cuts"]
    : [];
  const fades = Array.isArray(props["symbol-spatial-fades"])
    ? props["symbol-spatial-fades"]
    : [];
  const center = props["symbol-center"];
  const currentResolution = Number(props["symbol-current-resolution"]);
  const renderedScale =
    (props["icon-scale"] || 0.5) * (props["symbol-resolution-scale"] || 1);
  const mapUnitsPerPixel = currentResolution * renderedScale;
  if (
    (!cuts.length && !fades.length) ||
    !Array.isArray(center) ||
    !Number.isFinite(mapUnitsPerPixel) ||
    mapUnitsPerPixel <= 0 ||
    typeof document === "undefined"
  ) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(source, 0, 0);
  context.translate(anchor.x, anchor.y);

  const applyCut = (mask) => {
    context.save();
    context.globalCompositeOperation = "destination-out";
    context.fillStyle = "#000";
    context.strokeStyle = "#000";
    paintBrushMask(context, mask, center, mapUnitsPerPixel);
    context.restore();
  };
  cuts.forEach(applyCut);

  fades.forEach((mask) => {
    const faded = document.createElement("canvas");
    faded.width = source.width;
    faded.height = source.height;
    const fadedContext = faded.getContext("2d");
    if (!fadedContext) return;
    fadedContext.drawImage(source, 0, 0);
    fadedContext.translate(anchor.x, anchor.y);
    fadedContext.globalCompositeOperation = "destination-in";
    fadedContext.fillStyle = "#000";
    fadedContext.strokeStyle = "#000";
    if (!paintBrushMask(fadedContext, mask, center, mapUnitsPerPixel)) return;
    applyCut(mask);
    context.save();
    context.translate(-anchor.x, -anchor.y);
    context.globalAlpha = 0.15;
    context.drawImage(faded, 0, 0);
    context.restore();
  });

  return canvas;
};

const makeSymbol = (props) => {
  const modes = { dark: "Dark", medium: "Medium", light: "Light" };

  const fromEntries = (entries) => Object.fromEntries(entries);
  const entries = (obj) => Object.entries(obj);
  const rejectNil = R.reject(([, v]) => R.isNil(v));
  const filter = R.compose(fromEntries, rejectNil, entries);

  const options = filter({
    colorMode: modes[props["color-scheme"]],
    monoColor: props["symbol-color"],
    outlineColor: props["symbol-halo-color"],
    outlineWidth: props["symbol-halo-width"],
    infoFields: props["symbol-text"],
    infoSize: props["symbol-text-size"],
    infoColor: props["symbol-text-color"],
    infoOutlineColor: props["symbol-text-halo-color"],
    infoOutlineWidth: props["symbol-text-halo-width"],
    strokeWidth: props["symbol-line-width"],
    fill: props["symbol-fill"],
    fillOpacity: props["symbol-fill-opacity"],
    frame: props["symbol-frame"],
    size: props["symbol-size"] || 60,
    ...props["symbol-modifiers"],
  });

  const symbol = new Symbol(props["symbol-code"], { ...options, infoFields: true });
  const { width, height } = symbol.getSize();
  const anchor = symbol.getAnchor();
  const maskedCanvas = maskedSymbolCanvas(symbol.asCanvas(), anchor, props);

  const opacity = resolveOpacity(props);
  return Styles.icon({
    anchor: [anchor.x, anchor.y],
    imgSize: [Math.floor(width), Math.floor(height)],
    ...(maskedCanvas
      ? { img: maskedCanvas }
      : { src: "data:image/svg+xml;utf8," + symbol.asSVG() }),
    anchorXUnits: "pixels",
    anchorYUnits: "pixels",
    scale: (props["icon-scale"] || 0.5) * (props["symbol-resolution-scale"] || 1),
    opacity: opacity < 1 ? opacity : undefined,
  });
};

const makeIcon = (props) => {
  const opacity = resolveOpacity(props);
  return Styles.icon({
    src: props["icon-url"],
    scale: props["icon-scale"] || 1,
    rotation: props["icon-rotate"] || 0,
    opacity: opacity < 1 ? opacity : undefined,
  });
};

const makeImage = (props) => {
  if (props["circle-radius"]) return makeCircle(props);
  else if (props["shape-radius"]) return makeShape(props);
  else if (props["symbol-code"]) return makeSymbol(props);
  else if (props["icon-url"]) return makeIcon(props);
  else return null;
};

const geojson = new GeoJSON({
  dataProjection: "EPSG:3857",
  featureProjection: "EPSG:3857",
});

const normalizeGeometry = (geometry) => {
  if (!geometry) return geometry;
  if (typeof geometry.getType === "function") return geometry;
  if (typeof geometry.getGeometryType === "function") {
    try {
      return TS.write(geometry);
    } catch {
      return undefined;
    }
  }
  if (geometry.type) {
    try {
      return geojson.readGeometry(geometry);
    } catch {
      return undefined;
    }
  }
  return undefined;
};

const makeStyle = (props) =>
  Array.isArray(props)
    ? props.map(makeStyle)
    : Styles.style({ ...props, geometry: normalizeGeometry(props.geometry) });

/**
 *
 */
export const styleFactory = (props) => {
  const styleOptions = [];

  if (props["line-halo-width"]) {
    const haloOpacity = resolveOpacity(props);
    styleOptions.push({
      geometry: props.geometry,
      stroke: makeStroke({
        "line-color": colorWithOpacity(props["line-halo-color"], haloOpacity),
        "line-dash-array": props["line-halo-dash-array"],
        "line-width": props["line-width"] + 2 * props["line-halo-width"],
        "line-cap": props["line-cap"],
        "line-join": props["line-join"],
      }),
    });
  }

  styleOptions.push({
    geometry: props.geometry,
    fill: makeFill(props),
    image: makeImage(props),
    stroke: makeStroke(props),
    text: makeText(props),
  });

  return makeStyle(styleOptions);
};
