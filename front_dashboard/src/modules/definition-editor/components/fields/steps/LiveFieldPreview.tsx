import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { 
  Box, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Checkbox,
  FormControlLabel,
  Switch,
  Typography,
  Chip,
  Autocomplete
} from '@mui/material';
import { 
  Accordion, 
  AccordionSummary, 
  AccordionDetails 
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ExtendedCustomFieldDefinition, FieldType } from '../types/FieldEditTypes';
import { FieldEnhancer } from '../processors/FieldEnhancer';

// Define the option type
type FieldOption = string | { value: string; label: string; description?: string };

interface LiveFieldPreviewProps {
  formData: ExtendedCustomFieldDefinition;
  originalType?: FieldType;
}

export const LiveFieldPreview: React.FC<LiveFieldPreviewProps> = ({ formData }) => {
  const [fieldValue, setFieldValue] = useState('');
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isEditable, setIsEditable] = useState(true);

  // Helper function to evaluate conditions
  const evaluateCondition = (value: any, condition: string, expectedValue: string): boolean => {
    const stringValue = String(value || '');
    const stringExpected = String(expectedValue || '');

    switch (condition) {
      case 'equals':
        return stringValue === stringExpected;
      case 'not_equals':
        return stringValue !== stringExpected;
      case 'contains':
        return stringValue.includes(stringExpected);
      case 'not_contains':
        return !stringValue.includes(stringExpected);
      case 'empty':
        return !stringValue || stringValue.trim() === '';
      case 'not_empty':
        return stringValue && stringValue.trim() !== '';
      case 'greater_than':
        return parseFloat(stringValue) > parseFloat(stringExpected);
      case 'less_than':
        return parseFloat(stringValue) < parseFloat(stringExpected);
      default:
        return true;
    }
  };

  // Memoize suggestions for performance
  const suggestions = useMemo(() => {
    if (!formData.suggestions || !Array.isArray(formData.suggestions)) return [];
    return formData.suggestions.filter(s => s && s.trim().length > 0);
  }, [formData.suggestions]);

  // Memoize multiple values processing
  const multipleValues = useMemo(() => {
    if (!formData.enableMultipleValues) return null;
    
    const separator = formData.multiValueSeparator || 'comma';
    const separatorMap = {
      'comma': ',',
      'enter': '\n',
      'space': ' ',
      'semicolon': ';'
    };
    
    return {
      separator: separatorMap[separator],
      values: fieldValue ? fieldValue.split(separatorMap[separator]).map(v => v.trim()).filter(v => v) : []
    };
  }, [formData.enableMultipleValues, formData.multiValueSeparator, fieldValue]);

  // Memoize conditional display logic
  const conditionalDisplay = useMemo(() => {
    // Priority: New conditional rules > Legacy conditional display
    // Check new conditional rules first
    if (formData.conditionalRules?.visibility?.enabled) {
      const rule = formData.conditionalRules.visibility;
      if (rule.dependsOn) {
        // For demo purposes, simulate conditional display
        // In real implementation, this would check against actual form data
        const referenceValue = 'demo'; // This would come from form data
        const condition = rule.condition || 'equals';
        const expectedValue = rule.value || '';
        
        return evaluateCondition(referenceValue, condition, expectedValue);
      }
    }
    
    // Fallback to legacy conditional display only if new rules are not enabled
    if (formData.enableConditionalDisplay) {
      // For demo purposes, simulate conditional display
      // In real implementation, this would check against actual form data
      const referenceValue = 'demo'; // This would come from form data
      const condition = formData.conditionalDisplayOperator || 'equals';
      const expectedValue = formData.conditionalDisplayValue || '';
      
      return evaluateCondition(referenceValue, condition, expectedValue);
    }
    
    // Default to visible if no conditional rules are set
    return true;
  }, [formData.conditionalRules?.visibility, formData.enableConditionalDisplay, formData.conditionalDisplayOperator, formData.conditionalDisplayValue]);

  // Memoize conditional enable logic
  const conditionalEnable = useMemo(() => {
    // Priority: New conditional rules > Legacy conditional enable
    // Check new conditional rules first
    if (formData.conditionalRules?.enable?.enabled) {
      const rule = formData.conditionalRules.enable;
      if (rule.dependsOn) {
        // For demo purposes, simulate conditional enable
        // In real implementation, this would check against actual form data
        const referenceValue = 'demo'; // This would come from form data
        const condition = rule.condition || 'equals';
        const expectedValue = rule.value || '';
        
        return evaluateCondition(referenceValue, condition, expectedValue);
      }
    }
    
    // Fallback to legacy conditional enable only if new rules are not enabled
    if (formData.enableConditionalEnable) {
      // For demo purposes, simulate conditional enable
      // In real implementation, this would check against actual form data
      const referenceValue = 'demo'; // This would come from form data
      const condition = formData.conditionalEnableOperator || 'equals';
      const expectedValue = formData.conditionalEnableValue || '';
      
      return evaluateCondition(referenceValue, condition, expectedValue);
    }
    
    // Default to enabled if no conditional rules are set
    return true;
  }, [formData.conditionalRules?.enable, formData.enableConditionalEnable, formData.conditionalEnableOperator, formData.conditionalEnableValue]);

  // Memoize editable after save logic
  const editableAfterSave = useMemo(() => {
    // Priority: Control rules > Legacy editableAfterSave
    // Check control rules first
    if (formData.controlRules?.readOnly) return false;
    if (formData.controlRules?.lockAfterSave) return false;
    
    // Fallback to legacy editableAfterSave only if control rules are not set
    if (formData.editableAfterSave === undefined) return true;
    return formData.editableAfterSave;
  }, [formData.editableAfterSave, formData.controlRules?.readOnly, formData.controlRules?.lockAfterSave]);

  // Memoize PII check logic
  const piiCheck = useMemo(() => {
    if (!formData.piiCheck?.enabled) return null;
    
    const patterns = formData.piiCheck.patterns || [];
    const action = formData.piiCheck.action || 'warn';
    
    return {
      patterns,
      action,
      enabled: true
    };
  }, [formData.piiCheck]);

  // Memoize profanity check logic
  const profanityCheck = useMemo(() => {
    if (!formData.profanityCheck?.enabled) return null;
    
    const customWords = formData.profanityCheck.customWords || [];
    const action = formData.profanityCheck.action || 'warn';
    
    return {
      customWords,
      action,
      enabled: true
    };
  }, [formData.profanityCheck]);

  // Memoize indexing logic
  const indexing = useMemo(() => {
    if (!formData.indexing) return null;
    
    const searchable = formData.indexing.searchable || false;
    const filterable = formData.indexing.filterable || false;
    
    return {
      searchable,
      filterable,
      enabled: searchable || filterable
    };
  }, [formData.indexing]);

  // Memoize analyzer logic
  const analyzer = useMemo(() => {
    return formData.analyzer || 'standard';
  }, [formData.analyzer]);

  // Memoize store raw and normalized logic
  const storeRawAndNormalized = useMemo(() => {
    return formData.storeRawAndNormalized || false;
  }, [formData.storeRawAndNormalized]);

  // Memoize display properties
  const displayProperties = useMemo(() => {
    return {
      variant: formData.variant || 'plain',
      selectionAid: formData.selectionAid || 'none',
      size: formData.size || 'md',
      icon: formData.icon || '',
      prefix: formData.prefix || '',
      suffix: formData.suffix || '',
      counterDisplay: formData.counterDisplay || 'off',
      copyButton: formData.copyButton || false
    };
  }, [formData.variant, formData.selectionAid, formData.size, formData.icon, formData.prefix, formData.suffix, formData.counterDisplay, formData.copyButton]);

  // Memoize variant properties
  const variantProperties = useMemo(() => {
    return {
      // Textarea properties
      textareaRows: formData.textareaRows || 3,
      textareaMaxRows: formData.textareaMaxRows || 10,
      textareaResize: formData.textareaResize || 'both',
      
      // Richtext properties
      richtextToolbar: formData.richtextToolbar || ['bold', 'italic', 'underline'],
      richtextHeight: formData.richtextHeight || 200,
      
      // Chips properties
      chipsColor: formData.chipsColor || 'default',
      chipsVariant: formData.chipsVariant || 'filled',
      chipsDeletable: formData.chipsDeletable || false,
      chipsMaxCount: formData.chipsMaxCount || 0,
      
      // Pill properties
      pillColor: formData.pillColor || 'default',
      pillSize: formData.pillSize || 'medium',
      
      // Popover properties
      popoverTrigger: formData.popoverTrigger || 'click',
      popoverSize: formData.popoverSize || 'medium',
      popoverPosition: formData.popoverPosition || 'top',
      
      // Inline properties
      inlineLabelPosition: formData.inlineLabelPosition || 'left',
      inlineLabelWidth: formData.inlineLabelWidth || 30,
      inlineSpacing: formData.inlineSpacing || 'normal',
      
      // Accordion properties
      accordionTitle: formData.accordionTitle || '',
      accordionDisplayMode: formData.accordionDisplayMode || 'title'
    };
  }, [
    formData.textareaRows, formData.textareaMaxRows, formData.textareaResize,
    formData.richtextToolbar, formData.richtextHeight,
    formData.chipsColor, formData.chipsVariant, formData.chipsDeletable, formData.chipsMaxCount,
    formData.pillColor, formData.pillSize,
    formData.popoverTrigger, formData.popoverSize, formData.popoverPosition,
    formData.inlineLabelPosition, formData.inlineLabelWidth, formData.inlineSpacing,
    formData.accordionTitle, formData.accordionDisplayMode
  ]);

  // Update visibility and enabled state based on conditions
  useEffect(() => {
    setIsVisible(conditionalDisplay);
    setIsEnabled(conditionalEnable);
    setIsEditable(editableAfterSave);
  }, [conditionalDisplay, conditionalEnable, editableAfterSave]);

  // Apply default value on mount
  useEffect(() => {
    if (formData.controlRules?.defaultValue && !fieldValue) {
      setFieldValue(formData.controlRules.defaultValue);
    }
  }, [formData.controlRules?.defaultValue, fieldValue]);

  // Debounced validation to improve performance
  const debouncedValidation = useCallback(
    debounce((value: string) => {
      // Apply validation rules
      const validationErrors: string[] = [];
      
      // Required validation
      if (formData.isRequired && (!value || value.trim() === '')) {
        validationErrors.push('این فیلد اجباری است');
      }
      
      // Length validation
      if (formData.validationRules) {
        const rules = formData.validationRules;
        
        if (rules.minLength !== undefined && value.length < rules.minLength) {
          validationErrors.push(`حداقل ${rules.minLength} کاراکتر وارد کنید`);
        }
        
        if (rules.maxLength !== undefined && value.length > rules.maxLength) {
          validationErrors.push(`حداکثر ${rules.maxLength} کاراکتر مجاز است`);
        }
        
        // Pattern validation
        if (rules.pattern) {
          try {
            const regex = new RegExp(rules.pattern);
            if (!regex.test(value)) {
              const errorMessage = rules.patternMessage || 'فرمت وارد شده صحیح نیست';
              validationErrors.push(errorMessage);
            }
          } catch (error) {
            console.warn('Invalid regex pattern:', rules.pattern);
          }
        }
      }
      
      setValidationErrors(validationErrors);
    }, 300),
    [formData.isRequired, formData.validationRules]
  );

  // Handle field value changes with real-time processing
  const handleValueChange = async (value: string) => {
    setFieldErrors([]);
    setValidationErrors([]);
    
    try {
      // Check if FieldEnhancer is available
      if (typeof FieldEnhancer !== 'undefined' && FieldEnhancer.processValueSync) {
        // Apply sync processing for immediate feedback
        const processedValue = FieldEnhancer.processValueSync(value, formData);
        
        // Always update with processed value
        setFieldValue(processedValue);
        
        // Apply async processing for validation
        if (FieldEnhancer.processValue) {
          const result = await FieldEnhancer.processValue(processedValue, formData);
          
          // Handle validation errors
          if (!result.isValid && result.validationErrors) {
            setFieldErrors(result.validationErrors);
          }
        }
      } else {
        // Fallback: basic validation without FieldEnhancer
        console.warn('FieldEnhancer not available, using basic validation');
        
        // Apply basic character control
        let processedValue = value;
        if (formData.characterControl && formData.characterControl !== 'all') {
          switch (formData.characterControl) {
            case 'letters':
              processedValue = value.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, '');
              break;
            case 'alphanumeric':
              processedValue = value.replace(/[^a-zA-Z0-9\u0600-\u06FF\u06F0-\u06F9\s]/g, '');
              break;
            case 'custom':
              if (formData.customRegex) {
                try {
                  // For custom regex, keep only characters that match the pattern
                  const regex = new RegExp(formData.customRegex, 'g');
                  const matches = value.match(regex);
                  processedValue = matches ? matches.join('') : '';
                } catch (error) {
                  console.warn('Invalid custom regex:', formData.customRegex);
                }
              }
              break;
          }
        }
        
        // Apply validation rules
        const validationErrors: string[] = [];
        
        // Required validation
        if (formData.isRequired && (!processedValue || processedValue.trim() === '')) {
          validationErrors.push('این فیلد اجباری است');
        }
        
        // Length validation
        if (formData.validationRules) {
          const rules = formData.validationRules;
          
          if (rules.minLength !== undefined && processedValue.length < rules.minLength) {
            validationErrors.push(`حداقل ${rules.minLength} کاراکتر وارد کنید`);
          }
          
          if (rules.maxLength !== undefined && processedValue.length > rules.maxLength) {
            validationErrors.push(`حداکثر ${rules.maxLength} کاراکتر مجاز است`);
          }
          
          // Pattern validation
          if (rules.pattern) {
            try {
              const regex = new RegExp(rules.pattern);
              if (!regex.test(processedValue)) {
                const errorMessage = rules.patternMessage || 'فرمت وارد شده صحیح نیست';
                validationErrors.push(errorMessage);
              }
            } catch (error) {
              console.warn('Invalid regex pattern:', rules.pattern);
            }
          }
        }
        
        // Use debounced validation for better performance
        debouncedValidation(processedValue);

        // Apply PII check if enabled
        if (piiCheck?.enabled) {
          const piiPatterns = [
            // Email pattern
            /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
            // Phone pattern (Iranian)
            /(\+98|0)?9\d{9}/g,
            // National ID pattern (Iranian)
            /\d{10}/g,
            // Custom patterns
            ...piiCheck.patterns.map(pattern => new RegExp(pattern, 'g'))
          ];

          const hasPII = piiPatterns.some(pattern => pattern.test(processedValue));
          if (hasPII) {
            if (piiCheck.action === 'block') {
              setFieldErrors(['اطلاعات حساس شناسایی شد. ورودی مسدود شد.']);
              return;
            } else {
              setFieldErrors(['اطلاعات حساس شناسایی شد.']);
            }
          }
        }

        // Apply profanity check if enabled
        if (profanityCheck?.enabled) {
          const profanityWords = [
            // Default profanity words (Persian)
            'کثافت', 'خایه', 'کیر', 'کص', 'جنده', 'فاحشه',
            // Custom words
            ...profanityCheck.customWords
          ];

          const hasProfanity = profanityWords.some(word => 
            processedValue.toLowerCase().includes(word.toLowerCase())
          );
          
          if (hasProfanity) {
            if (profanityCheck.action === 'block') {
              setFieldErrors(['کلمات نامناسب شناسایی شد. ورودی مسدود شد.']);
              return;
            } else {
              setFieldErrors(['کلمات نامناسب شناسایی شد.']);
            }
          }
        }

        // Apply indexing and analyzer if enabled
        if (indexing?.enabled) {
          // In a real implementation, this would be handled by the backend
          // For now, we just log the indexing configuration
          console.log('Field indexing enabled:', {
            searchable: indexing.searchable,
            filterable: indexing.filterable,
            analyzer: analyzer
          });
        }

        // Apply store raw and normalized if enabled
        if (storeRawAndNormalized) {
          // In a real implementation, this would store both raw and processed values
          // For now, we just log the configuration
          console.log('Store raw and normalized enabled for field:', formData.name);
        }

        // Apply display properties if enabled
        if (displayProperties.variant !== 'plain') {
          console.log('Display properties applied:', {
            variant: displayProperties.variant,
            selectionAid: displayProperties.selectionAid,
            size: displayProperties.size,
            icon: displayProperties.icon,
            prefix: displayProperties.prefix,
            suffix: displayProperties.suffix,
            counterDisplay: displayProperties.counterDisplay,
            copyButton: displayProperties.copyButton
          });
        }

        // Apply variant properties if enabled
        if (displayProperties.variant === 'textarea') {
          console.log('Textarea properties applied:', {
            rows: variantProperties.textareaRows,
            maxRows: variantProperties.textareaMaxRows,
            resize: variantProperties.textareaResize
          });
        } else if (displayProperties.variant === 'richtext') {
          console.log('Richtext properties applied:', {
            toolbar: variantProperties.richtextToolbar,
            height: variantProperties.richtextHeight
          });
        } else if (displayProperties.variant === 'chips') {
          console.log('Chips properties applied:', {
            color: variantProperties.chipsColor,
            variant: variantProperties.chipsVariant,
            deletable: variantProperties.chipsDeletable,
            maxCount: variantProperties.chipsMaxCount
          });
        } else if (displayProperties.variant === 'pill') {
          console.log('Pill properties applied:', {
            color: variantProperties.pillColor,
            size: variantProperties.pillSize
          });
        } else if (displayProperties.variant === 'popover') {
          console.log('Popover properties applied:', {
            trigger: variantProperties.popoverTrigger,
            size: variantProperties.popoverSize,
            position: variantProperties.popoverPosition
          });
        } else if (displayProperties.variant === 'inline') {
          console.log('Inline properties applied:', {
            labelPosition: variantProperties.inlineLabelPosition,
            labelWidth: variantProperties.inlineLabelWidth,
            spacing: variantProperties.inlineSpacing
          });
        } else if (displayProperties.variant === 'accordion') {
          console.log('Accordion properties applied:', {
            title: variantProperties.accordionTitle,
            displayMode: variantProperties.accordionDisplayMode
          });
        }
        
        setFieldValue(processedValue);
        
        // Basic validation for required fields
        if (formData.isRequired && !processedValue.trim()) {
          setFieldErrors(['این فیلد اجباری است']);
        }
        
        // Basic length validation
        if (formData.validationRules?.minLength && processedValue.length < formData.validationRules.minLength) {
          setFieldErrors([`حداقل ${formData.validationRules.minLength} کاراکتر لازم است`]);
        }
        
        if (formData.validationRules?.maxLength && processedValue.length > formData.validationRules.maxLength) {
          setFieldErrors([`حداکثر ${formData.validationRules.maxLength} کاراکتر مجاز است`]);
        }
      }
    } catch (error) {
      console.warn('Field processing failed:', error);
      setFieldErrors(['خطا در پردازش فیلد']);
    }
  };

  // Handle different field types
  const renderField = () => {
    // Don't render if not visible
    if (!isVisible) {
      return (
        <Box sx={{ p: 2, textAlign: 'center', color: '#666' }}>
          <Typography variant="body2">فیلد بر اساس شرایط نمایش داده نمی‌شود</Typography>
        </Box>
      );
    }

    // Apply control rules with priority
    const isReadOnly = formData.controlRules?.readOnly || false;
    const isLocked = formData.controlRules?.lockAfterSave || false;
    const isDisabled = !isEnabled || isReadOnly || isLocked || !editableAfterSave;

    switch (formData.type) {
      case 'text':
      case 'email':
      case 'password':
        // Handle suggestions with Autocomplete
        if (suggestions.length > 0) {
          return (
            <Autocomplete
              freeSolo
              options={suggestions}
              value={fieldValue}
              onChange={(_event, newValue) => {
                handleValueChange(typeof newValue === 'string' ? newValue : newValue || '');
              }}
              onInputChange={(_event, newInputValue) => {
                handleValueChange(newInputValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label={formData.name + (formData.isRequired ? ' *' : '')}
                  placeholder={formData.placeholder || ''}
                  helperText={validationErrors.length > 0 ? validationErrors[0] : (fieldErrors.length > 0 ? fieldErrors[0] : ((formData.helpText && formData.helpText.trim()) || ''))}
                  error={fieldErrors.length > 0 || validationErrors.length > 0}
                  disabled={isDisabled}
                  dir={formData.direction === 'ltr' ? 'ltr' : 'rtl'}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                      '&:hover': { boxShadow: '0 4px 12px rgba(74, 144, 226, 0.15)' },
                      '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)' },
                    }
                  }}
                />
              )}
            />
          );
        }

        // Handle multiple values
        if (multipleValues) {
          return (
            <Box>
              <TextField
                fullWidth
                label={formData.name + (formData.isRequired ? ' *' : '')}
                placeholder={formData.placeholder || ''}
                helperText={validationErrors.length > 0 ? validationErrors[0] : (fieldErrors.length > 0 ? fieldErrors[0] : (formData.helpText || ''))}
                value={fieldValue}
                onChange={(e) => handleValueChange(e.target.value)}
                dir={formData.direction === 'ltr' ? 'ltr' : 'rtl'}
                error={fieldErrors.length > 0 || validationErrors.length > 0}
                disabled={!isEnabled || !isEditable}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': { boxShadow: '0 4px 12px rgba(74, 144, 226, 0.15)' },
                    '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)' },
                  }
                }}
              />
              {multipleValues.values.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {multipleValues.values.map((value, index) => (
                    <Chip
                      key={index}
                      label={value}
                      size="small"
                      onDelete={() => {
                        const newValues = multipleValues.values.filter((_, i) => i !== index);
                        handleValueChange(newValues.join(multipleValues.separator));
                      }}
                      sx={{ bgcolor: 'rgba(74, 144, 226, 0.1)', color: '#4A90E2' }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          );
        }

        // Handle richtext display
        if (formData.variant === 'richtext') {
          return (
            <Box>
              <TextField
                fullWidth
                label={formData.name + (formData.isRequired ? ' *' : '')}
                placeholder={formData.placeholder || ''}
                helperText={validationErrors.length > 0 ? validationErrors[0] : (fieldErrors.length > 0 ? fieldErrors[0] : (formData.helpText || ''))}
                value={fieldValue}
                onChange={(e) => handleValueChange(e.target.value)}
                multiline
                rows={Math.max(3, Math.floor(variantProperties.richtextHeight / 24))}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': { boxShadow: '0 4px 12px rgba(74, 144, 226, 0.15)' },
                    '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)' },
                  }
                }}
                InputProps={{
                  startAdornment: formData.prefix ? (
                    <Typography sx={{ mr: 1, color: '#64748B' }}>{formData.prefix}</Typography>
                  ) : undefined,
                  endAdornment: formData.suffix ? (
                    <Typography sx={{ ml: 1, color: '#64748B' }}>{formData.suffix}</Typography>
                  ) : undefined,
                }}
              />
              {/* Richtext Toolbar Simulation */}
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {variantProperties.richtextToolbar.map((tool, index) => (
                  <Box
                    key={index}
                    sx={{
                      px: 2,
                      py: 0.5,
                      bgcolor: 'rgba(74, 144, 226, 0.1)',
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      color: '#4A90E2',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'rgba(74, 144, 226, 0.2)' }
                    }}
                  >
                    {tool}
                  </Box>
                ))}
              </Box>
            </Box>
          );
        }

        // Handle chips display
        if (formData.variant === 'chips') {
          const chipValues = fieldValue ? fieldValue.split(',').filter(v => v.trim()) : [];
          return (
            <Box>
              <TextField
                fullWidth
                label={formData.name + (formData.isRequired ? ' *' : '')}
                placeholder={formData.placeholder || ''}
                helperText={validationErrors.length > 0 ? validationErrors[0] : (fieldErrors.length > 0 ? fieldErrors[0] : (formData.helpText || ''))}
                value={fieldValue}
                onChange={(e) => handleValueChange(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const newValue = fieldValue + (fieldValue ? ',' : '') + 'گزینه جدید';
                    handleValueChange(newValue);
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': { boxShadow: '0 4px 12px rgba(74, 144, 226, 0.15)' },
                    '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)' },
                  }
                }}
              />
              {chipValues.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {chipValues.map((value, index) => (
                    <Chip
                      key={index}
                      label={value.trim()}
                      color={variantProperties.chipsColor === 'primary' ? 'primary' : variantProperties.chipsColor === 'secondary' ? 'secondary' : 'default'}
                      variant={variantProperties.chipsVariant}
                      onDelete={variantProperties.chipsDeletable ? () => {
                        const newValues = chipValues.filter((_, i) => i !== index);
                        handleValueChange(newValues.join(','));
                      } : undefined}
                      size="small"
                    />
                  ))}
                </Box>
              )}
            </Box>
          );
        }

        // Handle pill display
        if (formData.variant === 'pill') {
          const pillValues = fieldValue ? fieldValue.split(',').filter(v => v.trim()) : [];
          return (
            <Box>
              <TextField
                fullWidth
                label={formData.name + (formData.isRequired ? ' *' : '')}
                placeholder={formData.placeholder || ''}
                helperText={validationErrors.length > 0 ? validationErrors[0] : (fieldErrors.length > 0 ? fieldErrors[0] : (formData.helpText || ''))}
                value={fieldValue}
                onChange={(e) => handleValueChange(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const newValue = fieldValue + (fieldValue ? ',' : '') + 'گزینه جدید';
                    handleValueChange(newValue);
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': { boxShadow: '0 4px 12px rgba(74, 144, 226, 0.15)' },
                    '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)' },
                  }
                }}
              />
              {pillValues.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {pillValues.map((value, index) => (
                    <Box
                      key={index}
                      sx={{
                        px: 2,
                        py: 0.5,
                        bgcolor: variantProperties.pillColor === 'primary' ? '#4A90E2' : 
                                variantProperties.pillColor === 'secondary' ? '#757575' :
                                variantProperties.pillColor === 'success' ? '#4CAF50' :
                                variantProperties.pillColor === 'warning' ? '#FF9800' :
                                variantProperties.pillColor === 'error' ? '#F44336' : '#E0E0E0',
                        color: variantProperties.pillColor === 'default' ? '#000' : '#fff',
                        borderRadius: variantProperties.pillSize === 'small' ? 1 : 2,
                        fontSize: variantProperties.pillSize === 'small' ? '0.75rem' : '0.875rem',
                        cursor: 'pointer',
                        '&:hover': { opacity: 0.8 }
                      }}
                    >
                      {value.trim()}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          );
        }

        // Handle popover display
        if (formData.variant === 'popover') {
          return (
            <Box>
              <TextField
                fullWidth
                label={formData.name + (formData.isRequired ? ' *' : '')}
                placeholder={formData.placeholder || ''}
                helperText={validationErrors.length > 0 ? validationErrors[0] : (fieldErrors.length > 0 ? fieldErrors[0] : (formData.helpText || ''))}
                value={fieldValue}
                onChange={(e) => handleValueChange(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': { boxShadow: '0 4px 12px rgba(74, 144, 226, 0.15)' },
                    '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)' },
                  }
                }}
                InputProps={{
                  startAdornment: formData.prefix ? (
                    <Typography sx={{ mr: 1, color: '#64748B' }}>{formData.prefix}</Typography>
                  ) : undefined,
                  endAdornment: formData.suffix ? (
                    <Typography sx={{ ml: 1, color: '#64748B' }}>{formData.suffix}</Typography>
                  ) : undefined,
                }}
              />
              {/* Popover Simulation */}
              <Box sx={{ 
                mt: 1, 
                p: 2, 
                bgcolor: 'rgba(74, 144, 226, 0.05)', 
                borderRadius: 1, 
                border: '1px dashed rgba(74, 144, 226, 0.3)',
                fontSize: '0.75rem',
                color: '#4A90E2'
              }}>
                پاپ‌اور ({variantProperties.popoverSize}) - {variantProperties.popoverTrigger} - {variantProperties.popoverPosition}
              </Box>
            </Box>
          );
        }

        // Handle inline display
        if (formData.variant === 'inline') {
          return (
            <Box sx={{ 
              display: 'flex', 
              alignItems: variantProperties.inlineLabelPosition === 'top' ? 'flex-start' : 'center',
              flexDirection: variantProperties.inlineLabelPosition === 'top' ? 'column' : 'row',
              gap: variantProperties.inlineSpacing === 'compact' ? 1 : variantProperties.inlineSpacing === 'comfortable' ? 3 : 2
            }}>
              <Box sx={{ 
                width: variantProperties.inlineLabelPosition === 'top' ? '100%' : `${variantProperties.inlineLabelWidth}%`,
                minWidth: variantProperties.inlineLabelPosition === 'top' ? 'auto' : 120
              }}>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#64748B' }}>
                  {formData.name + (formData.isRequired ? ' *' : '')}
                </Typography>
              </Box>
              <Box sx={{ 
                width: variantProperties.inlineLabelPosition === 'top' ? '100%' : `${100 - variantProperties.inlineLabelWidth}%`,
                flex: 1
              }}>
                <TextField
                  fullWidth
                  placeholder={formData.placeholder || ''}
                  helperText={validationErrors.length > 0 ? validationErrors[0] : (fieldErrors.length > 0 ? fieldErrors[0] : ((formData.helpText && formData.helpText.trim()) || ''))}
                  value={fieldValue}
                  onChange={(e) => handleValueChange(e.target.value)}
                  type={formData.type === 'password' ? 'password' : 'text'}
                  dir={formData.direction === 'ltr' ? 'ltr' : 'rtl'}
                  error={fieldErrors.length > 0 || validationErrors.length > 0}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                      '&:hover': { boxShadow: '0 4px 12px rgba(74, 144, 226, 0.15)' },
                      '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)' },
                    }
                  }}
                  InputProps={{
                    startAdornment: formData.prefix ? (
                      <Typography sx={{ mr: 1, color: '#64748B' }}>{formData.prefix}</Typography>
                    ) : undefined,
                    endAdornment: formData.suffix ? (
                      <Typography sx={{ ml: 1, color: '#64748B' }}>{formData.suffix}</Typography>
                    ) : undefined,
                  }}
                />
              </Box>
            </Box>
          );
        }

        // Handle masked display
        if (formData.variant === 'masked') {
          const applyMask = (value: string, pattern: string) => {
            if (!pattern) return value;
            
            // Common masking patterns
            switch (pattern) {
              case 'phone':
                return value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
              case 'card':
                return value.replace(/(\d{4})/g, '$1-').slice(0, -1);
              case 'national-id':
                return value.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
              case 'iban':
                return value.replace(/(IR)(\d{2})(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})(\d{2})/, '$1 $2 $3 $4 $5 $6 $7 $8');
              default:
                // Custom pattern: 9 = digit, * = masked, others = separators
                let result = '';
                let valueIndex = 0;
                
                for (let i = 0; i < pattern.length && valueIndex < value.length; i++) {
                  const patternChar = pattern[i];
                  const valueChar = value[valueIndex];
                  
                  if (patternChar === '9') {
                    if (/\d/.test(valueChar)) {
                      result += valueChar;
                      valueIndex++;
                    } else {
                      break;
                    }
                  } else if (patternChar === 'A') {
                    if (/[a-zA-Z\u0600-\u06FF]/.test(valueChar)) {
                      result += valueChar;
                      valueIndex++;
                    } else {
                      break;
                    }
                  } else if (patternChar === '*') {
                    result += '*';
                    valueIndex++;
                  } else {
                    result += patternChar;
                  }
                }
                return result;
            }
          };

          const maskedValue = applyMask(fieldValue, formData.maskPattern || '');

          return (
            <Box>
              <TextField
                fullWidth
                label={formData.name + (formData.isRequired ? ' *' : '')}
                placeholder={formData.placeholder || ''}
                helperText={validationErrors.length > 0 ? validationErrors[0] : (fieldErrors.length > 0 ? fieldErrors[0] : (formData.helpText || ''))}
                value={maskedValue}
                onChange={(e) => {
                  // Remove mask characters for processing
                  let cleanValue = e.target.value;
                  
                  // Apply character control if defined and not masked
                  if (formData.characterControl && formData.characterControl !== 'all') {
                    switch (formData.characterControl) {
                      case 'letters':
                        cleanValue = cleanValue.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, '');
                        break;
                      case 'alphanumeric':
                        cleanValue = cleanValue.replace(/[^a-zA-Z0-9\u0600-\u06FF\u06F0-\u06F9\s]/g, '');
                        break;
                      case 'custom':
                        if (formData.customRegex) {
                          try {
                            const regex = new RegExp(formData.customRegex, 'g');
                            const matches = cleanValue.match(regex);
                            cleanValue = matches ? matches.join('') : '';
                          } catch (error) {
                            console.warn('Invalid custom regex:', formData.customRegex);
                          }
                        }
                        break;
                    }
                  } else if (formData.variant === 'masked') {
                    // For masked fields, only keep digits and letters
                    cleanValue = cleanValue.replace(/[^\d\w\u0600-\u06FF]/g, '');
                  }
                  
                  handleValueChange(cleanValue);
                }}
                type={formData.type === 'password' ? 'password' : 'text'}
                dir={formData.direction === 'ltr' ? 'ltr' : 'rtl'}
                error={fieldErrors.length > 0 || validationErrors.length > 0}
                size={displayProperties.size === 'sm' ? 'small' : displayProperties.size === 'lg' ? 'medium' : 'medium'}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': { boxShadow: '0 4px 12px rgba(74, 144, 226, 0.15)' },
                    '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)' },
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {displayProperties.icon && (
                        <Typography sx={{ fontSize: '1.2rem' }}>{displayProperties.icon}</Typography>
                      )}
                      {formData.prefix && (
                        <Typography sx={{ color: '#64748B' }}>{formData.prefix}</Typography>
                      )}
                    </Box>
                  ),
                  endAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {formData.suffix && (
                        <Typography sx={{ color: '#64748B' }}>{formData.suffix}</Typography>
                      )}
                      {displayProperties.copyButton && (
                        <Box
                          sx={{
                            cursor: 'pointer',
                            p: 0.5,
                            borderRadius: 1,
                            '&:hover': { bgcolor: 'rgba(74, 144, 226, 0.1)' }
                          }}
                          onClick={() => navigator.clipboard.writeText(maskedValue)}
                        >
                          📋
                        </Box>
                      )}
                    </Box>
                  ),
                }}
              />
              {/* Mask Pattern Display */}
              {formData.maskPattern && (
                <Box sx={{ 
                  mt: 0.5, 
                  fontSize: '0.75rem',
                  color: '#4A90E2',
                  fontFamily: 'monospace'
                }}>
                  الگو: {formData.maskPattern}
                </Box>
              )}
              {/* Counter Display */}
              {displayProperties.counterDisplay !== 'off' && (
                <Box sx={{ 
                  mt: 0.5, 
                  textAlign: displayProperties.counterDisplay === 'inside' ? 'right' : 'left',
                  fontSize: '0.75rem',
                  color: '#64748B'
                }}>
                  {fieldValue.length} / {formData.maxLength || 'نامحدود'}
                </Box>
              )}
            </Box>
          );
        }

        // Special handling for accordion display
        if (formData.variant === 'accordion') {
          return (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{formData.accordionTitle || formData.name}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {/* Show options when accordionDisplayMode is 'options', otherwise show text field */}
                {formData.accordionDisplayMode === 'options' && formData.options && formData.options.length > 0 ? (
                  <Box sx={{ width: '100%' }}>
                    {formData.selectionAid === 'single' ? (
                      <FormControl fullWidth>
                        <InputLabel>انتخاب گزینه</InputLabel>
                        <Select
                          value={fieldValue}
                          onChange={(e) => handleValueChange(e.target.value)}
                          label="انتخاب گزینه"
                        >
                          {formData.options.map((option: any, index: number) => (
                            <MenuItem key={index} value={typeof option === 'string' ? option : option.value}>
                              {typeof option === 'string' ? option : option.label || option.value}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : formData.selectionAid === 'multi' ? (
                      <FormControl fullWidth>
                        <InputLabel>انتخاب چندگانه</InputLabel>
                        <Select
                          multiple
                          value={fieldValue ? fieldValue.split(',') : []}
                          onChange={(e) => handleValueChange(Array.isArray(e.target.value) ? e.target.value.join(',') : '')}
                          label="انتخاب چندگانه"
                        >
                          {formData.options.map((option: any, index: number) => (
                            <MenuItem key={index} value={typeof option === 'string' ? option : option.value}>
                              {typeof option === 'string' ? option : option.label || option.value}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <Box>
                        {formData.options.map((option: any, index: number) => (
                          <Box key={index} sx={{ mb: 1 }}>
                            <Typography variant="body2">
                              {typeof option === 'string' ? option : option.label || option.value}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                ) : (
                  <TextField
                    fullWidth
                    label={formData.name + (formData.isRequired ? ' *' : '')}
                    placeholder={formData.placeholder || ''}
                    helperText={validationErrors.length > 0 ? validationErrors[0] : (fieldErrors.length > 0 ? fieldErrors[0] : ((formData.helpText && formData.helpText.trim()) || ''))}
                    value={fieldValue}
                    onChange={(e) => handleValueChange(e.target.value)}
                    type={formData.type === 'password' ? 'password' : 'text'}
                    dir={formData.direction === 'ltr' ? 'ltr' : 'rtl'}
                    error={fieldErrors.length > 0 || validationErrors.length > 0}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        background: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        '&:hover': { boxShadow: '0 4px 12px rgba(74, 144, 226, 0.15)' },
                        '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)' },
                      }
                    }}
                    InputProps={{
                      startAdornment: formData.prefix ? (
                        <Typography sx={{ mr: 1, color: '#64748B' }}>{formData.prefix}</Typography>
                      ) : undefined,
                      endAdornment: formData.suffix ? (
                        <Typography sx={{ ml: 1, color: '#64748B' }}>{formData.suffix}</Typography>
                      ) : undefined,
                    }}
                  />
                )}
              </AccordionDetails>
            </Accordion>
          );
        }
        
        return (
          <Box>
            <TextField
              fullWidth
              label={formData.name + (formData.isRequired ? ' *' : '')}
              placeholder={formData.placeholder || ''}
              helperText={formData.helpText || ''}
              value={fieldValue}
              onChange={(e) => handleValueChange(e.target.value)}
              type={formData.type === 'password' ? 'password' : 'text'}
              dir={formData.direction === 'ltr' ? 'ltr' : 'rtl'}
              error={fieldErrors.length > 0}
              size={displayProperties.size === 'sm' ? 'small' : displayProperties.size === 'lg' ? 'medium' : 'medium'}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { boxShadow: '0 4px 12px rgba(74, 144, 226, 0.15)' },
                  '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)' },
                }
              }}
              InputProps={{
                startAdornment: (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {displayProperties.icon && (
                      <Typography sx={{ fontSize: '1.2rem' }}>{displayProperties.icon}</Typography>
                    )}
                    {formData.prefix && (
                      <Typography sx={{ color: '#64748B' }}>{formData.prefix}</Typography>
                    )}
                  </Box>
                ),
                endAdornment: (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {formData.suffix && (
                      <Typography sx={{ color: '#64748B' }}>{formData.suffix}</Typography>
                    )}
                    {displayProperties.copyButton && (
                      <Box
                        sx={{
                          cursor: 'pointer',
                          p: 0.5,
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'rgba(74, 144, 226, 0.1)' }
                        }}
                        onClick={() => navigator.clipboard.writeText(fieldValue)}
                      >
                        📋
                      </Box>
                    )}
                  </Box>
                ),
              }}
            />
            {/* Counter Display */}
            {displayProperties.counterDisplay !== 'off' && (
              <Box sx={{ 
                mt: 0.5, 
                textAlign: displayProperties.counterDisplay === 'inside' ? 'right' : 'left',
                fontSize: '0.75rem',
                color: '#64748B'
              }}>
                {fieldValue.length} / {formData.maxLength || 'نامحدود'}
              </Box>
            )}
          </Box>
        );
      
      case 'textarea':
        // Special handling for accordion display
        if (formData.variant === 'accordion') {
          return (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{formData.accordionTitle || formData.name}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {/* Show options when accordionDisplayMode is 'options', otherwise show textarea */}
                {formData.accordionDisplayMode === 'options' && formData.options && formData.options.length > 0 ? (
                  <Box sx={{ width: '100%' }}>
                    {formData.selectionAid === 'single' ? (
                      <FormControl fullWidth>
                        <InputLabel>انتخاب گزینه</InputLabel>
                        <Select
                          value={fieldValue}
                          onChange={(e) => handleValueChange(e.target.value)}
                          label="انتخاب گزینه"
                        >
                          {formData.options.map((option: any, index: number) => (
                            <MenuItem key={index} value={typeof option === 'string' ? option : option.value}>
                              {typeof option === 'string' ? option : option.label || option.value}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : formData.selectionAid === 'multi' ? (
                      <FormControl fullWidth>
                        <InputLabel>انتخاب چندگانه</InputLabel>
                        <Select
                          multiple
                          value={fieldValue ? fieldValue.split(',') : []}
                          onChange={(e) => handleValueChange(Array.isArray(e.target.value) ? e.target.value.join(',') : '')}
                          label="انتخاب چندگانه"
                        >
                          {formData.options.map((option: any, index: number) => (
                            <MenuItem key={index} value={typeof option === 'string' ? option : option.value}>
                              {typeof option === 'string' ? option : option.label || option.value}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <Box>
                        {formData.options.map((option: any, index: number) => (
                          <Box key={index} sx={{ mb: 1 }}>
                            <Typography variant="body2">
                              {typeof option === 'string' ? option : option.label || option.value}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                ) : (
                  <TextField
                    fullWidth
                    label={formData.name + (formData.isRequired ? ' *' : '')}
                    placeholder={formData.placeholder || ''}
                    helperText={validationErrors.length > 0 ? validationErrors[0] : (fieldErrors.length > 0 ? fieldErrors[0] : ((formData.helpText && formData.helpText.trim()) || ''))}
                    value={fieldValue}
                    onChange={(e) => handleValueChange(e.target.value)}
                    multiline
                    rows={formData.textareaRows || 4}
                    dir={formData.direction === 'ltr' ? 'ltr' : 'rtl'}
                    error={fieldErrors.length > 0 || validationErrors.length > 0}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        background: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        '&:hover': { boxShadow: '0 4px 12px rgba(74, 144, 226, 0.15)' },
                        '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)' },
                      }
                    }}
                  />
                )}
              </AccordionDetails>
            </Accordion>
          );
        }
        
        return (
          <Box>
            <TextField
              fullWidth
              label={formData.name + (formData.isRequired ? ' *' : '')}
              placeholder={formData.placeholder || ''}
              helperText={formData.helpText || ''}
              value={fieldValue}
              onChange={(e) => handleValueChange(e.target.value)}
              multiline
              rows={variantProperties.textareaRows}
              maxRows={variantProperties.textareaMaxRows}
              dir={formData.direction === 'ltr' ? 'ltr' : 'rtl'}
              error={fieldErrors.length > 0}
              size={displayProperties.size === 'sm' ? 'small' : displayProperties.size === 'lg' ? 'medium' : 'medium'}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { boxShadow: '0 4px 12px rgba(74, 144, 226, 0.15)' },
                  '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)' },
                  resize: variantProperties.textareaResize
                }
              }}
              InputProps={{
                startAdornment: (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {displayProperties.icon && (
                      <Typography sx={{ fontSize: '1.2rem' }}>{displayProperties.icon}</Typography>
                    )}
                    {formData.prefix && (
                      <Typography sx={{ color: '#64748B' }}>{formData.prefix}</Typography>
                    )}
                  </Box>
                ),
                endAdornment: (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {formData.suffix && (
                      <Typography sx={{ color: '#64748B' }}>{formData.suffix}</Typography>
                    )}
                    {displayProperties.copyButton && (
                      <Box
                        sx={{
                          cursor: 'pointer',
                          p: 0.5,
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'rgba(74, 144, 226, 0.1)' }
                        }}
                        onClick={() => navigator.clipboard.writeText(fieldValue)}
                      >
                        📋
                      </Box>
                    )}
                  </Box>
                ),
              }}
            />
            {/* Counter Display */}
            {displayProperties.counterDisplay !== 'off' && (
              <Box sx={{ 
                mt: 0.5, 
                textAlign: displayProperties.counterDisplay === 'inside' ? 'right' : 'left',
                fontSize: '0.75rem',
                color: '#64748B'
              }}>
                {fieldValue.length} / {formData.maxLength || 'نامحدود'}
              </Box>
            )}
          </Box>
        );
      
      case 'number':
        return (
          <TextField
            fullWidth
            label={formData.name + (formData.isRequired ? ' *' : '')}
            placeholder={formData.placeholder || ''}
            helperText={formData.helpText || ''}
            value={fieldValue}
            onChange={(e) => handleValueChange(e.target.value)}
            type="number"
            error={fieldErrors.length > 0}
            sx={{
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                '&:hover': { boxShadow: '0 4px 12px rgba(74, 144, 226, 0.15)' },
                '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)' },
              }
            }}
          />
        );
      
      case 'select':
        return (
          <FormControl fullWidth error={fieldErrors.length > 0}>
            <InputLabel>{formData.name + (formData.isRequired ? ' *' : '')}</InputLabel>
            <Select
              value={formData.selectionAid === 'multi' ? (fieldValue ? fieldValue.split(',') : []) : fieldValue}
              onChange={(e) => {
                if (formData.selectionAid === 'multi') {
                  handleValueChange(Array.isArray(e.target.value) ? e.target.value.join(',') : '');
                } else {
                  handleValueChange(e.target.value as string);
                }
              }}
              label={formData.name + (formData.isRequired ? ' *' : '')}
              multiple={formData.selectionAid === 'multi'}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { boxShadow: '0 4px 12px rgba(74, 144, 226, 0.15)' },
                  '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)' },
                }
              }}
            >
              {formData.options?.map((option: FieldOption, index) => (
                <MenuItem 
                  key={typeof option === 'string' ? option : option.value || index} 
                  value={typeof option === 'string' ? option : option.value}
                >
                  {typeof option === 'string' ? option : option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      
      case 'multiselect':
        return (
          <FormControl fullWidth error={fieldErrors.length > 0}>
            <InputLabel>{formData.name + (formData.isRequired ? ' *' : '')}</InputLabel>
            <Select
              multiple
              value={fieldValue ? fieldValue.split(',') : []}
              onChange={(e) => handleValueChange((e.target.value as string[]).join(','))}
              label={formData.name + (formData.isRequired ? ' *' : '')}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { boxShadow: '0 4px 12px rgba(74, 144, 226, 0.15)' },
                  '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)' },
                }
              }}
            >
              {formData.options?.map((option: FieldOption, index) => (
                <MenuItem 
                  key={typeof option === 'string' ? option : option.value || index} 
                  value={typeof option === 'string' ? option : option.value}
                >
                  <Checkbox checked={fieldValue?.split(',').includes(typeof option === 'string' ? option : option.value)} />
                  <Typography>{typeof option === 'string' ? option : option.label}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      
      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={fieldValue === 'true'}
                onChange={(e) => handleValueChange(e.target.checked ? 'true' : 'false')}
              />
            }
            label={formData.name + (formData.isRequired ? ' *' : '')}
          />
        );
      
      default:
        return (
          <TextField
            fullWidth
            label={formData.name + (formData.isRequired ? ' *' : '')}
            placeholder={formData.placeholder || ''}
            helperText={formData.helpText || ''}
            value={fieldValue}
            onChange={(e) => handleValueChange(e.target.value)}
            dir={formData.direction === 'ltr' ? 'ltr' : 'rtl'}
            error={fieldErrors.length > 0}
            disabled={!isEnabled || !isEditable}
            spellCheck={formData.spellcheck !== 'off'}
            inputProps={{
              'data-spellcheck': formData.spellcheck || 'off',
              'data-custom-dictionary': formData.customDictionary || ''
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                '&:hover': { boxShadow: '0 4px 12px rgba(74, 144, 226, 0.15)' },
                '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)' },
              }
            }}
          />
        );
    }
  };

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: '12px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
        backdropFilter: 'blur(10px)',
        border: '2px dashed rgba(74, 144, 226, 0.3)',
        boxShadow: '0 4px 16px rgba(74, 144, 226, 0.1)',
      }}
      role="region"
      aria-label="پیش‌نمایش زنده فیلد"
    >
      <Typography 
        variant="h6" 
        sx={{ 
          mb: 3, 
          color: '#4A90E2', 
          fontWeight: 600, 
          textAlign: 'center'
        }}
      >
        🎯 پیش‌نمایش زنده فیلد (با پردازش فعال)
      </Typography>
      
      {renderField()}
      
      {/* Show validation errors */}
      {fieldErrors.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {fieldErrors.map((error, index) => (
            <Typography 
              key={index} 
              variant="body2" 
              color="error" 
              sx={{ mb: 1 }}
            >
              ⚠️ {error}
            </Typography>
          ))}
        </Box>
      )}
      
      {/* Show active processing features */}
      {(formData.caseTransform || formData.trimWhitespace || formData.characterControl) && (
        <Box sx={{ 
          mt: 2, 
          p: 1.5, 
          backgroundColor: 'rgba(74, 144, 226, 0.1)', 
          borderRadius: 1 
        }}>
          <Typography 
            variant="caption" 
            color="primary" 
            sx={{ 
              fontWeight: 600, 
              display: 'block'
            }}
          >
            ⚡ پردازش فعال:
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1, 
            mt: 0.5 
          }}>
            {formData.caseTransform && (
              <Typography 
                variant="caption" 
                sx={{ 
                  px: 1, 
                  py: 0.5, 
                  backgroundColor: 'rgba(74, 144, 226, 0.2)', 
                  borderRadius: 0.5
                }}
              >
                تبدیل حروف: {formData.caseTransform}
              </Typography>
            )}
            {formData.trimWhitespace && (
              <Typography 
                variant="caption" 
                sx={{ 
                  px: 1, 
                  py: 0.5, 
                  backgroundColor: 'rgba(74, 144, 226, 0.2)', 
                  borderRadius: 0.5
                }}
              >
                حذف فاصله اضافی
              </Typography>
            )}
            {formData.characterControl && (
              <Typography 
                variant="caption" 
                sx={{ 
                  px: 1, 
                  py: 0.5, 
                  backgroundColor: 'rgba(74, 144, 226, 0.2)', 
                  borderRadius: 0.5
                }}
              >
                کنترل کاراکتر: {formData.characterControl}
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};