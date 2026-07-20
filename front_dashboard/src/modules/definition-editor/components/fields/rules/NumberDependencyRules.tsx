// Number Field Dependency Rules Component
// کامپوننت قوانین وابستگی فیلد عددی

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

interface NumberDependencyRulesProps {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
}

export const NumberDependencyRules = memo<NumberDependencyRulesProps>(({
  formData,
  onChange: handleChange,
}) => {
  const numberField = formData.numberField || {};
  const conditionalRules = formData.conditionalRules || {};

  const handleNumberFieldChange = (key: string, value: any) => {
    handleChange('numberField', { ...numberField, [key]: value });
  };

  const handleConditionalRulesChange = (key: string, value: any) => {
    handleChange('conditionalRules', { ...conditionalRules, [key]: value });
  };

  const handleVisibilityChange = (subKey: string, value: any) => {
    const visibility = conditionalRules.visibility || {};
    handleConditionalRulesChange('visibility', { ...visibility, [subKey]: value });
  };

  const handleEnableChange = (subKey: string, value: any) => {
    const enable = conditionalRules.enable || {};
    handleConditionalRulesChange('enable', { ...enable, [subKey]: value });
  };

  const handleComparisonChange = (subKey: string, value: any) => {
    const comparison = conditionalRules.comparison || {};
    handleConditionalRulesChange('comparison', { ...comparison, [subKey]: value });
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
        قوانین وابستگی
      </Typography>
      
      <Grid container spacing={3}>
        {/* نمایش شرطی */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={conditionalRules.visibility?.enabled || false}
                  onChange={(e) => handleVisibilityChange('enabled', e.target.checked)}
                  size="small"
                />
              }
              label="نمایش شرطی"
              sx={{ mb: 1 }}
            />
            <HelpTooltip
              title="نمایش شرطی"
              description="نمایش یا مخفی کردن فیلد بر اساس مقدار فیلد دیگر."
              example="اگر نوع محصول = فیزیکی باشد، فیلد وزن نمایش داده شود"
            />
          </Box>
          {conditionalRules.visibility?.enabled && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                    fullWidth
                    label="فیلد وابسته"
                    value={conditionalRules.visibility?.dependsOn || ''}
                    onChange={(e) => handleVisibilityChange('dependsOn', e.target.value)}
                    placeholder="field_id"
                    error={conditionalRules.visibility?.dependsOn ? 
                      !conditionalRules.visibility.dependsOn.trim() : false}
                    helperText={conditionalRules.visibility?.dependsOn ? 
                      (!conditionalRules.visibility.dependsOn.trim() ? 
                        'نام فیلد وابسته نمی‌تواند خالی باشد' : 'برای اطمینان از صحت، نام دقیق فیلد را وارد کنید') : ''}
                    sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                  />
                  <HelpTooltip
                    title="فیلد وابسته"
                    description="نام فیلدی که شرط نمایش بر اساس آن بررسی می‌شود."
                    example="productType یا category"
                  />
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FormControl fullWidth>
                    <InputLabel>شرط</InputLabel>
                    <Select
                      value={conditionalRules.visibility?.condition || 'equals'}
                      onChange={(e) => handleVisibilityChange('condition', e.target.value)}
                      label="شرط"
                      sx={{ background: 'rgba(255, 255, 255, 0.8)' }}
                    >
                      <MenuItem value="equals">برابر</MenuItem>
                      <MenuItem value="not_equals">مخالف</MenuItem>
                      <MenuItem value="greater_than">بزرگتر از</MenuItem>
                      <MenuItem value="less_than">کوچکتر از</MenuItem>
                      <MenuItem value="greater_equal">بزرگتر یا مساوی</MenuItem>
                      <MenuItem value="less_equal">کوچکتر یا مساوی</MenuItem>
                      <MenuItem value="empty">خالی</MenuItem>
                      <MenuItem value="not_empty">غیرخالی</MenuItem>
                      <MenuItem value="contains">شامل</MenuItem>
                      <MenuItem value="not_contains">غیرشامل</MenuItem>
                    </Select>
                  </FormControl>
                  <HelpTooltip
                    title="شرط"
                    description="نوع شرط برای مقایسه با مقدار فیلد وابسته."
                    example="برابر: مقدار دقیقاً همان باشد"
                  />
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    label="مقدار شرط"
                    value={conditionalRules.visibility?.value || ''}
                    onChange={(e) => handleVisibilityChange('value', e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                  />
                  <HelpTooltip
                    title="مقدار شرط"
                    description="مقداری که با فیلد وابسته مقایسه می‌شود."
                    example="physical یا 100"
                  />
                </Box>
              </Grid>
            </Grid>
          )}
        </Grid>

        {/* فعال‌سازی شرطی */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={conditionalRules.enable?.enabled || false}
                  onChange={(e) => handleEnableChange('enabled', e.target.checked)}
                  size="small"
                />
              }
              label="فعال‌سازی شرطی"
              sx={{ mb: 1 }}
            />
            <HelpTooltip
              title="فعال‌سازی شرطی"
              description="فعال یا غیرفعال کردن فیلد بر اساس شرط خاص."
              example="اگر وضعیت = فعال باشد، فیلد قابل ویرایش شود"
            />
          </Box>
          {conditionalRules.enable?.enabled && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    label="فیلد وابسته"
                    value={conditionalRules.enable?.dependsOn || ''}
                    onChange={(e) => handleEnableChange('dependsOn', e.target.value)}
                    placeholder="field_id"
                    error={conditionalRules.enable?.dependsOn ? 
                      !conditionalRules.enable.dependsOn.trim() : false}
                    helperText={conditionalRules.enable?.dependsOn ? 
                      (!conditionalRules.enable.dependsOn.trim() ? 
                        'نام فیلد وابسته نمی‌تواند خالی باشد' : 'برای اطمینان از صحت، نام دقیق فیلد را وارد کنید') : ''}
                    sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                  />
                  <HelpTooltip
                    title="فیلد وابسته"
                    description="نام فیلدی که شرط فعال‌سازی بر اساس آن بررسی می‌شود."
                    example="status یا isActive"
                  />
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FormControl fullWidth>
                    <InputLabel>شرط</InputLabel>
                    <Select
                      value={conditionalRules.enable?.condition || 'equals'}
                      onChange={(e) => handleEnableChange('condition', e.target.value)}
                      label="شرط"
                      sx={{ background: 'rgba(255, 255, 255, 0.8)' }}
                    >
                      <MenuItem value="equals">برابر</MenuItem>
                      <MenuItem value="not_equals">مخالف</MenuItem>
                      <MenuItem value="greater_than">بزرگتر از</MenuItem>
                      <MenuItem value="less_than">کوچکتر از</MenuItem>
                      <MenuItem value="greater_equal">بزرگتر یا مساوی</MenuItem>
                      <MenuItem value="less_equal">کوچکتر یا مساوی</MenuItem>
                      <MenuItem value="empty">خالی</MenuItem>
                      <MenuItem value="not_empty">غیرخالی</MenuItem>
                      <MenuItem value="contains">شامل</MenuItem>
                      <MenuItem value="not_contains">غیرشامل</MenuItem>
                    </Select>
                  </FormControl>
                  <HelpTooltip
                    title="شرط"
                    description="نوع شرط برای فعال‌سازی فیلد."
                    example="برابر: مقدار دقیقاً همان باشد"
                  />
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    label="مقدار شرط"
                    value={conditionalRules.enable?.value || ''}
                    onChange={(e) => handleEnableChange('value', e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                  />
                  <HelpTooltip
                    title="مقدار شرط"
                    description="مقداری که برای فعال‌سازی فیلد مورد نیاز است."
                    example="active یا 1"
                  />
                </Box>
              </Grid>
            </Grid>
          )}
        </Grid>

        {/* مقایسه با فیلد دیگر */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={conditionalRules.comparison?.enabled || false}
                  onChange={(e) => handleComparisonChange('enabled', e.target.checked)}
                  size="small"
                />
              }
              label="مقایسه با فیلد دیگر"
              sx={{ mb: 1 }}
            />
            <HelpTooltip
              title="مقایسه با فیلد دیگر"
              description="بررسی رابطه عددی بین دو فیلد."
              example="مقدار این فیلد باید بزرگتر از فیلد قیمت پایه باشد"
            />
          </Box>
          {conditionalRules.comparison?.enabled && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    label="فیلد مقایسه"
                    value={conditionalRules.comparison?.targetField || ''}
                    onChange={(e) => handleComparisonChange('targetField', e.target.value)}
                    placeholder="field_id"
                    sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                  />
                  <HelpTooltip
                    title="فیلد مقایسه"
                    description="نام فیلدی که با آن مقایسه می‌شود."
                    example="basePrice یا discountAmount"
                  />
                </Box>


              </Grid>
              <Grid item xs={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FormControl fullWidth>
                    <InputLabel>نوع مقایسه</InputLabel>
                    <Select
                      value={conditionalRules.comparison?.operator || 'greater_than'}
                      onChange={(e) => handleComparisonChange('operator', e.target.value)}
                      label="نوع مقایسه"
                      sx={{ background: 'rgba(255, 255, 255, 0.8)' }}
                    >
                      <MenuItem value="greater_than">بزرگتر از</MenuItem>
                      <MenuItem value="less_than">کوچکتر از</MenuItem>
                      <MenuItem value="equals">مساوی با</MenuItem>
                      <MenuItem value="not_equals">مخالف</MenuItem>
                      <MenuItem value="greater_equal">بزرگتر یا مساوی</MenuItem>
                      <MenuItem value="less_equal">کوچکتر یا مساوی</MenuItem>
                    </Select>
                  </FormControl>
                  <HelpTooltip
                    title="نوع مقایسه"
                    description="نوع رابطه عددی با فیلد مقایسه."
                    example="بزرگتر از: فیلد > فیلد مقایسه"
                  />
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="اضافه یا کم کردن"
                    value={conditionalRules.comparison?.offset || ''}
                    onChange={(e) => handleComparisonChange('offset', parseFloat(e.target.value) || undefined)}
                    placeholder="0"
                    sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                  />
                  <HelpTooltip
                    title="اضافه یا کم کردن"
                    description="مقدار اضافی یا کسر شونده از فیلد مقایسه."
                    example="100 برای اضافه کردن 100 به فیلد مقایسه"
                  />
                </Box>
              </Grid>
            </Grid>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
});

NumberDependencyRules.displayName = 'NumberDependencyRules';
