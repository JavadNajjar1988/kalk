import React, { memo } from 'react';
import { Box, Typography, Paper, Grid, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch } from '@mui/material';
import HelpTooltip from '../shared/HelpTooltip';

interface SecurityStoragePropertiesProps {
  formData: any;
  onChange: (key: string, value: any) => void;
}

const SecurityStorageProperties: React.FC<SecurityStoragePropertiesProps> = ({ formData, onChange }) => {
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
        ویژگی‌های امنیت و ذخیره‌سازی
      </Typography>
      
      <Grid container spacing={3}>
        {/* Sensitive Data Detection */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.enableSensitiveDataDetection || false}
                  onChange={(e) => onChange('enableSensitiveDataDetection', e.target.checked)}
                  size="small"
                />
              }
              label="تشخیص اطلاعات حساس"
            />
            <HelpTooltip
              title="تشخیص اطلاعات حساس"
              description="تشخیص خودکار ایمیل، شماره ملی و اطلاعات حساس"
              example="تشخیص 'ali@gmail.com' یا '0123456789'"
            />
          </Box>
          {formData.enableSensitiveDataDetection && (
            <FormControl fullWidth>
              <InputLabel>عمل</InputLabel>
              <Select
                value={formData.sensitiveDataAction || 'warn'}
                onChange={(e) => onChange('sensitiveDataAction', e.target.value)}
                label="عمل"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <MenuItem value="warn">هشدار</MenuItem>
                <MenuItem value="block">مسدود</MenuItem>
                <MenuItem value="mask">ماسک</MenuItem>
              </Select>
            </FormControl>
          )}
        </Grid>

        {/* Inappropriate Words Detection */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.enableInappropriateWordsDetection || false}
                  onChange={(e) => onChange('enableInappropriateWordsDetection', e.target.checked)}
                  size="small"
                />
              }
              label="تشخیص کلمات نامناسب"
            />
            <HelpTooltip
              title="تشخیص کلمات نامناسب"
              description="فیلتر کلمات نامناسب و ناشایست"
              example="تشخیص و فیلتر کلمات غیرمجاز"
            />
          </Box>
          {formData.enableInappropriateWordsDetection && (
            <FormControl fullWidth>
              <InputLabel>عمل</InputLabel>
              <Select
                value={formData.inappropriateWordsAction || 'warn'}
                onChange={(e) => onChange('inappropriateWordsAction', e.target.value)}
                label="عمل"
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <MenuItem value="warn">هشدار</MenuItem>
                <MenuItem value="block">مسدود</MenuItem>
                <MenuItem value="replace">جایگزین</MenuItem>
              </Select>
            </FormControl>
          )}
        </Grid>

        {/* Indexing Options */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#64748B' }}>
            نمایه‌سازی
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.searchable || false}
                  onChange={(e) => onChange('searchable', e.target.checked)}
                  size="small"
                />
              }
              label="قابل جستجو"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.filterable || false}
                  onChange={(e) => onChange('filterable', e.target.checked)}
                  size="small"
                />
              }
              label="قابل فیلتر"
            />
          </Box>
        </Grid>

        {/* Search Analyzer */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>آنالایزر جستجو</InputLabel>
            <Select
              value={formData.searchAnalyzer || 'standard'}
              onChange={(e) => onChange('searchAnalyzer', e.target.value)}
              label="آنالایزر جستجو"
              sx={{
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <MenuItem value="standard">استاندارد</MenuItem>
              <MenuItem value="persian">فارسی</MenuItem>
              <MenuItem value="custom">سفارشی</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Store Raw and Normalized */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.storeRawAndNormalized || false}
                  onChange={(e) => onChange('storeRawAndNormalized', e.target.checked)}
                  size="small"
                />
              }
              label="ذخیره نسخه خام و نرمال‌شده"
            />
            <HelpTooltip
              title="ذخیره نسخه خام و نرمال‌شده"
              description="ذخیره هم ورودی اصلی و هم نسخه پردازش شده"
              example="خام: '  سلام دنیا  ' / نرمال: 'سلام دنیا'"
            />
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default memo(SecurityStorageProperties);