import type { Scenario } from "@/types/scenarioModels";

export interface ScenarioDraftCandidate {
  scenarioId: string;
  scenario: Scenario;
  updatedAt: number;
  savedComparisonKey?: string;
}

export type ScenarioDraftRecoveryDecision =
  | { kind: "none" }
  | { kind: "restore"; draft: ScenarioDraftCandidate }
  | { kind: "conflict"; draft: ScenarioDraftCandidate };

export function newestScenarioDraft(
  ...drafts: Array<ScenarioDraftCandidate | null | undefined>
) {
  return drafts
    .filter((draft): draft is ScenarioDraftCandidate => Boolean(draft))
    .sort((a, b) => b.updatedAt - a.updatedAt)[0];
}

function sameServerVersion(left: string, right: string) {
  const leftTime = Date.parse(left);
  const rightTime = Date.parse(right);
  return (
    Number.isFinite(leftTime) &&
    Number.isFinite(rightTime) &&
    leftTime === rightTime
  );
}

export function decideScenarioDraftRecovery(
  draft: ScenarioDraftCandidate | null | undefined,
  serverModified: string | null,
): ScenarioDraftRecoveryDecision {
  if (!draft) return { kind: "none" };
  if (!serverModified) return { kind: "restore", draft };

  if (
    draft.savedComparisonKey &&
    sameServerVersion(draft.savedComparisonKey, serverModified)
  ) {
    return { kind: "restore", draft };
  }

  return { kind: "conflict", draft };
}
