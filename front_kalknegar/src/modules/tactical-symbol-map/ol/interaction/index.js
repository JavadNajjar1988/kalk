import Draw from 'ol/interaction/Draw'
import DragPan from 'ol/interaction/DragPan'
import { defaults as defaultInteractions } from 'ol/interaction'
import selectInteraction from './select-interaction'
import translateInteraction from './translate-interaction'
import cloneInteraction from './clone-interaction'
import modifyInteraction from './modify-interaction'
import snapInteraction from './snap-interaction'
import boxselectInteraction from './boxselect-interaction'
import drawInteraction from './draw-interaction'
import eraseInteraction from './erase-interaction'

/**
 *
 */
export default options => {
  const select = selectInteraction(options)
  const clone = cloneInteraction(options)
  const translate = translateInteraction(options)
  const boxselect = boxselectInteraction(options)
  const modify = modifyInteraction(options)
  const erase = eraseInteraction(options)
  const snap = snapInteraction(options)

  // Draw interaction is dynamically added to map as required.
  drawInteraction(options)

  const interactions = defaultInteractions({ doubleClickZoom: false }).extend(
    // Events are delegated from right to left.
    // erase is last so it receives pointer events before modify/select.
    [select, clone, translate, boxselect, modify, snap, erase]
  )

  const { map } = options
  interactions.getArray().forEach(interaction => map.addInteraction(interaction))

  const dragPan = map.getInteractions().getArray().find(i => i instanceof DragPan)

  erase.on('change:active', () => {
    const eraseActive = erase.getActive()
    modify.setActive(!eraseActive)
    select.setActive(!eraseActive)
    if (dragPan) dragPan.setActive(!eraseActive)
  })

  map.getInteractions().on('add', ({ target, element }) => {
    if (element instanceof Draw) {
      // Deactivate select because draw propagates all events,
      // even those which should be consumed (click, double click).
      select.setActive(false)

      // Move snap to end of list (after draw):
      target.remove(snap)
      target.push(snap)
    }
  })

  map.getInteractions().on('remove', ({ element }) => {
    if (element instanceof Draw) {
      // Must be deferred, since double click is still handled otherwise.
      setTimeout(() => select.setActive(true))
    }
  })
}
