<template>
  <div class="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button
            @click="goToDashboard"
            class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            تست سیستم نمادهای ODINv2
          </h1>
        </div>
          <div class="flex items-center gap-2">
          <button
            v-if="isDrawing"
            @click="stopDrawing"
            class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            لغو رسم
          </button>
          <button
            @click="addSampleFeatures"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            افزودن نمونه‌ها
          </button>
          <button
            @click="clearFeatures"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            پاک کردن
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Map Container -->
      <div ref="mapContainer" class="flex-1 relative"></div>

      <!-- Symbol Palette Sidebar -->
      <div class="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">نمادها</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">برای اضافه کردن نماد، آن را بکشید یا کلیک کنید</p>
        </div>
        
        <div class="flex-1 overflow-y-auto p-4">
          <!-- Search -->
          <div class="mb-4">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="جستجوی نماد..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Categories -->
          <div v-for="category in filteredCategories" :key="category.name" class="mb-6">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase">
              {{ category.name }}
            </h3>
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="symbol in category.symbols"
                :key="symbol.sidc"
                :draggable="true"
                @dragstart="handleDragStart($event, symbol)"
                @click="selectSymbol(symbol)"
                class="symbol-item p-2 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors"
                :class="{ 
                  'ring-2 ring-blue-500': selectedSymbol?.sidc === symbol.sidc,
                  'cursor-move': symbol.type !== 'multipoint',
                  'cursor-crosshair': symbol.type === 'multipoint',
                  'hover:bg-gray-50 dark:hover:bg-gray-700': !isDrawing || selectedSymbol?.sidc === symbol.sidc
                }"
              >
                <div class="flex flex-col items-center">
                  <div
                    class="symbol-preview mb-1"
                    v-html="getSymbolSVG(symbol.sidc)"
                  ></div>
                  <span class="text-xs text-gray-600 dark:text-gray-400 text-center truncate w-full">
                    {{ symbol.name }}
                  </span>
                  <span v-if="symbol.type === 'multipoint'" class="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    ({{ symbol.maxPoints || 2 }} نقطه)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Info Panel -->
    <div class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
      <div class="max-w-7xl mx-auto">
        <h3 class="text-lg font-semibold mb-2 text-gray-900 dark:text-white">اطلاعات:</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span class="font-medium text-gray-700 dark:text-gray-300">تعداد Features:</span>
            <span class="ml-2 text-gray-900 dark:text-white">{{ featureCount }}</span>
          </div>
          <div>
            <span class="font-medium text-gray-700 dark:text-gray-300">Zoom:</span>
            <span class="ml-2 text-gray-900 dark:text-white">{{ currentZoom.toFixed(2) }}</span>
          </div>
          <div>
            <span class="font-medium text-gray-700 dark:text-gray-300">Resolution:</span>
            <span class="ml-2 text-gray-900 dark:text-white">{{ currentResolution.toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import Map from 'ol/Map'
import View from 'ol/View'
import { Tile as TileLayer } from 'ol/layer'
import { OSM } from 'ol/source'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Feature } from 'ol'
import { Point, LineString, Polygon, MultiPoint, Circle as CircleGeometry } from 'ol/geom'
import { fromLonLat } from 'ol/proj'
import { Style, Icon, Stroke, Fill, Text, Circle } from 'ol/style'
import { createSymbolStyle } from '@/geo/odinStyles/simpleSymbolHelper'
import { Symbol } from '@syncpoint/signs'
import Draw from 'ol/interaction/Draw'

const mapContainer = ref<HTMLElement>()
const map = ref<Map | null>(null)
const vectorSource = ref<VectorSource | null>(null)
const featureCount = ref(0)
const currentZoom = ref(0)
const currentResolution = ref(0)
const searchQuery = ref('')
const selectedSymbol = ref<{ sidc: string; name: string; type?: 'point' | 'multipoint' | 'linestring' | 'polygon' } | null>(null)
const drawInteraction = ref<Draw | null>(null)
const isDrawing = ref(false)

// تعریف نمادهای مختلف
const symbolCategories = [
  {
    name: 'واحدهای دوست',
    symbols: [
      { sidc: 'SFGPUCI----K---', name: 'واحد پیاده' },
      { sidc: 'SFGPEWI----K---', name: 'واحد زرهی' },
      { sidc: 'SFGPAWI----K---', name: 'واحد توپخانه' },
      { sidc: 'SFGPAHI----K---', name: 'هلیکوپتر' },
      { sidc: 'SFGPAFI----K---', name: 'هواپیما' },
      { sidc: 'SFGPCVI----K---', name: 'نیروی دریایی' },
    ]
  },
  {
    name: 'واحدهای دشمن',
    symbols: [
      { sidc: 'SHGPUCI----K---', name: 'واحد پیاده' },
      { sidc: 'SHGPEWI----K---', name: 'واحد زرهی' },
      { sidc: 'SHGPAWI----K---', name: 'واحد توپخانه' },
      { sidc: 'SHGPAHI----K---', name: 'هلیکوپتر' },
      { sidc: 'SHGPAFI----K---', name: 'هواپیما' },
      { sidc: 'SHGPCVI----K---', name: 'نیروی دریایی' },
    ]
  },
  {
    name: 'واحدهای خنثی',
    symbols: [
      { sidc: 'SUGPUCI----K---', name: 'واحد پیاده' },
      { sidc: 'SUGPEWI----K---', name: 'واحد زرهی' },
      { sidc: 'SUGPAWI----K---', name: 'واحد توپخانه' },
    ]
  },
  {
    name: 'اهداف',
    symbols: [
      { sidc: 'G*F*LT----', name: 'هدف خطی' },
      { sidc: 'G*F*PT----', name: 'هدف نقطه‌ای' },
      { sidc: 'G*F*AT----', name: 'هدف منطقه‌ای' },
    ]
  },
  {
    name: 'عملیات',
    symbols: [
      { sidc: 'G*T*A-----', name: 'جهت حمله' },
      { sidc: 'G*T*D-----', name: 'جهت پیشروی' },
      { sidc: 'G*M*SP----', name: 'نقطه قوی' },
      { sidc: 'G*M*OB----', name: 'موانع' },
    ]
  },
  {
    name: 'نمادهای چندنقطه‌ای',
    symbols: [
      { sidc: 'G*F*ATC---', name: 'هدف دایره‌ای', type: 'multipoint', maxPoints: 2 },
      { sidc: 'G*F*ACSC--', name: 'منطقه پشتیبانی آتش', type: 'multipoint', maxPoints: 2 },
      { sidc: 'G*F*ACNC--', name: 'منطقه بدون آتش', type: 'multipoint', maxPoints: 2 },
      { sidc: 'G*G*OAS---', name: 'موقعیت پشتیبانی آتش', type: 'multipoint', maxPoints: 4 },
      { sidc: 'G*T*US----', name: 'پوشش', type: 'multipoint', maxPoints: 3 },
      { sidc: 'G*T*UG----', name: 'نگهبانی', type: 'multipoint', maxPoints: 3 },
      { sidc: 'G*T*UC----', name: 'پوشش', type: 'multipoint', maxPoints: 3 },
    ]
  }
]

// فیلتر کردن نمادها بر اساس جستجو
const filteredCategories = computed(() => {
  if (!searchQuery.value) return symbolCategories
  
  const query = searchQuery.value.toLowerCase()
  return symbolCategories
    .map(category => ({
      ...category,
      symbols: category.symbols.filter(symbol => 
        symbol.name.toLowerCase().includes(query) || 
        symbol.sidc.toLowerCase().includes(query)
      )
    }))
    .filter(category => category.symbols.length > 0)
})

// تولید SVG برای پیش‌نمایش نماد
function getSymbolSVG(sidc: string): string {
  try {
    const symbol = new Symbol(sidc, {
      size: 40,
      colorMode: 'Dark',
    })
    return symbol.asSVG()
  } catch (error) {
    return '<svg width="40" height="40"><circle cx="20" cy="20" r="5" fill="red"/></svg>'
  }
}

// مدیریت drag start
function handleDragStart(event: DragEvent, symbol: { sidc: string; name: string }) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('text/plain', JSON.stringify(symbol))
  }
  selectedSymbol.value = symbol
}

// انتخاب نماد
function selectSymbol(symbol: { sidc: string; name: string; type?: string; maxPoints?: number }) {
  selectedSymbol.value = symbol
  
  // اگر نماد چندنقطه‌ای است، حالت رسم را فعال کن
  if (symbol.type === 'multipoint') {
    startDrawingMultiPoint(symbol)
  } else {
    // اگر نماد نقطه‌ای است، حالت رسم را غیرفعال کن
    stopDrawing()
  }
}

// شروع رسم نماد چندنقطه‌ای
function startDrawingMultiPoint(symbol: { sidc: string; maxPoints?: number; layout?: string }) {
  if (!map.value || !vectorSource.value) return
  
  stopDrawing() // ابتدا هر رسم قبلی را متوقف کن
  
  isDrawing.value = true
  
  // در ODINv2، همه نمادهای چندنقطه‌ای با یک Point شروع می‌شوند
  drawInteraction.value = new Draw({
    source: vectorSource.value,
    type: 'Point',
    stopClick: true,
  })
  
  map.value.addInteraction(drawInteraction.value)
  
  // وقتی رسم کامل شد
  drawInteraction.value.on('drawend', (e) => {
    const feature = e.feature
    const geometry = feature.getGeometry() as Point
    const center = geometry.getCoordinates()
    
    // تبدیل به MultiPoint بر اساس نوع نماد (مثل ODINv2)
    const resolution = map.value?.getView().getResolution() || 1
    const radius = resolution * 50 // شعاع پیش‌فرض (مثل ODINv2)
    
    let multiPointGeometry: MultiPoint
    
    if (symbol.maxPoints === 2) {
      // برای 2 نقطه (دایره): مرکز و یک نقطه در شعاع
      // در ODINv2: C = center, A = projectCoordinate(C)([0, radius])
      const C: [number, number] = [center[0], center[1]]
      const A: [number, number] = [center[0] + radius, center[1]] // زاویه 0
      multiPointGeometry = new MultiPoint([C, A])
    } else if (symbol.maxPoints === 3) {
      // برای 3 نقطه (fan): مرکز و دو نقطه در زاویه‌های 0 و PI/4
      // در ODINv2: C = center, A = projectCoordinate(C)([0, distance]), B = projectCoordinate(C)([PI_OVER_4, distance])
      const C: [number, number] = [center[0], center[1]]
      const A: [number, number] = [center[0] + radius, center[1]] // زاویه 0
      const B: [number, number] = [
        center[0] + radius * Math.cos(Math.PI / 4),
        center[1] + radius * Math.sin(Math.PI / 4)
      ] // زاویه PI/4
      multiPointGeometry = new MultiPoint([C, A, B])
    } else if (symbol.maxPoints === 4) {
      // برای 4 نقطه (G_G_OAS): در ODINv2 از [A, B, C, D] استفاده می‌شود
      // A و B نقاط اصلی خط، C و D نقاط اضافی برای فلش‌ها
      const A: [number, number] = [center[0] - radius, center[1]] // نقطه اول (چپ)
      const B: [number, number] = [center[0] + radius, center[1]] // نقطه دوم (راست)
      const C: [number, number] = [
        center[0] + radius,
        center[1] + radius * 0.5
      ] // نقطه سوم (فلش بالا)
      const D: [number, number] = [
        center[0] - radius,
        center[1] + radius * 0.5
      ] // نقطه چهارم (فلش بالا)
      multiPointGeometry = new MultiPoint([A, B, C, D])
    } else {
      // پیش‌فرض: 2 نقطه
      const C: [number, number] = [center[0], center[1]]
      const A: [number, number] = [center[0] + radius, center[1]]
      multiPointGeometry = new MultiPoint([C, A])
    }
    
    // حذف feature قبلی و ایجاد جدید با MultiPoint
    vectorSource.value.removeFeature(feature)
    
    const newFeature = new Feature({
      geometry: multiPointGeometry,
      sidc: symbol.sidc,
    })
    
    // استفاده از سیستم کامل ODINv2 برای استایل‌دهی
    // برای حالا از استایل ساده استفاده می‌کنیم، اما باید به سیستم کامل تبدیل شود
    newFeature.setStyle(createMultiPointStyleODIN(symbol.sidc, multiPointGeometry, resolution))
    vectorSource.value.addFeature(newFeature)
    
    featureCount.value = vectorSource.value.getFeatures().length
    
    // پس از رسم، حالت رسم را غیرفعال کن
    stopDrawing()
    selectedSymbol.value = null
  })
}

// متوقف کردن رسم
function stopDrawing() {
  if (drawInteraction.value && map.value) {
    map.value.removeInteraction(drawInteraction.value)
    drawInteraction.value = null
  }
  isDrawing.value = false
}

// ایجاد استایل برای نماد چندنقطه‌ای (مثل ODINv2)
function createMultiPointStyleODIN(sidc: string, geometry: MultiPoint, resolution: number): Style | Style[] {
  const coordinates = geometry.getCoordinates()
  const styles: Style[] = []
  
  // برای نمادهای دایره‌ای (2 نقطه) - استفاده از pointBuffer مثل ODINv2
  if (coordinates.length === 2) {
    const [C, A] = coordinates
    const radius = Math.sqrt(
      Math.pow(A[0] - C[0], 2) + 
      Math.pow(A[1] - C[1], 2)
    )
    
    // ایجاد دایره با استفاده از Circle geometry (مثل pointBuffer در ODINv2)
    const circleGeometry = new CircleGeometry(C, radius)
    
    // تعیین رنگ بر اساس نوع نماد
    const isFilled = sidc.includes('ACNC') || sidc.includes('AK') // No-Fire Area یا Kill Box
    const strokeColor = sidc.includes('ACNC') ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 0, 255, 0.8)'
    const fillColor = isFilled 
      ? (sidc.includes('ACNC') ? 'rgba(255, 0, 0, 0.2)' : 'rgba(128, 0, 128, 0.2)')
      : 'rgba(0, 0, 255, 0.1)'
    
    styles.push(new Style({
      geometry: circleGeometry,
      stroke: new Stroke({
        color: strokeColor,
        width: 2,
      }),
      fill: new Fill({ color: fillColor }),
    }))
    
    return styles
  }
  
  // برای نمادهای fan (3 نقطه)
  if (coordinates.length === 3) {
    const [C, A, B] = coordinates
    
    // رسم خطوط از مرکز به نقاط
    styles.push(new Style({
      geometry: new LineString([C, A]),
      stroke: new Stroke({
        color: 'rgba(0, 0, 255, 0.8)',
        width: 2,
      }),
    }))
    
    styles.push(new Style({
      geometry: new LineString([C, B]),
      stroke: new Stroke({
        color: 'rgba(0, 0, 255, 0.8)',
        width: 2,
      }),
    }))
    
    // رسم arc بین دو نقطه (برای fan)
    const segmentCA = Math.sqrt(Math.pow(A[0] - C[0], 2) + Math.pow(A[1] - C[1], 2))
    const segmentCB = Math.sqrt(Math.pow(B[0] - C[0], 2) + Math.pow(B[1] - C[1], 2))
    const angleA = Math.atan2(A[1] - C[1], A[0] - C[0])
    const angleB = Math.atan2(B[1] - C[1], B[0] - C[0])
    
    // ایجاد arc (تقریبی با چند نقطه)
    const arcPoints: [number, number][] = []
    const radius = Math.min(segmentCA, segmentCB)
    const deltaAngle = angleB - angleA
    const numPoints = 32
    
    for (let i = 0; i <= numPoints; i++) {
      const angle = angleA + (deltaAngle * i / numPoints)
      arcPoints.push([
        C[0] + radius * Math.cos(angle),
        C[1] + radius * Math.sin(angle)
      ])
    }
    
    styles.push(new Style({
      geometry: new LineString(arcPoints),
      stroke: new Stroke({
        color: 'rgba(0, 0, 255, 0.8)',
        width: 2,
      }),
    }))
    
    return styles
  }
  
  // برای نمادهای 4 نقطه (مثل G_G_OAS)
  if (coordinates.length === 4) {
    const [A, B, C, D] = coordinates
    
    // محاسبه زاویه و طول خط AB
    const angleAB = Math.atan2(B[1] - A[1], B[0] - A[0])
    const lengthAB = Math.sqrt(Math.pow(B[0] - A[0], 2) + Math.pow(B[1] - A[1], 2))
    
    // نقاط E و F (مثل ODINv2)
    const PI_OVER_4 = Math.PI / 4
    const E: [number, number] = [
      A[0] + (lengthAB / 4) * Math.cos(angleAB + 5 * PI_OVER_4),
      A[1] + (lengthAB / 4) * Math.sin(angleAB + 5 * PI_OVER_4)
    ]
    const F: [number, number] = [
      B[0] + (lengthAB / 4) * Math.cos(angleAB + 7 * PI_OVER_4),
      B[1] + (lengthAB / 4) * Math.sin(angleAB + 7 * PI_OVER_4)
    ]
    
    // رسم خطوط اصلی (مثل ODINv2)
    styles.push(new Style({
      geometry: new LineString([A, B]),
      stroke: new Stroke({
        color: 'rgba(0, 0, 255, 0.8)',
        width: 2,
      }),
    }))
    
    styles.push(new Style({
      geometry: new LineString([A, C]),
      stroke: new Stroke({
        color: 'rgba(0, 0, 255, 0.8)',
        width: 2,
      }),
    }))
    
    styles.push(new Style({
      geometry: new LineString([B, D]),
      stroke: new Stroke({
        color: 'rgba(0, 0, 255, 0.8)',
        width: 2,
      }),
    }))
    
    styles.push(new Style({
      geometry: new LineString([A, E]),
      stroke: new Stroke({
        color: 'rgba(0, 0, 255, 0.8)',
        width: 2,
      }),
    }))
    
    styles.push(new Style({
      geometry: new LineString([B, F]),
      stroke: new Stroke({
        color: 'rgba(0, 0, 255, 0.8)',
        width: 2,
      }),
    }))
    
    // فلش‌ها (تقریبی)
    const angleAC = Math.atan2(C[1] - A[1], C[0] - A[0])
    const angleBD = Math.atan2(D[1] - B[1], D[0] - B[0])
    const arrowSize = resolution * 8
    
    // فلش در C
    const arrowC1: [number, number] = [
      C[0] - arrowSize * Math.cos(angleAC - Math.PI / 6),
      C[1] - arrowSize * Math.sin(angleAC - Math.PI / 6)
    ]
    const arrowC2: [number, number] = [
      C[0] - arrowSize * Math.cos(angleAC + Math.PI / 6),
      C[1] - arrowSize * Math.sin(angleAC + Math.PI / 6)
    ]
    
    styles.push(new Style({
      geometry: new LineString([C, arrowC1]),
      stroke: new Stroke({
        color: 'rgba(0, 0, 255, 0.8)',
        width: 2,
      }),
    }))
    
    styles.push(new Style({
      geometry: new LineString([C, arrowC2]),
      stroke: new Stroke({
        color: 'rgba(0, 0, 255, 0.8)',
        width: 2,
      }),
    }))
    
    // فلش در D
    const arrowD1: [number, number] = [
      D[0] - arrowSize * Math.cos(angleBD - Math.PI / 6),
      D[1] - arrowSize * Math.sin(angleBD - Math.PI / 6)
    ]
    const arrowD2: [number, number] = [
      D[0] - arrowSize * Math.cos(angleBD + Math.PI / 6),
      D[1] - arrowSize * Math.sin(angleBD + Math.PI / 6)
    ]
    
    styles.push(new Style({
      geometry: new LineString([D, arrowD1]),
      stroke: new Stroke({
        color: 'rgba(0, 0, 255, 0.8)',
        width: 2,
      }),
    }))
    
    styles.push(new Style({
      geometry: new LineString([D, arrowD2]),
      stroke: new Stroke({
        color: 'rgba(0, 0, 255, 0.8)',
        width: 2,
      }),
    }))
    
    return styles
  }
  
  // پیش‌فرض: نمایش نقاط
  return coordinates.map(coord => new Style({
    geometry: new Point(coord),
    image: new Circle({
      radius: 5,
      fill: new Fill({ color: 'rgba(255, 0, 0, 0.8)' }),
      stroke: new Stroke({ color: '#fff', width: 2 }),
    }),
  }))
}

// اضافه کردن نماد به نقشه
function addSymbolToMap(sidc: string, coordinate: number[]) {
  if (!vectorSource.value) return

  const feature = new Feature({
    geometry: new Point(coordinate),
    sidc: sidc,
  })
  feature.setStyle(createPointSymbolStyle(sidc))
  vectorSource.value.addFeature(feature)
  featureCount.value = vectorSource.value.getFeatures().length
}

// ایجاد نقشه
onMounted(() => {
  if (!mapContainer.value) return

  vectorSource.value = new VectorSource()

  const vectorLayer = new VectorLayer({
    source: vectorSource.value,
  })

  map.value = new Map({
    target: mapContainer.value,
    layers: [
      new TileLayer({
        source: new OSM(),
      }),
      vectorLayer,
    ],
    view: new View({
      center: fromLonLat([51.3890, 35.6892]), // تهران
      zoom: 6,
    }),
  })

  // مدیریت drop روی نقشه
  const mapElement = mapContainer.value
  mapElement.addEventListener('dragover', (e) => {
    e.preventDefault()
    e.stopPropagation()
  })

  mapElement.addEventListener('drop', (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      const data = e.dataTransfer?.getData('text/plain')
      if (!data) return
      
      const symbol = JSON.parse(data)
      if (!symbol.sidc) return

      // تبدیل مختصات صفحه به مختصات نقشه
      const pixel = map.value?.getEventPixel(e)
      if (!pixel || !map.value) return
      
      const coordinate = map.value.getCoordinateFromPixel(pixel)
      if (coordinate) {
        addSymbolToMap(symbol.sidc, coordinate)
      }
    } catch (error) {
      console.error('Error adding symbol:', error)
    }
  })

  // مدیریت کلیک روی نقشه (اگر نمادی انتخاب شده باشد و چندنقطه‌ای نباشد)
  map.value.on('click', (e) => {
    if (selectedSymbol.value && selectedSymbol.value.type !== 'multipoint') {
      addSymbolToMap(selectedSymbol.value.sidc, e.coordinate)
      selectedSymbol.value = null // پس از اضافه کردن، انتخاب را پاک کن
    }
  })

  // به‌روزرسانی اطلاعات
  const view = map.value.getView()
  const updateInfo = () => {
    currentZoom.value = view.getZoom() || 0
    currentResolution.value = view.getResolution() || 0
    featureCount.value = vectorSource.value?.getFeatures().length || 0
  }

  view.on('change:resolution', updateInfo)
  updateInfo()
})

onUnmounted(() => {
  stopDrawing()
  map.value?.setTarget(undefined)
})

// استفاده از helper برای ایجاد استایل
function createPointSymbolStyle(sidc: string) {
  return createSymbolStyle(sidc, {
    size: 60,
    colorMode: 'Dark',
    scale: 0.5,
  })
}

// افزودن نمونه‌های مختلف
function addSampleFeatures() {
  if (!vectorSource.value || !map.value) return

  const center = map.value.getView().getCenter()
  if (!center) return

  const features: Feature[] = []

  // 1. نماد نقطه‌ای - واحد نظامی
  const point1 = new Feature({
    geometry: new Point(center),
    sidc: 'SFGPUCI----K---', // Friendly Unit
  })
  point1.setStyle(createPointSymbolStyle('SFGPUCI----K---'))
  features.push(point1)

  // 2. نماد نقطه‌ای - هدف خطی
  const point2 = new Feature({
    geometry: new Point([
      center[0] + 50000,
      center[1] + 50000,
    ]),
    sidc: 'G*F*LT----', // Linear Target
  })
  point2.setStyle(createPointSymbolStyle('G*F*LT----'))
  features.push(point2)

  // 3. نماد نقطه‌ای - واحد دشمن
  const point3 = new Feature({
    geometry: new Point([
      center[0] - 50000,
      center[1] + 50000,
    ]),
    sidc: 'SHGPUCI----K---', // Hostile Unit
  })
  point3.setStyle(createPointSymbolStyle('SHGPUCI----K---'))
  features.push(point3)

  // 4. نماد نقطه‌ای - واحد خنثی
  const point4 = new Feature({
    geometry: new Point([
      center[0],
      center[1] - 50000,
    ]),
    sidc: 'SUGPUCI----K---', // Unknown Unit
  })
  point4.setStyle(createPointSymbolStyle('SUGPUCI----K---'))
  features.push(point4)

  // 3. خط - جهت حمله
  const line1 = new Feature({
    geometry: new LineString([
      [center[0] - 100000, center[1] - 50000],
      [center[0] + 100000, center[1] + 50000],
    ]),
    sidc: 'G*T*A-----', // Follow and Assume
  })
  line1.setStyle(
    new Style({
      stroke: new Stroke({
        color: 'blue',
        width: 3,
      }),
    })
  )
  features.push(line1)

  // 4. چندضلعی - منطقه
  const polygon1 = new Feature({
    geometry: new Polygon([
      [
        [center[0] - 50000, center[1] - 50000],
        [center[0] + 50000, center[1] - 50000],
        [center[0] + 50000, center[1] + 50000],
        [center[0] - 50000, center[1] + 50000],
        [center[0] - 50000, center[1] - 50000],
      ],
    ]),
    sidc: 'G*M*SP----', // Strong Point
  })
  polygon1.setStyle(
    new Style({
      stroke: new Stroke({
        color: 'red',
        width: 2,
      }),
      fill: new Fill({
        color: 'rgba(255, 0, 0, 0.1)',
      }),
    })
  )
  features.push(polygon1)

  vectorSource.value.addFeatures(features)
  featureCount.value = vectorSource.value.getFeatures().length
}

// پاک کردن همه features
function clearFeatures() {
  if (!vectorSource.value) return
  vectorSource.value.clear()
  featureCount.value = 0
}

// Function to redirect to dashboard
function goToDashboard() {
  const parentOrigin = window.parent !== window 
    ? (document.referrer ? new URL(document.referrer).origin : window.location.origin)
    : window.location.origin;
  window.location.href = parentOrigin;
}
</script>

<style scoped>
.symbol-item {
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.symbol-preview {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.symbol-preview :deep(svg) {
  max-width: 100%;
  max-height: 100%;
}

/* استایل برای حالت drag */
.symbol-item:active {
  opacity: 0.6;
}

/* استایل برای نقشه در حالت drag over */
.map-drag-over {
  background-color: rgba(59, 130, 246, 0.1);
}
</style>

