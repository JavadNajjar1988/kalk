/**
 * Type definitions for ODIN Styles
 */

import type Feature from 'ol/Feature'
import type { Geometry } from 'ol/geom'
import type Style from 'ol/style/Style'

// Signal type from @syncpoint/signal
export type Signal<T = any> = {
  (value?: T): void
  map<U>(fn: (value: T) => U): Signal<U>
  ap<U>(signal: Signal<(value: T) => U>): Signal<U>
  on(fn: (value: T) => void): () => void
}

// SIDC (Symbol Identification Code) from MIL-STD-2525C
export type SIDC = string

// Feature with $ property for ODIN
export interface OdinFeature extends Feature<Geometry> {
  $?: {
    sidc: Signal<SIDC>
    parameterizedSIDC: Signal<SIDC>
    properties: Signal<Record<string, any>>
    geometry: Signal<Geometry>
    centerResolution: Signal<number>
    globalStyle: Signal<Record<string, any>>
    layerStyle: Signal<Record<string, any>>
    featureStyle: Signal<Record<string, any>>
    colorScheme: Signal<string>
    schemeStyle: Signal<Record<string, any>>
    effectiveStyle: Signal<Record<string, any>>
    styleRegistry: Signal<any>
    styleFactory: Signal<any>
    read: Signal<any>
    rewrite: Signal<any>
    pointResolution: Signal<any>
    resolution: Signal<number>
    jtsGeometry: Signal<any>
    clip: Signal<any>
    specialization: Signal<string | null>
    geometryProperties: Signal<Record<string, any>>
    evalSync: Signal<any>
    shape: Signal<Style[]>
    labels: Signal<Style[]>
    selection: Signal<Style[]>
    styles: Signal<Style[]>
  }
}

// Style options
export interface StyleOptions {
  globalStyle?: Record<string, any>
  layerStyle?: Record<string, any>
  featureStyle?: Record<string, any>
  centerResolution?: Signal<number>
}

// Geometry properties for special shapes
export interface GeometryProps {
  an?: number  // Angle in degrees
  am?: number  // Distance/width in meters
  am1?: number // Secondary distance/height in meters
}

// Color scheme types
export type ColorScheme = 
  | 'dark'
  | 'medium'
  | 'light'

// Identity types from MIL-STD-2525C
export type Identity =
  | 'F' // Friend
  | 'H' // Hostile
  | 'N' // Neutral
  | 'U' // Unknown

// Status types
export type Status =
  | 'P' // Present
  | 'A' // Anticipated

// Echelon types
export type Echelon =
  | 'TEAM/CREW'
  | 'SQUAD'
  | 'SECTION'
  | 'PLATOON/DETACHMENT'
  | 'COMPANY/BATTERY/TROOP'
  | 'BATTALION/SQUADRON'
  | 'REGIMENT/GROUP'
  | 'BRIGADE'
  | 'DIVISION'
  | 'CORPS'
  | 'ARMY'
  | 'ARMY GROUP/FRONT'
  | 'REGION'

// Symbol specialization types
export type Specialization =
  | 'RECTANGLE'
  | 'CIRCLE'
  | 'CORRIDOR'
  | null

// Export utility type
export type Nullable<T> = T | null | undefined

