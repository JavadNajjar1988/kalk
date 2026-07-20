// Phone Array Field Component
// کامپوننت آرایه شماره تلفن با قابلیت برچسب‌گذاری

import React, { useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Button,
  Typography,
  Paper,
  Chip,
  FormHelperText,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';
import {
  validatePhoneNumber,
  PHONE_LABELS,
  PhoneLabel
} from '../../utils/validationUtils';
import { PhoneEntry } from '../../types/enhancedFields';

interface PhoneArrayFieldProps {
  value: PhoneEntry[];
  onChange: (phones: PhoneEntry[]) => void;
  label: string;
  required?: boolean;
  error?: string;
  minItems?: number;
  maxItems?: number;
}

export const PhoneArrayFieldComponent: React.FC<PhoneArrayFieldProps> = ({
  value = [],
  onChange,
  label,
  required = false,
  error,
  minItems = 1,
  maxItems = 5
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ایجاد شماره جدید
  const createNewPhone = (): PhoneEntry => ({
    id: `phone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    number: '',
    label: 'mobile',
    isPrimary: value.length === 0, // اولین شماره به عنوان اصلی
    verified: false,
    notes: ''
  });

  // افزودن شماره جدید
  const handleAddPhone = () => {
    if (value.length >= maxItems) return;
    
    const newPhone = createNewPhone();
    onChange([...value, newPhone]);
  };

  // حذف شماره
  const handleRemovePhone = (phoneId: string) => {
    const updatedPhones = value.filter(phone => phone.id !== phoneId);
    
    // اگر شماره اصلی حذف شد، شماره بعدی را اصلی کن
    if (updatedPhones.length > 0 && !updatedPhones.some(p => p.isPrimary)) {
      updatedPhones[0].isPrimary = true;
    }
    
    onChange(updatedPhones);
    
    // حذف خطای مربوط به این شماره
    const newErrors = { ...errors };
    delete newErrors[phoneId];
    setErrors(newErrors);
  };

  // به‌روزرسانی شماره
  const handleUpdatePhone = (phoneId: string, field: keyof PhoneEntry, fieldValue: any) => {
    const updatedPhones = value.map(phone => {
      if (phone.id === phoneId) {
        const updatedPhone = { ...phone, [field]: fieldValue };
        
        // اعتبارسنجی شماره تلفن
        if (field === 'number') {
          const isValid = validatePhoneNumber(fieldValue);
          const newErrors = { ...errors };
          
          if (!isValid && fieldValue.trim() !== '') {
            newErrors[phoneId] = 'فرمت شماره تلفن نامعتبر است';
          } else {
            delete newErrors[phoneId];
          }
          
          setErrors(newErrors);
        }
        
        return updatedPhone;
      }
      return phone;
    });

    // اگر این شماره اصلی شد، بقیه را غیراصلی کن
    if (field === 'isPrimary' && fieldValue === true) {
      updatedPhones.forEach(phone => {
        if (phone.id !== phoneId) {
          phone.isPrimary = false;
        }
      });
    }

    onChange(updatedPhones);
  };

  // پیدا کردن اطلاعات برچسب
  const getLabelInfo = (labelValue: PhoneLabel) => {
    return PHONE_LABELS.find(label => label.value === labelValue) || PHONE_LABELS[0];
  };

  // بررسی وجود شماره اصلی
  const hasPrimaryPhone = value.some(phone => phone.isPrimary);

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        {label} {required && <span style={{ color: 'red' }}>*</span>}
      </Typography>
      
      {error && (
        <FormHelperText error sx={{ mb: 1 }}>
          {error}
        </FormHelperText>
      )}

      {/* لیست شماره‌ها */}
      {value.map((phone, index) => {
        const labelInfo = getLabelInfo(phone.label as PhoneLabel);
        const phoneError = errors[phone.id];
        
        return (
          <Paper 
            key={phone.id} 
            elevation={1} 
            sx={{ 
              p: 2, 
              mb: 2, 
              border: phone.isPrimary ? '2px solid' : '1px solid',
              borderColor: phone.isPrimary ? 'primary.main' : 'divider'
            }}
          >
            <Grid container spacing={2} alignItems="center">
              {/* آیکون و وضعیت */}
              <Grid item xs={12} sm={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip
                    label={labelInfo.icon}
                    size="small"
                    variant="outlined"
                  />
                  {phone.isPrimary && (
                    <Tooltip title="شماره اصلی">
                      <StarIcon color="primary" fontSize="small" />
                    </Tooltip>
                  )}
                </Box>
              </Grid>

              {/* شماره تلفن */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="شماره تلفن"
                  value={phone.number}
                  onChange={(e) => handleUpdatePhone(phone.id, 'number', e.target.value)}
                  error={!!phoneError}
                  helperText={phoneError}
                  placeholder="09123456789"
                  inputProps={{
                    style: { direction: 'ltr' },
                    inputMode: 'tel'
                  }}
                  InputProps={{
                    startAdornment: <PhoneIcon color="action" sx={{ mr: 1 }} />
                  }}
                />
              </Grid>

              {/* نوع شماره */}
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>نوع شماره</InputLabel>
                  <Select
                    value={phone.label}
                    onChange={(e) => handleUpdatePhone(phone.id, 'label', e.target.value)}
                    label="نوع شماره"
                  >
                    {PHONE_LABELS.map((label) => (
                      <MenuItem key={label.value} value={label.value}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <span>{label.icon}</span>
                          <span>{label.label}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* شماره اصلی */}
              <Grid item xs={12} sm={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={phone.isPrimary}
                      onChange={(e) => handleUpdatePhone(phone.id, 'isPrimary', e.target.checked)}
                      size="small"
                    />
                  }
                  label="اصلی"
                />
              </Grid>

              {/* عملیات */}
              <Grid item xs={12} sm={2}>
                <Box display="flex" justifyContent="flex-end">
                  <Tooltip title="حذف شماره">
                    <IconButton
                      onClick={() => handleRemovePhone(phone.id)}
                      color="error"
                      size="small"
                      disabled={value.length <= minItems}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>

              {/* یادداشت (اختیاری) */}
              {phone.notes !== undefined && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="یادداشت"
                    value={phone.notes}
                    onChange={(e) => handleUpdatePhone(phone.id, 'notes', e.target.value)}
                    placeholder="یادداشت اختیاری..."
                    multiline
                    rows={1}
                  />
                </Grid>
              )}
            </Grid>
          </Paper>
        );
      })}

      {/* دکمه افزودن */}
      {value.length < maxItems && (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddPhone}
          fullWidth
          sx={{ mt: 1 }}
        >
          افزودن شماره تلفن
        </Button>
      )}

      {/* راهنما */}
      <Box mt={2}>
        <Typography variant="caption" color="textSecondary">
          • حداقل {minItems} و حداکثر {maxItems} شماره تلفن
        </Typography>
        <br />
        <Typography variant="caption" color="textSecondary">
          • یکی از شماره‌ها باید به عنوان شماره اصلی انتخاب شود
        </Typography>
        {!hasPrimaryPhone && value.length > 0 && (
          <Typography variant="caption" color="error" display="block">
            ⚠️ لطفاً یکی از شماره‌ها را به عنوان اصلی انتخاب کنید
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default PhoneArrayFieldComponent;