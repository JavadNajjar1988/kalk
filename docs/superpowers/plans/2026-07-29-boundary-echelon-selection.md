# Boundary Echelon Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a visual Boundary configurator that derives or manually selects the organizational echelon, stores adjacent unit designations, and renders a platoon boundary as a solid line interrupted by `•••`.

**Architecture:** Keep one Boundary catalog entry and treat each visual row as a preset for the same MIL-STD-2525C SIDC. Put echelon conversion and selection rules in a pure shared TypeScript module, pass an optional `boundary` payload through the existing draw command, and keep the OpenLayers renderer driven by the stored SIDC plus `t`/`t1` properties. Add a focused Vue configurator before drawing and replace the Boundary properties placeholder with a small Vue editor.

**Tech Stack:** Vue 3 `<script setup>`, TypeScript, Vitest, OpenLayers, existing MIL-STD-2525C renderer and scenario store.

## Global Constraints

- Work on the existing `main` branch, as requested.
- Keep exactly one Boundary catalog card (`G*G*GLB---`); echelon variants are presets, not separate catalog symbols.
- For Platoon/Detachment (`D`), render a solid line interrupted by `•••`.
- Branch/type such as infantry, armor, or artillery must not change Boundary geometry.
- Existing non-Boundary draw requests must retain their current payload and behavior.
- Existing Boundary features with echelon `*` or `-` must continue to load as a plain line.
- Reuse existing dependencies; add no package.
- Follow TDD: add a failing focused test before each implementation change.

---

## File Map

- Create `front_kalknegar/src/symbology/boundaryEchelons.ts`: canonical Boundary echelon options, 2525D-to-2525C mapping, ranking, and automatic recommendation.
- Create `front_kalknegar/src/symbology/boundaryEchelons.test.ts`: mapping, labels, and recommendation tests.
- Modify `front_kalknegar/src/symbology/values.ts`: align shared Persian echelon labels with their MIL-STD meanings.
- Modify `front_kalknegar/src/modules/scenarioeditor/tacticalDrawRequest.ts`: add typed optional Boundary draw payload without changing retries.
- Modify `front_kalknegar/src/modules/scenarioeditor/tacticalDrawRequest.test.ts`: verify Boundary payload and legacy payload.
- Modify `front_kalknegar/src/modules/tactical-symbol-map/ol/interaction/draw-interaction.js`: write echelon, designations, and adjacent unit IDs to the drawn feature.
- Modify `front_kalknegar/src/modules/tactical-symbol-map/ol/interaction/draw-interaction.test.js`: verify stored Boundary properties.
- Create `front_kalknegar/src/modules/scenarioeditor/BoundaryDrawConfigurator.vue`: visual echelon presets and adjacent-unit selectors.
- Modify `front_kalknegar/src/modules/scenarioeditor/SymbolSidebarModal.vue`: open the configurator for Boundary and start drawing only after confirmation.
- Create `front_kalknegar/src/modules/tactical-symbol-map/components/properties/boundaryFeatureProperties.ts`: pure feature transformations used by the Vue editor.
- Create `front_kalknegar/src/modules/tactical-symbol-map/components/properties/boundaryFeatureProperties.test.ts`: editor transformation tests.
- Create `front_kalknegar/src/modules/tactical-symbol-map/components/properties/BoundaryProperties.vue`: edit echelon, left title, and right title after drawing.
- Modify `front_kalknegar/src/modules/tactical-symbol-map/components/properties/Properties.vue`: register the Vue Boundary editor.

### Task 1: Canonical Boundary Echelons and Correct Persian Labels

**Files:**
- Create: `front_kalknegar/src/symbology/boundaryEchelons.ts`
- Create: `front_kalknegar/src/symbology/boundaryEchelons.test.ts`
- Modify: `front_kalknegar/src/symbology/values.ts:49-65`

**Interfaces:**
- Consumes: `Sidc.emt` from `front_kalknegar/src/symbology/sidc.ts`.
- Produces:

```ts
export type BoundaryEchelonCode =
  | "A" | "B" | "C" | "D" | "E" | "F" | "G"
  | "H" | "I" | "J" | "K" | "L" | "M" | "N";

export interface BoundaryEchelonOption {
  code: BoundaryEchelonCode;
  emt: string;
  label: string;
  marker: string;
  rank: number;
}

export const boundaryEchelonOptions: readonly BoundaryEchelonOption[];
export function boundaryCodeFromEmt(emt?: string): BoundaryEchelonCode | null;
export function recommendBoundaryEchelon(
  emts: readonly (string | undefined)[],
  fallback?: BoundaryEchelonCode,
): BoundaryEchelonCode;
```

- [ ] **Step 1: Write failing mapping and recommendation tests**

```ts
import { describe, expect, it } from "vitest";
import {
  boundaryCodeFromEmt,
  boundaryEchelonOptions,
  recommendBoundaryEchelon,
} from "./boundaryEchelons";

describe("Boundary echelons", () => {
  it("maps MIL-STD-2525D unit echelon values to 2525C codes", () => {
    expect(boundaryCodeFromEmt("14")).toBe("D");
    expect(boundaryCodeFromEmt("18")).toBe("H");
    expect(boundaryCodeFromEmt("21")).toBe("I");
    expect(boundaryCodeFromEmt("00")).toBeNull();
  });

  it("uses three solid dots for platoon/detachment", () => {
    expect(boundaryEchelonOptions.find(({ code }) => code === "D")).toMatchObject({
      label: "دسته / جزء مستقل",
      marker: "•••",
    });
  });

  it("recommends the higher adjacent echelon and uses battalion as fallback", () => {
    expect(recommendBoundaryEchelon(["14", "18"])).toBe("H");
    expect(recommendBoundaryEchelon(["14", "14"])).toBe("D");
    expect(recommendBoundaryEchelon([])).toBe("F");
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```powershell
cd front_kalknegar
npm run test:unit -- src/symbology/boundaryEchelons.test.ts --run
```

Expected: FAIL because `boundaryEchelons.ts` does not exist.

- [ ] **Step 3: Implement the explicit mapping and ordered options**

Create the options in ascending order:

```ts
const OPTIONS = [
  ["A", "11", "تیم / خدمه", "∅"],
  ["B", "12", "گروه", "•"],
  ["C", "13", "جوخه / بخش", "••"],
  ["D", "14", "دسته / جزء مستقل", "•••"],
  ["E", "15", "گروهان / آتشبار / واحد سواره", "I"],
  ["F", "16", "گردان / اسکادران", "II"],
  ["G", "17", "هنگ / گروه", "III"],
  ["H", "18", "تیپ", "X"],
  ["I", "21", "لشکر", "XX"],
  ["J", "22", "سپاه / نیروی اعزامی تفنگداران دریایی", "XXX"],
  ["K", "23", "ارتش", "XXXX"],
  ["L", "24", "گروه ارتش / جبهه", "XXXXX"],
  ["M", "25", "منطقه / صحنهٔ عملیات", "XXXXXX"],
  ["N", "26", "فرماندهی", "＋＋"],
] as const;
```

Build `boundaryEchelonOptions` from `OPTIONS`, assign the array index as `rank`, and implement `recommendBoundaryEchelon` by selecting the option with the largest rank among valid inputs. Use `"F"` when no valid input exists.

Update `echelonValues` in `values.ts` to use the same Persian meanings for codes `11` through `26`.

- [ ] **Step 4: Run mapping tests and the existing symbol selection tests**

Run:

```powershell
npm run test:unit -- src/symbology/boundaryEchelons.test.ts src/symbology/symbolSelection.test.ts --run
```

Expected: PASS.

- [ ] **Step 5: Commit the canonical model**

```powershell
git add -- front_kalknegar/src/symbology/boundaryEchelons.ts front_kalknegar/src/symbology/boundaryEchelons.test.ts front_kalknegar/src/symbology/values.ts
git commit -m "feat: add boundary echelon presets"
```

### Task 2: Carry Boundary Metadata Through the Draw Command

**Files:**
- Modify: `front_kalknegar/src/modules/scenarioeditor/tacticalDrawRequest.ts`
- Modify: `front_kalknegar/src/modules/scenarioeditor/tacticalDrawRequest.test.ts`
- Modify: `front_kalknegar/src/modules/tactical-symbol-map/ol/interaction/draw-interaction.js`
- Modify: `front_kalknegar/src/modules/tactical-symbol-map/ol/interaction/draw-interaction.test.js`

**Interfaces:**
- Consumes: `BoundaryEchelonCode` from Task 1.
- Produces:

```ts
export interface BoundaryDrawOptions {
  echelonCode: BoundaryEchelonCode;
  leftUnitId?: EntityId;
  rightUnitId?: EntityId;
  leftDesignation?: string;
  rightDesignation?: string;
}

type DrawRequestOptions = {
  attempts?: number;
  intervalMs?: number;
  boundary?: BoundaryDrawOptions;
};
```

- [ ] **Step 1: Add failing draw-request contract tests**

Keep the existing retry test and add:

```ts
it("includes Boundary metadata without changing non-Boundary payloads", async () => {
  const emit = vi.fn(() => true);
  const boundary = {
    echelonCode: "D" as const,
    leftUnitId: "u-left",
    rightUnitId: "u-right",
    leftDesignation: "گردان ۱",
    rightDesignation: "گردان ۲",
  };

  await requestTacticalDraw(
    { emit },
    "symbol:G*G*GLB---",
    { attempts: 1, intervalMs: 0, boundary },
  );

  expect(emit).toHaveBeenCalledWith("command/entry/draw", {
    id: "symbol:G*G*GLB---",
    boundary,
  });
});
```

Also assert that the original test still emits only `{ id }`.

- [ ] **Step 2: Run the request test and verify the Boundary assertion fails**

Run:

```powershell
cd front_kalknegar
npm run test:unit -- src/modules/scenarioeditor/tacticalDrawRequest.test.ts --run
```

Expected: FAIL because `boundary` is not emitted.

- [ ] **Step 3: Extend `requestTacticalDraw` minimally**

Build the command once before the retry loop:

```ts
const command = boundary ? { id, boundary } : { id };
for (let attempt = 0; attempt < attempts; attempt += 1) {
  if (emitter.emit("command/entry/draw", command)) return true;
  // existing wait behavior
}
```

- [ ] **Step 4: Run the request tests**

Run:

```powershell
npm run test:unit -- src/modules/scenarioeditor/tacticalDrawRequest.test.ts --run
```

Expected: PASS.

- [ ] **Step 5: Add a failing OpenLayers Boundary persistence test**

Append a test that starts a `LineString` Boundary draw, dispatches `drawstart` and `drawend`, and expects:

```js
properties: expect.objectContaining({
  sidc: 'GFGPGLB---*D***',
  t: 'گردان ۱',
  t1: 'گردان ۲',
  boundaryLeftUnitId: 'u-left',
  boundaryRightUnitId: 'u-right',
})
```

Use `new LineString([[0, 0], [100, 0]])` and import it from `ol/geom/LineString`.

- [ ] **Step 6: Run the interaction test and verify it fails**

Run:

```powershell
npm run test:unit -- src/modules/tactical-symbol-map/ol/interaction/draw-interaction.test.js --run
```

Expected: FAIL because the SIDC echelon and Boundary properties are absent.

- [ ] **Step 7: Apply Boundary metadata in `drawstart`**

Change the draw listener and handler signatures:

```js
const drawstart = (descriptor, boundary) => ({ feature }) => {
  const sidc = MILSTD.format(descriptor.sidc, {
    identity: selectedHostility,
    status: selectedStatus,
    echelon: boundary?.echelonCode,
  });
  feature.set('sidc', sidc);
  if (boundary?.leftDesignation) feature.set('t', boundary.leftDesignation);
  if (boundary?.rightDesignation) feature.set('t1', boundary.rightDesignation);
  if (boundary?.leftUnitId) feature.set('boundaryLeftUnitId', boundary.leftUnitId);
  if (boundary?.rightUnitId) feature.set('boundaryRightUnitId', boundary.rightUnitId);
};
```

Destructure `boundary` in the existing `command/entry/draw` listener and change its handler registration to `drawstart: drawstart(descriptor, boundary)`.

- [ ] **Step 8: Run both draw-contract test files**

Run:

```powershell
npm run test:unit -- src/modules/scenarioeditor/tacticalDrawRequest.test.ts src/modules/tactical-symbol-map/ol/interaction/draw-interaction.test.js --run
```

Expected: PASS.

- [ ] **Step 9: Commit the draw contract**

```powershell
git add -- front_kalknegar/src/modules/scenarioeditor/tacticalDrawRequest.ts front_kalknegar/src/modules/scenarioeditor/tacticalDrawRequest.test.ts front_kalknegar/src/modules/tactical-symbol-map/ol/interaction/draw-interaction.js front_kalknegar/src/modules/tactical-symbol-map/ol/interaction/draw-interaction.test.js
git commit -m "feat: persist boundary draw metadata"
```

### Task 3: Add the Visual Boundary Configurator

**Files:**
- Create: `front_kalknegar/src/modules/scenarioeditor/BoundaryDrawConfigurator.vue`
- Create: `front_kalknegar/src/modules/scenarioeditor/boundaryDrawSelection.ts`
- Create: `front_kalknegar/src/modules/scenarioeditor/boundaryDrawSelection.test.ts`
- Modify: `front_kalknegar/src/modules/scenarioeditor/SymbolSidebarModal.vue`

**Interfaces:**
- Consumes: `boundaryEchelonOptions`, `boundaryCodeFromEmt`, `recommendBoundaryEchelon`, `NUnit`, `useSelectedItems`.
- Produces:

```ts
export function selectedBoundaryUnits(
  units: readonly NUnit[],
  selectedIds: readonly EntityId[],
): { leftUnit: NUnit | null; rightUnit: NUnit | null };

export function unitDesignation(unit: NUnit | null): string | undefined;

// BoundaryDrawConfigurator.vue
defineProps<{
  units: NUnit[];
  selectedUnitIds: EntityId[];
  initialEchelon: BoundaryEchelonCode;
}>();
defineEmits<{
  confirm: [options: BoundaryDrawOptions];
  cancel: [];
}>();
```

- [ ] **Step 1: Write failing unit preselection tests**

```ts
describe("Boundary draw selection", () => {
  const units = [
    { id: "u1", name: "گردان یکم", shortName: "۱", sidc: "10031000161211000000" } as NUnit,
    { id: "u2", name: "تیپ دوم", sidc: "10031000181211000000" } as NUnit,
  ];

  it("preselects two existing units in selection order", () => {
    expect(selectedBoundaryUnits(units, ["u2", "u1"])).toEqual({
      leftUnit: units[1],
      rightUnit: units[0],
    });
  });

  it("uses shortName as designation and falls back to name", () => {
    expect(unitDesignation(units[0])).toBe("۱");
    expect(unitDesignation(units[1])).toBe("تیپ دوم");
  });
});
```

Use `10031000161211000000` and `10031000181211000000` as the 20-character SIDCs in the test fixtures.

- [ ] **Step 2: Run the selection test and verify it fails**

Run:

```powershell
cd front_kalknegar
npm run test:unit -- src/modules/scenarioeditor/boundaryDrawSelection.test.ts --run
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the two pure selection helpers**

`selectedBoundaryUnits` must ignore missing IDs and use only the first two valid selected units. `unitDesignation` returns trimmed `shortName`, then trimmed `name`, then `undefined`.

- [ ] **Step 4: Run the selection test**

Run:

```powershell
npm run test:unit -- src/modules/scenarioeditor/boundaryDrawSelection.test.ts --run
```

Expected: PASS.

- [ ] **Step 5: Build `BoundaryDrawConfigurator.vue`**

The component must:

- Show a compact heading «تنظیم خط حد».
- Render one button per `boundaryEchelonOptions` item.
- Render each preview as a left line, `marker`, and right line; for code `D`, the visible marker is exactly `•••`.
- Use two native `<select>` controls for left and right units, each with a «بدون یگان» option.
- Include a swap button that exchanges the selected unit IDs.
- On first open, derive the default echelon using `new Sidc(unit.sidc).emt` and `recommendBoundaryEchelon`.
- Use `initialEchelon` when neither selected unit has a valid echelon.
- Stop automatic replacement once the user clicks an echelon button.
- Provide an «انتخاب خودکار» button that recalculates the recommendation.
- Emit `confirm` with IDs, designations, and selected `echelonCode`.
- Emit `cancel` without starting a draw.

Use the existing surface, border, primary, and foreground CSS variables. Do not use bitmap assets for the previews.

- [ ] **Step 6: Integrate the configurator into `SymbolSidebarModal.vue`**

Add:

```ts
const BOUNDARY_SIDC = "G*G*GLB---";
const showBoundaryConfigurator = ref(false);
const lastBoundaryEchelon = ref<BoundaryEchelonCode>("F");
const { selectedUnitIds } = useSelectedItems();
const scenarioUnits = computed(() => activeScenario.unitActions.units.value);
const isBoundarySelected = computed(
  () => MILSTD.parameterized(selectedSidc.value) === BOUNDARY_SIDC,
);
```

Refactor drawing into:

```ts
async function startAcceptedPlacement(boundary?: BoundaryDrawOptions) {
  return requestTacticalDraw(services.value.emitter, selectedSymbolId.value!, {
    boundary,
  });
}
```

Pass `lastBoundaryEchelon` as `initialEchelon`. When Insert or double-click is used for Boundary, open the configurator instead of activating the map interaction. On `confirm`, save `options.echelonCode` into `lastBoundaryEchelon`, close the configurator, and call `startAcceptedPlacement(options)`. On `cancel`, only close the configurator.

- [ ] **Step 7: Run focused tests and type checking**

Run:

```powershell
npm run test:unit -- src/symbology/boundaryEchelons.test.ts src/modules/scenarioeditor/boundaryDrawSelection.test.ts src/modules/scenarioeditor/tacticalDrawRequest.test.ts --run
npm run type-check
```

Expected: PASS.

- [ ] **Step 8: Commit the configurator**

```powershell
git add -- front_kalknegar/src/modules/scenarioeditor/BoundaryDrawConfigurator.vue front_kalknegar/src/modules/scenarioeditor/boundaryDrawSelection.ts front_kalknegar/src/modules/scenarioeditor/boundaryDrawSelection.test.ts front_kalknegar/src/modules/scenarioeditor/SymbolSidebarModal.vue
git commit -m "feat: configure boundary echelon before drawing"
```

### Task 4: Replace the Boundary Properties Placeholder

**Files:**
- Create: `front_kalknegar/src/modules/tactical-symbol-map/components/properties/boundaryFeatureProperties.ts`
- Create: `front_kalknegar/src/modules/tactical-symbol-map/components/properties/boundaryFeatureProperties.test.ts`
- Create: `front_kalknegar/src/modules/tactical-symbol-map/components/properties/BoundaryProperties.vue`
- Modify: `front_kalknegar/src/modules/tactical-symbol-map/components/properties/Properties.vue`
- Modify: `front_kalknegar/src/modules/tactical-symbol-map/components/properties/UniqueDesignationRight.js:7`

**Interfaces:**
- Consumes: `MILSTD.format`, `MILSTD.echelonCode`, `boundaryEchelonOptions`.
- Produces:

```ts
export interface TacticalFeatureRecord {
  properties?: Record<string, unknown> & { sidc?: string; t?: string; t1?: string };
}

export function setBoundaryEchelon(code: BoundaryEchelonCode):
  (feature: TacticalFeatureRecord) => TacticalFeatureRecord;
export function setBoundaryDesignation(side: "left" | "right", value: string):
  (feature: TacticalFeatureRecord) => TacticalFeatureRecord;
```

- [ ] **Step 1: Write failing immutable transformation tests**

```ts
it("updates Boundary echelon without changing function ID", () => {
  const update = setBoundaryEchelon("D");
  expect(update({ properties: { sidc: "GFGPGLB---*****" } }).properties?.sidc)
    .toBe("GFGPGLB---*D***");
});

it("updates the right designation independently from the left", () => {
  const updated = setBoundaryDesignation("right", "یگان راست")({
    properties: { sidc: "GFGPGLB---*D***", t: "" },
  });
  expect(updated.properties).toMatchObject({ t: "", t1: "یگان راست" });
});
```

- [ ] **Step 2: Run the transformation test and verify it fails**

Run:

```powershell
cd front_kalknegar
npm run test:unit -- src/modules/tactical-symbol-map/components/properties/boundaryFeatureProperties.test.ts --run
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement immutable transformations**

Use `MILSTD.format(sidc, { echelon: code })`; map left to `t` and right to `t1`. Preserve the rest of the feature and properties object.

- [ ] **Step 4: Run the transformation test**

Run:

```powershell
npm run test:unit -- src/modules/tactical-symbol-map/components/properties/boundaryFeatureProperties.test.ts --run
```

Expected: PASS.

- [ ] **Step 5: Create `BoundaryProperties.vue`**

The component receives `features` and `disabled` from `Properties.vue`, injects `services`, and shows:

- A select populated from `boundaryEchelonOptions`.
- A text input labeled «عنوان یگان سمت چپ».
- A text input labeled «عنوان یگان سمت راست».

Initialize values from the first selected feature. On select change call:

```ts
await servicesRef.value.store.update(
  props.features,
  setBoundaryEchelon(selectedEchelon.value),
);
```

On text blur call `setBoundaryDesignation("left", leftDesignation.value)` or the right equivalent. Disable all controls when `disabled` is true.

- [ ] **Step 6: Register the Vue editor and fix the legacy right getter**

In `Properties.vue`, import `BoundaryProperties` and change:

```js
'feature:BOUNDARIES': BoundaryProperties,
```

In `UniqueDesignationRight.js`, change the getter to:

```js
get: feature => feature.properties.t1 ? feature.properties.t1 : null,
```

- [ ] **Step 7: Run focused tests and type checking**

Run:

```powershell
npm run test:unit -- src/modules/tactical-symbol-map/components/properties/boundaryFeatureProperties.test.ts --run
npm run type-check
```

Expected: PASS.

- [ ] **Step 8: Commit the Boundary editor**

```powershell
git add -- front_kalknegar/src/modules/tactical-symbol-map/components/properties/boundaryFeatureProperties.ts front_kalknegar/src/modules/tactical-symbol-map/components/properties/boundaryFeatureProperties.test.ts front_kalknegar/src/modules/tactical-symbol-map/components/properties/BoundaryProperties.vue front_kalknegar/src/modules/tactical-symbol-map/components/properties/Properties.vue front_kalknegar/src/modules/tactical-symbol-map/components/properties/UniqueDesignationRight.js
git commit -m "feat: edit boundary echelon properties"
```

### Task 5: Rendering Regression and Full Verification

**Files:**
- Create: `front_kalknegar/src/modules/tactical-symbol-map/ol/style/boundary-labels.test.js`.

**Interfaces:**
- Consumes: stored Boundary SIDC `GFGPGLB---*D***`.
- Produces: a center label with text `•••` and clipping enabled so the solid line is interrupted behind the marker.

- [ ] **Step 1: Add a focused platoon-rendering regression test**

Create a test around `_evalSync` and the Boundary label specification:

```js
it('renders a platoon boundary with three solid dots', () => {
  const styles = evaluateBoundaryLabels('GFGPGLB---*D***', {
    t: 'چپ',
    t1: 'راست',
  });
  expect(styles).toEqual(expect.arrayContaining([
    expect.objectContaining({
      'text-field': '•••',
      'text-anchor': 'center',
      'text-padding': 5,
    }),
  ]));
});
```

The local helper in the test should obtain `labels['G*G*GLB---']` and apply `_evalSync(sidc, properties, {})` directly; no browser canvas is needed for this assertion.

- [ ] **Step 2: Run the rendering regression test**

Run:

```powershell
cd front_kalknegar
npm run test:unit -- src/modules/tactical-symbol-map/ol/style/boundary-labels.test.js --run
```

Expected: PASS with the current label/echelon pipeline. A failure blocks completion and must be diagnosed with `superpowers:systematic-debugging` before changing the renderer.

- [ ] **Step 3: Run all frontend tests**

Run:

```powershell
npm run test:unit -- --run
```

Expected: all tests PASS.

- [ ] **Step 4: Run the production build**

Run:

```powershell
npm run build
```

Expected: type-check and Vite build complete successfully.

- [ ] **Step 5: Perform a manual map check**

Start the local app:

```powershell
npm run dev
```

In the scenario editor:

1. Open the tactical symbol library.
2. Select «خط حد».
3. Select «دسته / جزء مستقل» and confirm its preview is `— ••• —`.
4. Select optional left and right units.
5. Draw a multi-segment line.
6. Confirm the map shows a solid line, a gap at the center, `•••` in the gap, and the two titles above and below.
7. Select the drawn feature and change the echelon to Brigade; confirm the marker becomes `X`.
8. Draw a non-Boundary line symbol and confirm it still starts immediately without the configurator.

- [ ] **Step 6: Inspect the final diff and commit any rendering-only test change**

Run:

```powershell
git diff --check
git status --short
```

Stage only files from this plan. Do not stage existing `output/` or `tmp/` files.

Commit the regression test:

```powershell
git add -- front_kalknegar/src/modules/tactical-symbol-map/ol/style/boundary-labels.test.js
git commit -m "test: verify platoon boundary rendering"
```
