<template>
  <div class="tsd-page min-h-screen bg-gray-50 dark:bg-gray-900">
    <header class="tsd-header bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <h1 class="tsd-title text-2xl font-bold text-gray-900 dark:text-white">سامانه تعریف نمادهای تاکتیکال</h1>
        <button type="button" class="tsd-back text-sm text-blue-600 dark:text-blue-300 hover:underline" @click="goBack">بازگشت</button>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid gap-6 lg:grid-cols-3">
      <section class="tsd-left lg:col-span-2 space-y-6">
        <div class="tsd-canvas bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h2 class="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">ابزار ترسیم نقاط و خطوط</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            برای ترسیم نقاط و خطوط، از دکمه‌های زیر استفاده کنید:
            <br>• حالت "نقطه": برای ایجاد نقاط تکی
            <br>• حالت "خط": برای اتصال دو نقطه با یک خط
            <br>• حالت "پلی‌لاین": برای ترسیم خطوط پیوسته با کلیک روی نقاط
          </p>
          <AnchorCanvas />
        </div>

        <div class="tsd-rules bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <SegmentRulesForm />
        </div>
      </section>

      <aside class="tsd-sidebar space-y-6">
        <div class="tsd-svg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <SvgPicker />
        </div>
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import AnchorCanvas from "../components/AnchorCanvas.vue";
import SvgPicker from "../components/SvgPicker.vue";
import SegmentRulesForm from "../components/SegmentRulesForm.vue";
import { useRouter } from "vue-router";
import { goToPreviousStep } from "@/utils/navigation";

const router = useRouter();
const goBack = () => goToPreviousStep(router, "/");
</script>

<style scoped>
.tsd-page {}
.tsd-header {}
.tsd-title {}
</style>
