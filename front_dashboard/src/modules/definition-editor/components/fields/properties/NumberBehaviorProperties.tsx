// Number Behavior Properties Component
// کامپوننت ویژگی‌های رفتار و منطق فیلد عددی

import React, { memo } from 'react';
import {
  Box,
  Grid,
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

interface NumberBehaviorPropertiesProps {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
}

export const NumberBehaviorProperties = memo<NumberBehaviorPropertiesProps>(({
  formData,
  onChange: handleChange,
}) => {
  const numberField = formData.numberField || {};

  const handleNumberFieldChange = (key: string, value: any) => {
    handleChange('numberField', { ...numberField, [key]: value });
  };

  const handleAutoCalculationChange = (key: string, value: any) => {
    const autoCalculation = numberField.autoCalculation || { enabled: false };
    handleNumberFieldChange('autoCalculation', { ...autoCalculation, [key]: value });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <h4 style={{ margin: 0, color: '#4A90E2', fontWeight: 600 }}>
          ویژگی‌های رفتار و منطق
        </h4>
      </Box>
      
      <Grid container spacing={2}>
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
              label="قابل‌ویرایش بعد از ثبت"
            />
            <HelpTooltip
              title="قابل‌ویرایش بعد از ثبت"
              description="امکان ویرایش فیلد پس از ذخیره اولیه."
              example="برای فیلدهای قابل تغییر مانند قیمت"
            />
          </Box>
        </Grid>
        
        {/* ذخیره خودکار */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={numberField.enableAutoSave || false}
                  onChange={(e) => handleNumberFieldChange('enableAutoSave', e.target.checked)}
                  size="small"
                />
              }
              label="ذخیره خودکار"
            />
            <HelpTooltip
              title="ذخیره خودکار"
              description="ذخیره خودکار تغییرات با تاخیر مشخص."
              example="ذخیره خودکار پس از 2 ثانیه عدم تغییر"
            />
          </Box>
        </Grid>
        
        {/* تاخیر ذخیره خودکار */}
        {numberField.enableAutoSave && (
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                type="number"
                label="تاخیر ذخیره خودکار (ثانیه)"
                value={numberField.autoSaveDelay || ''}
                onChange={(e) => handleNumberFieldChange('autoSaveDelay', parseInt(e.target.value) || undefined)}
                placeholder="2"
                sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
              />
              <HelpTooltip
                title="تاخیر ذخیره خودکار"
                description="مدت زمان انتظار قبل از ذخیره خودکار."
                example="2 ثانیه برای ذخیره خودکار"
              />
            </Box>
          </Grid>
        )}
        
        {/* نمایش شرطی */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={numberField.enableConditionalDisplay || false}
                  onChange={(e) => handleNumberFieldChange('enableConditionalDisplay', e.target.checked)}
                  size="small"
                />
              }
              label="نمایش شرطی"
            />
            <HelpTooltip
              title="نمایش شرطی"
              description="نمایش فیلد بر اساس مقدار فیلد دیگر."
              example="اگر نوع محصول = فیزیکی باشد، فیلد وزن نمایش داده شود"
            />
          </Box>
        </Grid>
        
        {/* فیلد وابسته برای نمایش شرطی */}
        {numberField.enableConditionalDisplay && (
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                label="فیلد وابسته (نمایش شرطی)"
                value={numberField.conditionalDisplayField || ''}
                onChange={(e) => handleNumberFieldChange('conditionalDisplayField', e.target.value)}
                placeholder="field_id"
                sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
              />
              <HelpTooltip
                title="فیلد وابسته"
                description="نام فیلدی که شرط نمایش بر اساس آن بررسی می‌شود."
                example="productType یا category"
              />
            </Box>
          </Grid>
        )}
        
        {/* عملگر شرطی برای نمایش */}
        {numberField.enableConditionalDisplay && (
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControl fullWidth>
                <InputLabel>عملگر شرطی (نمایش)</InputLabel>
                <Select
                  value={numberField.conditionalDisplayOperator || 'equals'}
                  onChange={(e) => handleNumberFieldChange('conditionalDisplayOperator', e.target.value)}
                  label="عملگر شرطی (نمایش)"
                  sx={{ background: 'rgba(255, 255, 255, 0.8)' }}
                >
                  <MenuItem value="equals">برابر</MenuItem>
                  <MenuItem value="not_equals">مخالف</MenuItem>
                  <MenuItem value="greater_than">بزرگتر از</MenuItem>
                  <MenuItem value="less_than">کوچکتر از</MenuItem>
                </Select>
              </FormControl>
              <HelpTooltip
                title="عملگر شرطی"
                description="نوع مقایسه برای شرط نمایش."
                example="برابر: مقدار دقیقاً همان باشد"
              />
            </Box>
          </Grid>
        )}
        
        {/* مقدار شرطی برای نمایش */}
        {numberField.enableConditionalDisplay && (
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                label="مقدار شرطی (نمایش)"
                value={numberField.conditionalDisplayValue || ''}
                onChange={(e) => handleNumberFieldChange('conditionalDisplayValue', e.target.value)}
                placeholder="physical"
                sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
              />
              <HelpTooltip
                title="مقدار شرطی"
                description="مقداری که برای نمایش فیلد مورد نیاز است."
                example="physical یا digital"
              />
            </Box>
          </Grid>
        )}
        
        {/* فعال‌سازی شرطی */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={numberField.enableConditionalEnable || false}
                  onChange={(e) => handleNumberFieldChange('enableConditionalEnable', e.target.checked)}
                  size="small"
                />
              }
              label="فعال‌سازی شرطی"
            />
            <HelpTooltip
              title="فعال‌سازی شرطی"
              description="فعال/غیرفعال کردن فیلد بر اساس مقدار فیلد دیگر."
              example="اگر وضعیت = فعال باشد، فیلد قابل ویرایش شود"
            />
          </Box>
        </Grid>
        
        {/* فیلد وابسته برای فعال‌سازی شرطی */}
        {numberField.enableConditionalEnable && (
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                label="فیلد وابسته (فعال‌سازی شرطی)"
                value={numberField.conditionalEnableField || ''}
                onChange={(e) => handleNumberFieldChange('conditionalEnableField', e.target.value)}
                placeholder="field_id"
                sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
              />
              <HelpTooltip
                title="فیلد وابسته"
                description="نام فیلدی که شرط فعال‌سازی بر اساس آن بررسی می‌شود."
                example="status یا isActive"
              />
            </Box>
          </Grid>
        )}
        
        {/* عملگر شرطی برای فعال‌سازی */}
        {numberField.enableConditionalEnable && (
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControl fullWidth>
                <InputLabel>عملگر شرطی (فعال‌سازی)</InputLabel>
                <Select
                  value={numberField.conditionalEnableOperator || 'equals'}
                  onChange={(e) => handleNumberFieldChange('conditionalEnableOperator', e.target.value)}
                  label="عملگر شرطی (فعال‌سازی)"
                  sx={{ background: 'rgba(255, 255, 255, 0.8)' }}
                >
                  <MenuItem value="equals">برابر</MenuItem>
                  <MenuItem value="not_equals">مخالف</MenuItem>
                  <MenuItem value="greater_than">بزرگتر از</MenuItem>
                  <MenuItem value="less_than">کوچکتر از</MenuItem>
                </Select>
              </FormControl>
              <HelpTooltip
                title="عملگر شرطی"
                description="نوع مقایسه برای شرط فعال‌سازی."
                example="برابر: مقدار دقیقاً همان باشد"
              />
            </Box>
          </Grid>
        )}
        
        {/* مقدار شرطی برای فعال‌سازی */}
        {numberField.enableConditionalEnable && (
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                label="مقدار شرطی (فعال‌سازی)"
                value={numberField.conditionalEnableValue || ''}
                onChange={(e) => handleNumberFieldChange('conditionalEnableValue', e.target.value)}
                placeholder="active"
                sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
              />
              <HelpTooltip
                title="مقدار شرطی"
                description="مقداری که برای فعال‌سازی فیلد مورد نیاز است."
                example="active یا true"
              />
            </Box>
          </Grid>
        )}
        
        {/* محاسبه خودکار */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={numberField.autoCalculation?.enabled || false}
                  onChange={(e) => handleAutoCalculationChange('enabled', e.target.checked)}
                  size="small"
                />
              }
              label="محاسبه خودکار"
            />
            <HelpTooltip
              title="محاسبه خودکار"
              description="محاسبه مقدار بر اساس فرمول تعریف شده."
              example="محاسبه مجموع یا میانگین فیلدهای دیگر"
            />
          </Box>
        </Grid>
        
        {/* فرمول محاسبه خودکار */}
        {numberField.autoCalculation?.enabled && (
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                label="فرمول محاسبه"
                value={numberField.autoCalculation?.formula || ''}
                onChange={(e) => handleAutoCalculationChange('formula', e.target.value)}
                placeholder="field1 + field2 * 0.1"
                sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
              />
              <HelpTooltip
                title="فرمول محاسبه"
                description="فرمول JavaScript برای محاسبه مقدار."
                example="price * quantity یا (field1 + field2) / 2"
              />
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
});

NumberBehaviorProperties.displayName = 'NumberBehaviorProperties';
