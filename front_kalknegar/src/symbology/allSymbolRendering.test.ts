import { describe, expect, it } from "vitest";
import { app6d } from "./standards/app6d";
import { ms2525d } from "./standards/milstd2525";
import { symbolGenerator } from "./milsymbwrapper";

function sidc(symbolSet: string, code: string) {
  return `1003${symbolSet}0000${code}0000`;
}

function definitions(standard: typeof ms2525d) {
  return Object.values(standard).flatMap((symbolSet) =>
    symbolSet.mainIcon.map((item) => ({
      symbolSet: symbolSet.symbolSet,
      code: item.code,
    })),
  );
}

describe("all numeric military symbols", () => {
  it.each([
    ["MIL-STD-2525D", definitions(ms2525d)],
    ["APP-6D", definitions(app6d)],
  ])("renders every %s base definition", (_name, symbols) => {
    const failures = symbols.flatMap((symbol) => {
      const code = sidc(symbol.symbolSet, symbol.code);
      try {
        const svg = symbolGenerator(code, { size: 32 }).asSVG();
        return svg.includes("<svg") ? [] : [code];
      } catch {
        return [code];
      }
    });

    expect(failures).toEqual([]);
  });
});
