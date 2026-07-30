import { describe, expect, it } from "vitest";
import {
  DEFAULT_METOC_SYMBOL,
  METOC_FAMILIES,
  METOC_SYMBOLS,
  findMetocSymbol,
} from "./metocCatalog";

describe("MIL-STD-2525C METOC catalog", () => {
  it("contains every drawable definition exposed by the renderer", () => {
    expect(METOC_SYMBOLS).toHaveLength(345);
    expect(new Set(METOC_SYMBOLS.map((symbol) => symbol.sidc)).size).toBe(345);
    expect(METOC_SYMBOLS.every((symbol) => symbol.sidc.length === 15)).toBe(true);
    expect(
      METOC_SYMBOLS.every(
        (symbol) =>
          symbol.label.length > 0 &&
          symbol.groupFa.length > 0 &&
          !/[A-Za-z]{2,}/.test(
            `${symbol.label} ${symbol.groupFa}`.replace(/\b(?:IFR|MVFR|VDR|MIW)\b/g, ""),
          ),
      ),
    ).toBe(true);
  });

  it("covers all map.army METOC families and drawing geometries", () => {
    const families = new Set(METOC_SYMBOLS.map((symbol) => symbol.family));
    const geometries = new Set(METOC_SYMBOLS.map((symbol) => symbol.geometry));

    expect(families).toEqual(new Set(METOC_FAMILIES.map((family) => family.id)));
    expect(geometries).toEqual(new Set(["Point", "LineString", "Polygon"]));
  });

  it("migrates legacy short weather identifiers", () => {
    expect(findMetocSymbol("W-S-WSR-LI")?.sidc).toBe("WAS-WSR-MCP----");
    expect(findMetocSymbol("W-S-WSFGSO")?.sidc).toBe("WAS-WSFGSOP----");
    expect(DEFAULT_METOC_SYMBOL.labelEn).toBe("Rain - Continuous Moderate");
  });
});
