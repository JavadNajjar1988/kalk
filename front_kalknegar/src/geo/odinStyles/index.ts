/**
 * ODIN Styles - Military Symbol Styling System
 * Ported from ODINv2 for use with OpenLayers in Kalknegar
 */

// Main adapter functions (RECOMMENDED)
export {
  createOdinStyleFunction,
  createOdinStyle,
  prepareOdinFeature,
  convertSignalToStyles,
  updateFeatureSIDC,
  cleanupFeature
} from './adapter'

// Low-level style creation (ADVANCED)
export { default as createStyles } from './style/styles'

// Symbol library
export * as SymbolLibrary from './ts/library'
export * as SymbolParser from './ts/parser'

// Symbology dictionaries
export { default as MIL_STD_2525C } from './symbology/2525c'
export { default as SymbolDefinitions } from './symbology/symbol'

// Utility functions
export * as Geometry from './geometry'
export * as Math from './Math'
export * as IDs from './ids'

// Type definitions
export type { OdinFeature, StyleOptions, Signal } from './types'

