
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Chip,
  Divider,
  Alert,
  Button,
  alpha,
  useTheme,
  Checkbox,
  ListItemText,
  ListSubheader,
  Radio,
  RadioGroup,
  Slider
} from '@mui/material';
import {
  Visibility as PreviewIcon,
  Edit as EditIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import { SmartFieldConfig, FieldContext, EnhancementType } from '../../../types/smartFieldTypes';

interface PreviewStepProps {
  config: Partial<SmartFieldConfig>;
  onConfigUpdate: (updates: Partial<SmartFieldConfig>) => void;
  fieldContext: FieldContext;
  errors: Record<string, string>;
  editingField?: SmartFieldConfig | null;
}

const PreviewStep: React.FC<PreviewStepProps> = ({
  config,
  onConfigUpdate,
  fieldContext,
  errors,
  editingField
}) => {
  const theme = useTheme();
  const [previewValue, setPreviewValue] = useState<any>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Update preview when config changes (especially Final Settings)
  useEffect(() => {
    // Force re-render of the preview when final settings change
    // This ensures the live preview reflects changes made in the Final Settings section
    setPreviewValue(''); // Reset preview value to trigger re-render
  }, [config.name, config.placeholder, config.helpText, config.isRequired]);

  // Generate field ID if not exists
  const ensureFieldId = () => {
    if (!config.id) {
      const englishName = config.englishName || 'field';
      const fieldId = `field_${englishName}_${Date.now()}`;
      onConfigUpdate({ id: fieldId });
    }
  };

  // Auto-generate English name if not exists
  const ensureEnglishName = () => {
    if (!config.englishName && config.name) {
      const englishName = generateEnglishName(config.name);
      onConfigUpdate({ englishName });
    }
  };

  // Generate English name from Persian
  const generateEnglishName = (persianName: string): string => {
    const transliterationMap: Record<string, string> = {
      'آ': 'a', 'ا': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's', 'ج': 'j',
      'چ': 'ch', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z',
      'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'z', 'ط': 't', 'ظ': 'z',
      'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'gh', 'ک': 'k', 'گ': 'g', 'ل': 'l',
      'م': 'm', 'ن': 'n', 'و': 'v', 'ه': 'h', 'ی': 'i', 'ء': '', ' ': '_'
    };

    return persianName
      .split('')
      .map(char => transliterationMap[char] || char)
      .join('')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') || 'field';
  };


  // Helper function to render choice enhancement information
  const renderChoiceEnhancementInfo = (
    hasSearchable: boolean, 
    hasGrouped: boolean, 
    searchableConfig: any, 
    groupedConfig: any
  ) => {
    if (!hasSearchable && !hasGrouped) return null;

    return (
      <Box sx={{ mt: 2, p: 1.5, backgroundColor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
          💡 ویژگی‌های فعال:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
          {hasSearchable && (
            <Chip 
              label={`جستجو (${searchableConfig?.minChars || 2}+ کاراکتر, حداکثر ${searchableConfig?.maxSuggestions || 10} پیشنهاد)`} 
              size="small" 
              color="info" 
              variant="outlined" 
            />
          )}
          {hasGrouped && groupedConfig?.groups && (
            <Chip 
              label={`${groupedConfig.groups.length} گروه با ${groupedConfig.groupSortOrder === 'alphabetical' ? 'ترتیب الفبایی' : 'ترتیب سفارشی'}`} 
              size="small" 
              color="warning" 
              variant="outlined" 
            />
          )}
        </Box>
        {hasSearchable && searchableConfig && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              تنظیمات جستجو:
            </Typography>
            <Typography variant="caption" color="primary" sx={{ display: 'block', ml: 1 }}>
              • {searchableConfig.caseSensitive ? 'حساس به حروف' : 'غیرحساس به حروف'}
            </Typography>
            <Typography variant="caption" color="primary" sx={{ display: 'block', ml: 1 }}>
              • {searchableConfig.highlightMatches ? 'برجسته‌سازی فعال' : 'برجسته‌سازی غیرفعال'}
            </Typography>
          </Box>
        )}
        {hasGrouped && groupedConfig?.groups && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              گروه‌ها:
            </Typography>
            {groupedConfig.groups.slice(0, 3).map((group: any, index: number) => (
              <Typography key={index} variant="caption" color="primary" sx={{ display: 'block', ml: 1 }}>
                • {group.name} {group.description && `(${group.description})`}
              </Typography>
            ))}
            {groupedConfig.groups.length > 3 && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 1 }}>
                و {groupedConfig.groups.length - 3} گروه دیگر...
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 1, mt: 0.5 }}>
              • {groupedConfig.showGroupHeaders ? 'عناوین گروه نمایش داده می‌شود' : 'عناوین گروه مخفی'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 1 }}>
              • {groupedConfig.allowUngrouped ? 'گزینه‌های بدون گروه مجاز' : 'فقط گزینه‌های گروه‌بندی‌شده'}
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  // Render live preview of the field
  const renderFieldPreview = () => {
    // Use the current config values that include Final Settings changes
    const fieldProps = {
      label: config.name || 'نام فیلد',
      required: config.isRequired || false,
      error: false,
      helperText: config.helpText || config.description,
      placeholder: config.placeholder,
      value: previewValue,
      onChange: (e: any) => setPreviewValue(e.target.value || e.target.checked),
      fullWidth: true,
      size: 'medium' as const
    };

    switch (config.baseType) {
      case 'text':
        const hasMultiline = config.enhancements?.some(e => e.type === EnhancementType.MULTILINE && e.enabled);
        const multilineConfig = config.enhancements?.find(e => e.type === EnhancementType.MULTILINE)?.config;
        const hasComposite = config.enhancements?.some(e => e.type === EnhancementType.COMPOSITE && e.enabled);
        const compositeConfig = config.enhancements?.find(e => e.type === EnhancementType.COMPOSITE)?.config;
        
        if (hasComposite && compositeConfig?.parts) {
          // Render composite field with multiple parts
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {config.name || 'فیلد ترکیبی'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                {compositeConfig.parts.map((part: any, index: number) => {
                  const partValue = Array.isArray(previewValue) ? previewValue[index] : '';
                  const partProps = {
                    key: part.id,
                    size: 'small' as const,
                    sx: { minWidth: 120, flex: 1 },
                    value: partValue,
                    onChange: (e: any) => {
                      const newValues = Array.isArray(previewValue) ? [...previewValue] : [];
                      newValues[index] = e.target.value;
                      setPreviewValue(newValues);
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
        
        return (
          <Box>
            <TextField
              {...fieldProps}
              multiline={hasMultiline}
              rows={hasMultiline ? (multilineConfig?.rows || 3) : undefined}
              maxRows={hasMultiline ? (multilineConfig?.maxRows || 6) : undefined}
              variant="outlined"
            />
            {hasMultiline && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                فیلد چندخطی فعال است
              </Typography>
            )}
          </Box>
        );

      case 'number':
        // Check for number enhancements
        const hasRange = config.enhancements?.some(e => e.type === EnhancementType.RANGE && e.enabled);
        const rangeConfig = config.enhancements?.find(e => e.type === EnhancementType.RANGE)?.config;
        const hasUnit = config.enhancements?.some(e => e.type === EnhancementType.UNIT && e.enabled);
        const unitConfig = config.enhancements?.find(e => e.type === EnhancementType.UNIT)?.config;
        const hasDecimal = config.enhancements?.some(e => e.type === EnhancementType.DECIMAL && e.enabled);
        const decimalConfig = config.enhancements?.find(e => e.type === EnhancementType.DECIMAL)?.config;
        
        // Apply number field enhancements
        const numberFieldProps = {
          ...fieldProps,
          type: "number",
          variant: "outlined" as const,
          InputProps: {} as any
        };
        
        // Apply range validation if enabled
        if (hasRange && rangeConfig) {
          if (rangeConfig.min !== undefined) {
            numberFieldProps.InputProps.inputProps = {
              ...numberFieldProps.InputProps.inputProps,
              min: rangeConfig.min
            };
          }
          if (rangeConfig.max !== undefined) {
            numberFieldProps.InputProps.inputProps = {
              ...numberFieldProps.InputProps.inputProps,
              max: rangeConfig.max
            };
          }
          // Apply step if defined
          if (rangeConfig.step !== undefined) {
            numberFieldProps.InputProps.inputProps = {
              ...numberFieldProps.InputProps.inputProps,
              step: rangeConfig.step
            };
          }
        }
        
        // Apply decimal precision if enabled
        if (hasDecimal && decimalConfig) {
          // For display purposes, we can show the decimal info
          if (decimalConfig.places !== undefined) {
            numberFieldProps.helperText = `${fieldProps.helperText || ''} (حداکثر ${decimalConfig.places} رقم اعشار)`.trim();
          }
        }
        
        return (
          <Box>
            {hasUnit && unitConfig?.unit ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {unitConfig.display === 'before' && (
                  <Typography 
                    variant="body1" 
                    color="text.secondary"
                    sx={{ 
                      px: 1, 
                      py: 0.5, 
                      backgroundColor: 'grey.100', 
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'grey.300'
                    }}
                  >
                    {unitConfig.unit}
                  </Typography>
                )}
                <TextField {...numberFieldProps} />
                {unitConfig.display === 'after' && (
                  <Typography 
                    variant="body1" 
                    color="text.secondary"
                    sx={{ 
                      px: 1, 
                      py: 0.5, 
                      backgroundColor: 'grey.100', 
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'grey.300'
                    }}
                  >
                    {unitConfig.unit}
                  </Typography>
                )}
              </Box>
            ) : (
              <TextField {...numberFieldProps} />
            )}
            
            {/* Decimal information */}
            {hasDecimal && decimalConfig && (
              <Box sx={{ 
                display: 'inline-block', 
                mt: 1, 
                px: 1, 
                py: 0.5, 
                backgroundColor: 'grey.100', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.300'
              }}>
                <Typography variant="caption" color="text.secondary">
                  اعشاری: {decimalConfig.places !== undefined ? `${decimalConfig.places} رقم` : ''}
                  {decimalConfig.thousandsSeparator && ` (هزارگان: ${decimalConfig.thousandsSeparator === ' ' ? 'فاصله' : decimalConfig.thousandsSeparator})`}
                  {decimalConfig.allowNegative && ' (منفی مجاز)'}
                </Typography>
              </Box>
            )}
            
            {/* Range information */}
            {hasRange && rangeConfig && (
              <Box sx={{ 
                display: 'inline-block', 
                mt: 1, 
                px: 1, 
                py: 0.5, 
                backgroundColor: 'grey.100', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.300'
              }}>
                <Typography variant="caption" color="text.secondary">
                  محدوده: {rangeConfig.min !== undefined ? `${rangeConfig.min}` : 'حداقل'} 
                  {' - '}
                  {rangeConfig.max !== undefined ? `${rangeConfig.max}` : 'حداکثر'}
                  {rangeConfig.step !== undefined && rangeConfig.step !== 1 ? ` (گام: ${rangeConfig.step})` : ''}
                </Typography>
              </Box>
            )}
          </Box>
        );

      case 'choice':
        const hasSingle = config.enhancements?.some(e => e.type === EnhancementType.SINGLE && e.enabled);
        const hasMultiple = config.enhancements?.some(e => e.type === EnhancementType.MULTIPLE && e.enabled);
        const hasSearchable = config.enhancements?.some(e => e.type === EnhancementType.SEARCHABLE && e.enabled);
        const hasGrouped = config.enhancements?.some(e => e.type === EnhancementType.GROUPED && e.enabled);
        const singleConfig = config.enhancements?.find(e => e.type === EnhancementType.SINGLE)?.config;
        const searchableConfig = config.enhancements?.find(e => e.type === EnhancementType.SEARCHABLE)?.config;
        const groupedConfig = config.enhancements?.find(e => e.type === EnhancementType.GROUPED)?.config;
        const options = config.dataSource?.config.items || [
          { id: '1', label: 'گزینه ۱' },
          { id: '2', label: 'گزینه ۲' },
          { id: '3', label: 'گزینه ۳' }
        ];

        // Group options if grouped enhancement is enabled
        const groupedOptions = hasGrouped && groupedConfig?.groups ? 
          groupedConfig.groups.map(group => ({
            groupName: group.name,
            options: (group.options || []).map(optionLabel => 
              options.find(opt => opt.label === optionLabel) || { id: optionLabel, label: optionLabel }
            )
          })) : null;

        // Get ungrouped options
        const ungroupedOptions = hasGrouped && groupedConfig?.ungroupedOptions ?
          (groupedConfig.ungroupedOptions || []).map(optionLabel => 
            options.find(opt => opt.label === optionLabel) || { id: optionLabel, label: optionLabel }
          ) : (hasGrouped ? [] : options);

        // Single selection enhancement
        if (hasSingle) {
          const displayStyle = singleConfig?.displayStyle || 'dropdown';
          
          if (displayStyle === 'radio') {
            return (
              <Box>
                <Typography variant="subtitle2" gutterBottom>{config.name}</Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    value={previewValue}
                    onChange={(e) => setPreviewValue(e.target.value)}
                  >
                    {hasGrouped && groupedOptions ? (
                      groupedOptions.map((group, groupIndex) => (
                        <Box key={groupIndex}>
                          {groupedConfig?.showGroupHeaders && (
                            <Typography variant="caption" color="primary" sx={{ fontWeight: 600, mt: 1, display: 'block' }}>
                              {group.groupName}
                            </Typography>
                          )}
                          {group.options.map((option) => (
                            <FormControlLabel
                              key={option.id}
                              value={option.label}
                              control={<Radio size={singleConfig?.compact ? 'small' : 'medium'} />}
                              label={option.label}
                              sx={{ ml: groupedConfig?.showGroupHeaders ? 2 : 0 }}
                            />
                          ))}
                        </Box>
                      ))
                    ) : (
                      options.map((option) => (
                        <FormControlLabel
                          key={option.id}
                          value={option.label}
                          control={<Radio size={singleConfig?.compact ? 'small' : 'medium'} />}
                          label={option.label}
                        />
                      ))
                    )}
                  </RadioGroup>
                </FormControl>
                {renderChoiceEnhancementInfo(hasSearchable, hasGrouped, searchableConfig, groupedConfig)}
              </Box>
            );
          }
          
          if (displayStyle === 'button') {
            return (
              <Box>
                <Typography variant="subtitle2" gutterBottom>{config.name}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {hasGrouped && groupedOptions ? (
                    groupedOptions.map((group, groupIndex) => (
                      <Box key={groupIndex} sx={{ width: '100%' }}>
                        {groupedConfig?.showGroupHeaders && (
                          <Typography variant="caption" color="primary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                            {group.groupName}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                          {group.options.map((option) => (
                            <Button
                              key={option.id}
                              variant={previewValue === option.label ? 'contained' : 'outlined'}
                              size={singleConfig?.compact ? 'small' : 'medium'}
                              onClick={() => setPreviewValue(option.label)}
                            >
                              {option.label}
                            </Button>
                          ))}
                        </Box>
                      </Box>
                    ))
                  ) : (
                    options.map((option) => (
                      <Button
                        key={option.id}
                        variant={previewValue === option.label ? 'contained' : 'outlined'}
                        size={singleConfig?.compact ? 'small' : 'medium'}
                        onClick={() => setPreviewValue(option.label)}
                      >
                        {option.label}
                      </Button>
                    ))
                  )}
                </Box>
                {renderChoiceEnhancementInfo(hasSearchable, hasGrouped, searchableConfig, groupedConfig)}
              </Box>
            );
          }
          
          // Default dropdown for single selection
          return (
            <Box>
              <FormControl fullWidth>
                <InputLabel>{config.name}</InputLabel>
                <Select
                  value={previewValue}
                  onChange={(e) => setPreviewValue(e.target.value)}
                >
                  {hasGrouped && groupedOptions ? (
                    groupedOptions.map((group, groupIndex) => [
                      groupedConfig?.showGroupHeaders && (
                        <ListSubheader key={`header-${groupIndex}`}>{group.groupName}</ListSubheader>
                      ),
                      ...group.options.map((option) => (
                        <MenuItem key={option.id} value={option.label}>
                          {option.label}
                        </MenuItem>
                      ))
                    ]).flat().filter(Boolean)
                  ) : (
                    options.map((option) => (
                      <MenuItem key={option.id} value={option.label}>
                        {option.label}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              {renderChoiceEnhancementInfo(hasSearchable, hasGrouped, searchableConfig, groupedConfig)}
            </Box>
          );
        }

        // Multiple selection enhancement
        if (hasMultiple) {
          return (
            <Box>
              <FormControl fullWidth>
                <InputLabel>{config.name}</InputLabel>
                <Select
                  multiple
                  value={Array.isArray(previewValue) ? previewValue : []}
                  onChange={(e) => setPreviewValue(e.target.value)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip 
                          key={value} 
                          label={value} 
                          size="small" 
                          onDelete={() => {
                            const newValue = (previewValue as string[]).filter(v => v !== value);
                            setPreviewValue(newValue);
                          }}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  )}
                >
                  {hasGrouped && groupedOptions ? (
                    [
                      ...groupedOptions.map((group, groupIndex) => [
                        groupedConfig?.showGroupHeaders && (
                          <ListSubheader key={`header-${groupIndex}`}>{group.groupName}</ListSubheader>
                        ),
                        ...group.options.map((option) => (
                          <MenuItem key={option.id} value={option.label}>
                            <Checkbox 
                              checked={Array.isArray(previewValue) && previewValue.includes(option.label)} 
                              color="primary"
                            />
                            <ListItemText primary={option.label} />
                          </MenuItem>
                        ))
                      ]).flat().filter(Boolean),
                      // Add ungrouped options if allowed
                      ...(groupedConfig?.allowUngrouped && ungroupedOptions.length > 0 ? [
                        groupedConfig?.showGroupHeaders && (
                          <ListSubheader key="ungrouped-header">بدون گروه</ListSubheader>
                        ),
                        ...ungroupedOptions.map((option) => (
                          <MenuItem key={`ungrouped-${option.id}`} value={option.label}>
                            <Checkbox 
                              checked={Array.isArray(previewValue) && previewValue.includes(option.label)} 
                              color="primary"
                            />
                            <ListItemText primary={option.label} />
                          </MenuItem>
                        ))
                      ].filter(Boolean) : [])
                    ].flat()
                  ) : (
                    options.map((option) => (
                      <MenuItem key={option.id} value={option.label}>
                        <Checkbox 
                          checked={Array.isArray(previewValue) && previewValue.includes(option.label)} 
                          color="primary"
                        />
                        <ListItemText primary={option.label} />
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              {/* Enhanced info display */}
              <Box sx={{ mt: 2, p: 1.5, backgroundColor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                  💡 ویژگی‌های فعال:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  <Chip label="انتخاب چندگانه" size="small" color="success" variant="outlined" />
                  {hasSearchable && (
                    <Chip label={`جستجو (${searchableConfig?.minChars || 2}+ کاراکتر)`} size="small" color="info" variant="outlined" />
                  )}
                  {hasGrouped && groupedConfig?.groups && (
                    <Chip label={`${groupedConfig.groups.length} گروه`} size="small" color="warning" variant="outlined" />
                  )}
                </Box>
                {hasGrouped && groupedConfig?.groups && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      گروه‌ها:
                    </Typography>
                    {groupedConfig.groups.slice(0, 2).map((group: any, index: number) => (
                      <Typography key={index} variant="caption" color="primary" sx={{ display: 'block', ml: 1 }}>
                        • {group.name}: {(group.options || []).slice(0, 3).join('، ')} {(group.options || []).length > 3 ? '...' : ''}
                      </Typography>
                    ))}
                    {groupedConfig.groups.length > 2 && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 1 }}>
                        و {groupedConfig.groups.length - 2} گروه دیگر...
                      </Typography>
                    )}
                    {groupedConfig.ungroupedOptions && groupedConfig.ungroupedOptions.length > 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 1, mt: 0.5 }}>
                        • {groupedConfig.ungroupedOptions.length} گزینه بدون گروه
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 1, mt: 0.5 }}>
                      • {groupedConfig.showGroupHeaders ? 'عناوین گروه نمایش داده می‌شود' : 'عناوین گروه مخفی'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 1 }}>
                      • {groupedConfig.allowUngrouped ? 'گزینه‌های بدون گروه مجاز' : 'فقط گزینه‌های گروه‌بندی‌شده'}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          );
        }

        // Default single selection (when no specific enhancement is enabled)
        return (
          <Box>
            <FormControl fullWidth>
              <InputLabel>{config.name}</InputLabel>
              <Select
                value={previewValue}
                onChange={(e) => setPreviewValue(e.target.value)}
              >
                {hasGrouped && groupedOptions ? (
                  groupedOptions.map((group, groupIndex) => [
                    groupedConfig?.showGroupHeaders && (
                      <ListSubheader key={`header-${groupIndex}`}>{group.groupName}</ListSubheader>
                    ),
                    ...group.options.map((option) => (
                      <MenuItem key={option.id} value={option.label}>
                        {option.label}
                      </MenuItem>
                    ))
                  ]).flat().filter(Boolean)
                ) : (
                  options.map((option) => (
                    <MenuItem key={option.id} value={option.label}>
                      {option.label}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
            {renderChoiceEnhancementInfo(hasSearchable, hasGrouped, searchableConfig, groupedConfig)}
          </Box>
        );

      case 'reference':
        // Check for reference enhancements
        const hasSearchableRef = config.enhancements?.some(e => e.type === EnhancementType.SEARCHABLE_REF && e.enabled);
        const hasHierarchicalRef = config.enhancements?.some(e => e.type === EnhancementType.HIERARCHICAL && e.enabled);
        const hasFreeTextRef = config.enhancements?.some(e => e.type === EnhancementType.FREE_TEXT && e.enabled);
        const searchableRefConfig = config.enhancements?.find(e => e.type === EnhancementType.SEARCHABLE_REF)?.config;
        const hierarchicalRefConfig = config.enhancements?.find(e => e.type === EnhancementType.HIERARCHICAL)?.config;
        const freeTextRefConfig = config.enhancements?.find(e => e.type === EnhancementType.FREE_TEXT)?.config;
        
        return (
          <Box>
            <FormControl fullWidth>
              <InputLabel>{config.name}</InputLabel>
              <Select
                value={previewValue}
                onChange={(e) => setPreviewValue(e.target.value)}
              >
                <MenuItem value="ref1">مرجع نمونه ۱</MenuItem>
                <MenuItem value="ref2">مرجع نمونه ۲</MenuItem>
                <MenuItem value="ref3">مرجع نمونه ۳</MenuItem>
              </Select>
            </FormControl>
            {hasSearchableRef && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                قابلیت جستجو فعال است
                {searchableRefConfig?.minChars && ` (حداقل ${searchableRefConfig.minChars} کاراکتر)`}
              </Typography>
            )}
            {hasHierarchicalRef && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                ساختار سلسله‌مراتبی فعال است
                {hierarchicalRefConfig?.maxDepth && ` (حداکثر عمق: ${hierarchicalRefConfig.maxDepth})`}
              </Typography>
            )}
            {hasFreeTextRef && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                ورود متن آزاد فعال است
              </Typography>
            )}
          </Box>
        );

      default:
        return (
          <TextField
            {...fieldProps}
            variant="outlined"
          />
        );
    }
  };

  // Get enhancement label by type
  const getEnhancementLabel = (enhancementType: string): string => {
    const labels: Record<string, string> = {
      'multiline': 'چندخطی',
      'composite': 'ترکیبی',
      'range': 'محدوده',
      'unit': 'واحد',
      'decimal': 'اعشاری',
      'multiple': 'انتخاب چندگانه',
      'searchable': 'جستجوپذیر',
      'grouped': 'گروه‌بندی شده',
      'hierarchical': 'سلسله‌مراتبی',
      'free_text': 'متن آزاد',
      'searchable_ref': 'مرجع جستجوپذیر'
    };
    return labels[enhancementType] || enhancementType;
  };

  // Get configuration summary
  const getConfigSummary = () => {
    const summary = {
      baseInfo: {
        name: config.name || 'نامشخص',
        englishName: config.englishName || 'نامشخص',
        type: config.baseType || 'نامشخص',
        required: config.isRequired ? 'بله' : 'خیر'
      },
      enhancements: config.enhancements?.filter(e => e.enabled).map(e => getEnhancementLabel(e.type)).join('، ') || 'هیچکدام',
      dataSource: config.dataSource ? config.dataSource.type : 'تعریف نشده',
      validation: config.validation?.length || 0
    };
    return summary;
  };

  // Check if configuration is complete
  const isConfigComplete = () => {
    return !!(config.name && config.englishName && config.baseType);
  };

  const summary = getConfigSummary();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom fontWeight={600}>
        پیش‌نمایش نهایی
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        فیلد ساخته شده را بررسی کنید و در صورت نیاز تغییرات نهایی اعمال کنید.
      </Typography>

      {/* Content area without internal scroll */}
      <Box 
        className="muirtl-1hyfaen"
        sx={{ 
          flex: 1
        }}
      >

      <Grid container spacing={3}>
        {/* Live Preview */}
        <Grid item xs={12}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PreviewIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  پیش‌نمایش زنده
                </Typography>
              </Box>
              
              <Box sx={{ 
                p: 3, 
                backgroundColor: alpha(theme.palette.grey[100], 0.5),
                borderRadius: 1,
                border: `1px dashed ${alpha(theme.palette.grey[400], 0.5)}`
              }}>
                {isConfigComplete() ? (
                  renderFieldPreview()
                ) : (
                  <Alert severity="warning">
                    برای نمایش پیش‌نمایش، ابتدا اطلاعات پایه فیلد را تکمیل کنید.
                  </Alert>
                )}
              </Box>
              
              {isConfigComplete() && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  این پیش‌نمایش نحوه نمایش فیلد در فرم‌های واقعی را نشان می‌دهد.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Configuration Summary */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <InfoIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  خلاصه تنظیمات
                </Typography>
              </Box>
              
              {/* Basic Info */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  اطلاعات پایه
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      نام: <strong>{summary.baseInfo.name}</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      نام انگلیسی: <strong>{summary.baseInfo.englishName}</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      نوع: <strong>{summary.baseInfo.type}</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      اجباری: <strong>{summary.baseInfo.required}</strong>
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Enhancements */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  ویژگی‌های اضافه
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {summary.enhancements}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Data Source */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  منبع داده
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {summary.dataSource}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Validation */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  قوانین اعتبارسنجی
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {summary.validation} قانون تعریف شده
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Final Settings */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <EditIcon sx={{ mr: 1, color: 'secondary.main' }} />
            <Typography variant="h6" fontWeight={600}>
              تنظیمات نهایی
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="نام فیلد (فارسی)"
                value={config.name || ''}
                onChange={(e) => onConfigUpdate({ name: e.target.value })}
                fullWidth
                required
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="نام فیلد (انگلیسی)"
                value={config.englishName || ''}
                onChange={(e) => onConfigUpdate({ englishName: e.target.value })}
                fullWidth
                required
                error={!!errors.englishName}
                helperText={errors.englishName}
                InputProps={{
                  endAdornment: (
                    <Button
                      size="small"
                      onClick={ensureEnglishName}
                      disabled={!config.name}
                    >
                      تولید خودکار
                    </Button>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="ترتیب نمایش"
                type="number"
                value={config.order || 1}
                onChange={(e) => onConfigUpdate({ order: parseInt(e.target.value) || 1 })}
                fullWidth
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.isRequired || false}
                    onChange={(e) => onConfigUpdate({ isRequired: e.target.checked })}
                  />
                }
                label="فیلد اجباری"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="متن راهنما (Placeholder)"
                value={config.placeholder || ''}
                onChange={(e) => onConfigUpdate({ placeholder: e.target.value })}
                fullWidth
                helperText="متن راهنمایی که در فیلد خالی نمایش داده می‌شود"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="متن کمکی"
                value={config.helpText || ''}
                onChange={(e) => onConfigUpdate({ helpText: e.target.value })}
                fullWidth
                multiline
                rows={2}
                helperText="متن کمکی که زیر فیلد نمایش داده می‌شود"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Status Check */}
      {isConfigComplete() ? (
        <Alert severity="success" sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckIcon sx={{ mr: 1 }} />
            <Typography variant="body2" fontWeight={600}>
              فیلد آماده ساخت است! می‌توانید روی "تکمیل ساخت فیلد" کلیک کنید.
            </Typography>
          </Box>
        </Alert>
      ) : (
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>نیاز به تکمیل:</strong> لطفاً نام فیلد، نام انگلیسی و نوع پایه را تکمیل کنید.
          </Typography>
        </Alert>
      )}
      </Box>
    </Box>
  );
};

export default PreviewStep;