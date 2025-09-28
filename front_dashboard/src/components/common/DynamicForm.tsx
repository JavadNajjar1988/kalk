import React, { useMemo, useState } from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  FormHelperText,
  Typography,
  Box,
  Chip,
  OutlinedInput,
  Button,
  Stack,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Autocomplete,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  DateRange as DateIcon,
  AccountTree as TreeIcon,
  Refresh as RefreshIcon,
  Link as LinkIcon,
  Warning as WarningIcon,
  DataObject as DataObjectIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { faIR } from 'date-fns/locale';
import type { TabDefinition, FieldDefinition } from '@/hooks/useDefinitionData';
import { useReferenceFieldOptions } from '@/hooks/useDefinitionData';
import { useReferenceData } from '@/hooks/useReferenceData';
import HierarchicalSelector from './HierarchicalSelector';

// Import enhanced field components
import {
  EnglishTextFieldComponent,
  NumericTextFieldComponent,
  ConditionalNationalIdComponent,
  NameSplitFieldComponent,
  FullNameDualFieldComponent
} from '@/modules/definition-editor/components/forms/EnhancedFieldComponents';
import PhoneArrayFieldComponent from '@/modules/definition-editor/components/forms/PhoneArrayField';
import HierarchicalAddressComponent from '@/modules/definition-editor/components/forms/HierarchicalAddressField';

// Removed legacy imports

// Import enhanced field types
import { ENHANCED_FIELD_TYPES } from '@/modules/definition-editor/types/enhancedFields';
import type { PhoneEntry, HierarchicalAddress } from '@/modules/definition-editor/types/enhancedFields';

interface DynamicFormProps {
  tab: TabDefinition;
  data: Record<string, any>;
  errors: Record<string, string>;
  onChange: (fieldId: string, value: any) => void;
  categoryType?: 'users' | 'resources'; // برای تشخیص نوع hierarchical selector
}

const DynamicForm: React.FC<DynamicFormProps> = ({ tab, data, errors, onChange, categoryType }) => {
  // Sort fields by order
  const sortedFields = [...tab.fields].sort((a, b) => a.order - b.order);

  // تشخیص اینکه آیا این تب برای اطلاعات حقوقی است
  const isLegalInformationTab = useMemo(() => {
    const tabNameLower = tab.name.toLowerCase();
    const tabIdLower = tab.id.toLowerCase();
    return tabNameLower.includes('حقوقی') || 
           tabNameLower.includes('legal') ||
           tabIdLower.includes('legal') ||
           tab.id === 'pr-2-3' || // Users legal info
           tab.id === 'pr-1-2';   // Resources legal info
  }, [tab.name, tab.id]);

  // تشخیص categoryType بر اساس ID تب
  const determineCategoryType = useMemo((): 'users' | 'resources' | undefined => {
    if (categoryType) return categoryType;
    
    // اگر categoryType مشخص نیست، بر اساس ID تب تشخیص دهیم
    if (tab.id === 'pr-2-3') return 'users';
    if (tab.id === 'pr-1-2') return 'resources';
    
    // بررسی بر اساس نام تب
    const tabNameLower = tab.name.toLowerCase();
    if (tabNameLower.includes('کاربر') || tabNameLower.includes('user')) return 'users';
    if (tabNameLower.includes('منابع') || tabNameLower.includes('resource')) return 'resources';
    
    return undefined;
  }, [categoryType, tab.id, tab.name]);

  // Debug log پس از تعریف متغیرها
  console.log('DynamicForm render:', { 
    tabId: tab.id, 
    tabName: tab.name, 
    data, 
    errors, 
    fieldsCount: tab.fields.length, 
    categoryType,
    isLegalInformationTab,
    determineCategoryType
  });

  const renderField = (field: FieldDefinition, isHierarchicalField: boolean = false) => {
    // Get the current value directly from data, don't override with defaults
    const value = data[field.id];
    const error = errors[field.id];
    const hasError = !!error;
    
    // Type assertion for enhanced fields
    const enhancedField = field as any;
    
    // Check if field has composite enhancement configuration stored in defaultValue
    const isCompositeField = () => {
      try {
        if (typeof enhancedField.defaultValue === 'string' && enhancedField.defaultValue) {
          const enhancementConfig = JSON.parse(enhancedField.defaultValue);
          return enhancementConfig && enhancementConfig.composite;
        }
      } catch (e) {
        // Not JSON, not a composite field
      }
      return false;
    };
    
    console.log(`Rendering field ${field.id}, type: ${field.type}, current value:`, value, 'type:', typeof value, 'isHierarchical:', isHierarchicalField, 'isComposite:', isCompositeField(), 'defaultValue:', enhancedField.defaultValue);

    const commonProps = {
      fullWidth: true,
      label: field.name,
      error: hasError,
      helperText: error,
      required: field.isRequired,
    };

    switch (field.type as any) {
      // Handle composite fields (created by Smart Field Builder)
      case 'text':
        // Check if this is actually a composite field
        if (isCompositeField()) {
          try {
            const enhancementConfig = JSON.parse(enhancedField.defaultValue);
            const compositeConfig = enhancementConfig.composite;
            
            if (compositeConfig && compositeConfig.parts) {
              return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {field.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    {compositeConfig.parts.map((part: any, index: number) => {
                      const partValue = Array.isArray(value) ? value[index] : (value && value[part.id]) || '';
                      const partProps = {
                        key: part.id,
                        size: 'small' as const,
                        sx: { minWidth: 120, flex: 1 },
                        value: partValue,
                        onChange: (e: any) => {
                          let newValues;
                          if (Array.isArray(value)) {
                            newValues = [...value];
                            newValues[index] = e.target.value;
                          } else {
                            newValues = { ...value };
                            newValues[part.id] = e.target.value;
                          }
                          onChange(field.id, newValues);
                        }
                      };
                      
                      return (
                        <React.Fragment key={part.id}>
                          {part.type === 'select' && part.options ? (
                            <FormControl sx={{ minWidth: 120, flex: 1 }}>
                              <InputLabel size="small">{part.label}</InputLabel>
                              <Select
                                {...partProps}
                                label={part.label}
                                size="small"
                              >
                                {part.options.map((option: string) => (
                                  <MenuItem key={option} value={option}>
                                    {option}
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
                </Box>
              );
            }
          } catch (e) {
            console.error('Error parsing composite field config:', e);
          }
        }
        
        // Regular text field
        return (
          <TextField
            {...commonProps}
            type={field.type}
            value={value || ''} // Ensure we always have a string
            onChange={(e) => {
              console.log('Text field change:', field.id, e.target.value); // Debug log
              onChange(field.id, e.target.value);
            }}
            placeholder={`${field.name} را وارد کنید`}
            sx={{
              '& .MuiInputBase-root': {
                pointerEvents: 'auto'
              }
            }}
          />
        );

      // Enhanced field types for personnel
      case ENHANCED_FIELD_TYPES.TEXT_ENGLISH:
      case 'text-english':
        return (
          <EnglishTextFieldComponent
            value={value || ''}
            onChange={(newValue) => onChange(field.id, newValue)}
            label={field.name}
            required={field.isRequired}
            error={error}
            placeholder={`${field.name} را به انگلیسی وارد کنید`}
          />
        );

      case ENHANCED_FIELD_TYPES.TEXT_NUMERIC:
      case 'text-numeric':
        return (
          <NumericTextFieldComponent
            value={value || ''}
            onChange={(newValue) => onChange(field.id, newValue)}
            label={field.name}
            required={field.isRequired}
            error={error}
            placeholder={`${field.name} را وارد کنید`}
            minLength={enhancedField.validation?.minLength}
            maxLength={enhancedField.validation?.maxLength}
          />
        );

      case ENHANCED_FIELD_TYPES.CONDITIONAL_NATIONAL_ID:
      case 'conditional-national-id':
        const nationalityField = enhancedField.conditionalOn?.field;
        const nationalityValue = nationalityField ? data[nationalityField] : '';
        return (
          <ConditionalNationalIdComponent
            nationalityValue={nationalityValue}
            idValue={value || ''}
            onIdChange={(newValue) => onChange(field.id, newValue)}
            label={field.name}
            required={field.isRequired}
            error={error}
          />
        );

      case ENHANCED_FIELD_TYPES.PHONE_ARRAY:
      case 'phone-array':
        return (
          <PhoneArrayFieldComponent
            value={value || []}
            onChange={(phones) => onChange(field.id, phones)}
            label={field.name}
            required={field.isRequired}
            error={error}
            minItems={enhancedField.arrayConfig?.minItems || 1}
            maxItems={enhancedField.arrayConfig?.maxItems || 5}
          />
        );

      case ENHANCED_FIELD_TYPES.ADDRESS_ARRAY:
      case 'address-array':
        return (
          <HierarchicalAddressComponent
            value={value || []}
            onChange={(addresses) => onChange(field.id, addresses)}
            label={field.name}
            required={field.isRequired}
            error={error}
            minItems={enhancedField.arrayConfig?.minItems || 0}
            maxItems={enhancedField.arrayConfig?.maxItems || 3}
            rootCategory={enhancedField.hierarchicalConfig?.rootCategory || 'geographical'}
            levels={enhancedField.hierarchicalConfig?.levels || ['استان', 'شهر', 'منطقه']}
            allowFreeText={enhancedField.hierarchicalConfig?.allowFreeText !== false}
          />
        );

      case ENHANCED_FIELD_TYPES.HIERARCHICAL_ADDRESS:
      case 'hierarchical-address':
        // Check if this is a Field Constructor field
        if (UniversalFieldAdapter.isEnhancedField(field as any)) {
          const constructorConfig = UniversalFieldAdapter.normalize(field as any);
          return (
            <HierarchicalInputComponent
              config={constructorConfig}
              value={value || null}
              onChange={(newValue) => onChange(field.id, newValue)}
              error={error}
              disabled={false}
            />
          );
        }
        
        // Fallback to legacy component
        return (
          <HierarchicalAddressComponent
            value={value ? [value] : []}
            onChange={(addresses) => onChange(field.id, addresses[0] || null)}
            label={field.name}
            required={field.isRequired}
            error={error}
            minItems={field.isRequired ? 1 : 0}
            maxItems={1}
            rootCategory={enhancedField.hierarchicalConfig?.rootCategory || 'geographical'}
            levels={enhancedField.hierarchicalConfig?.levels || ['استان', 'شهر', 'منطقه']}
            allowFreeText={enhancedField.hierarchicalConfig?.allowFreeText !== false}
          />
        );

      case ENHANCED_FIELD_TYPES.NAME_SPLIT:
      case 'name-split':
        // Check if this is a Field Constructor field
        if (UniversalFieldAdapter.isEnhancedField(field as any)) {
          const constructorConfig = UniversalFieldAdapter.normalize(field as any);
          return (
            <CompositeInputComponent
              config={constructorConfig}
              value={value || {}}
              onChange={(newValue) => onChange(field.id, newValue)}
              error={error}
              disabled={false}
            />
          );
        }
        
        // Fallback to legacy component
        return (
          <NameSplitFieldComponent
            firstNameValue={value?.firstName || ''}
            lastNameValue={value?.lastName || ''}
            onFirstNameChange={(firstName) => onChange(field.id, { ...value, firstName })}
            onLastNameChange={(lastName) => onChange(field.id, { ...value, lastName })}
            required={field.isRequired}
            errors={{
              firstName: (error as any)?.firstName,
              lastName: (error as any)?.lastName
            }}
          />
        );

      case ENHANCED_FIELD_TYPES.FULL_NAME_DUAL:
      case 'full-name-dual':
        // Check if this is a Field Constructor field
        if (UniversalFieldAdapter.isEnhancedField(field as any)) {
          const constructorConfig = UniversalFieldAdapter.normalize(field as any);
          return (
            <CompositeInputComponent
              config={constructorConfig}
              value={value || {}}
              onChange={(newValue) => onChange(field.id, newValue)}
              error={error}
              disabled={false}
            />
          );
        }
        
        // Fallback to legacy component
        return (
          <FullNameDualFieldComponent
            firstNameFa={value?.firstNameFa || ''}
            lastNameFa={value?.lastNameFa || ''}
            firstNameEn={value?.firstNameEn || ''}
            lastNameEn={value?.lastNameEn || ''}
            onFirstNameFaChange={(firstNameFa) => onChange(field.id, { ...value, firstNameFa })}
            onLastNameFaChange={(lastNameFa) => onChange(field.id, { ...value, lastNameFa })}
            onFirstNameEnChange={(firstNameEn) => onChange(field.id, { ...value, firstNameEn })}
            onLastNameEnChange={(lastNameEn) => onChange(field.id, { ...value, lastNameEn })}
            required={field.isRequired}
            errors={{
              firstNameFa: (error as any)?.firstNameFa,
              lastNameFa: (error as any)?.lastNameFa,
              firstNameEn: (error as any)?.firstNameEn,
              lastNameEn: (error as any)?.lastNameEn
            }}
          />
        );

      // Standard field types
      case 'text':
      case 'email':
      case 'password':
        return (
          <TextField
            {...commonProps}
            type={field.type}
            value={value || ''} // Ensure we always have a string
            onChange={(e) => {
              console.log('Text field change:', field.id, e.target.value); // Debug log
              onChange(field.id, e.target.value);
            }}
            placeholder={`${field.name} را وارد کنید`}
            sx={{
              '& .MuiInputBase-root': {
                pointerEvents: 'auto'
              }
            }}
          />
        );

      case 'textarea':
        return (
          <TextField
            {...commonProps}
            multiline
            rows={3}
            value={value || ''}
            onChange={(e) => {
              console.log('Textarea field change:', field.id, e.target.value);
              onChange(field.id, e.target.value);
            }}
            placeholder={`${field.name} را وارد کنید`}
          />
        );

      case 'number':
        return (
          <TextField
            {...commonProps}
            type="number"
            value={value || ''}
            onChange={(e) => {
              console.log('Number field change:', field.id, e.target.value);
              onChange(field.id, e.target.value ? Number(e.target.value) : '');
            }}
            placeholder={`${field.name} را وارد کنید`}
            inputProps={{
              min: field.validationRules?.minValue,
              max: field.validationRules?.maxValue,
            }}
          />
        );

      case 'date':
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={faIR}>
            <DatePicker
              label={field.name}
              value={value && value !== '' ? new Date(value) : null}
              onChange={(newValue: Date | null) => {
                try {
                  if (newValue && !isNaN(newValue.getTime())) {
                    onChange(field.id, newValue.toISOString());
                  } else {
                    onChange(field.id, '');
                  }
                } catch (error) {
                  console.error('Date field error:', error);
                  onChange(field.id, '');
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label={field.name}
                  error={hasError}
                  helperText={error}
                  required={field.isRequired}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <InputAdornment position="end">
                        <DateIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
          </LocalizationProvider>
        );

      case 'select':
        return (
          <FormControl fullWidth error={hasError} required={field.isRequired}>
            <InputLabel>{field.name}</InputLabel>
            <Select
              value={value || ''} // Ensure we always have a value
              onChange={(e) => {
                console.log('Select field change:', field.id, e.target.value);
                onChange(field.id, e.target.value);
              }}
              label={field.name}
              sx={{
                '& .MuiSelect-select': {
                  pointerEvents: 'auto'
                }
              }}
            >
              {field.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
            {hasError && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        );

      case 'multiselect':
        return (
          <FormControl fullWidth error={hasError} required={field.isRequired}>
            <InputLabel>{field.name}</InputLabel>
            <Select
              multiple
              value={Array.isArray(value) ? value : []}
              onChange={(e) => {
                console.log('Multiselect field change:', field.id, e.target.value);
                onChange(field.id, e.target.value);
              }}
              input={<OutlinedInput label={field.name} />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((item) => (
                    <Chip key={item} label={item} size="small" />
                  ))}
                </Box>
              )}
            >
              {field.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
            {hasError && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        );

      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={!!value}
                onChange={(e) => onChange(field.id, e.target.checked)}
              />
            }
            label={field.name}
            sx={{ width: '100%' }}
          />
        );

      case 'phone':
        return <PhoneField field={field} value={value} onChange={onChange} error={error} />;

      case 'social':
        return <SocialField field={field} value={value} onChange={onChange} error={error} />;

      case 'reference':
        return <ReferenceField field={field} value={value} onChange={onChange} error={error} />;
        
      case 'file':
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {field.name} {field.isRequired && '*'}
            </Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ py: 2 }}
            >
              انتخاب فایل
              <input
                type="file"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onChange(field.id, file);
                  }
                }}
              />
            </Button>
            {value && (
              <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                فایل انتخاب شده: {value.name || value}
              </Typography>
            )}
            {hasError && (
              <FormHelperText error sx={{ mt: 1 }}>
                {error}
              </FormHelperText>
            )}
          </Box>
        );

      default:
        return (
          <TextField
            {...commonProps}
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={`${field.name} را وارد کنید`}
          />
        );
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
        {tab.name}
      </Typography>
      
      {isLegalInformationTab && sortedFields.length === 0 && determineCategoryType ? (
        <>
          <Box sx={{ border: '1px solid', borderColor: 'primary.main', borderRadius: 1, p: 2 }}>
            <HierarchicalSelector
              categoryType={determineCategoryType}
              value={data.hierarchicalPath || []}
              onChange={(path, finalNodeId) => {
                console.log('Hierarchical path changed:', { path, finalNodeId });
                onChange('hierarchicalPath', path);
                if (finalNodeId) {
                  onChange('finalNodeId', finalNodeId);
                }
              }}
              onFieldsChange={(fields) => {
                console.log('Hierarchical fields changed:', fields);
                // در اینجا می‌توانیم فیلدهای نهایی را به form اضافه کنیم
                onChange('hierarchicalFields', fields);
              }}
              error={errors.hierarchicalPath}
            />
          </Box>
          
          {/* اگر فیلدهای نهایی انتخاب شده، آنها را نمایش دهیم */}
          {data.hierarchicalFields && data.hierarchicalFields.length > 0 && (
            <>
              <Divider sx={{ my: 3 }}>
                <Chip label="فیلدهای نهایی" color="primary" variant="outlined" />
              </Divider>
              
              <Grid container spacing={2}>
                {data.hierarchicalFields.map((field: FieldDefinition) => (
                  <Grid item xs={12} sm={field.type === 'textarea' ? 12 : 6} key={field.id}>
                    {renderField(field, true)} {/* پارامتر دوم برای مشخص کردن فیلد hierarchical */}
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </>
      ) : isLegalInformationTab && sortedFields.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TreeIcon fontSize="small" />
            این تب برای انتخاب مسیر اطلاعات حقوقی طراحی شده است.
          </Box>
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {sortedFields.map((field) => (
            <Grid item xs={12} sm={field.type === 'textarea' ? 12 : 6} key={field.id}>
              {renderField(field)}
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

// Phone Field Component for handling multiple phone numbers
const PhoneField: React.FC<{
  field: FieldDefinition;
  value: string[];
  onChange: (fieldId: string, value: string[]) => void;
  error?: string;
}> = ({ field, value = [], onChange, error }) => {
  // Ensure we have at least one entry
  const phoneValues = value.length === 0 ? [''] : value;
  
  const addPhone = () => {
    onChange(field.id, [...phoneValues, '']);
  };

  const removePhone = (index: number) => {
    onChange(field.id, phoneValues.filter((_, i) => i !== index));
  };

  const updatePhone = (index: number, phoneValue: string) => {
    const newValue = [...phoneValues];
    newValue[index] = phoneValue;
    onChange(field.id, newValue);
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {field.name} {field.isRequired && '*'}
      </Typography>
      <Stack spacing={1}>
        {phoneValues.map((phone, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              value={phone}
              onChange={(e) => updatePhone(index, e.target.value)}
              placeholder="شماره تلفن را وارد کنید"
              error={!!error}
            />
            <IconButton
              color="error"
              onClick={() => removePhone(index)}
              disabled={phoneValues.length === 1 && field.isRequired}
            >
              <RemoveIcon />
            </IconButton>
          </Box>
        ))}
        <Button
          startIcon={<AddIcon />}
          onClick={addPhone}
          variant="outlined"
          size="small"
        >
          افزودن شماره تلفن
        </Button>
      </Stack>
      {error && (
        <FormHelperText error sx={{ mt: 1 }}>
          {error}
        </FormHelperText>
      )}
    </Box>
  );
};

// Social Field Component for handling multiple social networks
const SocialField: React.FC<{
  field: FieldDefinition;
  value: { platform: string; username: string }[];
  onChange: (fieldId: string, value: { platform: string; username: string }[]) => void;
  error?: string;
}> = ({ field, value = [], onChange, error }) => {
  // Ensure we have at least one entry
  const socialValues = value.length === 0 ? [{ platform: '', username: '' }] : value;
  
  const socialPlatforms = [
    'Instagram',
    'Twitter',
    'LinkedIn',
    'Facebook',
    'Telegram',
    'WhatsApp',
  ];

  const addSocial = () => {
    onChange(field.id, [...socialValues, { platform: '', username: '' }]);
  };

  const removeSocial = (index: number) => {
    onChange(field.id, socialValues.filter((_, i) => i !== index));
  };

  const updateSocial = (index: number, platform: string, username: string) => {
    const newValue = [...socialValues];
    newValue[index] = { platform, username };
    onChange(field.id, newValue);
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {field.name} {field.isRequired && '*'}
      </Typography>
      <Stack spacing={1}>
        {socialValues.map((social, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 1 }}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>پلتفرم</InputLabel>
              <Select
                value={social.platform}
                onChange={(e) => updateSocial(index, e.target.value, social.username)}
                label="پلتفرم"
                size="small"
              >
                {socialPlatforms.map((platform) => (
                  <MenuItem key={platform} value={platform}>
                    {platform}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              value={social.username}
              onChange={(e) => updateSocial(index, social.platform, e.target.value)}
              placeholder="نام کاربری"
              size="small"
              error={!!error}
            />
            <IconButton
              color="error"
              onClick={() => removeSocial(index)}
              size="small"
            >
              <RemoveIcon />
            </IconButton>
          </Box>
        ))}
        <Button
          startIcon={<AddIcon />}
          onClick={addSocial}
          variant="outlined"
          size="small"
        >
          افزودن شبکه اجتماعی
        </Button>
      </Stack>
      {error && (
        <FormHelperText error sx={{ mt: 1 }}>
          {error}
        </FormHelperText>
      )}
    </Box>
  );
};

// Reference Field Component for handling fields that reference other categories
const ReferenceField: React.FC<{
  field: FieldDefinition;
  value: any;
  onChange: (fieldId: string, value: any) => void;
  error?: string;
}> = ({ field, value, onChange, error }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Map referencePath to the correct sections format for useReferenceData
  const mapReferencePathToSections = (path?: string): 'hierarchy' | 'data' | 'both' => {
    if (!path) return 'both';
    
    switch (path.toLowerCase()) {
      case 'nodes':
        return 'data'; // nodes contain actual data items
      case 'levels':
        return 'hierarchy'; // levels contain hierarchy definitions
      case 'both':
        return 'both';
      default:
        return 'data'; // default to data for most cases
    }
  };
  
  // Use the same hook as definition editor for rich display
  const {
    data: referenceData,
    loading,
    error: referenceError,
    refresh,
    searchItems,
    getItemById,
    isReady
  } = useReferenceData(
    field.referenceCategory, 
    mapReferencePathToSections(field.referencePath || field.referenceSections)
  );

  // Helper functions matching definition editor
  const getDisplayValue = (item: any | null): string => {
    if (!item) return '';
    return item.name || item.id;
  };

  const getValueField = (item: any): any => {
    return item.id;
  };

  const findItemByValue = (val: any): any | null => {
    if (!referenceData || !val) return null;
    return referenceData.items.find((item: any) => item.id === val) || null;
  };

  // Current selected item(s)
  const selectedItem = field.allowMultiple 
    ? (Array.isArray(value) ? value.map(findItemByValue).filter(Boolean) : [])
    : findItemByValue(value);

  // Filtered items list
  const filteredItems = searchTerm ? searchItems(searchTerm) : (referenceData?.items || []);

  // Handle selection change
  const handleSelectionChange = (newValue: any) => {
    if (field.allowMultiple) {
      if (Array.isArray(newValue)) {
        const values = newValue.map(item => getValueField(item));
        onChange(field.id, values);
      } else {
        onChange(field.id, []);
      }
    } else {
      if (newValue) {
        const fieldValue = getValueField(newValue);
        onChange(field.id, fieldValue);
      } else {
        onChange(field.id, null);
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          در حال بارگذاری {field.name}...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (referenceError || !field.referenceCategory) {
    return (
      <Alert severity="error" sx={{ borderRadius: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <WarningIcon fontSize="small" />
          <Typography variant="body2" fontWeight={600}>
            خطا در بارگذاری {field.name}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {referenceError || 'دسته‌بندی مرجع مشخص نشده است'}
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Tooltip title="تلاش مجدد">
            <IconButton size="small" onClick={refresh}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Alert>
    );
  }

  // Empty data state
  if (isReady && (!referenceData?.items || referenceData.items.length === 0)) {
    return (
      <Alert severity="info" sx={{ borderRadius: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <DataObjectIcon fontSize="small" />
          <Typography variant="body2" fontWeight={600}>
            {field.name}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          هیچ داده‌ای در دسته‌بندی "{referenceData?.name}" یافت نشد
        </Typography>
      </Alert>
    );
  }

  // Main field display
  return (
    <Box sx={{ width: '100%' }}>
      {/* Reference category information header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <LinkIcon fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            مرجع: {referenceData?.name}
          </Typography>
        </Box>
        
        {field.referencePath && (
          <Chip
            size="small"
            label={
              field.referencePath === 'nodes' ? 'داده‌ها' :
              field.referencePath === 'levels' ? 'سطوح سلسله مراتبی' :
              field.referencePath === 'both' ? 'هر دو بخش' :
              'داده‌ها' // default
            }
            color={
              field.referencePath === 'levels' ? 'success' :
              field.referencePath === 'nodes' ? 'info' :
              'primary'
            }
            variant="outlined"
          />
        )}
        
        {referenceData && (
          <Chip
            size="small"
            label={`${referenceData.items.length} مورد`}
            variant="outlined"
          />
        )}
        
        <Tooltip title="بروزرسانی داده‌ها">
          <IconButton size="small" onClick={refresh} disabled={loading}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Autocomplete field */}
      <Autocomplete
        multiple={field.allowMultiple}
        options={filteredItems}
        value={field.allowMultiple ? (Array.isArray(selectedItem) ? selectedItem : []) : (selectedItem || null)}
        onChange={(event, newValue) => handleSelectionChange(newValue)}
        getOptionLabel={(option) => getDisplayValue(option)}
        isOptionEqualToValue={(option, value) => {
          const optionValue = getValueField(option);
          const currentValue = getValueField(value);
          return optionValue === currentValue;
        }}
        loading={loading}
        disabled={false}
        fullWidth
        renderInput={(params) => (
          <TextField
            {...params}
            label={field.name}
            required={field.isRequired}
            error={!!error}
            helperText={error}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">
                  {getDisplayValue(option)}
                </Typography>
                {option.type && (
                  <Chip
                    size="small"
                    label={option.type === 'hierarchy' ? 'سطح' : 'داده'}
                    color={option.type === 'hierarchy' ? 'success' : 'info'}
                    variant="outlined"
                    sx={{ fontSize: '0.65rem', height: '18px' }}
                  />
                )}
              </Box>
              {option.englishName && option.englishName !== getDisplayValue(option) && (
                <Typography variant="caption" color="text.secondary">
                  {option.englishName}
                </Typography>
              )}
              {option.description && (
                <Typography variant="caption" color="text.secondary">
                  {option.description}
                </Typography>
              )}
              {/* Additional info based on type */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {option.level !== undefined && (
                  <Chip
                    size="small"
                    label={`سطح ${option.level}`}
                    variant="outlined"
                    sx={{ fontSize: '0.6rem', height: '16px' }}
                  />
                )}
                {option.order !== undefined && option.order !== option.level && (
                  <Chip
                    size="small"
                    label={`ترتیب ${option.order}`}
                    variant="outlined"
                    sx={{ fontSize: '0.6rem', height: '16px' }}
                  />
                )}
                {option.coordinates && (
                  <Chip
                    size="small"
                    label="📍 مختصات"
                    color="warning"
                    variant="outlined"
                    sx={{ fontSize: '0.6rem', height: '16px' }}
                  />
                )}
                {option.natoEquivalent && (
                  <Chip
                    size="small"
                    label={`NATO: ${option.natoEquivalent}`}
                    color="secondary"
                    variant="outlined"
                    sx={{ fontSize: '0.6rem', height: '16px' }}
                  />
                )}
              </Box>
            </Box>
            {/* Display ID value */}
            <Chip
              label={getValueField(option)}
              size="small"
              variant="outlined"
              color="primary"
              sx={{ ml: 1, fontSize: '0.7rem', height: '20px' }}
            />
          </Box>
        )}
        noOptionsText="هیچ گزینه‌ای یافت نشد"
        loadingText="در حال بارگذاری..."
      />

      {/* Display selected item(s) details */}
      {((field.allowMultiple && Array.isArray(selectedItem) && selectedItem.length > 0) || 
        (!field.allowMultiple && selectedItem)) && (
        <Box sx={{ mt: 1 }}>
          <Alert severity="success" sx={{ borderRadius: 1 }}>
            {field.allowMultiple && Array.isArray(selectedItem) ? (
              // Multi-select display
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <DataObjectIcon fontSize="small" />
                  <Typography variant="body2" fontWeight={600}>
                    انتخاب شده ({selectedItem.length} مورد):
                  </Typography>
                </Box>
                {selectedItem.map((item: any, index: number) => (
                  <Box key={index} sx={{ mb: index < selectedItem.length - 1 ? 1 : 0 }}>
                    <Typography variant="body2" fontWeight={500}>
                      {getDisplayValue(item)}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      <Chip
                        label={`ID: ${getValueField(item)}`}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                      {item.englishName && (
                        <Chip
                          label={item.englishName}
                          size="small"
                          variant="outlined"
                          color="secondary"
                        />
                      )}
                      {item.level !== undefined && (
                        <Chip
                          label={`سطح: ${item.level}`}
                          size="small"
                          variant="outlined"
                          color="info"
                        />
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              // Single-select display
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <DataObjectIcon fontSize="small" />
                  <Typography variant="body2" fontWeight={600}>
                    انتخاب شده: {getDisplayValue(selectedItem)}
                  </Typography>
                  {selectedItem.type && (
                    <Chip
                      size="small"
                      label={selectedItem.type === 'hierarchy' ? 'سطح سازمانی' : 'داده اصلی'}
                      color={selectedItem.type === 'hierarchy' ? 'success' : 'info'}
                      variant="filled"
                    />
                  )}
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  <Chip
                    label={`ID: ${getValueField(selectedItem)}`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                  {selectedItem.englishName && (
                    <Chip
                      label={selectedItem.englishName}
                      size="small"
                      variant="outlined"
                      color="secondary"
                    />
                  )}
                  {selectedItem.level !== undefined && (
                    <Chip
                      label={`سطح: ${selectedItem.level}`}
                      size="small"
                      variant="outlined"
                      color="info"
                    />
                  )}
                  {selectedItem.coordinates && (
                    <Chip
                      label={`📍 ${selectedItem.coordinates.lat}, ${selectedItem.coordinates.lng}`}
                      size="small"
                      variant="outlined"
                      color="warning"
                    />
                  )}
                  {selectedItem.natoEquivalent && (
                    <Chip
                      label={`NATO: ${selectedItem.natoEquivalent}`}
                      size="small"
                      variant="outlined"
                      color="secondary"
                    />
                  )}
                  {selectedItem.isRequired !== undefined && (
                    <Chip
                      label={selectedItem.isRequired ? 'اجباری' : 'اختیاری'}
                      size="small"
                      variant="outlined"
                      color={selectedItem.isRequired ? 'error' : 'default'}
                    />
                  )}
                </Box>
                {selectedItem.description && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {selectedItem.description}
                  </Typography>
                )}
              </Box>
            )}
          </Alert>
        </Box>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Debug: Category={field.referenceCategory}, Path={field.referencePath}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default DynamicForm;