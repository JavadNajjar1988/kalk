import React, { useState } from 'react';
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
  FormGroup,
  FormHelperText,
  Button,
  IconButton,
  Divider,
  alpha,
  Grid,
  Chip,
  InputAdornment,
  OutlinedInput,
  Alert
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import faIR from 'date-fns/locale/fa-IR';

// Icons
import PreviewIcon from '@mui/icons-material/Preview';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// Types
import { CustomField } from '../../types/equipment';

// Reference Field Renderer
import ReferenceFieldRenderer from './ReferenceFieldRenderer';

// Enhanced field components
import {
  EnglishTextFieldComponent,
  NumericTextFieldComponent,
  ConditionalNationalIdComponent,
  NameSplitFieldComponent,
  FullNameDualFieldComponent
} from '../forms/EnhancedFieldComponents';
import PhoneArrayFieldComponent from '../forms/PhoneArrayField';
import HierarchicalAddressComponent from '../forms/HierarchicalAddressField';

// Removed legacy imports

// Enhanced field types
import { ENHANCED_FIELD_TYPES } from '../../types/enhancedFields';

interface FieldPreviewProps {
  fields: CustomField[];
  title?: string;
  description?: string;
  nodeName?: string;
  readOnly?: boolean;
  onSubmit?: (formData: Record<string, any>) => void;
}

const FieldPreview: React.FC<FieldPreviewProps> = ({
  fields,
  title = 'پیش‌نمایش فرم',
  description = 'نمایش فرم ایجاد شده بر اساس فیلدهای تعریف شده',
  nodeName,
  readOnly = false,
  onSubmit
}) => {
  // حالت‌های کامپوننت
  const [formValues, setFormValues] = useState<Record<string, any>>(() => {
    const initialValues: Record<string, any> = {};
    fields.forEach(field => {
      // Use type assertion to handle enhanced field types
      const fieldType = field.type as string;
      
      // Extract Smart Field metadata if available
      const getSmartFieldMetadata = () => {
        try {
          if (typeof field.defaultValue === 'string' && field.defaultValue) {
            const metadata = JSON.parse(field.defaultValue);
            // Check if this is the new Smart Field format with finalSettings
            if (metadata && metadata.finalSettings) {
              return metadata;
            }
            // Check if this is the old enhancement-only format
            if (metadata && typeof metadata === 'object' && !metadata.finalSettings) {
              return { enhancements: metadata, finalSettings: {} };
            }
          }
        } catch (e) {
          // If parsing fails, treat as regular field
        }
        return { enhancements: {}, finalSettings: {} };
      };
      
      const smartFieldMetadata = getSmartFieldMetadata();
      
      // Check if this is a composite field
      const isComposite = () => {
        return smartFieldMetadata.enhancements && smartFieldMetadata.enhancements.composite;
      };
      
      // Set appropriate initial value based on field type and enhancements
      if (isComposite()) {
        initialValues[field.id] = [];
      } else if (fieldType === 'phone' || fieldType === 'phone-array') {
        initialValues[field.id] = fieldType === 'phone' ? [''] : [];
      } else if (fieldType === 'social') {
        initialValues[field.id] = [{ platform: '', username: '' }];
      } else if (fieldType === 'address-array') {
        initialValues[field.id] = [];
      } else if (fieldType === 'name-split') {
        initialValues[field.id] = { firstName: '', lastName: '' };
      } else if (fieldType === 'full-name-dual') {
        initialValues[field.id] = { persian: '', english: '' };
      } else if (fieldType === 'hierarchical-address') {
        initialValues[field.id] = null;
      } else {
        // For Smart Fields, don't use defaultValue as initial value (it contains metadata)
        // For regular fields, use defaultValue only if it's not JSON metadata
        let initialValue = '';
        if (typeof field.defaultValue === 'string' && field.defaultValue) {
          try {
            JSON.parse(field.defaultValue);
            // If it's valid JSON, it's probably metadata, so use empty string
            initialValue = '';
          } catch (e) {
            // If it's not valid JSON, it's probably a real default value
            initialValue = field.defaultValue;
          }
        }
        initialValues[field.id] = initialValue;
      }
    });
    return initialValues;
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // مدیریت تغییر مقدار فیلدها
  const handleChange = (fieldId: string, value: any) => {
    setFormValues({
      ...formValues,
      [fieldId]: value
    });
    
    // پاک کردن خطا در صورت وجود
    if (formErrors[fieldId]) {
      setFormErrors({
        ...formErrors,
        [fieldId]: ''
      });
    }
  };
  
  // اعتبارسنجی فرم
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;
    
    fields.forEach(field => {
      const value = formValues[field.id];
      
      // بررسی فیلدهای اجباری
      if (field.isRequired) {
        if (value === undefined || value === null || value === '') {
          errors[field.id] = 'این فیلد الزامی است';
          isValid = false;
        }
      }
      
      // بررسی قوانین اعتبارسنجی
      if (value && field.validationRules) {
        if (field.type === 'text' && field.validationRules.minLength && value.length < field.validationRules.minLength) {
          errors[field.id] = `حداقل ${field.validationRules.minLength} کاراکتر وارد کنید`;
          isValid = false;
        }
        
        if (field.type === 'text' && field.validationRules.maxLength && value.length > field.validationRules.maxLength) {
          errors[field.id] = `حداکثر ${field.validationRules.maxLength} کاراکتر مجاز است`;
          isValid = false;
        }
        
        if (field.type === 'number' && field.validationRules.minValue && value < field.validationRules.minValue) {
          errors[field.id] = `حداقل مقدار مجاز ${field.validationRules.minValue} است`;
          isValid = false;
        }
        
        if (field.type === 'number' && field.validationRules.maxValue && value > field.validationRules.maxValue) {
          errors[field.id] = `حداکثر مقدار مجاز ${field.validationRules.maxValue} است`;
          isValid = false;
        }
        
        if (field.validationRules.pattern && !new RegExp(field.validationRules.pattern).test(value)) {
          errors[field.id] = 'فرمت وارد شده صحیح نیست';
          isValid = false;
        }
      }
    });
    
    setFormErrors(errors);
    return isValid;
  };
  
  // ارسال فرم
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm() && onSubmit) {
      onSubmit(formValues);
    }
  };
  
  // رندر فیلد بر اساس نوع
  const renderField = (field: CustomField) => {
    // Get the current form value, but don't use field.defaultValue as fallback since it may contain metadata
    const value = formValues[field.id] !== undefined ? formValues[field.id] : '';
    const error = !!formErrors[field.id];
    const helperText = formErrors[field.id] || '';
    
    // Extract Smart Field metadata if available
    const getSmartFieldMetadata = () => {
      try {
        if (typeof field.defaultValue === 'string' && field.defaultValue) {
          const metadata = JSON.parse(field.defaultValue);
          // Check if this is the new Smart Field format with finalSettings
          if (metadata && metadata.finalSettings) {
            return metadata;
          }
          // Check if this is the old enhancement-only format
          if (metadata && typeof metadata === 'object' && !metadata.finalSettings) {
            return { enhancements: metadata, finalSettings: {} };
          }
        }
      } catch (e) {
        // If parsing fails, return empty metadata
      }
      return { enhancements: {}, finalSettings: {} };
    };
    
    const smartFieldMetadata = getSmartFieldMetadata();
    const finalSettings = smartFieldMetadata.finalSettings || {};
    
    // Use Smart Field Final Settings for display properties
    const displayName = finalSettings.name || field.name;
    const placeholder = finalSettings.placeholder || undefined;
    const smartHelpText = finalSettings.helpText || undefined;
    const fieldHelperText = error ? helperText : (smartHelpText || '');
    
    // Check for composite field enhancement
    const isCompositeField = () => {
      return smartFieldMetadata.enhancements && smartFieldMetadata.enhancements.composite;
    };

    const isMultilineField = () => {
      return smartFieldMetadata.enhancements && smartFieldMetadata.enhancements.multiline;
    };

    switch (field.type) {
      case 'text':
        // Handle composite fields
        if (isCompositeField()) {
          const compositeConfig = smartFieldMetadata.enhancements.composite;
          const compositeValue = Array.isArray(value) ? value : [];
          
          return (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {displayName}
                {field.isRequired && <span style={{ color: 'red' }}> *</span>}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                {compositeConfig.parts.map((part: any, index: number) => {
                  const partValue = compositeValue[index] || '';
                  const partProps = {
                    key: part.id,
                    size: 'small' as const,
                    sx: { minWidth: 120, flex: 1 },
                    value: partValue,
                    onChange: (e: any) => {
                      const newValues = Array.isArray(value) ? [...value] : [];
                      newValues[index] = e.target.value;
                      handleChange(field.id, newValues);
                    }
                  };
                  
                  return (
                    <React.Fragment key={part.id}>
                      {part.type === 'select' && part.options && part.options.length > 0 ? (
                        <FormControl sx={{ minWidth: 120, flex: 1 }}>
                          <InputLabel size="small">{part.label}</InputLabel>
                          <Select
                            {...partProps}
                            label={part.label}
                            size="small"
                            disabled={readOnly}
                          >
                            {part.options.map((option: string) => (
                              <MenuItem key={option} value={option}>
                                {option && typeof option === 'string' ? option : String(option)}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <TextField
                          {...partProps}
                          label={part.label}
                          placeholder={part.label}
                          required={part.required}
                          disabled={readOnly}
                        />
                      )}
                      
                      {/* Display separator between fields (but not after the last one) */}
                      {index < compositeConfig.parts.length - 1 && compositeConfig.separator && (
                        <Typography 
                          variant="body1" 
                          color="text.secondary"
                          sx={{ 
                            px: 0.5,
                            fontSize: '1rem',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            minWidth: 'auto'
                          }}
                        >
                          {compositeConfig.separator}
                        </Typography>
                      )}
                    </React.Fragment>
                  );
                })}
              </Box>
              {/* Optional: Show separator info only if no parts exist yet */}
              {compositeConfig.parts.length === 0 && compositeConfig.separator && (
                <Typography variant="caption" color="text.secondary">
                  جداکننده: "{compositeConfig.separator}"
                </Typography>
              )}
              {fieldHelperText && (
                <FormHelperText error={error}>{fieldHelperText}</FormHelperText>
              )}
            </Box>
          );
        }
        
        // Handle multiline fields
        if (isMultilineField()) {
          return (
            <TextField
              label={displayName}
              value={value}
              onChange={(e) => handleChange(field.id, e.target.value)}
              fullWidth
              multiline
              rows={4}
              required={field.isRequired}
              error={error}
              helperText={fieldHelperText}
              placeholder={placeholder}
              disabled={readOnly}
              sx={{ direction: 'rtl' }}
            />
          );
        }
        
        // Default text field
        return (
          <TextField
            label={displayName}
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            fullWidth
            required={field.isRequired}
            error={error}
            helperText={fieldHelperText}
            placeholder={placeholder}
            disabled={readOnly}
            sx={{ direction: 'rtl' }}
          />
        );
        
      case 'number':
        return (
          <TextField
            label={displayName}
            type="number"
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value === '' ? '' : Number(e.target.value))}
            fullWidth
            required={field.isRequired}
            error={error}
            helperText={fieldHelperText}
            placeholder={placeholder}
            disabled={readOnly}
            InputProps={{
              endAdornment: field.unit && (
                <InputAdornment position="end">
                  {field.unit}
                </InputAdornment>
              )
            }}
          />
        );
        
      case 'date':
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={faIR}>
            <DatePicker
              label={displayName}
              value={value || null}
              onChange={(newValue) => handleChange(field.id, newValue)}
              renderInput={(params) => <TextField {...params} fullWidth helperText={fieldHelperText} />}
            />
          </LocalizationProvider>
        );
        
      case 'select':
        // ویژگی خاص برای فیلد آواتار
        if (field.id === 'af-avatar' && field.options) {
          return (
            <FormControl 
              fullWidth 
              required={field.isRequired}
              error={error}
              disabled={readOnly}
            >
              <InputLabel id={`select-label-${field.id}`}>{displayName}</InputLabel>
              <Select
                labelId={`select-label-${field.id}`}
                value={value || ''}
                label={displayName}
                onChange={(e) => handleChange(field.id, e.target.value)}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {selected && (
                      <img 
                        src={`/src/assets/avatars/${selected}`} 
                        alt="Avatar" 
                        style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <Typography>{selected || 'انتخاب آواتار'}</Typography>
                  </Box>
                )}
              >
                {field.options.map((option) => (
                  <MenuItem key={option} value={option}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <img 
                        src={`/src/assets/avatars/${option}`} 
                        alt={option} 
                        style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <Typography>{option.replace('.png', '').replace('.svg', '')}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {error && <FormHelperText>{fieldHelperText}</FormHelperText>}
            </FormControl>
          );
        }
        
        // حالت عادی فیلد select
        return (
          <FormControl 
            fullWidth 
            required={field.isRequired}
            error={error}
            disabled={readOnly}
          >
            <InputLabel id={`select-label-${field.id}`}>{displayName}</InputLabel>
            <Select
              labelId={`select-label-${field.id}`}
              value={value !== undefined && value !== null ? value : ''}
              label={displayName}
              onChange={(e) => handleChange(field.id, e.target.value)}
            >
              {field.options?.map((option) => (
                <MenuItem 
                  key={option} 
                  value={option}
                >
                  {option && typeof option === 'string' ? option : String(option)}
                </MenuItem>
              ))}
            </Select>
            {fieldHelperText && <FormHelperText error={error}>{fieldHelperText}</FormHelperText>}
          </FormControl>
        );
        
      case 'multiselect':
        return (
          <FormControl 
            fullWidth 
            required={field.isRequired}
            error={error}
            disabled={readOnly}
          >
            <InputLabel id={`multiselect-label-${field.id}`}>{displayName}</InputLabel>
            <Select
              labelId={`multiselect-label-${field.id}`}
              multiple
              value={Array.isArray(value) ? value : []}
              onChange={(e) => handleChange(field.id, e.target.value)}
              input={<OutlinedInput label={displayName} />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {field.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option && typeof option === 'string' ? option : String(option)}
                </MenuItem>
              ))}
            </Select>
            {fieldHelperText && <FormHelperText error={error}>{fieldHelperText}</FormHelperText>}
          </FormControl>
        );
        
      case 'boolean':
        return (
          <FormControl 
            fullWidth 
            required={field.isRequired}
            error={error}
            disabled={readOnly}
            component="fieldset"
            variant="outlined"
            sx={{ p: 2, borderRadius: 1 }}
          >
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!value}
                    onChange={(e) => handleChange(field.id, e.target.checked)}
                  />
                }
                label={displayName}
              />
            </FormGroup>
            {fieldHelperText && <FormHelperText error={error}>{fieldHelperText}</FormHelperText>}
          </FormControl>
        );
        
      case 'email':
        return (
          <TextField
            label={displayName}
            type="email"
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            fullWidth
            required={field.isRequired}
            error={error}
            helperText={fieldHelperText}
            placeholder={placeholder}
            disabled={readOnly}
            sx={{ direction: 'rtl' }}
          />
        );
        
      case 'password':
        return (
          <TextField
            label={displayName}
            type="password"
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            fullWidth
            required={field.isRequired}
            error={error}
            helperText={fieldHelperText}
            placeholder={placeholder}
            disabled={readOnly}
            sx={{ direction: 'rtl' }}
          />
        );
        
      case 'textarea':
        return (
          <TextField
            label={displayName}
            multiline
            rows={4}
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            fullWidth
            required={field.isRequired}
            error={error}
            helperText={fieldHelperText}
            placeholder={placeholder}
            disabled={readOnly}
            sx={{ direction: 'rtl' }}
          />
        );
        
      case 'phone':
        return (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {displayName}
              {field.isRequired && <span style={{ color: 'red' }}> *</span>}
            </Typography>
            {(value || []).map((phone: string, index: number) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  label={`شماره ${index + 1}`}
                  value={phone}
                  onChange={(e) => {
                    const newPhones = [...(value || [])];
                    newPhones[index] = e.target.value;
                    handleChange(field.id, newPhones);
                  }}
                  fullWidth
                  disabled={readOnly}
                  placeholder="مثال: 09123456789"
                />
                {!readOnly && (value || []).length > 1 && (
                  <IconButton
                    onClick={() => {
                      const newPhones = [...(value || [])];
                      newPhones.splice(index, 1);
                      handleChange(field.id, newPhones);
                    }}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))}
            {!readOnly && (
              <Button
                startIcon={<AddIcon />}
                onClick={() => {
                  const newPhones = [...(value || []), ''];
                  handleChange(field.id, newPhones);
                }}
                variant="outlined"
                size="small"
              >
                افزودن شماره
              </Button>
            )}
            {error && (
              <FormHelperText error>{helperText}</FormHelperText>
            )}
          </Box>
        );
        
      case 'social':
        return (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {displayName}
              {field.isRequired && <span style={{ color: 'red' }}> *</span>}
            </Typography>
            {(value || []).map((social: { platform: string; username: string }, index: number) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>پلتفرم</InputLabel>
                  <Select
                    value={social?.platform || ''}
                    onChange={(e) => {
                      const newSocials = [...(value || [])];
                      newSocials[index] = { ...newSocials[index], platform: e.target.value };
                      handleChange(field.id, newSocials);
                    }}
                    disabled={readOnly}
                    label="پلتفرم"
                  >
                    <MenuItem value="telegram">تلگرام</MenuItem>
                    <MenuItem value="whatsapp">واتساپ</MenuItem>
                    <MenuItem value="instagram">اینستاگرام</MenuItem>
                    <MenuItem value="twitter">توییتر</MenuItem>
                    <MenuItem value="linkedin">لینکدین</MenuItem>
                    <MenuItem value="eitaa">ایتا</MenuItem>
                    <MenuItem value="soroush">سروش</MenuItem>
                    <MenuItem value="bale">بله</MenuItem>
                    <MenuItem value="igap">آی گپ</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="نام کاربری"
                  value={social?.username || ''}
                  onChange={(e) => {
                    const newSocials = [...(value || [])];
                    newSocials[index] = { ...newSocials[index], username: e.target.value };
                    handleChange(field.id, newSocials);
                  }}
                  fullWidth
                  disabled={readOnly}
                  placeholder="مثال: @username"
                />
                {!readOnly && (value || []).length > 1 && (
                  <IconButton
                    onClick={() => {
                      const newSocials = [...(value || [])];
                      newSocials.splice(index, 1);
                      handleChange(field.id, newSocials);
                    }}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))}
            {!readOnly && (
              <Button
                startIcon={<AddIcon />}
                onClick={() => {
                  const newSocials = [...(value || []), { platform: '', username: '' }];
                  handleChange(field.id, newSocials);
                }}
                variant="outlined"
                size="small"
              >
                افزودن شبکه اجتماعی
              </Button>
            )}
            {error && (
              <FormHelperText error>{helperText}</FormHelperText>
            )}
          </Box>
        );
        
      case 'file':
        return (
          <Box sx={{ mb: 2 }}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<FileUploadIcon />}
              sx={{ mb: 1 }}
              disabled={readOnly}
            >
              {`انتخاب ${displayName}`}
              <input
                type="file"
                hidden
                onChange={(e) => handleChange(field.id, e.target.files?.[0] || null)}
                disabled={readOnly}
              />
            </Button>
            {value && (
              <Typography variant="body2">
                فایل انتخاب شده: {typeof value === 'string' ? value : value.name}
              </Typography>
            )}
            {fieldHelperText && (
              <FormHelperText error={error}>{fieldHelperText}</FormHelperText>
            )}
          </Box>
        );
        
      // Enhanced field types
      case ENHANCED_FIELD_TYPES.TEXT_ENGLISH:
      case 'text-english':
        return (
          <EnglishTextFieldComponent
            value={value || ''}
            onChange={(newValue) => handleChange(field.id, newValue)}
            label={displayName}
            required={field.isRequired}
            error={error ? fieldHelperText : undefined}
            placeholder={placeholder || `${displayName} را به انگلیسی وارد کنید`}
          />
        );

      case ENHANCED_FIELD_TYPES.TEXT_NUMERIC:
      case 'text-numeric':
        return (
          <NumericTextFieldComponent
            value={value || ''}
            onChange={(newValue) => handleChange(field.id, newValue)}
            label={displayName}
            required={field.isRequired}
            error={error ? fieldHelperText : undefined}
            placeholder={placeholder || `${displayName} را وارد کنید`}
            minLength={field.validationRules?.minLength}
            maxLength={field.validationRules?.maxLength}
          />
        );

      case ENHANCED_FIELD_TYPES.CONDITIONAL_NATIONAL_ID:
      case 'conditional-national-id':
        // Find nationality field value
        const nationalityField = fields.find(f => f.type === 'select' && (f.name.includes('تابعیت') || f.name.includes('ملیت') || f.englishName.toLowerCase().includes('nationality')));
        const nationalityValue = nationalityField ? formValues[nationalityField.id] : '';
        return (
          <ConditionalNationalIdComponent
            nationalityValue={nationalityValue}
            idValue={value || ''}
            onIdChange={(newValue) => handleChange(field.id, newValue)}
            label={displayName}
            required={field.isRequired}
            error={error ? fieldHelperText : undefined}
          />
        );

      case ENHANCED_FIELD_TYPES.PHONE_ARRAY:
      case 'phone-array':
        // Fallback to legacy component
        return (
          <PhoneArrayFieldComponent
            value={value || []}
            onChange={(phones: any) => handleChange(field.id, phones)}
            label={displayName}
            required={field.isRequired}
            error={error ? fieldHelperText : undefined}
            minItems={field.minItems || 1}
            maxItems={field.maxItems || 5}
          />
        );

      case ENHANCED_FIELD_TYPES.ADDRESS_ARRAY:
      case 'address-array':
        // Fallback to legacy component
        return (
          <HierarchicalAddressComponent
            value={value || []}
            onChange={(addresses: any) => handleChange(field.id, addresses)}
            label={displayName}
            required={field.isRequired}
            error={error ? fieldHelperText : undefined}
            minItems={field.minItems || 0}
            maxItems={field.maxItems || 3}
            rootCategory={field.hierarchicalCategory || 'geographical'}
            levels={['استان', 'شهر', 'منطقه']}
            allowFreeText={field.allowFreeText !== false}
          />
        );

      case ENHANCED_FIELD_TYPES.HIERARCHICAL_ADDRESS:
      case 'hierarchical-address':
        // Fallback to legacy component
        return (
          <HierarchicalAddressComponent
            value={value ? [value] : []}
            onChange={(addresses: any) => handleChange(field.id, addresses[0] || null)}
            label={displayName}
            required={field.isRequired}
            error={error ? fieldHelperText : undefined}
            minItems={field.isRequired ? 1 : 0}
            maxItems={1}
            rootCategory={field.hierarchicalCategory || 'geographical'}
            levels={['استان', 'شهر', 'منطقه']}
            allowFreeText={field.allowFreeText !== false}
          />
        );

      case ENHANCED_FIELD_TYPES.NAME_SPLIT:
      case 'name-split':
        // Fallback to legacy component
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {displayName} (تفکیک نام - در حال توسعه)
              {field.isRequired && <span style={{ color: 'red' }}> *</span>}
            </Typography>
            <Alert severity="info">
              این نوع فیلد در حال توسعه است و به زودی قابل استفاده خواهد بود.
            </Alert>
          </Box>
        );

      case ENHANCED_FIELD_TYPES.FULL_NAME_DUAL:
      case 'full-name-dual':
        // Fallback to legacy component
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {displayName} (نام دوزبانه - در حال توسعه)
              {field.isRequired && <span style={{ color: 'red' }}> *</span>}
            </Typography>
            <Alert severity="info">
              این نوع فیلد در حال توسعه است و به زودی قابل استفاده خواهد بود.
            </Alert>
          </Box>
        );

      case 'reference':
        return (
          <ReferenceFieldRenderer
            field={field}
            value={value}
            onChange={(newValue) => handleChange(field.id, newValue)}
            error={error ? helperText : undefined}
            disabled={readOnly}
            fullWidth
          />
        );
        
      default:
        return <Typography>نوع فیلد پشتیبانی نمی‌شود</Typography>;
    }
  };
  
  return (
    <Paper 
      sx={{ 
        p: 2, 
        borderRadius: 2,
        boxShadow: (theme) => `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
        overflow: 'hidden'
      }}
    >
      {/* عنوان و توضیحات */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PreviewIcon color="primary" />
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {title}
              {nodeName && ` - ${nodeName}`}
            </Typography>
            {description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {description}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* فرم پیش‌نمایش */}
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {fields.length === 0 ? (
            <Grid item xs={12}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  borderRadius: 1,
                  bgcolor: (theme) => alpha(theme.palette.info.main, 0.05)
                }}
              >
                <Typography color="text.secondary">
                  هیچ فیلدی برای نمایش وجود ندارد. ابتدا فیلدهای مورد نیاز را تعریف کنید.
                </Typography>
              </Paper>
            </Grid>
          ) : (
            [...fields].sort((a, b) => a.order - b.order)
              .map((field) => (
                <Grid item xs={12} sm={6} key={field.id}>
                  {renderField(field)}
                </Grid>
              ))
          )}
          
          {fields.length > 0 && !readOnly && onSubmit && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                >
                  ثبت اطلاعات
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      </form>
    </Paper>
  );
};

export default FieldPreview;
