import React, { memo, useMemo, useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Grid,
  useTheme,
  useMediaQuery,
  Divider,
  Paper,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { FieldPreviewStepProps } from '../types/FieldEditTypes';
import { validateFieldDefinition, ValidationError } from '../utils/fieldValidation';
import { LiveFieldPreview } from './LiveFieldPreview.tsx';
import { FieldEnhancer } from '../processors/FieldEnhancer';
import { getFieldTypeLabel } from '../utils/fieldTypeUtils';

export const FieldPreviewStep = memo<FieldPreviewStepProps>(({ formData, originalType }) => {
  const [accordionPreviewValue, setAccordionPreviewValue] = useState('');
  const [validationWarnings, setValidationWarnings] = useState<ValidationError[]>([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Validate field definition when formData changes
  useEffect(() => {
    const validationResult = validateFieldDefinition(formData, originalType);
    setValidationWarnings(validationResult.errors.filter(e => e.type === 'warning'));
  }, [formData, originalType]);

  // Enhanced change handler for accordion field (same as LiveFieldPreview)
  const accordionEnhancedHandler = useMemo(() => {
    return FieldEnhancer.createEnhancedChangeHandler(
      formData,
      (_fieldId: string, value: string) => {
        setAccordionPreviewValue(value);
      },
      {
        useAsyncProcessing: false,
        formData: {}
      }
    );
  }, [formData]);

  const handleAccordionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const fieldId = formData.englishName || 'accordion-preview-field';
    accordionEnhancedHandler(fieldId, e.target.value);
  }, [accordionEnhancedHandler, formData.englishName]);

  return (
    <Box sx={{ px: isMobile ? 1 : undefined }}>
      <Box sx={{ textAlign: 'center', mb: isMobile ? 2 : 4 }}>
        <Typography 
          variant={isMobile ? "h5" : "h4"}
          gutterBottom
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(45deg, #4A90E2 30%, #7BB3F0 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: isMobile ? '1.3rem' : undefined
          }}
        >
          پیش‌نمایش فیلد
        </Typography>
        <Typography 
          variant={isMobile ? "body2" : "body1"} 
          color="text.secondary" 
          sx={{ 
            opacity: 0.8, 
            mb: isMobile ? 2 : 4,
            fontSize: isMobile ? '0.9rem' : '1.1rem'
          }}
        >
          بررسی نهایی و پیش‌نمایش زنده فیلد
        </Typography>
      </Box>
      
      {/* Live Field Preview */}      
      {formData.displayType === 'accordion' ? (
        <Box
          sx={{
            p: isMobile ? 2 : 3,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
            backdropFilter: 'blur(10px)',
            border: '2px dashed rgba(74, 144, 226, 0.3)',
            boxShadow: '0 4px 16px rgba(74, 144, 226, 0.1)',
          }}
          role="region"
          aria-label="پیش‌نمایش زنده فیلد آکاردئونی"
        >
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            sx={{ 
              mb: isMobile ? 2 : 3, 
              color: '#4A90E2', 
              fontWeight: 600, 
              textAlign: 'center',
              fontSize: isMobile ? '1.1rem' : undefined
            }}
          >
            🎯 پیش‌نمایش زنده فیلد آکاردئونی (با پردازش فعال)
          </Typography>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontSize: isMobile ? '0.9rem' : undefined }}>
                {formData.accordionTitle || formData.name}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {/* Show options when accordionDisplayMode is 'options', otherwise show text field */}
              {formData.accordionDisplayMode === 'options' && formData.options && formData.options.length > 0 ? (
                <Box sx={{ width: '100%' }}>
                  {formData.options.map((option: any, index: number) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        {typeof option === 'string' ? option : option.label || option.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <TextField
                  fullWidth
                  label={formData.name + (formData.isRequired ? ' *' : '')}
                  placeholder={formData.placeholder || ''}
                  helperText={formData.helpText || ''}
                  value={accordionPreviewValue}
                  onChange={handleAccordionChange}
                  multiline={formData.variant === 'textarea'}
                  rows={formData.textareaRows || 3}
                  dir={formData.direction === 'ltr' ? 'ltr' : 'rtl'}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                      fontSize: formData.size === 'sm' ? (isMobile ? '0.75rem' : '0.875rem') : formData.size === 'lg' ? (isMobile ? '1rem' : '1.125rem') : (isMobile ? '0.875rem' : '1rem'),
                      '&:hover': { boxShadow: '0 4px 12px rgba(74, 144, 226, 0.15)' },
                      '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)' },
                    },
                    mb: 2
                  }}
                  InputProps={{
                    startAdornment: formData.prefix ? (
                      <Typography sx={{ mr: 1, color: '#64748B', fontSize: isMobile ? '0.75rem' : undefined }}>{formData.prefix}</Typography>
                    ) : undefined,
                    endAdornment: formData.suffix ? (
                      <Typography sx={{ ml: 1, color: '#64748B', fontSize: isMobile ? '0.75rem' : undefined }}>{formData.suffix}</Typography>
                    ) : undefined,
                  }}
                  aria-label={`پیش‌نمایش فیلد آکاردئونی ${formData.name}`}
                />
              )}
              {/* Show active processing features for accordion too */}
              {(formData.caseTransform || formData.trimWhitespace || formData.characterControl) && (
                <Box sx={{ 
                  mt: 2, 
                  p: isMobile ? 1 : 1.5, 
                  backgroundColor: 'rgba(74, 144, 226, 0.1)', 
                  borderRadius: 1 
                }}>
                  <Typography 
                    variant="caption" 
                    color="primary" 
                    sx={{ 
                      fontWeight: 600, 
                      display: 'block',
                      fontSize: isMobile ? '0.7rem' : undefined
                    }}
                  >
                    ⚡ پردازش فعال:
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: isMobile ? 0.5 : 1, 
                    mt: isMobile ? 0.5 : 0.5 
                  }}>
                    {formData.caseTransform && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          px: isMobile ? 0.5 : 1, 
                          py: isMobile ? 0.25 : 0.5, 
                          backgroundColor: 'rgba(74, 144, 226, 0.2)', 
                          borderRadius: 0.5,
                          fontSize: isMobile ? '0.65rem' : undefined
                        }}
                      >
                        تبدیل حروف: {formData.caseTransform}
                      </Typography>
                    )}
                    {formData.trimWhitespace && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          px: isMobile ? 0.5 : 1, 
                          py: isMobile ? 0.25 : 0.5, 
                          backgroundColor: 'rgba(74, 144, 226, 0.2)', 
                          borderRadius: 0.5,
                          fontSize: isMobile ? '0.65rem' : undefined
                        }}
                      >
                        حذف فاصله اضافی
                      </Typography>
                    )}
                    {formData.characterControl && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          px: isMobile ? 0.5 : 1, 
                          py: isMobile ? 0.25 : 0.5, 
                          backgroundColor: 'rgba(74, 144, 226, 0.2)', 
                          borderRadius: 0.5,
                          fontSize: isMobile ? '0.65rem' : undefined
                        }}
                      >
                        کنترل کاراکتر: {formData.characterControl}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        </Box>
      ) : (
        <LiveFieldPreview formData={formData} originalType={originalType} />
      )}
      
      <Divider sx={{ my: isMobile ? 2 : 4 }} />
      
      {/* Field Details */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, backgroundColor: 'rgba(74, 144, 226, 0.05)' }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#4A90E2', display: 'flex', alignItems: 'center' }}>
          📝 مشخصات کلی
        </Typography>
        <Grid container spacing={isMobile ? 1 : 2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>عنوان</Typography>
              <Typography variant="body1">{formData.name}</Typography>
            </Box>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>کلید یکتا</Typography>
              <Typography variant="body1">{formData.englishName}</Typography>
            </Box>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>نوع فیلد</Typography>
              <Chip label={getFieldTypeLabel(formData.type)} size="small" sx={{ bgcolor: 'rgba(74, 144, 226, 0.1)', color: '#4A90E2' }} />
            </Box>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>اجباری</Typography>
              <Typography variant="body1">{formData.isRequired ? 'بله' : 'خیر'}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>جهت متن</Typography>
              <Typography variant="body1">{formData.direction}</Typography>
            </Box>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>مقدار پیش‌فرض</Typography>
              <Typography variant="body1">{formData.defaultValue || '-'}</Typography>
            </Box>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>متن راهنما</Typography>
              <Typography variant="body1">{formData.placeholder || '-'}</Typography>
            </Box>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>توضیح کمکی</Typography>
              <Typography variant="body1">{formData.helpText || '-'}</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Content Control Properties */}
      {(formData.characterControl || formData.caseTransform || formData.trimWhitespace || 
        formData.normalizeDigits || formData.fixZWNJ || formData.allowEmoji || formData.allowMarkdown) && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2, backgroundColor: 'rgba(74, 144, 226, 0.05)' }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#4A90E2', display: 'flex', alignItems: 'center' }}>
            ⚙️ کنترل محتوا
          </Typography>
          <Grid container spacing={isMobile ? 1 : 2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>کنترل کاراکتر</Typography>
                <Chip label={formData.characterControl || '-'} size="small" sx={{ bgcolor: 'rgba(74, 144, 226, 0.1)', color: '#4A90E2' }} />
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>تبدیل حروف</Typography>
                <Chip label={formData.caseTransform || '-'} size="small" sx={{ bgcolor: 'rgba(74, 144, 226, 0.1)', color: '#4A90E2' }} />
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>حذف فاصله اضافی</Typography>
                <Typography variant="body1">{formData.trimWhitespace ? 'بله' : 'خیر'}</Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>تبدیل اعداد</Typography>
                <Typography variant="body1">{formData.normalizeDigits ? 'بله' : 'خیر'}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>اصلاح نیم‌فاصله</Typography>
                <Typography variant="body1">{formData.fixZWNJ ? 'بله' : 'خیر'}</Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>اجازه ایموجی</Typography>
                <Typography variant="body1">{formData.allowEmoji ? 'بله' : 'خیر'}</Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>اجازه Markdown</Typography>
                <Typography variant="body1">{formData.allowMarkdown ? 'بله' : 'خیر'}</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Assistive Properties */}
      {(formData.suggestions && formData.suggestions.length > 0 || formData.autoComplete || formData.enableMultipleValues || formData.spellcheck !== 'off') && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2, backgroundColor: 'rgba(74, 144, 226, 0.05)' }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#4A90E2', display: 'flex', alignItems: 'center' }}>
            🎆 ویژگی‌های کمکی
          </Typography>
          <Grid container spacing={isMobile ? 1 : 2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>لیست پیشنهاد</Typography>
                <Typography variant="body1">{formData.suggestions && formData.suggestions.length > 0 ? 'بله' : 'خیر'}</Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>تکمیل خودکار</Typography>
                <Typography variant="body1">{formData.autoComplete ? 'بله' : 'خیر'}</Typography>
              </Box>
              {formData.suggestions && formData.suggestions.length > 0 && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>پیشنهادات</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {Array.isArray(formData.suggestions) 
                      ? formData.suggestions.map((suggestion, index) => (
                          <Chip key={index} label={suggestion} size="small" sx={{ bgcolor: 'rgba(74, 144, 226, 0.1)', color: '#4A90E2' }} />
                        ))
                      : (formData.suggestions as string).split('\n').filter((s: string) => s.trim()).map((suggestion, index) => (
                          <Chip key={index} label={suggestion} size="small" sx={{ bgcolor: 'rgba(74, 144, 226, 0.1)', color: '#4A90E2' }} />
                        ))
                    }
                  </Box>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>مقدار چندگانه</Typography>
                <Typography variant="body1">{formData.enableMultipleValues ? 'بله' : 'خیر'}</Typography>
              </Box>
              {formData.enableMultipleValues && (
                <>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>جداکننده</Typography>
                    <Chip label={formData.multiValueSeparator || '-'} size="small" sx={{ bgcolor: 'rgba(74, 144, 226, 0.1)', color: '#4A90E2' }} />
                  </Box>
                </>
              )}
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>غلط‌یاب</Typography>
                <Chip label={formData.spellcheck || '-'} size="small" sx={{ bgcolor: 'rgba(74, 144, 226, 0.1)', color: '#4A90E2' }} />
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Behavior & Logic Properties */}
      {(formData.editableAfterSave !== undefined || formData.enableAutoSave || 
        formData.enableConditionalDisplay || formData.enableConditionalEnable) && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2, backgroundColor: 'rgba(74, 144, 226, 0.05)' }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#4A90E2', display: 'flex', alignItems: 'center' }}>
            ⚙️ رفتار و منطق
          </Typography>
          <Grid container spacing={isMobile ? 1 : 2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>قابل ویرایش بعد از ذخیره</Typography>
                <Typography variant="body1">{formData.editableAfterSave ? 'بله' : 'خیر'}</Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>ذخیرو خودکار</Typography>
                <Typography variant="body1">{formData.enableAutoSave ? 'بله' : 'خیر'}</Typography>
              </Box>
              {formData.enableAutoSave && (
                <>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>تأخیر (ثانیه)</Typography>
                    <Typography variant="body1">{formData.autoSaveDelay}</Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>فاصله ذخیره (ثانیه)</Typography>
                    <Typography variant="body1">{formData.autoSaveInterval}</Typography>
                  </Box>
                </>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>نمایش شرطی</Typography>
                <Typography variant="body1">{formData.enableConditionalDisplay ? 'بله' : 'خیر'}</Typography>
              </Box>
              {formData.enableConditionalDisplay && (
                <>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>فیلد مرجع</Typography>
                    <Typography variant="body1">{formData.conditionalDisplayField}</Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>شرط</Typography>
                    <Chip label={formData.conditionalDisplayOperator || '-'} size="small" sx={{ bgcolor: 'rgba(74, 144, 226, 0.1)', color: '#4A90E2' }} />
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>مقدار</Typography>
                    <Typography variant="body1">{formData.conditionalDisplayValue}</Typography>
                  </Box>
                </>
              )}
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>فعال‌سازی شرطی</Typography>
                <Typography variant="body1">{formData.enableConditionalEnable ? 'بله' : 'خیر'}</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Security & Storage Properties */}
      {(formData.piiCheck?.enabled || formData.profanityCheck?.enabled || 
        formData.indexing?.searchable || formData.indexing?.filterable || formData.storeRawAndNormalized) && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2, backgroundColor: 'rgba(74, 144, 226, 0.05)' }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#4A90E2', display: 'flex', alignItems: 'center' }}>
            🔒 امنیت و ذخیره‌سازی
          </Typography>
          <Grid container spacing={isMobile ? 1 : 2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>تشخیص اطلاعات حساس</Typography>
                <Typography variant="body1">{formData.piiCheck?.enabled ? 'بله' : 'خیر'}</Typography>
              </Box>
              {formData.piiCheck?.enabled && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>عمل</Typography>
                  <Chip label={formData.piiCheck.action || '-'} size="small" sx={{ bgcolor: 'rgba(74, 144, 226, 0.1)', color: '#4A90E2' }} />
                </Box>
              )}
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>تشخیص کلمات نامناسب</Typography>
                <Typography variant="body1">{formData.profanityCheck?.enabled ? 'بله' : 'خیر'}</Typography>
              </Box>
              {formData.profanityCheck?.enabled && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>عمل</Typography>
                  <Chip label={formData.profanityCheck.action || '-'} size="small" sx={{ bgcolor: 'rgba(74, 144, 226, 0.1)', color: '#4A90E2' }} />
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>قابل جستجو</Typography>
                <Typography variant="body1">{formData.indexing?.searchable ? 'بله' : 'خیر'}</Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>قابل فیلتر</Typography>
                <Typography variant="body1">{formData.indexing?.filterable ? 'بله' : 'خیر'}</Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>آنالایزر جستجو</Typography>
                <Chip label={formData.analyzer || '-'} size="small" sx={{ bgcolor: 'rgba(74, 144, 226, 0.1)', color: '#4A90E2' }} />
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>ذخیره خام و نرمال</Typography>
                <Typography variant="body1">{formData.storeRawAndNormalized ? 'بله' : 'خیر'}</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Display Properties */}
      {(formData.displayType || formData.size || formData.icon || formData.prefix || formData.suffix || 
        formData.counterDisplay || formData.showCopyButton) && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2, backgroundColor: 'rgba(74, 144, 226, 0.05)' }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#4A90E2', display: 'flex', alignItems: 'center' }}>
            🎨 ویژگی‌های نمایشی
          </Typography>
          <Grid container spacing={isMobile ? 1 : 2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>نوع نمایش</Typography>
                <Chip label={formData.displayType || '-'} size="small" sx={{ bgcolor: 'rgba(74, 144, 226, 0.1)', color: '#4A90E2' }} />
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>کمک انتخاب</Typography>
                <Chip label={formData.selectionHelper || '-'} size="small" sx={{ bgcolor: 'rgba(74, 144, 226, 0.1)', color: '#4A90E2' }} />
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>اندازه</Typography>
                <Chip label={formData.size || '-'} size="small" sx={{ bgcolor: 'rgba(74, 144, 226, 0.1)', color: '#4A90E2' }} />
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>آیکون</Typography>
                <Typography variant="body1">{formData.icon || '-'}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>پیشوند</Typography>
                <Typography variant="body1">{formData.prefix || '-'}</Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>پسوند</Typography>
                <Typography variant="body1">{formData.suffix || '-'}</Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>نمایش شمارنده</Typography>
                <Chip label={formData.counterDisplay || '-'} size="small" sx={{ bgcolor: 'rgba(74, 144, 226, 0.1)', color: '#4A90E2' }} />
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>دکمه کپی</Typography>
                <Typography variant="body1">{formData.showCopyButton ? 'بله' : 'خیر'}</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Validation Warnings */}
      {validationWarnings.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2, backgroundColor: 'rgba(255, 184, 0, 0.1)', border: '1px solid rgba(255, 184, 0, 0.3)' }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#d97706', display: 'flex', alignItems: 'center' }}>
            ⚠️ هشدارهای اعتبارسنجی
          </Typography>
          <Box>
            {validationWarnings.map((warning, index) => (
              <Typography 
                key={index} 
                variant="body2" 
                sx={{ 
                  color: '#d97706', 
                  mb: 1,
                  '&:last-child': { mb: 0 }
                }}
              >
                ⚠️ {warning.message}
              </Typography>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
});