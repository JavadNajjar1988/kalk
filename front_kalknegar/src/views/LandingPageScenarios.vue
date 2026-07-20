<template>
  <div class="relative bg-green-50 dark:bg-slate-900 py-16">
    <!-- Background Pattern -->
    <div class="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
      <div class="absolute inset-0" style="background-image: radial-gradient(circle at 25% 25%, rgba(34, 197, 94, 0.1) 0%, transparent 50%);" />
      <div class="absolute inset-0" style="background-image: radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.08) 0%, transparent 50%);" />
    </div>
    
    <div class="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="text-center mb-16">
        <div class="flex items-center justify-center mb-6">
          <div class="w-16 h-16 bg-indigo-200 dark:bg-indigo-800 rounded-2xl flex items-center justify-center shadow-lg">
            <svg class="w-8 h-8 text-indigo-700 dark:text-indigo-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
            </svg>
          </div>
        </div>
        <h2 class="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          <span class="text-indigo-600">
            مدیریت سناریوها
          </span>
        </h2>
        <p class="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
          سناریوهای آماده و قابلیت ایجاد سناریوهای سفارشی برای شبیه‌سازی عملیات نظامی مختلف
        </p>
      </div>

      <!-- Work in Progress Badge -->
      <div class="absolute top-4 left-4 z-20">
        <WipBadge />
      </div>
      <!-- User Scenarios Section -->
      <section v-if="storedScenarios.length > 0" class="mb-16">
        <div class="bg-purple-50 dark:bg-slate-800/50 rounded-3xl p-8 shadow-lg border border-purple-200 dark:border-slate-700">
          <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                سناریوهای اخیر
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                سناریوهای ایجاد شده توسط شما
              </p>
            </div>
            <div class="flex items-center gap-3 mt-4 sm:mt-0">
              <SortDropdown :options="sortOptions" />
            </div>
          </header>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <ScenarioLinkCard
              v-for="info in storedScenarios"
              :key="info.id"
              :data="info"
              @action="onAction($event, info)"
            />
          </div>
        </div>
      </section>
    
      <!-- Demo Scenarios Section -->
      <section class="bg-blue-50 dark:bg-slate-800/50 rounded-3xl p-8 shadow-lg border border-blue-200 dark:border-slate-700">
        <div class="text-center mb-8">
          <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            سناریوهای نمونه
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            سناریوهای آماده برای شروع سریع
          </p>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <!-- Demo Scenario Cards -->
          <div
            v-for="scenario in DEMO_SCENARIOS"
            :key="scenario.name"
            class="group relative bg-white dark:bg-slate-700 rounded-2xl overflow-hidden border border-teal-200 dark:border-slate-600 hover:border-teal-300 dark:hover:border-teal-500 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <router-link
              :to="getScenarioTo(scenario.id)"
              class="block h-full"
              draggable="false"
            >
              <div class="relative h-48 overflow-hidden">
                <img
                  class="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  :src="scenario.imageUrl"
                  :alt="scenario.name"
                  draggable="false"
                />
                <div class="absolute inset-0 bg-black/40" />
                <div class="absolute bottom-3 left-3 right-3">
                  <h4 class="text-white font-semibold text-lg leading-tight line-clamp-2">
                    {{ scenario.name }}
                  </h4>
                </div>
              </div>
              <div class="p-5">
                <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-3">
                  {{ scenario.summary }}
                </p>
                <div class="mt-4 flex items-center justify-between">
                  <span class="text-xs font-medium text-teal-700 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/30 px-2 py-1 rounded-full">
                    آماده
                  </span>
                  <svg class="w-5 h-5 text-gray-400 group-hover:text-teal-500 transition-colors duration-200" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
            </router-link>
          </div>

          <!-- Load Scenario Card -->
          <div class="group bg-green-50 dark:bg-emerald-900/20 rounded-2xl border border-green-200 dark:border-emerald-700 hover:border-green-400 dark:hover:border-emerald-500 transition-all duration-300 min-h-[320px]">
            <div class="p-6 h-full flex flex-col">
              <div class="w-12 h-12 bg-green-200 dark:bg-green-800 rounded-xl flex items-center justify-center mb-4">
                <svg class="w-6 h-6 text-green-700 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                بارگذاری فایل
              </h4>
              <div class="flex-1">
                <LoadScenarioPanel @loaded="loadScenario" />
              </div>
            </div>
          </div>

          <!-- Load from URL Card -->
          <div class="group bg-violet-50 dark:bg-violet-900/20 rounded-2xl border border-violet-200 dark:border-violet-700 hover:border-violet-400 dark:hover:border-violet-500 transition-all duration-300 min-h-[320px]">
            <div class="p-6 h-full flex flex-col">
              <div class="w-12 h-12 bg-violet-200 dark:bg-violet-800 rounded-xl flex items-center justify-center mb-4">
                <svg class="w-6 h-6 text-violet-700 dark:text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                بارگذاری از لینک
              </h4>
              <div class="flex-1">
                <LoadScenarioFromUrlPanel @loaded="loadScenario" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

import WipBadge from "../components/WipBadge.vue";
import { MAP_EDIT_MODE_ROUTE } from "@/router/names";
import LoadScenarioPanel from "@/modules/scenarioeditor/LoadScenarioPanel.vue";
import LoadScenarioFromUrlPanel from "@/modules/scenarioeditor/LoadScenarioFromUrlPanel.vue";
import ScenarioLinkCard from "@/components/ScenarioLinkCard.vue";
import SortDropdown from "@/components/SortDropdown.vue";
import { DEMO_SCENARIOS, useBrowserScenarios } from "@/composables/browserScenarios";
import { Button } from "@/components/ui/button";

const { storedScenarios, sortOptions, onAction, loadScenario } = useBrowserScenarios();

const router = useRouter();
const getScenarioTo = (scenarioId: string) => {
  return {
    name: MAP_EDIT_MODE_ROUTE,
    params: { scenarioId: `demo-${scenarioId}` },
  };
};
</script>
