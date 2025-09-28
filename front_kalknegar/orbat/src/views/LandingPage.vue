<template>
  <div class="min-h-screen flex flex-col">
    <!-- Modern Header Section -->
    <header class="relative bg-blue-100 dark:bg-slate-800">
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-5">
        <div class="absolute inset-0" style="background-image: radial-gradient(circle at 30% 20%, rgba(147, 197, 253, 0.1) 0%, transparent 50%);" />
        <div class="absolute inset-0" style="background-image: radial-gradient(circle at 80% 80%, rgba(196, 181, 253, 0.1) 0%, transparent 50%);" />
      </div>
      
      

      <!-- Hero Section -->
      <section class="relative z-10 px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div class="max-w-7xl mx-auto text-center">
          <div class="mb-8">
            <h1 class="text-4xl sm:text-6xl md:text-7xl font-bold text-slate-800 dark:text-slate-100 mb-6 leading-tight">
              <span class="text-red-500">
                کالک نگار
              </span>
            </h1>
            <p class="text-xl sm:text-2xl text-slate-700 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              ابزار پیشرفته مدیریت و بازسازی نبردهای تاریخی، طراحی سناریوهای نظامی و ایجاد آرایش نیروها
            </p>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              class="bg-red-400 hover:bg-red-500 text-white px-8 py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              @click="navigateToScenarios"
            >
              شروع کار با سناریوها
            </Button>
            <Button
              class="bg-slate-800 hover:bg-slate-900 text-white px-8 py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              @click="showImport = true"
            >
              وارد کردن نقشه/داده
            </Button>
           
          </div>

          <!-- Stats Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div class="bg-purple-100 dark:bg-purple-900/30 rounded-2xl p-6 border border-purple-200 dark:border-purple-700">
              <div class="text-3xl font-bold text-purple-800 dark:text-purple-300 mb-2">۳</div>
              <div class="text-purple-700 dark:text-purple-400">سناریوی آماده</div>
            </div>
            <div class="bg-green-100 dark:bg-green-900/30 rounded-2xl p-6 border border-green-200 dark:border-green-700">
              <div class="text-3xl font-bold text-green-800 dark:text-green-300 mb-2">۲۴۵</div>
              <div class="text-green-700 dark:text-green-400">واحد نظامی</div>
            </div>
           
          </div>
        </div>
      </section>
    </header>

    <!-- Main Content -->
    <main class="flex-1 bg-gray-50 dark:bg-slate-900">
      <!-- Scenarios Section -->
      <section id="scenarios" class="py-16">
        <LandingPageScenarios />
      </section>

      

      

     

    </main>
    <ImportModal v-model="showImport" />
  </div>
</template>

<script setup lang="ts">
import ProseSection from "../components/ProseSection.vue";
import LandingPageScenarios from "./LandingPageScenarios.vue";
import { IconGithub as GithubIcon } from "@iconify-prerendered/vue-mdi";
import { ORBAT_CHART_ROUTE } from "@/router/names";
import { CheckIcon } from "@heroicons/vue/24/outline";
import { Button } from "@/components/ui/button";
import { useRouter } from "vue-router";
import { ref } from "vue";
import ImportModal from "@/components/ImportModal.vue";

const router = useRouter();

// Navigation functions
const navigateToScenarios = () => {
  const scenariosElement = document.getElementById('scenarios');
  if (scenariosElement) {
    scenariosElement.scrollIntoView({ behavior: 'smooth' });
  }
};

const scrollToFeatures = () => {
  const featuresElement = document.getElementById('features');
  if (featuresElement) {
    featuresElement.scrollIntoView({ behavior: 'smooth' });
  }
};

const showImport = ref(false);

const features = [
  {
    name: "ایجاد آرایش نبرد",
    description: "به سرعت آرایش نبرد بسازید و واحدهای نظامی را مدیریت کنید.",
  },
  {
    name: "ترسیم ویژگی‌ها",
    description: "ویژگی‌های نقشه را ترسیم کنید و جزئیات جغرافیایی اضافه کنید.",
  },
  {
    name: "فقط سمت کلاینت",
    description: "همه چیز روی کامپیوتر شما ذخیره می‌شود و امنیت کامل دارید.",
  },
  {
    name: "حالت ویرایش شبکه‌ای",
    description: "ویرایش کارآمد با رابط کاربری قدرتمند و انعطاف‌پذیر.",
  },
  {
    name: "خروجی به KML/KMZ",
    description: "سناریوی خود را در گوگل ارث سه‌بعدی مشاهده کنید.",
  },
  {
    name: "خروجی به عنوان GeoJSON",
    description: "داده‌های جغرافیایی را به فرمت استاندارد صادر کنید.",
  },
  {
    name: "ورودی MilX",
    description: "نقشه‌های نظامی را از map.army و سایر منابع وارد کنید.",
  },
  {
    name: "ورودی GeoJSON",
    description: "فایل‌های GeoJSON و سایر فرمت‌های مکانی را وارد کنید.",
  },
];
</script>