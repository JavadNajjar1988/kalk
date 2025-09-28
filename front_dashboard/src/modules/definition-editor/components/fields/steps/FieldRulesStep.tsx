import React, { memo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';
import HelpTooltip from '../shared/HelpTooltip';

interface FieldRulesStepProps {
  formData: ExtendedCustomFieldDefinition;
  onChange: (field: keyof ExtendedCustomFieldDefinition, value: any) => void;
}

export const FieldRulesStep = memo<FieldRulesStepProps>(({
  formData,
  onChange: handleChange,
}) => {
  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography 
          variant="h5" 
          gutterBottom
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(45deg, #4A90E2 30%, #7BB3F0 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          قوانین حاکم بر فیلد
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', opacity: 0.8, mb: 4 }}>
          قوانین اعتبارسنجی، وابستگی و کنترلی برای این فیلد تعریف کنید
        </Typography>
      </Box>
      
      {/* قوانین اعتبارسنجی */}
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
          قوانین اعتبارسنجی
        </Typography>
        
        <Grid container spacing={3}>
          {/* Required */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isRequired || false}
                    onChange={(e) => handleChange('isRequired', e.target.checked)}
                    size="small"
                  />
                }
                label="الزامی بودن"
              />
              <HelpTooltip
                title="الزامی بودن"
                description="این فیلد باید حتماً پر شود و نمی‌توان خالی باشد."
                example="با فعال بودن این گزینه، کاربر باید حتماً این فیلد را پر کند"
              />
            </Box>
          </Grid>
          
          {/* Length Validation */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>
                طول متن
              </Typography>
              <HelpTooltip
                title="طول متن"
                description="تعیین حداقل/حداکثر تعداد کاراکترهای ورودی."
                example="«حداقل ۳ و حداکثر ۵۰ کاراکتر.»"
              />
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="حداقل طول"
                  value={formData.validationRules?.minLength || ''}
                  onChange={(e) => {
                    const rules = formData.validationRules || {};
                    handleChange('validationRules', { ...rules, minLength: parseInt(e.target.value) || undefined });
                  }}
                  placeholder="مثلاً 3"
                  sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="حداکثر طول"
                  value={formData.validationRules?.maxLength || ''}
                  onChange={(e) => {
                    const rules = formData.validationRules || {};
                    handleChange('validationRules', { ...rules, maxLength: parseInt(e.target.value) || undefined });
                  }}
                  placeholder="مثلاً 255"
                  sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                />
              </Grid>
            </Grid>
          </Grid>
          
          {/* Pattern Validation */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>
                الگوی متن
              </Typography>
              <HelpTooltip
                title="الگوی متن"
                description="الگوی خاص برای بررسی فرمت ورودی کاربر."
                example="برای ایمیل: ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
              />
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={8}>
                <TextField
                  fullWidth
                  label="الگوی Regex"
                  value={formData.validationRules?.pattern || ''}
                  onChange={(e) => {
                    const rules = formData.validationRules || {};
                    handleChange('validationRules', { ...rules, pattern: e.target.value });
                  }}
                  placeholder="مثلاً ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ برای ایمیل"
                  sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="پیام خطا"
                  value={formData.validationRules?.patternMessage || ''}
                  onChange={(e) => {
                    const rules = formData.validationRules || {};
                    handleChange('validationRules', { ...rules, patternMessage: e.target.value });
                  }}
                  placeholder="فرمت ایمیل نامعتبر است"
                  sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                />
              </Grid>
            </Grid>
          </Grid>
          
          {/* Unique */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.validationRules?.unique || false}
                    onChange={(e) => {
                      const rules = formData.validationRules || {};
                      handleChange('validationRules', { ...rules, unique: e.target.checked });
                    }}
                    size="small"
                  />
                }
                label="یونیک بودن (مقدار تکراری نباشد)"
              />
              <HelpTooltip
                title="یونیک بودن"
                description="مقدار ورودی باید در تمام رکوردها یکتا باشد."
                example="هر کد ملی فقط یک بار قابل استفاده است"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* قوانین وابستگی */}
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
          قوانین وابستگی
        </Typography>
        
        <Grid container spacing={3}>
          {/* Conditional Visibility */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.conditionalRules?.visibility?.enabled || false}
                    onChange={(e) => {
                      const conditional = formData.conditionalRules || {};
                      const visibility = conditional.visibility || {};
                      handleChange('conditionalRules', { 
                        ...conditional, 
                        visibility: { ...visibility, enabled: e.target.checked }
                      });
                    }}
                    size="small"
                  />
                }
                label="نمایش شرطی"
                sx={{ mb: 1 }}
              />
              <HelpTooltip
                title="نمایش شرطی"
                description="نمایش یا مخفی کردن فیلد بر اساس مقدار فیلد دیگر."
                example="اگر نوع=VIP باشد، فیلد تخفیف نمایش داده شود"
              />
            </Box>
            {formData.conditionalRules?.visibility?.enabled && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="فیلد وابسته"
                    value={formData.conditionalRules?.visibility?.dependsOn || ''}
                    onChange={(e) => {
                      const conditional = formData.conditionalRules || {};
                      const visibility = conditional.visibility || {};
                      handleChange('conditionalRules', { 
                        ...conditional, 
                        visibility: { ...visibility, dependsOn: e.target.value }
                      });
                    }}
                    placeholder="field_id"
                    sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth>
                    <InputLabel>شرط</InputLabel>
                    <Select
                      value={formData.conditionalRules?.visibility?.condition || 'equals'}
                      onChange={(e) => {
                        const conditional = formData.conditionalRules || {};
                        const visibility = conditional.visibility || {};
                        handleChange('conditionalRules', { 
                          ...conditional, 
                          visibility: { ...visibility, condition: e.target.value }
                        });
                      }}
                      label="شرط"
                      sx={{ background: 'rgba(255, 255, 255, 0.8)' }}
                    >
                      <MenuItem value="equals">برابر</MenuItem>
                      <MenuItem value="not_equals">مخالف</MenuItem>
                      <MenuItem value="contains">شامل</MenuItem>
                      <MenuItem value="not_contains">غیرشامل</MenuItem>
                      <MenuItem value="empty">خالی</MenuItem>
                      <MenuItem value="not_empty">غیرخالی</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="مقدار شرط"
                    value={formData.conditionalRules?.visibility?.value || ''}
                    onChange={(e) => {
                      const conditional = formData.conditionalRules || {};
                      const visibility = conditional.visibility || {};
                      handleChange('conditionalRules', { 
                        ...conditional, 
                        visibility: { ...visibility, value: e.target.value }
                      });
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                  />
                </Grid>
              </Grid>
            )}
          </Grid>
          
          {/* Conditional Enable */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.conditionalRules?.enable?.enabled || false}
                    onChange={(e) => {
                      const conditional = formData.conditionalRules || {};
                      const enable = conditional.enable || {};
                      handleChange('conditionalRules', { 
                        ...conditional, 
                        enable: { ...enable, enabled: e.target.checked }
                      });
                    }}
                    size="small"
                  />
                }
                label="فعال‌سازی شرطی"
                sx={{ mb: 1 }}
              />
              <HelpTooltip
                title="فعال‌سازی شرطی"
                description="فعال یا غیرفعال کردن فیلد بر اساس شرط خاص."
                example="اگر وضعیت=باز باشد، فیلد قابل ویرایش شود"
              />
            </Box>
            {formData.conditionalRules?.enable?.enabled && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="فیلد وابسته"
                    value={formData.conditionalRules?.enable?.dependsOn || ''}
                    onChange={(e) => {
                      const conditional = formData.conditionalRules || {};
                      const enable = conditional.enable || {};
                      handleChange('conditionalRules', { 
                        ...conditional, 
                        enable: { ...enable, dependsOn: e.target.value }
                      });
                    }}
                    placeholder="field_id"
                    sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth>
                    <InputLabel>شرط</InputLabel>
                    <Select
                      value={formData.conditionalRules?.enable?.condition || 'equals'}
                      onChange={(e) => {
                        const conditional = formData.conditionalRules || {};
                        const enable = conditional.enable || {};
                        handleChange('conditionalRules', { 
                          ...conditional, 
                          enable: { ...enable, condition: e.target.value }
                        });
                      }}
                      label="شرط"
                      sx={{ background: 'rgba(255, 255, 255, 0.8)' }}
                    >
                      <MenuItem value="equals">برابر</MenuItem>
                      <MenuItem value="not_equals">مخالف</MenuItem>
                      <MenuItem value="contains">شامل</MenuItem>
                      <MenuItem value="not_contains">غیرشامل</MenuItem>
                      <MenuItem value="empty">خالی</MenuItem>
                      <MenuItem value="not_empty">غیرخالی</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="مقدار شرط"
                    value={formData.conditionalRules?.enable?.value || ''}
                    onChange={(e) => {
                      const conditional = formData.conditionalRules || {};
                      const enable = conditional.enable || {};
                      handleChange('conditionalRules', { 
                        ...conditional, 
                        enable: { ...enable, value: e.target.value }
                      });
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                  />
                </Grid>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Paper>
      
      {/* قوانین کنترلی */}
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
          قوانین کنترلی
        </Typography>
        
        <Grid container spacing={3}>
          {/* Default Value */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                label="مقدار پیش‌فرض"
                value={formData.controlRules?.defaultValue || ''}
                onChange={(e) => {
                  const control = formData.controlRules || {};
                  handleChange('controlRules', { ...control, defaultValue: e.target.value });
                }}
                placeholder="مقدار پیش‌فرض فیلد"
                sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
              />
              <HelpTooltip
                title="مقدار پیش‌فرض"
                description="مقداری که از قبل در فیلد نمایش داده می‌شود."
                example="برای فیلد وضعیت، مقدار پیش‌فرض 'در انتظار' باشد"
              />
            </Box>
          </Grid>
          
          {/* Lock After Save */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.controlRules?.lockAfterSave || false}
                    onChange={(e) => {
                      const control = formData.controlRules || {};
                      handleChange('controlRules', { ...control, lockAfterSave: e.target.checked });
                    }}
                    size="small"
                  />
                }
                label="غیرقابل ویرایش بعد از ثبت"
              />
              <HelpTooltip
                title="غیرقابل ویرایش بعد از ثبت"
                description="پس از ذخیره اولیه، فیلد قابل ویرایش نباشد."
                example="برای فیلدهای مهم و غیرقابل تغییر استفاده شود"
              />
            </Box>
          </Grid>
          
          {/* Read Only */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.controlRules?.readOnly || false}
                    onChange={(e) => {
                      const control = formData.controlRules || {};
                      handleChange('controlRules', { ...control, readOnly: e.target.checked });
                    }}
                    size="small"
                  />
                }
                label="فقط خواندنی"
              />
              <HelpTooltip
                title="فقط خواندنی"
                description="فیلد فقط قابل مشاهده است و نمی‌توان آن را ویرایش کرد."
                example="برای نمایش اطلاعات محاسبه شده یا اطلاعات سیستمی"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
});