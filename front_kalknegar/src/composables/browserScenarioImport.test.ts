import { describe, expect, it } from "vitest";
import { normalizeImportedScenarioId } from "./browserScenarioImport";
import type { Scenario } from "@/types/scenarioModels";

function createScenario(id: string): Scenario {
  return {
    id,
    type: "ORBAT-mapper",
    version: "0.41.0",
    name: "Imported scenario",
    sides: [],
    events: [],
    layers: [],
    mapLayers: [],
  };
}

describe("normalizeImportedScenarioId", () => {
  it("replaces demo ids so imported JSON is editable with autosave enabled", () => {
    const scenario = createScenario("demo-imported-sample");

    const normalized = normalizeImportedScenarioId(scenario, () => "imported-copy");

    expect(normalized.id).toBe("imported-copy");
    expect(scenario.id).toBe("demo-imported-sample");
  });

  it("keeps regular imported ids unchanged", () => {
    const scenario = createScenario("regular-scenario");

    const normalized = normalizeImportedScenarioId(scenario, () => "unused-id");

    expect(normalized).toBe(scenario);
    expect(normalized.id).toBe("regular-scenario");
  });
});
