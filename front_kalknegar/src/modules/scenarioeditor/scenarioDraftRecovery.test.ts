import { describe, expect, it } from "vitest";

import type { Scenario } from "@/types/scenarioModels";
import {
  decideScenarioDraftRecovery,
  newestScenarioDraft,
  type ScenarioDraftCandidate,
} from "./scenarioDraftRecovery";

const scenario = { id: "scenario-1" } as Scenario;

const draft = (
  updatedAt: number,
  savedComparisonKey?: string,
): ScenarioDraftCandidate => ({
  scenarioId: scenario.id,
  scenario,
  updatedAt,
  savedComparisonKey,
});

describe("scenario draft recovery", () => {
  it("selects the newest local candidate", () => {
    expect(newestScenarioDraft(draft(10), draft(20))?.updatedAt).toBe(20);
  });

  it("restores a draft based on the current server version", () => {
    const version = "2026-07-28T08:00:00.000Z";
    expect(decideScenarioDraftRecovery(draft(20, version), version).kind).toBe(
      "restore",
    );
  });

  it("requires confirmation when the server changed after the draft base", () => {
    expect(
      decideScenarioDraftRecovery(
        draft(20, "2026-07-28T08:00:00.000Z"),
        "2026-07-28T08:05:00.000Z",
      ).kind,
    ).toBe("conflict");
  });
});
