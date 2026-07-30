import catalog from "./metocCatalog.generated.json";
import type { EnvironmentPreset } from "./environmentPresets";

export type MetocFamily =
  | "atmosphere"
  | "weather"
  | "wind"
  | "lines"
  | "oceanic"
  | "geophysics"
  | "ground";

export type MetocGeometry = "Point" | "LineString" | "Polygon";

export interface MetocSymbol {
  id: string;
  sidc: string;
  label: string;
  labelEn: string;
  family: MetocFamily;
  group: string;
  groupFa: string;
  hierarchy: string[];
  geometry: MetocGeometry;
  minPoints: number;
  maxPoints: number;
}

export const METOC_FAMILIES: ReadonlyArray<{
  id: MetocFamily;
  label: string;
}> = [
  { id: "atmosphere", label: "جو" },
  { id: "weather", label: "پدیده‌های جوی" },
  { id: "wind", label: "باد" },
  { id: "lines", label: "خطوط و محدوده‌ها" },
  { id: "oceanic", label: "اقیانوسی" },
  { id: "geophysics", label: "ژئوفیزیک و صوت" },
  { id: "ground", label: "وضعیت زمین" },
];

export const METOC_SYMBOLS = catalog as MetocSymbol[];

const symbolBySidc = new Map(METOC_SYMBOLS.map((symbol) => [symbol.sidc, symbol]));
const legacySidcAliases: Record<string, string> = {
  "W-S-WSR-LI": "WAS-WSR-MCP----",
  "W-S-WSS-LI": "WAS-WSS-MCP----",
  "W-S-WSGRL-": "WAS-WSGRMHP----",
  "W-S-WSTMH-": "WAS-WSTMH-P----",
  "W-S-WSDSLM": "WAS-WSDSLMP----",
  "W-S-WSFGSO": "WAS-WSFGSOP----",
  "W-S-WSD-LI": "WAS-GND-NCP----",
};

const familyColors: Record<MetocFamily, string> = {
  atmosphere: "#2563eb",
  weather: "#0369a1",
  wind: "#0891b2",
  lines: "#7c3aed",
  oceanic: "#0e7490",
  geophysics: "#475569",
  ground: "#854d0e",
};

export function metocDisplayName(symbol: MetocSymbol) {
  return symbol.label || symbol.labelEn;
}

export function findMetocSymbol(sidc?: string) {
  if (!sidc) return undefined;
  return symbolBySidc.get(sidc) ?? symbolBySidc.get(legacySidcAliases[sidc]);
}

export function metocSymbolAsPreset(symbol: MetocSymbol): EnvironmentPreset {
  return {
    id: `metoc:${symbol.id}`,
    category: "atmosphere",
    label: metocDisplayName(symbol),
    kind: "metoc",
    emoji: "",
    color: familyColors[symbol.family],
    metocSidc: symbol.sidc,
    parameters: {
      metocFamily: symbol.family,
      metocGroup: symbol.group,
      metocGroupFa: symbol.groupFa,
      standardName: symbol.labelEn,
      geometryType: symbol.geometry,
    },
    fields: [],
  };
}

export const DEFAULT_METOC_SYMBOL =
  METOC_SYMBOLS.find((symbol) => symbol.labelEn === "Rain - Continuous Moderate") ??
  METOC_SYMBOLS[0];
