import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FieldDependency, 
  DependencyContext, 
  DependencyResult,
  DependencyType 
} from './types';
import DependencyManager from './DependencyManager';

interface UseFieldDependenciesOptions {
  debounceDelay?: number;
  enableLogging?: boolean;
  onDependencyResult?: (fieldId: string, results: DependencyResult[]) => void;
}

interface FieldState {
  visible: boolean;
  required: boolean;
  readonly: boolean;
  value: any;
  options: any[];
  validationRules: string[];
  error?: string;
}

interface UseFieldDependenciesReturn {
  // Field states
  fieldStates: Record<string, FieldState>;
  
  // Methods
  updateFieldValue: (fieldId: string, value: any) => void;
  addDependency: (dependency: FieldDependency) => void;
  removeDependency: (dependencyId: string, targetFieldId: string) => void;
  getDependencies: (fieldId: string) => FieldDependency[];
  evaluateField: (fieldId: string) => Promise<DependencyResult[]>;
  resetField: (fieldId: string) => void;
  resetAllFields: () => void;
  
  // State
  isEvaluating: boolean;
  hasErrors: boolean;
  dependencyStats: {
    totalDependencies: number;
    activeDependencies: number;
    fieldsCovered: number;
  };
}

export const useFieldDependencies = (
  initialFieldValues: Record<string, any> = {},
  fieldDefinitions: Record<string, any> = {},
  options: UseFieldDependenciesOptions = {}
): UseFieldDependenciesReturn => {
  const {
    debounceDelay = 300,
    enableLogging = false,
    onDependencyResult
  } = options;

  const dependencyManager = useMemo(() => DependencyManager.getInstance(), []);
  
  const [fieldValues, setFieldValues] = useState<Record<string, any>>(initialFieldValues);
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>({});
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationTimeouts, setEvaluationTimeouts] = useState<Record<string, NodeJS.Timeout>>({});

  // Initialize field states
  useEffect(() => {
    const initialStates: Record<string, FieldState> = {};
    
    Object.keys(initialFieldValues).forEach(fieldId => {
      initialStates[fieldId] = {
        visible: true,
        required: false,
        readonly: false,
        value: initialFieldValues[fieldId],
        options: [],
        validationRules: [],
        error: undefined
      };
    });
    
    setFieldStates(initialStates);
  }, [initialFieldValues]);

  // Create dependency context
  const createContext = useCallback((triggerField: string): DependencyContext => ({
    fieldValues,
    fieldDefinitions,
    triggerField,
    timestamp: Date.now()
  }), [fieldValues, fieldDefinitions]);

  // Evaluate dependencies for a specific field
  const evaluateField = useCallback(async (fieldId: string): Promise<DependencyResult[]> => {
    try {
      setIsEvaluating(true);
      const context = createContext(fieldId);
      const results = await dependencyManager.evaluateDependencies(fieldId, context);
      
      if (enableLogging) {
        console.log(`[Dependencies] Evaluated ${results.length} dependencies for field ${fieldId}`, results);
      }

      // Apply results to field states
      if (results.length > 0) {
        setFieldStates(prevStates => {
          const newStates = { ...prevStates };
          
          if (!newStates[fieldId]) {
            newStates[fieldId] = {
              visible: true,
              required: false,
              readonly: false,
              value: fieldValues[fieldId],
              options: [],
              validationRules: [],
              error: undefined
            };
          }

          results.forEach(result => {
            if (result.actionExecuted && !result.error) {
              const fieldState = newStates[fieldId];
              
              switch (result.dependency.type) {
                case DependencyType.VISIBILITY:
                  fieldState.visible = result.newValue ?? fieldState.visible;
                  break;
                
                case DependencyType.REQUIRED:
                  fieldState.required = result.newValue ?? fieldState.required;
                  break;
                
                case DependencyType.READONLY:
                  fieldState.readonly = result.newValue ?? fieldState.readonly;
                  break;
                
                case DependencyType.VALUE:
                  if (result.newValue !== undefined) {
                    fieldState.value = result.newValue;
                    // Also update the field values
                    setFieldValues(prev => ({ ...prev, [fieldId]: result.newValue }));
                  }
                  break;
                
                case DependencyType.OPTIONS:
                  fieldState.options = result.newValue ?? fieldState.options;
                  break;
                
                case DependencyType.VALIDATION:
                  fieldState.validationRules = result.newValue ?? fieldState.validationRules;
                  break;
              }
            } else if (result.error) {
              newStates[fieldId].error = result.error;
            }
          });

          return newStates;
        });

        // Notify callback
        onDependencyResult?.(fieldId, results);
      }

      return results;
    } catch (error) {
      console.error(`[Dependencies] Error evaluating field ${fieldId}:`, error);
      return [];
    } finally {
      setIsEvaluating(false);
    }
  }, [dependencyManager, createContext, enableLogging, onDependencyResult, fieldValues]);

  // Debounced field evaluation
  const scheduleEvaluation = useCallback((fieldId: string) => {
    // Clear existing timeout
    if (evaluationTimeouts[fieldId]) {
      clearTimeout(evaluationTimeouts[fieldId]);
    }

    // Schedule new evaluation
    const timeoutId = setTimeout(() => {
      evaluateField(fieldId);
      setEvaluationTimeouts(prev => {
        const newTimeouts = { ...prev };
        delete newTimeouts[fieldId];
        return newTimeouts;
      });
    }, debounceDelay);

    setEvaluationTimeouts(prev => ({
      ...prev,
      [fieldId]: timeoutId
    }));
  }, [evaluateField, debounceDelay, evaluationTimeouts]);

  // Update field value and trigger dependency evaluation
  const updateFieldValue = useCallback((fieldId: string, value: any) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: value }));
    
    // Update field state
    setFieldStates(prev => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        value,
        error: undefined // Clear any existing errors
      }
    }));

    // Find fields that depend on this field and evaluate them
    const allFieldIds = Object.keys(fieldValues);
    allFieldIds.forEach(targetFieldId => {
      const dependencies = dependencyManager.getDependencies(targetFieldId);
      const hasSourceDependency = dependencies.some(dep => 
        dep.sourceFieldId === fieldId && dep.enabled
      );
      
      if (hasSourceDependency) {
        scheduleEvaluation(targetFieldId);
      }
    });
  }, [fieldValues, dependencyManager, scheduleEvaluation]);

  // Add dependency
  const addDependency = useCallback((dependency: FieldDependency) => {
    dependencyManager.addDependency(dependency);
    
    // Immediately evaluate the target field
    scheduleEvaluation(dependency.targetFieldId);
  }, [dependencyManager, scheduleEvaluation]);

  // Remove dependency
  const removeDependency = useCallback((dependencyId: string, targetFieldId: string) => {
    dependencyManager.removeDependency(dependencyId, targetFieldId);
    
    // Re-evaluate the target field
    scheduleEvaluation(targetFieldId);
  }, [dependencyManager, scheduleEvaluation]);

  // Get dependencies for a field
  const getDependencies = useCallback((fieldId: string): FieldDependency[] => {
    return dependencyManager.getDependencies(fieldId);
  }, [dependencyManager]);

  // Reset field to initial state
  const resetField = useCallback((fieldId: string) => {
    const initialValue = initialFieldValues[fieldId];
    
    setFieldValues(prev => ({ ...prev, [fieldId]: initialValue }));
    setFieldStates(prev => ({
      ...prev,
      [fieldId]: {
        visible: true,
        required: false,
        readonly: false,
        value: initialValue,
        options: [],
        validationRules: [],
        error: undefined
      }
    }));
  }, [initialFieldValues]);

  // Reset all fields
  const resetAllFields = useCallback(() => {
    setFieldValues(initialFieldValues);
    
    const resetStates: Record<string, FieldState> = {};
    Object.keys(initialFieldValues).forEach(fieldId => {
      resetStates[fieldId] = {
        visible: true,
        required: false,
        readonly: false,
        value: initialFieldValues[fieldId],
        options: [],
        validationRules: [],
        error: undefined
      };
    });
    
    setFieldStates(resetStates);
  }, [initialFieldValues]);

  // Calculate dependency statistics
  const dependencyStats = useMemo(() => {
    const stats = dependencyManager.getStatistics();
    const activeDependencies = Object.values(fieldStates).reduce((count, state) => {
      return count + (state.error ? 0 : 1);
    }, 0);

    return {
      totalDependencies: stats.totalDependencies,
      activeDependencies,
      fieldsCovered: stats.fieldsCovered
    };
  }, [dependencyManager, fieldStates]);

  // Check if there are any errors
  const hasErrors = useMemo(() => {
    return Object.values(fieldStates).some(state => state.error);
  }, [fieldStates]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(evaluationTimeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, [evaluationTimeouts]);

  return {
    fieldStates,
    updateFieldValue,
    addDependency,
    removeDependency,
    getDependencies,
    evaluateField,
    resetField,
    resetAllFields,
    isEvaluating,
    hasErrors,
    dependencyStats
  };
};

export default useFieldDependencies;