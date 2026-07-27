import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useScenario } from "@/scenariostore";
import { PhaseStatus, type Scenario } from "@/types/scenarioModels";
import { validateScenarioPhases } from "./phases";

function scenarioWithPhases(): Scenario {
  return {
    id: "phase-test",
    type: "ORBAT-mapper",
    version: "0.41.0",
    name: "Phase test",
    sides: [],
    layers: [],
    mapLayers: [],
    events: [
      {
        id: "event-1",
        title: "Event",
        startTime: 1500,
        phaseId: "phase-1",
      },
    ],
    phases: [
      {
        id: "phase-1",
        name: "Phase 1",
        startTime: 1000,
        endTime: 2000,
        objectives: ["Objective"],
        tasks: [],
        status: PhaseStatus.PLANNED,
        order: 0,
      },
    ],
  };
}

describe("scenario phases", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("loads and serializes phases and event associations", () => {
    const { scenario } = useScenario();
    scenario.value.io.loadFromObject(scenarioWithPhases());

    const serialized = scenario.value.io.toObject();
    expect(serialized.phases).toEqual(scenarioWithPhases().phases);
    expect(serialized.events[0].phaseId).toBe("phase-1");
  });

  it("removes event associations when a phase is deleted", () => {
    const { scenario } = useScenario();
    scenario.value.io.loadFromObject(scenarioWithPhases());

    scenario.value.phases.deletePhase("phase-1");

    expect(scenario.value.store.state.phases).toEqual([]);
    expect(scenario.value.store.state.eventMap["event-1"].phaseId).toBeUndefined();
  });

  it("detects invalid ranges and phase overlaps", () => {
    const phases = scenarioWithPhases().phases!;
    const issues = validateScenarioPhases([
      ...phases,
      {
        ...phases[0],
        id: "phase-2",
        name: "Phase 2",
        startTime: 1500,
        endTime: 1400,
      },
    ]);

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "invalid-range", phaseId: "phase-2" }),
        expect.objectContaining({ type: "overlap", phaseId: "phase-2" }),
      ]),
    );
  });
});
