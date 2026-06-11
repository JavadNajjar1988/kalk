import { describe, expect, it } from "vitest";

import {
  DEFAULT_SCENARIO_LAYER_NAME,
  getScenarioFeatureDefaultName,
  getScenarioFeatureTypeLabel,
  getScenarioLayerDisplayName,
} from "./scenarioFeatureNaming";

describe("scenario feature naming", () => {
  it("uses Persian defaults for scenario feature layers", () => {
    expect(DEFAULT_SCENARIO_LAYER_NAME).toBe("ویژگی‌ها");
    expect(getScenarioLayerDisplayName("Features")).toBe("ویژگی‌ها");
    expect(getScenarioLayerDisplayName("New layer")).toBe("لایه جدید");
    expect(getScenarioLayerDisplayName("مسیر حمله")).toBe("مسیر حمله");
  });

  it("uses Persian geometry labels", () => {
    expect(getScenarioFeatureTypeLabel("Point")).toBe("نقطه");
    expect(getScenarioFeatureTypeLabel("LineString")).toBe("خط");
    expect(getScenarioFeatureTypeLabel("Polygon")).toBe("چندضلعی");
    expect(getScenarioFeatureTypeLabel("Circle")).toBe("دایره");
  });

  it("builds Persian default feature names with sequence numbers", () => {
    expect(getScenarioFeatureDefaultName("Circle", 3)).toBe("دایره ۳");
    expect(getScenarioFeatureDefaultName("Point", 12)).toBe("نقطه ۱۲");
  });
});
