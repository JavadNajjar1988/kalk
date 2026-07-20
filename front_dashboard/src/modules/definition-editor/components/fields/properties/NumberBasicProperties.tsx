// Number Basic Properties Component
// کامپوننت ویژگی‌های پایه فیلد عددی

import React, { memo } from 'react';
import {
  Box,
  Grid,
  TextField,
} from '@mui/material';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';
import HelpTooltip from '../shared/HelpTooltip';

interface NumberBasicPropertiesProps {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
}

export const NumberBasicProperties = memo<NumberBasicPropertiesProps>(({
  formData,
  onChange: handleChange,
}) => {

  return (
    <Box>
      {/* ویژگی‌های عمومی */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <h4 style={{ margin: 0, color: 'var(--mui-palette-primary-main)', fontWeight: 600 }}>
            ویژگی‌های عمومی
          </h4>
        </Box>
        
        <Grid container spacing={2}>
          {/* عنوان */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                label="عنوان *"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="نام فیلد"
                required
                sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
              />
              <HelpTooltip
                title="عنوان فیلد"
                description="نام نمایشی فیلد که کاربر می‌بیند."
                example="مبلغ پرداخت یا تعداد محصول"
              />
            </Box>
          </Grid>
          
          {/* کلید یکتا */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                label="کلید یکتا *"
                value={formData.englishName || ''}
                onChange={(e) => handleChange('englishName', e.target.value)}
                placeholder="field_key"
                required
                sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
              />
              <HelpTooltip
                title="کلید یکتا"
                description="شناسه یکتای فیلد برای استفاده در کد."
                example="payment_amount یا product_count"
              />
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* ویژگی‌های اختیاری */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <h4 style={{ margin: 0, color: 'var(--mui-palette-primary-main)', fontWeight: 600 }}>
            ویژگی‌های اختیاری
          </h4>
        </Box>
        
        <Grid container spacing={2}>
          {/* راهنما (placeholder) */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                label="راهنما (placeholder)"
                value={formData.placeholder || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Limit placeholder to 50 characters to prevent UI issues
                  const limitedValue = value.length > 50 ? value.substring(0, 50) : value;
                  handleChange('placeholder', limitedValue);
                }}
                placeholder="مثال: 1000000"
                error={!!(formData.placeholder && formData.placeholder.length > 50)}
                helperText={
                  formData.placeholder && formData.placeholder.length > 50 
                    ? 'حداکثر 50 کاراکتر مجاز است' 
                    : `${formData.placeholder?.length || 0}/50`
                }
                sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
              />
              <HelpTooltip
                title="راهنما"
                description="متن راهنمای داخل فیلد قبل از ورودی کاربر."
                example="مبلغ را وارد کنید یا تعداد محصول"
              />
            </Box>
          </Grid>
          
          {/* توضیح کوتاه زیر فیلد */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                label="توضیح کوتاه زیر فیلد"
                value={formData.helpText || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Limit helpText to 100 characters to prevent UI issues
                  const limitedValue = value.length > 100 ? value.substring(0, 100) : value;
                  handleChange('helpText', limitedValue);
                }}
                placeholder="راهنمای استفاده از فیلد"
                error={!!(formData.helpText && formData.helpText.length > 100)}
                helperText={
                  formData.helpText && formData.helpText.length > 100 
                    ? 'حداکثر 100 کاراکتر مجاز است' 
                    : `${formData.helpText?.length || 0}/100`
                }
                sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
              />
              <HelpTooltip
                title="توضیح کوتاه"
                description="راهنمای ثابت زیر فیلد برای قوانین/نکات."
                example="حداکثر 10,000,000 ریال یا حداقل 1 عدد"
              />
            </Box>
          </Grid>
          
          {/* واحد */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                label="واحد"
                value={formData.unit || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Limit unit to 20 characters and basic validation
                  const limitedValue = value.length > 20 ? value.substring(0, 20) : value;
                  handleChange('unit', limitedValue);
                }}
                placeholder="ریال، دلار، درصد، عدد"
                error={!!(formData.unit && formData.unit.length > 20)}
                helperText={
                  formData.unit && formData.unit.length > 20 
                    ? 'حداکثر 20 کاراکتر مجاز است. مثال: ريال، کيلوگرم، متر' 
                    : `${formData.unit?.length || 0}/20`
                }
                sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
              />
              <HelpTooltip
                title="واحد"
                description="واحد اندازه‌گیری یا نوع مقدار."
                example="ریال، دلار، درصد، عدد، کیلوگرم"
              />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
});

NumberBasicProperties.displayName = 'NumberBasicProperties';
