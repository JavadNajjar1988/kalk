import { Modify } from './modify'
import { writeGeometryObject } from '../../ol/format'

const scenarioTimeKey = 'scenario:time'
const timedFeatureKey = featureId => `timed+feature:${featureId}`

function upsertTimedGeometry (states, next) {
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
 * @param {*} store
 * @param {*} selectedSource
 * @param {*} hitTolerance
 */
export default options => {
  const { services, sources, hitTolerance, recordingStore } = options
  const { store } = services
  const { modifiableSource } = sources

  const interaction = new Modify({
    source: modifiableSource,
    hitTolerance
  })

  interaction.on('modifyend', async ({ feature }) => {
    const key = feature.getId()
    const geometry = writeGeometryObject(feature.getGeometry())
    const isTimedRecording = !!recordingStore?.isRecordingTacticalGeometry
    if (!isTimedRecording) {
      store.update([key], value => ({ ...value, geometry }))
      return
    }

    const t = await store.value(scenarioTimeKey, Number.MIN_SAFE_INTEGER)
    const timedKey = timedFeatureKey(key)
    const oldStates = await store.value(timedKey, [])
    const nextStates = upsertTimedGeometry(oldStates, { t, geometry })
    store.update([timedKey], [nextStates], [oldStates])
  })

  return interaction
}
