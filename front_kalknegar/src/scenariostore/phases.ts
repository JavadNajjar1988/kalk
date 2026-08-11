import { klona } from "klona";
import { nanoid } from "@/utils";
import type { ScenarioPhase } from "@/types/scenarioModels";
import type { NewScenarioStore } from "./newScenarioStore";

export type ScenarioPhaseInput = Omit<ScenarioPhase, "id" | "order"> & {
  id?: string;
  order?: number;
};

export interface PhaseValidationIssue {
  type: "invalid-range" | "overlap";
  phaseId: string;
  relatedPhaseId?: string;
}

export function validateScenarioPhases(phases: ScenarioPhase[]) {
  const sorted = [...phases].sort((a, b) => Number(a.startTime) - Number(b.startTime));
  const issues: PhaseValidationIssue[] = [];

  sorted.forEach((phase) => {
    if (phase.endTime !== undefined && Number(phase.endTime) <= Number(phase.startTime)) {
      issues.push({ type: "invalid-range", phaseId: phase.id });
    }
  });

  for (let currentIndex = 1; currentIndex < sorted.length; currentIndex += 1) {
    const current = sorted[currentIndex];
    for (let previousIndex = 0; previousIndex < currentIndex; previousIndex += 1) {
      const previous = sorted[previousIndex];
      if (
        previous.endTime !== undefined &&
        Number(current.startTime) < Number(previous.endTime)
      ) {
        issues.push({
          type: "overlap",
          phaseId: current.id,
          relatedPhaseId: previous.id,
        });
      }
    }
  }

  return issues;
}

export function useScenarioPhases(store: NewScenarioStore) {
  function normalizeOrder(phases: ScenarioPhase[]) {
    phases.forEach((phase, index) => {
      phase.order = index;
    });
  }

  function addPhase(input: ScenarioPhaseInput) {
    const id = input.id || nanoid();
    store.update(
      (state) => {
        state.phases.push({
          ...klona(input),
          id,
          order: state.phases.length,
        });
        normalizeOrder(state.phases);
      },
      { label: "addPhase", value: id },
    );
    return id;
  }

  function updatePhase(id: string, input: Partial<ScenarioPhaseInput>) {
    store.update(
      (state) => {
        const index = state.phases.findIndex((phase) => phase.id === id);
        if (index < 0) return;
        state.phases[index] = {
          ...state.phases[index],
          ...klona(input),
          id,
        };
      },
      { label: "updatePhase", value: id },
    );
  }

  function deletePhase(id: string) {
    store.update(
      (state) => {
        state.phases = state.phases.filter((phase) => phase.id !== id);
        normalizeOrder(state.phases);
        Object.values(state.eventMap).forEach((event) => {
          if (event.phaseId === id) event.phaseId = undefined;
        });
      },
      { label: "deletePhase", value: id },
    );
  }

  function movePhase(id: string, direction: -1 | 1) {
    store.update(
      (state) => {
        const index = state.phases.findIndex((phase) => phase.id === id);
        const destination = index + direction;
        if (index < 0 || destination < 0 || destination >= state.phases.length) return;
        [state.phases[index], state.phases[destination]] = [
          state.phases[destination],
          state.phases[index],
        ];
        normalizeOrder(state.phases);
      },
      { label: "movePhase", value: id },
    );
  }

  function setPhaseEvents(phaseId: string, eventIds: string[]) {
    store.update(
      (state) => {
        if (!state.phases.some((phase) => phase.id === phaseId)) return;
        const selectedIds = new Set(eventIds);

        state.events.forEach((eventId) => {
          const event = state.eventMap[eventId];
          if (!event || event._type !== "scenario") return;

          if (selectedIds.has(eventId)) {
            event.phaseId = phaseId;
          } else if (event.phaseId === phaseId) {
            event.phaseId = undefined;
          }
        });
      },
      { label: "setPhaseEvents", value: phaseId },
    );
  }

  return { addPhase, updatePhase, deletePhase, movePhase, setPhaseEvents };
}
