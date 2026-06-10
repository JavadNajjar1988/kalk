import type { Scenario } from "@/types/scenarioModels";
import { nanoid } from "@/utils";

export function isDemoScenarioId(scenarioId?: string | null) {
  return scenarioId?.startsWith("demo-") === true;
}

export function normalizeImportedScenarioId(
  scenario: Scenario,
  createId: () => string = nanoid,
): Scenario {
  if (!isDemoScenarioId(scenario.id)) {
    return scenario;
  }

  return {
    ...scenario,
    id: createId(),
  };
}
