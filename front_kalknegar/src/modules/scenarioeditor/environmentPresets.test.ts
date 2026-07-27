import { describe, expect, it } from "vitest";
import { ENVIRONMENT_PRESETS } from "./environmentPresets";

describe("environment presets", () => {
  it("covers atmosphere, terrain and infrastructure groups", () => {
    const categories = new Set(ENVIRONMENT_PRESETS.map((preset) => preset.category));
    expect(categories).toEqual(
      new Set(["atmosphere", "terrain", "infrastructure"]),
    );
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
});
