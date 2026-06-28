# Toolbar Playback Separation Design

## Goal

Separate scenario playback controls from map editing tools in the scenario editor toolbar.

## Requirements

- Keep the existing map editor toolbar as the tool toolbar.
- Add a second toolbar directly below it for playback-related controls.
- Move these controls to the second toolbar: scenario play/pause, storyboard controls, playback menu, date/time picker, go to end time, next event, next day, previous day, previous event, and go to start time.
- Keep the tactical symbol library button in the upper tool toolbar.
- Replace the tactical symbol library icon with a clearer library/archive-style icon from the existing Phosphor icon set.
- Keep the two toolbars stacked, with a compact vertical gap so they read as one grouped control while still separating tools from playback.

## Design

`MapEditorMainToolbar.vue` will render a vertical wrapper containing two `nav` elements with a compact gap. The first `nav` keeps the existing `map-editor-main-toolbar` class and contains only tool actions. The second `nav` uses a new `map-editor-playback-toolbar` class and contains playback/time controls with the same surface, border, radius, and shadow treatment as the main toolbar.

The popover, dropdown, and emitted events stay unchanged. Only template placement and the tactical symbol library icon import change.

## Verification

- Add a Vitest structural test that reads `MapEditorMainToolbar.vue` and verifies that playback controls are in the playback toolbar while the tactical symbol library stays in the main toolbar.
- Run the focused test.
- Run type-check/build for the frontend.
