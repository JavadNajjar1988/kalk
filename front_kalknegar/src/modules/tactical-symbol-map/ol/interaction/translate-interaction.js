import * as R from 'ramda'
import { Translate } from 'ol/interaction'
import { writeFeatureCollection } from '../../ol/format'
import { noModifierKeys, shiftKeyOnly } from 'ol/events/condition'

const scenarioTimeKey = 'scenario:time'
const timedFeatureKey = featureId => `timed+feature:${featureId}`

function upsertTimedGeometry(states, next) {
  const list = Array.isArray(states) ? [...states] : []
  const idx = list.findIndex(s => s && s.t === next.t)
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...next }
  } else {
    list.push(next)
  }
  list.sort((a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : 0))
  return list
}

/**
 *
 */
export default options => {
  const { services, sources, hitTolerance, recordingStore } = options
  const { modifiableSource } = sources
  const { store } = services

  // snapshot :: [GeoJSON/Feature]
  let snapshot = []

  async function getScenarioTime () {
    if (typeof options.getScenarioTime === 'function') {
      const t = options.getScenarioTime()
      if (typeof t === 'number' && Number.isFinite(t)) return t
    }
    const t = await store.value(scenarioTimeKey, Number.MIN_SAFE_INTEGER)
    return typeof t === 'number' ? t : Number.MIN_SAFE_INTEGER
  }

  const interaction = new Translate({
    hitTolerance,
    features: modifiableSource.getFeaturesCollection(),
    condition: event => noModifierKeys(event) || shiftKeyOnly(event)
  })

  // Inconvenient: translatestart/end is also triggered when
  // feature is simply clicked while already selected.
  // A 'dirty check' would be nice for translateend.

  interaction.on('translatestart', async event => {
    // Get full set of properties for each feature:
    const ids = event.features.getArray().map(feature => feature.getId())
    snapshot = await store.values(ids)
  })

  interaction.on('translateend', async event => {
    // Deep compare geometry and only update when changed:
    const { features } = writeFeatureCollection(event.features.getArray())
    const keys = features.map(R.prop('id'))
    const merge = (feature, index) => ({ ...snapshot[index], geometry: feature.geometry })
    const newValues = features.map(merge)

    const isTimedRecording = !!recordingStore?.isRecordingTacticalLocation
    if (!isTimedRecording) {
      store.update(keys, newValues, snapshot)
      return
    }

    const t = await getScenarioTime()
    const timedKeys = keys.map(timedFeatureKey)
    const timedSnapshots = await Promise.all(timedKeys.map(k => store.value(k, [])))
    const nextTimedValues = timedSnapshots.map((states, index) =>
      upsertTimedGeometry(states, { t, geometry: newValues[index].geometry })
    )
    store.update(timedKeys, nextTimedValues, timedSnapshots)
  })

  return interaction
}
