<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <div class="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900 mb-4">نقشه‌کش آرایش نبرد</h1>
        <div class="text-red-600 mb-4">
          <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
          <p class="text-lg font-semibold">خطا در بارگذاری</p>
        </div>
        <p class="text-gray-600 mb-6">متأسفانه در بارگذاری اپلیکیشن خطایی رخ داده است.</p>
        <div class="flex flex-col space-y-3">
          <button 
            @click="reload" 
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            تلاش مجدد
          </button>
          <button
            type="button"
            @click="goBack"
            class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded inline-block"
          >
            بازگشت به مرحله قبل
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { goToPreviousStep } from "@/utils/navigation";

const router = useRouter();

function reload() {
  window.location.reload();
}

function goBack() {
  goToPreviousStep(router, "/");
}
</script>
