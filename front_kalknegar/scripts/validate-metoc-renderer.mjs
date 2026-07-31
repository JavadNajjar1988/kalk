import fs from "node:fs";
import { JSDOM } from "jsdom";
import catalog from "../src/modules/scenarioeditor/metocCatalog.generated.json" with { type: "json" };

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  runScripts: "outside-only",
});
const noop = () => {};
const gradient = { addColorStop: noop };
const context = new Proxy(
  {
    measureText: (text) => ({ width: String(text).length * 8 }),
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    createImageData: () => ({ data: new Uint8ClampedArray(4) }),
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
  },
  {
    get: (target, property) => target[property] ?? noop,
    set: (target, property, value) => {
      target[property] = value;
      return true;
    },
  },
);
dom.window.HTMLCanvasElement.prototype.getContext = () => context;
dom.window.HTMLCanvasElement.prototype.toDataURL = () => "";
dom.window.eval(
  fs.readFileSync(
    new URL(
      "../node_modules/@io.github.missioncommand/mil-sym-js/dist/sm-bc.min.js",
      import.meta.url,
    ),
    "utf8",
  ),
);

const iconRenderer = dom.window.armyc2.c2sd.renderer.MilStdIconRenderer;
const geometryRenderer = dom.window.sec.web.renderer.SECWebRenderer;
const failures = [];
const repairs = [];
const scales = [25_000, 250_000, 2_000_000];

function geometryInput(symbol, scale) {
  const minimum =
    symbol.geometry === "Polygon"
      ? Math.max(3, symbol.minPoints)
      : Math.max(2, symbol.minPoints);
  const delta = Math.max(0.0125, Math.min(1, scale / 2_000_000));
  const candidates = [
    [51, 35],
    [51 + delta, 35 + delta * 0.25],
    [51 + delta * 1.4, 35 + delta],
    [51 + delta * 0.4, 35 + delta * 1.2],
    [51 - delta * 0.2, 35 + delta * 0.6],
  ];
  const coordinates = candidates.slice(0, Math.min(minimum, candidates.length));
  const xs = coordinates.map(([longitude]) => longitude);
  const ys = coordinates.map(([, latitude]) => latitude);
  const padding = delta * 0.5;
  return {
    points: coordinates
      .map(([longitude, latitude]) => `${longitude},${latitude}`)
      .join(" "),
    bbox: `${Math.min(...xs) - padding},${Math.min(...ys) - padding},${Math.max(...xs) + padding},${Math.max(...ys) + padding}`,
  };
}

function finiteCoordinates(value) {
  if (!Array.isArray(value)) return false;
  if (value.length >= 2 && value.every(Number.isFinite)) return true;
  return value.length > 0 && value.every(finiteCoordinates);
}

function validGeometry(geometry) {
  if (!geometry?.type) return false;
  if (geometry.type === "GeometryCollection") {
    return (
      Array.isArray(geometry.geometries) &&
      geometry.geometries.length > 0 &&
      geometry.geometries.every(validGeometry)
    );
  }
  return finiteCoordinates(geometry.coordinates);
}

function finitePosition(value) {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  );
}

function cleanLine(value) {
  if (!Array.isArray(value)) return undefined;
  const coordinates = value.filter(finitePosition);
  return coordinates.length >= 2 ? coordinates : undefined;
}

function cleanRing(value) {
  const coordinates = cleanLine(value);
  if (!coordinates || coordinates.length < 3) return undefined;
  const first = coordinates[0];
  const last = coordinates.at(-1);
  if (first[0] !== last[0] || first[1] !== last[1]) coordinates.push([...first]);
  return coordinates.length >= 4 ? coordinates : undefined;
}

function sanitizeGeometry(geometry) {
  if (!geometry) return undefined;
  switch (geometry.type) {
    case "Point":
      return finitePosition(geometry.coordinates) ? geometry : undefined;
    case "MultiPoint": {
      const coordinates = geometry.coordinates.filter(finitePosition);
      return coordinates.length ? { ...geometry, coordinates } : undefined;
    }
    case "LineString": {
      const coordinates = cleanLine(geometry.coordinates);
      return coordinates ? { ...geometry, coordinates } : undefined;
    }
    case "MultiLineString": {
      const coordinates = geometry.coordinates.map(cleanLine).filter(Boolean);
      return coordinates.length ? { ...geometry, coordinates } : undefined;
    }
    case "Polygon": {
      const outer = cleanRing(geometry.coordinates[0]);
      if (!outer) return undefined;
      return {
        ...geometry,
        coordinates: [
          outer,
          ...geometry.coordinates.slice(1).map(cleanRing).filter(Boolean),
        ],
      };
    }
    case "MultiPolygon": {
      const coordinates = geometry.coordinates
        .map((polygon) => {
          const outer = cleanRing(polygon[0]);
          return outer
            ? [outer, ...polygon.slice(1).map(cleanRing).filter(Boolean)]
            : undefined;
        })
        .filter(Boolean);
      return coordinates.length ? { ...geometry, coordinates } : undefined;
    }
    case "GeometryCollection": {
      const geometries = geometry.geometries.map(sanitizeGeometry).filter(Boolean);
      return geometries.length ? { ...geometry, geometries } : undefined;
    }
  }
}

function sanitizeCollection(collection) {
  const features = collection.features.flatMap((feature) => {
    const geometry = sanitizeGeometry(feature.geometry);
    return geometry ? [{ ...feature, geometry }] : [];
  });
  return features.length ? { ...collection, features } : undefined;
}

for (const symbol of catalog) {
  try {
    for (const size of [24, 48, 96]) {
      const svg = iconRenderer.Render(symbol.sidc, { SIZE: size, SYMSTD: 1 })?.toSVG();
      if (!svg?.includes("<svg")) throw new Error("خروجی SVG ایجاد نشد");
    }
    if (symbol.geometry === "Point") continue;

    for (const scale of scales) {
      const input = geometryInput(symbol, scale);
      const output = geometryRenderer.RenderSymbol(
        symbol.sidc,
        "",
        "",
        symbol.sidc,
        input.points,
        "clampToGround",
        scale,
        input.bbox,
        "{}",
        2,
        1,
      );
      const rendered = JSON.parse(output);
      if (
        rendered.type !== "FeatureCollection" ||
        !Array.isArray(rendered.features) ||
        rendered.features.length === 0
      ) {
        throw new Error(rendered.error ?? `خروجی هندسی در مقیاس ${scale} خالی است`);
      }
      const rawInvalidFeature = rendered.features.find(
        (feature) => !validGeometry(feature.geometry),
      );
      const sanitized = sanitizeCollection(rendered);
      if (rawInvalidFeature) {
        repairs.push({ sidc: symbol.sidc, scale });
      }
      if (
        !sanitized ||
        sanitized.features.some((feature) => !validGeometry(feature.geometry))
      ) {
        throw new Error(`no valid geometry after sanitizing at scale ${scale}`);
      }
    }
  } catch (error) {
    failures.push({
      sidc: symbol.sidc,
      label: symbol.labelEn,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

console.log(
  JSON.stringify(
    {
      checked: catalog.length,
      point: catalog.filter((symbol) => symbol.geometry === "Point").length,
      line: catalog.filter((symbol) => symbol.geometry === "LineString").length,
      polygon: catalog.filter((symbol) => symbol.geometry === "Polygon").length,
      iconSizes: [24, 48, 96],
      geometryScales: scales,
      repairedRendererOutputs: repairs,
      checks:
        catalog.length * 3 +
        catalog.filter((symbol) => symbol.geometry !== "Point").length * scales.length,
      failures,
    },
    null,
    2,
  ),
);

if (failures.length) process.exitCode = 1;
