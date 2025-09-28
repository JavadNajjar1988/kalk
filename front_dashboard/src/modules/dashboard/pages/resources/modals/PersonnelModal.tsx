import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  Alert,
} from '@mui/material';
import { PersonnelItem } from '@/store/slices/tabularResourcesSlice';

interface PersonnelModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<PersonnelItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  personnel?: PersonnelItem | null;
  categories: any[];
  fields: any[];
}

const PersonnelModal: React.FC<PersonnelModalProps> = ({
  open,
  onClose,
  onSave,
  personnel,
  categories,
  fields
}) => {
  const [formData, setFormData] = useState<Partial<PersonnelItem>>({
    personalCode: '',
    firstName: '',
    lastName: '',
    nationalId: '',
    rank: '',
    unit: '',
    position: '',
    phoneNumber: '',
    email: '',
    status: 'active',
    startDate: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (personnel) {
      setFormData(personnel);
    } else {
      setFormData({
        personalCode: '',
        firstName: '',
        lastName: '',
        nationalId: '',
        rank: '',
        unit: '',
        position: '',
        phoneNumber: '',
        email: '',
        status: 'active',
        startDate: new Date().toISOString().split('T')[0],
      });
    }
    setErrors({});
  }, [personnel, open]);

  const handleChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.personalCode?.trim()) {
      newErrors.personalCode = 'کد پرسنلی الزامی است';
    }

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'نام الزامی است';
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'نام خانوادگی الزامی است';
    }

    if (!formData.nationalId?.trim()) {
      newErrors.nationalId = 'کد ملی الزامی است';
    } else if (!/^\d{10}$/.test(formData.nationalId)) {
      newErrors.nationalId = 'کد ملی باید 10 رقم باشد';
    }

    if (!formData.rank?.trim()) {
      newErrors.rank = 'درجه الزامی است';
    }

    if (!formData.unit?.trim()) {
      newErrors.unit = 'یگان الزامی است';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'تاریخ شروع خدمت الزامی است';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'فرمت ایمیل صحیح نیست';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(formData as Omit<PersonnelItem, 'id' | 'createdAt' | 'updatedAt'>);
    }
  };

  const renderField = (field: any) => {
    switch (field.type) {
      case 'select':
        const options = field.id === 'status' ? field.options : [];
        return (
          <TextField
            key={field.id}
            select
            fullWidth
            label={field.name}
            value={formData[field.id as keyof PersonnelItem] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
            error={!!errors[field.id]}
            helperText={errors[field.id]}
          >
            {field.id === 'status' && field.options?.map((option: any) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        );
      case 'date':
        return (
          <TextField
            key={field.id}
            fullWidth
            type="date"
            label={field.name}
            value={formData[field.id as keyof PersonnelItem] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
            error={!!errors[field.id]}
            helperText={errors[field.id]}
            InputLabelProps={{ shrink: true }}
          />
        );
      case 'tel':
      case 'email':
        return (
          <TextField
            key={field.id}
            fullWidth
            type={field.type}
            label={field.name}
            value={formData[field.id as keyof PersonnelItem] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
            error={!!errors[field.id]}
            helperText={errors[field.id]}
          />
        );
      default:
        return (
          <TextField
            key={field.id}
            fullWidth
            type={field.type}
            label={field.name}
            value={formData[field.id as keyof PersonnelItem] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
            error={!!errors[field.id]}
            helperText={errors[field.id]}
          />
        );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          {personnel ? 'ویرایش اطلاعات شخص' : 'افزودن شخص جدید'}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {Object.keys(errors).length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            لطفاً خطاهای فرم را اصلاح کنید
          </Alert>
        )}
        
        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            اطلاعات اصلی
          </Typography>
          <Grid container spacing={3}>
            {fields.map((field: any) => (
              <Grid item xs={12} sm={field.type === 'textarea' ? 12 : 6} key={field.id}>
                {renderField(field)}
              </Grid>
            ))}
          </Grid>
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          انصراف
        </Button>
        <Button onClick={handleSubmit} variant="contained">
          {personnel ? 'ذخیره تغییرات' : 'افزودن شخص'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PersonnelModal;