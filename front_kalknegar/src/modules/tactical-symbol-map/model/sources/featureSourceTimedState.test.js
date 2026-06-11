import { describe, expect, it } from 'vitest'
import { effectiveTimedProperties, pickTimedState } from './timedFeatureState'

describe('featureSource timed state helpers', () => {
  it('picks the latest timed state at or before the scenario time', () => {
    const states = [
      { t: 100, properties: { fadeZones: ['start'] } },
      { t: 200, properties: { fadeZones: ['next'] } }
    ]

    expect(pickTimedState(states, 50)).toBeNull()
    expect(pickTimedState(states, 100)).toEqual(states[0])
    expect(pickTimedState(states, 150)).toEqual(states[0])
    expect(pickTimedState(states, 250)).toEqual(states[1])
  })

  it('merges timed properties and removes keys explicitly set to undefined', () => {
    const base = { sidc: 'G*G*GLB---', fadeZones: [{ from: 0, to: 1, opacity: 0.15 }] }
    const timed = {
      properties: {
        fadeZones: undefined,
        t: 'Timed label'
      }
    }

    expect(effectiveTimedProperties(base, timed)).toEqual({
      sidc: 'G*G*GLB---',
      t: 'Timed label'
    })
    expect(effectiveTimedProperties(base, null)).toEqual(base)
  })
})
