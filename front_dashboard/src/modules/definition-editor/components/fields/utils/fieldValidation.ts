import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';

export interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Helper function to check if field type conversion is valid
const validateFieldTypeConversion = (
  field: ExtendedCustomFieldDefinition,
  originalType?: string
): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // If this is a field type conversion (editing existing field)
  if (originalType && originalType !== field.type) {
    // Check for incompatible property combinations after type conversion
    switch (field.type) {
      case 'select':
      case 'multiselect':
        // These types require options
        if (!field.options || field.options.length === 0) {
          errors.push({
            field: 'options',
            message: 'برای فیلد انتخابی حداقل یک گزینه باید تعریف شود',
            type: 'warning'
          });
        }
        break;
        
      case 'boolean':
        // Boolean fields don't need text-specific properties
        break;
        
      case 'number':
        // Number fields have specific validation
        if (field.defaultValue && isNaN(Number(field.defaultValue))) {
          errors.push({
            field: 'defaultValue',
            message: 'مقدار پیش‌فرض باید عدد باشد',
            type: 'error'
          });
        }
        break;
        
      default:
        // Text-based fields
        if (field.type === 'email' && field.defaultValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.defaultValue)) {
          errors.push({
            field: 'defaultValue',
            message: 'مقدار پیش‌فرض باید ایمیل معتبر باشد',
            type: 'warning'
          });
        }
        break;
    }
    
    // Warn about potential data loss during type conversion
    const incompatibleConversions = [
      { from: 'select', to: 'number' },
      { from: 'multiselect', to: 'number' },
      { from: 'boolean', to: 'number' },
    ];
    
    const incompatiblePair = incompatibleConversions.find(
      pair => pair.from === originalType && pair.to === field.type
    );
    
    if (incompatiblePair) {
      errors.push({
        field: 'type',
        message: `تبدیل از ${originalType} به ${field.type} ممکن است منجر به از دست رفتن داده‌ها شود`,
        type: 'warning'
      });
    }
  }
  
  return errors;
};

// Helper function to validate display type compatibility
const validateDisplayTypeCompatibility = (
  field: ExtendedCustomFieldDefinition
): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Check if display type is compatible with field type
  const displayType = field.displayType || 'normal';
  
  // Define compatible display types for each field type
  const compatibleDisplayTypes: Record<string, string[]> = {
    'text': ['normal', 'accordion', 'multiline', 'rich-text', 'richtext', 'inline', 'chips', 'pill', 'masked', 'popover'],
    'textarea': ['normal', 'accordion', 'multiline', 'rich-text', 'richtext'],
    'select': ['normal', 'chips', 'pill'],
    'multiselect': ['normal', 'chips', 'pill'],
    'number': ['normal', 'inline'],
    'boolean': ['normal', 'inline'],
    'email': ['normal', 'inline'],
    'phone': ['normal', 'inline'],
    'date': ['normal'],
    'password': ['normal'],
    'file': ['normal'],
  };
  
  const fieldType = field.type;
  const compatibleTypes = compatibleDisplayTypes[fieldType] || ['normal'];
  
  if (!compatibleTypes.includes(displayType)) {
    errors.push({
      field: 'displayType',
      message: `نوع نمایش "${displayType}" با نوع فیلد "${fieldType}" سازگار نیست`,
      type: 'warning'
    });
  }
  
  // Check if options are required for certain display types
  const displayTypesRequiringOptions = ['accordion', 'chips', 'pill'];
  if (displayTypesRequiringOptions.includes(displayType) && 
      ['text', 'textarea'].includes(fieldType) && 
      (!field.options || field.options.length === 0)) {
    errors.push({
      field: 'options',
      message: `برای نوع نمایش "${displayType}" حداقل یک گزینه باید تعریف شود`,
      type: 'warning'
    });
  }
  
  return errors;
};

export const validateFieldDefinition = (
  field: ExtendedCustomFieldDefinition,
  originalType?: string  // Optional parameter for field type conversion validation
): ValidationResult => {
  const errors: ValidationError[] = [];

  // Required field validation
  if (!field.name?.trim()) {
    errors.push({
      field: 'name',
      message: 'عنوان فیلد اجباری است',
      type: 'error'
    });
  }

  if (!field.englishName?.trim()) {
    errors.push({
      field: 'englishName',
      message: 'کلید یکتا اجباری است',
      type: 'error'
    });
  }

  // English name format validation
  if (field.englishName && !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(field.englishName)) {
    errors.push({
      field: 'englishName',
      message: 'کلید یکتا باید با حرف انگلیسی شروع شود و فقط شامل حروف انگلیسی، اعداد و _ باشد',
      type: 'error'
    });
  }

  // Length validation
  if (field.validationRules?.minLength && field.validationRules?.maxLength) {
    if (field.validationRules.minLength > field.validationRules.maxLength) {
      errors.push({
        field: 'validationRules',
        message: 'حداقل طول نمی‌تواند بیشتر از حداکثر طول باشد',
        type: 'error'
      });
    }
  }

  // Pattern validation
  if (field.validationRules?.pattern) {
    try {
      new RegExp(field.validationRules.pattern);
    } catch (e) {
      errors.push({
        field: 'validationRules.pattern',
        message: 'الگوی Regex نامعتبر است',
        type: 'error'
      });
    }
  }

  // Type-specific validation
  if (field.type === 'select' || field.type === 'multiselect') {
    if (!field.options || field.options.length === 0) {
      errors.push({
        field: 'options',
        message: 'برای فیلد انتخابی حداقل یک گزینه باید تعریف شود',
        type: 'warning'
      });
    }
  }

  // Default value validation
  if (field.defaultValue) {
    if (field.type === 'number' && isNaN(Number(field.defaultValue))) {
      errors.push({
        field: 'defaultValue',
        message: 'مقدار پیش‌فرض باید عدد باشد',
        type: 'error'
      });
    }

    if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.defaultValue)) {
      errors.push({
        field: 'defaultValue',
        message: 'مقدار پیش‌فرض باید ایمیل معتبر باشد',
        type: 'warning'
      });
    }
  }
  
  // Field type conversion validation
  errors.push(...validateFieldTypeConversion(field, originalType));
  
  // Display type compatibility validation
  errors.push(...validateDisplayTypeCompatibility(field));

  return {
    isValid: errors.filter(e => e.type === 'error').length === 0,
    errors
  };
};

export const getFieldError = (errors: ValidationError[], fieldName: string): ValidationError | undefined => {
  return errors.find(error => error.field === fieldName || error.field.startsWith(fieldName + '.'));
};

export const hasFieldError = (errors: ValidationError[], fieldName: string): boolean => {
  return getFieldError(errors, fieldName) !== undefined;
};