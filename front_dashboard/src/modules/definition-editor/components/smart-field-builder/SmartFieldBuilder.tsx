import React, { 
  useState, 
  useEffect, 
  useCallback, 
  useMemo, 
  useRef, 
  Suspense, 
  lazy 
} from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  alpha,
  LinearProgress,
  useTheme,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Settings as SettingsIcon,
  AutoAwesome as WizardIcon,
  Dashboard as TemplateIcon,
  Edit as EditIcon,
  Close as CloseIcon
} from '@mui/icons-material';

// Import accessibility helpers
import { 
  ARIA_LABELS, 
  KEYBOARD_SHORTCUTS, 
  FocusManager, 
  KeyboardEventHandler, 
  ScreenReaderUtils,
  AriaHelper
} from './utils/accessibilityHelpers';

// Lazy load components
const BuilderModeSelector = lazy(() => import('./BuilderModeSelector'));
const GuidedWizard = lazy(() => import('./GuidedWizard'));
const OptimizedTemplateSelector = lazy(() => import('./components/templates/OptimizedTemplateSelector'));
const TemplateCustomizer = lazy(() => import('./components/templates/TemplateCustomizer'));

// Import types
import { SmartFieldConfig, WizardState } from './types/smartFieldTypes';
import { BuilderMode } from './BuilderModeSelector';

interface SmartFieldBuilderProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: SmartFieldConfig | SmartFieldConfig[]) => void;
  existingFields?: any[];
  editingField?: any;
  categoryContext?: string;
}

const SmartFieldBuilder: React.FC<SmartFieldBuilderProps> = React.memo(({ 
  open,
  onClose,
  onSave,
  existingFields = [],
  editingField,
  categoryContext
}) => {
  const theme = useTheme();
  
  // Core state management - simplified
  const [builderMode, setBuilderMode] = useState<BuilderMode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [finalConfig, setFinalConfig] = useState<SmartFieldConfig | SmartFieldConfig[] | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<SmartFieldConfig | SmartFieldConfig[] | null>(null);
  const [showTemplateCustomizer, setShowTemplateCustomizer] = useState(false);
  
  // Field data for form management
  const [fieldData, setFieldData] = useState<any>(() => editingField || {});
  
  // Animation state
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward' | 'none'>('none');
  const [previousMode, setPreviousMode] = useState<BuilderMode | null>(null);
  
  // Accessibility state
  const [keyboardHandler] = useState(() => new KeyboardEventHandler());
  const [focusTrapCleanup, setFocusTrapCleanup] = useState<(() => void) | null>(null);
  
  // Initialize wizard state
  const [wizardState, setWizardState] = useState<WizardState>({
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
        isValid: true, // Enhancements are optional, so this step is always valid
        isComplete: true // Mark as complete since it's always valid
      },
      {
        step: 2,
        title: 'منبع داده',
        description: 'منبع اطلاعات فیلد را تعریف کنید',
        isValid: true, // Valid by default, will be validated based on field type
        isComplete: true // Mark as complete initially
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
  });
  
  // Refs for DOM access
  const modalRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);

  // Setup accessibility features
  useEffect(() => {
    if (open && modalRef.current) {
      // Register keyboard shortcuts
      keyboardHandler.registerShortcuts([
        { ...KEYBOARD_SHORTCUTS.CLOSE_MODAL, action: onClose },
        { ...KEYBOARD_SHORTCUTS.SAVE_FIELD, action: handleSaveShortcut },
        { ...KEYBOARD_SHORTCUTS.RESET_FORM, action: handleReset }
      ]);

      // Create focus trap
      const cleanup = FocusManager.createFocusTrap(modalRef.current);
      setFocusTrapCleanup(() => cleanup);

      // Add keyboard event listener
      document.addEventListener('keydown', keyboardHandler.handleKeyDown);

      // Announce modal opening
      ScreenReaderUtils.announceLoading('مودال ساخت فیلد هوشمند باز شد');

      return () => {
        document.removeEventListener('keydown', keyboardHandler.handleKeyDown);
        keyboardHandler.clearShortcuts();
        if (cleanup) cleanup();
      };
    }
  }, [open, keyboardHandler, onClose]);

  // Handle save action for keyboard shortcuts
  const handleSaveShortcut = useCallback(() => {
    if (finalConfig) {
      onSave(finalConfig);
      ScreenReaderUtils.announceSuccess('فیلد با موفقیت ذخیره شد');
    }
  }, [finalConfig, onSave]);

  // Handle reset action
  const handleReset = useCallback(() => {
    setBuilderMode(null);
    setFinalConfig(null);
    setSelectedTemplate(null);
    setShowTemplateCustomizer(false);
    setFieldData(editingField || {});
    ScreenReaderUtils.announceSuccess('فرم بازنشانی شد');
  }, [editingField]);

  // Reset states when dialog opens/closes
  useEffect(() => {
    if (open && !isInitializedRef.current) {
      // Only reset if we're actually opening the modal for the first time
      // or if the editing field has changed
      setBuilderMode(null);
      setFinalConfig(null);
      setSelectedTemplate(null);
      setShowTemplateCustomizer(false);
      setPreviousMode(null);
      setTransitionDirection('none');
      const initialData = editingField ? { ...editingField } : {};
      setFieldData(initialData);
      setWizardState((prev: WizardState) => ({
        ...prev,
        currentStep: 0,
        config: initialData,
        errors: {},
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
            isValid: true, // Enhancements are optional, so this step is always valid
            isComplete: true // Mark as complete since it's always valid
          },
          {
            step: 2,
            title: 'منبع داده',
            description: 'منبع اطلاعات فیلد را تعریف کنید',
            isValid: true, // Valid by default, will be validated based on field type
            isComplete: true // Mark as complete initially
          },
          {
            step: 3,
            title: 'پیش‌نمایش',
            description: 'نتیجه نهایی را بررسی و تأیید کنید',
            isValid: false,
            isComplete: false
          }
        ]
      }));
      isInitializedRef.current = true;
    } else if (!open) {
      isInitializedRef.current = false;
    }
  }, [open, editingField?.id]); // Only depend on open and editingField.id to prevent unnecessary resets

  // Handle mode selection
  const handleModeSelect = useCallback((mode: BuilderMode) => {
    const direction = previousMode === null ? 'none' : 'forward';
    setTransitionDirection(direction);
    setPreviousMode(builderMode);
    setBuilderMode(mode);
  }, [previousMode, builderMode]);

  // Handle wizard completion
  const handleWizardComplete = useCallback(async (config: SmartFieldConfig) => {
    setFinalConfig(config);
    setFieldData(config);
  }, []);

  // Handle template selection
  const handleTemplateSelect = useCallback((config: SmartFieldConfig | SmartFieldConfig[]) => {
    setTransitionDirection('forward');
    setSelectedTemplate(config);
    setShowTemplateCustomizer(true);
  }, []);

  // Handle template customization complete
  const handleTemplateCustomized = useCallback((config: SmartFieldConfig[]) => {
    const finalConfig = Array.isArray(config) && config.length === 1 ? config[0] : config;
    setFinalConfig(finalConfig);
    setFieldData(finalConfig);
    setShowTemplateCustomizer(false);
  }, []);

  // Handle template customization cancel with animation
  const handleTemplateCustomizationCancel = useCallback(() => {
    setTransitionDirection('backward');
    setSelectedTemplate(null);
    setShowTemplateCustomizer(false);
  }, []);

  // Handle save
  const handleSave = async () => {
    if (!finalConfig) return;
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSave(finalConfig);
      onClose();
    } catch (error) {
      console.error('Error saving smart field:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    setBuilderMode(null);
    setFinalConfig(null);
    setSelectedTemplate(null);
    setShowTemplateCustomizer(false);
    setFieldData({});
    onClose();
  };

  // Handle back to mode selection
  const handleBackToModeSelection = useCallback(() => {
    setTransitionDirection('backward');
    setPreviousMode(builderMode);
    setBuilderMode(null);
    setFinalConfig(null);
    setSelectedTemplate(null);
    setShowTemplateCustomizer(false);
  }, [builderMode]);

  // Progress calculation
  const progress = useMemo(() => {
    if (!builderMode) return 0;
    if (builderMode === BuilderMode.GUIDED) {
      const completedSteps = wizardState.steps.filter(s => s.isComplete).length;
      return (completedSteps / wizardState.steps.length) * 100;
    }
    if (builderMode === BuilderMode.TEMPLATE) {
      if (finalConfig) return 100;
      if (showTemplateCustomizer) return 75;
      if (selectedTemplate) return 50;
      return 25;
    }
    return 25;
  }, [builderMode, wizardState.steps, finalConfig, showTemplateCustomizer, selectedTemplate]);

  // Loading component
  const LoadingFallback = ({ message }: { message: string }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 2 }}>
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">{message}</Typography>
    </Box>
  );

  return (
    <Dialog
      ref={modalRef}
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      aria-labelledby="smart-field-builder-title"
      aria-describedby="smart-field-builder-description"
      aria-modal="true"
      role="dialog"
      PaperProps={{
        sx: {
          height: { xs: '100vh', sm: 'auto' },
          maxHeight: { xs: '100vh', sm: '90vh' },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle 
        id="smart-field-builder-title"
        sx={{ 
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Typography component="h2" variant="h6">
          {editingField ? 'ویرایش فیلد' : 'ساخت فیلد هوشمند'}
        </Typography>
        <Button
          onClick={onClose}
          size="small"
          aria-label={ARIA_LABELS.closeModal}
          sx={{ minWidth: 'auto', p: 1 }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>
      
      {/* Hidden description for screen readers */}
      <Typography
        id="smart-field-builder-description"
        sx={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
      >
        {builderMode === BuilderMode.GUIDED
          ? ARIA_LABELS.wizardSection
          : builderMode === BuilderMode.TEMPLATE
          ? ARIA_LABELS.templateSection
          : 'انتخاب روش ساخت فیلد هوشمند'}
      </Typography>
    
      <DialogContent 
        sx={{ 
          p: 0, 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden' 
        }}
        role="main"
        aria-live="polite"
      >
        {!builderMode ? (
          <Suspense fallback={<LoadingFallback message="در حال بارگذاری..." />}>
            <BuilderModeSelector onModeSelect={handleModeSelect} editingField={editingField} />
          </Suspense>
        ) : builderMode === BuilderMode.GUIDED ? (
          <Suspense fallback={<LoadingFallback message="در حال بارگذاری راهنما..." />}>
            <GuidedWizard
              wizardState={wizardState}
              onStateChange={setWizardState}
              onComplete={handleWizardComplete}
              existingFields={existingFields}
              categoryContext={categoryContext}
              editingField={editingField}
            />
          </Suspense>
        ) : showTemplateCustomizer && selectedTemplate ? (
          <Suspense fallback={<LoadingFallback message="در حال بارگذاری سفارشی‌ساز..." />}>
            <TemplateCustomizer
              template={selectedTemplate}
              onSave={handleTemplateCustomized}
              onCancel={handleTemplateCustomizationCancel}
              existingFields={existingFields}
            />
          </Suspense>
        ) : (
          <Suspense fallback={<LoadingFallback message="در حال بارگذاری قالب‌ها..." />}>
            <OptimizedTemplateSelector
              onTemplateSelect={handleTemplateSelect}
              existingFields={existingFields}
              categoryContext={categoryContext}
              editingField={editingField}
            />
          </Suspense>
        )}
      </DialogContent>
      
      <DialogActions 
        sx={{ 
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`, 
          gap: 1,
          p: 2
        }}
        role="toolbar"
        aria-label="عملیات فیلد"
      >
        {builderMode && (
          <Button
            onClick={showTemplateCustomizer ? handleTemplateCustomizationCancel : handleBackToModeSelection}
            variant="outlined"
            disabled={isLoading}
            aria-label="بازگشت به مرحله قبل"
          >
            بازگشت
          </Button>
        )}
        <Button 
          onClick={handleClose} 
          variant="outlined" 
          color="error" 
          disabled={isLoading}
          aria-label={ARIA_LABELS.cancel}
        >
          انصراف
        </Button>
        {finalConfig && (
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={isLoading}
            aria-label={editingField ? ARIA_LABELS.save : 'ایجاد فیلد'}
          >
            {isLoading ? <CircularProgress size={20} aria-label={ARIA_LABELS.loading} /> : (editingField ? 'ذخیره' : 'ایجاد')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
});

SmartFieldBuilder.displayName = 'SmartFieldBuilder';
export default SmartFieldBuilder;