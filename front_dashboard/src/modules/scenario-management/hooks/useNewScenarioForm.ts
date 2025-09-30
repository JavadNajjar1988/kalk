/**
 * useNewScenarioForm Hook
 * مدیریت state و validation فرم ایجاد سناریوی جدید
 */

import { useState, useCallback, useMemo } from 'react';
import { useOrbatCommands } from '../../orbat-integration';
import type { 
  NewScenarioFormData, 
  NewScenarioFormErrors,
  ScenarioCreationResult,
  InitialSideData,
  RootUnitConfig,
  SymbologyStandardOption
} from '../types/new-scenario';

// Default form values (مطابق با Vue)
const DEFAULT_FORM_DATA: NewScenarioFormData = {
  name: 'سناریوی جدید',
  description: '',
  noInitialOrbat: false,
  sides: [
    {
      name: 'طرف ۱',
      standardIdentity: '3', // Friend
      symbolOptions: {},
      units: [{ 
        rootUnitName: 'ستاد', 
        rootUnitEchelon: '18', 
        rootUnitIcon: '121100' 
      }]
    },
    {
      name: 'طرف ۲', 
      standardIdentity: '6', // Hostile
      symbolOptions: {},
      units: [{ 
        rootUnitName: 'ستاد', 
        rootUnitEchelon: '18', 
        rootUnitIcon: '121100' 
      }]
    }
  ],
  timeZone: 'UTC',
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  day: new Date().getDate(),
  hour: new Date().getHours(),
  minute: new Date().getMinutes(),
  symbologyStandard: 'app6'
};

// Symbology standards (مطابق با Vue)
export const SYMBOLOGY_STANDARDS: SymbologyStandardOption[] = [
  {
    value: 'app6',
    name: 'APP-6',
    description: 'نسخه ناتو'
  },
  {
    value: '2525',
    name: 'MIL-STD-2525D', 
    description: 'نسخه آمریکایی'
  }
];

interface UseNewScenarioFormOptions {
  initialData?: Partial<NewScenarioFormData>;
  onSuccess?: (scenarioId: string) => void;
  onError?: (error: string) => void;
}

export function useNewScenarioForm(options: UseNewScenarioFormOptions = {}) {
  const { initialData, onSuccess, onError } = options;
  
  // Form state
  const [formData, setFormData] = useState<NewScenarioFormData>({
    ...DEFAULT_FORM_DATA,
    ...initialData
  });
  
  const [errors, setErrors] = useState<NewScenarioFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ORBAT integration
  const { executeCommand } = useOrbatCommands();
  
  // Form field updates
  const updateField = useCallback(<K extends keyof NewScenarioFormData>(
    field: K, 
    value: NewScenarioFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear related errors
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);
  
  // Side management
  const addSide = useCallback(() => {
    const newSide: InitialSideData = {
      name: 'طرف',
      standardIdentity: '3',
      symbolOptions: {},
      units: [{ 
        rootUnitName: 'ستاد', 
        rootUnitEchelon: '18', 
        rootUnitIcon: '121000' 
      }]
    };
    
    setFormData(prev => ({
      ...prev,
      sides: [...prev.sides, newSide]
    }));
  }, []);
  
  const removeSide = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      sides: prev.sides.filter((_, i) => i !== index)
    }));
  }, []);
  
  const updateSide = useCallback((index: number, sideData: Partial<InitialSideData>) => {
    setFormData(prev => ({
      ...prev,
      sides: prev.sides.map((side, i) => 
        i === index ? { ...side, ...sideData } : side
      )
    }));
  }, []);
  
  // Unit management
  const addRootUnit = useCallback((sideIndex: number) => {
    const newUnit: RootUnitConfig = { 
      rootUnitName: 'ستاد', 
      rootUnitEchelon: '18', 
      rootUnitIcon: '121000' 
    };
    
    setFormData(prev => ({
      ...prev,
      sides: prev.sides.map((side, i) => 
        i === sideIndex 
          ? { ...side, units: [...side.units, newUnit] }
          : side
      )
    }));
  }, []);
  
  const removeRootUnit = useCallback((sideIndex: number, unitIndex: number) => {
    setFormData(prev => ({
      ...prev,
      sides: prev.sides.map((side, i) => 
        i === sideIndex 
          ? { ...side, units: side.units.filter((_, j) => j !== unitIndex) }
          : side
      )
    }));
  }, []);
  
  const updateRootUnit = useCallback((
    sideIndex: number, 
    unitIndex: number, 
    unitData: Partial<RootUnitConfig>
  ) => {
    setFormData(prev => ({
      ...prev,
      sides: prev.sides.map((side, i) => 
        i === sideIndex 
          ? {
              ...side,
              units: side.units.map((unit, j) => 
                j === unitIndex ? { ...unit, ...unitData } : unit
              )
            }
          : side
      )
    }));
  }, []);
  
  // Computed datetime
  const resDateTime = useMemo(() => {
    const date = new Date(formData.year, formData.month - 1, formData.day, formData.hour, formData.minute);
    return {
      valueOf: () => date.getTime(),
      format: () => date.toLocaleString('fa-IR', { timeZone: formData.timeZone })
    };
  }, [formData.year, formData.month, formData.day, formData.hour, formData.minute, formData.timeZone]);
  
  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: NewScenarioFormErrors = {};
    
    // Basic validation
    if (!formData.name.trim()) {
      newErrors.name = 'نام سناریو الزامی است';
    }
    
    if (formData.year < 1900 || formData.year > 2100) {
      newErrors.year = 'سال معتبر نیست';
    }
    
    if (formData.month < 1 || formData.month > 12) {
      newErrors.month = 'ماه معتبر نیست';
    }
    
    if (formData.day < 1 || formData.day > 31) {
      newErrors.day = 'روز معتبر نیست';
    }
    
    if (formData.hour < 0 || formData.hour > 23) {
      newErrors.hour = 'ساعت معتبر نیست';
    }
    
    if (formData.minute < 0 || formData.minute > 59) {
      newErrors.minute = 'دقیقه معتبر نیست';
    }
    
    // Sides validation
    if (!formData.noInitialOrbat) {
      formData.sides.forEach((side, sideIndex) => {
        if (!side.name.trim()) {
          if (!newErrors.sides) newErrors.sides = {};
          if (!newErrors.sides[sideIndex]) newErrors.sides[sideIndex] = {};
          newErrors.sides[sideIndex].name = 'نام طرف الزامی است';
        }
        
        side.units.forEach((unit, unitIndex) => {
          if (!unit.rootUnitName?.trim()) {
            if (!newErrors.sides) newErrors.sides = {};
            if (!newErrors.sides[sideIndex]) newErrors.sides[sideIndex] = {};
            if (!newErrors.sides[sideIndex].units) newErrors.sides[sideIndex].units = {};
            if (!newErrors.sides[sideIndex].units![unitIndex]) newErrors.sides[sideIndex].units![unitIndex] = {};
            newErrors.sides[sideIndex].units![unitIndex].rootUnitName = 'نام واحد الزامی است';
          }
        });
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);
  
  // Form submission
  const submit = useCallback(async (): Promise<ScenarioCreationResult> => {
    if (!validateForm()) {
      return { success: false, error: 'اطلاعات فرم معتبر نیست' };
    }
    
    setIsSubmitting(true);
    
    try {
      // Create scenario using ORBAT commands
      const startTime = resDateTime.valueOf();
      
      const scenarioData = {
        name: formData.name,
        description: formData.description,
        startTime,
        timeZone: formData.timeZone,
        symbologyStandard: formData.symbologyStandard,
        sides: formData.noInitialOrbat ? [] : formData.sides
      };
      
      const result = await executeCommand('SAVE_SCENARIO', scenarioData);
      
      if (result.success && result.scenarioId) {
        onSuccess?.(result.scenarioId);
        return { success: true, scenarioId: result.scenarioId };
      } else {
        throw new Error(result.error || 'خطای نامشخص در ایجاد سناریو');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در ایجاد سناریو';
      onError?.(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, resDateTime, executeCommand, onSuccess, onError]);
  
  // Reset form
  const reset = useCallback(() => {
    setFormData({ ...DEFAULT_FORM_DATA, ...initialData });
    setErrors({});
  }, [initialData]);
  
  // Is form valid
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0 && formData.name.trim().length > 0;
  }, [errors, formData.name]);
  
  return {
    // State
    formData,
    errors,
    isSubmitting,
    isValid,
    
    // Computed
    resDateTime,
    
    // Actions
    updateField,
    addSide,
    removeSide,
    updateSide,
    addUnit: addRootUnit,
    removeUnit: removeRootUnit,
    updateUnit: updateRootUnit,
    submit,
    reset,
    validateForm,
    
    // Constants
    symbologyStandards: SYMBOLOGY_STANDARDS
  };
}