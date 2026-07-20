import React, { memo, useState, useMemo } from 'react';
import { Box, Typography, Paper, Grid, TextField, FormControlLabel, Switch, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import HelpTooltip from '../shared/HelpTooltip';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';

interface MaskPropertiesProps {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
}

const MaskProperties: React.FC<MaskPropertiesProps> = ({ formData, onChange }) => {
  const [previewValue, setPreviewValue] = useState('1234567890');

  // Default mask patterns
  const defaultPatterns = useMemo(() => [
    { value: 'phone', label: 'شماره تلفن', pattern: 'phone', example: '(123) 456-7890' },
    { value: 'card', label: 'شماره کارت بانکی', pattern: 'card', example: '1234-5678-9012-3456' },
    { value: 'national-id', label: 'کد ملی', pattern: 'national-id', example: '123-456-7890' },
    { value: 'iban', label: 'شماره شبا', pattern: 'iban', example: 'IR 12 3456 7890 1234 5678 90' },
    { value: 'dynamic-phone', label: 'تلفن پویا', pattern: '999-999-9999', example: '123-456-7890' },
    { value: 'dynamic-card', label: 'کارت پویا', pattern: '9999-9999-9999-9999', example: '1234-5678-9012-3456' },
    { value: 'custom', label: 'سفارشی', pattern: '', example: 'الگوی خود را وارد کنید' }
  ], []);

  // Apply mask for preview
  const applyMask = (value: string, pattern: string) => {
    if (!pattern) return value;
    
    switch (pattern) {
      case 'phone':
        return value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
      case 'card':
        return value.replace(/(\d{4})/g, '$1-').slice(0, -1);
      case 'national-id':
        return value.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
      case 'iban':
        return value.replace(/(IR)(\d{2})(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})(\d{2})/, '$1 $2 $3 $4 $5 $6 $7 $8');
      default:
        // Custom pattern: 9 = digit, * = masked, others = separators
        let result = '';
        let valueIndex = 0;
        
        for (let i = 0; i < pattern.length && valueIndex < value.length; i++) {
          const patternChar = pattern[i];
          const valueChar = value[valueIndex];
          
          if (patternChar === '9') {
            if (/\d/.test(valueChar)) {
              result += valueChar;
              valueIndex++;
            } else {
              break;
            }
          } else if (patternChar === 'A') {
            if (/[a-zA-Z\u0600-\u06FF]/.test(valueChar)) {
              result += valueChar;
              valueIndex++;
            } else {
              break;
            }
          } else if (patternChar === '*') {
            result += '*';
            valueIndex++;
          } else {
            result += patternChar;
          }
        }
        return result;
    }
  };

  const currentPattern = formData.maskPattern || '';
  const isCustomPattern = !defaultPatterns.some(p => p.pattern === currentPattern);
  const previewMasked = applyMask(previewValue, currentPattern);

  // Validate mask pattern
  const validateMaskPattern = (pattern: string) => {
    if (!pattern) return { isValid: true, error: '' };
    
    // Check for valid pattern characters
    const validChars = /^[9A*\s\-\(\)\.]+$/;
    if (!validChars.test(pattern)) {
      return { 
        isValid: false, 
        error: 'الگو فقط می‌تواند شامل ۹ (رقم)، A (حرف)، * (ماسک) و جداکننده‌ها باشد' 
      };
    }
    
    // Check for at least one pattern character
    const hasPatternChar = /[9A*]/.test(pattern);
    if (!hasPatternChar) {
      return { 
        isValid: false, 
        error: 'الگو باید حداقل یک کاراکتر ۹، A یا * داشته باشد' 
      };
    }
    
    return { isValid: true, error: '' };
  };

  const patternValidation = validateMaskPattern(currentPattern);

  return (
    <Paper
      sx={{
        p: 3,
        mb: 3,
        borderRadius: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: (theme) => `1px solid ${theme.palette.primary.main}33`,
        boxShadow: (theme) => `0 4px 16px ${theme.palette.primary.main}1A`,
      }}
    >
      <Typography variant="h6" sx={{ mb: 3, color: 'primary.main', fontWeight: 600 }}>
        ویژگی‌های ماسک‌گذاری
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.variant === 'masked'}
                  onChange={(e) => {
                    if (e.target.checked) {
                      // Enable masking
                      onChange('variant', 'masked');
                      // Set default mask pattern if none exists
                      if (!formData.maskPattern) {
                        onChange('maskPattern', 'phone');
                      }
                    } else {
                      // Disable masking - revert to previous variant or plain
                      const previousVariant = formData.variant === 'masked' ? 'plain' : formData.variant;
                      onChange('variant', previousVariant);
                      // Clear mask pattern
                      onChange('maskPattern', '');
                    }
                  }}
                  size="small"
                />
              }
              label="فعال‌سازی ماسک‌گذاری"
            />
            <HelpTooltip
              title="فعال‌سازی ماسک‌گذاری"
              description="نمایش فیلد به صورت ماسک‌شده برای اطلاعات حساس"
              example="نمایش ۰۹۱۲ *** ۱۲۳۴"
            />
          </Box>
        </Grid>
        
        {formData.variant === 'masked' && (
          <>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControl fullWidth>
                  <InputLabel>الگوی پیش‌فرض</InputLabel>
                  <Select
                    value={isCustomPattern ? 'custom' : currentPattern}
                    onChange={(e) => {
                      const selectedPattern = defaultPatterns.find(p => p.value === e.target.value);
                      if (selectedPattern) {
                        onChange('maskPattern', selectedPattern.pattern);
                      }
                    }}
                    label="الگوی پیش‌فرض"
                    sx={{
                      background: 'rgba(255, 255, 255, 0.8)',
                    }}
                  >
                    {defaultPatterns.map((pattern) => (
                      <MenuItem key={pattern.value} value={pattern.value}>
                        {pattern.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <HelpTooltip
                  title="الگوی پیش‌فرض"
                  description="انتخاب الگوی ماسک از الگوهای از پیش تعریف شده"
                  example="شماره تلفن، کارت بانکی، کد ملی"
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="الگوی سفارشی"
                value={isCustomPattern ? currentPattern : ''}
                onChange={(e) => onChange('maskPattern', e.target.value)}
                placeholder="0999 *** 9999"
                helperText={patternValidation.error || "استفاده از ۹ برای ارقام، A برای حروف (فارسی/انگلیسی)، * برای ماسک، و کاراکترهای دیگر برای جداکننده"}
                error={!patternValidation.isValid}
                disabled={!isCustomPattern}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.8)',
                  },
                }}
              />
            </Grid>

            {/* Preview Section */}
            <Grid item xs={12}>
              <Box sx={{ 
                p: 2, 
                bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : (theme.palette.primary.main + '1A')),
                borderRadius: 2, 
                border: (theme) => `1px solid ${theme.palette.primary.main}33` 
              }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'primary.main' }}>
                  پیش‌نمایش ماسک
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <TextField
                    size="small"
                    label="مقدار تست"
                    value={previewValue}
                    onChange={(e) => setPreviewValue(e.target.value.replace(/[^\d]/g, ''))}
                    placeholder="1234567890"
                    sx={{ minWidth: 150 }}
                  />
                  <Typography variant="body2" sx={{ color: '#64748B' }}>
                    →
                  </Typography>
                  <Box sx={{ 
                    p: 1, 
                    bgcolor: 'rgba(255, 255, 255, 0.8)', 
                    borderRadius: 1, 
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    fontFamily: 'monospace',
                    minWidth: 200
                  }}>
                    {previewMasked || 'الگو را انتخاب کنید'}
                  </Box>
                </Box>
                {currentPattern && (
                  <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#64748B' }}>
                    الگوی فعلی: <code>{currentPattern}</code>
                  </Typography>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.piiCheck?.enabled || false}
                      onChange={(e) => onChange('piiCheck', { 
                        ...formData.piiCheck, 
                        enabled: e.target.checked 
                      })}
                      size="small"
                    />
                  }
                  label="تشخیص خودکار اطلاعات حساس"
                />
                <HelpTooltip
                  title="تشخیص خودکار اطلاعات حساس"
                  description="تشخیص خودکار اطلاعات حساس مانند شماره کارت یا شماره ملی"
                  example="تشخیص خودکار شماره کارت بانکی"
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.enableConditionalMasking || false}
                      onChange={(e) => onChange('enableConditionalMasking', e.target.checked)}
                      size="small"
                    />
                  }
                  label="ماسک شرطی"
                />
                <HelpTooltip
                  title="ماسک شرطی"
                  description="اعمال ماسک بر اساس شرایط خاص"
                  example="ماسک فقط برای کاربران خاص"
                />
              </Box>
            </Grid>

            {formData.enableConditionalMasking && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="شرط ماسک"
                  value={formData.conditionalMaskingRule || ''}
                  onChange={(e) => onChange('conditionalMaskingRule', e.target.value)}
                  placeholder="user.role === 'admin'"
                  helperText="شرط JavaScript برای اعمال ماسک"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: 'rgba(255, 255, 255, 0.8)',
                    },
                  }}
                />
              </Grid>
            )}
          </>
        )}
      </Grid>
    </Paper>
  );
};

export default memo(MaskProperties);