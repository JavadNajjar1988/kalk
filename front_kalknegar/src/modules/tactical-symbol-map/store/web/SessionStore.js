import Emitter from '../../shared/emitter.js'

/**
 * SessionStore for Web - in-memory storage for session data
 */
export default function SessionStore() {
  Emitter.call(this)
  this.cache = {}
}

// Inherit from Emitter
SessionStore.prototype = Object.create(Emitter.prototype)
SessionStore.prototype.constructor = SessionStore

SessionStore.prototype.DEFAULT_VIEWPORT = {
  center: [1823376.75753279, 6143598.472197734], // Vienna
  resolution: 612,
  rotation: 0
}

SessionStore.prototype.put = async function(key, value) {
  this.cache[key] = value
  this.emit('put', { key, value })
  return value
}

SessionStore.prototype.get = async function(key, defaultValue) {
  return this.cache[key] !== undefined ? this.cache[key] : defaultValue
}

SessionStore.prototype.del = async function(key) {
  delete this.cache[key]
  this.emit('del', { key })
}

