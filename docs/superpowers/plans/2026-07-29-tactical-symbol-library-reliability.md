# Tactical Symbol Library Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make tactical-symbol placement, favorites, Persian labels, and library startup reliable while keeping the map and sidebar on one service instance.

**Architecture:** Service startup exposes core and library readiness on the same persistent service, with fallback allowed only before core readiness. Drawing strategy selection is testable independently and interaction tests cover actual GeoJSON insertion. Favorites use a small event helper, while tactical labels use one exact-phrase source and preserve English for unreviewed labels.

**Tech Stack:** Vue 3, Pinia, OpenLayers, Vitest, IndexedDB through `level-js`, MiniSearch.

## Global Constraints

- Do not guess geometry for `G*F*AXS---`; report `geometry-not-supported`.
- Do not replace a persistent service after its core has been published.
- Keep English source labels searchable.
- Unknown translations remain English; do not generate Persian-looking transliterations.
- Preserve unrelated working-tree files.

---

### Task 1: Favorite toggle delivery

**Files:**
- Create: `front_kalknegar/src/modules/tactical-symbol-map/components/sidebar/favoriteToggle.js`
- Create: `front_kalknegar/src/modules/tactical-symbol-map/components/sidebar/favoriteToggle.test.js`
- Modify: `front_kalknegar/src/modules/tactical-symbol-map/components/sidebar/Card.vue`

**Interfaces:**
- Consumes: an emitter with `emit(path, payload)`, a symbol id, current favorite state, and the component notification callback.
- Produces: `toggleFavorite({ emitter, id, favorite, notify }): boolean`.

- [ ] **Step 1: Write the failing helper test**

```js
import { describe, expect, it, vi } from 'vitest'
import { toggleFavorite } from './favoriteToggle.js'

describe('toggleFavorite', () => {
  it.each([
    [false, 'pin', true],
    [true, 'unpin', false],
  ])('changes %s through %s', (favorite, event, nextFavorite) => {
    const emitter = { emit: vi.fn(() => true) }
    const notify = vi.fn()

    expect(toggleFavorite({ emitter, id: 'symbol:S*G*UCI---', favorite, notify }))
      .toBe(nextFavorite)
    expect(notify).toHaveBeenCalledWith({
      id: 'symbol:S*G*UCI---',
      favorite: nextFavorite,
    })
    expect(emitter.emit).toHaveBeenCalledWith(event, {
      id: 'symbol:S*G*UCI---',
    })
  })
})
```

- [ ] **Step 2: Run the test and verify the missing-module failure**

Run:

```powershell
npm run test:unit -- --run src/modules/tactical-symbol-map/components/sidebar/favoriteToggle.test.js
```

Expected: FAIL because `favoriteToggle.js` does not exist.

- [ ] **Step 3: Implement the helper and use the direct emitter**

```js
export function toggleFavorite({ emitter, id, favorite, notify }) {
  const nextFavorite = !favorite
  notify({ id, favorite: nextFavorite })
  emitter.emit(nextFavorite ? 'pin' : 'unpin', { id })
  return nextFavorite
}
```

In `Card.vue`, import the helper and replace `sidebarEmitter.value.emit(...)`:

```js
const handleFavorite = () => {
  toggleFavorite({
    emitter: sidebarEmitter,
    id: props.id,
    favorite: favorite.value,
    notify: payload => emit('favorite-change', payload),
  })
}
```

Also replace `sidebarEmitter.value.emit('edit/begin', ...)` with `sidebarEmitter.emit(...)`.

- [ ] **Step 4: Run the focused test**

Run:

```powershell
npm run test:unit -- --run src/modules/tactical-symbol-map/components/sidebar/favoriteToggle.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit the favorite fix**

```powershell
git add -- front_kalknegar/src/modules/tactical-symbol-map/components/sidebar/favoriteToggle.js front_kalknegar/src/modules/tactical-symbol-map/components/sidebar/favoriteToggle.test.js front_kalknegar/src/modules/tactical-symbol-map/components/sidebar/Card.vue
git commit -m "fix: persist tactical symbol favorite toggles"
```

### Task 2: Drawing strategy and stored feature contract

**Files:**
- Modify: `front_kalknegar/src/modules/tactical-symbol-map/ol/interaction/draw-interaction.js`
- Modify: `front_kalknegar/src/modules/tactical-symbol-map/ol/interaction/draw-interaction.test.js`

**Interfaces:**
- Produces: `findDrawingStrategy(descriptor): DrawingStrategy | undefined`.
- Keeps: `drawInteraction({ services, map })` and UI events `draw-ready`, `draw-error`, `draw-complete`, `draw-cancelled`.

- [ ] **Step 1: Add failing strategy-coverage and insertion tests**

Import the descriptor collections and exported selector:

```js
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import symbols2525c from '../../symbology/2525c.json'
import symbolsSkkm from '../../symbology/skkm.json'
import drawInteraction, { findDrawingStrategy } from './draw-interaction'
```

Add a data-contract test:

```js
it('has a drawing strategy for every supported catalog descriptor', () => {
  const unsupported = [...symbols2525c, ...symbolsSkkm]
    .filter(item => !item.unsupported)
    .map(item => ({
      ...item,
      geometry: { type: item.geometry, ...(item.parameters || {}) },
    }))
    .filter(item => !findDrawingStrategy(item))
    .map(item => item.sidc)

  expect(unsupported).toEqual(['G*F*AXS---*****'])
})
```

Add a completion test that captures the `Draw` instance passed to `map.addInteraction`, dispatches `drawstart` and `drawend` with a point feature, and expects:

```js
expect(store.insertGeoJSON).toHaveBeenCalledWith([
  expect.objectContaining({
    type: 'Feature',
    geometry: expect.objectContaining({ type: 'Point' }),
    properties: expect.objectContaining({ sidc: expect.any(String) }),
  }),
])
expect(complete).toHaveBeenCalledOnce()
```

- [ ] **Step 2: Run the draw test and verify failure**

Run:

```powershell
npm run test:unit -- --run src/modules/tactical-symbol-map/ol/interaction/draw-interaction.test.js
```

Expected: FAIL because `findDrawingStrategy` is not exported and the existing cancellation assertion is scheduler-sensitive.

- [ ] **Step 3: Export the selector and make cancellation observable**

Move the geometry lookup behind:

```js
export const findDrawingStrategy = descriptor =>
  geometries.find(geometry => geometry.match(descriptor))
```

Use it in the command handler:

```js
const geometry = findDrawingStrategy(descriptor)
```

Keep `geometry-not-supported` for the single descriptor without geometry metadata. Update the cancellation test to wait for the emitter's `setImmediate` scheduling with:

```js
const nextEmitterTask = () =>
  new Promise(resolve =>
    (typeof setImmediate === 'function' ? setImmediate : setTimeout)(resolve, 0),
  )
```

- [ ] **Step 4: Run the draw tests**

Run:

```powershell
npm run test:unit -- --run src/modules/tactical-symbol-map/ol/interaction/draw-interaction.test.js src/modules/scenarioeditor/tacticalDrawRequest.test.ts
```

Expected: PASS, including actual `insertGeoJSON`.

- [ ] **Step 5: Commit the drawing contract**

```powershell
git add -- front_kalknegar/src/modules/tactical-symbol-map/ol/interaction/draw-interaction.js front_kalknegar/src/modules/tactical-symbol-map/ol/interaction/draw-interaction.test.js
git commit -m "test: verify tactical symbol drawing contract"
```

### Task 3: Stable staged service startup

**Files:**
- Modify: `front_kalknegar/src/modules/tactical-symbol-map/services/projectServices.js`
- Modify: `front_kalknegar/src/modules/tactical-symbol-map/services/projectServices.test.js`
- Modify: `front_kalknegar/src/modules/tactical-symbol-map/services/projectServices.d.ts`

**Interfaces:**
- Adds option: `onLibraryReady?: (services: ProjectServices) => void | Promise<void>`.
- Produces one service identity from core readiness through complete readiness.

- [ ] **Step 1: Add failing orchestration tests**

Write the tests against a named export `chooseProjectServices`, then test timeout after core:

```js
it('keeps the persistent service when timeout fires after core readiness', async () => {
  const persistent = { emitter: {}, store: {} }
  let finish
  const done = new Promise(resolve => { finish = () => resolve(persistent) })
  const startFallback = vi.fn()
  const result = chooseProjectServices({
    startPersistent: async onCore => {
      await onCore(persistent)
      return done
    },
    startFallback,
    timeout: Promise.reject(new Error('timeout')),
    onCoreReady: vi.fn(),
  })

  await vi.waitFor(() => expect(startFallback).not.toHaveBeenCalled())
  finish()
  await expect(result).resolves.toBe(persistent)
  expect(startFallback).not.toHaveBeenCalled()
})
```

Add tests for failure before core using fallback, late persistent core not being published after fallback, and failure after core being propagated.

- [ ] **Step 2: Run and verify the orchestration tests fail**

Run:

```powershell
npm run test:unit -- --run src/modules/tactical-symbol-map/services/projectServices.test.js
```

Expected: FAIL because `chooseProjectServices` and `onLibraryReady` do not exist.

- [ ] **Step 3: Implement stable service selection**

Use the following state machine:

```js
export async function chooseProjectServices({
  startPersistent,
  startFallback,
  timeout,
  onCoreReady,
}) {
  let coreReady = false
  let abandoned = false
  const persistent = startPersistent(async services => {
    if (abandoned) return
    coreReady = true
    await onCoreReady?.(services)
  })

  try {
    return await Promise.race([persistent, timeout])
  } catch (error) {
    if (coreReady) return persistent
    abandoned = true
    return startFallback(onCoreReady)
  }
}
```

Call `initializeProjectServicesWithDb` with the real `onCoreReady` for persistent startup. Invoke `onLibraryReady` after `searchIndex.bootstrap()` succeeds.

- [ ] **Step 4: Run project-service tests**

Run:

```powershell
npm run test:unit -- --run src/modules/tactical-symbol-map/services/projectServices.test.js
```

Expected: PASS with fallback only before core readiness.

- [ ] **Step 5: Commit stable service identity**

```powershell
git add -- front_kalknegar/src/modules/tactical-symbol-map/services/projectServices.js front_kalknegar/src/modules/tactical-symbol-map/services/projectServices.test.js front_kalknegar/src/modules/tactical-symbol-map/services/projectServices.d.ts
git commit -m "fix: keep tactical services stable after core readiness"
```

### Task 4: Parallel bootstrap and library readiness

**Files:**
- Modify: `front_kalknegar/src/modules/tactical-symbol-map/services/projectServices.js`
- Modify: `front_kalknegar/src/modules/tactical-symbol-map/services/projectServices.test.js`
- Modify: `front_kalknegar/src/modules/tactical-symbol-map/services/scenarioProjectServices.ts`
- Modify: `front_kalknegar/src/modules/tactical-symbol-map/services/scenarioProjectServices.test.ts`
- Modify: `front_kalknegar/src/components/ScenarioMapLogic.vue`
- Modify: `front_kalknegar/src/modules/scenarioeditor/SymbolSidebarModal.vue`

**Interfaces:**
- Adds `waitFor?: "core" | "library" | "complete"` to `ensureScenarioTacticalServices`.
- Map requests `"core"`; symbol sidebar requests `"library"`; prewarm keeps `"complete"`.

- [ ] **Step 1: Add failing staged-readiness tests**

In `scenarioProjectServices.test.ts`, create deferred core, library, and completion callbacks. Assert:

```ts
const coreRequest = ensureScenarioTacticalServices({
  scenarioId: "scenario-staged",
  servicesStore,
  waitFor: "core",
});
const libraryRequest = ensureScenarioTacticalServices({
  scenarioId: "scenario-staged",
  servicesStore,
  waitFor: "library",
});

await publishCore();
await expect(coreRequest).resolves.toBe(services);
expect(servicesStore.searchIndex).toBeNull();

await publishLibrary();
await expect(libraryRequest).resolves.toBe(services);
expect(servicesStore.searchIndex).toBe(services.searchIndex);
expect(initializeProjectServices).toHaveBeenCalledTimes(1);
```

In `projectServices.test.js`, mock bootstrap methods with deferred promises and assert tile, spatial, and search bootstraps have all started before any one resolves.

- [ ] **Step 2: Run and verify staged tests fail**

Run:

```powershell
npm run test:unit -- --run src/modules/tactical-symbol-map/services/projectServices.test.js src/modules/tactical-symbol-map/services/scenarioProjectServices.test.ts
```

Expected: FAIL because `waitFor` is not implemented and bootstraps are sequential.

- [ ] **Step 3: Implement readiness records**

Store one record per project:

```ts
type Readiness = "core" | "library" | "complete";
type Deferred = {
  promise: Promise<any>;
  resolve: (services: any) => void;
  reject: (error: unknown) => void;
};
type InitializationRecord = {
  core: Deferred;
  library: Deferred;
  complete: Deferred;
};
```

Start `initializeProjectServices` once. Resolve `core` from `onCoreReady`, resolve `library` from `onLibraryReady`, and resolve `complete` from the final promise. Reject unresolved stages on failure and delete the record only after complete settlement.

In `projectServices.js`, replace sequential independent bootstraps with:

```js
const tileLayerBootstrap = tileLayerStore.bootstrap()
const spatialBootstrap = spatialIndex.bootstrap()
const searchBootstrap = searchIndex.bootstrap().then(async () => {
  await onLibraryReady?.(services)
})
await Promise.all([tileLayerBootstrap, spatialBootstrap, searchBootstrap])
```

- [ ] **Step 4: Request the appropriate readiness stage**

In `ScenarioMapLogic.vue`:

```ts
await ensureScenarioTacticalServices({
  scenarioId: state.id,
  metadata: state.metadata,
  servicesStore,
  waitFor: "core",
});
```

In `SymbolSidebarModal.vue` use `waitFor: "library"`. Leave `ScenarioEditorWrapper.vue` on the default `"complete"` prewarm.

- [ ] **Step 5: Run staged startup tests**

Run:

```powershell
npm run test:unit -- --run src/modules/tactical-symbol-map/services/projectServices.test.js src/modules/tactical-symbol-map/services/scenarioProjectServices.test.ts
```

Expected: PASS; core and library requests share one initializer.

- [ ] **Step 6: Commit loading improvements**

```powershell
git add -- front_kalknegar/src/modules/tactical-symbol-map/services/projectServices.js front_kalknegar/src/modules/tactical-symbol-map/services/projectServices.test.js front_kalknegar/src/modules/tactical-symbol-map/services/scenarioProjectServices.ts front_kalknegar/src/modules/tactical-symbol-map/services/scenarioProjectServices.test.ts front_kalknegar/src/components/ScenarioMapLogic.vue front_kalknegar/src/modules/scenarioeditor/SymbolSidebarModal.vue
git commit -m "perf: stage tactical library readiness"
```

### Task 5: Central Persian tactical labels

**Files:**
- Modify: `front_kalknegar/src/modules/tactical-symbol-map/persianTacticalLabels.js`
- Modify: `front_kalknegar/src/modules/tactical-symbol-map/persianTacticalLabels.test.js`
- Modify: `front_kalknegar/src/modules/tactical-symbol-map/SimpleSymbolMapSidebar.vue`
- Modify: `front_kalknegar/src/symbology/translations.ts`
- Modify: `front_kalknegar/src/symbology/translations.test.ts`

**Interfaces:**
- Keeps: `ensurePersianTacticalLabel(value): string`.
- Changes fallback: unknown English input returns unchanged English.
- Exact phrase translation is shared by cards, hierarchy descriptions, filters, and search rendering.

- [ ] **Step 1: Replace the transliteration assertion with semantic tests**

In `persianTacticalLabels.test.js`, assert:

```js
expect(ensurePersianTacticalLabel('Armored Reconnaissance Unit'))
  .toBe('یگان شناسایی زرهی')
expect(ensurePersianTacticalLabel('Emergency Medical Operation Unit'))
  .toBe('یگان عملیات پزشکی اضطراری')
expect(ensurePersianTacticalLabel('Fire Support Area'))
  .toBe('منطقه پشتیبانی آتش')
expect(ensurePersianTacticalLabel('Unreviewed Tactical Phrase'))
  .toBe('Unreviewed Tactical Phrase')
```

Add exact expectations in `translations.test.ts`:

```ts
expect(translateEntity("Task Force")).toBe("گروه رزمی");
expect(translateEntity("Decontamination")).toBe("رفع آلودگی");
expect(translateEntity("Utility")).toBe("چندمنظوره");
expect(translateEntity("Air Assault with Organic Lift"))
  .toBe("هجوم هوایی با ترابری سازمانی");
expect(translateEntity("Aviation Composite"))
  .toBe("یگان هوانوردی مختلط");
expect(translateEntity("Special Troops")).toBe("رسته‌های ویژه");
```

- [ ] **Step 2: Run translation tests and verify semantic failures**

Run:

```powershell
npm run test:unit -- --run src/modules/tactical-symbol-map/persianTacticalLabels.test.js src/symbology/translations.test.ts
```

Expected: FAIL on wrong word order, transliterated fallback, and incorrect exact terms.

- [ ] **Step 3: Implement exact phrase translation and safe fallback**

Add these exact phrases to the centralized tactical phrase map:

```js
'Armored Reconnaissance Unit': 'یگان شناسایی زرهی',
'Emergency Medical Operation Unit': 'یگان عملیات پزشکی اضطراری',
'Emergency Operation Unit': 'یگان عملیات اضطراری',
'Fire Fighting Operation Unit': 'یگان عملیات آتش‌نشانی',
'Law Enforcement Operation Unit': 'یگان عملیات اجرای قانون',
'Fire Support Area': 'منطقه پشتیبانی آتش',
'Fire Support Coordination Line': 'خط هماهنگی پشتیبانی آتش',
'Signals Intelligence': 'اطلاعات سیگنالی',
'Signal Intercept': 'رهگیری سیگنال',
```

Translate delimiter-separated labels only when every non-separator segment has an exact translation; otherwise return the original input:

```js
export function ensurePersianTacticalLabel(value) {
  if (!value) return value
  if (tacticalPhraseTranslations[value]) {
    return tacticalPhraseTranslations[value]
  }
  const parts = value.split(/(\s+[•/]\s+|\s+-\s+)/)
  const isSeparator = part => /^(\s+[•/]\s+|\s+-\s+)$/.test(part)
  const labels = parts.filter(part => !isSeparator(part))
  if (!labels.every(part => tacticalPhraseTranslations[part])) return value
  return parts
    .map(part => isSeparator(part) ? part : tacticalPhraseTranslations[part])
    .join('')
}
```

Do not call `transliterateWord` from the fallback path.

In `SimpleSymbolMapSidebar.vue`, make both category and title translation call `translateEntity` and then `ensurePersianTacticalLabel`; remove the word-by-word and substring fallback branches.

Correct the exact entries in `translations.ts`:

```ts
"Air Assault with Organic Lift": "هجوم هوایی با ترابری سازمانی",
"Army Aviation/Aviation Rotary Wing": "هوانیروز/هوانوردی بال‌گردان",
"Aviation Composite": "یگان هوانوردی مختلط",
Decontamination: "رفع آلودگی",
Radiological: "پرتوی",
"Task Force": "گروه رزمی",
Utility: "چندمنظوره",
"Special Troops": "رسته‌های ویژه",
```

- [ ] **Step 4: Run translation tests**

Run:

```powershell
npm run test:unit -- --run src/modules/tactical-symbol-map/persianTacticalLabels.test.js src/symbology/translations.test.ts
```

Expected: PASS with English preserved for unreviewed phrases.

- [ ] **Step 5: Commit translation fixes**

```powershell
git add -- front_kalknegar/src/modules/tactical-symbol-map/persianTacticalLabels.js front_kalknegar/src/modules/tactical-symbol-map/persianTacticalLabels.test.js front_kalknegar/src/modules/tactical-symbol-map/SimpleSymbolMapSidebar.vue front_kalknegar/src/symbology/translations.ts front_kalknegar/src/symbology/translations.test.ts
git commit -m "fix: use reviewed Persian tactical terminology"
```

### Task 6: Release verification

**Files:**
- Verify only; modify files only if a test reveals a defect within this plan.

**Interfaces:**
- Confirms favorite persistence events, drawing insertion, staged startup, translation behavior, type safety, and production bundling.

- [ ] **Step 1: Run all focused tests**

```powershell
npm run test:unit -- --run src/modules/tactical-symbol-map/components/sidebar/favoriteToggle.test.js src/modules/tactical-symbol-map/ol/interaction/draw-interaction.test.js src/modules/scenarioeditor/tacticalDrawRequest.test.ts src/modules/tactical-symbol-map/services/projectServices.test.js src/modules/tactical-symbol-map/services/scenarioProjectServices.test.ts src/modules/tactical-symbol-map/persianTacticalLabels.test.js src/symbology/translations.test.ts
```

Expected: all focused tests PASS.

- [ ] **Step 2: Run the complete unit suite**

```powershell
npm run test:unit -- --run
```

Expected: all tests PASS.

- [ ] **Step 3: Run type-check and production build**

```powershell
npm run type-check
npm run build-only
```

Expected: both commands exit with code 0.

- [ ] **Step 4: Review the final diff**

```powershell
git diff --check
git status --short
git log --oneline -8
```

Expected: no whitespace errors; only planned tracked files and pre-existing unrelated untracked files are present.
