import { describe, expect, it } from "vitest";
import { stringifyScenarioObject } from "./scenarioSerialization";

describe("stringifyScenarioObject", () => {
  it("keeps tactical timed-state timestamps numeric", () => {
    const timestamp = Date.parse("1981-11-29T01:15:00Z");
    const scenario = {
      sides: [
        {
          groups: [
            {
              subUnits: [
                {
                  state: [{ t: timestamp }],
                },
              ],
            },
          ],
        },
      ],
      metadata: {
        tacticalSymbols: {
          version: 1,
          tuples: [
            [
              "timed+feature:feature:test",
              [{ t: timestamp, properties: { label: "advance" } }],
            ],
          ],
        },
      },
    };

    const parsed = JSON.parse(stringifyScenarioObject(scenario, "UTC"));

    expect(parsed.sides[0].groups[0].subUnits[0].state[0].t).toBe("1981-11-29T01:15:00Z");
    expect(parsed.metadata.tacticalSymbols.tuples[0][1][0].t).toBe(timestamp);
  });

  it("preserves environmental erase masks as geographic data", () => {
    const scenario = {
      environmentalConditions: [
        {
          id: "rain-front",
          kind: "metoc",
          scope: "area",
          startTime: 0,
          parameters: {},
          eraseZones: [
            {
              mode: "cut",
              coordinates: [
                [51.25, 35.75],
                [51.3, 35.8],
              ],
              radiusMeters: 450,
            },
          ],
          renderReference: {
            version: 1,
            renderer: "mission-command",
            authoredResolution: 12.5,
            authoredScale: 47_244,
            pointSizeMeters: 450,
            artifact: {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  properties: { strokeColor: "#2563eb" },
                  geometry: {
                    type: "LineString",
                    coordinates: [
                      [51.25, 35.75],
                      [51.3, 35.8],
                    ],
                  },
                },
              ],
            },
          },
        },
      ],
    };

    const parsed = JSON.parse(stringifyScenarioObject(scenario, "UTC"));

    expect(parsed.environmentalConditions[0].eraseZones).toEqual(
      scenario.environmentalConditions[0].eraseZones,
    );
    expect(parsed.environmentalConditions[0].renderReference).toEqual(
      scenario.environmentalConditions[0].renderReference,
    );
  });
});
