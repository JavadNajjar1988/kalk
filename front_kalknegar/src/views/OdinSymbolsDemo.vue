<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
    <!-- Header -->
    <header class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-md sticky top-0 z-50">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button 
              @click="$router.back()"
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                نمایش نمادهای تاکتیکی ODINv2
              </h1>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                سیستم کامل تولید و رسم نمادهای نظامی استاندارد MIL-STD-2525C
              </p>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <button
              @click="resetMap"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              بازنشانی نقشه
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="container mx-auto px-4 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Sidebar - Symbol Categories -->
        <div class="lg:col-span-1 space-y-4">
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
            <h2 class="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              دسته‌بندی نمادها
            </h2>
            
            <div class="space-y-2">
              <div
                v-for="category in symbolCategories"
                :key="category.id"
                class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80"
              >
                <button
                  type="button"
                  @click="toggleCategory(category.id)"
                  :class="[
                    'w-full text-right px-4 py-3 flex items-center justify-between gap-3 rounded-t-lg transition-all',
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-700 dark:text-gray-200'
                  ]"
                >
                  <div class="flex flex-col text-sm">
                    <span class="font-semibold">{{ category.title }}</span>
                    <span class="text-xs opacity-80">{{ category.description }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-xs font-medium">
                    <span class="opacity-80">({{ category.count }})</span>
                    <svg
                      class="w-4 h-4 transition-transform"
                      :class="{ 'rotate-180': expandedCategory === category.id }"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                <transition name="fade">
                  <div
                    v-if="expandedCategory === category.id"
                    class="px-3 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/60 rounded-b-lg"
                  >
                    <template v-if="category.id === 'point'">
                      <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        چند نماد نمونه نقطه‌ای را می‌توانید بکشید و روی نقشه رها کنید.
                      </p>
                      <div class="space-y-2">
                        <button
                          v-for="symbol in sampleSymbols.point"
                          :key="symbol.sidc"
                          class="w-full flex items-center justify-between gap-3 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 hover:border-blue-400 cursor-grab"
                          draggable="true"
                          @dragstart="handleSymbolDragStart($event, symbol)"
                          @dragend="handleSymbolDragEnd"
                        >
                          <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                              <NewMilitarySymbol
                                :sidc="symbol.sidc"
                                :size="26"
                                :title="symbol.name"
                                :options="{ monoColor: '#1f2937', strokeWidth: 10 }"
                              />
                            </div>
                            <div class="text-right">
                              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ symbol.name }}</p>
                              <p class="text-[11px] font-mono text-gray-500 dark:text-gray-400">{{ symbol.sidc }}</p>
                            </div>
                          </div>
                          <span class="text-[11px] font-semibold text-blue-600 dark:text-blue-400">درگ کنید</span>
                        </button>
                      </div>
                    </template>
                    <template v-else>
                      <div class="text-xs text-gray-500 dark:text-gray-400 py-1">
                        به‌زودی نمادهای نمونه این دسته اضافه می‌شود.
                      </div>
                    </template>
                  </div>
                </transition>
              </div>
            </div>
          </div>

          <!-- Statistics -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
            <h3 class="text-sm font-bold mb-3 text-gray-900 dark:text-white">
              آمار
            </h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">نمادهای روی نقشه:</span>
                <span class="font-bold text-blue-600">{{ featuresOnMap }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">نقطه‌ای:</span>
                <span class="font-bold">{{ pointCount }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">خطی:</span>
                <span class="font-bold">{{ lineCount }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">چندوجهی:</span>
                <span class="font-bold">{{ polygonCount }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">چندنقطه‌ای:</span>
                <span class="font-bold">{{ multipointCount }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Map Area -->
        <div class="lg:col-span-3">
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <!-- Map Controls -->
            <div class="bg-gray-50 dark:bg-gray-700 p-4 border-b border-gray-200 dark:border-gray-600">
              <div class="flex items-center justify-between flex-wrap gap-4">
                <div class="flex items-center gap-2">
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    نمایش:
                  </label>
                  <button
                    v-for="view in viewModes"
                    :key="view.id"
                    @click="selectedView = view.id"
                    :class="[
                      'px-3 py-1 text-sm rounded-md transition-colors',
                      selectedView === view.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500'
                    ]"
                  >
                    {{ view.label }}
                  </button>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    @click="toggleLabels"
                    :class="[
                      'px-3 py-2 text-sm rounded-md transition-colors',
                      showLabels
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    ]"
                  >
                    برچسب‌ها
                  </button>
                  <button
                    @click="clearMap"
                    class="px-3 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    پاک کردن همه
                  </button>
                </div>
              </div>
            </div>

            <!-- Map Container -->
            <div
              ref="mapContainer"
              class="w-full h-[600px] relative"
              @dragover.prevent="handleMapDragOver"
              @dragleave="handleMapDragLeave"
              @drop.prevent="handleMapDrop"
            >
              <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
                <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-xl">
                  <div class="flex items-center gap-3">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span class="text-gray-700 dark:text-gray-300">در حال بارگذاری...</span>
                  </div>
                </div>
              </div>
              <div
                v-if="isMapDragActive"
                class="absolute inset-0 bg-blue-500/10 border-4 border-dashed border-blue-400 flex items-center justify-center text-blue-700 dark:text-blue-200 text-sm font-semibold pointer-events-none z-10"
              >
                رها کنید تا نماد روی نقشه قرار بگیرد
              </div>
            </div>

            <!-- Info Panel -->
            <div class="bg-gray-50 dark:bg-gray-700 p-4 border-t border-gray-200 dark:border-gray-600">
              <div class="text-sm text-gray-600 dark:text-gray-400">
                <p>
                  <strong>راهنما:</strong>
                  روی دسته‌بندی‌ها کلیک کنید تا نمادهای مربوطه روی نقشه نمایش داده شوند.
                  از اسکرول برای زوم و کشیدن برای جابجایی نقشه استفاده کنید.
                </p>
              </div>
            </div>
          </div>

          <!-- Symbol Details Panel -->
          <div v-if="selectedFeature" class="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 class="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              جزئیات نماد انتخاب‌شده
            </h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-600 dark:text-gray-400">نوع:</span>
                <span class="font-bold mr-2">{{ selectedFeature.type }}</span>
              </div>
              <div>
                <span class="text-gray-600 dark:text-gray-400">SIDC:</span>
                <span class="font-mono font-bold mr-2">{{ selectedFeature.sidc }}</span>
              </div>
              <div class="col-span-2">
                <span class="text-gray-600 dark:text-gray-400">توضیحات:</span>
                <p class="mt-1 text-gray-900 dark:text-white">{{ selectedFeature.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Feature } from 'ol'
import { Point, LineString, Polygon, MultiPoint } from 'ol/geom'
import { fromLonLat } from 'ol/proj'
import { defaults as defaultControls } from 'ol/control'
import Signal from '@syncpoint/signal'
import { createOdinStyleFunction } from '@/geo/odinStyles'
import NewMilitarySymbol from '@/components/NewMilitarySymbol.vue'

const mapContainer = ref<HTMLElement>()
const map = ref<Map>()
const vectorSource = ref<VectorSource>()
const loading = ref(true)
const selectedCategory = ref<string>('point')
const expandedCategory = ref<string | null>('point')
const selectedView = ref<string>('all')
const showLabels = ref(true)
const selectedFeature = ref<any>(null)
const draggedSymbol = ref<{ sidc: string; name: string } | null>(null)
const isMapDragActive = ref(false)

// Symbol Categories
const symbolCategories = ref([
  {
    id: 'point',
    title: 'نمادهای نقطه‌ای',
    count: 15,
    description: 'نمادهای تک نقطه‌ای نظامی'
  },
  {
    id: 'line',
    title: 'نمادهای خطی',
    count: 20,
    description: 'خطوط، مسیرها و مرزها'
  },
  {
    id: 'polygon',
    title: 'نمادهای چندوجهی',
    count: 12,
    description: 'مناطق، محدوده‌ها و نواحی'
  },
  {
    id: 'multipoint',
    title: 'نمادهای چندنقطه‌ای',
    count: 8,
    description: 'دایره‌ها، کمان‌ها و بادبزن‌ها'
  }
])

const viewModes = [
  { id: 'all', label: 'همه' },
  { id: 'friendly', label: 'دوست' },
  { id: 'hostile', label: 'دشمن' },
  { id: 'neutral', label: 'خنثی' }
]

// Statistics
const featuresOnMap = computed(() => vectorSource.value?.getFeatures().length || 0)
const pointCount = computed(() => 
  vectorSource.value?.getFeatures().filter(f => f.getGeometry()?.getType() === 'Point').length || 0
)
const lineCount = computed(() => 
  vectorSource.value?.getFeatures().filter(f => f.getGeometry()?.getType() === 'LineString').length || 0
)
const polygonCount = computed(() => 
  vectorSource.value?.getFeatures().filter(f => f.getGeometry()?.getType() === 'Polygon').length || 0
)
const multipointCount = computed(() => 
  vectorSource.value?.getFeatures().filter(f => f.getGeometry()?.getType() === 'MultiPoint').length || 0
)

// Sample Symbols Data
const sampleSymbols = {
  point: [
    { sidc: 'SFGPUCIZ--MT---', name: 'Infantry', coords: [51.5, 35.7] },
    { sidc: 'SFGPUCAA--MT---', name: 'Armor', coords: [51.6, 35.7] },
    { sidc: 'SFGPUCF---MT---', name: 'Field Artillery', coords: [51.7, 35.7] },
    { sidc: 'SFGPUCA---MT---', name: 'Aviation', coords: [51.5, 35.6] },
    { sidc: 'SFGPUCI---MT---', name: 'Engineer', coords: [51.6, 35.6] }
  ],
  line: [
    { 
      sidc: 'G*G*GLC---****X',
      name: 'Line of Contact',
      coords: [[51.4, 35.8], [51.5, 35.85], [51.6, 35.8], [51.7, 35.85]]
    },
    {
      sidc: 'G*G*GLF---****X',
      name: 'Forward Line',
      coords: [[51.4, 35.75], [51.5, 35.8], [51.6, 35.75], [51.7, 35.8]]
    },
    {
      sidc: 'G*T*A-----****X',
      name: 'Follow and Assume',
      coords: [[51.45, 35.65], [51.55, 35.7]]
    }
  ],
  polygon: [
    {
      sidc: 'G*G*SAE---****X',
      name: 'Encirclement',
      coords: [[[51.4, 35.5], [51.5, 35.5], [51.5, 35.55], [51.4, 35.55], [51.4, 35.5]]]
    },
    {
      sidc: 'G*M*SP----****X',
      name: 'Strong Point',
      coords: [[[51.6, 35.5], [51.7, 35.5], [51.7, 35.55], [51.6, 35.55], [51.6, 35.5]]]
    }
  ],
  multipoint: [
    {
      sidc: 'G*T*E-----****X',
      name: 'Isolate',
      coords: [[51.5, 35.45], [51.55, 35.45]]
    }
  ]
}

onMounted(() => {
  initMap()
  setTimeout(() => {
    loading.value = false
  }, 1000)
})

onUnmounted(() => {
  if (map.value) {
    map.value.setTarget(undefined)
  }
})

function initMap() {
  vectorSource.value = new VectorSource()

  // ایجاد ODIN style function با resolution reactive
  const centerResolution = Signal.of(1)
  const odinStyleFunction = createOdinStyleFunction({
    centerResolution,
    globalStyle: {},
    layerStyle: {}
  })

  const vectorLayer = new VectorLayer({
    source: vectorSource.value,
    style: odinStyleFunction // استفاده از ODIN styles
  })

  map.value = new Map({
    target: mapContainer.value!,
    layers: [
      new TileLayer({
        source: new OSM()
      }),
      vectorLayer
    ],
    view: new View({
      center: fromLonLat([51.5, 35.7]),
      zoom: 11
    }),
    controls: defaultControls({
      attributionOptions: {
        collapsible: false
      }
    })
  })

  // به‌روزرسانی resolution با تغییر zoom
  map.value.getView().on('change:resolution', () => {
    const resolution = map.value!.getView().getResolution() || 1
    centerResolution(resolution)
  })

  // Add initial symbols
  loadSymbols('point')
}

function loadSymbols(category: string) {
  if (!vectorSource.value) return

  // Clear existing features
  vectorSource.value.clear()

  const symbols = sampleSymbols[category as keyof typeof sampleSymbols]
  if (!symbols) return

  symbols.forEach((symbolData: any) => {
    let geometry
    
    if (category === 'point') {
      geometry = new Point(fromLonLat(symbolData.coords))
    } else if (category === 'line') {
      geometry = new LineString(symbolData.coords.map((c: number[]) => fromLonLat(c)))
    } else if (category === 'polygon') {
      geometry = new Polygon([symbolData.coords[0].map((c: number[]) => fromLonLat(c))])
    } else if (category === 'multipoint') {
      geometry = new MultiPoint(symbolData.coords.map((c: number[]) => fromLonLat(c)))
    }

    const feature = new Feature({
      geometry,
      sidc: symbolData.sidc,
      name: symbolData.name
    })

    // ODIN style به طور خودکار از طریق vectorLayer.style اعمال می‌شود
    vectorSource.value?.addFeature(feature)
  })

  // Fit view to features
  const extent = vectorSource.value.getExtent()
  map.value?.getView().fit(extent, {
    padding: [50, 50, 50, 50],
    duration: 1000
  })
}

watch(selectedCategory, (newCategory) => {
  loadSymbols(newCategory)
})

function resetMap() {
  map.value?.getView().animate({
    center: fromLonLat([51.5, 35.7]),
    zoom: 11,
    duration: 1000
  })
}

function clearMap() {
  vectorSource.value?.clear()
}

function toggleLabels() {
  showLabels.value = !showLabels.value
  // TODO: Implement label toggle
}

function toggleCategory(categoryId: string) {
  if (selectedCategory.value !== categoryId) {
    selectedCategory.value = categoryId
  }
  expandedCategory.value = expandedCategory.value === categoryId ? null : categoryId
}

function handleSymbolDragStart(event: DragEvent, symbol: { sidc: string; name: string }) {
  draggedSymbol.value = symbol
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', symbol.sidc)
    event.dataTransfer.effectAllowed = 'copy'
    const target = event.currentTarget as HTMLElement | null
    if (target) {
      event.dataTransfer.setDragImage(target, target.clientWidth / 2, target.clientHeight / 2)
    }
  }
}

function handleSymbolDragEnd() {
  draggedSymbol.value = null
  isMapDragActive.value = false
}

function handleMapDragOver(event: DragEvent) {
  if (!draggedSymbol.value) return
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
  isMapDragActive.value = true
}

function handleMapDragLeave() {
  isMapDragActive.value = false
}

function handleMapDrop(event: DragEvent) {
  event.preventDefault()
  if (!draggedSymbol.value || !map.value || !vectorSource.value) {
    isMapDragActive.value = false
    return
  }
  const coordinate = map.value.getEventCoordinate(event)
  if (!coordinate) {
    isMapDragActive.value = false
    return
  }
  const feature = new Feature({
    geometry: new Point(coordinate),
    sidc: draggedSymbol.value.sidc,
    name: draggedSymbol.value.name
  })
  vectorSource.value.addFeature(feature)
  draggedSymbol.value = null
  isMapDragActive.value = false
}
</script>

<style scoped>
.map-container {
  position: relative;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

