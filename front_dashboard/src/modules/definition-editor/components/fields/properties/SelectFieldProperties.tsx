import React from 'react';
import { Box, Typography, Paper, Grid, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import HelpTooltip from '../shared/HelpTooltip';
import OptionsEditor from './OptionsEditor';
import { FieldPropertiesStepProps } from '../types/FieldEditTypes';

const SelectFieldProperties: React.FC<FieldPropertiesStepProps> = ({ formData, onChange }) => {
  // Only show for select field types
  if (formData.type !== 'select' && formData.type !== 'multiselect') {
    return null;
  }

  return (
    <Box>
      {/* Options Management */}
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
          مدیریت گزینه‌ها
        </Typography>
        
        <OptionsEditor
          options={formData.options || []}
          onChange={(options) => onChange('options', options)}
          fieldType={formData.type}
        />
      </Paper>

      {/* Select Specific Properties */}
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
          ویژگی‌های خاص فیلد انتخابی
        </Typography>
        
        <Grid container spacing={3}>
          {/* Placeholder */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                label="متن راهنما"
                value={formData.placeholder || ''}
                onChange={(e) => onChange('placeholder', e.target.value)}
                placeholder="مثال: گزینه‌ای را انتخاب کنید"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.8)',
                  },
                }}
              />
              <HelpTooltip
                title="متن راهنما"
                description="متنی که در داخل فیلد قبل از انتخاب نمایش داده می‌شود."
                example="«گزینه‌ای را انتخاب کنید»"
              />
            </Box>
          </Grid>

          {/* Default Value */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControl fullWidth>
                <InputLabel>مقدار پیش‌فرض</InputLabel>
                <Select
                  value={formData.defaultValue || ''}
                  onChange={(e) => onChange('defaultValue', e.target.value)}
                  label="مقدار پیش‌فرض"
                  sx={{
                    background: 'rgba(255, 255, 255, 0.8)',
                  }}
                >
                  <MenuItem value="">هیچ</MenuItem>
                  {Array.isArray(formData.options) && formData.options.map((option: any, index: number) => {
                    const optionValue = typeof option === 'string' ? option : option.value;
                    const optionLabel = typeof option === 'string' ? option : option.label;
                    return (
                      <MenuItem key={index} value={optionValue}>
                        {optionLabel}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
              <HelpTooltip
                title="مقدار پیش‌فرض"
                description="گزینه‌ای که به طور پیش‌فرض انتخاب شده باشد."
                example="«تهران» به عنوان استان پیش‌فرض"
              />
            </Box>
          </Grid>

          {/* Searchable */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControl fullWidth>
                <InputLabel>قابلیت جستجو</InputLabel>
                <Select
                  value={formData.selectionHelper || 'none'}
                  onChange={(e) => onChange('selectionHelper', e.target.value)}
                  label="قابلیت جستجو"
                  sx={{
                    background: 'rgba(255, 255, 255, 0.8)',
                  }}
                >
                  <MenuItem value="none">غیرفعال</MenuItem>
                  <MenuItem value="single">فعال (انتخاب تکی)</MenuItem>
                  {formData.type === 'multiselect' && (
                    <MenuItem value="multiple">فعال (انتخاب چندتایی)</MenuItem>
                  )}
                </Select>
              </FormControl>
              <HelpTooltip
                title="قابلیت جستجو"
                description="امکان جستجو در بین گزینه‌ها برای یافتن سریع‌تر."
                example="در لیست استان‌ها با تایپ «تهران» مستقیماً به گزینه بروید"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default SelectFieldProperties;