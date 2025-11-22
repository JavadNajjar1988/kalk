<<<<<<< Updated upstream
/**
 * ODIN Styles Adapter for OpenLayers
 * 
 * این adapter پلی بین OpenLayers Features و سیستم استایل‌دهی ODIN است
 * و Signal-based styles را به OpenLayers Styles تبدیل می‌کند.
 */

import type Feature from 'ol/Feature'
import type { Geometry } from 'ol/geom'
import type Style from 'ol/style/Style'
import Signal from '@syncpoint/signal'
import createStyles from './style/styles'
import type { OdinFeature, StyleOptions } from './types'

/**
 * تبدیل OpenLayers Feature به ODIN Feature با property $
 */
export function prepareOdinFeature(
  feature: Feature<Geometry>,
  options: StyleOptions = {}
): OdinFeature {
  const odinFeature = feature as OdinFeature

  // اگر قبلا $ property اضافه شده، return کن
  if (odinFeature.$) {
    return odinFeature
  }

  // ایجاد Signals برای reactive state
  const properties = feature.getProperties()
  
  odinFeature.$ = {
    // Core signals
    sidc: Signal.of(properties.sidc || 'SFGPUCI----'),
    parameterizedSIDC: Signal.of(''),
    properties: Signal.of(properties),
    geometry: Signal.of(feature.getGeometry()!),
    
    // Resolution signals (باید از map view دریافت شود)
    centerResolution: options.centerResolution || Signal.of(1),
    selectionMode: Signal.of('default'),
    
    // Style signals
    globalStyle: Signal.of(options.globalStyle || {}),
    layerStyle: Signal.of(options.layerStyle || {}),
    featureStyle: Signal.of(properties.style || {}),
    
    // این signals توسط createStyles پر می‌شوند
    colorScheme: Signal.of('medium'),
    schemeStyle: Signal.of({}),
    effectiveStyle: Signal.of({}),
    styleRegistry: Signal.of(() => (x: any) => x),
    styleFactory: Signal.of((x: any) => x),
    
    // Geometry processing signals
    read: Signal.of(() => null),
    rewrite: Signal.of((x: any) => x),
    pointResolution: Signal.of(() => 1),
    resolution: Signal.of(1),
    jtsGeometry: Signal.of(null),
    clip: Signal.of((x: any) => x),
    
    // Special properties
    specialization: Signal.of(null),
    geometryProperties: Signal.of({}),
    evalSync: Signal.of({}),
    
    // Output signals
    shape: Signal.of([]),
    labels: Signal.of([]),
    selection: Signal.of([]),
    styles: Signal.of([])
  }

  return odinFeature
}

/**
 * تبدیل ODIN styles (که از Signal می‌آیند) به OpenLayers Styles
 * 
 * @param styleSignal - Signal که آرایه‌ای از styles را emit می‌کند
 * @param onUpdate - callback که وقتی style تغییر می‌کند فراخوانی می‌شود
 * @returns تابع dispose برای cleanup
 */
export function convertSignalToStyles(
  styleSignal: any,
  onUpdate: (styles: Style[]) => void
): () => void {
  // Subscribe به Signal
  const dispose = styleSignal.on((styles: any) => {
    try {
      // اگر styles آرایه‌ای از OpenLayers Style objects است، مستقیم استفاده کن
      if (Array.isArray(styles)) {
        onUpdate(styles)
      } else {
        // اگر نیست، یک آرایه خالی برگردان
        onUpdate([])
      }
    } catch (error) {
      console.error('Error converting ODIN styles:', error)
      onUpdate([])
    }
  })

  return dispose
}

/**
 * تابع اصلی: ایجاد ODIN style برای یک OpenLayers Feature
 * 
 * @param feature - OpenLayers Feature
 * @param options - گزینه‌های استایل
 * @returns تابعی که Style[] برمی‌گرداند (برای استفاده در layer.setStyle)
 */
export function createOdinStyleFunction(
  options: StyleOptions = {}
) {
  // Cache برای نگهداری dispose functions
  const disposeMap = new WeakMap<Feature, () => void>()

  return function(feature: Feature<Geometry>, resolution: number): Style[] {
    try {
      // Prepare ODIN feature
      const odinFeature = prepareOdinFeature(feature, options)

      // به‌روزرسانی resolution
      if (odinFeature.$?.resolution) {
        odinFeature.$.resolution(resolution)
      }
      if (odinFeature.$?.centerResolution) {
        odinFeature.$.centerResolution(resolution)
      }

      // پاک کردن dispose قبلی
      const oldDispose = disposeMap.get(feature)
      if (oldDispose) {
        oldDispose()
      }

      // ایجاد styles از ODIN
      const styleSignal = createStyles(odinFeature)

      // نگهداری آخرین styles
      let currentStyles: Style[] = []

      // Subscribe به تغییرات
      const dispose = convertSignalToStyles(styleSignal, (styles) => {
        currentStyles = styles
        // اگر feature روی نقشه است، trigger update
        feature.changed()
      })

      disposeMap.set(feature, dispose)

      return currentStyles
    } catch (error) {
      console.error('Error creating ODIN style:', error)
      // در صورت خطا، یک style پیش‌فرض ساده برگردان
      return []
    }
  }
}

/**
 * تابع ساده‌تر برای استفاده سریع
 * این تابع یک بار style را می‌سازد (non-reactive)
 */
export function createOdinStyle(
  feature: Feature<Geometry>,
  options: StyleOptions = {}
): Style[] {
  try {
    const odinFeature = prepareOdinFeature(feature, options)
    const styleSignal = createStyles(odinFeature)
    
    let styles: Style[] = []
    
    // دریافت اولین مقدار از Signal
    const dispose = styleSignal.on((value: any) => {
      if (Array.isArray(value)) {
        styles = value
      }
      // بلافاصله dispose کن (فقط یک بار می‌خواهیم)
      setTimeout(dispose, 0)
    })

    return styles
  } catch (error) {
    console.error('Error creating ODIN style:', error)
    return []
  }
}

/**
 * Helper: به‌روزرسانی SIDC یک feature
 */
export function updateFeatureSIDC(feature: Feature, sidc: string) {
  const odinFeature = feature as OdinFeature
  if (odinFeature.$?.sidc) {
    odinFeature.$.sidc(sidc)
  }
  feature.set('sidc', sidc)
}

/**
 * Helper: cleanup تمام subscriptions یک feature
 */
export function cleanupFeature(feature: Feature) {
  const odinFeature = feature as OdinFeature
  if (odinFeature.$) {
    // حذف $ property
    delete odinFeature.$
  }
=======
import Signal from '@syncpoint/signal'
import type { FeatureLike } from 'ol/Feature'
import type { Geometry } from 'ol/geom'

export interface OdinStyleOptions {
  resolution?: number
  globalStyle?: Record<string, any>
  layerStyle?: Record<string, any>
  featureStyle?: Record<string, any>
  selectionMode?: string | null
}

/**
 * Adapter برای تبدیل Feature OpenLayers به فرمت مورد نیاز ODINv2
 */
export function adaptFeatureForOdinStyle(
  feature: FeatureLike,
  options: OdinStyleOptions = {}
) {
  const $: any = {
    properties: Signal.of(feature.getProperties()),
    geometry: Signal.of(feature.getGeometry()),
    globalStyle: Signal.of(options.globalStyle || {}),
    layerStyle: Signal.of(options.layerStyle || {}),
    featureStyle: Signal.of(options.featureStyle || {}),
    selectionMode: Signal.of(options.selectionMode || null),
    centerResolution: Signal.of(options.resolution || 1)
  }
  
  ;(feature as any).$ = $
  return feature
}

/**
 * تبدیل Signal به Promise برای استفاده در Vue
 */
export function signalToPromise<T>(signal: any): Promise<T> {
  return new Promise((resolve) => {
    signal.subscribe((value: T) => {
      resolve(value)
    })
  })
}

/**
 * تبدیل Signal به Array از مقادیر
 */
export function signalToArray<T>(signal: any): T[] {
  let result: T[] = []
  signal.subscribe((value: T) => {
    result = Array.isArray(value) ? value : [value]
  })
  return result
>>>>>>> Stashed changes
}

