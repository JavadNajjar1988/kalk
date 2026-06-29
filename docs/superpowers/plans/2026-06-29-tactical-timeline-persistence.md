# Tactical Timeline Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve tactical timeline timestamps across scenario save/load and recover timestamps already stored as ISO strings.

**Architecture:** Add a focused scenario JSON serializer that identifies timed tactical state objects by their `timed+feature:` tuple and exempts only their `t` fields from generic date conversion. Normalize legacy ISO timestamps at the tactical snapshot boundary so all downstream playback and timeline code continues to receive numbers.

**Tech Stack:** TypeScript, Vue scenario store, Vitest

---

### Task 1: Preserve numeric tactical timestamps during serialization

**Files:**
- Create: `front_kalknegar/src/scenariostore/scenarioSerialization.ts`
- Create: `front_kalknegar/src/scenariostore/scenarioSerialization.test.ts`
- Modify: `front_kalknegar/src/scenariostore/io.ts:415-435`

- [ ] **Step 1: Write the failing serializer test**

Create a scenario object containing both a regular state timestamp and a
`timed+feature:` timestamp. Assert that the regular timestamp becomes an ISO
string and the tactical timestamp remains the original number.

```ts
expect(parsed.sides[0].groups[0].subUnits[0].state[0].t).toBe(
  "1981-11-29T01:15:00Z",
);
expect(parsed.metadata.tacticalSymbols.tuples[0][1][0].t).toBe(timestamp);
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
npm run test:unit -- --run src/scenariostore/scenarioSerialization.test.ts
```

Expected: FAIL because `stringifyScenarioObject` does not exist.

- [ ] **Step 3: Implement the focused serializer**

Create `stringifyScenarioObject(value, timeZone)` using a `WeakSet` populated
only from states in `metadata.tacticalSymbols.tuples` whose key starts with
`timed+feature:`. In the JSON replacer, return tactical `t` values unchanged;
retain the existing `INTERNAL_NAMES` filtering and `TIMESTAMP_NAMES` ISO
conversion for every other field.

- [ ] **Step 4: Integrate it into scenario IO**

Replace the local `stringifyReplacer` in `io.ts` with calls to
`stringifyScenarioObject(toObject(), scenarioTimeZone)` and
`stringifyScenarioObject(obj, scenarioTimeZone)`.

- [ ] **Step 5: Run the serializer test and verify GREEN**

Run:

```powershell
npm run test:unit -- --run src/scenariostore/scenarioSerialization.test.ts
```

Expected: one test file passes.

### Task 2: Recover legacy ISO tactical timestamps

**Files:**
- Modify: `front_kalknegar/src/modules/tactical-symbol-map/services/scenarioSnapshot.ts:75-90`
- Modify: `front_kalknegar/src/modules/tactical-symbol-map/services/scenarioSnapshot.test.ts`

- [ ] **Step 1: Write the failing legacy normalization test**

Pass metadata containing a `timed+feature:` tuple with
`t: "1981-11-29T01:15:00Z"` to `getTacticalSnapshotFromMetadata` and assert
that the returned timestamp equals `Date.parse("1981-11-29T01:15:00Z")`.
Also include an invalid timestamp and assert it remains unchanged.

- [ ] **Step 2: Run the snapshot test and verify RED**

Run:

```powershell
npm run test:unit -- --run src/modules/tactical-symbol-map/services/scenarioSnapshot.test.ts
```

Expected: FAIL because the ISO timestamp is still returned as a string.

- [ ] **Step 3: Implement snapshot normalization**

When normalizing tuples, clone timed tactical state objects and replace valid
string timestamps with `Date.parse(value)`. Preserve numeric values and invalid
strings unchanged. Do not modify non-tactical tuples.

- [ ] **Step 4: Run the snapshot test and verify GREEN**

Run:

```powershell
npm run test:unit -- --run src/modules/tactical-symbol-map/services/scenarioSnapshot.test.ts
```

Expected: all snapshot tests pass.

### Task 3: Verify the persistence path

**Files:**
- Test: `front_kalknegar/src/scenariostore/scenarioSerialization.test.ts`
- Test: `front_kalknegar/src/modules/tactical-symbol-map/services/scenarioSnapshot.test.ts`
- Test: `front_kalknegar/src/modules/scenarioeditor/scenarioTimelineMath.test.ts`
- Test: `front_kalknegar/src/modules/tactical-symbol-map/model/sources/featureSourceTimedState.test.js`

- [ ] **Step 1: Run focused regression tests**

Run:

```powershell
npm run test:unit -- --run src/scenariostore/scenarioSerialization.test.ts src/modules/tactical-symbol-map/services/scenarioSnapshot.test.ts src/modules/scenarioeditor/scenarioTimelineMath.test.ts src/modules/tactical-symbol-map/model/sources/featureSourceTimedState.test.js src/modules/scenarioeditor/scenarioAutosave.test.ts
```

Expected: all focused tests pass.

- [ ] **Step 2: Run type checking**

Run:

```powershell
npm run type-check
```

Expected: exit code 0.

- [ ] **Step 3: Inspect the final diff**

Run:

```powershell
git diff --check
git diff -- front_kalknegar/src/scenariostore/scenarioSerialization.ts front_kalknegar/src/scenariostore/scenarioSerialization.test.ts front_kalknegar/src/scenariostore/io.ts front_kalknegar/src/modules/tactical-symbol-map/services/scenarioSnapshot.ts front_kalknegar/src/modules/tactical-symbol-map/services/scenarioSnapshot.test.ts
```

Expected: no whitespace errors and only the scoped persistence changes.
