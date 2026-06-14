# Curved Unit Paths Design

## Goal

Allow a user to edit a unit movement segment as a smooth curved path while preserving the existing straight-line behavior for current scenarios.

The curved path must affect both rendering and time interpolation. A unit should move along the same curve the user sees on the map.

## Current Behavior

Unit movement state supports:

- `location` as the destination position for a timed state.
- `via` as optional intermediate positions.
- `interpolate === false` to disable interpolation for a state.
- `viaStartTime` to delay the start of interpolation for a state.

Interpolation currently builds a Turf `LineString` from `[previousLocation, ...via, destination]` and calls `turfAlong`. This produces straight segments between points. The path editor already lets users add or move intermediate points.

## User Experience

In unit path editing mode, each movement segment can be set to either:

- `straight`: existing behavior.
- `curved`: smooth curve through the segment points.

The user edits the same waypoint and via-point structure already used by the path editor. In curved mode, via points act as control points that shape the curve.

The UI should expose a small segment-level toggle for `straight` vs `curved`. Existing scenarios and newly created segments default to `straight`.

## Data Model

Extend unit state entries with an optional field:

```ts
pathMode?: "straight" | "curved";
```

Compatibility rules:

- Missing `pathMode` means `straight`.
- Existing scenario JSON remains valid.
- `pathMode` applies to the movement into that state, using the previous active location as the segment start and this state's `location` as the segment end.

## Path Generation

Create one shared path-building utility used by both:

- unit time interpolation
- unit history/path rendering

Inputs:

- start position
- optional via positions
- end position
- path mode

Output:

- a WGS84 coordinate array suitable for Turf and OpenLayers conversion

Rules:

- `straight` returns the existing point sequence unchanged.
- `curved` returns a sampled Catmull-Rom curve through the point sequence.
- If a segment has fewer than three meaningful points, `curved` falls back to the straight point sequence.
- Sampling density should be bounded, deterministic, and sufficient for smooth map rendering without creating excessive geometry.

## Interpolation

`updateCurrentUnitState` should call the shared path builder before `turfLength` and `turfAlong`.

This keeps speed calculation based on the actual displayed curve length. It also ensures the unit's interpolated `location` follows the curve rather than the original straight chord.

`interpolate === false` and `viaStartTime` behavior remains unchanged.

## Rendering

`createUnitPathFeatures` should use the same path builder for the visible movement path.

In edit mode:

- editable waypoint and via geometry should remain based on the original control points so users can manipulate the path shape directly.
- the rendered path should show the final curve when `pathMode === "curved"`.

In non-edit mode:

- only the display path is needed, and it should match the interpolation path.

## Editing

Existing via-point add, modify, and remove behavior remains the base interaction.

Add a segment-level action to set `pathMode` for the state that owns the movement segment. This can be surfaced from the path editor toolbar or segment selection UI, following existing toolbar patterns.

## Testing

Add focused tests for the shared path builder:

- straight mode returns the original sequence.
- curved mode samples extra points when enough control points exist.
- curved mode falls back to straight for short point sequences.
- output includes the original start and end coordinates.

Add interpolation coverage:

- when `pathMode` is curved, the interpolated position differs from the straight chord for a shaped via-point path.
- existing straight interpolation behavior remains unchanged.

Add rendering coverage where practical:

- `createUnitPathFeatures` uses curved sampled geometry for curved states.
- editable control points remain available for path editing.

## Non-Goals

- No Bezier handle UI.
- No per-control-point timing.
- No automatic route planning or terrain-aware paths.
- No migration that rewrites existing scenario files.

## Risks

The main risk is divergence between displayed path and interpolation path. The shared path builder is required to prevent that.

The second risk is making editing confusing if the user cannot tell which segment is curved. The UI should show the active path mode clearly when editing a selected segment.
