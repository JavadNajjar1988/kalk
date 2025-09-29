// Number Security Properties Component
// کامپوننت ویژگی‌های امنیت و ذخیره‌سازی فیلد عددی

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

interface NumberSecurityPropertiesProps {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
}

export const NumberSecurityProperties = memo<NumberSecurityPropertiesProps>(({
  formData,
  onChange: handleChange,
}) => {
  const numberField = formData.numberField || {};

  const handleNumberFieldChange = (key: string, value: any) => {
    handleChange('numberField', { ...numberField, [key]: value });
  };

  const handleIndexingChange = (key: string, value: any) => {
    const indexing = numberField.indexing || {};
    handleNumberFieldChange('indexing', { ...indexing, [key]: value });
  };

  const handleSensitiveDataDetectionChange = (key: string, value: any) => {
    const sensitiveDataDetection = numberField.sensitiveDataDetection || { enabled: false };
    handleNumberFieldChange('sensitiveDataDetection', { ...sensitiveDataDetection, [key]: value });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <h4 style={{ margin: 0, color: '#4A90E2', fontWeight: 600 }}>
          ویژگی‌های امنیت و ذخیره‌سازی
        </h4>
      </Box>
      
      <Grid container spacing={2}>
        {/* نمایه‌سازی - جست‌وجو */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={numberField.indexing?.searchable || false}
                  onChange={(e) => handleIndexingChange('searchable', e.target.checked)}
                  size="small"
                />
              }
              label="قابل جست‌وجو"
            />
            <HelpTooltip
              title="قابل جست‌وجو"
              description="امکان جست‌وجو در مقادیر این فیلد."
              example="جست‌وجو در مبالغ یا تعداد محصولات"
            />
          </Box>
        </Grid>
        
        {/* نمایه‌سازی - فیلتر */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={numberField.indexing?.filterable || false}
                  onChange={(e) => handleIndexingChange('filterable', e.target.checked)}
                  size="small"
                />
              }
              label="قابل فیلتر"
            />
            <HelpTooltip
              title="قابل فیلتر"
              description="امکان فیلتر کردن بر اساس مقادیر این فیلد."
              example="فیلتر بر اساس محدوده قیمت یا تعداد"
            />
          </Box>
        </Grid>
        
        {/* نمایه‌سازی - مرتب‌سازی */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={numberField.indexing?.sortable || false}
                  onChange={(e) => handleIndexingChange('sortable', e.target.checked)}
                  size="small"
                />
              }
              label="قابل مرتب‌سازی"
            />
            <HelpTooltip
              title="قابل مرتب‌سازی"
              description="امکان مرتب‌سازی بر اساس مقادیر این فیلد."
              example="مرتب‌سازی بر اساس قیمت یا تاریخ"
            />
          </Box>
        </Grid>
        
        {/* ذخیره نسخه خام و نرمال‌شده */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={numberField.storeRawAndNormalized || false}
                  onChange={(e) => handleNumberFieldChange('storeRawAndNormalized', e.target.checked)}
                  size="small"
                />
              }
              label="ذخیره نسخه خام و نرمال‌شده"
            />
            <HelpTooltip
              title="ذخیره نسخه خام و نرمال‌شده"
              description="ذخیره هم نسخه اصلی و هم نسخه پردازش شده."
              example="خام: '1,000' و نرمال: 1000"
            />
          </Box>
        </Grid>
        
        {/* تشخیص اطلاعات حساس */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={numberField.sensitiveDataDetection?.enabled || false}
                  onChange={(e) => handleSensitiveDataDetectionChange('enabled', e.target.checked)}
                  size="small"
                />
              }
              label="تشخیص اطلاعات حساس"
            />
            <HelpTooltip
              title="تشخیص اطلاعات حساس"
              description="تشخیص و هشدار برای اطلاعات حساس مانند شماره کارت."
              example="تشخیص شماره کارت اعتباری یا کد ملی"
            />
          </Box>
        </Grid>
        
        {/* عمل تشخیص اطلاعات حساس */}
        {numberField.sensitiveDataDetection?.enabled && (
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControl fullWidth>
                <InputLabel>عمل تشخیص</InputLabel>
                <Select
                  value={numberField.sensitiveDataDetection?.action || 'warn'}
                  onChange={(e) => handleSensitiveDataDetectionChange('action', e.target.value)}
                  label="عمل تشخیص"
                  sx={{ background: 'rgba(255, 255, 255, 0.8)' }}
                >
                  <MenuItem value="warn">هشدار</MenuItem>
                  <MenuItem value="block">مسدود</MenuItem>
                </Select>
              </FormControl>
              <HelpTooltip
                title="عمل تشخیص"
                description="نوع واکنش به تشخیص اطلاعات حساس."
                example="هشدار: نمایش پیام، مسدود: جلوگیری از ورودی"
              />
            </Box>
          </Grid>
        )}
        
        {/* الگوهای تشخیص اطلاعات حساس */}
        {numberField.sensitiveDataDetection?.enabled && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                label="الگوهای تشخیص (جدا شده با کاما)"
                value={numberField.sensitiveDataDetection?.patterns?.join(', ') || ''}
                onChange={(e) => {
                  const patterns = e.target.value.split(',').map(p => p.trim()).filter(p => p);
                  handleSensitiveDataDetectionChange('patterns', patterns);
                }}
                placeholder="^[0-9]{16}$, ^[0-9]{10}$"
                multiline
                rows={2}
                sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
              />
              <HelpTooltip
                title="الگوهای تشخیص"
                description="الگوهای Regex برای تشخیص اطلاعات حساس."
                example="^[0-9]{16}$ برای شماره کارت 16 رقمی"
              />
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
});

NumberSecurityProperties.displayName = 'NumberSecurityProperties';
