import uuid from '../shared/uuid.js'
import globalCommands from './commands/GlobalCommands.js'
import undoCommands from './commands/UndoCommands.js'
import clipboardCommands from './commands/ClipboardCommands.js'
import layerCommands from './commands/LayerCommands.js'
import creationCommand from './commands/CreationCommands.js'
import measureCommands from './commands/MeasureCommands.js'
import eraseCommands from './commands/EraseCommands.js'
import printCommands from './commands/PrintCommands.js'
import replicationCommands from './commands/ReplicationCommands.js'

/**
 *
 */
export function CommandRegistry (services) {
  this.separator = () => [uuid(), 'separator']
  Object.assign(this, globalCommands(services))
  Object.assign(this, clipboardCommands(services))
  Object.assign(this, undoCommands(services))
  Object.assign(this, layerCommands(services))
  Object.assign(this, creationCommand(services))
  Object.assign(this, measureCommands(services))
  Object.assign(this, eraseCommands(services))
  Object.assign(this, printCommands(services))
  Object.assign(this, replicationCommands(services))

  this.VIEW_CREATE = {
    label: 'Create View'
  }
}

CommandRegistry.prototype.command = function (key) {
  return [key, this[key]]
}
