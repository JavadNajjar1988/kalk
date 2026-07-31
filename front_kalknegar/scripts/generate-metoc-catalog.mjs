import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { translateMetocText } from "./metoc-fa-translations.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const rendererPath = path.join(
  projectRoot,
  "node_modules",
  "@io.github.missioncommand",
  "mil-sym-js",
  "dist",
  "sm-bc.min.js",
);
const outputPath = path.join(
  projectRoot,
  "src",
  "modules",
  "scenarioeditor",
  "metocCatalog.generated.json",
);
const sourceUrl = "https://www.symbol.army/doc/en/more/list-of-mil-std-2525c-symbols/";

function loadSymbolDefinitions() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    runScripts: "outside-only",
  });
  const noop = () => {};
  const context = new Proxy(
    {
      measureText: (text) => ({ width: String(text).length * 8 }),
      getImageData: () => ({ data: new Uint8ClampedArray(4) }),
      createImageData: () => ({ data: new Uint8ClampedArray(4) }),
      createLinearGradient: () => ({ addColorStop: noop }),
      createRadialGradient: () => ({ addColorStop: noop }),
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
  dom.window.eval(fs.readFileSync(rendererPath, "utf8"));

  const symbolMap =
    dom.window.armyc2.c2sd.renderer.utilities.SymbolDefTable.getSymbolMap(1);
  return Object.values(symbolMap).filter(
    (definition) =>
      (definition.symbolID.startsWith("WA") || definition.symbolID.startsWith("WO")) &&
      definition.drawCategory !== 0,
  );
}

function expandPrintDashes(value) {
  return value
    .replaceAll("\u2014", "---")
    .replaceAll("\u2013", "--")
    .replaceAll("\u2212", "-")
    .replace(/\s/g, "");
}

async function loadHierarchyByFunctionId() {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Catalog request failed with HTTP ${response.status}`);
  }
  const dom = new JSDOM(await response.text());
  const result = new Map();
  for (const row of dom.window.document.querySelectorAll("table tr")) {
    const cells = [...row.querySelectorAll("td")].map((cell) =>
      cell.textContent.trim().replace(/\s+/g, " "),
    );
    if (cells.length < 3 || !cells[2].startsWith("Metoc /")) continue;
    const printedSidc = expandPrintDashes(cells[1]);
    result.set(printedSidc.slice(0, 10), {
      sourceName: cells[0],
      hierarchy: cells[2].split(" / ").slice(1),
    });
  }
  return result;
}

function familyFor(definition, hierarchy) {
  const joined = hierarchy.join(" / ");
  if (definition.symbolID.startsWith("WO")) {
    return joined.includes("Geophysics/Acoustics") ? "geophysics" : "oceanic";
  }
  if (joined.includes("State of the Ground")) return "ground";
  if (
    joined.includes("Weather Symbols") ||
    joined.includes("Cloud Coverage") ||
    joined.includes("Turbulence") ||
    joined.includes("Icing")
  ) {
    return "weather";
  }
  if (joined.includes(" / Winds") && !joined.includes("Weather Symbols")) {
    return "wind";
  }
  if (
    joined.includes("Isopleths") ||
    joined.includes("Bounded Areas") ||
    joined.includes("Pressure Systems / Lines")
  ) {
    return "lines";
  }
  return "atmosphere";
}

function geometryFor(drawCategory) {
  if (drawCategory === 8) return "Point";
  if (drawCategory === 3) return "Polygon";
  return "LineString";
}

function effectiveMinPoints(geometry, reportedMinPoints) {
  if (geometry === "Point") return 1;
  if (geometry === "Polygon") return Math.max(3, reportedMinPoints);
  return Math.max(2, reportedMinPoints);
}

const definitions = loadSymbolDefinitions();
const hierarchyByFunctionId = await loadHierarchyByFunctionId();
const catalog = definitions
  .map((definition) => {
    const source = hierarchyByFunctionId.get(definition.symbolID.slice(0, 10));
    const hierarchy =
      source?.hierarchy ??
      (definition.symbolID.startsWith("WO")
        ? ["Oceanic", definition.description]
        : ["Atmospheric", definition.description]);
    const geometry = geometryFor(definition.drawCategory);
    return {
      id: definition.symbolID,
      sidc: definition.symbolID,
      label: translateMetocText(source?.sourceName ?? definition.description),
      labelEn: source?.sourceName ?? definition.description,
      family: familyFor(definition, hierarchy),
      group: hierarchy.at(-2) ?? hierarchy[0],
      groupFa: translateMetocText(hierarchy.at(-2) ?? hierarchy[0]),
      hierarchy,
      geometry,
      minPoints: effectiveMinPoints(geometry, definition.minPoints),
      maxPoints: definition.maxPoints,
    };
  })
  .sort((a, b) => {
    const familyOrder = [
      "atmosphere",
      "weather",
      "wind",
      "lines",
      "oceanic",
      "geophysics",
      "ground",
    ];
    return (
      familyOrder.indexOf(a.family) - familyOrder.indexOf(b.family) ||
      a.group.localeCompare(b.group, "en") ||
      a.labelEn.localeCompare(b.labelEn, "en")
    );
  });

fs.writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Wrote ${catalog.length} drawable METOC symbols to ${outputPath}`);
