import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Typography,
  alpha,
  useTheme,
  LinearProgress,
  Fade,
  CircularProgress,
  Collapse
} from '@mui/material';
import {
  NavigateBefore as BackIcon,
  NavigateNext as NextIcon
} from '@mui/icons-material';

import { 
  WizardState, 
  SmartFieldConfig,
  FieldContext
} from '../../types';

// Import step components with proper error handling
import BaseTypeStep from './steps/BaseTypeStep';
import EnhancementsStep from './steps/EnhancementsStep';
import DataSourceStep from './steps/DataSourceStep';
import PreviewStep from './steps/PreviewStep';

interface GuidedWizardProps {
  wizardState: WizardState;
  onStateChange: (state: WizardState) => void;
  onComplete: (config: SmartFieldConfig) => void;
  existingFields?: SmartFieldConfig[];
  categoryContext?: string;
  editingField?: SmartFieldConfig | null;
}

const GuidedWizard: React.FC<GuidedWizardProps> = ({
  wizardState,
  onStateChange,
  onComplete,
  existingFields = [],
  categoryContext,
  editingField
}) => {
  const theme = useTheme();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [stepLoadingStates, setStepLoadingStates] = useState<Record<number, boolean>>({});
  const [previewData, setPreviewData] = useState<any>(null);

  // Optimized field context with memoization
  const fieldContext: FieldContext = useMemo(() => ({
    categoryType: categoryContext,
    existingFields,
    currentCategory: categoryContext,
    usagePatterns: {} // To be implemented with analytics
  }), [categoryContext, existingFields]);

  // Enhanced step change with loading indicators and smooth transitions
  const handleStepChange = useCallback(async (newStep: number) => {
    if (newStep < 0 || newStep >= wizardState.steps.length) {
      console.warn('Invalid step index:', newStep);
      return;
    }
    
    // Validate current step before allowing navigation
    const currentStepIndex = wizardState.currentStep;
    const currentStep = wizardState.steps[currentStepIndex];
    
    // Don't allow forward navigation if current step is invalid
    if (newStep > currentStepIndex && !currentStep.isValid) {
      console.log('Cannot navigate forward: current step is invalid');
      return;
    }
    
    // Show transition loading
    setIsTransitioning(true);
    setStepLoadingStates(prev => ({ ...prev, [newStep]: true }));
    
    // Simulate loading for better UX (can be replaced with actual async operations)
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Handle step skipping for text fields
    const actualNewStep = getActualStepForNavigation(newStep, wizardState.config.baseType);
    
    onStateChange({
      ...wizardState,
      currentStep: actualNewStep
    });
    
    // Update preview data when moving to preview step
    if (actualNewStep === 3) {
      setPreviewData(generatePreviewData());
    }
    
    // Clear loading states
    setIsTransitioning(false);
    setStepLoadingStates(prev => ({ ...prev, [newStep]: false }));
  }, [wizardState, onStateChange]);
  
  // Generate real-time preview data
  const generatePreviewData = useCallback(() => {
    const { config } = wizardState;
    
    return {
      basicInfo: {
        name: config.name || '',
        englishName: config.englishName || '',
        type: config.baseType || '',
        description: config.description || ''
      },
      enhancements: (config.enhancements || []).filter(e => e.enabled),
      validation: config.validation || [],
      dataSource: config.dataSource,
      settings: {
        isRequired: config.isRequired || false,
        placeholder: config.placeholder || '',
        helpText: config.helpText || ''
      }
    };
  }, [wizardState.config]);
  
  // Get actual step index considering field type-specific logic
  const getActualStepForNavigation = useCallback((targetStep: number, baseType?: string): number => {
    // For text fields, skip enhancement step (step 1)
    if (baseType === 'text') {
      if (targetStep === 1) {
        // Skip to data source step
        return 2;
      }
      // Adjust for skipped step
      if (targetStep > 1) {
        return targetStep;
      }
    }
    return targetStep;
  }, []);

  // Enhanced config update with optimized validation
  const handleConfigUpdate = useCallback((updates: Partial<SmartFieldConfig>) => {
    const newConfig = { ...wizardState.config, ...updates };
    
    // Create optimized new state
    const newState = {
      ...wizardState,
      config: newConfig,
      errors: { ...wizardState.errors }
    };

    // Validate affected steps only, not all steps
    const affectedSteps = getAffectedSteps(updates, wizardState.currentStep);
    affectedSteps.forEach(stepIndex => {
      validateStep(stepIndex, newConfig, newState);
    });
    
    onStateChange(newState);
  }, [wizardState, onStateChange]);
  
  // Determine which steps are affected by config updates
  const getAffectedSteps = useCallback((updates: Partial<SmartFieldConfig>, currentStep: number): number[] => {
    const affected = [currentStep]; // Always validate current step
    
    // If base type changes, all subsequent steps are affected
    if (updates.baseType !== undefined) {
      for (let i = currentStep + 1; i < wizardState.steps.length; i++) {
        affected.push(i);
      }
    }
    
    // If name or englishName changes, final step is affected
    if (updates.name !== undefined || updates.englishName !== undefined) {
      affected.push(3); // Preview step
    }
    
    // If data source changes, final step is affected
    if (updates.dataSource !== undefined) {
      affected.push(3);
    }
    
    return [...new Set(affected)]; // Remove duplicates
  }, [wizardState.steps.length]);

  // Enhanced step validation with improved logic
  const validateStep = useCallback((stepIndex: number, config: Partial<SmartFieldConfig>, state: WizardState) => {
    const step = state.steps[stepIndex];
    let isValid = false;
    const errors = { ...state.errors };

    switch (stepIndex) {
      case 0: // Base Type
        isValid = !!config.baseType;
        if (!config.baseType) {
          errors.baseType = 'انتخاب نوع پایه الزامی است';
        } else {
          delete errors.baseType;
        }
        break;

      case 1: // Enhancements
        // Enhanced validation for enhancements step
        if (config.baseType === 'text') {
          // For text fields, this step is optional but can be accessed
          isValid = true;
          step.isComplete = false; // Mark as not required
        } else {
          // For other field types, enhancements are valid by default but can be configured
          isValid = true;
          step.isComplete = true;
          
          // Validate enhancement configurations if present
          if (config.enhancements && config.enhancements.length > 0) {
            const invalidEnhancements = config.enhancements.filter(e => 
              !e.type || typeof e.enabled !== 'boolean'
            );
            
            if (invalidEnhancements.length > 0) {
              errors.enhancements = 'برخی ویژگی‌ها پیکربندی نادرستی دارند';
              isValid = false;
            } else {
              delete errors.enhancements;
            }
          }
        }
        break;

      case 2: // Data Source
        // Enhanced data source validation
        const requiresDataSource = config.baseType === 'choice' || config.baseType === 'reference';
        
        if (requiresDataSource) {
          isValid = !!config.dataSource;
          if (!config.dataSource) {
            errors.dataSource = 'تعریف منبع داده برای این نوع فیلد الزامی است';
          } else {
            // Validate data source configuration
            const dataSource = config.dataSource;
            if (!dataSource.type) {
              errors.dataSource = 'نوع منبع داده باید مشخص شود';
              isValid = false;
            } else if (dataSource.type === 'manual' && 
                      (!dataSource.config.items || dataSource.config.items.length === 0)) {
              errors.dataSource = 'برای منبع دستی، حداقل یک گزینه لازم است';
              isValid = false;
            } else if (dataSource.type === 'category' && !dataSource.config.categoryId) {
              errors.dataSource = 'برای منبع دسته‌بندی، انتخاب دسته الزامی است';
              isValid = false;
            } else {
              delete errors.dataSource;
            }
          }
        } else {
          // For field types that don't need data source
          isValid = true;
          delete errors.dataSource;
        }
        
        step.isComplete = isValid;
        break;

      case 3: // Preview
        // Comprehensive final validation
        const requiredFields = ['name', 'englishName', 'baseType'];
        const missingFields = requiredFields.filter(field => !config[field as keyof SmartFieldConfig]);
        
        isValid = missingFields.length === 0;
        
        // Individual field validation
        if (!config.name?.trim()) {
          errors.name = 'نام فیلد الزامی است';
        } else {
          delete errors.name;
        }
        
        if (!config.englishName?.trim()) {
          errors.englishName = 'نام انگلیسی الزامی است';
        } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(config.englishName)) {
          errors.englishName = 'نام انگلیسی باید با حرف شروع شود و فقط شامل حروف، اعداد و _ باشد';
          isValid = false;
        } else {
          delete errors.englishName;
        }
        
        if (!config.baseType) {
          errors.baseType = 'انتخاب نوع پایه الزامی است';
          isValid = false;
        } else {
          delete errors.baseType;
        }
        
        // Type-specific validation
        if (config.baseType === 'number' && config.enhancements) {
          const rangeEnhancement = config.enhancements.find(e => e.type === 'range' && e.enabled);
          if (rangeEnhancement && rangeEnhancement.config) {
            const { min, max } = rangeEnhancement.config;
            if (min !== undefined && max !== undefined && min > max) {
              errors.range = 'مقدار حداقل نمی‌تواند بیشتر از مقدار حداکثر باشد';
              isValid = false;
            } else {
              delete errors.range;
            }
          }
        }
        
        if ((config.baseType === 'choice' || config.baseType === 'reference') && !config.dataSource) {
          errors.dataSource = 'تعریف منبع داده برای این نوع فیلد الزامی است';
          isValid = false;
        }
        
        step.isComplete = isValid;
        break;
    }

    // Update step validation
    step.isValid = isValid;
    state.errors = errors;
  }, []);

  // Optimized validation with minimal re-rendering
  const validateCurrentStep = useCallback(() => {
    const currentStepIndex = wizardState.currentStep;
    const currentConfig = wizardState.config;
    
    // Create shallow copy instead of deep copy for better performance
    const newState = {
      ...wizardState,
      steps: wizardState.steps.map((step, index) => 
        index === currentStepIndex ? { ...step } : step
      ),
      errors: { ...wizardState.errors }
    };
    
    // Validate only current step to reduce computation
    validateStep(currentStepIndex, currentConfig, newState);
    
    // Only update if validation state actually changed
    const currentStep = wizardState.steps[currentStepIndex];
    const newStep = newState.steps[currentStepIndex];
    
    if (currentStep.isValid !== newStep.isValid || 
        currentStep.isComplete !== newStep.isComplete ||
        Object.keys(wizardState.errors).length !== Object.keys(newState.errors).length) {
      onStateChange(newState);
    }
  }, [wizardState, onStateChange, validateStep]);
  
  // Debounced validation to prevent excessive re-renders
  const debouncedValidation = useMemo(
    () => {
      let timeoutId: NodeJS.Timeout;
      return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(validateCurrentStep, 100); // 100ms debounce
      };
    },
    [validateCurrentStep]
  );
  
  // Auto-advance logic with performance optimization
  useEffect(() => {
    const currentStep = wizardState.steps[wizardState.currentStep];
    if (currentStep?.isValid && wizardState.currentStep === 0) {
      // Auto-advance from base type if configured
      // This can be customized based on UX preferences
    }
  }, [wizardState.currentStep, wizardState.steps]);

  // Optimized validation trigger
  useEffect(() => {
    // Only trigger validation when actually needed
    if (wizardState.config.baseType || wizardState.config.name || wizardState.config.englishName) {
      debouncedValidation();
    }
  }, [
    wizardState.config.baseType,
    wizardState.config.name, 
    wizardState.config.englishName,
    wizardState.config.dataSource,
    debouncedValidation
  ]);

  // Optimized navigation handlers with memoization
  const handleNext = useCallback(() => {
    const currentStep = wizardState.currentStep;
    const maxSteps = wizardState.steps.length;
    
    if (currentStep < maxSteps - 1) {
      // For text fields, skip the enhancements step (step 1)
      if (currentStep === 0 && wizardState.config.baseType === 'text') {
        handleStepChange(2); // Go directly to data source
      } else {
        handleStepChange(currentStep + 1);
      }
    } else {
      // Final step - complete wizard
      if (isConfigComplete()) {
        const finalConfig = generateFinalConfig();
        onComplete(finalConfig);
      }
    }
  }, [wizardState.currentStep, wizardState.config.baseType, wizardState.steps.length, handleStepChange, isConfigComplete, generateFinalConfig, onComplete]);

  // Optimized back navigation
  const handleBack = useCallback(() => {
    const currentStep = wizardState.currentStep;
    
    if (currentStep > 0) {
      // For text fields, skip the enhancements step (step 1) when going back
      if (currentStep === 2 && wizardState.config.baseType === 'text') {
        handleStepChange(0); // Go directly to base type
      } else {
        handleStepChange(currentStep - 1);
      }
    }
  }, [wizardState.currentStep, wizardState.config.baseType, handleStepChange]);

  // Memoized config completion check
  const isConfigComplete = useCallback((): boolean => {
    const { config } = wizardState;
    const hasBasicFields = !!(config.name && config.englishName && config.baseType);
    const hasDataSourceIfNeeded = (config.baseType !== 'choice' && config.baseType !== 'reference') || !!config.dataSource;
    
    return hasBasicFields && hasDataSourceIfNeeded;
  }, [wizardState.config]);

  // Optimized final config generation
  const generateFinalConfig = useCallback((): SmartFieldConfig => {
    const { config } = wizardState;
    
    return {
      id: config.id || `field_${Date.now()}`,
      name: config.name || '',
      englishName: config.englishName || '',
      description: config.description,
      baseType: config.baseType!,
      enhancements: config.enhancements || [],
      dataSource: config.dataSource,
      validation: config.validation || [],
      isRequired: config.isRequired || false,
      order: config.order || 1,
      placeholder: config.placeholder,
      helpText: config.helpText,
      conditional: config.conditional,
      generatedConfig: {
        finalSettings: {
          name: config.name,
          englishName: config.englishName,
          placeholder: config.placeholder,
          helpText: config.helpText,
          isRequired: config.isRequired || false,
          order: config.order || 1
        },
        enhancements: config.enhancements?.reduce((acc, enhancement) => {
          if (enhancement.enabled) {
            acc[enhancement.type] = enhancement.config;
          }
          return acc;
        }, {} as Record<string, any>) || {},
        baseFieldConfig: {
          baseType: config.baseType,
          dataSource: config.dataSource,
          validation: config.validation
        }
      }
    };
  }, [wizardState.config]);

  // Enhanced step content rendering with loading states
  const renderStepContent = useCallback((stepIndex: number) => {
    // Show loading indicator for step
    if (stepLoadingStates[stepIndex]) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography variant="body2" color="text.secondary">
            در حال بارگذاری...
          </Typography>
        </Box>
      );
    }
    
    // For text fields, skip the enhancements step (step 1)
    if (wizardState.config.baseType === 'text' && stepIndex === 1) {
      return (
        <Fade in timeout={300}>
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              برای فیلدهای متنی، ویژگی‌های هوشمند تعریف نشده است.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              می‌توانید مستقیماً به مرحله بعد بروید.
            </Typography>
          </Box>
        </Fade>
      );
    }
    
    const props = {
      config: wizardState.config,
      onConfigUpdate: handleConfigUpdate,
      fieldContext,
      errors: wizardState.errors,
      editingField,
      previewData: stepIndex === 3 ? previewData : undefined // Pass preview data to preview step
    };

    const stepContent = (() => {
      switch (stepIndex) {
        case 0:
          return <BaseTypeStep {...props} />;
        case 1:
          return <EnhancementsStep {...props} />;
        case 2:
          return <DataSourceStep {...props} />;
        case 3:
          return <PreviewStep {...props} />;
        default:
          return null;
      }
    })();
    
    return (
      <Fade in timeout={400}>
        <Box>{stepContent}</Box>
      </Fade>
    );
  }, [wizardState, handleConfigUpdate, fieldContext, editingField, stepLoadingStates, previewData]);

  // Get the actual step index considering text field skipping
  const getActualStepIndex = (displayIndex: number): number => {
    if (wizardState.config.baseType === 'text') {
      // For text fields: 0->0, 1->2, 2->3 (skip enhancements step)
      if (displayIndex === 0) return 0;
      if (displayIndex === 1) return 2;
      if (displayIndex === 2) return 3;
      return displayIndex;
    }
    return displayIndex;
  };

  // Get the display step index considering text field skipping
  const getDisplayStepIndex = (actualIndex: number): number => {
    if (wizardState.config.baseType === 'text') {
      // For text fields: 0->0, 2->1, 3->2 (skip enhancements step)
      if (actualIndex === 0) return 0;
      if (actualIndex === 1) return 0; // This shouldn't happen but just in case
      if (actualIndex === 2) return 1;
      if (actualIndex === 3) return 2;
      return actualIndex - 1;
    }
    return actualIndex;
  };

  // Check if step should be skipped for current field type
  const isStepSkipped = (stepIndex: number): boolean => {
    // For text fields, skip the enhancements step (step 1)
    if (wizardState.config.baseType === 'text' && stepIndex === 1) {
      return true;
    }
    return false;
  };

  // Get visible steps (excluding skipped steps)
  const getVisibleSteps = () => {
    return wizardState.steps.filter((_, index) => !isStepSkipped(index));
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Enhanced Progress Header */}
      <Box sx={{ 
        mb: 3, 
        p: 2, 
        backgroundColor: alpha(theme.palette.primary.main, 0.05),
        borderRadius: 1,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" color="primary.main">
            ساخت فیلد هوشمند
          </Typography>
          <Typography variant="body2" color="text.secondary">
            مرحله {getDisplayStepIndex(wizardState.currentStep) + 1} از {getVisibleSteps().length}
          </Typography>
        </Box>
        
        {/* Progress Bar */}
        <Box sx={{ mb: 1 }}>
          <LinearProgress 
            variant="determinate" 
            value={(getDisplayStepIndex(wizardState.currentStep) + 1) / getVisibleSteps().length * 100}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                transition: 'transform 0.4s ease-in-out'
              }
            }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="primary.main">
            <strong>پیشرفت:</strong> {wizardState.config.baseType && (
              <span> • نوع انتخابی: {getBaseTypeLabel(wizardState.config.baseType)}</span>
            )}
          </Typography>
          
          {isTransitioning && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary">
                در حال بررسی...
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
      
      {/* Enhanced Stepper with Transitions */}
      <Stepper 
        activeStep={getDisplayStepIndex(wizardState.currentStep)} 
        orientation="vertical"
        sx={{
          '& .MuiStepLabel-root': {
            cursor: 'pointer'
          },
          '& .MuiStepContent-root': {
            borderLeft: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            ml: 1
          }
        }}
      >
        {wizardState.steps.map((step, index) => {
          // Skip steps that should not be shown for current field type
          if (isStepSkipped(index)) {
            return null;
          }
          
          const displayIndex = getDisplayStepIndex(index);
          const isCurrentStep = wizardState.currentStep === index;
          const isCompleted = step.isComplete;
          
          return (
            <Step key={step.step} completed={isCompleted}>
              <StepLabel
                onClick={() => wizardState.isNavigationEnabled && handleStepChange(index)}
                sx={{
                  '& .MuiStepLabel-label': {
                    fontSize: '1.1rem',
                    fontWeight: isCurrentStep ? 600 : 400
                  }
                }}
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </Box>
              </StepLabel>
              
              <StepContent>
                <Box sx={{ py: 2 }}>
                  {renderStepContent(index)}
                  
                  {/* Navigation Buttons */}
                  <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                    <Button
                      disabled={wizardState.currentStep === 0}
                      onClick={handleBack}
                      startIcon={<BackIcon />}
                      variant="outlined"
                    >
                      قبلی
                    </Button>
                    
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={!wizardState.steps[wizardState.currentStep]?.isValid}
                      endIcon={
                        wizardState.currentStep === wizardState.steps.length - 1 
                          ? undefined 
                          : <NextIcon />
                      }
                    >
                      {wizardState.currentStep === wizardState.steps.length - 1 
                        ? 'تکمیل ساخت فیلد' 
                        : 'بعدی'
                      }
                    </Button>
                  </Box>
                </Box>
              </StepContent>
            </Step>
          );
        })}
      </Stepper>

      {/* Progress indicator */}
      <Box 
        sx={{ 
          mt: 3, 
          p: 2, 
          backgroundColor: alpha(theme.palette.primary.main, 0.05),
          borderRadius: 1,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
        }}
      >
        <Typography variant="body2" color="primary.main">
          <strong>پیشرفت:</strong> مرحله {getDisplayStepIndex(wizardState.currentStep) + 1} از {getVisibleSteps().length}
          {wizardState.config.baseType && (
            <span> • نوع انتخابی: {getBaseTypeLabel(wizardState.config.baseType)}</span>
          )}
        </Typography>
      </Box>
    </Box>
  );
};

// Helper function to get base type label
const getBaseTypeLabel = (baseType: string): string => {
  const labels: Record<string, string> = {
    text: 'متن',
    number: 'عدد',
    choice: 'انتخابی',
    reference: 'مرجع'
  };
  return labels[baseType] || baseType;
};

export default GuidedWizard;