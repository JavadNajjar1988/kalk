import React, { memo, useEffect, useMemo, useCallback } from 'react';
import { Box, Typography, Paper, Grid, TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch } from '@mui/material';
import HelpTooltip from '../shared/HelpTooltip';

interface DisplayPropertiesProps {
  formData: any;
  onChange: (key: string, value: any) => void;
}

const DisplayProperties: React.FC<DisplayPropertiesProps> = ({ formData, onChange }) => {
  // Memoize display properties configuration
  const displayConfig = useMemo(() => ({
    variant: formData.variant || 'plain',
    selectionAid: formData.selectionAid || 'none',
    size: formData.size || 'md',
    icon: formData.icon || '',
    prefix: formData.prefix || '',
    suffix: formData.suffix || '',
    counterDisplay: formData.counterDisplay || 'off',
    copyButton: formData.copyButton || false
  }), [formData.variant, formData.selectionAid, formData.size, formData.icon, formData.prefix, formData.suffix, formData.counterDisplay, formData.copyButton]);

  // Handle display type changes that might affect options
  useEffect(() => {
    // If display type changes to one that supports options, and we don't have options yet,
    // initialize with an empty array
    const supportsOptionsDisplay = ['accordion', 'chips', 'pill'].includes(formData.displayType);
    const isTextType = ['text', 'textarea'].includes(formData.type);
    
    if (supportsOptionsDisplay && isTextType && !formData.options) {
      onChange('options', []);
    }
  }, [formData.variant, formData.type, formData.options, onChange]);

  // Optimized change handlers
  const handleVariantChange = useCallback((value: string) => {
    onChange('variant', value);
  }, [onChange]);

  const handleSelectionAidChange = useCallback((value: string) => {
    onChange('selectionAid', value);
  }, [onChange]);

  const handleSizeChange = useCallback((value: string) => {
    onChange('size', value);
  }, [onChange]);

  const handleIconChange = useCallback((value: string) => {
    onChange('icon', value);
  }, [onChange]);

  const handlePrefixChange = useCallback((value: string) => {
    onChange('prefix', value);
  }, [onChange]);

  const handleSuffixChange = useCallback((value: string) => {
    onChange('suffix', value);
  }, [onChange]);

  const handleCounterDisplayChange = useCallback((value: string) => {
    onChange('counterDisplay', value);
  }, [onChange]);

  const handleCopyButtonChange = useCallback((value: boolean) => {
    onChange('copyButton', value);
  }, [onChange]);

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
              value={displayConfig.variant}
              onChange={(e) => handleVariantChange(e.target.value)}
              label="نوع نمایش"
              sx={{
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <MenuItem value="normal">معمولی</MenuItem>
              <MenuItem value="accordion">آکاردئونی</MenuItem>
              <MenuItem value="multiline">چندخطی</MenuItem>
              <MenuItem value="rich-text">متن غنی</MenuItem>
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
                value={displayConfig.selectionAid}
                onChange={(e) => handleSelectionAidChange(e.target.value)}
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
              value={displayConfig.size}
              onChange={(e) => handleSizeChange(e.target.value)}
              label="اندازه"
              sx={{
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <MenuItem value="small">کوچک</MenuItem>
              <MenuItem value="medium">متوسط</MenuItem>
              <MenuItem value="large">بزرگ</MenuItem>
              <MenuItem value="full">کامل</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Icon */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="آیکون"
            value={displayConfig.icon}
            onChange={(e) => handleIconChange(e.target.value)}
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
            value={displayConfig.prefix}
            onChange={(e) => handlePrefixChange(e.target.value)}
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
            value={displayConfig.suffix}
            onChange={(e) => handleSuffixChange(e.target.value)}
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
              value={displayConfig.counterDisplay}
              onChange={(e) => handleCounterDisplayChange(e.target.value)}
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
                  checked={displayConfig.copyButton}
                  onChange={(e) => handleCopyButtonChange(e.target.checked)}
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