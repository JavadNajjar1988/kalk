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

for (const symbol of catalog) {
  try {
    if (symbol.geometry === "Point") {
      const svg = iconRenderer.Render(symbol.sidc, { SIZE: 32, SYMSTD: 1 })?.toSVG();
      if (!svg?.includes("<svg")) throw new Error("خروجی SVG ایجاد نشد");
      continue;
    }

    const controlPoints =
      symbol.geometry === "Polygon" ? "51,35 52,35 52,36 51,36" : "51,35 52,35.3 53,35";
    const output = geometryRenderer.RenderSymbol(
      symbol.sidc,
      "",
      "",
      symbol.sidc,
      controlPoints,
      "clampToGround",
      100_000,
      "50,34,54,37",
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
      throw new Error(rendered.error ?? "خروجی هندسی خالی است");
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
      failures,
    },
    null,
    2,
  ),
);

if (failures.length) process.exitCode = 1;
