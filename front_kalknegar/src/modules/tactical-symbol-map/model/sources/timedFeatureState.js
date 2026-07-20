export function pickTimedState (timedStates, t) {
  if (!Array.isArray(timedStates) || timedStates.length === 0) return null
  let best = null
  for (const s of timedStates) {
    if (!s || typeof s.t !== 'number') continue
    if (s.t <= t) best = s
    if (s.t > t) break
  }
  return best
}

export function effectiveTimedProperties (baseProperties, timedState) {
  const next = { ...(baseProperties || {}) }
  const timedProperties = timedState?.properties
  if (!timedProperties || typeof timedProperties !== 'object') return next

  Object.entries(timedProperties).forEach(([key, value]) => {
    if (value === undefined) delete next[key]
    else next[key] = value
  })

  return next
}
