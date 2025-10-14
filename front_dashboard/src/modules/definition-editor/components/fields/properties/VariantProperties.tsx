import React, { memo, useEffect, useMemo, useCallback } from 'react';
import { Box, Typography, Paper, Grid, TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch, Button } from '@mui/material';
import HelpTooltip from '../shared/HelpTooltip';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';

interface VariantPropertiesProps {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
}

const VariantProperties: React.FC<VariantPropertiesProps> = ({ formData, onChange }) => {
  // Handle variant-specific property visibility
  const currentVariant = formData.variant || 'plain';

  // Memoize variant properties configuration
  const variantConfig = useMemo(() => ({
    // Textarea properties
    textareaRows: formData.textareaRows || 3,
    textareaMaxRows: formData.textareaMaxRows || 10,
    textareaResize: formData.textareaResize || 'both',
    
    // Richtext properties
    richtextToolbar: formData.richtextToolbar || ['bold', 'italic', 'underline'],
    richtextHeight: formData.richtextHeight || 200,
    
    // Chips properties
    chipsColor: formData.chipsColor || 'default',
    chipsVariant: formData.chipsVariant || 'filled',
    chipsDeletable: formData.chipsDeletable || false,
    chipsMaxCount: formData.chipsMaxCount || 0,
    
    // Pill properties
    pillColor: formData.pillColor || 'default',
    pillSize: formData.pillSize || 'medium',
    
    // Popover properties
    popoverTrigger: formData.popoverTrigger || 'click',
    popoverSize: formData.popoverSize || 'medium',
    popoverPosition: formData.popoverPosition || 'top',
    
    // Inline properties
    inlineLabelPosition: formData.inlineLabelPosition || 'left',
    inlineLabelWidth: formData.inlineLabelWidth || 30,
    inlineSpacing: formData.inlineSpacing || 'normal',
    
    // Accordion properties
    accordionTitle: formData.accordionTitle || '',
    accordionDisplayMode: formData.accordionDisplayMode || 'title',
    
    // Options management
    options: formData.options || [],
    newOptionText: formData.newOptionText || ''
  }), [
    formData.textareaRows, formData.textareaMaxRows, formData.textareaResize,
    formData.richtextToolbar, formData.richtextHeight,
    formData.chipsColor, formData.chipsVariant, formData.chipsDeletable, formData.chipsMaxCount,
    formData.pillColor, formData.pillSize,
    formData.popoverTrigger, formData.popoverSize, formData.popoverPosition,
    formData.inlineLabelPosition, formData.inlineLabelWidth, formData.inlineSpacing,
    formData.accordionTitle, formData.accordionDisplayMode,
    formData.options, formData.newOptionText
  ]);

  // Optimized change handlers
  const handleTextareaRowsChange = useCallback((value: string) => {
    const numValue = value ? parseInt(value) : 3;
    onChange('textareaRows', isNaN(numValue) ? 3 : numValue);
  }, [onChange]);

  const handleTextareaMaxRowsChange = useCallback((value: string) => {
    const numValue = value ? parseInt(value) : 10;
    onChange('textareaMaxRows', isNaN(numValue) ? 10 : numValue);
  }, [onChange]);

  const handleTextareaResizeChange = useCallback((value: string) => {
    onChange('textareaResize', value);
  }, [onChange]);

  const handleRichtextHeightChange = useCallback((value: string) => {
    onChange('richtextHeight', parseInt(value));
  }, [onChange]);

  const handleRichtextToolbarChange = useCallback((value: string) => {
    onChange('richtextToolbar', value.split(',').map(item => item.trim()).filter(item => item));
  }, [onChange]);

  const handleChipsColorChange = useCallback((value: string) => {
    onChange('chipsColor', value);
  }, [onChange]);

  const handleChipsVariantChange = useCallback((value: string) => {
    onChange('chipsVariant', value);
  }, [onChange]);

  const handleChipsDeletableChange = useCallback((value: boolean) => {
    onChange('chipsDeletable', value);
  }, [onChange]);

  const handleChipsMaxCountChange = useCallback((value: string) => {
    const numValue = value ? parseInt(value) : 0;
    onChange('chipsMaxCount', isNaN(numValue) ? 0 : numValue);
  }, [onChange]);

  const handlePillColorChange = useCallback((value: string) => {
    onChange('pillColor', value);
  }, [onChange]);

  const handlePillSizeChange = useCallback((value: string) => {
    onChange('pillSize', value);
  }, [onChange]);

  const handlePopoverTriggerChange = useCallback((value: string) => {
    onChange('popoverTrigger', value);
  }, [onChange]);

  const handlePopoverSizeChange = useCallback((value: string) => {
    onChange('popoverSize', value);
  }, [onChange]);

  const handlePopoverPositionChange = useCallback((value: string) => {
    onChange('popoverPosition', value);
  }, [onChange]);

  const handleInlineLabelPositionChange = useCallback((value: string) => {
    onChange('inlineLabelPosition', value);
  }, [onChange]);

  const handleInlineLabelWidthChange = useCallback((value: string) => {
    const numValue = value ? parseInt(value) : 30;
    onChange('inlineLabelWidth', isNaN(numValue) ? 30 : numValue);
  }, [onChange]);

  const handleInlineSpacingChange = useCallback((value: string) => {
    onChange('inlineSpacing', value);
  }, [onChange]);

  const handleAccordionTitleChange = useCallback((value: string) => {
    onChange('accordionTitle', value);
  }, [onChange]);

  const handleAccordionDisplayModeChange = useCallback((value: string) => {
    onChange('accordionDisplayMode', value);
  }, [onChange]);

  const handleNewOptionTextChange = useCallback((value: string) => {
    onChange('newOptionText', value);
  }, [onChange]);

  const handleAddOption = useCallback(() => {
    if (variantConfig.newOptionText?.trim()) {
      const currentOptions = variantConfig.options;
      onChange('options', [...currentOptions, { 
        id: Date.now().toString(), 
        label: variantConfig.newOptionText.trim(),
        value: variantConfig.newOptionText.trim().toLowerCase().replace(/\s+/g, '_')
      }]);
      onChange('newOptionText', '');
    }
  }, [variantConfig.newOptionText, variantConfig.options, onChange]);

  const handleDeleteOption = useCallback((index: number) => {
    const updatedOptions = variantConfig.options.filter((_, i) => i !== index);
    onChange('options', updatedOptions);
  }, [variantConfig.options, onChange]);
  
  // Update properties when variant changes
  useEffect(() => {
    // Reset variant-specific properties when changing variants
    if (currentVariant !== 'textarea') {
      onChange('textareaRows', undefined);
      onChange('textareaMaxRows', undefined);
      onChange('textareaResize', undefined);
    }
    
    if (currentVariant !== 'richtext') {
      onChange('richtextToolbar', undefined);
      onChange('richtextHeight', undefined);
    }
    
    if (currentVariant !== 'chips') {
      onChange('chipsColor', undefined);
      onChange('chipsVariant', undefined);
      onChange('chipsDeletable', undefined);
      onChange('chipsMaxCount', undefined);
    }
    
    if (currentVariant !== 'pill') {
      onChange('pillColor', undefined);
      onChange('pillSize', undefined);
    }
    
    if (currentVariant !== 'popover') {
      onChange('popoverTrigger', undefined);
      onChange('popoverSize', undefined);
      onChange('popoverPosition', undefined);
    }
    
    if (currentVariant !== 'inline') {
      onChange('inlineLabelPosition', undefined);
      onChange('inlineLabelWidth', undefined);
      onChange('inlineSpacing', undefined);
    }
  }, [currentVariant, onChange]);

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
        ویژگی‌های تخصصی نوع نمایش
      </Typography>
      
      {/* Textarea Properties */}
      {currentVariant === 'textarea' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                label="تعداد ردیف‌ها"
                type="number"
                value={variantConfig.textareaRows}
                onChange={(e) => handleTextareaRowsChange(e.target.value)}
                inputProps={{ min: 1, max: 20 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.8)',
                  },
                }}
              />
              <HelpTooltip
                title="تعداد ردیف‌ها"
                description="تعداد خطوط قابل مشاهده در textarea"
                example="3 خط برای نمایش اولیه"
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                label="حداکثر ردیف‌ها"
                type="number"
                value={variantConfig.textareaMaxRows}
                onChange={(e) => handleTextareaMaxRowsChange(e.target.value)}
                inputProps={{ min: 1, max: 50 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.8)',
                  },
                }}
              />
              <HelpTooltip
                title="حداکثر ردیف‌ها"
                description="حداکثر تعداد خطوط قابل نمایش در textarea"
                example="10 خط حداکثر"
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>قابلیت تغییر اندازه</InputLabel>
              <Select
                value={variantConfig.textareaResize}
                onChange={(e) => handleTextareaResizeChange(e.target.value)}
                label="قابلیت تغییر اندازه"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                <MenuItem value="none">هیچ</MenuItem>
                <MenuItem value="both">هر دو جهت</MenuItem>
                <MenuItem value="horizontal">افقی</MenuItem>
                <MenuItem value="vertical">عمودی</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      )}
      
      {/* Richtext Properties */}
      {currentVariant === 'richtext' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="ارتفاع ویرایشگر (پیکسل)"
              type="number"
              value={variantConfig.richtextHeight}
              onChange={(e) => handleRichtextHeightChange(e.target.value)}
              inputProps={{ min: 100, max: 1000 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.8)',
                },
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="ابزارهای نوار ابزار (با کاما جدا کنید)"
              value={variantConfig.richtextToolbar.join(', ')}
              onChange={(e) => handleRichtextToolbarChange(e.target.value)}
              placeholder="bold,italic,underline,list,link"
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.8)',
                },
              }}
            />
          </Grid>
        </Grid>
      )}
      
      {/* Chips Properties */}
      {currentVariant === 'chips' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>رنگ چیپ‌ها</InputLabel>
              <Select
                value={variantConfig.chipsColor}
                onChange={(e) => handleChipsColorChange(e.target.value)}
                label="رنگ چیپ‌ها"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                <MenuItem value="default">پیش‌فرض</MenuItem>
                <MenuItem value="primary">اصلی</MenuItem>
                <MenuItem value="secondary">ثانویه</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>سبک چیپ‌ها</InputLabel>
              <Select
                value={variantConfig.chipsVariant}
                onChange={(e) => handleChipsVariantChange(e.target.value)}
                label="سبک چیپ‌ها"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                <MenuItem value="filled">پر</MenuItem>
                <MenuItem value="outlined">حاشیه‌دار</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={variantConfig.chipsDeletable}
                    onChange={(e) => handleChipsDeletableChange(e.target.checked)}
                    size="small"
                  />
                }
                label="قابل حذف"
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="حداکثر تعداد"
              type="number"
              value={variantConfig.chipsMaxCount}
              onChange={(e) => handleChipsMaxCountChange(e.target.value)}
              inputProps={{ min: 1 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.8)',
                },
              }}
            />
          </Grid>
          
          {/* Options Management for Chips */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#64748B' }}>
              مدیریت گزینه‌های چیپ‌ها
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="گزینه جدید"
                value={variantConfig.newOptionText}
                onChange={(e) => handleNewOptionTextChange(e.target.value)}
                placeholder="متن گزینه جدید"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.8)',
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={handleAddOption}
                disabled={!variantConfig.newOptionText?.trim()}
                sx={{
                  minWidth: 120,
                  background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  '&:hover': {
                    background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                  },
                }}
              >
                افزودن
              </Button>
            </Box>
            
            {/* Display existing options */}
            {variantConfig.options && variantConfig.options.length > 0 && (
              <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
            {variantConfig.options.map((option, index) => (
              <Box
                key={typeof option === 'string' ? index : (option as any).id || index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1,
                  mb: 1,
                  background: 'rgba(255, 255, 255, 0.6)',
                  borderRadius: 1,
                  border: (theme) => `1px solid ${theme.palette.primary.main}4D`,
                }}
              >
                <Typography variant="body2">
                  {typeof option === 'string' ? option : (option as any).label}
                </Typography>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDeleteOption(index)}
                    >
                      حذف
                    </Button>
                  </Box>
                ))}
              </Box>
            )}
          </Grid>
        </Grid>
      )}
      
      {/* Pill Properties */}
      {currentVariant === 'pill' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>رنگ پِل</InputLabel>
              <Select
                value={variantConfig.pillColor}
                onChange={(e) => handlePillColorChange(e.target.value)}
                label="رنگ پِل"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                <MenuItem value="default">پیش‌فرض</MenuItem>
                <MenuItem value="primary">اصلی</MenuItem>
                <MenuItem value="secondary">ثانویه</MenuItem>
                <MenuItem value="success">موفقیت</MenuItem>
                <MenuItem value="warning">هشدار</MenuItem>
                <MenuItem value="error">خطا</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>اندازه پِل</InputLabel>
              <Select
                value={variantConfig.pillSize}
                onChange={(e) => handlePillSizeChange(e.target.value)}
                label="اندازه پِل"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                <MenuItem value="small">کوچک</MenuItem>
                <MenuItem value="medium">متوسط</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* Options Management for Pills */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#64748B' }}>
              مدیریت گزینه‌های پِل
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="گزینه جدید"
                value={variantConfig.newOptionText}
                onChange={(e) => handleNewOptionTextChange(e.target.value)}
                placeholder="متن گزینه جدید"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.8)',
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={handleAddOption}
                disabled={!variantConfig.newOptionText?.trim()}
                sx={{
                  minWidth: 120,
                  background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  '&:hover': {
                    background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                  },
                }}
              >
                افزودن
              </Button>
            </Box>
            
            {/* Display existing options */}
            {variantConfig.options && variantConfig.options.length > 0 && (
              <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
            {variantConfig.options.map((option, index) => (
              <Box
                key={typeof option === 'string' ? index : (option as any).id || index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1,
                  mb: 1,
                  background: 'rgba(255, 255, 255, 0.6)',
                  borderRadius: 1,
                  border: (theme) => `1px solid ${theme.palette.primary.main}4D`,
                }}
              >
                <Typography variant="body2">
                  {typeof option === 'string' ? option : (option as any).label}
                </Typography>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDeleteOption(index)}
                    >
                      حذف
                    </Button>
                  </Box>
                ))}
              </Box>
            )}
          </Grid>
        </Grid>
      )}
      
      {/* Popover Properties */}
      {currentVariant === 'popover' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>رویداد فعال‌سازی</InputLabel>
              <Select
                value={variantConfig.popoverTrigger}
                onChange={(e) => handlePopoverTriggerChange(e.target.value)}
                label="رویداد فعال‌سازی"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                <MenuItem value="click">کلیک</MenuItem>
                <MenuItem value="hover">هاور</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>اندازه پاپ‌اور</InputLabel>
              <Select
                value={variantConfig.popoverSize}
                onChange={(e) => handlePopoverSizeChange(e.target.value)}
                label="اندازه پاپ‌اور"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                <MenuItem value="small">کوچک</MenuItem>
                <MenuItem value="medium">متوسط</MenuItem>
                <MenuItem value="large">بزرگ</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>موقعیت پاپ‌اور</InputLabel>
              <Select
                value={variantConfig.popoverPosition}
                onChange={(e) => handlePopoverPositionChange(e.target.value)}
                label="موقعیت پاپ‌اور"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                <MenuItem value="top">بالا</MenuItem>
                <MenuItem value="bottom">پایین</MenuItem>
                <MenuItem value="left">چپ</MenuItem>
                <MenuItem value="right">راست</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      )}
      
      {/* Inline Properties */}
      {currentVariant === 'inline' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>موقعیت برچسب</InputLabel>
              <Select
                value={variantConfig.inlineLabelPosition}
                onChange={(e) => handleInlineLabelPositionChange(e.target.value)}
                label="موقعیت برچسب"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                <MenuItem value="left">چپ</MenuItem>
                <MenuItem value="top">بالا</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="عرض برچسب (درصد)"
              type="number"
              value={variantConfig.inlineLabelWidth}
              onChange={(e) => handleInlineLabelWidthChange(e.target.value)}
              inputProps={{ min: 10, max: 90 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.8)',
                },
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>فاصله‌گذاری</InputLabel>
              <Select
                value={variantConfig.inlineSpacing}
                onChange={(e) => handleInlineSpacingChange(e.target.value)}
                label="فاصله‌گذاری"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                <MenuItem value="compact">فشرده</MenuItem>
                <MenuItem value="normal">عادی</MenuItem>
                <MenuItem value="comfortable">راحت</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      )}
      
      {/* Accordion Properties */}
      {currentVariant === 'accordion' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="عنوان آکاردئون"
              value={variantConfig.accordionTitle}
              onChange={(e) => handleAccordionTitleChange(e.target.value)}
              placeholder="عنوان آکاردئون"
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.8)',
                },
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>حالت نمایش آکاردئون</InputLabel>
              <Select
                value={variantConfig.accordionDisplayMode}
                onChange={(e) => handleAccordionDisplayModeChange(e.target.value)}
                label="حالت نمایش آکاردئون"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                <MenuItem value="title">عنوان</MenuItem>
                <MenuItem value="options">گزینه‌ها</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* Options Management for Accordion */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#64748B' }}>
              مدیریت گزینه‌های آکاردئون
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="گزینه جدید"
                value={variantConfig.newOptionText}
                onChange={(e) => handleNewOptionTextChange(e.target.value)}
                placeholder="متن گزینه جدید"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.8)',
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={handleAddOption}
                disabled={!variantConfig.newOptionText?.trim()}
                sx={{
                  minWidth: 120,
                  background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  '&:hover': {
                    background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                  },
                }}
              >
                افزودن
              </Button>
            </Box>
            
            {/* Display existing options */}
            {variantConfig.options && variantConfig.options.length > 0 && (
              <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
            {variantConfig.options.map((option, index) => (
              <Box
                key={typeof option === 'string' ? index : (option as any).id || index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1,
                  mb: 1,
                  background: 'rgba(255, 255, 255, 0.6)',
                  borderRadius: 1,
                  border: (theme) => `1px solid ${theme.palette.primary.main}4D`,
                }}
              >
                <Typography variant="body2">
                  {typeof option === 'string' ? option : (option as any).label}
                </Typography>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDeleteOption(index)}
                    >
                      حذف
                    </Button>
                  </Box>
                ))}
              </Box>
            )}
          </Grid>
        </Grid>
      )}
    </Paper>
  );
};

export default memo(VariantProperties);