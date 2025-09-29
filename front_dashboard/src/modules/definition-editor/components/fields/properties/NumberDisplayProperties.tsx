// Number Display Properties Component
// کامپوننت ویژگی‌های نمایشی فیلد عددی

import React, { memo } from 'react';
import {
  Box,
  Grid,
  Switch,
  FormControlLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';
import HelpTooltip from '../shared/HelpTooltip';

interface NumberDisplayPropertiesProps {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
}

export const NumberDisplayProperties = memo<NumberDisplayPropertiesProps>(({
  formData,
  onChange: handleChange,
}) => {
  const numberField = formData.numberField || {};

  const handleNumberFieldChange = (key: string, value: any) => {
    handleChange('numberField', { ...numberField, [key]: value });
  };

  const handleIconChange = (key: string, value: any) => {
    const icon = numberField.icon || {};
    handleNumberFieldChange('icon', { ...icon, [key]: value });
  };

  const handleStatusColorChange = (key: string, value: any) => {
    const statusColor = numberField.statusColor || {};
    handleNumberFieldChange('statusColor', { ...statusColor, [key]: value });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <h4 style={{ margin: 0, color: '#4A90E2', fontWeight: 600 }}>
          ویژگی‌های نمایشی
        </h4>
      </Box>
      
      <Grid container spacing={2}>
        {/* نوع نمایش */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControl fullWidth>
              <InputLabel>نوع نمایش</InputLabel>
              <Select
                value={numberField.displayType || 'simple'}
                onChange={(e) => handleNumberFieldChange('displayType', e.target.value)}
                label="نوع نمایش"
                sx={{ background: 'rgba(255, 255, 255, 0.8)' }}
              >
                <MenuItem value="simple">فیلد عددی ساده</MenuItem>
                <MenuItem value="slider">اسلایدر</MenuItem>
                <MenuItem value="spinner">چرخشی (spinner)</MenuItem>
                <MenuItem value="progress">نوار پیشرفت</MenuItem>
              </Select>
            </FormControl>
            <HelpTooltip
              title="نوع نمایش"
              description="نوع نمایش فیلد عددی."
              example="ساده: فیلد معمولی، اسلایدر: نوار لغزنده"
            />
          </Box>
        </Grid>
        
        {/* اندازه */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControl fullWidth>
              <InputLabel>اندازه</InputLabel>
              <Select
                value={numberField.size || 'medium'}
                onChange={(e) => handleNumberFieldChange('size', e.target.value)}
                label="اندازه"
                sx={{ background: 'rgba(255, 255, 255, 0.8)' }}
              >
                <MenuItem value="small">کوچک</MenuItem>
                <MenuItem value="medium">متوسط</MenuItem>
                <MenuItem value="large">بزرگ</MenuItem>
                <MenuItem value="full">تمام‌عرض</MenuItem>
              </Select>
            </FormControl>
            <HelpTooltip
              title="اندازه"
              description="اندازه نمایش فیلد."
              example="کوچک: فشرده، بزرگ: راحت‌تر برای استفاده"
            />
          </Box>
        </Grid>
        
        {/* نمایش شمارنده */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={numberField.showCounter || false}
                  onChange={(e) => handleNumberFieldChange('showCounter', e.target.checked)}
                  size="small"
                />
              }
              label="نمایش شمارنده"
            />
            <HelpTooltip
              title="نمایش شمارنده"
              description="نمایش حداقل/حداکثر مقدار در کنار فیلد."
              example="0/100 یا 1,000/10,000"
            />
          </Box>
        </Grid>
        
        {/* آیکون پیشوند */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              label="آیکون پیشوند"
              value={numberField.icon?.prefix || ''}
              onChange={(e) => handleIconChange('prefix', e.target.value)}
              placeholder="﷼"
              sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
            />
            <HelpTooltip
              title="آیکون پیشوند"
              description="نماد یا آیکون قبل از مقدار."
              example="﷼ برای ریال، $ برای دلار"
            />
          </Box>
        </Grid>
        
        {/* آیکون پسوند */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              label="آیکون پسوند"
              value={numberField.icon?.suffix || ''}
              onChange={(e) => handleIconChange('suffix', e.target.value)}
              placeholder="%"
              sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
            />
            <HelpTooltip
              title="آیکون پسوند"
              description="نماد یا آیکون بعد از مقدار."
              example="% برای درصد، عدد برای تعداد"
            />
          </Box>
        </Grid>
        
        {/* رنگ وضعیت مثبت */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              label="رنگ وضعیت مثبت"
              value={numberField.statusColor?.positive || ''}
              onChange={(e) => handleStatusColorChange('positive', e.target.value)}
              placeholder="#4CAF50"
              sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
            />
            <HelpTooltip
              title="رنگ وضعیت مثبت"
              description="رنگ نمایش برای مقادیر مثبت."
              example="سبز برای سود یا افزایش"
            />
          </Box>
        </Grid>
        
        {/* رنگ وضعیت منفی */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              label="رنگ وضعیت منفی"
              value={numberField.statusColor?.negative || ''}
              onChange={(e) => handleStatusColorChange('negative', e.target.value)}
              placeholder="#F44336"
              sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
            />
            <HelpTooltip
              title="رنگ وضعیت منفی"
              description="رنگ نمایش برای مقادیر منفی."
              example="قرمز برای ضرر یا کاهش"
            />
          </Box>
        </Grid>
        
        {/* رنگ وضعیت صفر */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              label="رنگ وضعیت صفر"
              value={numberField.statusColor?.zero || ''}
              onChange={(e) => handleStatusColorChange('zero', e.target.value)}
              placeholder="#9E9E9E"
              sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
            />
            <HelpTooltip
              title="رنگ وضعیت صفر"
              description="رنگ نمایش برای مقادیر صفر."
              example="خاکستری برای مقادیر خنثی"
            />
          </Box>
        </Grid>
        
        {/* استایل فقط‌خواندنی */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControl fullWidth>
              <InputLabel>استایل فقط‌خواندنی</InputLabel>
              <Select
                value={numberField.readOnlyStyle || 'normal'}
                onChange={(e) => handleNumberFieldChange('readOnlyStyle', e.target.value)}
                label="استایل فقط‌خواندنی"
                sx={{ background: 'rgba(255, 255, 255, 0.8)' }}
              >
                <MenuItem value="normal">عادی</MenuItem>
                <MenuItem value="disabled">غیرفعال</MenuItem>
                <MenuItem value="simple">ساده</MenuItem>
              </Select>
            </FormControl>
            <HelpTooltip
              title="استایل فقط‌خواندنی"
              description="نحوه نمایش فیلد در حالت فقط‌خواندنی."
              example="عادی: قابل مشاهده، غیرفعال: خاکستری"
            />
          </Box>
        </Grid>
        
        {/* استایل پیام خطا */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControl fullWidth>
              <InputLabel>استایل پیام خطا</InputLabel>
              <Select
                value={numberField.errorStyle || 'below'}
                onChange={(e) => handleNumberFieldChange('errorStyle', e.target.value)}
                label="استایل پیام خطا"
                sx={{ background: 'rgba(255, 255, 255, 0.8)' }}
              >
                <MenuItem value="below">زیر فیلد</MenuItem>
                <MenuItem value="tooltip">راهنمای ابزار</MenuItem>
                <MenuItem value="inline">درون خط</MenuItem>
              </Select>
            </FormControl>
            <HelpTooltip
              title="استایل پیام خطا"
              description="نحوه نمایش پیام‌های خطا."
              example="زیر فیلد: پیام زیر، راهنمای ابزار: tooltip"
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
});

NumberDisplayProperties.displayName = 'NumberDisplayProperties';
