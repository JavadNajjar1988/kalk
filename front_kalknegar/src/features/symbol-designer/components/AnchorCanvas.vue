<template>
  <div class="tsd-anchor-canvas">
    <div class="tsd-toolbar flex items-center gap-2 mb-3">
      <button 
        @click="setMode('point')"
        :class="['tsd-btn px-3 py-1 rounded text-xs', mode === 'point' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700']"
      >
        نقطه
      </button>
      <button 
        @click="setMode('line')"
        :class="['tsd-btn px-3 py-1 rounded text-xs', mode === 'line' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700']"
      >
        خط
      </button>
      <button 
        @click="setMode('polyline')"
        :class="['tsd-btn px-3 py-1 rounded text-xs', mode === 'polyline' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700']"
      >
        پلی‌لاین
      </button>
      <button 
        @click="clearCanvas"
        class="tsd-btn px-3 py-1 rounded bg-slate-600 text-white text-xs"
      >
        پاک کردن
      </button>
    </div>
    <div 
      ref="canvasRef"
      @click="handleCanvasClick"
      class="tsd-stage h-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded relative overflow-hidden"
    >
      <!-- Points -->
      <div
        v-for="point in points"
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
          v-for="line in lines"
          :key="line.id"
          :x1="line.startX"
          :y1="line.startY"
          :x2="line.endX"
          :y2="line.endY"
          stroke="#4F46E5"
          stroke-width="2"
        />
        
        <!-- Temporary line for polyline drawing -->
        <line
          v-if="tempLine.startX !== null"
          :x1="tempLine.startX"
          :y1="tempLine.startY"
          :x2="tempLine.endX"
          :y2="tempLine.endY"
          stroke="#10B981"
          stroke-width="2"
          stroke-dasharray="5,5"
        />
      </svg>
      
      <!-- Polyline path -->
      <svg class="absolute top-0 left-0 w-full h-full pointer-events-none">
        <path
          v-if="polylinePoints.length > 1"
          :d="generatePolylinePath()"
          fill="none"
          stroke="#10B981"
          stroke-width="2"
        />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';

interface Point {
  id: string;
  x: number;
  y: number;
}

interface Line {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

// Refs
const canvasRef = ref<HTMLElement | null>(null);
const mode = ref<'point' | 'line' | 'polyline'>('point');
const points = ref<Point[]>([]);
const lines = ref<Line[]>([]);
const selectedPointId = ref<string | null>(null);
const polylinePoints = ref<Point[]>([]);
const tempLine = reactive({
  startX: null as number | null,
  startY: null as number | null,
  endX: null as number | null,
  endY: null as number | null
});

// Methods
const setMode = (newMode: 'point' | 'line' | 'polyline') => {
  mode.value = newMode;
  
  // Reset temporary line when changing modes
  tempLine.startX = null;
  tempLine.startY = null;
  tempLine.endX = null;
  tempLine.endY = null;
  
  // If switching away from polyline mode, clear polyline points
  if (newMode !== 'polyline') {
    polylinePoints.value = [];
  }
};

const handleCanvasClick = (event: MouseEvent) => {
  if (!canvasRef.value) return;
  
  const rect = canvasRef.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  switch (mode.value) {
    case 'point':
      addPoint(x, y);
      break;
    case 'line':
      handleLineModeClick(x, y);
      break;
    case 'polyline':
      handlePolylineModeClick(x, y);
      break;
  }
};

const addPoint = (x: number, y: number) => {
  const newPoint: Point = {
    id: Date.now().toString(),
    x,
    y
  };
  points.value.push(newPoint);
};

const selectPoint = (id: string) => {
  selectedPointId.value = id;
};

const handleLineModeClick = (x: number, y: number) => {
  // Find if clicked on existing point
  const clickedPoint = points.value.find(
    point => Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)) < 10
  );
  
  if (!clickedPoint) {
    // If didn't click on existing point, create a new one
    addPoint(x, y);
    return;
  }
  
  if (tempLine.startX === null) {
    // First point selection
    tempLine.startX = clickedPoint.x;
    tempLine.startY = clickedPoint.y;
  } else {
    // Second point selection - create line
    const newLine: Line = {
      id: Date.now().toString(),
      startX: tempLine.startX,
      startY: tempLine.startY,
      endX: clickedPoint.x,
      endY: clickedPoint.y
    };
    lines.value.push(newLine);
    
    // Reset temporary line
    tempLine.startX = null;
    tempLine.startY = null;
    tempLine.endX = null;
    tempLine.endY = null;
  }
};

const handlePolylineModeClick = (x: number, y: number) => {
  // Find if clicked on existing point
  const clickedPoint = points.value.find(
    point => Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)) < 10
  );
  
  let pointToUse: Point;
  
  if (clickedPoint) {
    pointToUse = clickedPoint;
  } else {
    // Create new point if didn't click on existing one
    pointToUse = {
      id: Date.now().toString(),
      x,
      y
    };
    points.value.push(pointToUse);
  }
  
  // Add point to polyline
  polylinePoints.value.push(pointToUse);
  
  // Create line segments between consecutive points
  updatePolylineLines();
};

const updatePolylineLines = () => {
  // Clear existing polyline lines (we'll identify them by having more than 2 segments in a future implementation)
  // For now, we'll just draw the path directly in SVG
  
  // Update temporary line for visual feedback
  if (polylinePoints.value.length > 0) {
    const lastPoint = polylinePoints.value[polylinePoints.value.length - 1];
    tempLine.startX = lastPoint.x;
    tempLine.startY = lastPoint.y;
  }
};

const generatePolylinePath = () => {
  if (polylinePoints.value.length < 2) return '';
  
  const pathParts = ['M', polylinePoints.value[0].x, polylinePoints.value[0].y];
  
  for (let i = 1; i < polylinePoints.value.length; i++) {
    pathParts.push('L', polylinePoints.value[i].x, polylinePoints.value[i].y);
  }
  
  return pathParts.join(' ');
};

const clearCanvas = () => {
  points.value = [];
  lines.value = [];
  polylinePoints.value = [];
  selectedPointId.value = null;
  
  tempLine.startX = null;
  tempLine.startY = null;
  tempLine.endX = null;
  tempLine.endY = null;
};

// Mouse move handler for visual feedback during line drawing
const handleMouseMove = (event: MouseEvent) => {
  if (!canvasRef.value) return;
  
  const rect = canvasRef.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  if ((mode.value === 'line' && tempLine.startX !== null) || 
      (mode.value === 'polyline' && polylinePoints.value.length > 0)) {
    tempLine.endX = x;
    tempLine.endY = y;
  }
};

// Lifecycle
onMounted(() => {
  if (canvasRef.value) {
    canvasRef.value.addEventListener('mousemove', handleMouseMove);
  }
});

onUnmounted(() => {
  if (canvasRef.value) {
    canvasRef.value.removeEventListener('mousemove', handleMouseMove);
  }
});
</script>

<style scoped>
.tsd-anchor-canvas {}
</style>