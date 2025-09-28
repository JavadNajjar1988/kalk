<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
    <!-- Header -->
    <div class="p-6 border-b border-slate-200 dark:border-slate-700">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
            مدیریت سناریوها
          </h2>
          <p class="text-slate-600 dark:text-slate-400 mt-1">
            مدیریت و ویرایش سناریوهای نظامی
          </p>
        </div>
        <button
          class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          @click="showCreateDialog = true"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          سناریوی جدید
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="p-6 border-b border-slate-200 dark:border-slate-700">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-blue-600 dark:text-blue-400">کل سناریوها</p>
              <p class="text-2xl font-bold text-blue-800 dark:text-blue-300">{{ scenarios.length }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-green-600 dark:text-green-400">فعال</p>
              <p class="text-2xl font-bold text-green-800 dark:text-green-300">{{ activeScenarios }}</p>
            </div>
            <div class="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-yellow-600 dark:text-yellow-400">پیش‌نویس</p>
              <p class="text-2xl font-bold text-yellow-800 dark:text-yellow-300">{{ draftScenarios }}</p>
            </div>
            <div class="w-12 h-12 bg-yellow-100 dark:bg-yellow-800 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-purple-600 dark:text-purple-400">تکمیل شده</p>
              <p class="text-2xl font-bold text-purple-800 dark:text-purple-300">{{ completedScenarios }}</p>
            </div>
            <div class="w-12 h-12 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="p-6 border-b border-slate-200 dark:border-slate-700">
      <div class="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div class="flex flex-col sm:flex-row gap-4 flex-1">
          <!-- Search -->
          <div class="relative">
            <input
              v-model="searchTerm"
              type="text"
              placeholder="جستجو در سناریوها..."
              class="w-full sm:w-64 pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <svg class="absolute left-3 top-2.5 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <!-- Status Filter -->
          <select
            v-model="statusFilter"
            class="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="draft">پیش‌نویس</option>
            <option value="active">فعال</option>
            <option value="paused">متوقف</option>
            <option value="completed">تکمیل شده</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-slate-50 dark:bg-slate-700">
          <tr>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              نام سناریو
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              وضعیت
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              تاریخ شروع
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              تاریخ پایان
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              اهداف
            </th>
            <th class="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              عملیات
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
          <tr
            v-for="scenario in filteredScenarios"
            :key="scenario.id"
            class="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <td class="px-6 py-4">
              <div>
                <button
                  class="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-red-500 transition-colors"
                  @click="viewScenario(scenario.id)"
                >
                  {{ scenario.name }}
                </button>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {{ scenario.description }}
                </p>
              </div>
            </td>
            <td class="px-6 py-4">
              <span
                class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                :class="getStatusClass(scenario.status)"
              >
                {{ getStatusLabel(scenario.status) }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
              {{ formatDate(scenario.startTime) }}
            </td>
            <td class="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
              {{ formatDate(scenario.endTime) }}
            </td>
            <td class="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
              {{ scenario.objectives?.length || 0 }}
            </td>
            <td class="px-6 py-4 text-center">
              <div class="relative">
                <button
                  class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  @click="toggleMenu(scenario.id)"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>

                <!-- Dropdown Menu -->
                <div
                  v-if="activeMenu === scenario.id"
                  class="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 z-10"
                >
                  <div class="py-1">
                    <button
                      class="w-full px-4 py-2 text-right text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center"
                      @click="viewScenario(scenario.id)"
                    >
                      <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      مشاهده جزئیات
                    </button>
                    <button
                      class="w-full px-4 py-2 text-right text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center"
                      @click="editScenario(scenario)"
                    >
                      <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      ویرایش
                    </button>
                    <button
                      class="w-full px-4 py-2 text-right text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                      @click="deleteScenario(scenario)"
                    >
                      <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-if="filteredScenarios.length === 0">
            <td colspan="6" class="px-6 py-12 text-center">
              <div class="text-slate-500 dark:text-slate-400">
                <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="text-lg font-medium mb-2">
                  {{ searchTerm || statusFilter !== 'all' ? 'هیچ سناریویی یافت نشد' : 'هیچ سناریویی وجود ندارد' }}
                </p>
                <p class="text-sm">
                  {{ searchTerm || statusFilter !== 'all' ? 'لطفاً فیلترهای جستجو را تغییر دهید' : 'برای شروع، یک سناریوی جدید ایجاد کنید' }}
                </p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Dialog -->
    <div
      v-if="showCreateDialog || showEditDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="closeDialogs"
    >
      <div
        class="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        @click.stop
      >
        <div class="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {{ showEditDialog ? 'ویرایش سناریو' : 'ایجاد سناریوی جدید' }}
          </h3>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              نام سناریو *
            </label>
            <input
              v-model="formData.name"
              type="text"
              class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="نام سناریو را وارد کنید"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              وضعیت
            </label>
            <select
              v-model="formData.status"
              class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="draft">پیش‌نویس</option>
              <option value="active">فعال</option>
              <option value="paused">متوقف</option>
              <option value="completed">تکمیل شده</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              توضیحات
            </label>
            <textarea
              v-model="formData.description"
              rows="3"
              class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-vertical"
              placeholder="توضیحات سناریو را وارد کنید"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                تاریخ شروع
              </label>
              <input
                v-model="formData.startTime"
                type="datetime-local"
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                تاریخ پایان
              </label>
              <input
                v-model="formData.endTime"
                type="datetime-local"
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              اهداف
            </label>
            <textarea
              v-model="formData.objectives"
              rows="4"
              class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-vertical"
              placeholder="اهداف سناریو را وارد کنید (هر هدف در یک خط)"
            />
          </div>
        </div>

        <div class="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3 rtl:space-x-reverse">
          <button
            class="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            @click="closeDialogs"
          >
            لغو
          </button>
          <button
            class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            @click="saveScenario"
            :disabled="!formData.name.trim()"
          >
            {{ showEditDialog ? 'ذخیره تغییرات' : 'ایجاد سناریو' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <div
      v-if="showDeleteDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="showDeleteDialog = false"
    >
      <div
        class="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full mx-4"
        @click.stop
      >
        <div class="p-6">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            تأیید حذف
          </h3>
          <p class="text-slate-600 dark:text-slate-400 mb-6">
            آیا مطمئن هستید که می‌خواهید سناریوی "{{ selectedScenario?.name }}" را حذف کنید؟
            <br>
            <span class="text-red-600 dark:text-red-400 text-sm">این عمل قابل بازگشت نیست.</span>
          </p>
          <div class="flex justify-end space-x-3 rtl:space-x-reverse">
            <button
              class="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              @click="showDeleteDialog = false"
            >
              لغو
            </button>
            <button
              class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              @click="confirmDelete"
            >
              حذف
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Types
interface Scenario {
  id: string
  name: string
  description: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  startTime?: string
  endTime?: string
  objectives?: string[]
}

// Props
const props = defineProps<{
  scenarios: Scenario[]
}>()

// Emits
const emit = defineEmits<{
  'create-scenario': [scenario: Partial<Scenario>]
  'update-scenario': [id: string, scenario: Partial<Scenario>]
  'delete-scenario': [id: string]
  'view-scenario': [id: string]
}>()

// Local state
const searchTerm = ref('')
const statusFilter = ref<'all' | 'draft' | 'active' | 'paused' | 'completed'>('all')
const activeMenu = ref<string | null>(null)
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const selectedScenario = ref<Scenario | null>(null)

const formData = ref({
  name: '',
  description: '',
  status: 'draft' as Scenario['status'],
  startTime: '',
  endTime: '',
  objectives: ''
})

// Computed
const filteredScenarios = computed(() => {
  return props.scenarios.filter(scenario => {
    const matchesSearch = scenario.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
                         scenario.description.toLowerCase().includes(searchTerm.value.toLowerCase())
    const matchesStatus = statusFilter.value === 'all' || scenario.status === statusFilter.value
    
    return matchesSearch && matchesStatus
  })
})

const activeScenarios = computed(() => 
  props.scenarios.filter(s => s.status === 'active').length
)

const draftScenarios = computed(() => 
  props.scenarios.filter(s => s.status === 'draft').length
)

const completedScenarios = computed(() => 
  props.scenarios.filter(s => s.status === 'completed').length
)

// Methods
const getStatusLabel = (status: Scenario['status']) => {
  const labels = {
    draft: 'پیش‌نویس',
    active: 'فعال',
    paused: 'متوقف',
    completed: 'تکمیل شده'
  }
  return labels[status]
}

const getStatusClass = (status: Scenario['status']) => {
  const classes = {
    draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    paused: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
  }
  return classes[status]
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '---'
  return new Date(dateString).toLocaleDateString('fa-IR')
}

const toggleMenu = (scenarioId: string) => {
  activeMenu.value = activeMenu.value === scenarioId ? null : scenarioId
}

const viewScenario = (id: string) => {
  activeMenu.value = null
  emit('view-scenario', id)
}

const editScenario = (scenario: Scenario) => {
  activeMenu.value = null
  selectedScenario.value = scenario
  formData.value = {
    name: scenario.name,
    description: scenario.description,
    status: scenario.status,
    startTime: scenario.startTime ? new Date(scenario.startTime).toISOString().slice(0, 16) : '',
    endTime: scenario.endTime ? new Date(scenario.endTime).toISOString().slice(0, 16) : '',
    objectives: scenario.objectives?.join('\n') || ''
  }
  showEditDialog.value = true
}

const deleteScenario = (scenario: Scenario) => {
  activeMenu.value = null
  selectedScenario.value = scenario
  showDeleteDialog.value = true
}

const closeDialogs = () => {
  showCreateDialog.value = false
  showEditDialog.value = false
  showDeleteDialog.value = false
  selectedScenario.value = null
  resetForm()
}

const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    status: 'draft',
    startTime: '',
    endTime: '',
    objectives: ''
  }
}

const saveScenario = () => {
  const scenarioData: Partial<Scenario> = {
    name: formData.value.name,
    description: formData.value.description,
    status: formData.value.status,
    startTime: formData.value.startTime || undefined,
    endTime: formData.value.endTime || undefined,
    objectives: formData.value.objectives.split('\n').filter(obj => obj.trim())
  }

  if (showEditDialog.value && selectedScenario.value) {
    emit('update-scenario', selectedScenario.value.id, scenarioData)
  } else {
    emit('create-scenario', scenarioData)
  }

  closeDialogs()
}

const confirmDelete = () => {
  if (selectedScenario.value) {
    emit('delete-scenario', selectedScenario.value.id)
  }
  showDeleteDialog.value = false
  selectedScenario.value = null
}

// Close menu when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (activeMenu.value) {
    activeMenu.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
