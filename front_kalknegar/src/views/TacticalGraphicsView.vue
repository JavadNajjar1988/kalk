<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

// Canvas references
const canvasRef = ref<HTMLCanvasElement | null>(null);
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;

// Drawing state
const isDrawing = ref(false);
const lineColor = ref("#3b82f6"); // blue-500
const lineWidth = ref(3);
const points: {x: number, y: number}[] = [];
let currentPath: {x: number, y: number}[] = [];

// Initialize canvas
const initCanvas = () => {
  if (!canvasRef.value) return;
  
  canvas = canvasRef.value;
  ctx = canvas.getContext('2d');
  
  if (!ctx) return;
  
  // Set canvas size to match its display size
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  ctx.scale(dpr, dpr);
  
  // Set initial styles
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Clear and redraw
  redraw();
};

// Drawing functions
const startDrawing = (e: MouseEvent) => {
  if (!canvas || !ctx) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // Add point to current path
  currentPath.push({x, y});
  points.push({x, y});
  
  // Draw the point
  ctx.beginPath();
  ctx.arc(x, y, lineWidth.value/2, 0, Math.PI * 2);
  ctx.fillStyle = lineColor.value;
  ctx.fill();
  
  // If we have at least two points, draw a line
  if (currentPath.length > 1) {
    const prevPoint = currentPath[currentPath.length - 2];
    ctx.beginPath();
    ctx.strokeStyle = lineColor.value;
    ctx.lineWidth = lineWidth.value;
    ctx.moveTo(prevPoint.x, prevPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
};

const draw = (e: MouseEvent) => {
  // For point-to-point drawing, we don't need continuous drawing
  // This will be handled by startDrawing on each click
};

const stopDrawing = () => {
  // For point-to-point drawing, we don't need this
};

const clearCanvas = () => {
  if (!canvas || !ctx) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  points.length = 0;
  currentPath.length = 0;
};

const undo = () => {
  if (!canvas || !ctx) return;
  
  // Remove last point
  if (points.length > 0) {
    points.pop();
    
    // If we're removing the last point of current path, also remove from currentPath
    if (currentPath.length > 0) {
      currentPath.pop();
    }
    
    redraw();
  }
};

// New function to start a new line
const startNewLine = () => {
  currentPath = [];
};

const redraw = () => {
  if (!canvas || !ctx) return;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw all points and lines
  if (points.length > 0) {
    // Draw points
    points.forEach(point => {
      if (ctx) {  // Add null check for ctx
        ctx.beginPath();
        ctx.arc(point.x, point.y, lineWidth.value/2, 0, Math.PI * 2);
        ctx.fillStyle = lineColor.value;
        ctx.fill();
      }
    });
    
    // Draw lines (if we have a current path with multiple points)
    if (currentPath.length > 1 && ctx) {  // Add null check for ctx
      ctx.strokeStyle = lineColor.value;
      ctx.lineWidth = lineWidth.value;
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      
      ctx.stroke();
    }
  }
};

const goBack = () => {
  router.back();
};

// Lifecycle hooks
onMounted(() => {
  initCanvas();
  window.addEventListener('resize', initCanvas);
});

onUnmounted(() => {
  window.removeEventListener('resize', initCanvas);
});
</script>
<template>
  <div class="min-h-screen bg-teal-50/80 dark:bg-teal-950/50 flex flex-col">
    <!-- Header -->
    <header class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-blue-200/30 dark:border-blue-700/30 sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-bold text-blue-600 dark:text-blue-400">
              رسم خطوط تاکتیکال
            </h1>
          </div>
          <div class="flex items-center space-x-4">
            <button 
              @click="goBack"
              class="px-4 py-2 rounded-lg bg-blue-100/10 dark:bg-blue-400/2 backdrop-blur backdrop-saturate-150 supports-[backdrop-filter]:bg-blue-300/10 dark:supports-[backdrop-filter]:bg-blue-400/3 border border-blue-300/60 dark:border-blue-400/30 shadow-lg shadow-blue-500/5 hover:bg-blue-200/20 dark:hover:bg-blue-800/20 transition-all duration-200 flex items-center gap-2"
            >
              <svg class="h-4 w-4 text-blue-700 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span class="text-sm font-medium text-blue-700 dark:text-blue-300">بازگشت</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col">
      <!-- Toolbar -->
      <div class="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-4">
        <button 
          @click="clearCanvas"
          class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          پاک کردن
        </button>
        <button 
          @click="undo"
          class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          برگشت
        </button>
        <button 
          @click="startNewLine"
          class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          خط جدید
        </button>
        <div class="flex items-center gap-2">
          <label class="text-gray-700 dark:text-gray-300">رنگ:</label>
          <input v-model="lineColor" type="color" class="w-10 h-10 border-0 rounded cursor-pointer">
        </div>
        <div class="flex items-center gap-2">
          <label class="text-gray-700 dark:text-gray-300">ضخامت:</label>
          <input v-model="lineWidth" type="range" min="1" max="10" class="w-24">
          <span class="text-gray-700 dark:text-gray-300 w-6">{{ lineWidth }}</span>
        </div>
      </div>
      
      <!-- Canvas Area -->
      <div class="flex-1 relative overflow-hidden p-4">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg h-full overflow-hidden">
          <canvas 
            ref="canvasRef"
            class="absolute inset-0 w-full h-full cursor-crosshair"
            @click="startDrawing"
          ></canvas>
        </div>
      </div>
      
      <!-- Instructions -->
      <div class="p-4 bg-blue-50 dark:bg-blue-900/30 border-t border-blue-200 dark:border-blue-800">
        <div class="max-w-7xl mx-auto">
          <p class="text-center text-blue-700 dark:text-blue-300">
            برای رسم خط، روی صفحه کلیک کنید تا نقاط ایجاد شوند. برای شروع خط جدید، دکمه "خط جدید" را بزنید.
          </p>
        </div>
      </div>
    </main>
  </div>
</template>
