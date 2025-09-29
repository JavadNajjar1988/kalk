import React, { memo, useMemo, useCallback } from 'react';
import { Box, Typography, Paper, Grid, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch, TextField } from '@mui/material';
import HelpTooltip from '../shared/HelpTooltip';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';

interface SecurityStoragePropertiesProps {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
}

const SecurityStorageProperties: React.FC<SecurityStoragePropertiesProps> = ({ formData, onChange }) => {
  // Memoize PII check configuration
  const piiCheckConfig = useMemo(() => ({
    enabled: formData.piiCheck?.enabled || false,
    action: formData.piiCheck?.action || 'warn',
    patterns: formData.piiCheck?.patterns || []
  }), [formData.piiCheck]);

  // Memoize profanity check configuration
  const profanityCheckConfig = useMemo(() => ({
    enabled: formData.profanityCheck?.enabled || false,
    action: formData.profanityCheck?.action || 'warn',
    customWords: formData.profanityCheck?.customWords || []
  }), [formData.profanityCheck]);

  // Memoize indexing configuration
  const indexingConfig = useMemo(() => ({
    searchable: formData.indexing?.searchable || false,
    filterable: formData.indexing?.filterable || false
  }), [formData.indexing]);

  // Memoize analyzer configuration
  const analyzerConfig = useMemo(() => formData.analyzer || 'standard', [formData.analyzer]);

  // Memoize store raw and normalized configuration
  const storeRawAndNormalizedConfig = useMemo(() => formData.storeRawAndNormalized || false, [formData.storeRawAndNormalized]);

  // Optimized change handlers
  const handlePiiCheckToggle = useCallback((enabled: boolean) => {
    onChange('piiCheck', { 
      ...formData.piiCheck, 
      enabled 
    });
  }, [formData.piiCheck, onChange]);

  const handlePiiCheckActionChange = useCallback((action: string) => {
    onChange('piiCheck', { 
      ...formData.piiCheck, 
      action: action as 'block' | 'warn'
    });
  }, [formData.piiCheck, onChange]);

  const handlePiiCheckPatternsChange = useCallback((patterns: string) => {
    onChange('piiCheck', { 
      ...formData.piiCheck, 
      patterns: patterns.split(',').map(p => p.trim()).filter(p => p)
    });
  }, [formData.piiCheck, onChange]);

  const handleProfanityCheckToggle = useCallback((enabled: boolean) => {
    onChange('profanityCheck', { 
      ...formData.profanityCheck, 
      enabled 
    });
  }, [formData.profanityCheck, onChange]);

  const handleProfanityCheckActionChange = useCallback((action: string) => {
    onChange('profanityCheck', { 
      ...formData.profanityCheck, 
      action: action as 'block' | 'warn'
    });
  }, [formData.profanityCheck, onChange]);

  const handleProfanityCheckWordsChange = useCallback((words: string) => {
    onChange('profanityCheck', { 
      ...formData.profanityCheck, 
      customWords: words.split(',').map(w => w.trim()).filter(w => w)
    });
  }, [formData.profanityCheck, onChange]);

  const handleIndexingSearchableChange = useCallback((searchable: boolean) => {
    onChange('indexing', { 
      ...formData.indexing, 
      searchable 
    });
  }, [formData.indexing, onChange]);

  const handleIndexingFilterableChange = useCallback((filterable: boolean) => {
    onChange('indexing', { 
      ...formData.indexing, 
      filterable 
    });
  }, [formData.indexing, onChange]);

  const handleAnalyzerChange = useCallback((analyzer: string) => {
    onChange('analyzer', analyzer as 'standard' | 'persian');
  }, [onChange]);

  const handleStoreRawAndNormalizedChange = useCallback((storeRawAndNormalized: boolean) => {
    onChange('storeRawAndNormalized', storeRawAndNormalized);
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
        ویژگی‌های امنیت و ذخیره‌سازی
      </Typography>
      
      <Grid container spacing={3}>
        {/* Sensitive Data Detection */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={piiCheckConfig.enabled}
                  onChange={(e) => handlePiiCheckToggle(e.target.checked)}
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
          {piiCheckConfig.enabled && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>عمل</InputLabel>
                  <Select
                    value={piiCheckConfig.action}
                    onChange={(e) => handlePiiCheckActionChange(e.target.value)}
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
                  value={piiCheckConfig.patterns.join(', ')}
                  onChange={(e) => handlePiiCheckPatternsChange(e.target.value)}
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
                  checked={profanityCheckConfig.enabled}
                  onChange={(e) => handleProfanityCheckToggle(e.target.checked)}
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
          {profanityCheckConfig.enabled && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>عمل</InputLabel>
                  <Select
                    value={profanityCheckConfig.action}
                    onChange={(e) => handleProfanityCheckActionChange(e.target.value)}
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
                  value={profanityCheckConfig.customWords.join(', ')}
                  onChange={(e) => handleProfanityCheckWordsChange(e.target.value)}
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
                  checked={indexingConfig.searchable}
                  onChange={(e) => handleIndexingSearchableChange(e.target.checked)}
                  size="small"
                />
              }
              label="قابل جستجو"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={indexingConfig.filterable}
                  onChange={(e) => handleIndexingFilterableChange(e.target.checked)}
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
              value={analyzerConfig}
              onChange={(e) => handleAnalyzerChange(e.target.value)}
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
                  checked={storeRawAndNormalizedConfig}
                  onChange={(e) => handleStoreRawAndNormalizedChange(e.target.checked)}
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