<template>
  <div class="drawing-canvas">
    <div 
      ref="canvasRef"
      @click="handleCanvasClick"
      class="canvas-stage h-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded relative overflow-hidden"
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
        
        <!-- Temporary line for drawing -->
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
          v-if="polylineSegments.length > 0"
          :d="generatePolylinePath()"
          fill="none"
          stroke="#10B981"
          stroke-width="2"
        />
      </svg>
    </div>
    
    <!-- Error message -->
    <div v-if="error" class="mt-2 text-sm text-red-600 dark:text-red-400">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue';
import type { Point, Line } from '../types';
import { findClosestPoint } from '../utils';

interface Props {
  points: Point[];
  lines: Line[];
  mode: 'point' | 'line' | 'polyline';
}

interface Emits {
  (e: 'update:points', points: Point[]): void;
  (e: 'update:lines', lines: Line[]): void;
  (e: 'error', message: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Refs
const canvasRef = ref<HTMLElement | null>(null);
const selectedPointId = ref<string | null>(null);
const polylineSegments = ref<Line[]>([]);
const tempLine = reactive({
  startX: null as number | null,
  startY: null as number | null,
  endX: null as number | null,
  endY: null as number | null
});
const error = ref<string | null>(null);

// Computed
const localPoints = computed({
  get: () => props.points,
  set: (value) => emit('update:points', value)
});

const localLines = computed({
  get: () => props.lines,
  set: (value) => emit('update:lines', value)
});

// Methods
const handleCanvasClick = (event: MouseEvent) => {
  try {
    if (!canvasRef.value) {
      throw new Error('Canvas element is not available');
    }
    
    const rect = canvasRef.value.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Validate coordinates
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      throw new Error('Click coordinates are outside the canvas bounds');
    }
    
    switch (props.mode) {
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
    
    // Clear any previous errors
    error.value = null;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An unknown error occurred';
    emit('error', error.value);
  }
};

const addPoint = (x: number, y: number) => {
  // Validate coordinates
  if (!canvasRef.value) {
    throw new Error('Canvas element is not available');
  }
  
  const rect = canvasRef.value.getBoundingClientRect();
  if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
    throw new Error('Point coordinates are outside the canvas bounds');
  }
  
  const newPoint: Point = {
    id: Date.now().toString(),
    x,
    y
  };
  localPoints.value = [...localPoints.value, newPoint];
};

const selectPoint = (id: string) => {
  // Validate point exists
  const point = localPoints.value.find(p => p.id === id);
  if (!point) {
    throw new Error('Point not found');
  }
  
  selectedPointId.value = id;
};

const handleLineModeClick = (x: number, y: number) => {
  try {
    // Find if clicked on existing point
    const clickedPoint = findClosestPoint(localPoints.value, x, y);
    
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
      localLines.value = [...localLines.value, newLine];
      
      // Reset temporary line
      tempLine.startX = null;
      tempLine.startY = null;
      tempLine.endX = null;
      tempLine.endY = null;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred while creating line';
    emit('error', error.value);
  }
};

const handlePolylineModeClick = (x: number, y: number) => {
  try {
    // Find if clicked on existing point
    const clickedPoint = findClosestPoint(localPoints.value, x, y);
    
    let pointToUse: Point;
    
    if (clickedPoint) {
      pointToUse = {
        id: Date.now().toString(),
        x: clickedPoint.x,
        y: clickedPoint.y
      };
    } else {
      // Create new point if didn't click on existing one
      pointToUse = {
        id: Date.now().toString(),
        x,
        y
      };
      localPoints.value = [...localPoints.value, pointToUse];
    }
    
    // If this is the first point in the polyline, just store it
    if (polylineSegments.value.length === 0) {
      // We need at least two points to create a line segment
      // For now, we'll just store the first point and wait for the second
      tempLine.startX = pointToUse.x;
      tempLine.startY = pointToUse.y;
      return;
    }
    
    // Create a line segment from the last point to this point
    const lastSegment = polylineSegments.value[polylineSegments.value.length - 1];
    const newLine: Line = {
      id: Date.now().toString(),
      startX: lastSegment.endX,
      startY: lastSegment.endY,
      endX: pointToUse.x,
      endY: pointToUse.y
    };
    
    polylineSegments.value = [...polylineSegments.value, newLine];
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred while creating polyline';
    emit('error', error.value);
  }
};

const generatePolylinePath = () => {
  try {
    if (polylineSegments.value.length === 0 && tempLine.startX !== null) {
      // If we only have one point (tempLine), draw a temporary line to cursor
      if (tempLine.endX !== null) {
        return `M ${tempLine.startX} ${tempLine.startY} L ${tempLine.endX} ${tempLine.endY}`;
      }
      return '';
    }
    
    if (polylineSegments.value.length === 0) return '';
    
    // Build path from segments
    const pathParts = ['M', polylineSegments.value[0].startX, polylineSegments.value[0].startY];
    
    for (const segment of polylineSegments.value) {
      pathParts.push('L', segment.endX, segment.endY);
    }
    
    // Add temporary line to current mouse position if available
    if (tempLine.endX !== null) {
      pathParts.push('L', tempLine.endX, tempLine.endY);
    }
    
    return pathParts.join(' ');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred while generating polyline path';
    emit('error', error.value);
    return '';
  }
};

// Mouse move handler for visual feedback during line drawing
const handleMouseMove = (event: MouseEvent) => {
  if (!canvasRef.value) return;
  
  const rect = canvasRef.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  if ((props.mode === 'line' && tempLine.startX !== null) || 
      (props.mode === 'polyline' && tempLine.startX !== null)) {
    tempLine.endX = x;
    tempLine.endY = y;
  }
};

// Watchers
watch(() => props.mode, (newMode) => {
  // Reset temporary line when changing modes
  tempLine.startX = null;
  tempLine.startY = null;
  tempLine.endX = null;
  tempLine.endY = null;
  
  // Clear polyline segments when switching away from polyline mode
  if (newMode !== 'polyline') {
    polylineSegments.value = [];
  }
});

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