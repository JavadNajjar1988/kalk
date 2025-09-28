<template>
  <div class="min-h-screen flex flex-col">
    <!-- Modern Header Section -->
    <ModernHeader
      @navigate-to-scenarios="navigateToScenarios"
      @show-import="showImport = true"
      @show-help="showHelp"
      @show-settings="showSettings"
    />

    <!-- Main Content -->
    <main class="flex-1 bg-gray-50 dark:bg-slate-900">
      <!-- Scenarios Section -->
      <section id="scenarios" class="py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScenarioManagementTable
            :scenarios="scenarios"
            @create-scenario="handleCreateScenario"
            @update-scenario="handleUpdateScenario"
            @delete-scenario="handleDeleteScenario"
            @view-scenario="handleViewScenario"
          />
        </div>
      </section>
    </main>
    
    <ImportModal v-model="showImport" />
  </div>
</template>

<script setup lang="ts">
import LandingPageScenarios from "./LandingPageScenarios.vue";
import ModernHeader from "@/components/ModernHeader.vue";
import ScenarioManagementTable from "@/components/ScenarioManagementTable.vue";
import { useRouter } from "vue-router";
import { ref } from "vue";
import ImportModal from "@/components/ImportModal.vue";

const router = useRouter();

// Sample scenarios data
const scenarios = ref([
  {
    id: '1',
    name: 'عملیات بیت المقدس ۱۹۸۲',
    description: 'بازسازی نبرد آزادسازی خرمشهر در سال ۱۹۸۲',
    status: 'completed' as const,
    startTime: '1982-04-30T00:00:00Z',
    endTime: '1982-05-24T00:00:00Z',
    objectives: ['آزادسازی خرمشهر', 'شکست نیروهای عراقی', 'بازپس‌گیری مناطق اشغالی']
  },
  {
    id: '2',
    name: 'جنگ ایران و اسرائیل ژوئن ۲۰۲۵',
    description: 'سناریوی فرضی درگیری نظامی بین ایران و اسرائیل',
    status: 'active' as const,
    startTime: '2025-06-01T00:00:00Z',
    objectives: ['دفاع از مرزهای کشور', 'حفظ امنیت ملی', 'مقابله با تهدیدات خارجی']
  },
  {
    id: '3',
    name: 'عملیات مرصاد ۱۹۸۸',
    description: 'بازسازی عملیات مرصاد در جنگ ایران و عراق',
    status: 'draft' as const,
    startTime: '1988-07-26T00:00:00Z',
    endTime: '1988-08-03T00:00:00Z',
    objectives: ['دفاع از مرزهای غربی', 'شکست تهاجم دشمن']
  }
]);

// Navigation functions
const navigateToScenarios = () => {
  const scenariosElement = document.getElementById('scenarios');
  if (scenariosElement) {
    scenariosElement.scrollIntoView({ behavior: 'smooth' });
  }
};

const showImport = ref(false);

const showHelp = () => {
  console.log('Show help');
};

const showSettings = () => {
  console.log('Show settings');
};

// Scenario management functions
const handleCreateScenario = (scenarioData: any) => {
  const newScenario = {
    id: Date.now().toString(),
    ...scenarioData,
    objectives: scenarioData.objectives || []
  };
  scenarios.value.push(newScenario);
  console.log('Created scenario:', newScenario);
};

const handleUpdateScenario = (id: string, scenarioData: any) => {
  const index = scenarios.value.findIndex(s => s.id === id);
  if (index !== -1) {
    scenarios.value[index] = {
      ...scenarios.value[index],
      ...scenarioData,
      objectives: scenarioData.objectives || scenarios.value[index].objectives
    };
  }
  console.log('Updated scenario:', id, scenarioData);
};

const handleDeleteScenario = (id: string) => {
  const index = scenarios.value.findIndex(s => s.id === id);
  if (index !== -1) {
    scenarios.value.splice(index, 1);
  }
  console.log('Deleted scenario:', id);
};

const handleViewScenario = (id: string) => {
  console.log('View scenario:', id);
  // Navigate to scenario editor
  router.push(`/scenario/${id}`);
};
</script>