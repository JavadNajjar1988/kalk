/**
 * Mock implementations for Undo, Selection, OSDDriver, and IpcRenderer
 * These are simplified versions for the MVP
 */
import Emitter from '../shared/emitter.js'

/**
 * Mock OSDDriver - minimal implementation for web
 */
export class MockOSDDriver {
  pointermove(event) {
    // Do nothing in web version
  }
}

/**
 * Mock IpcRenderer - minimal implementation for web
 */
export class MockIpcRenderer {
  on(channel, callback) {
    // Do nothing in web version
  }
  
  off(channel, callback) {
    // Do nothing in web version
  }
  
  send(channel, ...args) {
    // Do nothing in web version
  }
}

/**
 * MockUndo - must inherit from Emitter to support event listeners
 */
export function MockUndo() {
  Emitter.call(this)
  this.undoStack = []
  this.redoStack = []
}

// Inherit from Emitter
MockUndo.prototype = Object.create(Emitter.prototype)
MockUndo.prototype.constructor = MockUndo

MockUndo.prototype.canUndo = function() {
  return false
}

MockUndo.prototype.canRedo = function() {
  return false
}

MockUndo.prototype.undo = function() {
  // Undo not implemented in MVP
}

MockUndo.prototype.redo = function() {
  // Redo not implemented in MVP
}

MockUndo.prototype.push = function(command) {
  // Just execute the command without storing for undo
  if (command && command.execute) {
    command.execute()
  }
}

MockUndo.prototype.apply = async function(command) {
  // Just execute the command without storing for undo
  if (command && command.apply) {
    await command.apply()
  }
}

MockUndo.prototype.command = function(apply, inverse, options) {
  // Return a command object that can be used with undo/redo
  return { apply, inverse, ...options }
}

MockUndo.prototype.composite = function(commands) {
  // Return a composite command
  return {
    apply: async () => {
      for (const cmd of commands) {
        if (cmd && cmd.apply) await cmd.apply()
      }
    },
    inverse: async () => {
      // Reverse order for inverse
      for (const cmd of [...commands].reverse()) {
        if (cmd && cmd.inverse) await cmd.inverse()
      }
    }
  }
}

/**
 * MockSelection - must inherit from Emitter to support event listeners
 */
export function MockSelection() {
  Emitter.call(this)
  this.selected_ = []
}

// Inherit from Emitter
MockSelection.prototype = Object.create(Emitter.prototype)
MockSelection.prototype.constructor = MockSelection

MockSelection.prototype.isEmpty = function() {
  return this.selected_.length === 0
}

MockSelection.prototype.isSelected = function(entry) {
  return this.selected_.includes(entry)
}

MockSelection.prototype.selected = function(p = () => true) {
  return this.selected_.filter(p)
}

MockSelection.prototype.select = function(entries) {
  if (!entries || !Array.isArray(entries) || entries.length === 0) return
  const selected = entries.filter(x => !this.selected_.includes(x))
  this.selected_ = [...this.selected_, ...selected]
  if (selected.length) this.emit('selection', { selected, deselected: [] })
}

MockSelection.prototype.deselect = function(entries) {
  if (!entries || !Array.isArray(entries) || entries.length === 0) return
  const deselected = entries.filter(x => this.selected_.includes(x))
  this.selected_ = this.selected_.filter(x => !deselected.includes(x))
  if (deselected.length) this.emit('selection', { selected: [], deselected })
}

MockSelection.prototype.set = function(entries) {
  if (!entries) entries = []
  if (!Array.isArray(entries)) return
  const uniq = [...new Set(entries)]
  const selected = uniq.filter(x => !this.selected_.includes(x))
  const deselected = this.selected_.filter(x => !uniq.includes(x))
  if (!selected.length && !deselected.length) return
  this.selected_ = [...uniq]
  this.emit('selection', { deselected, selected })
}

MockSelection.prototype.clear = function() {
  const deselected = [...this.selected_]
  this.selected_ = []
  if (deselected.length) this.emit('selection', { selected: [], deselected })
}

MockSelection.prototype.has = function(item) {
  return this.selected_.includes(item)
}

MockSelection.prototype.focus = function(id) {
  this.emit('focus', { id })
}

