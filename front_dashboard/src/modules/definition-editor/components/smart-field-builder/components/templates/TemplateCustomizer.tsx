import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Button,
  IconButton,
  Divider,
  Alert,
  Chip,
  Stack,
  Grid,
  alpha,
  useTheme
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';
import { SmartFieldConfig, BaseFieldType, EnhancementType, FieldEnhancement } from '../../types/smartFieldTypes';

interface TemplateCustomizerProps {
  template: SmartFieldConfig | SmartFieldConfig[];
  onSave: (customizedFields: SmartFieldConfig[]) => void;
  onCancel: () => void;
  existingFields?: SmartFieldConfig[];
}

const TemplateCustomizer: React.FC<TemplateCustomizerProps> = ({
  template,
  onSave,
  onCancel,
  existingFields = []
}) => {
  const theme = useTheme();
  const [fields, setFields] = useState<SmartFieldConfig[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});

  // Initialize fields from template
  useEffect(() => {
    const templateFields = Array.isArray(template) ? template : [template];
    setFields(templateFields.map((field, index) => ({
      ...field,
      id: `${field.id}_${Date.now()}_${index}` // Ensure unique IDs
    })));
  }, [template]);

  // Validate field
  const validateField = (field: SmartFieldConfig, index: number): Record<string, string> => {
    const fieldErrors: Record<string, string> = {};

    if (!field.name?.trim()) {
      fieldErrors.name = 'نام فیلد الزامی است';
    }

    if (!field.englishName?.trim()) {
      fieldErrors.englishName = 'نام انگلیسی الزامی است';
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(field.englishName)) {
      fieldErrors.englishName = 'نام انگلیسی باید با حرف شروع شود';
    } else {
      // Check for duplicates in existing fields and current template
      const isDuplicate = existingFields.some(existing => existing.englishName === field.englishName) ||
        fields.some((f, i) => i !== index && f.englishName === field.englishName);
      
      if (isDuplicate) {
        fieldErrors.englishName = 'این نام انگلیسی قبلاً استفاده شده است';
      }
    }

    if (!field.baseType) {
      fieldErrors.baseType = 'انتخاب نوع فیلد الزامی است';
    }

    return fieldErrors;
  };

  // Update field
  const updateField = (index: number, updates: Partial<SmartFieldConfig>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);

    // Clear errors for updated field
    const fieldErrors = validateField(newFields[index], index);
    setErrors(prev => ({
      ...prev,
      [index]: fieldErrors
    }));
  };

  // Add new field
  const addField = () => {
    const newField: SmartFieldConfig = {
      id: `custom_field_${Date.now()}`,
      name: 'فیلد جدید',
      englishName: `customField${fields.length + 1}`,
      baseType: 'text' as BaseFieldType,
      enhancements: [],
      validation: [],
      isRequired: false,
      order: fields.length + 1
    };

    setFields([...fields, newField]);
    setEditingIndex(fields.length);
  };

  // Remove field
  const removeField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    setFields(newFields);
    
    // Update errors
    const newErrors = { ...errors };
    delete newErrors[index];
    
    // Shift error indices
    Object.keys(newErrors).forEach(key => {
      const keyIndex = parseInt(key);
      if (keyIndex > index) {
        newErrors[keyIndex - 1] = newErrors[keyIndex];
        delete newErrors[keyIndex];
      }
    });
    
    setErrors(newErrors);
    
    if (editingIndex === index) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  // Save customized template
  const handleSave = () => {
    // Validate all fields
    const allErrors: Record<number, Record<string, string>> = {};
    fields.forEach((field, index) => {
      const fieldErrors = validateField(field, index);
      if (Object.keys(fieldErrors).length > 0) {
        allErrors[index] = fieldErrors;
      }
    });

    setErrors(allErrors);

    if (Object.keys(allErrors).length === 0) {
      onSave(fields);
    }
  };

  // Get available enhancements based on base type
  const getAvailableEnhancements = (baseType: BaseFieldType): EnhancementType[] => {
    switch (baseType) {
      case BaseFieldType.TEXT:
        return [EnhancementType.MULTILINE, EnhancementType.COMPOSITE];
      case BaseFieldType.NUMBER:
        return [EnhancementType.RANGE, EnhancementType.UNIT, EnhancementType.DECIMAL];
      case BaseFieldType.CHOICE:
        return [EnhancementType.SINGLE, EnhancementType.MULTIPLE, EnhancementType.SEARCHABLE, EnhancementType.GROUPED];
      case BaseFieldType.REFERENCE:
        return [EnhancementType.HIERARCHICAL, EnhancementType.FREE_TEXT, EnhancementType.SEARCHABLE_REF];
      default:
        return [];
    }
  };

  const hasErrors = Object.values(errors).some(fieldErrors => Object.keys(fieldErrors).length > 0);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        سفارشی‌سازی قالب
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        می‌توانید فیلدهای قالب را ویرایش، حذف یا اضافه کنید
      </Typography>

      <Stack spacing={2} sx={{ mb: 3 }}>
        {fields.map((field, index) => (
          <Paper 
            key={field.id} 
            sx={{ 
              p: 2, 
              border: editingIndex === index ? 2 : 1,
              borderColor: editingIndex === index ? 'primary.main' : 'divider',
              backgroundColor: editingIndex === index ? alpha(theme.palette.primary.main, 0.02) : 'inherit'
            }}
          >
            {editingIndex === index ? (
              // Edit Mode
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="نام فیلد"
                    value={field.name}
                    onChange={(e) => updateField(index, { name: e.target.value })}
                    fullWidth
                    size="small"
                    error={!!errors[index]?.name}
                    helperText={errors[index]?.name}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="نام انگلیسی"
                    value={field.englishName}
                    onChange={(e) => updateField(index, { englishName: e.target.value })}
                    fullWidth
                    size="small"
                    error={!!errors[index]?.englishName}
                    helperText={errors[index]?.englishName}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" error={!!errors[index]?.baseType}>
                    <InputLabel>نوع فیلد</InputLabel>
                    <Select
                      value={field.baseType}
                      label="نوع فیلد"
                      onChange={(e) => updateField(index, { baseType: e.target.value as BaseFieldType })}
                    >
                      <MenuItem value="text">متن</MenuItem>
                      <MenuItem value="textarea">متن چندخطی</MenuItem>
                      <MenuItem value="number">عدد</MenuItem>
                      <MenuItem value="date">تاریخ</MenuItem>
                      <MenuItem value="datetime">تاریخ و زمان</MenuItem>
                      <MenuItem value="choice">انتخابی</MenuItem>
                      <MenuItem value="boolean">بولی</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.isRequired || false}
                        onChange={(e) => updateField(index, {
                          isRequired: e.target.checked
                        })}
                      />
                    }
                    label="فیلد اجباری"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" gutterBottom>
                    ویژگی‌های اضافی:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {getAvailableEnhancements(field.baseType).map(enhancement => {
                      const isEnabled = field.enhancements?.some(e => e.type === enhancement && e.enabled) || false;
                      return (
                        <Chip
                          key={enhancement}
                          label={enhancement}
                          variant={isEnabled ? 'filled' : 'outlined'}
                          size="small"
                          onClick={() => {
                            const currentEnhancements = field.enhancements || [];
                            const existingIndex = currentEnhancements.findIndex(e => e.type === enhancement);
                            
                            let newEnhancements;
                            if (existingIndex !== -1) {
                              // Toggle existing enhancement
                              newEnhancements = [...currentEnhancements];
                              newEnhancements[existingIndex] = {
                                ...newEnhancements[existingIndex],
                                enabled: !newEnhancements[existingIndex].enabled
                              };
                            } else {
                              // Add new enhancement
                              newEnhancements = [
                                ...currentEnhancements,
                                {
                                  type: enhancement,
                                  config: {},
                                  enabled: true
                                }
                              ];
                            }
                            updateField(index, { enhancements: newEnhancements });
                          }}
                          color="primary"
                        />
                      );
                    })}
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="توضیحات"
                    value={field.description || ''}
                    onChange={(e) => updateField(index, { description: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SaveIcon />}
                      onClick={() => setEditingIndex(null)}
                    >
                      ذخیره
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<CancelIcon />}
                      onClick={() => setEditingIndex(null)}
                    >
                      انصراف
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            ) : (
              // View Mode
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {field.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {field.englishName} • {field.baseType}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => setEditingIndex(index)}
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => removeField(index)}
                      color="error"
                      disabled={fields.length === 1}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                
                {field.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {field.description}
                  </Typography>
                )}
                
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {field.isRequired && (
                    <Chip label="اجباری" size="small" color="error" />
                  )}
                  {field.enhancements?.filter(e => e.enabled).map(enhancement => (
                    <Chip 
                      key={enhancement.type} 
                      label={enhancement.type} 
                      size="small" 
                      variant="outlined" 
                    />
                  ))}
                </Box>
                
                {errors[index] && Object.keys(errors[index]).length > 0 && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {Object.values(errors[index]).join(', ')}\n                  </Alert>
                )}
              </Box>
            )}
          </Paper>
        ))}
        
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addField}
          sx={{ alignSelf: 'flex-start' }}
        >
          افزودن فیلد جدید
        </Button>
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={onCancel}
        >
          انصراف
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={hasErrors || fields.length === 0}
          startIcon={<SaveIcon />}
        >
          ذخیره قالب سفارشی‌شده
        </Button>
      </Box>
    </Box>
  );
};

export default TemplateCustomizer;