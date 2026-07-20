/**
 * Polyfills for browser environment
 * This file must be imported FIRST in main.js
 */
import { Buffer } from 'buffer'

// Make Buffer available globally
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer
}

// Also make it available on window for compatibility
if (typeof window !== 'undefined' && typeof window.Buffer === 'undefined') {
  window.Buffer = Buffer
}

// Make process available (some libraries need it)
if (typeof globalThis.process === 'undefined') {
  globalThis.process = {
    env: {},
    version: '',
    versions: {},
    nextTick: (callback, ...args) => {
      // Use Promise microtask for nextTick
      Promise.resolve().then(() => callback(...args))
    }
  }
} else if (typeof globalThis.process.nextTick !== 'function') {
  // Add nextTick if process exists but nextTick is missing
  globalThis.process.nextTick = (callback, ...args) => {
    Promise.resolve().then(() => callback(...args))
  }
}

console.log('✅ Polyfills loaded: Buffer, process, process.nextTick')

