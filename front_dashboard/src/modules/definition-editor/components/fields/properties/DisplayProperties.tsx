import React, { memo, useEffect } from 'react';
import { Box, Typography, Paper, Grid, TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch } from '@mui/material';
import HelpTooltip from '../shared/HelpTooltip';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';

interface DisplayPropertiesProps {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
}

const DisplayProperties: React.FC<DisplayPropertiesProps> = ({ formData, onChange }) => {
  // Handle display type changes that might affect options
  useEffect(() => {
    // If display type changes to one that supports options, and we don't have options yet,
    // initialize with an empty array
    const supportsOptionsDisplay = ['accordion', 'chips', 'pill'].includes(formData.variant || '');
    const isTextType = ['text', 'textarea'].includes(formData.type || '');
    
    if (supportsOptionsDisplay && isTextType && !formData.options) {
      onChange('options', []);
    }
  }, [formData.variant, formData.type, formData.options, onChange]);

  // Handle variant change - also update displayType for consistency
  const handleVariantChange = (value: string) => {
    // Use a single onChange call to update both properties atomically
    onChange('variant', value);
    // Update displayType in the next tick to avoid race condition
    setTimeout(() => {
      onChange('displayType', value);
    }, 0);
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
        ویژگی‌های نمایشی
      </Typography>
      
      <Grid container spacing={3}>
        {/* Display Type */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>نوع نمایش</InputLabel>
            <Select
              value={formData.variant || 'plain'}
              onChange={(e) => handleVariantChange(e.target.value)}
              label="نوع نمایش"
              sx={{
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <MenuItem value="plain">معمولی</MenuItem>
              <MenuItem value="accordion">آکاردئونی</MenuItem>
              <MenuItem value="textarea">چندخطی</MenuItem>
              <MenuItem value="richtext">متن غنی</MenuItem>
              <MenuItem value="inline">درجا</MenuItem>
              <MenuItem value="chips">چیپ‌ها</MenuItem>
              <MenuItem value="pill">پِل</MenuItem>
              <MenuItem value="masked">ماسک‌شده</MenuItem>
              <MenuItem value="popover">پاپ‌اور</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Selection Helper */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControl fullWidth>
              <InputLabel>کمک انتخاب</InputLabel>
              <Select
                value={formData.selectionAid || 'none'}
                onChange={(e) => onChange('selectionAid', e.target.value)}
                label="کمک انتخاب"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <MenuItem value="none">هیچ</MenuItem>
                <MenuItem value="single">انتخاب تکی</MenuItem>
                <MenuItem value="multi">انتخاب چندتایی</MenuItem>
              </Select>
            </FormControl>
            <HelpTooltip
              title="کمک انتخاب"
              description="نوع کمک انتخاب برای فیلد"
              example="انتخاب تکی یا چندتایی"
            />
          </Box>
        </Grid>

        {/* Size */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>اندازه</InputLabel>
            <Select
              value={formData.size || 'md'}
              onChange={(e) => onChange('size', e.target.value)}
              label="اندازه"
              sx={{
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <MenuItem value="sm">کوچک</MenuItem>
              <MenuItem value="md">متوسط</MenuItem>
              <MenuItem value="lg">بزرگ</MenuItem>
              <MenuItem value="full">کامل</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Icon */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="آیکون"
            value={formData.icon || ''}
            onChange={(e) => onChange('icon', e.target.value)}
            placeholder="🔤"
            sx={{
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
              },
            }}
          />
        </Grid>

        {/* Prefix and Suffix */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="پیشوند"
            value={formData.prefix || ''}
            onChange={(e) => onChange('prefix', e.target.value)}
            placeholder="مثال: $"
            sx={{
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
              },
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="پسوند"
            value={formData.suffix || ''}
            onChange={(e) => onChange('suffix', e.target.value)}
            placeholder="مثال: تومان"
            sx={{
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
              },
            }}
          />
        </Grid>

        {/* Counter Display */}
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>نمایش شمارنده</InputLabel>
            <Select
              value={formData.counterDisplay || 'off'}
              onChange={(e) => onChange('counterDisplay', e.target.value)}
              label="نمایش شمارنده"
              sx={{
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <MenuItem value="off">خاموش</MenuItem>
              <MenuItem value="bottom">پایین فیلد</MenuItem>
              <MenuItem value="inside">داخل فیلد</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Copy Button */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.copyButton || false}
                  onChange={(e) => onChange('copyButton', e.target.checked)}
                  size="small"
                />
              }
              label="دکمه کپی"
            />
            <HelpTooltip
              title="دکمه کپی"
              description="نمایش دکمه کپی محتوای فیلد"
              example="دکمه کپی کنار فیلد برای کپی سریع"
            />
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default memo(DisplayProperties);