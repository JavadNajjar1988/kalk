import React, { memo } from 'react';
import { Box, Typography, Paper, Grid, TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch, Slider } from '@mui/material';
import HelpTooltip from '../shared/HelpTooltip';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';

interface BehaviorLogicPropertiesProps {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
}

const BehaviorLogicProperties: React.FC<BehaviorLogicPropertiesProps> = ({ formData, onChange }) => {
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
        ویژگی‌های رفتار و منطق
      </Typography>
      
      <Grid container spacing={3}>
        {/* Editable After Save */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.editableAfterSave !== undefined ? formData.editableAfterSave : true}
                  onChange={(e) => onChange('editableAfterSave', e.target.checked)}
                  size="small"
                />
              }
              label="قابل‌ویرایش بعد از ثبت"
            />
            <HelpTooltip
              title="قابل‌ویرایش بعد از ثبت"
              description="امکان ویرایش فیلد پس از ثبت اولیه"
              example="فیلد قابل تغییر بعد از ذخیره"
            />
          </Box>
        </Grid>

        {/* Auto Save */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.enableAutoSave || false}
                  onChange={(e) => onChange('enableAutoSave', e.target.checked)}
                  size="small"
                />
              }
              label="ذخیره خودکار"
            />
            <HelpTooltip
              title="ذخیره خودکار"
              description="ذخیره خودکار محتوا با تنظیم زمان تأخیر"
              example="ذخیره بعد از ۳ ثانیه توقف تایپ"
            />
          </Box>
          {formData.enableAutoSave && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="تأخیر (میلی‌ثانیه)"
                  type="number"
                  value={formData.autoSaveDelay || 300}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = value ? parseInt(value) : 300;
                    onChange('autoSaveDelay', isNaN(numValue) ? 300 : numValue);
                  }}
                  inputProps={{ min: 100, max: 10000, step: 100 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="فاصله ذخیره (ثانیه)"
                  type="number"
                  value={formData.autoSaveInterval || 30}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = value ? parseInt(value) : 30;
                    onChange('autoSaveInterval', isNaN(numValue) ? 30 : numValue);
                  }}
                  inputProps={{ min: 10, max: 600 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                    },
                  }}
                />
              </Grid>
            </Grid>
          )}
        </Grid>

        {/* Conditional Visibility */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.enableConditionalDisplay || false}
                  onChange={(e) => onChange('enableConditionalDisplay', e.target.checked)}
                  size="small"
                />
              }
              label="نمایش شرطی"
            />
            <HelpTooltip
              title="نمایش شرطی"
              description="نمایش فیلد بر اساس مقدار فیلد دیگر"
              example="نمایش فیلد 'شهر' اگر 'کشور' = 'ایران'"
            />
          </Box>
          {formData.enableConditionalDisplay && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="فیلد مرجع"
                  value={formData.conditionalDisplayField || ''}
                  onChange={(e) => onChange('conditionalDisplayField', e.target.value)}
                  placeholder="نام فیلد"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>شرط</InputLabel>
                  <Select
                    value={formData.conditionalDisplayOperator || 'equals'}
                    onChange={(e) => onChange('conditionalDisplayOperator', e.target.value)}
                    label="شرط"
                    sx={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <MenuItem value="equals">برابر</MenuItem>
                    <MenuItem value="not_equals">نابرابر</MenuItem>
                    <MenuItem value="contains">شامل</MenuItem>
                    <MenuItem value="not_contains">شامل نباشد</MenuItem>
                    <MenuItem value="empty">خالی</MenuItem>
                    <MenuItem value="not_empty">خالی نباشد</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="مقدار"
                  value={formData.conditionalDisplayValue || ''}
                  onChange={(e) => onChange('conditionalDisplayValue', e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                    },
                  }}
                />
              </Grid>
            </Grid>
          )}
        </Grid>

        {/* Conditional Enable */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.enableConditionalEnable || false}
                  onChange={(e) => onChange('enableConditionalEnable', e.target.checked)}
                  size="small"
                />
              }
              label="فعال‌سازی شرطی"
            />
            <HelpTooltip
              title="فعال‌سازی شرطی"
              description="فعال‌سازی فیلد بر اساس مقدار فیلد دیگر"
              example="فعال شدن فیلد 'کدپستی' اگر 'آدرس' خالی نباشد"
            />
          </Box>
          {formData.enableConditionalEnable && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="فیلد مرجع"
                  value={formData.conditionalEnableField || ''}
                  onChange={(e) => onChange('conditionalEnableField', e.target.value)}
                  placeholder="نام فیلد"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>شرط</InputLabel>
                  <Select
                    value={formData.conditionalEnableOperator || 'equals'}
                    onChange={(e) => onChange('conditionalEnableOperator', e.target.value)}
                    label="شرط"
                    sx={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <MenuItem value="equals">برابر</MenuItem>
                    <MenuItem value="not_equals">نابرابر</MenuItem>
                    <MenuItem value="greater_than">بزرگتر از</MenuItem>
                    <MenuItem value="less_than">کوچکتر از</MenuItem>
                    <MenuItem value="contains">شامل</MenuItem>
                    <MenuItem value="not_contains">شامل نباشد</MenuItem>
                    <MenuItem value="empty">خالی</MenuItem>
                    <MenuItem value="not_empty">خالی نباشد</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="مقدار"
                  value={formData.conditionalEnableValue || ''}
                  onChange={(e) => onChange('conditionalEnableValue', e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                    },
                  }}
                />
              </Grid>
            </Grid>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default memo(BehaviorLogicProperties);