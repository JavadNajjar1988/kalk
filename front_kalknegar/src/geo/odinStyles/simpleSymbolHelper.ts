import { Symbol } from '@syncpoint/signs'
import { Style, Icon } from 'ol/style'

/**
 * Helper ساده برای ایجاد استایل نماد نقطه‌ای با @syncpoint/signs
 */
export function createSymbolStyle(sidc: string, options: {
  size?: number
  colorMode?: 'Dark' | 'Medium' | 'Light'
  monoColor?: string
  outlineColor?: string
  outlineWidth?: number
  scale?: number
} = {}) {
  try {
    const symbol = new Symbol(sidc, {
      size: options.size || 60,
      colorMode: options.colorMode || 'Dark',
      monoColor: options.monoColor,
      outlineColor: options.outlineColor,
      outlineWidth: options.outlineWidth,
    })
    
    const { width, height } = symbol.getSize()
    const anchor = symbol.getAnchor()

    return new Style({
      image: new Icon({
        anchor: [anchor.x, anchor.y],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        imgSize: [width, height],
        src: 'data:image/svg+xml;utf8,' + symbol.asSVG(),
        scale: options.scale || 0.5,
      }),
    })
  } catch (error) {
    console.error('Error creating symbol:', error, sidc)
    // Fallback style
    return new Style({
      image: new Icon({
        src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="5" fill="red"/></svg>',
        scale: 1,
      }),
    })
  }
}

