// Number Field Control Rules Component
// کامپوننت قوانین کنترلی فیلد عددی

import React, { memo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';
import HelpTooltip from '../shared/HelpTooltip';

interface NumberControlRulesProps {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
}

export const NumberControlRules = memo<NumberControlRulesProps>(({
  formData,
  onChange: handleChange,
}) => {
  const numberField = formData.numberField || {};
  const controlRules = formData.controlRules || {};

  const handleNumberFieldChange = (key: string, value: any) => {
    handleChange('numberField', { ...numberField, [key]: value });
  };

  const handleControlRulesChange = (key: string, value: any) => {
    handleChange('controlRules', { ... controlRules, [key]: value });
  };

  // Helper function to validate default value
  const isValidDefaultValue = (value: string): boolean => {
    if (!value) return true;
    return !isNaN(Number(value));
  };

  // Helper function to check control rules conflicts
  const checkControlRulesConflicts = (): string[] => {
    const conflicts: string[] = [];
    
    if (controlRules?.lockAfterSave && controlRules?.readOnly) {
      conflicts.push('قفل بعد از ذخیره با فقط خواندنی تداخل دارد');
    }
    
    if (controlRules?.lockAfterSave && numberField.editableAfterSave === false) {
      conflicts.push('قفل بعد از ذخیره با غیرقابل ویرایش بعد از ذخیره تداخل دارد');
    }
    
    if (controlRules?.readOnly && numberField.editableAfterSave === true) {
      conflicts.push('فقط خواندنی با قابل ویرایش بعد از ذخیره تداخل دارد');
    }
    
    return conflicts;
  };

  return (
    <Paper
      sx={{
        p: 3,
        mb: 3,
        borderRadius: '12px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(135, 206, 250, 0.2)',
        boxShadow: '0 4px 16px rgba(135, 206, 250, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      }}
    >
      <Typography variant="h6" sx={{ mb: 3, color: '#4A90E2', fontWeight: 600 }}>
        قوانین کنترلی
      </Typography>
      
      <Grid container spacing={3}>
        {/* مقدار پیش‌فرض */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              type="number"
              label="مقدار پیش‌فرض"
              value={numberField.defaultValue || ''}
              onChange={(e) => handleNumberFieldChange('defaultValue', parseFloat(e.target.value) || undefined)}
              placeholder="0"
              sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
            />
            <HelpTooltip
              title="مقدار پیش‌فرض"
              description="مقداری که از قبل در فیلد نمایش داده می‌شود."
              example="۰ برای مبلغ، ۱ برای تعداد ابتدایی"
            />
          </Box>
        </Grid>

        {/* غیرقابل‌ویرایش بعد از ثبت */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={controlRules?.lockAfterSave || false}
                  onChange={(e) => handleControlRulesChange('lockAfterSave', e.target.checked)}
                  size="small"
                  color={checkControlRulesConflicts().length > 0 ? 'error' : 'primary'}
                />
              }
              label="غیرقابل‌ویرایش بعد از ثبت"
            />
            <HelpTooltip
              title="غیرقابل‌ویرایش بعد از ثبت"
              description="پس از ذخیره اولیه، فیلد قابل ویرایش نباشد."
              example="برای فیلدهای مهم و غیرقابل تغییر مثل شماره فاکتور"
            />
          </Box>
          {checkControlRulesConflicts().length > 0 && (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              {checkControlRulesConflicts()[0]}
            </Typography>
          )}
        </Grid>

        {/* فقط خواندنی */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={controlRules?.readOnly || false}
                  onChange={(e) => handleControlRulesChange('readOnly', e.target.checked)}
                  size="small"
                  color={checkControlRulesConflicts().length > 0 ? 'error' : 'primary'}
                />
              }
              label="فقط خواندنی"
            />
            <HelpTooltip
              title="فقط خواندنی"
              description="فیلد فقط قابل مشاهده است و نمی‌توان آن را ویرایش کرد."
              example="برای نمایش اطلاعات محاسبه شده یا اطلاعات سیستمی"
            />
          </Box>
          {checkControlRulesConflicts().length > 0 && (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              {checkControlRulesConflicts()[0]}
            </Typography>
          )}
        </Grid>

        {/* قابل‌ویرایش بعد از ثبت */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={numberField.editableAfterSave !== false}
                  onChange={(e) => handleNumberFieldChange('editableAfterSave', e.target.checked)}
                  size="small"
                />
              }
              label="قابل‌ویرایش بعد از ذخیره"
            />
            <HelpTooltip
              title="قابل‌ویرایش بعد از ذخیره"
              description="امکان ویرایش فیلد پس از ذخیره اولیه."
              example="برای فیلدهای قابل تغییر مانند قیمت یا تخفیف"
            />
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
});

NumberControlRules.displayName = 'NumberControlRules';
