import React, { memo, useEffect } from 'react';
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
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(135, 206, 250, 0.2)',
        boxShadow: '0 4px 16px rgba(135, 206, 250, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      }}
    >
      <Typography variant="h6" sx={{ mb: 3, color: '#4A90E2', fontWeight: 600 }}>
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
                value={formData.textareaRows || 3}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value ? parseInt(value) : 3;
                  onChange('textareaRows', isNaN(numValue) ? 3 : numValue);
                }}
                inputProps={{ min: 1, max: 20 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
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
                value={formData.textareaMaxRows || 10}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value ? parseInt(value) : 10;
                  onChange('textareaMaxRows', isNaN(numValue) ? 10 : numValue);
                }}
                inputProps={{ min: 1, max: 50 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
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
                value={formData.textareaResize || 'both'}
                onChange={(e) => onChange('textareaResize', e.target.value)}
                label="قابلیت تغییر اندازه"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
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
              value={formData.richtextHeight || 200}
              onChange={(e) => onChange('richtextHeight', parseInt(e.target.value))}
              inputProps={{ min: 100, max: 1000 }}
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
              label="ابزارهای نوار ابزار (با کاما جدا کنید)"
              value={formData.richtextToolbar?.join(', ') || 'bold,italic,underline'}
              onChange={(e) => onChange('richtextToolbar', e.target.value.split(',').map(item => item.trim()).filter(item => item))}
              placeholder="bold,italic,underline,list,link"
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
      
      {/* Chips Properties */}
      {currentVariant === 'chips' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>رنگ چیپ‌ها</InputLabel>
              <Select
                value={formData.chipsColor || 'default'}
                onChange={(e) => onChange('chipsColor', e.target.value)}
                label="رنگ چیپ‌ها"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
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
                value={formData.chipsVariant || 'filled'}
                onChange={(e) => onChange('chipsVariant', e.target.value)}
                label="سبک چیپ‌ها"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
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
                    checked={formData.chipsDeletable || false}
                    onChange={(e) => onChange('chipsDeletable', e.target.checked)}
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
              value={formData.chipsMaxCount || ''}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = value ? parseInt(value) : 0;
                onChange('chipsMaxCount', isNaN(numValue) ? 0 : numValue);
              }}
              inputProps={{ min: 1 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
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
                value={formData.newOptionText || ''}
                onChange={(e) => onChange('newOptionText', e.target.value)}
                placeholder="متن گزینه جدید"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={() => {
                  if (formData.newOptionText?.trim()) {
                    const currentOptions = formData.options || [];
                    onChange('options', [...currentOptions, { 
                      id: Date.now().toString(), 
                      label: formData.newOptionText.trim(),
                      value: formData.newOptionText.trim().toLowerCase().replace(/\s+/g, '_')
                    }]);
                    onChange('newOptionText', '');
                  }
                }}
                disabled={!formData.newOptionText?.trim()}
                sx={{
                  minWidth: 120,
                  background: 'linear-gradient(135deg, #4A90E2, #7BB3F0)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #3A7BC8, #6BA3E0)',
                  },
                }}
              >
                افزودن
              </Button>
            </Box>
            
            {/* Display existing options */}
            {formData.options && formData.options.length > 0 && (
              <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
            {formData.options.map((option, index) => (
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
                  border: '1px solid rgba(135, 206, 250, 0.3)',
                }}
              >
                <Typography variant="body2">
                  {typeof option === 'string' ? option : (option as any).label}
                </Typography>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => {
                        const updatedOptions = formData.options?.filter((_, i) => i !== index) || [];
                        onChange('options', updatedOptions);
                      }}
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
                value={formData.pillColor || 'default'}
                onChange={(e) => onChange('pillColor', e.target.value)}
                label="رنگ پِل"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
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
                value={formData.pillSize || 'medium'}
                onChange={(e) => onChange('pillSize', e.target.value)}
                label="اندازه پِل"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
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
                value={formData.newOptionText || ''}
                onChange={(e) => onChange('newOptionText', e.target.value)}
                placeholder="متن گزینه جدید"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={() => {
                  if (formData.newOptionText?.trim()) {
                    const currentOptions = formData.options || [];
                    onChange('options', [...currentOptions, { 
                      id: Date.now().toString(), 
                      label: formData.newOptionText.trim(),
                      value: formData.newOptionText.trim().toLowerCase().replace(/\s+/g, '_')
                    }]);
                    onChange('newOptionText', '');
                  }
                }}
                disabled={!formData.newOptionText?.trim()}
                sx={{
                  minWidth: 120,
                  background: 'linear-gradient(135deg, #4A90E2, #7BB3F0)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #3A7BC8, #6BA3E0)',
                  },
                }}
              >
                افزودن
              </Button>
            </Box>
            
            {/* Display existing options */}
            {formData.options && formData.options.length > 0 && (
              <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
            {formData.options.map((option, index) => (
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
                  border: '1px solid rgba(135, 206, 250, 0.3)',
                }}
              >
                <Typography variant="body2">
                  {typeof option === 'string' ? option : (option as any).label}
                </Typography>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => {
                        const updatedOptions = formData.options?.filter((_, i) => i !== index) || [];
                        onChange('options', updatedOptions);
                      }}
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
                value={formData.popoverTrigger || 'click'}
                onChange={(e) => onChange('popoverTrigger', e.target.value)}
                label="رویداد فعال‌سازی"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
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
                value={formData.popoverSize || 'medium'}
                onChange={(e) => onChange('popoverSize', e.target.value)}
                label="اندازه پاپ‌اور"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
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
                value={formData.popoverPosition || 'top'}
                onChange={(e) => onChange('popoverPosition', e.target.value)}
                label="موقعیت پاپ‌اور"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
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
                value={formData.inlineLabelPosition || 'left'}
                onChange={(e) => onChange('inlineLabelPosition', e.target.value)}
                label="موقعیت برچسب"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
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
              value={formData.inlineLabelWidth || 30}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = value ? parseInt(value) : 30;
                onChange('inlineLabelWidth', isNaN(numValue) ? 30 : numValue);
              }}
              inputProps={{ min: 10, max: 90 }}
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
              <InputLabel>فاصله‌گذاری</InputLabel>
              <Select
                value={formData.inlineSpacing || 'normal'}
                onChange={(e) => onChange('inlineSpacing', e.target.value)}
                label="فاصله‌گذاری"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
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
              value={formData.accordionTitle || ''}
              onChange={(e) => onChange('accordionTitle', e.target.value)}
              placeholder="عنوان آکاردئون"
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                },
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>حالت نمایش آکاردئون</InputLabel>
              <Select
                value={formData.accordionDisplayMode || 'title'}
                onChange={(e) => onChange('accordionDisplayMode', e.target.value)}
                label="حالت نمایش آکاردئون"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
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
                value={formData.newOptionText || ''}
                onChange={(e) => onChange('newOptionText', e.target.value)}
                placeholder="متن گزینه جدید"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={() => {
                  if (formData.newOptionText?.trim()) {
                    const currentOptions = formData.options || [];
                    onChange('options', [...currentOptions, { 
                      id: Date.now().toString(), 
                      label: formData.newOptionText.trim(),
                      value: formData.newOptionText.trim().toLowerCase().replace(/\s+/g, '_')
                    }]);
                    onChange('newOptionText', '');
                  }
                }}
                disabled={!formData.newOptionText?.trim()}
                sx={{
                  minWidth: 120,
                  background: 'linear-gradient(135deg, #4A90E2, #7BB3F0)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #3A7BC8, #6BA3E0)',
                  },
                }}
              >
                افزودن
              </Button>
            </Box>
            
            {/* Display existing options */}
            {formData.options && formData.options.length > 0 && (
              <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
            {formData.options.map((option, index) => (
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
                  border: '1px solid rgba(135, 206, 250, 0.3)',
                }}
              >
                <Typography variant="body2">
                  {typeof option === 'string' ? option : (option as any).label}
                </Typography>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => {
                        const updatedOptions = formData.options?.filter((_, i) => i !== index) || [];
                        onChange('options', updatedOptions);
                      }}
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