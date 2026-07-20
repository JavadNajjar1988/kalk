<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          {{ isEditing ? 'ویرایش نماد' : 'ایجاد نماد جدید' }}
        </h2>
        <button
          @click="$emit('close')"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Left Column: Form -->
          <div class="space-y-6">
            <!-- Basic Info -->
            <div class="space-y-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">اطلاعات پایه</h3>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نام نماد
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="نام نماد را وارد کنید"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  دسته‌بندی
                </label>
                <select
                  v-model="form.category"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">انتخاب دسته‌بندی</option>
                  <option v-for="category in categories" :key="category.id" :value="category.id">
                    {{ category.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  توضیحات
                </label>
                <textarea
                  v-model="form.description"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="توضیحات نماد را وارد کنید"
                ></textarea>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  فایل SVG
                </label>
                <div class="flex items-center space-x-4 space-x-reverse">
                  <input
                    ref="fileInput"
                    type="file"
                    accept=".svg"
                    @change="handleFileUpload"
                    class="hidden"
                  />
                  <button
                    @click="fileInput?.click()"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    انتخاب فایل SVG
                  </button>
                  <span v-if="form.svgPath" class="text-sm text-gray-600 dark:text-gray-400">
                    فایل انتخاب شده
                  </span>
                </div>
              </div>
            </div>

            <!-- Anchor Points -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">نقاط لنگر</h3>
                <button
                  @click="addAnchorPoint"
                  class="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                  افزودن نقطه
                </button>
              </div>
              
              <div v-for="(point, index) in form.anchorPoints" :key="point.id" class="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="font-medium text-gray-900 dark:text-white">نقطه {{ index + 1 }}</h4>
                  <button
                    @click="removeAnchorPoint(point.id)"
                    class="text-red-600 hover:text-red-800 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">نام</label>
                    <input
                      v-model="point.name"
                      type="text"
                      class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">نوع</label>
                    <select
                      v-model="point.type"
                      class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="start">شروع</option>
                      <option value="end">پایان</option>
                      <option value="control">کنترل</option>
                      <option value="reference">مرجع</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">X</label>
                    <input
                      v-model.number="point.x"
                      type="number"
                      step="0.1"
                      class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Y</label>
                    <input
                      v-model.number="point.y"
                      type="number"
                      step="0.1"
                      class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Preview and Drawing -->
          <div class="space-y-6">
            <!-- Preview Section -->
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">پیش‌نمایش</h3>
              <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                <div class="w-full h-64 bg-white dark:bg-gray-800 rounded border flex items-center justify-center">
                  <div v-if="form.svgPath" class="text-center">
                    <div class="w-32 h-32 mx-auto mb-4 bg-gray-100 dark:bg-gray-600 rounded flex items-center justify-center">
                      <svg class="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">پیش‌نمایش SVG</p>
                  </div>
                  <div v-else class="text-center text-gray-500 dark:text-gray-400">
                    <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p>فایل SVG را انتخاب کنید</p>
                  </div>
                </div>
              </div>
              
              <!-- Add note about polyline tool -->
              <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <p class="text-sm text-blue-800 dark:text-blue-200">
                  <strong>راهنمایی:</strong> برای ترسیم خطوط پلی‌لاین و تعیین نقاط، به بخش "سامانه تعریف نمادهای تاکتیکال" بروید و از ابزار ترسیم استفاده کنید.
                </p>
              </div>
            </div>

            <!-- Drawing Canvas Section -->
            <div>
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">ابزار ترسیم</h3>
                <div class="flex space-x-2 space-x-reverse">
                  <button
                    @click="setDrawingMode('point')"
                    :class="[
                      'px-3 py-1 text-sm rounded-lg',
                      drawingMode === 'point' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    ]"
                  >
                    نقطه
                  </button>
                  <button
                    @click="setDrawingMode('line')"
                    :class="[
                      'px-3 py-1 text-sm rounded-lg',
                      drawingMode === 'line' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    ]"
                  >
                    خط
                  </button>
                  <button
                    @click="setDrawingMode('polyline')"
                    :class="[
                      'px-3 py-1 text-sm rounded-lg',
                      drawingMode === 'polyline' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    ]"
                  >
                    پلی‌لاین
                  </button>
                  <button
                    @click="clearDrawing"
                    class="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                  >
                    پاک کردن
                  </button>
                </div>
              </div>
              
              <div 
                ref="drawingCanvas"
                @click="handleCanvasClick"
                @mousemove="handleMouseMove"
                class="w-full h-64 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 relative overflow-hidden cursor-crosshair"
              >
                <!-- Points -->
                <div
                  v-for="(point, index) in drawingPoints"
                  :key="point.id"
                  :class="[
                    'absolute w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer',
                    selectedPointId === point.id ? 'bg-red-500 ring-2 ring-red-300' : 'bg-blue-500'
                  ]"
                  :style="{ left: point.x + 'px', top: point.y + 'px' }"
                  @click.stop="selectPoint(point.id)"
                ></div>
                
                <!-- Lines -->
                <svg class="absolute top-0 left-0 w-full h-full pointer-events-none">
                  <!-- Existing lines -->
                  <line
                    v-for="line in drawingLines"
                    :key="line.id"
                    :x1="line.startX"
                    :y1="line.startY"
                    :x2="line.endX"
                    :y2="line.endY"
                    stroke="#4F46E5"
                    stroke-width="2"
                  />
                  
                  <!-- Temporary line for line/polyline drawing -->
                  <line
                    v-if="tempLine.startX !== null"
                    :x1="tempLine.startX ?? 0"
                    :y1="tempLine.startY ?? 0"
                    :x2="tempLine.endX ?? 0"
                    :y2="tempLine.endY ?? 0"
                    :stroke="drawingMode === 'line' ? '#6366F1' : '#10B981'"
                    stroke-width="2"
                    stroke-dasharray="5,5"
                  />
                  
                  <!-- Polyline path -->
                  <path
                    v-if="polylinePath"
                    :d="polylinePath"
                    fill="none"
                    stroke="#10B981"
                    stroke-width="2"
                  />
                </svg>
              </div>
              
              <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <p v-if="drawingMode === 'point'">حالت نقطه: برای ایجاد نقاط تکی روی صفحه کلیک کنید</p>
                <p v-else-if="drawingMode === 'line'">حالت خط: برای ترسیم خط بین دو نقطه، ابتدا یک نقطه و سپس نقطه دیگر را انتخاب کنید</p>
                <p v-else>حالت پلی‌لاین: برای ترسیم خطوط پیوسته روی صفحه کلیک کنید</p>
              </div>
              
              <!-- Action buttons for connecting points to anchor points -->
              <div class="mt-4 flex space-x-3 space-x-reverse">
                <button
                  @click="connectSelectedToAnchor"
                  :disabled="!selectedPointId || form.anchorPoints.length === 0"
                  class="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  اتصال نقطه انتخابی به لنگر
                </button>
                <button
                  @click="autoConnectPoints"
                  :disabled="drawingPoints.length === 0 || form.anchorPoints.length === 0"
                  class="px-3 py-1 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  اتصال خودکار نقاط
                </button>
              </div>
            </div>

            <!-- Point Logic -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">منطق نقاط</h3>
                <button
                  @click="addPointLogic"
                  class="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  افزودن منطق
                </button>
              </div>
              
              <div v-for="(logic, index) in form.pointLogic" :key="logic.id" class="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                <div class="flex items-center justify-between mb-2">
                  <h4 class="font-medium text-gray-900 dark:text-white">منطق {{ index + 1 }}</h4>
                  <button
                    @click="removePointLogic(logic.id)"
                    class="text-red-600 hover:text-red-800 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">نام</label>
                    <input
                      v-model="logic.name"
                      type="text"
                      class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">نوع</label>
                    <select
                      v-model="logic.type"
                      class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="required">اجباری</option>
                      <option value="optional">اختیاری</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end space-x-3 space-x-reverse p-6 border-t border-gray-200 dark:border-gray-700">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          انصراف
        </button>
        <button
          @click="handleSave"
          :disabled="!isFormValid"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ isEditing ? 'به‌روزرسانی' : 'ایجاد' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, reactive } from 'vue';

const fileInput = ref<HTMLInputElement | null>(null);
import { nanoid } from '@/utils';
import { useTacticalSymbolStore } from './stores';
import type { TacticalSymbolDefinition, AnchorPoint, PointLogic } from './types';

interface Props {
  symbol?: TacticalSymbolDefinition | null;
}

interface DrawingPoint {
  id: string;
  x: number;
  y: number;
}

interface DrawingLine {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  save: [symbol: TacticalSymbolDefinition];
}>();

const store = useTacticalSymbolStore();

// Form state
const form = ref<TacticalSymbolDefinition>({
  id: '',
  name: '',
  description: '',
  category: '',
  svgPath: '',
  anchorPoints: [],
  pointLogic: [],
  lineLogic: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Drawing state
const drawingMode = ref<'point' | 'line' | 'polyline'>('point');
const drawingPoints = ref<DrawingPoint[]>([]);
const drawingLines = ref<DrawingLine[]>([]);
const drawingCanvas = ref<HTMLElement | null>(null);
const polylinePath = ref<string>('');
const selectedPointId = ref<string | null>(null);
const tempLine = reactive({
  startX: null as number | null,
  startY: null as number | null,
  endX: null as number | null,
  endY: null as number | null
});

// Computed
const isEditing = computed(() => !!props.symbol);
const categories = computed(() => store.categories);
const isFormValid = computed(() => {
  return form.value.name.trim() !== '' && 
         form.value.category !== '' && 
         form.value.svgPath !== '' &&
         form.value.anchorPoints.length > 0;
});

// Methods
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    // In a real implementation, you would upload the file and get the path
    form.value.svgPath = file.name;
  }
};

const addAnchorPoint = () => {
  const newPoint: AnchorPoint = {
    id: nanoid(),
    name: `نقطه ${form.value.anchorPoints.length + 1}`,
    x: 0,
    y: 0,
    type: 'start',
  };
  form.value.anchorPoints.push(newPoint);
};

const removeAnchorPoint = (id: string) => {
  const index = form.value.anchorPoints.findIndex(p => p.id === id);
  if (index !== -1) {
    form.value.anchorPoints.splice(index, 1);
  }
};

const addPointLogic = () => {
  const newLogic: PointLogic = {
    id: nanoid(),
    name: `منطق ${form.value.pointLogic.length + 1}`,
    type: 'required',
    anchorPointId: form.value.anchorPoints[0]?.id || '',
  };
  form.value.pointLogic.push(newLogic);
};

const removePointLogic = (id: string) => {
  const index = form.value.pointLogic.findIndex(l => l.id === id);
  if (index !== -1) {
    form.value.pointLogic.splice(index, 1);
  }
};

const handleSave = () => {
  if (!isFormValid.value) return;
  
  const symbolData: TacticalSymbolDefinition = {
    ...form.value,
    id: isEditing.value ? form.value.id : nanoid(),
    updatedAt: new Date(),
  };
  
  emit('save', symbolData);
};

// Drawing methods
const setDrawingMode = (mode: 'point' | 'line' | 'polyline') => {
  drawingMode.value = mode;
  
  // Reset temporary line when changing modes
  tempLine.startX = null;
  tempLine.startY = null;
  tempLine.endX = null;
  tempLine.endY = null;
  
  // If switching away from polyline mode, clear polyline path
  if (mode !== 'polyline') {
    polylinePath.value = '';
  }
};

const handleCanvasClick = (event: MouseEvent) => {
  if (!drawingCanvas.value) return;
  
  const rect = drawingCanvas.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  switch (drawingMode.value) {
    case 'point':
      addDrawingPoint(x, y);
      break;
    case 'line':
      handleLineModeClick(x, y);
      break;
    case 'polyline':
      handlePolylineModeClick(x, y);
      break;
  }
};

const addDrawingPoint = (x: number, y: number) => {
  const newPoint: DrawingPoint = {
    id: nanoid(),
    x,
    y
  };
  drawingPoints.value.push(newPoint);
};

const selectPoint = (id: string) => {
  selectedPointId.value = id;
};

const handleLineModeClick = (x: number, y: number) => {
  // Find if clicked on existing point (within 10px radius)
  const clickedPoint = drawingPoints.value.find(
    point => Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)) < 10
  );
  
  if (!clickedPoint) {
    // If didn't click on existing point, create a new one
    addDrawingPoint(x, y);
    return;
  }
  
  if (tempLine.startX === null) {
    // First point selection
    tempLine.startX = clickedPoint.x;
    tempLine.startY = clickedPoint.y;
  } else {
    // Second point selection - create line
    const newLine: DrawingLine = {
      id: nanoid(),
      startX: tempLine.startX ?? clickedPoint.x,
      startY: tempLine.startY ?? clickedPoint.y,
      endX: clickedPoint.x,
      endY: clickedPoint.y
    };
    drawingLines.value.push(newLine);
    
    // Reset temporary line
    tempLine.startX = null;
    tempLine.startY = null;
    tempLine.endX = null;
    tempLine.endY = null;
  }
};

const handlePolylineModeClick = (x: number, y: number) => {
  // Find if clicked on existing point (within 10px radius)
  const clickedPoint = drawingPoints.value.find(
    point => Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)) < 10
  );
  
  let pointToUse: DrawingPoint;
  
  if (clickedPoint) {
    pointToUse = clickedPoint;
  } else {
    // Create new point if didn't click on existing one
    pointToUse = {
      id: nanoid(),
      x,
      y
    };
    drawingPoints.value.push(pointToUse);
  }
  
  // If this is the first point, just store it and set up the temp line
  if (drawingPoints.value.length === 1) {
    tempLine.startX = pointToUse.x;
    tempLine.startY = pointToUse.y;
    return;
  }
  
  // Update the polyline path
  updatePolylinePath();
  
  // Update temp line to start from the new point
  tempLine.startX = pointToUse.x;
  tempLine.startY = pointToUse.y;
};

const updatePolylinePath = () => {
  if (drawingPoints.value.length < 2) {
    polylinePath.value = '';
    return;
  }
  
  const pathParts = ['M', drawingPoints.value[0].x, drawingPoints.value[0].y];
  
  for (let i = 1; i < drawingPoints.value.length; i++) {
    pathParts.push('L', drawingPoints.value[i].x, drawingPoints.value[i].y);
  }
  
  polylinePath.value = pathParts.join(' ');
};

const handleMouseMove = (event: MouseEvent) => {
  if (!drawingCanvas.value) return;
  
  const rect = drawingCanvas.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  if ((drawingMode.value === 'line' && tempLine.startX !== null) || 
      (drawingMode.value === 'polyline' && tempLine.startX !== null)) {
    tempLine.endX = x;
    tempLine.endY = y;
  }
};

const clearDrawing = () => {
  drawingPoints.value = [];
  drawingLines.value = [];
  polylinePath.value = '';
  selectedPointId.value = null;
  tempLine.startX = null;
  tempLine.startY = null;
  tempLine.endX = null;
  tempLine.endY = null;
};

const connectSelectedToAnchor = () => {
  if (!selectedPointId.value || form.value.anchorPoints.length === 0) return;
  
  const selectedPoint = drawingPoints.value.find(p => p.id === selectedPointId.value);
  if (!selectedPoint) return;
  
  // For now, we'll connect to the first anchor point
  // In a more advanced implementation, we could show a selection dialog
  const anchorPoint = form.value.anchorPoints[0];
  
  // Update the anchor point coordinates to match the selected drawing point
  anchorPoint.x = selectedPoint.x;
  anchorPoint.y = selectedPoint.y;
};

const autoConnectPoints = () => {
  if (drawingPoints.value.length === 0 || form.value.anchorPoints.length === 0) return;
  
  // Connect drawing points to anchor points in order
  // This is a simple implementation - in a real app, you might want more sophisticated matching
  for (let i = 0; i < Math.min(drawingPoints.value.length, form.value.anchorPoints.length); i++) {
    form.value.anchorPoints[i].x = drawingPoints.value[i].x;
    form.value.anchorPoints[i].y = drawingPoints.value[i].y;
  }
};

// Initialize form
onMounted(() => {
  if (props.symbol) {
    form.value = { ...props.symbol };
  } else {
    form.value.id = nanoid();
  }
  
  // Add mouse move listener
  if (drawingCanvas.value) {
    drawingCanvas.value.addEventListener('mousemove', handleMouseMove);
  }
});

onUnmounted(() => {
  // Remove mouse move listener
  if (drawingCanvas.value) {
    drawingCanvas.value.removeEventListener('mousemove', handleMouseMove);
  }
});
</script>
