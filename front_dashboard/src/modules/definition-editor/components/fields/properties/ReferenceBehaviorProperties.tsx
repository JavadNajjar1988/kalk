import React, { memo, useMemo } from 'react';
import { Box, Grid, TextField, FormControlLabel, Switch, FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import HelpTooltip from '../shared/HelpTooltip';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';

interface Props {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
}

const ReferenceBehaviorProperties = memo<Props>(({ formData, onChange }) => {
  const delay = formData.autoSaveDelay ?? 800;
  const delayError = useMemo(() => {
    if (delay < 0) return 'تاخیر نمی‌تواند منفی باشد';
    if (delay > 600000) return 'حداکثر تاخیر 600,000 ms (10 دقیقه)';
    return '';
  }, [delay]);

  // Validate conditional field references
  const conditionalDisplayError = useMemo(() => {
    if (!formData.enableConditionalDisplay) return '';
    
    const field = formData.conditionalDisplayField?.trim();
    const operator = formData.conditionalDisplayOperator;
    const value = formData.conditionalDisplayValue?.trim();
    
    if (!field) return 'فیلد مرجع الزامی است';
    if (!operator) return 'عملگر الزامی است';
    
    // Validate operator appropriateness
    if (['empty', 'not_empty'].includes(operator) && value) {
      return 'برای عملگرهای empty/not_empty، مقدار نباید تعریف شود';
    }
    if (!['empty', 'not_empty'].includes(operator) && !value) {
      return 'برای این عملگر، مقدار الزامی است';
    }
    
    return '';
  }, [formData.enableConditionalDisplay, formData.conditionalDisplayField, formData.conditionalDisplayOperator, formData.conditionalDisplayValue]);

  const conditionalEnableError = useMemo(() => {
    if (!formData.enableConditionalEnable) return '';
    
    const field = formData.conditionalEnableField?.trim();
    const operator = formData.conditionalEnableOperator;
    const value = formData.conditionalEnableValue?.trim();
    
    if (!field) return 'فیلد مرجع الزامی است';
    if (!operator) return 'عملگر الزامی است';
    
    // Validate operator appropriateness
    if (['empty', 'not_empty'].includes(operator) && value) {
      return 'برای عملگرهای empty/not_empty، مقدار نباید تعریف شود';
    }
    if (!['empty', 'not_empty'].includes(operator) && !value) {
      return 'برای این عملگر، مقدار الزامی است';
    }
    
    return '';
  }, [formData.enableConditionalEnable, formData.conditionalEnableField, formData.conditionalEnableOperator, formData.conditionalEnableValue]);

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel control={<Switch checked={formData.editableAfterSave !== false} onChange={(e) => onChange('editableAfterSave', e.target.checked)} />} label="قابل‌ویرایش بعد از ثبت" />
            <HelpTooltip title="قابل‌ویرایش بعد از ثبت" description="پس از ثبت رکورد، امکان ویرایش این فیلد وجود داشته باشد." example="فعال برای فیلدهای غیر بحرانی" />
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel control={<Switch checked={!!formData.enableAutoSave} onChange={(e) => onChange('enableAutoSave', e.target.checked)} />} label="ذخیره خودکار" />
            <HelpTooltip title="ذخیره خودکار" description="ذخیره مقدار فیلد با تاخیر مشخص بدون نیاز به کلیک ذخیره." example="delay = 800ms" />
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField fullWidth type="number" label="تاخیر ذخیره خودکار (ms)" value={delay} onChange={(e) => onChange('autoSaveDelay', Math.max(0, Math.min(600000, parseInt(e.target.value) || 0)))} disabled={!formData.enableAutoSave} error={!!delayError && !!formData.enableAutoSave} helperText={formData.enableAutoSave ? (delayError || '0 تا 600000 ms') : 'برای ویرایش، ذخیره خودکار را فعال کنید'} inputProps={{ 'aria-invalid': !!delayError }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel control={<Switch checked={!!formData.enableConditionalDisplay} onChange={(e) => onChange('enableConditionalDisplay', e.target.checked)} />} label="نمایش شرطی" />
            <HelpTooltip title="نمایش شرطی" description="نمایش/عدم نمایش فیلد بر اساس مقدار یک فیلد دیگر." example="اگر status=active، فیلد نمایش داده شود" />
          </Box>
          {formData.enableConditionalDisplay && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={4}>
                <TextField 
                  fullWidth 
                  label="فیلد" 
                  value={formData.conditionalDisplayField || ''} 
                  onChange={(e) => onChange('conditionalDisplayField', e.target.value)}
                  error={!!conditionalDisplayError}
                  helperText={conditionalDisplayError}
                  inputProps={{ 'aria-invalid': !!conditionalDisplayError }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={!!conditionalDisplayError}>
                  <InputLabel>عملگر</InputLabel>
                  <Select label="عملگر" value={formData.conditionalDisplayOperator || 'equals'} onChange={(e) => onChange('conditionalDisplayOperator', e.target.value)}>
                    <MenuItem value={'equals'}>برابر</MenuItem>
                    <MenuItem value={'not_equals'}>نابرابر</MenuItem>
                    <MenuItem value={'contains'}>شامل</MenuItem>
                    <MenuItem value={'not_contains'}>ناشامل</MenuItem>
                    <MenuItem value={'empty'}>خالی</MenuItem>
                    <MenuItem value={'not_empty'}>ناخالی</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField 
                  fullWidth 
                  label="مقدار" 
                  value={formData.conditionalDisplayValue || ''} 
                  onChange={(e) => onChange('conditionalDisplayValue', e.target.value)}
                  disabled={['empty', 'not_empty'].includes(formData.conditionalDisplayOperator || '')}
                  error={!!conditionalDisplayError}
                  helperText={conditionalDisplayError}
                  inputProps={{ 'aria-invalid': !!conditionalDisplayError }}
                />
              </Grid>
            </Grid>
          )}
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel control={<Switch checked={!!formData.enableConditionalEnable} onChange={(e) => onChange('enableConditionalEnable', e.target.checked)} />} label="فعال‌سازی شرطی" />
            <HelpTooltip title="فعال‌سازی شرطی" description="فعال/غیرفعال کردن فیلد بر اساس مقدار یک فیلد دیگر." example="اگر role=admin، فیلد فعال باشد" />
          </Box>
          {formData.enableConditionalEnable && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={4}>
                <TextField 
                  fullWidth 
                  label="فیلد" 
                  value={formData.conditionalEnableField || ''} 
                  onChange={(e) => onChange('conditionalEnableField', e.target.value)}
                  error={!!conditionalEnableError}
                  helperText={conditionalEnableError}
                  inputProps={{ 'aria-invalid': !!conditionalEnableError }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={!!conditionalEnableError}>
                  <InputLabel>عملگر</InputLabel>
                  <Select label="عملگر" value={formData.conditionalEnableOperator || 'equals'} onChange={(e) => onChange('conditionalEnableOperator', e.target.value)}>
                    <MenuItem value={'equals'}>برابر</MenuItem>
                    <MenuItem value={'not_equals'}>نابرابر</MenuItem>
                    <MenuItem value={'greater_than'}>بزرگتر</MenuItem>
                    <MenuItem value={'less_than'}>کوچکتر</MenuItem>
                    <MenuItem value={'contains'}>شامل</MenuItem>
                    <MenuItem value={'not_contains'}>ناشامل</MenuItem>
                    <MenuItem value={'empty'}>خالی</MenuItem>
                    <MenuItem value={'not_empty'}>ناخالی</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField 
                  fullWidth 
                  label="مقدار" 
                  value={formData.conditionalEnableValue || ''} 
                  onChange={(e) => onChange('conditionalEnableValue', e.target.value)}
                  disabled={['empty', 'not_empty'].includes(formData.conditionalEnableOperator || '')}
                  error={!!conditionalEnableError}
                  helperText={conditionalEnableError}
                  inputProps={{ 'aria-invalid': !!conditionalEnableError }}
                />
              </Grid>
            </Grid>
          )}
        </Grid>
        <Grid item xs={12}>
          <FormHelperText sx={{ mt: 1 }}>
            توجه: قوانین شرطی این بخش ممکن است با قوانین مرحله «قوانین» هم‌پوشانی داشته باشد؛ از تکرار منطق جلوگیری کنید.
          </FormHelperText>
        </Grid>
      </Grid>
    </Box>
  );
});

ReferenceBehaviorProperties.displayName = 'ReferenceBehaviorProperties';
export default ReferenceBehaviorProperties;


