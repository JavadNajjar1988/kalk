import { describe, expect, it } from "vitest";
import type { Scenario } from "@/types/scenarioModels";
import { upgradeScenarioIfNecessary } from "./upgrade";

function buildScenarioFixture(version: any, mediaUrl: string): Scenario {
  return {
    id: "s1",
    type: "ORBAT-mapper",
    version,
    name: "Test",
    sides: [
      {
        id: "side-1",
        name: "Blue",
        standardIdentity: "3",
        groups: [
          {
            id: "g1",
            name: "G1",
            subUnits: [
              {
                id: "u1",
                name: "U1",
                sidc: "10031000000000000000",
                media: [{ url: mediaUrl, caption: "old" } as any],
                subUnits: [
                  {
                    id: "u2",
                    name: "U2",
                    sidc: "10031000000000000000",
                    media: [
                      {
                        url: mediaUrl + "/child",
                        caption: "child",
                      } as any,
                    ],
                  },
                ],
              },
            ],
          },
        ],
      } as any,
    ],
    events: [],
    layers: [],
    mapLayers: [],
  } as any;
}

describe("upgradeScenarioIfNecessary", () => {
  it("normalizes legacy media.url into resource-aware Media shape (0.40 → 0.41)", () => {
    const legacy = buildScenarioFixture("0.40.0", "https://example.com/img.png");
    const upgraded = upgradeScenarioIfNecessary(legacy);
    expect(upgraded.version).toBe("0.41.0");
    const unit = upgraded.sides[0].groups[0].subUnits[0];
    const media = unit.media?.[0];
    expect(media).toBeDefined();
    expect(media?.mediaId).toBeUndefined();
    expect(media?.url).toBe("https://example.com/img.png");
    expect(media?.caption).toBe("old");
    // recurses into sub-units
    const child = unit.subUnits?.[0]?.media?.[0];
    expect(child?.url).toBe("https://example.com/img.png/child");
  });

  it("leaves modern scenarios untouched", () => {
    const modern = buildScenarioFixture("0.41.0", "https://example.com/m.png");
    const upgraded = upgradeScenarioIfNecessary(modern);
    expect(upgraded.version).toBe("0.41.0");
    // still has url because we don't auto-fetch and replace
    const media = upgraded.sides[0].groups[0].subUnits[0].media?.[0];
    expect(media?.url).toBe("https://example.com/m.png");
  });

  it("preserves explicit mediaId when already migrated", () => {
    const modern = buildScenarioFixture("0.40.0", "https://example.com/x.png");
    modern.sides[0].groups[0].subUnits[0].media![0] = {
      mediaId: "abc123",
      url: "https://legacy/x.png",
      caption: "explicit",
    } as any;
    const upgraded = upgradeScenarioIfNecessary(modern);
    const media = upgraded.sides[0].groups[0].subUnits[0].media?.[0];
    expect(media?.mediaId).toBe("abc123");
    expect(upgraded.version).toBe("0.41.0");
  });
});
