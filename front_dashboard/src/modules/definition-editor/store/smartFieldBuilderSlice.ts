import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Import types from the main types file for consistency
import {
  SmartFieldConfig,
  WizardState,
  WizardStep,
  ValidationRule,
  FieldEnhancement,
  DataSource,
  BaseFieldType,
  EnhancementType,
  DataSourceType
} from '../components/smart-field-builder/types/smartFieldTypes';

// Additional types specific to store
export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: SmartFieldConfig[];
  icon?: string;
  color?: string;
}

// Smart Field Builder slice state
interface SmartFieldBuilderState {
  // Wizard state
  wizard: WizardState;
  
  // Template system state
  templates: TemplateConfig[];
  selectedTemplate: TemplateConfig | null;
  
  // Builder state
  isLoading: boolean;
  activeMode: 'guided' | 'template' | null;
  
  // Field management
  currentField: Partial<SmartFieldConfig>;
  existingFields: SmartFieldConfig[];
  
  // Error handling
  errors: Record<string, string>;
}

// Initial state
const initialState: SmartFieldBuilderState = {
  wizard: {
    currentStep: 0,
    steps: [
      {
        step: 0,
        title: 'انتخاب نوع پایه',
        description: 'نوع اصلی فیلد را انتخاب کنید',
        isValid: false,
        isComplete: false
      },
      {
        step: 1,
        title: 'ویژگی‌های هوشمند',
        description: 'قابلیت‌های اضافی مورد نظر را اضافه کنید',
        isValid: false,
        isComplete: false
      },
      {
        step: 2,
        title: 'منبع داده',
        description: 'منبع اطلاعات فیلد را تعریف کنید',
        isValid: false,
        isComplete: false
      },
      {
        step: 3,
        title: 'پیش‌نمایش',
        description: 'نتیجه نهایی را بررسی و تأیید کنید',
        isValid: false,
        isComplete: false
      }
    ],
    config: {},
    errors: {},
    isNavigationEnabled: true
  },
  templates: [],
  selectedTemplate: null,
  isLoading: false,
  activeMode: null,
  currentField: {},
  existingFields: [],
  errors: {}
};

// Smart Field Builder slice
const smartFieldBuilderSlice = createSlice({
  name: 'smartFieldBuilder',
  initialState,
  reducers: {
    // Mode management
    setActiveMode: (state, action: PayloadAction<'guided' | 'template'>) => {
      state.activeMode = action.payload;
      state.errors = {};
    },
    
    resetBuilder: (state) => {
      state.activeMode = null;
      state.currentField = {};
      state.errors = {};
      state.wizard = initialState.wizard;
      state.selectedTemplate = null;
    },
    
    // Wizard actions
    setWizardStep: (state, action: PayloadAction<number>) => {
      if (action.payload >= 0 && action.payload < state.wizard.steps.length) {
        state.wizard.currentStep = action.payload;
      }
    },
    
    updateWizardConfig: (state, action: PayloadAction<Partial<SmartFieldConfig>>) => {
      state.wizard.config = { ...state.wizard.config, ...action.payload };
      state.currentField = { ...state.currentField, ...action.payload };
    },
    
    setWizardStepValid: (state, action: PayloadAction<{ step: number; isValid: boolean }>) => {
      const { step, isValid } = action.payload;
      if (state.wizard.steps[step]) {
        state.wizard.steps[step].isValid = isValid;
        if (isValid) {
          state.wizard.steps[step].isComplete = true;
        }
      }
    },
    
    setWizardError: (state, action: PayloadAction<{ field: string; error: string }>) => {
      const { field, error } = action.payload;
      state.wizard.errors[field] = error;
    },
    
    clearWizardError: (state, action: PayloadAction<string>) => {
      delete state.wizard.errors[action.payload];
    },
    
    // Template actions
    setTemplates: (state, action: PayloadAction<TemplateConfig[]>) => {
      state.templates = action.payload;
    },
    
    selectTemplate: (state, action: PayloadAction<TemplateConfig>) => {
      state.selectedTemplate = action.payload;
      // If single field template, set as current field
      if (action.payload.fields.length === 1) {
        state.currentField = action.payload.fields[0];
      }
    },
    
    clearSelectedTemplate: (state) => {
      state.selectedTemplate = null;
    },
    
    // Field management
    setCurrentField: (state, action: PayloadAction<Partial<SmartFieldConfig>>) => {
      state.currentField = action.payload;
    },
    
    updateCurrentField: (state, action: PayloadAction<Partial<SmartFieldConfig>>) => {
      state.currentField = { ...state.currentField, ...action.payload };
    },
    
    setExistingFields: (state, action: PayloadAction<SmartFieldConfig[]>) => {
      state.existingFields = action.payload;
    },
    
    // Loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    // Error management
    setError: (state, action: PayloadAction<{ field: string; error: string }>) => {
      const { field, error } = action.payload;
      state.errors[field] = error;
    },
    
    clearError: (state, action: PayloadAction<string>) => {
      delete state.errors[action.payload];
    },
    
    clearAllErrors: (state) => {
      state.errors = {};
      state.wizard.errors = {};
    }
  }
});

// Export actions
export const {
  setActiveMode,
  resetBuilder,
  setWizardStep,
  updateWizardConfig,
  setWizardStepValid,
  setWizardError,
  clearWizardError,
  setTemplates,
  selectTemplate,
  clearSelectedTemplate,
  setCurrentField,
  updateCurrentField,
  setExistingFields,
  setLoading,
  setError,
  clearError,
  clearAllErrors
} = smartFieldBuilderSlice.actions;

// Selectors
export const selectSmartFieldBuilder = (state: any) => state.smartFieldBuilder;
export const selectWizardState = (state: any) => state.smartFieldBuilder.wizard;
export const selectCurrentField = (state: any) => state.smartFieldBuilder.currentField;
export const selectSelectedTemplate = (state: any) => state.smartFieldBuilder.selectedTemplate;
export const selectActiveMode = (state: any) => state.smartFieldBuilder.activeMode;
export const selectIsLoading = (state: any) => state.smartFieldBuilder.isLoading;
export const selectBuilderErrors = (state: any) => state.smartFieldBuilder.errors;

// Export reducer
export default smartFieldBuilderSlice.reducer;