import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { TacticalSymbolDefinition, TacticalSymbolCategory } from '../types';

export const useTacticalSymbolStore = defineStore('tacticalSymbol', () => {
  // State
  const symbols = ref<TacticalSymbolDefinition[]>([]);
  const categories = ref<TacticalSymbolCategory[]>([]);
  const selectedSymbol = ref<TacticalSymbolDefinition | null>(null);
  const isLoading = ref(false);

  // Getters
  const symbolsByCategory = computed(() => {
    const grouped: Record<string, TacticalSymbolDefinition[]> = {};
    symbols.value.forEach(symbol => {
      if (!grouped[symbol.category]) {
        grouped[symbol.category] = [];
      }
      grouped[symbol.category].push(symbol);
    });
    return grouped;
  });

  const symbolNames = computed(() => 
    symbols.value.map(symbol => ({ id: symbol.id, name: symbol.name }))
  );

  // Actions
  const addSymbol = (symbol: TacticalSymbolDefinition) => {
    symbols.value.push(symbol);
  };

  const updateSymbol = (id: string, updates: Partial<TacticalSymbolDefinition>) => {
    const index = symbols.value.findIndex(s => s.id === id);
    if (index !== -1) {
      symbols.value[index] = { ...symbols.value[index], ...updates, updatedAt: new Date() };
    }
  };

  const deleteSymbol = (id: string) => {
    const index = symbols.value.findIndex(s => s.id === id);
    if (index !== -1) {
      symbols.value.splice(index, 1);
    }
  };

  const selectSymbol = (symbol: TacticalSymbolDefinition | null) => {
    selectedSymbol.value = symbol;
  };

  const addCategory = (category: TacticalSymbolCategory) => {
    categories.value.push(category);
  };

  const loadSampleData = () => {
    // Sample categories
    categories.value = [
      { id: 'infantry', name: 'پیاده نظام', description: 'نمادهای مربوط به پیاده نظام' },
      { id: 'armor', name: 'زرهی', description: 'نمادهای مربوط به نیروهای زرهی' },
      { id: 'artillery', name: 'توپخانه', description: 'نمادهای مربوط به توپخانه' },
      { id: 'aviation', name: 'هوانیروز', description: 'نمادهای مربوط به هوانیروز' },
    ];

    // Sample symbols (will be populated later)
    symbols.value = [];
  };

  return {
    // State
    symbols,
    categories,
    selectedSymbol,
    isLoading,
    
    // Getters
    symbolsByCategory,
    symbolNames,
    
    // Actions
    addSymbol,
    updateSymbol,
    deleteSymbol,
    selectSymbol,
    addCategory,
    loadSampleData,
  };
});
