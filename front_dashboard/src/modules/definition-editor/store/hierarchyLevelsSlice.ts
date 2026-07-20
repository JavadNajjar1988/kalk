import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DynamicHierarchyLevel } from '../types';

interface HierarchyLevelsState {
  dynamicLevels: DynamicHierarchyLevel[];
  loading: boolean;
  error: string | null;
}

const initialState: HierarchyLevelsState = {
  dynamicLevels: [],
  loading: false,
  error: null,
};

const hierarchyLevelsSlice = createSlice({
  name: 'hierarchyLevels',
  initialState,
  reducers: {
    // اضافه کردن سطح جدید
    addDynamicLevel: (state, action: PayloadAction<DynamicHierarchyLevel>) => {
      state.dynamicLevels.push(action.payload);
    },
    
    // بروزرسانی سطح موجود
    updateDynamicLevel: (state, action: PayloadAction<{ id: string; data: Partial<DynamicHierarchyLevel> }>) => {
      const index = state.dynamicLevels.findIndex(level => level.id === action.payload.id);
      if (index !== -1) {
        state.dynamicLevels[index] = { ...state.dynamicLevels[index], ...action.payload.data };
      }
    },
    
    // حذف سطح
    deleteDynamicLevel: (state, action: PayloadAction<string>) => {
      state.dynamicLevels = state.dynamicLevels.filter(level => level.id !== action.payload);
    },
    
    // مرتب‌سازی سطوح
    reorderDynamicLevels: (state, action: PayloadAction<{ categoryId: string; levels: DynamicHierarchyLevel[] }>) => {
      const { categoryId, levels } = action.payload;
      // حذف سطوح قبلی این دسته‌بندی
      state.dynamicLevels = state.dynamicLevels.filter(level => level.categoryId !== categoryId);
      // اضافه کردن سطوح جدید
      state.dynamicLevels.push(...levels);
    },
    
    // تنظیم loading
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    // تنظیم error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // پاک کردن error
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { 
  addDynamicLevel, 
  updateDynamicLevel, 
  deleteDynamicLevel, 
  reorderDynamicLevels,
  setLoading,
  setError,
  clearError
} = hierarchyLevelsSlice.actions;

// Selectors
export const selectDynamicLevels = (state: { hierarchyLevels: HierarchyLevelsState }) => 
  state.hierarchyLevels.dynamicLevels;

export const selectDynamicLevelsByCategory = (state: { hierarchyLevels: HierarchyLevelsState }, categoryId: string) => 
  state.hierarchyLevels.dynamicLevels
    .filter(level => level.categoryId === categoryId)
    .sort((a, b) => a.order - b.order);

export const selectLoading = (state: { hierarchyLevels: HierarchyLevelsState }) => 
  state.hierarchyLevels.loading;

export const selectError = (state: { hierarchyLevels: HierarchyLevelsState }) => 
  state.hierarchyLevels.error;

export default hierarchyLevelsSlice.reducer;
