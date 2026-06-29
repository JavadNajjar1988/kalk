# ORBAT LOD Scale Alignment Design

## Goal

Align ORBAT level-of-detail transitions with the scale label shown by the
OpenLayers scale-line control. At a displayed scale of 1 km, battalions and
their positioned sub-units must already be visible.

## Root Cause

The current implementation estimates scale-line distance as:

`view resolution * 100 pixels`

OpenLayers does not use a fixed 100-pixel scale line. It calculates point
resolution at the map center, applies projection and latitude correction, and
chooses a 1/2/5 nominal distance whose rendered width is at least 64 pixels.
Consequently, the current transitions vary by map location and can delay raw
unit visibility until the scale line reaches 500 m.

## Behavior

The active map representation is determined from the same nominal metric
distance used by the OpenLayers scale line:

- 5 km and above: division; fall back to the highest available lower ORBAT
  echelon.
- 2 km: brigade; fall back to the highest available lower ORBAT echelon.
- 1 km and below: show all positioned units, including battalions and their
  sub-units.

Only one representation layer is visible at a time. Hidden lower-echelon units
are not rendered with reduced opacity.

## Architecture

Add a pure scale-line distance helper that accepts metric point resolution and
implements OpenLayers' 1/2/5 selection with the application's 64-pixel minimum
width. Unit LOD selection consumes this nominal distance instead of multiplying
raw Web Mercator resolution by a fixed pixel count.

`ScenarioMapLogic` obtains metric point resolution through OpenLayers
`getPointResolution`, using the current projection, resolution, and center. It
refreshes LOD when either resolution or center changes so latitude-dependent
scale remains accurate.

## Testing

Unit tests cover:

- OpenLayers-compatible 1/2/5 scale-line distance selection.
- Division selection at 5 km.
- Brigade selection at 2 km.
- Raw unit visibility at 1 km and 500 m.
- Latitude-correct point resolution flowing into LOD refresh.

Browser verification uses the Tariq al-Quds scenario and confirms that when the
visible scale line reads 1 km, battalions and positioned sub-units are present.

## Non-Goals

- Changing ORBAT hierarchy data.
- Changing symbol appearance or manual symbol overrides.
- Reading the scale label from the DOM.
- Adjusting unrelated map controls or autosave behavior.
