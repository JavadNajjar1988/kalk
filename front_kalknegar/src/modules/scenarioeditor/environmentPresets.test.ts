import { describe, expect, it } from "vitest";
import { symbolGenerator } from "@/symbology/milsymbwrapper";
import { ENVIRONMENT_PRESETS } from "./environmentPresets";

describe("environment presets", () => {
  it("covers atmosphere, terrain and infrastructure groups", () => {
    const categories = new Set(ENVIRONMENT_PRESETS.map((preset) => preset.category));
    expect(categories).toEqual(new Set(["atmosphere", "terrain", "infrastructure"]));
    expect(ENVIRONMENT_PRESETS.length).toBeGreaterThanOrEqual(25);
  });

  it("provides editable fields backed by default parameters", () => {
    ENVIRONMENT_PRESETS.forEach((preset) => {
      preset.fields.forEach((field) => {
        expect(
          Object.prototype.hasOwnProperty.call(preset.parameters, field.key),
          `${preset.id}.${field.key}`,
        ).toBe(true);
      });
    });
  });

  it("keeps preset ids unique", () => {
    const ids = ENVIRONMENT_PRESETS.map((preset) => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("renders a military symbol for every preset", () => {
    ENVIRONMENT_PRESETS.forEach((preset) => {
      expect(preset.metocSidc, preset.id).toBeTruthy();
      expect(
        symbolGenerator(preset.metocSidc, { size: 24 }).asSVG(),
        preset.id,
      ).toContain("<svg");
    });
  });
});
