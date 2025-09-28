import React, { memo } from 'react';
import { Box, Typography, Paper, Grid, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch, TextField } from '@mui/material';
import HelpTooltip from '../shared/HelpTooltip';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';

interface SecurityStoragePropertiesProps {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
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
                  checked={formData.piiCheck?.enabled || false}
                  onChange={(e) => onChange('piiCheck', { 
                    ...formData.piiCheck, 
                    enabled: e.target.checked 
                  })}
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
          {formData.piiCheck?.enabled && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>عمل</InputLabel>
                  <Select
                    value={formData.piiCheck.action || 'warn'}
                    onChange={(e) => onChange('piiCheck', { 
                      ...formData.piiCheck, 
                      action: e.target.value as any
                    })}
                    label="عمل"
                    sx={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <MenuItem value="warn">هشدار</MenuItem>
                    <MenuItem value="block">مسدود</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="الگوهای سفارشی (با کاما جدا کنید)"
                  value={formData.piiCheck.patterns?.join(', ') || ''}
                  onChange={(e) => onChange('piiCheck', { 
                    ...formData.piiCheck, 
                    patterns: e.target.value.split(',').map(p => p.trim()).filter(p => p)
                  })}
                  placeholder="الگوی ۱, الگوی ۲, الگوی ۳"
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

        {/* Inappropriate Words Detection */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.profanityCheck?.enabled || false}
                  onChange={(e) => onChange('profanityCheck', { 
                    ...formData.profanityCheck, 
                    enabled: e.target.checked 
                  })}
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
          {formData.profanityCheck?.enabled && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>عمل</InputLabel>
                  <Select
                    value={formData.profanityCheck.action || 'warn'}
                    onChange={(e) => onChange('profanityCheck', { 
                      ...formData.profanityCheck, 
                      action: e.target.value as any
                    })}
                    label="عمل"
                    sx={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <MenuItem value="warn">هشدار</MenuItem>
                    <MenuItem value="block">مسدود</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="کلمات سفارشی (با کاما جدا کنید)"
                  value={formData.profanityCheck.customWords?.join(', ') || ''}
                  onChange={(e) => onChange('profanityCheck', { 
                    ...formData.profanityCheck, 
                    customWords: e.target.value.split(',').map(w => w.trim()).filter(w => w)
                  })}
                  placeholder="کلمه ۱, کلمه ۲, کلمه ۳"
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

        {/* Indexing Options */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#64748B' }}>
            نمایه‌سازی
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.indexing?.searchable || false}
                  onChange={(e) => onChange('indexing', { 
                    ...formData.indexing, 
                    searchable: e.target.checked 
                  })}
                  size="small"
                />
              }
              label="قابل جستجو"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.indexing?.filterable || false}
                  onChange={(e) => onChange('indexing', { 
                    ...formData.indexing, 
                    filterable: e.target.checked 
                  })}
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
              value={formData.analyzer || 'standard'}
              onChange={(e) => onChange('analyzer', e.target.value)}
              label="آنالایزر جستجو"
              sx={{
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <MenuItem value="standard">استاندارد</MenuItem>
              <MenuItem value="persian">فارسی</MenuItem>
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