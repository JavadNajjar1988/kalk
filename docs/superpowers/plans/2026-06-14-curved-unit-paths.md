# Curved Unit Paths Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add user-editable curved unit movement paths that affect both displayed track geometry and time interpolation.

**Architecture:** Add a small shared path utility that turns movement control points into either a straight point sequence or a sampled Catmull-Rom curve. Wire that utility into unit time interpolation and unit history rendering so displayed paths and movement paths stay identical. Add a state-level `pathMode` field and expose it from the unit path toolbar for the selected waypoint segment.

**Tech Stack:** Vue 3, TypeScript, OpenLayers, Turf, Vitest.

---

## File Structure

- Create `front_kalknegar/src/geo/unitPath.ts`: owns `PathMode`, `buildUnitPathCoordinates`, and Catmull-Rom sampling.
- Create `front_kalknegar/src/geo/unitPath.test.ts`: focused unit tests for straight and curved path generation.
- Modify `front_kalknegar/src/types/scenarioModels.ts`: add `pathMode?: PathMode` to `State`.
- Modify `front_kalknegar/src/scenariostore/time.ts`: use the shared path builder before `turfLength` and `turfAlong`.
- Create `front_kalknegar/src/scenariostore/time.test.ts`: test straight behavior and curved interpolation behavior.
- Modify `front_kalknegar/src/geo/history.ts`: render curved display paths while preserving editable control-point geometry.
- Create `front_kalknegar/src/geo/history.test.ts`: test path feature generation for curved state entries.
- Create `front_kalknegar/src/modules/scenarioeditor/unitTrackPathMode.ts`: maps selected waypoint ids to unit state entries.
- Create `front_kalknegar/src/modules/scenarioeditor/unitTrackPathMode.test.ts`: tests selected waypoint to state mapping.
- Modify `front_kalknegar/src/modules/scenarioeditor/MapEditorUnitTrackToolbar.vue`: expose straight and curved path mode buttons for selected waypoint segments.
- Modify `front_kalknegar/src/modules/scenarioeditor/UnitPanelState.vue`: keep a visible curved-path hint in the state list.

---

### Task 1: Shared Unit Path Builder

**Files:**
- Create: `front_kalknegar/src/geo/unitPath.ts`
- Test: `front_kalknegar/src/geo/unitPath.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import { buildUnitPathCoordinates } from "@/geo/unitPath";

describe("buildUnitPathCoordinates", () => {
  it("returns original coordinates for straight mode", () => {
    const input = [
      [0, 0],
      [1, 1],
      [2, 0],
    ];

    expect(buildUnitPathCoordinates(input, "straight")).toEqual(input);
  });

  it("samples a curved path through control points", () => {
    const input = [
      [0, 0],
      [1, 1],
      [2, 0],
      [3, 1],
    ];

    const output = buildUnitPathCoordinates(input, "curved", { samplesPerSegment: 8 });

    expect(output.length).toBeGreaterThan(input.length);
    expect(output[0]).toEqual([0, 0]);
    expect(output[output.length - 1]).toEqual([3, 1]);
    expect(output.some(([x, y]) => x > 1 && x < 2 && y !== 1 && y !== 0)).toBe(true);
  });

  it("falls back to straight when curved mode has fewer than three points", () => {
    const input = [
      [0, 0],
      [1, 1],
    ];

    expect(buildUnitPathCoordinates(input, "curved")).toEqual(input);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm run test:unit -- src/geo/unitPath.test.ts --run`

Expected: FAIL because `@/geo/unitPath` does not exist.

- [ ] **Step 3: Implement path builder**

```ts
import type { Position } from "geojson";

export type PathMode = "straight" | "curved";

export interface BuildUnitPathOptions {
  samplesPerSegment?: number;
}

function clonePosition(position: Position): Position {
  return [...position];
}

function catmullRomPoint(
  p0: Position,
  p1: Position,
  p2: Position,
  p3: Position,
  t: number,
): Position {
  const t2 = t * t;
  const t3 = t2 * t;
  const x =
    0.5 *
    (2 * p1[0] +
      (-p0[0] + p2[0]) * t +
      (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
      (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
  const y =
    0.5 *
    (2 * p1[1] +
      (-p0[1] + p2[1]) * t +
      (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
      (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);

  return p1.length > 2 ? [x, y, p1[2]] : [x, y];
}

export function buildUnitPathCoordinates(
  coordinates: Position[],
  mode: PathMode = "straight",
  options: BuildUnitPathOptions = {},
): Position[] {
  if (mode !== "curved" || coordinates.length < 3) {
    return coordinates.map(clonePosition);
  }

  const samplesPerSegment = Math.max(4, Math.min(options.samplesPerSegment ?? 16, 48));
  const result: Position[] = [clonePosition(coordinates[0])];

  for (let i = 0; i < coordinates.length - 1; i++) {
    const p0 = coordinates[Math.max(0, i - 1)];
    const p1 = coordinates[i];
    const p2 = coordinates[i + 1];
    const p3 = coordinates[Math.min(coordinates.length - 1, i + 2)];

    for (let sample = 1; sample <= samplesPerSegment; sample++) {
      const t = sample / samplesPerSegment;
      result.push(sample === samplesPerSegment ? clonePosition(p2) : catmullRomPoint(p0, p1, p2, p3, t));
    }
  }

  return result;
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm run test:unit -- src/geo/unitPath.test.ts --run`

Expected: PASS.

---

### Task 2: Data Model and Time Interpolation

**Files:**
- Modify: `front_kalknegar/src/types/scenarioModels.ts`
- Modify: `front_kalknegar/src/scenariostore/time.ts`
- Test: `front_kalknegar/src/scenariostore/time.test.ts`

- [ ] **Step 1: Write failing interpolation tests**

```ts
import { describe, expect, it } from "vitest";
import { updateCurrentUnitState } from "@/scenariostore/time";
import type { NUnit } from "@/types/internalModels";

function unitWithState(pathMode?: "straight" | "curved"): NUnit {
  return {
    id: "unit-1",
    name: "Unit 1",
    sidc: "10031000141211000000",
    location: [0, 0],
    state: [
      {
        id: "state-1",
        t: 1000,
        location: [2, 0],
        via: [[1, 2]],
        pathMode,
      },
    ],
  } as NUnit;
}

describe("updateCurrentUnitState path interpolation", () => {
  it("keeps existing straight interpolation as the default", () => {
    const unit = unitWithState();

    updateCurrentUnitState(unit, 500);

    expect(unit._state?.type).toBe("interpolated");
    expect(unit._state?.location?.[0]).toBeCloseTo(1, 1);
  });

  it("moves along the sampled curved path when pathMode is curved", () => {
    const unit = unitWithState("curved");

    updateCurrentUnitState(unit, 500);

    expect(unit._state?.type).toBe("interpolated");
    expect(unit._state?.location?.[1]).toBeGreaterThan(0.5);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm run test:unit -- src/scenariostore/time.test.ts --run`

Expected: FAIL because `pathMode` is not typed and interpolation ignores it.

- [ ] **Step 3: Add type and use shared builder**

In `front_kalknegar/src/types/scenarioModels.ts`, import `PathMode`:

```ts
import type { PathMode } from "@/geo/unitPath";
```

Add to `State`:

```ts
pathMode?: PathMode;
```

In `front_kalknegar/src/scenariostore/time.ts`, import:

```ts
import { buildUnitPathCoordinates } from "@/geo/unitPath";
```

Replace the interpolation `lineString(...)` construction with:

```ts
const pathCoordinates = buildUnitPathCoordinates(
  s.via ? [currentState.location, ...s.via, s.location] : [currentState.location, s.location],
  s.pathMode,
);
const n = lineString(pathCoordinates);
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm run test:unit -- src/scenariostore/time.test.ts src/geo/unitPath.test.ts --run`

Expected: PASS.

---

### Task 3: Curved Path Rendering

**Files:**
- Modify: `front_kalknegar/src/geo/history.ts`
- Test: `front_kalknegar/src/geo/history.test.ts`

- [ ] **Step 1: Write failing rendering test**

```ts
import { describe, expect, it, vi } from "vitest";
import { createUnitPathFeatures } from "@/geo/history";
import type { Unit } from "@/types/scenarioModels";

vi.mock("@/stores/timeFormatStore", () => ({
  useTimeFormatStore: () => ({
    trackFormatter: { format: (value: number) => String(value) },
  }),
}));

describe("createUnitPathFeatures", () => {
  it("renders curved arc geometry for curved movement states", () => {
    const unit = {
      id: "unit-1",
      name: "Unit 1",
      sidc: "10031000141211000000",
      location: [0, 0],
      state: [
        {
          id: "state-1",
          t: 1000,
          location: [2, 0],
          via: [[1, 2]],
          pathMode: "curved",
        },
      ],
    } as Unit;

    const { arcFeatures, legFeatures } = createUnitPathFeatures(unit, {
      isEditMode: true,
    });

    const arcCoordinates = arcFeatures[0].getGeometry()?.getCoordinates() ?? [];
    const legCoordinates = legFeatures[0].getGeometry()?.getCoordinates() ?? [];

    expect(arcCoordinates.length).toBeGreaterThan(legCoordinates.length);
    expect(legCoordinates.length).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm run test:unit -- src/geo/history.test.ts --run`

Expected: FAIL because curved mode does not change rendered path geometry.

- [ ] **Step 3: Use shared builder for display path**

In `front_kalknegar/src/geo/history.ts`, import:

```ts
import { buildUnitPathCoordinates } from "@/geo/unitPath";
```

When building each part, keep the editable `segment` based on control points, and build display segments per movement leg:

```ts
const editableSegment = [];
const displaySegment = [];
for (let i = 0; i < part.length - 1; i++) {
  const from = part[i];
  const to = part[i + 1];
  const controlPoints = to.via ? [from.location, ...to.via, to.location] : [from.location, to.location];
  const renderedPoints = buildUnitPathCoordinates(controlPoints, to.pathMode);

  if (i === 0) editableSegment.push([...from.location, from.t]);
  if (to.via) to.via.forEach((v) => editableSegment.push([...v, VIA_TIME]));
  editableSegment.push([...to.location, to.t]);

  if (displaySegment.length) renderedPoints.shift();
  displaySegment.push(...renderedPoints);
}
if (isEditMode) legFeatures.push(createSegmentFeature(editableSegment));
arcFeatures.push(createSegmentFeature(displaySegment, "XY"));
```

- [ ] **Step 4: Run test to verify pass**

Run: `npm run test:unit -- src/geo/history.test.ts src/geo/unitPath.test.ts --run`

Expected: PASS.

---

### Task 4: User Editing Controls

**Files:**
- Create: `front_kalknegar/src/modules/scenarioeditor/unitTrackPathMode.ts`
- Test: `front_kalknegar/src/modules/scenarioeditor/unitTrackPathMode.test.ts`
- Modify: `front_kalknegar/src/modules/scenarioeditor/MapEditorUnitTrackToolbar.vue`
- Modify: `front_kalknegar/src/modules/scenarioeditor/UnitPanelState.vue`

- [ ] **Step 1: Add selected waypoint mapping tests**

```ts
import { describe, expect, it } from "vitest";
import { getSelectedWaypointStateTargets } from "@/modules/scenarioeditor/unitTrackPathMode";
import type { NUnit } from "@/types/internalModels";

describe("getSelectedWaypointStateTargets", () => {
  it("returns unit and state indexes for selected waypoint state ids", () => {
    const units = [
      {
        id: "unit-1",
        state: [
          { id: "state-1", t: 100, location: [1, 1] },
          { id: "state-2", t: 200, location: [2, 2] },
        ],
      },
    ] as NUnit[];

    expect(getSelectedWaypointStateTargets(units, new Set(["state-2"]))).toEqual([
      { unitId: "unit-1", stateIndex: 1, stateId: "state-2" },
    ]);
  });
});
```

- [ ] **Step 2: Add the mapping helper**

Create `front_kalknegar/src/modules/scenarioeditor/unitTrackPathMode.ts`:

```ts
import type { EntityId } from "@/types/base";
import type { NUnit } from "@/types/internalModels";

export interface SelectedWaypointStateTarget {
  unitId: EntityId;
  stateIndex: number;
  stateId: EntityId;
}

export function getSelectedWaypointStateTargets(
  units: NUnit[],
  selectedWaypointIds: Set<string>,
): SelectedWaypointStateTarget[] {
  if (!selectedWaypointIds.size) return [];

  const targets: SelectedWaypointStateTarget[] = [];
  for (const unit of units) {
    unit.state?.forEach((stateEntry, stateIndex) => {
      if (stateEntry.id && selectedWaypointIds.has(stateEntry.id)) {
        targets.push({ unitId: unit.id, stateIndex, stateId: stateEntry.id });
      }
    });
  }
  return targets;
}
```

- [ ] **Step 3: Add toolbar buttons**

In `MapEditorUnitTrackToolbar.vue`, use `useSelectedWaypoints`, `activeScenarioKey`, and `getSelectedWaypointStateTargets` to compute selected waypoint state targets. Add two buttons next to the existing path controls:

```ts
function setSelectedPathMode(pathMode: PathMode) {
  if (!canSetPathMode.value) return;
  selectedPathTargets.value.forEach(({ unitId, stateIndex }) => {
    unitActions.updateUnitStateEntry(unitId, stateIndex, { pathMode });
  });
}
```

- [ ] **Step 4: Keep only the state hint**

Keep a visible hint in `UnitPanelState.vue` when `s.pathMode === "curved"`, but do not expose path mode actions in the state row menu.

```vue
<span v-if="s.pathMode === 'curved'" class="ml-2 text-xs text-gray-600">منحنی</span>
```

---

### Task 5: Verification

**Files:**
- Verify: `front_kalknegar/src/geo/unitPath.test.ts`
- Verify: `front_kalknegar/src/scenariostore/time.test.ts`
- Verify: `front_kalknegar/src/geo/history.test.ts`
- Verify: `front_kalknegar/src/modules/scenarioeditor/unitTrackPathMode.test.ts`
- Verify: TypeScript project

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm run test:unit -- src/modules/scenarioeditor/unitTrackPathMode.test.ts src/geo/unitPath.test.ts src/scenariostore/time.test.ts src/geo/history.test.ts --run
```

Expected: PASS.

- [ ] **Step 2: Run existing nearby tests**

Run:

```bash
npm run test:unit -- src/composables/geoUnitHistory.test.ts src/scenariostore/hierarchy.test.ts --run
```

Expected: PASS.

- [ ] **Step 3: Run type-check**

Run:

```bash
npm run type-check
```

Expected: PASS.

- [ ] **Step 4: Inspect git diff**

Run:

```bash
git diff -- front_kalknegar/src docs/superpowers/plans/2026-06-14-curved-unit-paths.md
```

Expected: only curved-path implementation and plan changes are present.
