<template>
  <div class="space-y-2">
    <!-- Label -->
    <label
      v-if="label"
      :for="fieldId"
      class="block text-sm font-medium text-slate-700 dark:text-slate-300"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- Input Field -->
    <div class="relative">
      <!-- Text Input -->
      <input
        v-if="type === 'text' || type === 'email' || type === 'password'"
        :id="fieldId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="$emit('blur')"
      />

      <!-- Textarea -->
      <textarea
        v-else-if="type === 'textarea'"
        :id="fieldId"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :rows="rows"
        class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-vertical"
        @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        @blur="$emit('blur')"
      />

      <!-- Select -->
      <select
        v-else-if="type === 'select'"
        :id="fieldId"
        :value="modelValue"
        :required="required"
        :disabled="disabled"
        class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
        @blur="$emit('blur')"
      >
        <option value="" disabled>{{ placeholder || 'انتخاب کنید...' }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>

      <!-- Number Input -->
      <input
        v-else-if="type === 'number'"
        :id="fieldId"
        type="number"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :min="min"
        :max="max"
        :step="step"
        class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="$emit('blur')"
      />

      <!-- Date Input -->
      <input
        v-else-if="type === 'date'"
        :id="fieldId"
        type="date"
        :value="modelValue"
        :required="required"
        :disabled="disabled"
        class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="$emit('blur')"
      />

      <!-- Time Input -->
      <input
        v-else-if="type === 'time'"
        :id="fieldId"
        type="time"
        :value="modelValue"
        :required="required"
        :disabled="disabled"
        class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="$emit('blur')"
      />
    </div>

    <!-- Help Text -->
    <p v-if="helpText" class="text-xs text-slate-500 dark:text-slate-400">
      {{ helpText }}
    </p>

    <!-- Error Message -->
    <p v-if="error" class="text-xs text-red-600 dark:text-red-400">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props
interface Option {
  value: string | number
  label: string
}

interface Props {
  modelValue: string | number
  type?: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'number' | 'date' | 'time'
  label?: string
  placeholder?: string
  helpText?: string
  error?: string
  required?: boolean
  disabled?: boolean
  rows?: number
  options?: Option[]
  min?: number
  max?: number
  step?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  disabled: false,
  rows: 3
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  'blur': []
}>()

// Computed
const fieldId = computed(() => `field-${Math.random().toString(36).substr(2, 9)}`)
</script>
