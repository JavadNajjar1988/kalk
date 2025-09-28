// Enhanced field components for personnel forms
// کامپوننت‌های فیلد پیشرفته برای فرم‌های پرسنلی

import React from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Typography,
  Alert,
  Chip
} from '@mui/material';
import { useTranslation } from '@/hooks/useTranslation';
import {
  validateEnglishOnly,
  validateNumericOnly,
  validateNationalIdByCountry,
  SUPPORTED_COUNTRIES
} from '../../utils/validationUtils';

/**
 * کامپوننت فیلد انگلیسی با اعتبارسنجی
 */
interface EnglishTextFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
}

const EnglishTextFieldComponent: React.FC<EnglishTextFieldProps> = ({
  value,
  onChange,
  label,
  required = false,
  error,
  placeholder
}) => {
  const { t } = useTranslation();
  const [localError, setLocalError] = React.useState<string>('');

  const handleChange = (newValue: string) => {
    if (newValue && !validateEnglishOnly(newValue)) {
      setLocalError('فقط حروف انگلیسی مجاز است');
    } else {
      setLocalError('');
    }
    onChange(newValue);
  };

  const displayError = error || localError;

  return (
    <TextField
      fullWidth
      label={label}
      value={value || ''}
      onChange={(e) => handleChange(e.target.value)}
      error={!!displayError}
      helperText={displayError}
      required={required}
      placeholder={placeholder || `${label} را به انگلیسی وارد کنید`}
      inputProps={{
        style: { direction: 'ltr' }, // متن انگلیسی همیشه چپ‌چین
        lang: 'en'
      }}
      sx={{
        '& .MuiInputBase-input': {
          fontFamily: '"Roboto", "Arial", sans-serif' // فونت انگلیسی
        }
      }}
    />
  );
};

/**
 * کامپوننت فیلد عددی با اعتبارسنجی
 */
interface NumericTextFieldProps {
  value: string | number;
  onChange: (value: string) => void;
  label: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
}

const NumericTextFieldComponent: React.FC<NumericTextFieldProps> = ({
  value,
  onChange,
  label,
  required = false,
  error,
  placeholder,
  minLength,
  maxLength
}) => {
  const [localError, setLocalError] = React.useState<string>('');

  const handleChange = (newValue: string) => {
    // اجازه ورود فقط اعداد
    const numericValue = newValue.replace(/\D/g, '');
    
    if (newValue && !validateNumericOnly(numericValue)) {
      setLocalError('فقط اعداد مجاز است');
    } else if (minLength && numericValue.length < minLength) {
      setLocalError(`حداقل ${minLength} رقم وارد کنید`);
    } else if (maxLength && numericValue.length > maxLength) {
      setLocalError(`حداکثر ${maxLength} رقم مجاز است`);
    } else {
      setLocalError('');
    }
    
    onChange(numericValue);
  };

  const displayError = error || localError;

  return (
    <TextField
      fullWidth
      label={label}
      value={value || ''}
      onChange={(e) => handleChange(e.target.value)}
      error={!!displayError}
      helperText={displayError}
      required={required}
      placeholder={placeholder || `${label} را وارد کنید`}
      inputProps={{
        inputMode: 'numeric',
        pattern: '[0-9]*',
        style: { direction: 'ltr' } // اعداد همیشه چپ‌چین
      }}
    />
  );
};

/**
 * کامپوننت شماره ملی شرطی بر اساس تابعیت
 */
interface ConditionalNationalIdProps {
  nationalityValue: string;
  idValue: string;
  onIdChange: (value: string) => void;
  label: string;
  required?: boolean;
  error?: string;
}

const ConditionalNationalIdComponent: React.FC<ConditionalNationalIdProps> = ({
  nationalityValue,
  idValue,
  onIdChange,
  label,
  required = false,
  error
}) => {
  const [localError, setLocalError] = React.useState<string>('');

  // پیدا کردن اطلاعات کشور
  const selectedCountry = SUPPORTED_COUNTRIES.find((c: any) => c.value === nationalityValue);
  
  const handleChange = (newValue: string) => {
    if (!nationalityValue) {
      setLocalError('ابتدا تابعیت را انتخاب کنید');
      return;
    }

    // اعتبارسنجی بر اساس کشور
    const validation = validateNationalIdByCountry(newValue, nationalityValue);
    
    if (!validation.isValid) {
      setLocalError(validation.message || 'شماره شناسایی نامعتبر است');
    } else {
      setLocalError('');
    }
    
    onIdChange(newValue);
  };

  const getPlaceholder = () => {
    if (!selectedCountry) return 'ابتدا تابعیت را انتخاب کنید';
    
    switch (selectedCountry.value) {
      case 'iranian':
        return 'کد ملی 10 رقمی ایرانی';
      case 'lebanon':
        return 'شماره شناسایی 11 رقمی لبنان';
      case 'iraq':
        return 'شماره شناسایی 12 رقمی عراق';
      case 'qatar':
        return 'شماره شناسایی 11 رقمی قطر';
      default:
        return 'شماره شناسایی ملی';
    }
  };

  const getInputLength = () => {
    switch (selectedCountry?.value) {
      case 'iranian': return { min: 10, max: 10 };
      case 'lebanon': return { min: 11, max: 11 };
      case 'iraq': return { min: 12, max: 12 };
      case 'qatar': return { min: 11, max: 11 };
      default: return { min: 6, max: 20 };
    }
  };

  const inputLength = getInputLength();
  const displayError = error || localError;

  return (
    <Box>
      {selectedCountry && (
        <Box mb={1}>
          <Chip 
            label={`${selectedCountry.flag} ${selectedCountry.label}`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>
      )}
      
      <TextField
        fullWidth
        label={label}
        value={idValue || ''}
        onChange={(e) => handleChange(e.target.value)}
        error={!!displayError}
        helperText={displayError}
        required={required}
        placeholder={getPlaceholder()}
        disabled={!nationalityValue}
        inputProps={{
          inputMode: 'numeric',
          pattern: '[0-9]*',
          minLength: inputLength.min,
          maxLength: inputLength.max,
          style: { direction: 'ltr' }
        }}
      />
      
      {selectedCountry && (
        <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
          فرمت مورد نیاز: {inputLength.min === inputLength.max 
            ? `${inputLength.min} رقم` 
            : `${inputLength.min} تا ${inputLength.max} رقم`}
        </Typography>
      )}
    </Box>
  );
};

/**
 * کامپوننت تفکیک نام و نام خانوادگی
 */
interface NameSplitFieldProps {
  firstNameValue: string;
  lastNameValue: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  required?: boolean;
  errors?: {
    firstName?: string;
    lastName?: string;
  };
}

const NameSplitFieldComponent: React.FC<NameSplitFieldProps> = ({
  firstNameValue,
  lastNameValue,
  onFirstNameChange,
  onLastNameChange,
  required = false,
  errors = {}
}) => {
  return (
    <Box display="flex" gap={2}>
      <TextField
        fullWidth
        label="نام"
        value={firstNameValue || ''}
        onChange={(e) => onFirstNameChange(e.target.value)}
        error={!!errors.firstName}
        helperText={errors.firstName}
        required={required}
        placeholder="نام را وارد کنید"
      />
      
      <TextField
        fullWidth
        label="نام خانوادگی"
        value={lastNameValue || ''}
        onChange={(e) => onLastNameChange(e.target.value)}
        error={!!errors.lastName}
        helperText={errors.lastName}
        required={required}
        placeholder="نام خانوادگی را وارد کنید"
      />
    </Box>
  );
};

/**
 * کامپوننت نام کامل دوزبانه (فارسی + انگلیسی)
 */
interface FullNameDualFieldProps {
  firstNameFa: string;
  lastNameFa: string;
  firstNameEn: string;
  lastNameEn: string;
  onFirstNameFaChange: (value: string) => void;
  onLastNameFaChange: (value: string) => void;
  onFirstNameEnChange: (value: string) => void;
  onLastNameEnChange: (value: string) => void;
  required?: boolean;
  errors?: {
    firstNameFa?: string;
    lastNameFa?: string;
    firstNameEn?: string;
    lastNameEn?: string;
  };
}

const FullNameDualFieldComponent: React.FC<FullNameDualFieldProps> = ({
  firstNameFa,
  lastNameFa,
  firstNameEn,
  lastNameEn,
  onFirstNameFaChange,
  onLastNameFaChange,
  onFirstNameEnChange,
  onLastNameEnChange,
  required = false,
  errors = {}
}) => {
  return (
    <Box>
      {/* نام فارسی */}
      <Typography variant="subtitle2" gutterBottom color="textSecondary">
        نام فارسی *
      </Typography>
      <Box display="flex" gap={2} mb={2}>
        <TextField
          fullWidth
          label="نام"
          value={firstNameFa || ''}
          onChange={(e) => onFirstNameFaChange(e.target.value)}
          error={!!errors.firstNameFa}
          helperText={errors.firstNameFa}
          required={required}
          placeholder="نام"
        />
        
        <TextField
          fullWidth
          label="نام خانوادگی"
          value={lastNameFa || ''}
          onChange={(e) => onLastNameFaChange(e.target.value)}
          error={!!errors.lastNameFa}
          helperText={errors.lastNameFa}
          required={required}
          placeholder="نام خانوادگی"
        />
      </Box>

      {/* نام انگلیسی */}
      <Typography variant="subtitle2" gutterBottom color="textSecondary">
        نام انگلیسی (اختیاری)
      </Typography>
      <Box display="flex" gap={2}>
        <EnglishTextFieldComponent
          value={firstNameEn}
          onChange={onFirstNameEnChange}
          label="First Name"
          error={errors.firstNameEn}
          placeholder="First Name"
        />
        
        <EnglishTextFieldComponent
          value={lastNameEn}
          onChange={onLastNameEnChange}
          label="Last Name"
          error={errors.lastNameEn}
          placeholder="Last Name"
        />
      </Box>
    </Box>
  );
};

// Export all components
export {
  EnglishTextFieldComponent,
  NumericTextFieldComponent,
  ConditionalNationalIdComponent,
  NameSplitFieldComponent,
  FullNameDualFieldComponent
};