import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Chip,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  alpha,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  ExpandMore as ExpandMoreIcon,
  ArrowForward as ArrowForwardIcon,
  Rule as RuleIcon,
  Psychology as LogicIcon
} from '@mui/icons-material';
import { SmartFieldConfig } from '../../types/smartFieldTypes';

// Dependency types
export enum DependencyType {
  VISIBILITY = 'visibility',
  REQUIRED = 'required',
  VALUE = 'value',
  OPTIONS = 'options'
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_EQUAL = 'greater_equal',
  LESS_EQUAL = 'less_equal',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',
  IN = 'in',
  NOT_IN = 'not_in'
}

export interface FieldDependency {
  id: string;
  type: DependencyType;
  sourceFieldId: string;
  targetFieldId: string;
  condition: {
    operator: ConditionOperator;
    value: any;
    values?: any[]; // For IN/NOT_IN operators
  };
  action: {
    type: 'show' | 'hide' | 'require' | 'optional' | 'setValue' | 'setOptions';
    value?: any;
    options?: { id: string; label: string }[];
  };
  enabled: boolean;
  description?: string;
}

interface FieldDependencyBuilderProps {
  fields: SmartFieldConfig[];
  dependencies: FieldDependency[];
  onChange: (dependencies: FieldDependency[]) => void;
  onValidationError?: (errors: string[]) => void;
}

const FieldDependencyBuilder: React.FC<FieldDependencyBuilderProps> = ({
  fields,
  dependencies,
  onChange,
  onValidationError
}) => {
  const theme = useTheme();
  const [editingDependency, setEditingDependency] = useState<FieldDependency | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Memoized field options for dropdowns
  const fieldOptions = useMemo(() => {
    return fields.map(field => ({
      id: field.id,
      label: `${field.name} (${field.englishName})`,
      baseType: field.baseType
    }));
  }, [fields]);

  // Get operator options based on field type
  const getOperatorOptions = useCallback((fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return [];

    const commonOperators = [
      { value: ConditionOperator.EQUALS, label: 'برابر با' },
      { value: ConditionOperator.NOT_EQUALS, label: 'مخالف' },
      { value: ConditionOperator.IS_EMPTY, label: 'خالی است' },
      { value: ConditionOperator.IS_NOT_EMPTY, label: 'خالی نیست' }
    ];

    switch (field.baseType) {
      case 'number':
        return [
          ...commonOperators,
          { value: ConditionOperator.GREATER_THAN, label: 'بزرگتر از' },
          { value: ConditionOperator.LESS_THAN, label: 'کمتر از' },
          { value: ConditionOperator.GREATER_EQUAL, label: 'بزرگتر مساوی' },
          { value: ConditionOperator.LESS_EQUAL, label: 'کمتر مساوی' }
        ];
      
      case 'text':
      case 'textarea':
        return [
          ...commonOperators,
          { value: ConditionOperator.CONTAINS, label: 'شامل' },
          { value: ConditionOperator.NOT_CONTAINS, label: 'شامل نیست' },
          { value: ConditionOperator.STARTS_WITH, label: 'شروع می‌شود با' },
          { value: ConditionOperator.ENDS_WITH, label: 'پایان می‌یابد با' }
        ];
      
      case 'choice':
        return [
          ...commonOperators,
          { value: ConditionOperator.IN, label: 'یکی از' },
          { value: ConditionOperator.NOT_IN, label: 'هیچکدام از' }
        ];
      
      default:
        return commonOperators;
    }
  }, [fields]);

  // Validate dependency
  const validateDependency = useCallback((dependency: FieldDependency): string[] => {
    const errors: string[] = [];

    if (!dependency.sourceFieldId) {
      errors.push('فیلد مبدأ الزامی است');
    }

    if (!dependency.targetFieldId) {
      errors.push('فیلد مقصد الزامی است');
    }

    if (dependency.sourceFieldId === dependency.targetFieldId) {
      errors.push('فیلد مبدأ و مقصد نمی‌توانند یکسان باشند');
    }

    // Check for circular dependencies
    const checkCircular = (sourceId: string, targetId: string, visited: Set<string> = new Set()): boolean => {
      if (visited.has(sourceId)) return true;
      visited.add(sourceId);

      const relatedDeps = dependencies.filter(d => d.sourceFieldId === targetId && d.enabled);
      return relatedDeps.some(d => checkCircular(d.sourceFieldId, d.targetFieldId, visited));
    };

    if (checkCircular(dependency.sourceFieldId, dependency.targetFieldId)) {
      errors.push('وابستگی دایره‌ای شناسایی شد');
    }

    return errors;
  }, [dependencies]);

  // Create new dependency
  const createDependency = useCallback((): FieldDependency => ({
    id: `dep_${Date.now()}`,
    type: DependencyType.VISIBILITY,
    sourceFieldId: '',
    targetFieldId: '',
    condition: {
      operator: ConditionOperator.EQUALS,
      value: ''
    },
    action: {
      type: 'show'
    },
    enabled: true,
    description: ''
  }), []);

  // Add new dependency
  const handleAddDependency = useCallback(() => {
    const newDependency = createDependency();
    setEditingDependency(newDependency);
    setShowAddForm(true);
  }, [createDependency]);

  // Save dependency
  const handleSaveDependency = useCallback((dependency: FieldDependency) => {
    const errors = validateDependency(dependency);
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      if (onValidationError) {
        onValidationError(errors);
      }
      return;
    }

    const existingIndex = dependencies.findIndex(d => d.id === dependency.id);
    let newDependencies;

    if (existingIndex >= 0) {
      // Update existing
      newDependencies = [...dependencies];
      newDependencies[existingIndex] = dependency;
    } else {
      // Add new
      newDependencies = [...dependencies, dependency];
    }

    onChange(newDependencies);
    setEditingDependency(null);
    setShowAddForm(false);
    setValidationErrors([]);
  }, [dependencies, onChange, validateDependency, onValidationError]);

  // Delete dependency
  const handleDeleteDependency = useCallback((dependencyId: string) => {
    const newDependencies = dependencies.filter(d => d.id !== dependencyId);
    onChange(newDependencies);
  }, [dependencies, onChange]);

  // Toggle dependency enabled state
  const handleToggleDependency = useCallback((dependencyId: string) => {
    const newDependencies = dependencies.map(d => 
      d.id === dependencyId ? { ...d, enabled: !d.enabled } : d
    );
    onChange(newDependencies);
  }, [dependencies, onChange]);

  // Get field name by ID
  const getFieldName = useCallback((fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    return field ? field.name : 'نامشخص';
  }, [fields]);

  // Render dependency action description
  const renderActionDescription = useCallback((dependency: FieldDependency) => {
    const sourceField = getFieldName(dependency.sourceFieldId);
    const targetField = getFieldName(dependency.targetFieldId);
    const operator = getOperatorOptions(dependency.sourceFieldId)
      .find(op => op.value === dependency.condition.operator)?.label || 'نامشخص';

    switch (dependency.action.type) {
      case 'show':
        return `نمایش "${targetField}" وقتی "${sourceField}" ${operator} "${dependency.condition.value}"`;
      case 'hide':
        return `مخفی کردن "${targetField}" وقتی "${sourceField}" ${operator} "${dependency.condition.value}"`;
      case 'require':
        return `اجباری کردن "${targetField}" وقتی "${sourceField}" ${operator} "${dependency.condition.value}"`;
      case 'optional':
        return `اختیاری کردن "${targetField}" وقتی "${sourceField}" ${operator} "${dependency.condition.value}"`;
      default:
        return 'عمل نامشخص';
    }
  }, [getFieldName, getOperatorOptions]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          وابستگی‌های فیلد
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddDependency}
          disabled={fields.length < 2}
        >
          افزودن وابستگی
        </Button>
      </Box>

      {fields.length < 2 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          برای ایجاد وابستگی، حداقل 2 فیلد نیاز است.
        </Alert>
      )}

      {validationErrors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Box>
            {validationErrors.map((error, index) => (
              <Typography key={index} variant="body2">
                • {error}
              </Typography>
            ))}
          </Box>
        </Alert>
      )}

      {/* Existing Dependencies */}
      <Box sx={{ mb: 3 }}>
        {dependencies.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: alpha(theme.palette.info.main, 0.05) }}>
            <LinkOffIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              هیچ وابستگی تعریف نشده
            </Typography>
            <Typography variant="body2" color="text.secondary">
              وابستگی‌ها به شما امکان ایجاد فیلدهای شرطی می‌دهند
            </Typography>
          </Paper>
        ) : (
          <List>
            {dependencies.map((dependency) => (
              <ListItem
                key={dependency.id}
                sx={{
                  mb: 1,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  backgroundColor: dependency.enabled ? 'background.paper' : alpha(theme.palette.action.disabled, 0.1)
                }}
              >
                <ListItemIcon>
                  {dependency.enabled ? (
                    <LinkIcon color="primary" />
                  ) : (
                    <LinkOffIcon color="disabled" />
                  )}
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {renderActionDescription(dependency)}
                      </Typography>
                      {!dependency.enabled && (
                        <Chip label="غیرفعال" size="small" color="default" />
                      )}
                    </Box>
                  }
                  secondary={dependency.description || `نوع: ${dependency.type}`}
                />
                
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleToggleDependency(dependency.id)}
                    color={dependency.enabled ? 'primary' : 'default'}
                  >
                    {dependency.enabled ? <VisibilityIcon /> : <VisibilityOffIcon />}
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={() => {
                      setEditingDependency(dependency);
                      setShowAddForm(true);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={() => handleDeleteDependency(dependency.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Add/Edit Dependency Form */}
      {showAddForm && editingDependency && (
        <DependencyEditForm
          dependency={editingDependency}
          fields={fieldOptions}
          operatorOptions={getOperatorOptions}
          onSave={handleSaveDependency}
          onCancel={() => {
            setEditingDependency(null);
            setShowAddForm(false);
            setValidationErrors([]);
          }}
          validationErrors={validationErrors}
        />
      )}
    </Box>
  );
};

// Separate form component for editing dependencies
interface DependencyEditFormProps {
  dependency: FieldDependency;
  fields: { id: string; label: string; baseType: string }[];
  operatorOptions: (fieldId: string) => { value: ConditionOperator; label: string }[];
  onSave: (dependency: FieldDependency) => void;
  onCancel: () => void;
  validationErrors: string[];
}

const DependencyEditForm: React.FC<DependencyEditFormProps> = ({
  dependency,
  fields,
  operatorOptions,
  onSave,
  onCancel,
  validationErrors
}) => {
  const [formData, setFormData] = useState<FieldDependency>(dependency);

  const handleFieldChange = (field: keyof FieldDependency, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleConditionChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      condition: { ...prev.condition, [field]: value }
    }));
  };

  const handleActionChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      action: { ...prev.action, [field]: value }
    }));
  };

  return (
    <Paper sx={{ p: 3, mb: 2, border: 2, borderColor: 'primary.main' }}>
      <Typography variant="h6" gutterBottom>
        {dependency.id.startsWith('dep_') ? 'افزودن وابستگی جدید' : 'ویرایش وابستگی'}
      </Typography>

      <Grid container spacing={3}>
        {/* Source Field */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>فیلد مبدأ</InputLabel>
            <Select
              value={formData.sourceFieldId}
              label="فیلد مبدأ"
              onChange={(e) => handleFieldChange('sourceFieldId', e.target.value)}
            >
              {fields.map(field => (
                <MenuItem key={field.id} value={field.id}>
                  {field.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Target Field */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>فیلد مقصد</InputLabel>
            <Select
              value={formData.targetFieldId}
              label="فیلد مقصد"
              onChange={(e) => handleFieldChange('targetFieldId', e.target.value)}
            >
              {fields.filter(f => f.id !== formData.sourceFieldId).map(field => (
                <MenuItem key={field.id} value={field.id}>
                  {field.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Condition Operator */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>عملگر شرط</InputLabel>
            <Select
              value={formData.condition.operator}
              label="عملگر شرط"
              onChange={(e) => handleConditionChange('operator', e.target.value)}
              disabled={!formData.sourceFieldId}
            >
              {operatorOptions(formData.sourceFieldId).map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Condition Value */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="مقدار شرط"
            value={formData.condition.value}
            onChange={(e) => handleConditionChange('value', e.target.value)}
            disabled={[ConditionOperator.IS_EMPTY, ConditionOperator.IS_NOT_EMPTY].includes(formData.condition.operator)}
          />
        </Grid>

        {/* Action Type */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>نوع عمل</InputLabel>
            <Select
              value={formData.action.type}
              label="نوع عمل"
              onChange={(e) => handleActionChange('type', e.target.value)}
            >
              <MenuItem value="show">نمایش</MenuItem>
              <MenuItem value="hide">مخفی کردن</MenuItem>
              <MenuItem value="require">اجباری کردن</MenuItem>
              <MenuItem value="optional">اختیاری کردن</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Description */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="توضیحات (اختیاری)"
            value={formData.description || ''}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            multiline
            rows={2}
          />
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={onCancel}>
              انصراف
            </Button>
            <Button
              variant="contained"
              onClick={() => onSave(formData)}
              disabled={!formData.sourceFieldId || !formData.targetFieldId}
            >
              ذخیره
            </Button>
          </Box>
        </Grid>
      </Grid>

      {validationErrors.length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Box>
            {validationErrors.map((error, index) => (
              <Typography key={index} variant="body2">
                • {error}
              </Typography>
            ))}
          </Box>
        </Alert>
      )}
    </Paper>
  );
};

export default FieldDependencyBuilder;