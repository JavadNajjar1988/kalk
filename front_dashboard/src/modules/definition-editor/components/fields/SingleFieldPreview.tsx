// Single Field Preview Component for Field Constructor Builder
// کامپوننت پیش‌نمایش تک فیلد برای سازنده فیلد هوشمند

import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';

// Types
// import type { 
//   FieldConstructorConfig, 
//   BaseFieldType,
//   DataSourceComponent,
//   InputEnhancementComponent,
//   DisplayComponent,
//   ValidationComponent
// } from '../../types/fieldConstructor';

type BaseFieldType = string;
type InputEnhancementComponent = any;
type DataSourceComponent = any;
type ValidationComponent = any;
type DisplayComponent = any;

interface SingleFieldPreviewProps {
  field: {
    id: string;
    name: string;
    englishName: string;
    baseType?: BaseFieldType;
    inputType?: string;
    isRequired?: boolean;
    order?: number;
    inputEnhancement?: InputEnhancementComponent;
    dataSource?: DataSourceComponent;
    validation?: ValidationComponent[] | ValidationComponent;
    display?: DisplayComponent;
  };
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

const SingleFieldPreview: React.FC<SingleFieldPreviewProps> = ({
  field,
  value,
  onChange,
  disabled = false
}) => {
  
  // Render based on field type
  const renderField = () => {
    const baseType = field.baseType || 'text';
    
    switch (baseType) {
      case 'text':
        return (
          <TextField
            fullWidth
            label={field.name}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.isRequired}
            disabled={disabled}
            placeholder={`وارد کردن ${field.name}`}
            helperText={field.isRequired ? 'این فیلد اجباری است' : undefined}
            variant="outlined"
          />
        );
        
      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            label={field.name}
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value) || 0)}
            required={field.isRequired}
            disabled={disabled}
            placeholder={`وارد کردن ${field.name}`}
            helperText={field.isRequired ? 'این فیلد اجباری است' : undefined}
            variant="outlined"
          />
        );
        
      case 'selection':
        const options = field.dataSource?.configuration?.staticOptions || [
          { id: 'option1', label: 'گزینه ۱', value: 'option1' },
          { id: 'option2', label: 'گزینه ۲', value: 'option2' },
          { id: 'option3', label: 'گزینه ۳', value: 'option3' }
        ];
        
        return (
          <FormControl fullWidth required={field.isRequired}>
            <InputLabel>{field.name}</InputLabel>
            <Select
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              label={field.name}
            >
              {options.map((option: any) => (
                <MenuItem key={option.id} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
        
      case 'reference':
        return (
          <TextField
            fullWidth
            label={field.name}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.isRequired}
            disabled={disabled}
            placeholder={`انتخاب ${field.name}`}
            helperText={field.dataSource?.configuration?.categoryType ? 
              `مرجع: ${field.dataSource.configuration.categoryType}` : 
              'فیلد مرجع'
            }
            variant="outlined"
            InputProps={{
              endAdornment: (
                <Chip 
                  label="مرجع" 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                />
              )
            }}
          />
        );
        
      default:
        return (
          <Alert severity="info">
            نوع فیلد: {baseType} - در حال توسعه
          </Alert>
        );
    }
  };

  // Show enhancement info if available
  const renderEnhancementInfo = () => {
    if (!field.inputEnhancement) return null;
    
    const enhancementLabels: Record<string, string> = {
      'array': 'آرایه‌ای',
      'hierarchical': 'سلسله‌مراتبی',
      'composite': 'مرکب',
      'autocomplete': 'تکمیل خودکار',
      'multiSelect': 'انتخاب چندگانه'
    };
    
    return (
      <Box sx={{ mt: 1 }}>
        <Chip 
          label={enhancementLabels[field.inputEnhancement.type] || field.inputEnhancement.type}
          size="small" 
          color="secondary" 
          variant="outlined" 
        />
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      {renderField()}
      {renderEnhancementInfo()}
      
      {/* Field metadata for debugging */}
      <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          شناسه: {field.id} | نام انگلیسی: {field.englishName} | نوع: {field.baseType}
        </Typography>
      </Box>
    </Box>
  );
};

export default SingleFieldPreview;