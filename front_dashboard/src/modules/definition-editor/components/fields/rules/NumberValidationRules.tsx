// Number Field Validation Rules Component
// کامپوننت قوانین اعتبارسنجی فیلد عددی

import React, { memo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';
import HelpTooltip from '../shared/HelpTooltip';

interface NumberValidationRulesProps {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
}

export const NumberValidationRules = memo<NumberValidationRulesProps>(({
  formData,
  onChange: handleChange,
}) => {
  const numberField = formData.numberField || {};
  const validationRules = formData.validationRules || {};

  const handleNumberFieldChange = (key: string, value: any) => {
    handleChange('numberField', { ...numberField, [key]: value });
  };

  const handleValidationRulesChange = (key: string, value: any) => {
    handleChange('validationRules', { ...validationRules, [key]: value });
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
        قوانین اعتبارسنجی
      </Typography>
      
      <Grid container spacing={3}>
        {/* اجباری بودن */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isRequired || false}
                  onChange={(e) => handleChange('isRequired', e.target.checked)}
                  size="small"
                />
              }
              label="الزامی بودن"
            />
            <HelpTooltip
              title="الزامی بودن"
              description="فیلد باید حتماً پر شود و نمی‌توان خالی باشد."
              example="کاربر باید حداقل یک عدد وارد کند"
            />
          </Box>
        </Grid>

        {/* محدوده مقدار */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>
              محدوده مقدار
            </Typography>
            <HelpTooltip
              title="محدوده مقدار"
              description="تعیین حداقل و حداکثر مقدار مجاز برای فیلد عددی."
              example="حداقل ۰ و حداکثر ۱۰,۰۰۰"
            />
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                  fullWidth
                  type="number"
                  label="حداقل مقدار"
                  value={numberField.minValue || ''}
                  onChange={(e) => handleNumberFieldChange('minValue', parseFloat(e.target.value) || undefined)}
                  placeholder="0"
                  sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                />
                <HelpTooltip
                  title="حداقل مقدار"
                  description="کمترین مقدار قابل قبول."
                  example="۰ برای قیمت، ۱ برای تعداد"
                />
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                  fullWidth
                  type="number"
                  label="حداکثر مقدار"
                  value={numberField.maxValue || ''}
                  onChange={(e) => handleNumberFieldChange('maxValue', parseFloat(e.target.value) || undefined)}
                  placeholder="1000000"
                  sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                />
                <HelpTooltip
                  title="حداکثر مقدار"
                  description="بیشترین مقدار قابل قبول."
                  example="۱۰,۰۰۰,۰۰۰ برای قیمت"
                />
              </Box>
            </Grid>
          </Grid>
        </Grid>

        {/* تعداد اعشار */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              type="number"
              label="تعداد اعشار مجاز"
              value={numberField.decimalPrecision || ''}
              onChange={(e) => handleNumberFieldChange('decimalPrecision', parseInt(e.target.value) || undefined)}
              placeholder="2"
              sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
            />
            <HelpTooltip
              title="تعداد اعشار مجاز"
              description="حداکثر تعداد رقم اعشار قابل ورودی."
              example="۲ برای پول، ۳ برای درصد"
            />
          </Box>
        </Grid>

        {/* نوع عدد */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControl fullWidth>
              <InputLabel>نوع عدد</InputLabel>
              <Select
                value={numberField.numberType || 'integer'}
                onChange={(e) => handleNumberFieldChange('numberType', e.target.value)}
                label="نوع عدد"
                sx={{ background: 'rgba(255, 255, 255, 0.8)' }}
              >
                <MenuItem value="integer">فقط عدد صحیح</MenuItem>
                <MenuItem value="decimal">اعشاری مجاز</MenuItem>
                <MenuItem value="positive">فقط عدد مثبت</MenuItem>
                <MenuItem value="negative">فقط عدد منفی</MenuItem>
              </Select>
            </FormControl>
            <HelpTooltip
              title="نوع عدد"
              description="نوع عدد مجاز برای ورودی."
              example="مثبت: فقط +، منفی: فقط -، صحیح: بدون اعشار"
            />
          </Box>
        </Grid>

        {/* الگوی سفارشی */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>
              الگوی سفارشی (Regex)
            </Typography>
            <HelpTooltip
              title="الگوی سفارشی"
              description="الگوی خاص برای تعریف فرمت عدد مورد نظر."
              example="برای کد محصول: ^[0-9]{5}$"
            />
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={8}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                  fullWidth
                  label="الگوی Regex"
                  value={validationRules.pattern || ''}
                  onChange={(e) => {
                    const pattern = e.target.value;
                    let isValidPattern = true;
                    if (pattern) {
                      try {
                        new RegExp(pattern);
                      } catch {
                        isValidPattern = false;
                      }
                    }
                    handleValidationRulesChange('pattern', pattern || undefined);
                  }}
                  placeholder="^[0-9]{5}$"
                  error={validationRules.pattern ? (() => {
                    try {
                      new RegExp(validationRules.pattern || '');
                      return false;
                    } catch {
                      return true;
                    }
                  })() : false}
                  helperText={validationRules.pattern ? (() => {
                    try {
                      new RegExp(validationRules.pattern || '');
                      return '';
                    } catch {
                      return 'الگوی Regex نامعتبر است';
                    }
                  })() : ''}
                  sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                />
                <HelpTooltip
                  title="الگوی Regex"
                  description="الگوی منظم برای اعتبارسنجی عدد."
                  example="^[0-9]{10}$ برای کد ۱۰ رقمی"
                />
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                  fullWidth
                  label="پیام خطا"
                  value={validationRules.patternMessage || ''}
                  onChange={(e) => handleValidationRulesChange('patternMessage', e.target.value || undefined)}
                  placeholder="فرمت صحیح نیست"
                  sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                />
                <HelpTooltip
                  title="پیام خطا"
                  description="پیام خطای سفارشی برای الگوی نامعتبر."
                  example="کد باید دقیقاً ۵ رقم باشد"
                />
              </Box>
            </Grid>
          </Grid>
        </Grid>

        {/* یونیک بودن */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={validationRules.unique || false}
                  onChange={(e) => handleValidationRulesChange('unique', e.target.checked)}
                  size="small"
                />
              }
              label="یونیک بودن"
            />
            <HelpTooltip
              title="یونیک بودن"
              description="مقدار وارد شده باید در تمام رکوردها یکتا باشد."
              example="شماره فاکتور تکراری نباشد"
            />
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
});

NumberValidationRules.displayName = 'NumberValidationRules';
