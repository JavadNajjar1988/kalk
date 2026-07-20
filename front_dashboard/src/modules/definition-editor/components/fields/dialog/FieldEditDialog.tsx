import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Paper,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Cancel as CancelIcon, Save as SaveIcon } from '@mui/icons-material';
import { FieldEditDialogProps } from '../types/FieldEditTypes';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';
import { validateFieldDefinition, ValidationError } from '../utils/fieldValidation';
import FieldSelectionPage from '../steps/FieldSelectionPage';
import StepIndicator from '../steps/StepIndicator';
import FieldTypeSelection from '../steps/FieldTypeSelection';
import FieldPropertiesStep from '../steps/FieldPropertiesStep';
import { FieldRulesStep } from '../steps/FieldRulesStep';
import { NumberFieldRulesStep } from '../steps/NumberFieldRulesStep';
import { FieldPreviewStep } from '../steps/FieldPreviewStep';

const FieldEditDialog: React.FC<FieldEditDialogProps> = ({
  open,
  field,
  isEditing,
  onClose,
  onSave,
}) => {
  const theme = useTheme();
  const accent = theme.palette.success.main;
  const dialogBackground = `linear-gradient(135deg, ${alpha(accent, 0.08)}, ${alpha(accent, 0.04)})`;
  const inputSurface =
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.background.default, 0.72)
      : alpha(theme.palette.common.white, 0.92);
  
  const [formData, setFormData] = useState<ExtendedCustomFieldDefinition | null>(null);
  const [currentPage, setCurrentPage] = useState<'selection' | 'create' | 'ready'>('selection');
  const [currentStep, setCurrentStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (field) {
      setFormData({ ...field });
      if (isEditing) {
        setCurrentPage('create');
        setCurrentStep(4); // Go to preview for editing
      }
    }
  }, [field, isEditing]);

  useEffect(() => {
    // Focus management for accessibility
    if (open && dialogRef.current) {
      // Find first focusable element
      const focusableElements = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0 && firstFocusableRef.current) {
        firstFocusableRef.current.focus();
      }
    }
  }, [open, currentPage, currentStep]);

  const handleSubmit = () => {
    if (formData && formData.name && formData.englishName) {
      // Validate field definition with type conversion support
      const originalType = field?.type;
      const validationResult = validateFieldDefinition(formData, originalType);
      
      if (validationResult.isValid) {
        onSave(formData);
        setCurrentPage('selection');
        setCurrentStep(1);
        setValidationErrors([]);
      } else {
        setValidationErrors(validationResult.errors);
        // Stay on current step to show validation errors
      }
    }
  };

  // Memoize steps to prevent recreation on every render
  const steps = useMemo(() => {
    const fieldTypeText = formData?.type === 'number' ? 'عددی' : formData?.type === 'reference' ? 'مرجع' : 'متنی';
    return [
      { number: 1, title: 'انتخاب نوع فیلد' },
      { number: 2, title: `ویژگی‌های فیلد ${fieldTypeText}` },
      { number: 3, title: `قوانین فیلد ${fieldTypeText}` },
      { number: 4, title: `پیش‌نمایش فیلد ${fieldTypeText}` },
    ];
  }, [formData?.type]);

  // Memoize change handler to prevent child re-renders
  const handleChange = useCallback((key: keyof ExtendedCustomFieldDefinition, value: any) => {
    if (formData) {
      setFormData({ ...formData, [key]: value });
    }
  }, [formData]);

  const handleClose = () => {
    onClose();
    setCurrentPage('selection');
    setCurrentStep(1);
  };

  const handleCreateField = () => {
    setFormData({
      id: '',
      name: '',
      englishName: '',
      type: 'text',
      isRequired: false,
      defaultValue: '',
      order: 1,
    });
    setCurrentPage('create');
    setCurrentStep(1);
  };

  const handleReadyFields = () => {
    setCurrentPage('ready');
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBackToSelection = () => {
    setCurrentPage('selection');
    setCurrentStep(1);
  };

  // Keyboard navigation handler
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Handle Escape key to close dialog
    if (event.key === 'Escape') {
      handleClose();
    }
    
    // Handle Enter key for form submission on preview step
    if (event.key === 'Enter' && currentStep === 4 && formData?.name && formData?.englishName) {
      // Only submit if focus is not on an input field to avoid accidental submission
      const activeElement = document.activeElement;
      if (activeElement && activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
        handleSubmit();
      }
    }
  };

  const renderCreateField = () => {
    if (!formData) return null;

    return (
      <Box
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
        }}
        onKeyDown={handleKeyDown}
        role="region"
        aria-label="فرم ساخت فیلد جدید"
        tabIndex={-1}
      >
        <StepIndicator steps={steps} currentStep={currentStep} />

        <Box sx={{ 
          p: 4, 
          minHeight: 400,
        }}>
          {currentStep === 1 && (
            <FieldTypeSelection formData={formData} onChange={handleChange} />
          )}

          {currentStep === 2 && (
            <FieldPropertiesStep formData={formData} onChange={handleChange} />
          )}

          {currentStep === 3 && (
            formData.type === 'number' ? (
              <NumberFieldRulesStep formData={formData} onChange={handleChange} />
            ) : (
              <FieldRulesStep formData={formData} onChange={handleChange} />
            )
          )}

          {currentStep === 4 && (
            <FieldPreviewStep formData={formData} originalType={field?.type} />
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderTop: `1px solid ${alpha(accent, 0.2)}`,
          }}
        >
          <Button
            onClick={currentStep === 1 ? handleBackToSelection : handlePrevStep}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              backgroundColor: 'rgba(148, 163, 184, 0.1)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              color: '#64748B',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: 'rgba(148, 163, 184, 0.15)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(148, 163, 184, 0.2)',
              },
            }}
            aria-label={currentStep === 1 ? 'بازگشت به انتخاب نوع فیلد' : 'مرحله قبل'}
          >
            {currentStep === 1 ? 'بازگشت' : 'مرحله قبل'}
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {currentStep === 4 ? (
              <Button
                onClick={handleSubmit}
                startIcon={<SaveIcon />}
                variant="contained"
                color="success"
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  '&:disabled': {
                    backgroundColor: alpha(accent, 0.2),
                    color: 'rgba(255, 255, 255, 0.7)',
                    transform: 'none',
                    boxShadow: 'none',
                  },
                }}
                disabled={!formData || !formData.name || !formData.englishName || !formData.name.trim() || !formData.englishName.trim()}
                aria-label="ذخیره فیلد"
              >
                ذخیره فیلد
              </Button>
            ) : (
              <Button
                onClick={handleNextStep}
                variant="contained"
                color="success"
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                }}
                aria-label="مرحله بعد"
              >
                مرحله بعد
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    );
  };

  const renderReadyFields = () => (
    <Box sx={{ p: 4 }}>
      <Paper
        sx={{
          p: 4,
          borderRadius: 3,
          backgroundColor: 'rgba(248, 250, 252, 0.9)',
          border: '1px solid rgba(203, 213, 225, 0.3)',
          textAlign: 'center',
        }}
        role="region"
        aria-label="فیلدهای آماده"
      >
        <Alert
          severity="info"
          sx={{
            backgroundColor: 'rgba(148, 163, 184, 0.1)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: 2,
            '& .MuiAlert-icon': {
              color: '#64748B',
            },
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#64748B', mb: 1 }}>
            به زودی در دسترس!
          </Typography>
          <Typography variant="body1">
            فیلدهای از پیش تعریف شده و آماده در نسخه‌های آینده اضافه خواهد شد
          </Typography>
        </Alert>
      </Paper>
      
      <Box sx={{ mt: 4 }}>
        <Button 
          onClick={handleBackToSelection}
          sx={{
            borderRadius: 2,
            px: 4,
            py: 1.5,
            background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.1) 0%, rgba(203, 213, 225, 0.05) 100%)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            color: '#64748B',
            fontWeight: 600,
            '&:hover': {
              background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.15) 0%, rgba(203, 213, 225, 0.1) 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(148, 163, 184, 0.2)',
            },
          }}
          aria-label="بازگشت به انتخاب نوع فیلد"
        >
          بازگشت
        </Button>
      </Box>
    </Box>
  );

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          backgroundColor: theme.palette.background.paper,
          backgroundImage: dialogBackground,
          border: `1px solid ${alpha(accent, 0.24)}`,
          boxShadow: `0 20px 60px ${alpha(accent, 0.3)}`,
          overflow: 'hidden',
          position: 'relative',
        },
        '& .MuiOutlinedInput-root': {
          backgroundColor: inputSurface,
          '& fieldset': { borderColor: alpha(accent, 0.28) },
          '&:hover fieldset': { borderColor: alpha(accent, 0.45) },
          '&.Mui-focused fieldset': {
            borderColor: accent,
            boxShadow: `0 0 0 3px ${alpha(accent, 0.12)}`,
          },
        },
        '& .MuiInputLabel-root.Mui-focused': {
          color: accent,
        },
      }}
      ref={dialogRef}
      aria-labelledby="field-edit-dialog-title"
      aria-describedby="field-edit-dialog-description"
      onKeyDown={handleKeyDown}
    >
      <DialogTitle
        sx={{
          borderBottom: `1px solid ${alpha(accent, 0.2)}`,
          backgroundColor: alpha(accent, 0.08),
          textAlign: 'center',
          py: 3,
          px: 3,
        }}
        id="field-edit-dialog-title"
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Typography 
            variant="h4"
            sx={{
              fontWeight: 700,
              color: accent,
            }}
          >
            {currentPage === 'selection' && (isEditing ? 'ویرایش فیلد' : 'افزودن فیلد جدید')}
            {currentPage === 'create' && 'ساخت فیلد جدید'}
            {currentPage === 'ready' && 'فیلدهای آماده'}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: alpha(accent, 0.16), backgroundColor: 'transparent' }} id="field-edit-dialog-description">
        {currentPage === 'selection' && (
          <FieldSelectionPage 
            onCreateField={handleCreateField}
            onReadyFields={handleReadyFields}
          />
        )}
        {currentPage === 'create' && renderCreateField()}
        {currentPage === 'ready' && renderReadyFields()}
      </DialogContent>
      {currentPage === 'selection' && (
        <DialogActions
          sx={{
            borderTop: `1px solid ${alpha(accent, 0.2)}`,
            backgroundColor: alpha(accent, 0.04),
            px: 3,
            py: 2,
          }}
        >
          <Button 
            onClick={handleClose} 
            startIcon={<CancelIcon />}
            variant="outlined"
            color="inherit"
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              borderColor: alpha(accent, 0.35),
            }}
            aria-label="انصراف و بستن"
            ref={firstFocusableRef}
          >
            انصراف
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default FieldEditDialog;