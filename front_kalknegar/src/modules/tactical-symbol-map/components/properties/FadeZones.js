/* eslint-disable react/prop-types */
import * as R from 'ramda'
import React from 'react'
import ColSpan2 from './ColSpan2'
import { useServices } from '../hooks'
import { normalizeFadeZones } from '../../ol/style/fadeZones'

const formatZone = zone =>
  `${Math.round(zone.from * 100)}%–${Math.round(zone.to * 100)}% (${Math.round(zone.opacity * 100)}%)`

export default props => {
  const { store } = useServices()
  const featureIds = Object.keys(props.features || {})

  const zones = React.useMemo(() => {
    const values = featureIds.map(id => props.features[id]?.properties?.fadeZones)
    const unique = R.uniq(values.map(z => JSON.stringify(normalizeFadeZones(z))))
    if (unique.length !== 1) return null
    return normalizeFadeZones(values[0])
  }, [props.features, featureIds])

  if (featureIds.length !== 1) return null

  const clearZones = () => {
    store.update(props.features, feature => ({
      ...feature,
      properties: {
        ...feature.properties,
        fadeZones: undefined
      }
    }))
  }

  if (!zones?.length) return null

  return (
    <ColSpan2>
      <div className='bf12-fade-zones'>
        <label>نواحی محو‌شده</label>
        <ul style={{ fontSize: '0.85rem', margin: '0.25rem 0 0.5rem 1rem', color: '#555' }}>
          {zones.map((zone, index) => (
            <li key={index}>{formatZone(zone)}</li>
          ))}
        </ul>
        <button type='button' disabled={props.disabled} onClick={clearZones}>
          پاک کردن همه محوها
        </button>
      </div>
    </ColSpan2>
  )
}
