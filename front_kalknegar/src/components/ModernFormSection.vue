<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
    <!-- Section Header -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
        {{ title }}
      </h3>
      <p v-if="description" class="text-sm text-slate-600 dark:text-slate-400">
        {{ description }}
      </p>
    </div>

    <!-- Development Notice -->
    <div
      v-if="showDevNotice"
      class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
    >
      <div class="flex items-start">
        <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="text-sm text-blue-800 dark:text-blue-200">
          این یک نمونه اولیه در حال توسعه است.
        </div>
      </div>
    </div>

    <!-- Form Content -->
    <div class="space-y-6">
      <slot />
    </div>

    <!-- Action Buttons -->
    <div
      v-if="showActions"
      class="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700 mt-6"
    >
      <button
        type="button"
        class="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="isSubmitting"
        @click="$emit('cancel')"
      >
        لغو
      </button>
      
      <button
        type="submit"
        class="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        :disabled="!isValid || isSubmitting"
        @click="$emit('submit')"
      >
        <svg
          v-if="isSubmitting"
          class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {{ isSubmitting ? 'در حال ایجاد...' : submitText }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// Props
interface Props {
  title: string
  description?: string
  showDevNotice?: boolean
  showActions?: boolean
  submitText?: string
  isValid?: boolean
  isSubmitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDevNotice: false,
  showActions: false,
  submitText: 'ایجاد سناریو',
  isValid: true,
  isSubmitting: false
})

// Emits
const emit = defineEmits<{
  'submit': []
  'cancel': []
}>()
</script>
