import { useServices } from '../../composables/useServices.js'
import { useEmitter } from '../../composables/useEmitter.js'
import * as R from 'ramda'

export function useController() {
  const { emitter, selection, store } = useServices()
  const localEmitter = useEmitter('sidebar')

  const handleMouseDown = (id, event, spec) => {
    const ids = R.uniq([id, ...selection.selected()])
    if (spec.match(/SCOPE:FEATURE/i)) emitter.emit('highlight/on', { ids })
    else if (spec.match(/SCOPE:LAYER/i)) emitter.emit('highlight/on', { ids })
    else if (spec.match(/SCOPE:MARKER/i)) emitter.emit('highlight/on', { ids })
    else if (spec.match(/SCOPE:PLACE/i)) emitter.emit('highlight/on', { ids })
    else if (spec.match(/SCOPE:MEASURE/i)) emitter.emit('highlight/on', { ids })
  }

  const handleMouseUp = (id, event, spec) => {
    if (spec.match(/SCOPE:FEATURE/i)) emitter.emit('highlight/off')
    else if (spec.match(/SCOPE:LAYER/i)) emitter.emit('highlight/off')
    else if (spec.match(/SCOPE:MARKER/i)) emitter.emit('highlight/off')
    else if (spec.match(/SCOPE:PLACE/i)) emitter.emit('highlight/off')
    else if (spec.match(/SCOPE:MEASURE/i)) emitter.emit('highlight/off')
  }

  const handleClick = (id, event, spec) => {
    const ids = R.uniq([id, ...selection.selected()])
    if (spec.match(/SYSTEM:HIDDEN/i)) store.show(ids)
    else if (spec.match(/SYSTEM:VISIBLE/i)) store.hide(ids)
    else if (spec.match(/SYSTEM:LOCKED/i)) store.unlock(ids)
    else if (spec.match(/SYSTEM:UNLOCKED/i)) store.lock(ids)
    else if (spec.match(/SYSTEM:LINK/i)) localEmitter.emit('link', { id })
    else if (spec.match(/SYSTEM:POLYGON/i)) localEmitter.emit('polygon', { id })
    else if (spec.match(/SYSTEM:LAYER:OPEN/i)) localEmitter.emit('layer/open', { id })
  }

  const addTag = (id, value) => {
    store.addTag(id, value.toLowerCase())
  }

  const removeTag = (id, value) => {
    store.removeTag(id, value.toLowerCase())
  }

  return {
    handleMouseDown,
    handleMouseUp,
    handleClick,
    addTag,
    removeTag
  }
}

