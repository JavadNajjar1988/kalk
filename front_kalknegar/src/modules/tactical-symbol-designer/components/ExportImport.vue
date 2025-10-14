<template>
  <div class="export-import">
    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">خروجی گرفتن</h3>
        <div class="flex flex-wrap gap-2">
          <button
            @click="exportCurrentSymbol"
            :disabled="!currentSymbol"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            خروجی نماد فعلی
          </button>
          <button
            @click="exportAllSymbols"
            :disabled="symbols.length === 0"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            خروجی همه نمادها
          </button>
        </div>
      </div>
      
      <div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">ورود اطلاعات</h3>
        <div class="flex flex-wrap gap-2">
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            @change="handleFileUpload"
            class="hidden"
          />
          <button
            @click="$refs.fileInput.click()"
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            انتخاب فایل JSON
          </button>
        </div>
      </div>
      
      <!-- Error message -->
      <div v-if="error" class="p-3 bg-red-50 dark:bg-red-900 rounded-lg">
        <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
      </div>
      
      <!-- Success message -->
      <div v-if="success" class="p-3 bg-green-50 dark:bg-green-900 rounded-lg">
        <p class="text-sm text-green-800 dark:text-green-200">{{ success }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { TacticalSymbol } from '../types';
import { exportSymbolToJson, exportSymbolsToJson, importSymbolFromJson, importSymbolsFromJson } from '../utils/exportImport';

interface Props {
  currentSymbol?: TacticalSymbol | null;
  symbols: TacticalSymbol[];
}

interface Emits {
  (e: 'import-symbol', symbol: TacticalSymbol): void;
  (e: 'import-symbols', symbols: TacticalSymbol[]): void;
  (e: 'error', message: string): void;
  (e: 'success', message: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Refs
const fileInput = ref<HTMLInputElement | null>(null);
const error = ref<string | null>(null);
const success = ref<string | null>(null);

// Methods
const exportCurrentSymbol = () => {
  try {
    if (!props.currentSymbol) {
      throw new Error('No current symbol to export');
    }
    
    const json = exportSymbolToJson(props.currentSymbol);
    downloadJson(json, `symbol-${props.currentSymbol.name}.json`);
    
    success.value = 'نماد با موفقیت صادر شد';
    error.value = null;
    emit('success', success.value);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An unknown error occurred while exporting symbol';
    success.value = null;
    emit('error', error.value);
  }
};

const exportAllSymbols = () => {
  try {
    if (props.symbols.length === 0) {
      throw new Error('No symbols to export');
    }
    
    const json = exportSymbolsToJson(props.symbols);
    downloadJson(json, 'tactical-symbols.json');
    
    success.value = 'همه نمادها با موفقیت صادر شدند';
    error.value = null;
    emit('success', success.value);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An unknown error occurred while exporting symbols';
    success.value = null;
    emit('error', error.value);
  }
};

const handleFileUpload = (event: Event) => {
  try {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) {
      throw new Error('No file selected');
    }
    
    if (!file.name.endsWith('.json')) {
      throw new Error('Only JSON files are supported');
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        // Try to parse as single symbol first
        try {
          const symbol = importSymbolFromJson(content);
          emit('import-symbol', symbol);
          success.value = 'نماد با موفقیت وارد شد';
          error.value = null;
          emit('success', success.value);
        } catch {
          // If that fails, try to parse as multiple symbols
          const symbols = importSymbolsFromJson(content);
          emit('import-symbols', symbols);
          success.value = 'نمادها با موفقیت وارد شدند';
          error.value = null;
          emit('success', success.value);
        }
        
        // Reset file input
        if (fileInput.value) {
          fileInput.value.value = '';
        }
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'An unknown error occurred while importing file';
        success.value = null;
        emit('error', error.value);
      }
    };
    
    reader.onerror = () => {
      throw new Error('Failed to read file');
    };
    
    reader.readAsText(file);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An unknown error occurred while handling file upload';
    success.value = null;
    emit('error', error.value);
  }
};

const downloadJson = (content: string, filename: string) => {
  try {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (err) {
    throw new Error('Failed to download file: ' + (err instanceof Error ? err.message : 'Unknown error'));
  }
};
</script>