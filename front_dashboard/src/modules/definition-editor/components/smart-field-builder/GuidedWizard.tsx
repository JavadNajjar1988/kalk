import React, { useCallback, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  alpha,
  useTheme,
  StepConnector,
  stepConnectorClasses,
  StepIconProps,
  styled,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  NavigateBefore as BackIcon,
  NavigateNext as NextIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncompletedIcon,
  FiberManualRecord as CurrentIcon
} from '@mui/icons-material';

import { 
  WizardState, 
  SmartFieldConfig,
  FieldContext
} from './types/smartFieldTypes';

// Import step components
import BaseTypeStep from './components/wizard/steps/BaseTypeStep';
import EnhancementsStep from './components/wizard/steps/EnhancementsStep';
import DataSourceStep from './components/wizard/steps/DataSourceStep';
import PreviewStep from './components/wizard/steps/PreviewStep';

// Custom Stepper Components for Horizontal Layout
const HorizontalConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      display: 'none'
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      display: 'none'
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    display: 'none'
  },
}));

const CustomStepIcon = (props: StepIconProps) => {
  const { active, completed, className, icon } = props;
  const theme = useTheme();

  const iconSx = {
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    fontWeight: 600,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    border: '2px solid',
  };

  if (completed) {
    return (
      <Box
        className={className}
        sx={{
          ...iconSx,
          backgroundColor: theme.palette.success.main,
          borderColor: theme.palette.success.main,
          color: 'white',
          boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.3)}`,
          '&:hover': {
            transform: 'scale(1.1)',
            boxShadow: `0 6px 20px ${alpha(theme.palette.success.main, 0.4)}`,
          }
        }}
      >
        <CheckIcon sx={{ fontSize: 24 }} />
      </Box>
    );
  }

  if (active) {
    return (
      <Box
        className={className}
        sx={{
          ...iconSx,
          backgroundColor: theme.palette.primary.main,
          borderColor: theme.palette.primary.main,
          color: 'white',
          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
          animation: 'pulse 2s infinite',
          '@keyframes pulse': {
            '0%': { transform: 'scale(1)', opacity: 1 },
            '50%': { transform: 'scale(1.05)', opacity: 0.9 },
            '100%': { transform: 'scale(1)', opacity: 1 },
          },
          '&:hover': {
            transform: 'scale(1.1)',
            boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
          }
        }}
      >
        {icon}
      </Box>
    );
  }

  return (
    <Box
      className={className}
      sx={{
        ...iconSx,
        backgroundColor: alpha(theme.palette.grey[300], 0.3),
        borderColor: alpha(theme.palette.grey[400], 0.5),
        color: theme.palette.grey[600],
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
          borderColor: alpha(theme.palette.primary.main, 0.3),
          color: theme.palette.primary.main,
          transform: 'scale(1.05)',
        }
      }}
    >
      {icon}
    </Box>
  );
};

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

  // Create field context for smart suggestions
  const fieldContext: FieldContext = {
    categoryType: categoryContext,
    existingFields,
    currentCategory: categoryContext,
    usagePatterns: {} // To be implemented with analytics
  };

  // Handle step change
  const handleStepChange = useCallback((newStep: number) => {
    if (newStep >= 0 && newStep < wizardState.steps.length) {
      onStateChange({
        ...wizardState,
        currentStep: newStep
      });
    }
  }, [wizardState, onStateChange]);

  // Handle config update
  const handleConfigUpdate = useCallback((updates: Partial<SmartFieldConfig>) => {
    const newConfig = { ...wizardState.config, ...updates };
    
    // Update wizard state
    const newState = {
      ...wizardState,
      config: newConfig,
      errors: { ...wizardState.errors }
    };

    // Validate current step
    validateStep(wizardState.currentStep, newConfig, newState);
    
    onStateChange(newState);
  }, [wizardState, onStateChange]);

  // Validate individual step
  const validateStep = (stepIndex: number, config: Partial<SmartFieldConfig>, state: WizardState) => {
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
        isValid = true; // Enhancements are optional
        break;

      case 2: // Data Source
        isValid = true; // Data source configuration validation
        if (config.baseType === 'choice' || config.baseType === 'reference') {
          isValid = !!config.dataSource;
          if (!config.dataSource) {
            errors.dataSource = 'تعریف منبع داده برای این نوع فیلد الزامی است';
          } else {
            delete errors.dataSource;
          }
        }
        break;

      case 3: // Preview
        isValid = !!config.name && !!config.englishName && !!config.baseType;
        if (!config.name) {
          errors.name = 'نام فیلد الزامی است';
        } else {
          delete errors.name;
        }
        if (!config.englishName) {
          errors.englishName = 'نام انگلیسی الزامی است';
        } else {
          delete errors.englishName;
        }
        break;
    }

    // Update step validation
    step.isValid = isValid;
    step.isComplete = isValid;
    state.errors = errors;
  };

  // Handle next step
  const handleNext = () => {
    if (wizardState.currentStep < wizardState.steps.length - 1) {
      handleStepChange(wizardState.currentStep + 1);
    } else {
      // Final step - complete wizard
      if (isConfigComplete()) {
        const finalConfig = generateFinalConfig();
        onComplete(finalConfig);
      }
    }
  };

  // Handle previous step
  const handleBack = () => {
    if (wizardState.currentStep > 0) {
      handleStepChange(wizardState.currentStep - 1);
    }
  };

  // Check if configuration is complete
  const isConfigComplete = (): boolean => {
    const { config } = wizardState;
    return !!(
      config.name &&
      config.englishName &&
      config.baseType &&
      (config.baseType !== 'choice' && config.baseType !== 'reference' || config.dataSource)
    );
  };

  // Generate final configuration
  const generateFinalConfig = (): SmartFieldConfig => {
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
      generatedConfig: {}
    };
  };

  // Render step content
  const renderStepContent = (stepIndex: number) => {
    const props = {
      config: wizardState.config,
      onConfigUpdate: handleConfigUpdate,
      fieldContext,
      errors: wizardState.errors,
      editingField
    };

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
  };

  // Auto-advance logic for certain steps
  useEffect(() => {
    const currentStep = wizardState.steps[wizardState.currentStep];
    if (currentStep?.isValid && wizardState.currentStep === 0) {
      // Auto-advance from base type if it's the only required field
      // This can be customized based on UX preferences
    }
  }, [wizardState]);

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: 0 // Ensure proper shrinking
    }}>
        {/* Header with Progress - فشرده */}
        <Box sx={{ 
          p: { xs: 1.5, sm: 2 }, 
          background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, transparent 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
          flex: '0 0 auto'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="h6" fontWeight={600} color="primary.main" sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>
              راهنمای هوشمند
            </Typography>
            <Chip 
              label={`مرحله ${wizardState.currentStep + 1} از ${wizardState.steps.length}`}
              color="primary"
              variant="filled"
              size="small"
              sx={{ fontWeight: 500, fontSize: '0.75rem' }}
            />
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={((wizardState.currentStep + 1) / wizardState.steps.length) * 100}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: alpha(theme.palette.grey[300], 0.3),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`
              }
            }}
          />
        </Box>

        {/* Horizontal Stepper - فشرده */}
        <Box sx={{ px: { xs: 1.5, sm: 2 }, pt: { xs: 1, sm: 1.5 }, flex: '0 0 auto' }}>
          <Stepper 
            activeStep={wizardState.currentStep} 
            alternativeLabel
            connector={<HorizontalConnector />}
            sx={{
              '& .MuiStepLabel-root': {
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover .MuiStepLabel-label': {
                  color: theme.palette.primary.main,
                  transform: 'translateY(-2px)'
                }
              },
              '& .MuiStepLabel-label': {
                fontSize: '0.9rem',
                fontWeight: 600,
                textAlign: 'center',
                marginTop: 1,
                transition: 'all 0.3s ease'
              },
              '& .MuiStepLabel-label.Mui-active': {
                color: theme.palette.primary.main,
                fontWeight: 700
              },
              '& .MuiStepLabel-label.Mui-completed': {
                color: theme.palette.success.main,
                fontWeight: 600
              }
            }}
          >
            {wizardState.steps.map((step, index) => {
              const stepIcons = [
                <span key="0">1</span>,
                <span key="1">2</span>, 
                <span key="2">3</span>,
                <span key="3">4</span>
              ];
              
              return (
                <Step key={step.step} completed={step.isComplete}>
                  <StepLabel
                    StepIconComponent={(props) => (
                      <CustomStepIcon {...props} icon={stepIcons[index]} />
                    )}
                    onClick={() => wizardState.isNavigationEnabled && handleStepChange(index)}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography 
                        variant="subtitle2" 
                        fontWeight={wizardState.currentStep === index ? 700 : 600}
                        color={wizardState.currentStep === index 
                          ? 'primary.main' 
                          : step.isComplete 
                            ? 'success.main'
                            : 'text.secondary'
                        }
                      >
                        {step.title}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                          display: { xs: 'none', sm: 'block' },
                          mt: 0.5,
                          width: '100%',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {step.description}
                      </Typography>
                    </Box>
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </Box>

        {/* Step Content - استفاده کامل از فضا */}
        <Box sx={{ 
          flex: '1 1 auto', 
          overflow: 'auto', 
          px: { xs: 1.5, sm: 2 },
          minHeight: 0, // Forces flex item to shrink
          maxHeight: 'calc(100% - 140px)' // Reserve space for footer
        }}>
          {renderStepContent(wizardState.currentStep)}
        </Box>

        {/* Navigation Footer - فشرده */}
        <Box sx={{ 
          p: { xs: 1.5, sm: 2 }, 
          background: `linear-gradient(90deg, transparent 0%, ${alpha(theme.palette.primary.main, 0.01)} 100%)`,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
          flex: '0 0 auto',
          minHeight: '80px', // Ensure minimum height for footer
          position: 'relative',
          zIndex: 1
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '48px' }}>
            {/* Left side - Progress info - فشرده */}
            <Box sx={{ display: { xs: 'none', md: 'block' }, maxWidth: '60%' }}>
              <Typography variant="body2" color="text.secondary" noWrap>
                {wizardState.steps.filter(s => s.isComplete).length} از {wizardState.steps.length} مرحله تکمیل شده
                {wizardState.config.baseType && (
                  <span> • نوع: {getBaseTypeLabel(wizardState.config.baseType)}</span>
                )}
              </Typography>
            </Box>
            
            {/* Right side - Navigation buttons فشرده */}
            <Box sx={{ display: 'flex', gap: 1.5, ml: 'auto' }}>
              <Button
                disabled={wizardState.currentStep === 0}
                onClick={handleBack}
                startIcon={<BackIcon />}
                variant="outlined"
                size="medium"
                sx={{ 
                  minWidth: 100,
                  fontWeight: 500,
                  borderColor: alpha(theme.palette.grey[400], 0.5)
                }}
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
                size="medium"
                sx={{
                  minWidth: 120,
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  boxShadow: `0 3px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&:hover': {
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
                    transform: 'translateY(-1px)'
                  },
                  '&:disabled': {
                    background: alpha(theme.palette.action.disabled, 0.12),
                    transform: 'none',
                    boxShadow: 'none'
                  }
                }}
              >
                {wizardState.currentStep === wizardState.steps.length - 1 
                  ? 'تکمیل ساخت فیلد' 
                  : 'بعدی'
                }
              </Button>
            </Box>
          </Box>
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