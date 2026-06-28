# Toolbar Playback Separation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split scenario editor playback/time controls into a second toolbar below the tool toolbar.

**Architecture:** Update `MapEditorMainToolbar.vue` so the template renders a vertical wrapper with two `nav` elements. Keep behavior, stores, popovers, dropdowns, and emitted events unchanged while moving only playback-related controls into the new lower toolbar.

**Tech Stack:** Vue 3 single-file components, Tailwind utility classes, Vitest structural tests.

---

### Task 1: Structural Test

**Files:**
- Create: `front_kalknegar/src/modules/scenarioeditor/MapEditorMainToolbar.test.ts`

- [ ] **Step 1: Write the failing test**

Create a test that reads `MapEditorMainToolbar.vue`, extracts the main and playback toolbar blocks by class name, and asserts:

```ts
expect(component).toContain("map-editor-playback-toolbar");
expect(mainToolbarBlock).toContain("symbol-library-button");
expect(mainToolbarBlock).not.toContain("playback-button");
expect(playbackToolbarBlock).toContain("playback-button");
expect(playbackToolbarBlock).toContain("storyboard-menu-button");
expect(playbackToolbarBlock).toContain("playback-menu-button");
expect(playbackToolbarBlock).toContain("calendar-button");
expect(playbackToolbarBlock).toContain("end-time-button");
expect(playbackToolbarBlock).toContain("next-event-button");
expect(playbackToolbarBlock).toContain("next-day-button");
expect(playbackToolbarBlock).toContain("prev-day-button");
expect(playbackToolbarBlock).toContain("prev-event-button");
expect(playbackToolbarBlock).toContain("start-time-button");
```

- [ ] **Step 2: Verify the test fails before implementation**

Run:

```bash
npm run test:unit -- src/modules/scenarioeditor/MapEditorMainToolbar.test.ts
```

Expected: FAIL because `map-editor-playback-toolbar` does not exist yet.

### Task 2: Toolbar Split

**Files:**
- Modify: `front_kalknegar/src/modules/scenarioeditor/MapEditorMainToolbar.vue`

- [ ] **Step 1: Move playback controls**

Wrap the two toolbars in:

```vue
<div class="pointer-events-auto flex max-w-full flex-col items-center justify-center gap-2">
```

Keep the existing tool buttons in the upper `nav`. Move the playback/time controls into:

```vue
<nav class="map-editor-playback-toolbar pointer-events-auto flex w-auto flex-row-reverse items-center justify-center rounded-xl border p-2 text-sm text-foreground sm:p-3">
```

- [ ] **Step 2: Keep tactical symbol library in the upper toolbar**

Add `symbol-library-button` to the tactical symbol library button class and leave it in the upper toolbar.

- [ ] **Step 3: Replace the tactical symbol library icon**

Use a clearer Phosphor icon such as `PhArchiveTray` or `PhStack` from `@phosphor-icons/vue`, preserving the existing size and transition classes.

### Task 3: Styling and Verification

**Files:**
- Modify: `front_kalknegar/src/modules/scenarioeditor/MapEditorMainToolbar.vue`

- [ ] **Step 1: Share toolbar surface styling**

Apply the same background, border, and shadow styles to `.map-editor-main-toolbar` and `.map-editor-playback-toolbar`.

- [ ] **Step 2: Run focused test**

Run:

```bash
npm run test:unit -- src/modules/scenarioeditor/MapEditorMainToolbar.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run frontend verification**

Run:

```bash
npm run type-check
npm run build-only
```

Expected: both commands exit 0.
