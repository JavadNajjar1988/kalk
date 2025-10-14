import { memo } from 'react';
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
import { useTheme, alpha } from '@mui/material/styles';

interface FieldRulesStepProps {
  formData: ExtendedCustomFieldDefinition;
  onChange: (field: keyof ExtendedCustomFieldDefinition, value: any) => void;
}

export const FieldRulesStep = memo<FieldRulesStepProps>(({ 
  formData,
  onChange: handleChange,
}) => {
  const theme = useTheme();
  // Helper function to validate JavaScript rule
  const isValidJavaScriptRule = (rule: string): boolean => {
    if (!rule || rule.trim() === '') return false;
    
    try {
      // Basic syntax validation
      new Function('formData', `return ${rule}`);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Helper function to validate default value
  const isValidDefaultValue = (value: string, fieldType: string): boolean => {
    if (!value) return true;

    switch (fieldType) {
      case 'text':
      case 'email':
      case 'password':
      case 'textarea':
      case 'text-english':
      case 'text-numeric':
        return typeof value === 'string';
      
      case 'number':
        return !isNaN(Number(value));
      
      case 'date':
        return !isNaN(Date.parse(value));
      
      case 'boolean':
        return value === 'true' || value === 'false';
      
      case 'select':
      case 'multiselect':
        return Array.isArray(value) || typeof value === 'string';
      
      default:
        return true;
    }
  };

  // Helper function to check control rules conflicts
  const checkControlRulesConflicts = (): string[] => {
    const conflicts: string[] = [];
    
    if (formData.controlRules?.lockAfterSave && formData.controlRules?.readOnly) {
      conflicts.push('قفل بعد از ذخیره با فقط خواندنی تداخل دارد');
    }
    
    if (formData.controlRules?.lockAfterSave && formData.editableAfterSave === false) {
      conflicts.push('قفل بعد از ذخیره با غیرقابل ویرایش بعد از ذخیره تداخل دارد');
    }
    
    if (formData.controlRules?.readOnly && formData.editableAfterSave === true) {
      conflicts.push('فقط خواندنی با قابل ویرایش بعد از ذخیره تداخل دارد');
    }
    
    return conflicts;
  };

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography 
          variant="h5" 
          gutterBottom
          sx={{
            fontWeight: 700,
            color: theme.palette.primary.main,
          }}
        >
          {(() => {
            const t = formData.type as any;
            if (t === 'number') return 'قوانین فیلد عددی';
            if (t === 'select' || t === 'multiselect') return 'قوانین فیلد انتخابی';
            if (t === 'reference') return 'قوانین فیلد مرجع';
            return 'قوانین فیلد متنی';
          })()}
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
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <Typography variant="h6" sx={{ mb: 3, color: theme.palette.primary.main, fontWeight: 600 }}>
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
          
          {/* Reference-only: Max selection for multiselect */}
          {(formData.type as any) === 'reference' && (formData.referenceConfig?.selection?.multiple || formData.referenceConfig?.multiSelect) && (
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                  fullWidth
                  type="number"
                  label="حداکثر تعداد انتخاب (N)"
                  value={formData.referenceConfig?.selection?.maxSelected ?? ''}
                  onChange={(e) => {
                    const ref = formData.referenceConfig || {} as any;
                    const sel = ref.selection || {};
                    const maxSelected = Math.max(0, parseInt(e.target.value) || 0);
                    handleChange('referenceConfig', { ...ref, selection: { ...sel, maxSelected } });
                  }}
                  placeholder="مثلاً 3"
                  sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                />
                <HelpTooltip
                  title="حداکثر تعداد انتخاب"
                  description="در حالت چندانتخابی، تعداد حداکثری آیتم‌های قابل انتخاب."
                  example="حداکثر 3 شهر"
                />
              </Box>
            </Grid>
          )}

          {/* Reference-only: Must exist in source */}
          {(formData.type as any) === 'reference' && (
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.validationRules?.mustExistInSource || false}
                    onChange={(e) => {
                      const rules = formData.validationRules || {};
                      handleChange('validationRules', { ...rules, mustExistInSource: e.target.checked });
                    }}
                    size="small"
                  />
                }
                label="وجود در منبع (اعتبارسنجی مقدار)"
              />
            </Grid>
          )}

          {/* Reference-only: Selection pattern */}
          {(formData.type as any) === 'reference' && (
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                  fullWidth
                  label="الگوی انتخاب (مثلاً id > 100)"
                  value={formData.validationRules?.selectionPattern || ''}
                  onChange={(e) => {
                    const rules = formData.validationRules || {};
                    handleChange('validationRules', { ...rules, selectionPattern: e.target.value || undefined });
                  }}
                  placeholder="مثلاً item.id > 100"
                  sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                />
                <HelpTooltip
                  title="الگوی انتخاب"
                  description="قانونی برای معتبر بودن گزینه‌های قابل انتخاب."
                  example="فقط آیتم‌هایی که اولویت>10 یا id>100"
                />
              </Box>
            </Grid>
          )}

          {/* Length Validation (hidden for reference) */}
          {(formData.type as any) !== 'reference' && (
          <>
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
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="حداقل طول"
                    value={formData.validationRules?.minLength || ''}
                    onChange={(e) => {
                      const rules = formData.validationRules || {};
                      const minLength = parseInt(e.target.value) || undefined;
                      // keep maxLength for error calc via state
                      
                      // Validate minLength <= maxLength (handled by error prop)
                      
                      handleChange('validationRules', { ...rules, minLength });
                    }}
                    placeholder="مثلاً 3"
                    error={!!(formData.validationRules?.minLength !== undefined && formData.validationRules?.maxLength !== undefined && 
                           (formData.validationRules.minLength as number) > (formData.validationRules.maxLength as number))}
                    helperText={formData.validationRules?.minLength !== undefined && formData.validationRules?.maxLength !== undefined && 
                                (formData.validationRules.minLength as number) > (formData.validationRules.maxLength as number) ? 
                                'حداقل طول نمی‌تواند بیشتر از حداکثر طول باشد' : ''}
                    sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                  />
                  <HelpTooltip
                    title="حداقل طول"
                    description="حداقل تعداد کاراکترهای مجاز برای ورودی."
                    example="برای نام کاربری حداقل 3 کاراکتر"
                  />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="حداکثر طول"
                    value={formData.validationRules?.maxLength || ''}
                    onChange={(e) => {
                      const rules = formData.validationRules || {};
                      const maxLength = parseInt(e.target.value) || undefined;
                      // keep minLength for error calc via state
                      
                      // Validate minLength <= maxLength (handled by error prop)
                      
                      handleChange('validationRules', { ...rules, maxLength });
                    }}
                    placeholder="مثلاً 255"
                    error={!!(formData.validationRules?.minLength !== undefined && formData.validationRules?.maxLength !== undefined && 
                           (formData.validationRules.minLength as number) > (formData.validationRules.maxLength as number))}
                    helperText={formData.validationRules?.minLength !== undefined && formData.validationRules?.maxLength !== undefined && 
                                (formData.validationRules.minLength as number) > (formData.validationRules.maxLength as number) ? 
                                'حداقل طول نمی‌تواند بیشتر از حداکثر طول باشد' : ''}
                    sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                  />
                  <HelpTooltip
                    title="حداکثر طول"
                    description="حداکثر تعداد کاراکترهای مجاز برای ورودی."
                    example="برای توضیحات حداکثر 500 کاراکتر"
                  />
                </Box>
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
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    label="الگوی Regex"
                    value={formData.validationRules?.pattern || ''}
                    onChange={(e) => {
                      const rules = formData.validationRules || {};
                      const pattern = e.target.value;
                      
                      handleChange('validationRules', { ...rules, pattern: pattern || undefined });
                    }}
                    placeholder="مثلاً ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ برای ایمیل"
                    error={formData.validationRules?.pattern ? (() => {
                      try {
                        new RegExp(formData.validationRules.pattern);
                        return false;
                      } catch {
                        return true;
                      }
                    })() : false}
                    helperText={formData.validationRules?.pattern ? (() => {
                      try {
                        new RegExp(formData.validationRules.pattern);
                        return '';
                      } catch {
                        return 'الگوی Regex نامعتبر است';
                      }
                    })() : ''}
                    sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                  />
                  <HelpTooltip
                    title="الگوی Regex"
                    description="الگوی منظم برای اعتبارسنجی فرمت ورودی."
                    example="^[0-9]{10}$ برای کد ملی 10 رقمی"
                  />
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    label="پیام خطا"
                    value={formData.validationRules?.patternMessage || ''}
                    onChange={(e) => {
                      const rules = formData.validationRules || {};
                      handleChange('validationRules', { ...rules, patternMessage: e.target.value || undefined });
                    }}
                    placeholder="فرمت ایمیل نامعتبر است"
                    sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                  />
                  <HelpTooltip
                    title="پیام خطا"
                    description="پیام خطای سفارشی برای الگوی نامعتبر."
                    example="فرمت کد ملی صحیح نیست"
                  />
                </Box>
              </Grid>
            </Grid>
          </Grid>
          </>
          )}
          
          {/* Unique */}
          {(formData.type as any) !== 'reference' && (
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
          )}
        </Grid>
      </Paper>
      
      {/* قوانین وابستگی */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <Typography variant="h6" sx={{ mb: 3, color: theme.palette.primary.main, fontWeight: 600 }}>
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
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                      error={formData.conditionalRules?.visibility?.dependsOn ? 
                        !formData.conditionalRules.visibility.dependsOn.trim() : false}
                      helperText={formData.conditionalRules?.visibility?.dependsOn ? 
                        (!formData.conditionalRules.visibility.dependsOn.trim() ? 
                          'نام فیلد وابسته نمی‌تواند خالی باشد' : '') : ''}
                      sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                    />
                    <HelpTooltip
                      title="فیلد وابسته"
                      description="نام فیلدی که شرط بر اساس آن بررسی می‌شود."
                      example="userType یا status"
                    />
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                    <HelpTooltip
                      title="شرط"
                      description="نوع شرط برای مقایسه با مقدار فیلد وابسته."
                      example="برابر: مقدار دقیقاً همان باشد"
                    />
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                    <HelpTooltip
                      title="مقدار شرط"
                      description="مقداری که با فیلد وابسته مقایسه می‌شود."
                      example="VIP یا active"
                    />
                  </Box>
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
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                      error={formData.conditionalRules?.enable?.dependsOn ? 
                        !formData.conditionalRules.enable.dependsOn.trim() : false}
                      helperText={formData.conditionalRules?.enable?.dependsOn ? 
                        (!formData.conditionalRules.enable.dependsOn.trim() ? 
                          'نام فیلد وابسته نمی‌تواند خالی باشد' : '') : ''}
                      sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                    />
                    <HelpTooltip
                      title="فیلد وابسته"
                      description="نام فیلدی که شرط فعال‌سازی بر اساس آن بررسی می‌شود."
                      example="userRole یا isActive"
                    />
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                    <HelpTooltip
                      title="شرط"
                      description="نوع شرط برای فعال‌سازی فیلد."
                      example="برابر: مقدار دقیقاً همان باشد"
                    />
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                    <HelpTooltip
                      title="مقدار شرط"
                      description="مقداری که برای فعال‌سازی فیلد مورد نیاز است."
                      example="admin یا true"
                    />
                  </Box>
                </Grid>
              </Grid>
            )}
          </Grid>
          
          {/* Conditional Required */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.conditionalRules?.required?.enabled || false}
                    onChange={(e) => {
                      const conditional = formData.conditionalRules || {};
                      const required = conditional.required || {};
                      handleChange('conditionalRules', { 
                        ...conditional, 
                        required: { ...required, enabled: e.target.checked }
                      });
                    }}
                    size="small"
                  />
                }
                label="اجباری بودن شرطی"
                sx={{ mb: 1 }}
              />
              <HelpTooltip
                title="اجباری بودن شرطی"
                description="اجباری یا اختیاری بودن فیلد بر اساس شرط خاص."
                example="اگر نوع=VIP باشد، فیلد اجباری شود"
              />
            </Box>
            {formData.conditionalRules?.required?.enabled && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TextField
                      fullWidth
                      label="فیلد وابسته"
                      value={formData.conditionalRules?.required?.dependsOn || ''}
                      onChange={(e) => {
                        const conditional = formData.conditionalRules || {};
                        const required = conditional.required || {};
                        handleChange('conditionalRules', { 
                          ...conditional, 
                          required: { ...required, dependsOn: e.target.value }
                        });
                      }}
                      placeholder="field_id"
                      error={formData.conditionalRules?.required?.dependsOn ? 
                        !formData.conditionalRules.required.dependsOn.trim() : false}
                      helperText={formData.conditionalRules?.required?.dependsOn ? 
                        (!formData.conditionalRules.required.dependsOn.trim() ? 
                          'نام فیلد وابسته نمی‌تواند خالی باشد' : '') : ''}
                      sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                    />
                    <HelpTooltip
                      title="فیلد وابسته"
                      description="نام فیلدی که شرط اجباری بودن بر اساس آن بررسی می‌شود."
                      example="userType یا membership"
                    />
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControl fullWidth>
                      <InputLabel>شرط</InputLabel>
                      <Select
                        value={formData.conditionalRules?.required?.condition || 'equals'}
                        onChange={(e) => {
                          const conditional = formData.conditionalRules || {};
                          const required = conditional.required || {};
                          handleChange('conditionalRules', { 
                            ...conditional, 
                            required: { ...required, condition: e.target.value }
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
                    <HelpTooltip
                      title="شرط"
                      description="نوع شرط برای اجباری کردن فیلد."
                      example="برابر: مقدار دقیقاً همان باشد"
                    />
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TextField
                      fullWidth
                      label="مقدار شرط"
                      value={formData.conditionalRules?.required?.value || ''}
                      onChange={(e) => {
                        const conditional = formData.conditionalRules || {};
                        const required = conditional.required || {};
                        handleChange('conditionalRules', { 
                          ...conditional, 
                          required: { ...required, value: e.target.value }
                        });
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                    />
                    <HelpTooltip
                      title="مقدار شرط"
                      description="مقداری که برای اجباری کردن فیلد مورد نیاز است."
                      example="premium یا VIP"
                    />
                  </Box>
                </Grid>
              </Grid>
            )}
          </Grid>
          
          {/* Conditional Custom (remove for reference fields per requirement) */}
          {(formData.type as any) !== 'reference' && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.conditionalRules?.custom?.enabled || false}
                      onChange={(e) => {
                        const conditional = formData.conditionalRules || {};
                        const custom = conditional.custom || {};
                        handleChange('conditionalRules', { 
                          ...conditional, 
                          custom: { ...custom, enabled: e.target.checked }
                        });
                      }}
                      size="small"
                    />
                  }
                  label="قانون سفارشی"
                  sx={{ mb: 1 }}
                />
                <HelpTooltip
                  title="قانون سفارشی"
                  description="تعریف قانون سفارشی با JavaScript برای اعتبارسنجی."
                  example="formData.age >= 18 && formData.country === 'IR'"
                />
              </Box>
              {formData.conditionalRules?.custom?.enabled && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TextField
                        fullWidth
                        label="قانون JavaScript"
                        value={formData.conditionalRules?.custom?.rule || ''}
                        onChange={(e) => {
                          const conditional = formData.conditionalRules || {};
                          const custom = conditional.custom || {};
                          handleChange('conditionalRules', { 
                            ...conditional, 
                            custom: { ...custom, rule: e.target.value }
                          });
                        }}
                        placeholder="formData.age >= 18"
                        multiline
                        rows={3}
                        error={formData.conditionalRules?.custom?.rule ? 
                          !isValidJavaScriptRule(formData.conditionalRules.custom.rule) : false}
                        helperText={formData.conditionalRules?.custom?.rule ? 
                          (!isValidJavaScriptRule(formData.conditionalRules.custom.rule) ? 
                            'قانون JavaScript نامعتبر است' : '') : ''}
                        sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                      />
                      <HelpTooltip
                        title="قانون JavaScript"
                        description="کد JavaScript برای اعتبارسنجی سفارشی."
                        example="formData.age >= 18 && formData.country === 'IR'"
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TextField
                        fullWidth
                        label="پیام خطا"
                        value={formData.conditionalRules?.custom?.message || ''}
                        onChange={(e) => {
                          const conditional = formData.conditionalRules || {};
                          const custom = conditional.custom || {};
                          handleChange('conditionalRules', { 
                            ...conditional, 
                            custom: { ...custom, message: e.target.value }
                          });
                        }}
                        placeholder="شرط تعریف شده برقرار نیست"
                        sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                      />
                      <HelpTooltip
                        title="پیام خطا"
                        description="پیام خطای سفارشی برای قانون JavaScript."
                        example="سن باید حداقل 18 سال باشد"
                      />
                    </Box>
                  </Grid>
                </Grid>
              )}
            </Grid>
          )}
        </Grid>
      </Paper>
      
      {/* قوانین کنترلی */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <Typography variant="h6" sx={{ mb: 3, color: theme.palette.primary.main, fontWeight: 600 }}>
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
                error={formData.controlRules?.defaultValue ? 
                  !isValidDefaultValue(formData.controlRules.defaultValue, formData.type) : false}
                helperText={formData.controlRules?.defaultValue ? 
                  (!isValidDefaultValue(formData.controlRules.defaultValue, formData.type) ? 
                    `مقدار پیش‌فرض با نوع فیلد ${formData.type} سازگار نیست` : '') : ''}
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
                    color={checkControlRulesConflicts().length > 0 ? 'error' : 'primary'}
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
            {checkControlRulesConflicts().length > 0 && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                {checkControlRulesConflicts()[0]}
              </Typography>
            )}
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
                    color={checkControlRulesConflicts().length > 0 ? 'error' : 'primary'}
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
            {checkControlRulesConflicts().length > 0 && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                {checkControlRulesConflicts()[0]}
              </Typography>
            )}
          </Grid>

          {/* Advanced Control Rules */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B' }}>
                قوانین پیشرفته کنترلی
              </Typography>
              <HelpTooltip
                title="قوانین پیشرفته کنترلی"
                description="قوانین شرطی و پیشرفته برای کنترل فیلد."
                example="مقدار پیش‌فرض شرطی، قفل شرطی، فقط خواندنی شرطی"
              />
            </Box>
            
            {/* Conditional Default Value */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.controlRules?.advanced?.enableConditionalDefault || false}
                      onChange={(e) => {
                        const control = formData.controlRules || {};
                        const advanced = control.advanced || {};
                        handleChange('controlRules', { 
                          ...control, 
                          advanced: { ...advanced, enableConditionalDefault: e.target.checked }
                        });
                      }}
                      size="small"
                    />
                  }
                  label="مقدار پیش‌فرض شرطی"
                />
              </Grid>
              {formData.controlRules?.advanced?.enableConditionalDefault && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TextField
                      fullWidth
                      label="مقدار پیش‌فرض شرطی"
                      value={formData.controlRules?.advanced?.conditionalDefaultValue || ''}
                      onChange={(e) => {
                        const control = formData.controlRules || {};
                        const advanced = control.advanced || {};
                        handleChange('controlRules', { 
                          ...control, 
                          advanced: { ...advanced, conditionalDefaultValue: e.target.value }
                        });
                      }}
                      placeholder="مقدار پیش‌فرض بر اساس شرط"
                      sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                    />
                    <HelpTooltip
                      title="مقدار پیش‌فرض شرطی"
                      description="مقدار پیش‌فرض که بر اساس شرط خاص تنظیم می‌شود."
                      example="اگر نوع کاربر admin باشد، مقدار پیش‌فرض 'مدیر'"
                    />
                  </Box>
                </Grid>
              )}
            </Grid>

            {/* Conditional Lock */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.controlRules?.advanced?.enableConditionalLock || false}
                      onChange={(e) => {
                        const control = formData.controlRules || {};
                        const advanced = control.advanced || {};
                        handleChange('controlRules', { 
                          ...control, 
                          advanced: { ...advanced, enableConditionalLock: e.target.checked }
                        });
                      }}
                      size="small"
                    />
                  }
                  label="قفل شرطی"
                />
              </Grid>
              {formData.controlRules?.advanced?.enableConditionalLock && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TextField
                      fullWidth
                      label="قانون قفل شرطی"
                      value={formData.controlRules?.advanced?.conditionalLockRule || ''}
                      onChange={(e) => {
                        const control = formData.controlRules || {};
                        const advanced = control.advanced || {};
                        handleChange('controlRules', { 
                          ...control, 
                          advanced: { ...advanced, conditionalLockRule: e.target.value }
                        });
                      }}
                      placeholder="قانون JavaScript برای قفل شرطی"
                      multiline
                      rows={2}
                      sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                    />
                    <HelpTooltip
                      title="قانون قفل شرطی"
                      description="کد JavaScript برای قفل کردن فیلد بر اساس شرط."
                      example="formData.status === 'approved'"
                    />
                  </Box>
                </Grid>
              )}
            </Grid>

            {/* Conditional Read Only */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.controlRules?.advanced?.enableConditionalReadOnly || false}
                      onChange={(e) => {
                        const control = formData.controlRules || {};
                        const advanced = control.advanced || {};
                        handleChange('controlRules', { 
                          ...control, 
                          advanced: { ...advanced, enableConditionalReadOnly: e.target.checked }
                        });
                      }}
                      size="small"
                    />
                  }
                  label="فقط خواندنی شرطی"
                />
              </Grid>
              {formData.controlRules?.advanced?.enableConditionalReadOnly && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TextField
                      fullWidth
                      label="قانون فقط خواندنی شرطی"
                      value={formData.controlRules?.advanced?.conditionalReadOnlyRule || ''}
                      onChange={(e) => {
                        const control = formData.controlRules || {};
                        const advanced = control.advanced || {};
                        handleChange('controlRules', { 
                          ...control, 
                          advanced: { ...advanced, conditionalReadOnlyRule: e.target.value }
                        });
                      }}
                      placeholder="قانون JavaScript برای فقط خواندنی شرطی"
                      multiline
                      rows={2}
                      sx={{ '& .MuiOutlinedInput-root': { background: 'rgba(255, 255, 255, 0.8)' } }}
                    />
                    <HelpTooltip
                      title="قانون فقط خواندنی شرطی"
                      description="کد JavaScript برای فقط خواندنی کردن فیلد بر اساس شرط."
                      example="formData.userRole === 'viewer'"
                    />
                  </Box>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
});
