import { describe, expect, it } from "vitest";
import { Sidc } from "@/symbology/sidc";
import { applySymbolSearchSelection } from "@/symbology/symbolSelection";

function createSidc(overrides: Partial<Sidc> = {}) {
  const sidc = new Sidc("10031000001211000000");
  Object.assign(sidc, overrides);
  return sidc.toString();
}

describe("applySymbolSearchSelection", () => {
  it("keeps compatible fields when the result belongs to the current symbol set", () => {
    const current = createSidc({
      status: "1",
      hqtfd: "2",
      amplifier: "1",
      amplifierDescriptor: "6",
      modifierOne: "03",
      modifierTwo: "04",
    });
    const selected = createSidc({ modifierOne: "09" });

    const result = new Sidc(
      applySymbolSearchSelection(current, {
        sidc: selected,
        category: "Modifier 1",
      }),
    );

    expect(result.status).toBe("1");
    expect(result.hqtfd).toBe("2");
    expect(result.emt).toBe("16");
    expect(result.mainIcon).toBe("121100");
    expect(result.modifierOne).toBe("09");
    expect(result.modifierTwo).toBe("04");
  });

  it("resets incompatible fields when the result changes the symbol set", () => {
    const current = createSidc({
      status: "1",
      hqtfd: "2",
      amplifier: "1",
      amplifierDescriptor: "6",
      modifierOne: "03",
      modifierTwo: "04",
    });
    const selected = createSidc({
      symbolSet: "30",
      entity: "12",
      entityType: "02",
      entitySubType: "00",
    });

    const result = new Sidc(
      applySymbolSearchSelection(current, {
        sidc: selected,
        category: "Main icon",
      }),
    );

    expect(result.standardIdentity).toBe("3");
    expect(result.status).toBe("1");
    expect(result.symbolSet).toBe("30");
    expect(result.hqtfd).toBe("0");
    expect(result.emt).toBe("00");
    expect(result.mainIcon).toBe("120200");
    expect(result.modifierOne).toBe("00");
    expect(result.modifierTwo).toBe("00");
  });
});
