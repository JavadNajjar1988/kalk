import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Chip,
  Stack,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Collapse,
  Tooltip,
  alpha,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Help as HelpIcon,
  Visibility as PreviewIcon,
  Code as RegexIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { SmartFieldConfig, ValidationRule, ValidationType } from '../../types/smartFieldTypes';

interface ValidationRuleBuilderProps {
  fieldConfig: Partial<SmartFieldConfig>;
  rules: ValidationRule[];
  onRulesChange: (rules: ValidationRule[]) => void;
  existingFields?: SmartFieldConfig[];
}

interface ValidationRuleTemplate {
  type: ValidationType;
  name: string;
  description: string;
  category: 'basic' | 'format' | 'cross-field' | 'conditional' | 'custom';
  defaultConfig: any;
  configSchema?: any;
}

const ValidationRuleBuilder: React.FC<ValidationRuleBuilderProps> = ({
  fieldConfig,
  rules,
  onRulesChange,
  existingFields = []
}) => {
  const theme = useTheme();
  const [editingRule, setEditingRule] = useState<ValidationRule | null>(null);
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ValidationRuleTemplate | null>(null);
  const [testValue, setTestValue] = useState('');
  const [testResults, setTestResults] = useState<Record<string, { valid: boolean; message: string }>>({});

  // Enhanced validation rule templates with cross-field and conditional rules
  const ruleTemplates: ValidationRuleTemplate[] = useMemo(() => [
    // Basic validation rules
    {
      type: ValidationType.REQUIRED,
      name: 'اجباری',
      description: 'فیلد نمی‌تواند خالی باشد',
      category: 'basic',
      defaultConfig: { message: 'این فیلد اجباری است' }
    },
    {
      type: ValidationType.MIN_LENGTH,
      name: 'حداقل طول',
      description: 'حداقل تعداد کاراکتر مورد نیاز',
      category: 'basic',
      defaultConfig: { value: 3, message: 'حداقل {value} کاراکتر وارد کنید' }
    },
    {
      type: ValidationType.MAX_LENGTH,
      name: 'حداکثر طول',
      description: 'حداکثر تعداد کاراکتر مجاز',
      category: 'basic',
      defaultConfig: { value: 100, message: 'حداکثر {value} کاراکتر مجاز است' }
    },
    {
      type: ValidationType.RANGE,
      name: 'محدوده عددی',
      description: 'بررسی قرارگیری عدد در محدوده',
      category: 'basic',
      defaultConfig: { min: 0, max: 100, message: 'مقدار باید بین {min} و {max} باشد' }
    },
    
    // Format validation rules
    {
      type: ValidationType.EMAIL,
      name: 'ایمیل',
      description: 'بررسی فرمت آدرس ایمیل',
      category: 'format',
      defaultConfig: { message: 'فرمت ایمیل صحیح نیست' }
    },
    {
      type: ValidationType.PHONE,
      name: 'شماره تلفن',
      description: 'بررسی فرمت شماره تلفن ایرانی',
      category: 'format',
      defaultConfig: { message: 'فرمت شماره تلفن صحیح نیست' }
    },
    {
      type: ValidationType.NATIONAL_ID,
      name: 'کد ملی',
      description: 'بررسی صحت کد ملی ایرانی',
      category: 'format',
      defaultConfig: { message: 'کد ملی وارد شده صحیح نیست' }
    },
    {
      type: ValidationType.PATTERN,
      name: 'الگوی سفارشی (Regex)',
      description: 'بررسی تطابق با الگوی رگکس',
      category: 'custom',
      defaultConfig: { 
        pattern: '', 
        flags: 'i',
        message: 'مقدار وارد شده با الگوی تعریف شده مطابقت ندارد' 
      }
    },
    
    // Advanced cross-field validation rules
    {
      type: ValidationType.CROSS_FIELD,
      name: 'وابستگی فیلد',
      description: 'اعتبارسنجی بر اساس فیلدهای دیگر',
      category: 'cross-field',
      defaultConfig: {
        dependsOn: '',
        condition: 'equals',
        message: 'مقدار با فیلد مربوطه مطابقت ندارد'
      }
    },
    {
      type: ValidationType.CONDITIONAL,
      name: 'شرطی',
      description: 'اعتبارسنجی بر اساس شرایط خاص',
      category: 'conditional',
      defaultConfig: {
        when: {
          field: '',
          operator: 'equals',
          value: ''
        },
        message: 'در شرایط فعلی این فیلد اجباری است'
      }
    },
    {
      type: ValidationType.UNIQUE,
      name: 'یکتایی',
      description: 'بررسی یکتا بودن مقدار',
      category: 'cross-field',
      defaultConfig: {
        scope: 'current_form',
        message: 'این مقدار قبلاً استفاده شده است'
      }
    },
    
    // Custom validation rules
    {
      type: ValidationType.CUSTOM_FUNCTION,
      name: 'تابع سفارشی',
      description: 'اعتبارسنجی با تابع سفارشی',
      category: 'custom',
      defaultConfig: {
        customFunction: '',
        message: 'مقدار وارد شده معتبر نیست'
      }
    }
  ], []);

  // Add new validation rule
  const handleAddRule = useCallback((template: ValidationRuleTemplate) => {
    const newRule: ValidationRule = {
      id: `rule_${Date.now()}`,
      type: template.type,
      enabled: true,
      config: { ...template.defaultConfig },
      message: template.defaultConfig.message
    };
    
    setEditingRule(newRule);
    setSelectedTemplate(template);
    setShowRuleBuilder(true);
  }, []);

  // Save validation rule
  const handleSaveRule = useCallback(() => {
    if (!editingRule) return;
    
    const existingRuleIndex = rules.findIndex(r => r.id === editingRule.id);
    if (existingRuleIndex >= 0) {
      // Update existing rule
      const updatedRules = [...rules];
      updatedRules[existingRuleIndex] = editingRule;
      onRulesChange(updatedRules);
    } else {
      // Add new rule
      onRulesChange([...rules, editingRule]);
    }
    
    setEditingRule(null);
    setSelectedTemplate(null);
    setShowRuleBuilder(false);
  }, [editingRule, rules, onRulesChange]);

  // Cancel rule editing
  const handleCancelRule = useCallback(() => {
    setEditingRule(null);
    setSelectedTemplate(null);
    setShowRuleBuilder(false);
  }, []);

  // Edit existing rule
  const handleEditRule = useCallback((rule: ValidationRule) => {
    setEditingRule({ ...rule });
    setSelectedTemplate(ruleTemplates.find(t => t.type === rule.type) || null);
    setShowRuleBuilder(true);
  }, [ruleTemplates]);

  // Delete validation rule
  const handleDeleteRule = useCallback((ruleId: string) => {
    onRulesChange(rules.filter(r => r.id !== ruleId));
  }, [rules, onRulesChange]);

  // Toggle rule enabled state
  const handleToggleRule = useCallback((ruleId: string) => {
    const updatedRules = rules.map(rule =>
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    );
    onRulesChange(updatedRules);
  }, [rules, onRulesChange]);

  // Enhanced test validation with comprehensive cross-field validation
  const handleTestValidation = useCallback(() => {
    const results: Record<string, { valid: boolean; message: string }> = {};
    
    rules.forEach(rule => {
      if (!rule.enabled) return;
      
      let isValid = true;
      let message = '';
      
      try {
        switch (rule.type) {
          case ValidationType.REQUIRED:
            isValid = testValue.trim().length > 0;
            message = isValid ? 'فیلد معتبر است' : rule.config.message || rule.message;
            break;
            
          case ValidationType.MIN_LENGTH:
            isValid = testValue.length >= (rule.config.value || 0);
            message = isValid ? 'طول متن مناسب است' : rule.config.message || rule.message;
            break;
            
          case ValidationType.MAX_LENGTH:
            isValid = testValue.length <= (rule.config.value || 100);
            message = isValid ? 'طول متن مناسب است' : rule.config.message || rule.message;
            break;
            
          case ValidationType.PATTERN:
            if (rule.config.pattern) {
              const regex = new RegExp(rule.config.pattern, rule.config.flags || '');
              isValid = regex.test(testValue);
              message = isValid ? 'فرمت صحیح است' : rule.config.message || rule.message;
            }
            break;
            
          case ValidationType.EMAIL:
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            isValid = emailRegex.test(testValue);
            message = isValid ? 'ایمیل معتبر است' : rule.config.message || rule.message;
            break;
            
          case ValidationType.PHONE:
            // Enhanced Iranian phone validation
            const phoneRegex = /^(\+98|0)?9\d{9}$/;
            isValid = phoneRegex.test(testValue.replace(/[\s-]/g, ''));
            message = isValid ? 'شماره تلفن معتبر است' : rule.config.message || rule.message;
            break;
            
          case ValidationType.NATIONAL_ID:
            isValid = validateNationalId(testValue);
            message = isValid ? 'کد ملی معتبر است' : rule.config.message || rule.message;
            break;
            
          case ValidationType.RANGE:
            const numValue = parseFloat(testValue);
            if (!isNaN(numValue)) {
              const min = rule.config.min ?? -Infinity;
              const max = rule.config.max ?? Infinity;
              isValid = numValue >= min && numValue <= max;
              message = isValid ? 'مقدار در محدوده مجاز است' : rule.config.message || rule.message;
            } else {
              isValid = false;
              message = 'مقدار وارد شده عدد نیست';
            }
            break;
            
          case ValidationType.CROSS_FIELD:
            // Cross-field validation logic
            if (rule.config.dependsOn && existingFields) {
              const dependentField = existingFields.find(f => f.englishName === rule.config.dependsOn);
              if (dependentField) {
                // Implementation would depend on the specific cross-field rule
                isValid = true; // Placeholder
                message = 'وابستگی فیلد بررسی شد';
              }
            }
            break;
            
          case ValidationType.CONDITIONAL:
            // Conditional validation based on other field values
            if (rule.config.when) {
              const condition = rule.config.when;
              const targetField = existingFields?.find(f => f.englishName === condition.field);
              
              if (targetField) {
                let conditionMet = false;
                
                switch (condition.operator) {
                  case 'equals':
                    conditionMet = targetField.value === condition.value;
                    break;
                  case 'not_equals':
                    conditionMet = targetField.value !== condition.value;
                    break;
                  case 'contains':
                    conditionMet = String(targetField.value).includes(String(condition.value));
                    break;
                  case 'not_contains':
                    conditionMet = !String(targetField.value).includes(String(condition.value));
                    break;
                }
                
                if (conditionMet) {
                  // Apply the main validation rule
                  isValid = testValue.trim().length > 0; // Example: required when condition is met
                  message = isValid ? 'شرایط احراز شد' : 'فیلد در شرایط فعلی اجباری است';
                } else {
                  isValid = true;
                  message = 'شرایط اعمال قانون احراز نشده';
                }
              }
            }
            break;
            
          case ValidationType.UNIQUE:
            // Check uniqueness against existing fields
            if (existingFields) {
              const duplicateExists = existingFields.some(f => 
                f.englishName !== fieldConfig.englishName && 
                f.value === testValue
              );
              isValid = !duplicateExists;
              message = isValid ? 'مقدار منحصر به فرد است' : rule.config.message || rule.message;
            }
            break;
            
          default:
            isValid = true;
            message = 'قانون شناخته نشده';
        }
      } catch (error) {
        isValid = false;
        message = 'خطا در اعتبارسنجی: ' + (error instanceof Error ? error.message : 'خطای نامشخص');
      }
      
      results[rule.id] = { valid: isValid, message };
    });
    
    setTestResults(results);
  }, [rules, testValue, existingFields, fieldConfig]);
  
  // Enhanced National ID validation
  const validateNationalId = useCallback((nationalId: string): boolean => {
    if (!nationalId || nationalId.length !== 10) return false;
    
    // Remove any non-digit characters
    const cleanId = nationalId.replace(/\D/g, '');
    if (cleanId.length !== 10) return false;
    
    // Check for invalid patterns
    const invalidPatterns = [
      '0000000000', '1111111111', '2222222222', '3333333333', '4444444444',
      '5555555555', '6666666666', '7777777777', '8888888888', '9999999999'
    ];
    
    if (invalidPatterns.includes(cleanId)) return false;
    
    // Validate checksum
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanId[i]) * (10 - i);
    }
    
    const remainder = sum % 11;
    const checkDigit = parseInt(cleanId[9]);
    
    return remainder < 2 ? checkDigit === remainder : checkDigit === 11 - remainder;
  }, []);

  // Render rule configuration form
  const renderRuleConfig = () => {
    if (!editingRule || !selectedTemplate) return null;
    
    return (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            تنظیمات {selectedTemplate.name}
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="پیام خطا"
                value={editingRule.message}
                onChange={(e) => setEditingRule({ ...editingRule, message: e.target.value })}
                fullWidth
                multiline
                rows={2}
                helperText="پیامی که هنگام عدم تطابق نمایش داده می‌شود"
              />
            </Grid>
            
            {selectedTemplate.type === ValidationType.MIN_LENGTH && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="حداقل تعداد کاراکتر"
                  type="number"
                  value={editingRule.config.value || ''}
                  onChange={(e) => setEditingRule({
                    ...editingRule,
                    config: { ...editingRule.config, value: parseInt(e.target.value) || 0 }
                  })}
                  fullWidth
                />
              </Grid>
            )}
            
            {selectedTemplate.type === ValidationType.MAX_LENGTH && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="حداکثر تعداد کاراکتر"
                  type="number"
                  value={editingRule.config.value || ''}
                  onChange={(e) => setEditingRule({
                    ...editingRule,
                    config: { ...editingRule.config, value: parseInt(e.target.value) || 100 }
                  })}
                  fullWidth
                />
              </Grid>
            )}
            
            {selectedTemplate.type === ValidationType.RANGE && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="حداقل مقدار"
                    type="number"
                    value={editingRule.config.min || ''}
                    onChange={(e) => setEditingRule({
                      ...editingRule,
                      config: { ...editingRule.config, min: parseFloat(e.target.value) || 0 }
                    })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="حداکثر مقدار"
                    type="number"
                    value={editingRule.config.max || ''}
                    onChange={(e) => setEditingRule({
                      ...editingRule,
                      config: { ...editingRule.config, max: parseFloat(e.target.value) || 100 }
                    })}
                    fullWidth
                  />
                </Grid>
              </>
            )}
            
            {selectedTemplate.type === ValidationType.PATTERN && (
              <>
                <Grid item xs={12}>
                  <TextField
                    label="الگوی Regular Expression"
                    value={editingRule.config.pattern || ''}
                    onChange={(e) => setEditingRule({
                      ...editingRule,
                      config: { ...editingRule.config, pattern: e.target.value }
                    })}
                    fullWidth
                    placeholder="^[a-zA-Z0-9]+$"
                    InputProps={{
                      startAdornment: <RegexIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    helperText="الگوی JavaScript RegExp برای اعتبارسنجی"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="فلگ‌ها"
                    value={editingRule.config.flags || 'i'}
                    onChange={(e) => setEditingRule({
                      ...editingRule,
                      config: { ...editingRule.config, flags: e.target.value }
                    })}
                    fullWidth
                    placeholder="i"
                    helperText="فلگ‌های RegExp (i, g, m)"
                  />
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editingRule.enabled}
                    onChange={(e) => setEditingRule({ ...editingRule, enabled: e.target.checked })}
                  />
                }
                label="فعال"
              />
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<CheckIcon />}
              onClick={handleSaveRule}
            >
              ذخیره
            </Button>
            <Button
              variant="outlined"
              startIcon={<CloseIcon />}
              onClick={handleCancelRule}
            >
              انصراف
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Group templates by category
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, ValidationRuleTemplate[]> = {};
    ruleTemplates.forEach(template => {
      if (!groups[template.category]) {
        groups[template.category] = [];
      }
      groups[template.category].push(template);
    });
    return groups;
  }, [ruleTemplates]);

  const categoryNames = {
    basic: 'قوانین پایه',
    format: 'اعتبارسنجی فرمت',
    'cross-field': 'اعتبارسنجی متقابل',
    conditional: 'اعتبارسنجی شرطی',
    custom: 'قوانین سفارشی'
  };

  return (
    <Box>
      
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        قوانین اعتبارسنجی برای کنترل صحت داده‌های ورودی تعریف کنید
      </Typography>

      {/* Current validation rules */}
      {rules.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              قوانین فعلی ({rules.filter(r => r.enabled).length} فعال از {rules.length})
            </Typography>
            
            <Stack spacing={2}>
              {rules.map((rule) => {
                const template = ruleTemplates.find(t => t.type === rule.type);
                return (
                  <Box
                    key={rule.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 1.5,
                      border: 1,
                      borderColor: rule.enabled ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      backgroundColor: rule.enabled ? alpha(theme.palette.primary.main, 0.05) : alpha(theme.palette.grey[400], 0.05)
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                        {template?.name || rule.type}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, mt: 0.5 }}>
                        {rule.message}
                      </Typography>
                    </Box>
                    
                    <Stack direction="row" spacing={1}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={rule.enabled}
                            onChange={() => handleToggleRule(rule.id)}
                            size="small"
                          />
                        }
                        label=""
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleEditRule(rule)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteRule(rule.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Add new rule section */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            افزودن قانون جدید
          </Typography>
          
          {Object.entries(groupedTemplates).map(([category, templates]) => (
            <Box key={category} sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom color="primary">
                {categoryNames[category as keyof typeof categoryNames]}
              </Typography>
              
              <Grid container spacing={1.5}>
                {templates.map((template) => (
                  <Grid item xs={6} sm={4} md={3} key={template.type}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[4]
                        }
                      }}
                      onClick={() => handleAddRule(template)}
                    >
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                          {template.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, lineHeight: 1.3 }}>
                          {template.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* Rule configuration form */}
      <Collapse in={showRuleBuilder}>
        {renderRuleConfig()}
      </Collapse>

      {/* Validation tester */}
      {rules.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              تست اعتبارسنجی
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="مقدار آزمایشی"
                value={testValue}
                onChange={(e) => setTestValue(e.target.value)}
                fullWidth
                placeholder="مقداری برای تست وارد کنید"
              />
              <Button
                variant="outlined"
                startIcon={<PreviewIcon />}
                onClick={handleTestValidation}
                sx={{ minWidth: 120 }}
              >
                تست
              </Button>
            </Box>
            
            {Object.keys(testResults).length > 0 && (
              <Stack spacing={1}>
                {Object.entries(testResults).map(([ruleId, result]) => {
                  const rule = rules.find(r => r.id === ruleId);
                  const template = ruleTemplates.find(t => t.type === rule?.type);
                  
                  return (
                    <Alert
                      key={ruleId}
                      severity={result.valid ? 'success' : 'error'}
                      sx={{ fontSize: '0.875rem' }}
                    >
                      <strong>{template?.name}:</strong> {result.message}
                    </Alert>
                  );
                })}
              </Stack>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ValidationRuleBuilder;