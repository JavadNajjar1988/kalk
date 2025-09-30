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
  useMediaQuery,
} from '@mui/material';
import { Cancel as CancelIcon, Save as SaveIcon } from '@mui/icons-material';
import { FieldEditDialogProps } from '../types/FieldEditTypes';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [formData, setFormData] = useState<ExtendedCustomFieldDefinition | null>(null);
  const [currentPage, setCurrentPage] = useState<'selection' | 'create' | 'ready'>('selection');
  const [currentStep, setCurrentStep] = useState(1);
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
    // Always save the field as it appears in the live preview
    if (formData) {
      onSave(formData);
      setCurrentPage('selection');
      setCurrentStep(1);
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
  }, [formData?.type, formData?.name, formData?.englishName]);

  // Memoize change handler to prevent child re-renders
  const handleChange = useCallback((key: keyof ExtendedCustomFieldDefinition, value: any) => {
    setFormData(prevData => {
      if (!prevData) return prevData;
      return { ...prevData, [key]: value };
    });
  }, []);

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
          background: 'linear-gradient(135deg, rgba(240, 248, 255, 0.95) 0%, rgba(230, 245, 255, 0.9) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(135, 206, 250, 0.05) 0%, rgba(173, 216, 230, 0.1) 50%, rgba(176, 224, 230, 0.05) 100%)',
            zIndex: -1,
          }
        }}
        onKeyDown={handleKeyDown}
        role="region"
        aria-label="فرم ساخت فیلد جدید"
        tabIndex={-1}
      >
        {/* Step Indicator - Hidden on mobile */}
        {!isMobile && <StepIndicator steps={steps} currentStep={currentStep} />}

        {/* Step Content */}
        <Box sx={{ 
          p: isMobile ? 2 : 4, 
          minHeight: isMobile ? 300 : 400,
          pt: isMobile ? 1 : undefined
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

        {/* Navigation Buttons */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: isMobile ? 2 : 3,
            background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.8) 0%, rgba(240, 248, 255, 0.6) 100%)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(135, 206, 250, 0.2)',
          }}
        >
          <Button
            onClick={currentStep === 1 ? handleBackToSelection : handlePrevStep}
            sx={{
              borderRadius: '12px',
              px: isMobile ? 2 : 3,
              py: isMobile ? 1 : 1.5,
              background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.1) 0%, rgba(203, 213, 225, 0.05) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              color: '#64748B',
              fontWeight: 600,
              fontSize: isMobile ? '0.8rem' : 'inherit',
              '&:hover': {
                background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.15) 0%, rgba(203, 213, 225, 0.1) 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(148, 163, 184, 0.2)',
              },
            }}
            aria-label={currentStep === 1 ? 'بازگشت به انتخاب نوع فیلد' : 'مرحله قبل'}
          >
            {currentStep === 1 ? 'بازگشت' : 'مرحله قبل'}
          </Button>

          <Box sx={{ display: 'flex', gap: isMobile ? 1 : 2 }}>
            {currentStep === 4 ? (
              <Button
                onClick={handleSubmit}
                startIcon={<SaveIcon />}
                sx={{
                  borderRadius: '12px',
                  px: isMobile ? 2 : 4,
                  py: isMobile ? 1 : 1.5,
                  background: 'linear-gradient(135deg, #4A90E2, #7BB3F0)',
                  color: 'white',
                  fontWeight: 600,
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 16px rgba(74, 144, 226, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  fontSize: isMobile ? '0.8rem' : 'inherit',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #3A7BC8, #6BA3E0)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(74, 144, 226, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                  },
                  '&:disabled': {
                    background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.5), rgba(203, 213, 225, 0.3))',
                    color: 'rgba(255, 255, 255, 0.7)',
                    transform: 'none',
                    boxShadow: 'none',
                  },
                }}
                disabled={false}
                aria-label="ذخیره فیلد"
              >
                {isMobile ? 'ذخیره' : 'ذخیره فیلد'}
              </Button>
            ) : (
              <Button
                onClick={handleNextStep}
                sx={{
                  borderRadius: '12px',
                  px: isMobile ? 2 : 4,
                  py: isMobile ? 1 : 1.5,
                  background: 'linear-gradient(135deg, #4A90E2, #7BB3F0)',
                  color: 'white',
                  fontWeight: 600,
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 16px rgba(74, 144, 226, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  fontSize: isMobile ? '0.8rem' : 'inherit',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #3A7BC8, #6BA3E0)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(74, 144, 226, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                  },
                }}
                aria-label="مرحله بعد"
              >
                {isMobile ? 'بعدی' : 'مرحله بعد'}
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    );
  };

  const renderReadyFields = () => (
    <Box sx={{ p: isMobile ? 2 : 4 }}>
      <Paper
        sx={{
          p: isMobile ? 2 : 4,
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.8) 100%)',
          backdropFilter: 'blur(10px)',
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
            borderRadius: '12px',
            '& .MuiAlert-icon': {
              color: '#64748B',
            },
          }}
        >
          <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 600, color: '#64748B', mb: 1 }}>
            به زودی در دسترس!
          </Typography>
          <Typography variant={isMobile ? "body2" : "body1"}>
            فیلدهای از پیش تعریف شده و آماده در نسخه‌های آینده اضافه خواهد شد
          </Typography>
        </Alert>
      </Paper>
      
      <Box sx={{ mt: isMobile ? 2 : 4 }}>
        <Button 
          onClick={handleBackToSelection}
          sx={{
            borderRadius: '12px',
            px: isMobile ? 2 : 4,
            py: isMobile ? 1 : 1.5,
            background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.1) 0%, rgba(203, 213, 225, 0.05) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            color: '#64748B',
            fontWeight: 600,
            fontSize: isMobile ? '0.8rem' : 'inherit',
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
      maxWidth={isMobile ? "xs" : "lg"} 
      fullWidth
      fullScreen={isMobile}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: isMobile ? 0 : '20px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 255, 0.9) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(135, 206, 250, 0.2)',
          boxShadow: '0 20px 60px rgba(135, 206, 250, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(135, 206, 250, 0.03) 0%, rgba(173, 216, 230, 0.05) 50%, rgba(176, 224, 230, 0.03) 100%)',
            zIndex: -1,
          }
        },
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(135, 206, 250, 0.1)',
          backdropFilter: 'blur(4px)',
        },
      }}
      ref={dialogRef}
      aria-labelledby="field-edit-dialog-title"
      aria-describedby="field-edit-dialog-description"
      onKeyDown={handleKeyDown}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 248, 255, 0.7) 100%)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(135, 206, 250, 0.2)',
          textAlign: 'center',
          py: isMobile ? 2 : 3,
          px: isMobile ? 2 : 3,
        }}
        id="field-edit-dialog-title"
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 1 : 2 }}>
          <Typography 
            variant={isMobile ? "h5" : "h4"}
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #4A90E2 30%, #7BB3F0 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {currentPage === 'selection' && (isEditing ? 'ویرایش فیلد' : 'افزودن فیلد جدید')}
            {currentPage === 'create' && 'ساخت فیلد جدید'}
            {currentPage === 'ready' && 'فیلدهای آماده'}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }} id="field-edit-dialog-description">
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
            background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.8) 0%, rgba(240, 248, 255, 0.6) 100%)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(135, 206, 250, 0.2)',
            p: isMobile ? 2 : 3,
          }}
        >
          <Button 
            onClick={handleClose} 
            startIcon={<CancelIcon />}
            sx={{
              borderRadius: '12px',
              px: isMobile ? 2 : 3,
              py: isMobile ? 1 : 1.5,
              background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.1) 0%, rgba(203, 213, 225, 0.05) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              color: '#64748B',
              fontWeight: 600,
              fontSize: isMobile ? '0.8rem' : 'inherit',
              '&:hover': {
                background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.15) 0%, rgba(203, 213, 225, 0.1) 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(148, 163, 184, 0.2)',
              },
            }}
            aria-label="انصراف و بستن"
            ref={firstFocusableRef}
          >
            {isMobile ? 'انصراف' : 'انصراف'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default FieldEditDialog;