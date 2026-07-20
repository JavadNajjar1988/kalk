// Number Helper Properties Component
// کامپوننت ویژگی‌های کمکی فیلد عددی

import React, { memo } from 'react';
import {
  Box,
  Grid,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';
import HelpTooltip from '../shared/HelpTooltip';

interface NumberHelperPropertiesProps {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
}

export const NumberHelperProperties = memo<NumberHelperPropertiesProps>(({
  formData,
  onChange: handleChange,
}) => {
  const numberField = formData.numberField || {};
  const displayFormat = numberField.displayFormat || {};

  // Compute conflicts between multi-value separator and numeric formatting
  const decimalSeparator = displayFormat.decimalSeparator; // 'dot' | 'comma'
  const thousandSeparatorEnabled = !!displayFormat.thousandSeparator;
  const thousandSymbol = displayFormat.thousandSymbol || '';

  const commaChar = ',';
  const spaceChar = ' ';

  const isCommaBlocked = (decimalSeparator === 'comma') || (thousandSeparatorEnabled && thousandSymbol === commaChar);
  const isSpaceBlocked = thousandSeparatorEnabled && thousandSymbol === spaceChar;
  const isSemicolonBlocked = false;

  // Current selected separator conflict status
  const currentSeparator = numberField.multiValueSeparator || 'comma';
  const currentSeparatorConflicts = (
    (currentSeparator === 'comma' && isCommaBlocked) ||
    (currentSeparator === 'space' && isSpaceBlocked) ||
    (currentSeparator === 'semicolon' && isSemicolonBlocked)
  );

  const handleNumberFieldChange = (key: string, value: any) => {
    const updated = { ...numberField, [key]: value } as typeof numberField;

    // When enabling multi values, auto-correct conflicting separator to a safe one (semicolon)
    if (key === 'enableMultipleValues' && value === true) {
      const sep = updated.multiValueSeparator || 'comma';
      const sepConflicts = (
        (sep === 'comma' && isCommaBlocked) ||
        (sep === 'space' && isSpaceBlocked)
      );
      if (sepConflicts) {
        updated.multiValueSeparator = 'semicolon';
      }
    }

    // If user changes formatting that introduces a conflict with the existing separator, keep value but UI will show error;
    // auto-fix is only done on enable toggle to avoid surprising changes.

    handleChange('numberField', updated);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <h4 style={{ margin: 0, color: 'var(--mui-palette-primary-main)', fontWeight: 600 }}>
          ویژگی‌های کمکی
        </h4>
      </Box>
      
      <Grid container spacing={2}>
        {/* تکمیل خودکار */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={numberField.enableAutoComplete || false}
                  onChange={(e) => handleNumberFieldChange('enableAutoComplete', e.target.checked)}
                  size="small"
                />
              }
              label="تکمیل خودکار"
            />
            <HelpTooltip
              title="تکمیل خودکار"
              description="نمایش پیشنهادات بر اساس ورودی‌های قبلی."
              example="مقادیر پرکاربرد مانند 1000، 5000، 10000"
            />
          </Box>
        </Grid>
        
        {/* کلیدهای افزایش/کاهش */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={numberField.enableSpinner || false}
                  onChange={(e) => handleNumberFieldChange('enableSpinner', e.target.checked)}
                  size="small"
                />
              }
              label="کلیدهای افزایش/کاهش"
            />
            {numberField.enableMultipleValues && numberField.enableSpinner && (
              <Box sx={{ ml: 1, color: 'warning.main', fontSize: 12 }}>
                در حالت چندمقداری، کلیدهای +/− فقط روی مقدار کل اعمال می‌شود.
              </Box>
            )}
            <HelpTooltip
              title="کلیدهای افزایش/کاهش"
              description="نمایش دکمه‌های + و - برای تغییر مقدار."
              example="دکمه‌های بالا/پایین برای تغییر مقدار"
            />
          </Box>
        </Grid>
        
        {/* نمایش نمودار کوچک */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={numberField.enableMiniChart || false}
                  onChange={(e) => handleNumberFieldChange('enableMiniChart', e.target.checked)}
                  size="small"
                />
              }
              label="نمایش نمودار کوچک"
            />
            {formData.numberField?.displayType === 'slider' && numberField.enableMiniChart && (
              <Box sx={{ ml: 1, color: 'error.main', fontSize: 12 }}>
                فعال بودن «نمایش نمودار کوچک» با نمایش اصلی اسلایدر ممکن است موجب تداخل شود.
              </Box>
            )}
            <HelpTooltip
              title="نمایش نمودار کوچک"
              description="نمایش نمودار یا اسلایدر برای انتخاب سریع مقدار."
              example="نوار پیشرفت یا اسلایدر برای انتخاب مقدار"
            />
          </Box>
        </Grid>
        
        {/* مقدار چندگانه */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={numberField.enableMultipleValues || false}
                  onChange={(e) => handleNumberFieldChange('enableMultipleValues', e.target.checked)}
                  size="small"
                />
              }
              label="مقدار چندگانه"
            />
            <HelpTooltip
              title="مقدار چندگانه"
              description="امکان وارد کردن چند مقدار با جداکننده."
              example="1000,2000,3000 یا 1000;2000;3000"
            />
          </Box>
        </Grid>
        
        {/* جداکننده مقدار چندگانه */}
        {numberField.enableMultipleValues && (
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControl fullWidth>
                <InputLabel>جداکننده مقدار چندگانه</InputLabel>
                <Select
                  value={numberField.multiValueSeparator || 'comma'}
                  onChange={(e) => handleNumberFieldChange('multiValueSeparator', e.target.value)}
                  label="جداکننده مقدار چندگانه"
                  sx={{ background: 'rgba(255, 255, 255, 0.8)' }}
                  error={currentSeparatorConflicts}
                >
                  <MenuItem value="comma" disabled={isCommaBlocked}>کاما (,)</MenuItem>
                  <MenuItem value="space" disabled={isSpaceBlocked}>فاصله ( )</MenuItem>
                  <MenuItem value="semicolon" disabled={isSemicolonBlocked}>نقطه‌ویرگول (;)</MenuItem>
                </Select>
                {currentSeparatorConflicts && (
                  <FormHelperText error>
                    جداکننده انتخابی با تنظیمات فرمت عدد (جداکننده اعشار/هزارگان) تداخل دارد. گزینه دیگری را انتخاب کنید.
                  </FormHelperText>
                )}
              </FormControl>
              <HelpTooltip
                title="جداکننده مقدار چندگانه"
                description="نماد جداکننده برای مقادیر چندگانه."
                example="کاما: 1000,2000، فاصله: 1000 2000"
              />
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
});

NumberHelperProperties.displayName = 'NumberHelperProperties';
