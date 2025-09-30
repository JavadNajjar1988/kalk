import React, { memo, useCallback } from 'react';
import { Box, Typography, Paper, Grid, TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch } from '@mui/material';
import HelpTooltip from '../shared/HelpTooltip';

interface BehaviorLogicPropertiesProps {
  formData: any;
  onChange: (key: string, value: any) => void;
}

const BehaviorLogicProperties: React.FC<BehaviorLogicPropertiesProps> = ({ formData, onChange }) => {
  // Memoize editable after save toggle handler
  const handleEditableAfterSaveToggle = useCallback((checked: boolean) => {
    onChange('editableAfterSave', checked);
  }, [onChange]);

  // Memoize auto save toggle handler
  const handleAutoSaveToggle = useCallback((checked: boolean) => {
    onChange('enableAutoSave', checked);
  }, [onChange]);

  // Memoize auto save delay change handler
  const handleAutoSaveDelayChange = useCallback((value: string) => {
    const numValue = value ? parseInt(value) : 300;
    onChange('autoSaveDelay', isNaN(numValue) ? 300 : numValue);
  }, [onChange]);

  // Memoize auto save interval change handler
  const handleAutoSaveIntervalChange = useCallback((value: string) => {
    const numValue = value ? parseInt(value) : 30;
    onChange('autoSaveInterval', isNaN(numValue) ? 30 : numValue);
  }, [onChange]);

  // Memoize conditional display toggle handler
  const handleConditionalDisplayToggle = useCallback((checked: boolean) => {
    onChange('enableConditionalDisplay', checked);
  }, [onChange]);

  // Memoize conditional display field change handler
  const handleConditionalDisplayFieldChange = useCallback((value: string) => {
    onChange('conditionalDisplayField', value);
  }, [onChange]);

  // Memoize conditional display operator change handler
  const handleConditionalDisplayOperatorChange = useCallback((value: string) => {
    onChange('conditionalDisplayOperator', value);
  }, [onChange]);

  // Memoize conditional display value change handler
  const handleConditionalDisplayValueChange = useCallback((value: string) => {
    onChange('conditionalDisplayValue', value);
  }, [onChange]);

  // Memoize conditional enable toggle handler
  const handleConditionalEnableToggle = useCallback((checked: boolean) => {
    onChange('enableConditionalEnable', checked);
  }, [onChange]);

  // Memoize conditional enable field change handler
  const handleConditionalEnableFieldChange = useCallback((value: string) => {
    onChange('conditionalEnableField', value);
  }, [onChange]);

  // Memoize conditional enable operator change handler
  const handleConditionalEnableOperatorChange = useCallback((value: string) => {
    onChange('conditionalEnableOperator', value);
  }, [onChange]);

  // Memoize conditional enable value change handler
  const handleConditionalEnableValueChange = useCallback((value: string) => {
    onChange('conditionalEnableValue', value);
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
        ویژگی‌های رفتار و منطق
      </Typography>
      
      <Grid container spacing={3}>
        {/* Editable After Save */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.editableAfterSave !== undefined ? formData.editableAfterSave : true}
                  onChange={(e) => handleEditableAfterSaveToggle(e.target.checked)}
                  size="small"
                />
              }
              label="قابل‌ویرایش بعد از ثبت"
            />
            <HelpTooltip
              title="قابل‌ویرایش بعد از ثبت"
              description="امکان ویرایش فیلد پس از ثبت اولیه"
              example="فیلد قابل تغییر بعد از ذخیره"
            />
          </Box>
        </Grid>

        {/* Auto Save */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.enableAutoSave || false}
                  onChange={(e) => handleAutoSaveToggle(e.target.checked)}
                  size="small"
                />
              }
              label="ذخیره خودکار"
            />
            <HelpTooltip
              title="ذخیره خودکار"
              description="ذخیره خودکار محتوا با تنظیم زمان تأخیر"
              example="ذخیره بعد از ۳ ثانیه توقف تایپ"
            />
          </Box>
          {formData.enableAutoSave && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="تأخیر (ثانیه)"
                  type="number"
                  value={formData.autoSaveDelay || 300}
                  onChange={(e) => handleAutoSaveDelayChange(e.target.value)}
                  inputProps={{ min: 100, max: 10000, step: 100 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="فاصله ذخیره (ثانیه)"
                  type="number"
                  value={formData.autoSaveInterval || 30}
                  onChange={(e) => handleAutoSaveIntervalChange(e.target.value)}
                  inputProps={{ min: 10, max: 600 }}
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

        {/* Conditional Display */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.enableConditionalDisplay || false}
                  onChange={(e) => handleConditionalDisplayToggle(e.target.checked)}
                  size="small"
                />
              }
              label="نمایش شرطی"
            />
            <HelpTooltip
              title="نمایش شرطی"
              description="نمایش فیلد بر اساس مقدار فیلد دیگر"
              example="نمایش فیلد 'شهر' اگر 'کشور' = 'ایران'"
            />
          </Box>
          {formData.enableConditionalDisplay && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="فیلد مرجع"
                  value={formData.conditionalDisplayField || ''}
                  onChange={(e) => handleConditionalDisplayFieldChange(e.target.value)}
                  placeholder="نام فیلد"
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
                  <InputLabel>شرط</InputLabel>
                  <Select
                    value={formData.conditionalDisplayOperator || 'equals'}
                    onChange={(e) => handleConditionalDisplayOperatorChange(e.target.value)}
                    label="شرط"
                    sx={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <MenuItem value="equals">برابر</MenuItem>
                    <MenuItem value="not_equals">نابرابر</MenuItem>
                    <MenuItem value="contains">شامل</MenuItem>
                    <MenuItem value="not_contains">شامل نباشد</MenuItem>
                    <MenuItem value="empty">خالی</MenuItem>
                    <MenuItem value="not_empty">خالی نباشد</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="مقدار"
                  value={formData.conditionalDisplayValue || ''}
                  onChange={(e) => handleConditionalDisplayValueChange(e.target.value)}
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

        {/* Conditional Enable */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.enableConditionalEnable || false}
                  onChange={(e) => handleConditionalEnableToggle(e.target.checked)}
                  size="small"
                />
              }
              label="فعال‌سازی شرطی"
            />
            <HelpTooltip
              title="فعال‌سازی شرطی"
              description="فعال‌سازی فیلد بر اساس مقدار فیلد دیگر"
              example="فعال شدن فیلد 'کدپستی' اگر 'آدرس' خالی نباشد"
            />
          </Box>
          {formData.enableConditionalEnable && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="فیلد مرجع"
                  value={formData.conditionalEnableField || ''}
                  onChange={(e) => handleConditionalEnableFieldChange(e.target.value)}
                  placeholder="نام فیلد"
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
                  <InputLabel>شرط</InputLabel>
                  <Select
                    value={formData.conditionalEnableOperator || 'equals'}
                    onChange={(e) => handleConditionalEnableOperatorChange(e.target.value)}
                    label="شرط"
                    sx={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <MenuItem value="equals">برابر</MenuItem>
                    <MenuItem value="not_equals">نابرابر</MenuItem>
                    <MenuItem value="contains">شامل</MenuItem>
                    <MenuItem value="not_contains">شامل نباشد</MenuItem>
                    <MenuItem value="empty">خالی</MenuItem>
                    <MenuItem value="not_empty">خالی نباشد</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="مقدار"
                  value={formData.conditionalEnableValue || ''}
                  onChange={(e) => handleConditionalEnableValueChange(e.target.value)}
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
      </Grid>
    </Paper>
  );
};

export default memo(BehaviorLogicProperties);