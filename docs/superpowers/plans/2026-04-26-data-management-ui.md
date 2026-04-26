# Data Management UI Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the `DataManagementPage` UI match the look-and-feel of other dashboard tabs (specifically `ResourcesPage`) in `front_dashboard`.

**Architecture:** Reuse the same theme source (`selectTheme` + `createAppTheme`) and the same styling primitives (`unifiedAccent`, `unifiedSurface`, `Paper` chrome, `Tabs` indicator/hover/selected styles) used by `ResourcesPage`. Keep the business logic (upload/import flows) unchanged.

**Tech Stack:** React, TypeScript, MUI (Material UI), Redux (theme state), React Router.

---

## File structure (what changes and why)

- Modify: `front_dashboard/src/modules/dashboard/pages/DataManagementPage.tsx`
  - Wrap page with `ThemeProvider` using the Redux UI theme (same as `ResourcesPage`).
  - Replace the plain container (`Box p/maxWidth`) + plain `Paper/Tabs` styles with the same surface chrome used in `ResourcesPage`.
  - Update the local `TabPanel` to use the same padding + scroll behavior pattern (outer `Paper` owns scroll region; panel content uses consistent padding).
  - Keep all existing handlers and API calls intact; only UI structure/styling changes.

No new files needed.

---

### Task 1: Extract styling pattern from `ResourcesPage` and apply to `DataManagementPage`

**Files:**
- Modify: `front_dashboard/src/modules/dashboard/pages/DataManagementPage.tsx`
- Reference: `front_dashboard/src/modules/dashboard/pages/ResourcesPage.tsx`

- [ ] **Step 1: Add theme plumbing to DataManagementPage**
  - Import `ThemeProvider` from `@mui/material`
  - Import `useAppSelector` from `@/store`
  - Import `selectTheme` from `@/store/slices/uiSlice`
  - Import `createAppTheme` from `@/theme`
  - Compute:
    - `themeState = useAppSelector(selectTheme)`
    - `muiTheme = createAppTheme(...)`
    - `unifiedAccent = muiTheme.palette.primary.main`
    - `unifiedSurface = linear-gradient(...)` (same formula as `ResourcesPage`)
    - `sectionTheme = createTheme(muiTheme, { components: { MuiDialog: ..., MuiDialogTitle: ..., MuiDialogActions: ... }})`

- [ ] **Step 2: Replace top-level layout to match ResourcesPage chrome**
  - Wrap return in `<ThemeProvider theme={sectionTheme}>`
  - Use an outer `<Box>` with:
    - `width: '100%'`, `height: '100%'`
    - `display: 'flex'`, `flexDirection: 'column'`
    - `p: 3`
    - and the same `& .MuiCard-root` / `& .MuiPaper-root` border overrides used in `ResourcesPage` (safe even if no cards are present)
  - Update title `<Typography variant="h4">` to use the same gradient text style.

- [ ] **Step 3: Update Paper/Tabs styling**
  - Replace the simple `<Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>` with a `<Paper>` that matches:
    - `flex: 1`, `display: 'flex'`, `flexDirection: 'column'`
    - `borderRadius: 3`
    - `background: unifiedSurface`
    - `backdropFilter: 'blur(20px)'`
    - `border: 1px solid alpha(unifiedAccent, 0.24)`
    - `overflow: 'hidden'`
  - Wrap `<Tabs>` with a `<Box>` that has:
    - `borderBottom: 1`
    - `borderColor: alpha(unifiedAccent, 0.2)`
    - `background: alpha(unifiedAccent, 0.06)`
  - Apply `Tabs` sx to match indicator height/radius and selected/hover behavior.

- [ ] **Step 4: Make content region scrollable like ResourcesPage**
  - Replace the inner `<Box sx={{ p: 2 }}>` with:
    - `<Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>`
  - Update `TabPanel` implementation to render:
    - `<Box sx={{ p: 3 }}>` around the children when active
    - No inline `marginTop: 16` (spacing comes from padding)

- [ ] **Step 5: Keep existing behavior unchanged**
  - Ensure handlers, refs, and state remain the same
  - No change to API calls, navigation, or Redux dispatch flow

- [ ] **Step 6: Manual verification**
  - Run the dashboard frontend (whatever command the repo uses) and open:
    - `/dashboard/resources` and `/dashboard/data-management`
  - Visually confirm:
    - Same title styling (gradient)
    - Same paper surface, borders, and tab indicator/hover
    - Content area scroll works without page jumping

---

### Task 2: Lint/typecheck verification for the modified file

**Files:**
- Check: `front_dashboard/src/modules/dashboard/pages/DataManagementPage.tsx`

- [ ] **Step 1: Run the repo’s lint/typecheck command(s)**
  - If using a workspace toolchain, run the dashboard package lint script.
  - Fix any TypeScript/MUI import issues introduced by the refactor.

