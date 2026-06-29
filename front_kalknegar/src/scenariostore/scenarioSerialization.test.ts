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
});
