# Tactical Timeline Persistence Fix

## Problem

Timed tactical feature records are stored under
`metadata.tacticalSymbols.tuples` with keys prefixed by `timed+feature:`.
Their `t` values are numbers while the editor is running. The generic
scenario JSON replacer converts every property named `t` to an ISO date
string. After reload, tactical playback only accepts numeric timestamps,
so the saved records are ignored.

## Design

The scenario serializer will preserve numeric `t` values only for state
objects contained in tactical `timed+feature:` tuples. Other scenario
timestamps will continue to use the existing ISO serialization format.

Snapshot normalization will also convert legacy tactical timestamps from
valid ISO strings to millisecond numbers. Invalid timestamps will remain
unchanged and continue to be ignored by playback rather than being assigned
an incorrect time.

## Data Flow

1. A tactical edit records a numeric timestamp in `timed+feature:...`.
2. Snapshot export places that record in `metadata.tacticalSymbols`.
3. Scenario serialization recognizes tactical timed-state objects and keeps
   their numeric `t` values unchanged.
4. Snapshot import normalizes legacy ISO timestamps to numbers.
5. Timeline marker collection and tactical playback receive numeric times.

## Compatibility

- Existing scenarios containing ISO tactical timestamps become readable.
- New scenarios store tactical timestamps as numbers.
- Unit states, feature states, visibility times, and scenario event times
  retain their existing serialization behavior.
- Snapshot version remains `1` because the importer supports both stored
  representations.

## Tests

- A serializer test proves tactical `t` remains numeric while a normal
  scenario state `t` remains ISO formatted.
- A snapshot test proves a legacy ISO tactical timestamp imports as a number.
- Existing tactical snapshot, autosave, timeline, and timed-state tests must
  continue to pass.

## Scope

This change only addresses tactical timeline persistence. It does not alter
recording controls, playback semantics, autosave timing, or backend schemas.
