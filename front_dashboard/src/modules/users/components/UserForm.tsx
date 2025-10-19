import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import type { User } from '../types';

interface UserFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => void;
  user?: User;
  mode: 'create' | 'edit';
}

const UserForm: React.FC<UserFormProps> = ({ open, onClose, onSave, user, mode }) => {
  const [formData, setFormData] = useState({
    // Personal Info
    fullName: user?.personalInfo.fullName || '',
    nationalId: user?.personalInfo.nationalId || '',
    gender: user?.personalInfo.gender || '',
    nationality: user?.personalInfo.nationality || '',
    birthDate: user?.personalInfo.birthDate || '',
    
    // Contact Info
    mobile: user?.contactInfo.mobile?.[0] || '',
    email: user?.contactInfo.email?.[0] || '',
    address: user?.contactInfo.address || '',
    postalCode: user?.contactInfo.postalCode || '',
    
    // Legal Info
    status: user?.legalInfo.status || '',
    
    // Active status
    isActive: user?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'نام و نام خانوادگی الزامی است';
    }

    if (!formData.nationalId.trim()) {
      newErrors.nationalId = 'شماره ملی الزامی است';
    } else if (!/^\d{10}$/.test(formData.nationalId)) {
      newErrors.nationalId = 'شماره ملی باید ۱۰ رقم باشد';
    }

    if (!formData.gender) {
      newErrors.gender = 'انتخاب جنسیت الزامی است';
    }

    if (!formData.nationality) {
      newErrors.nationality = 'انتخاب تابعیت الزامی است';
    }

    if (!formData.status) {
      newErrors.status = 'انتخاب وضعیت الزامی است';
    }

    if (formData.mobile && !/^09\d{9}$/.test(formData.mobile)) {
      newErrors.mobile = 'شماره موبایل معتبر نیست';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'آدرس ایمیل معتبر نیست';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
      personalInfo: {
        fullName: formData.fullName.trim(),
        nationalId: formData.nationalId.trim(),
        gender: formData.gender,
        nationality: formData.nationality,
        birthDate: formData.birthDate,
      },
      contactInfo: {
        mobile: formData.mobile ? [formData.mobile] : [],
        email: formData.email ? [formData.email] : [],
        phone: [],
        social: [],
        address: formData.address,
        postalCode: formData.postalCode,
      },
      legalInfo: {
        status: formData.status as 'نظامی' | 'آزاد' | 'غیرنظامی',
        details: {},
      },
      isActive: formData.isActive,
    };

    onSave(userData);
  };

  const handleClose = () => {
    setFormData({
      fullName: '',
      nationalId: '',
      gender: '',
      nationality: '',
      birthDate: '',
      mobile: '',
      email: '',
      address: '',
      postalCode: '',
      status: '',
      isActive: true,
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        {mode === 'create' ? 'افزودن کاربر جدید' : 'ویرایش کاربر'}
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* اطلاعات شخصی */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
              اطلاعات شخصی
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="نام و نام خانوادگی"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              error={!!errors.fullName}
              helperText={errors.fullName}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="شماره ملی"
              value={formData.nationalId}
              onChange={(e) => handleChange('nationalId', e.target.value)}
              error={!!errors.nationalId}
              helperText={errors.nationalId}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.gender} required>
              <InputLabel>جنسیت</InputLabel>
              <Select
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                label="جنسیت"
              >
                <MenuItem value="مرد">مرد</MenuItem>
                <MenuItem value="زن">زن</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.nationality} required>
              <InputLabel>تابعیت</InputLabel>
              <Select
                value={formData.nationality}
                onChange={(e) => handleChange('nationality', e.target.value)}
                label="تابعیت"
              >
                <MenuItem value="ایرانی">ایرانی</MenuItem>
                <MenuItem value="غیرایرانی">غیرایرانی</MenuItem>
                <MenuItem value="تبعه مضاعف">تبعه مضاعف</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="تاریخ تولد"
              type="date"
              value={formData.birthDate}
              onChange={(e) => handleChange('birthDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* اطلاعات تماس */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
              اطلاعات تماس
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="شماره موبایل"
              value={formData.mobile}
              onChange={(e) => handleChange('mobile', e.target.value)}
              error={!!errors.mobile}
              helperText={errors.mobile}
              placeholder="09xxxxxxxxx"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="ایمیل"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              placeholder="example@email.com"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="آدرس"
              multiline
              rows={2}
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="کد پستی"
              value={formData.postalCode}
              onChange={(e) => handleChange('postalCode', e.target.value)}
              placeholder="xxxxxxxxxx"
            />
          </Grid>

          {/* وضعیت */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
              وضعیت
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.status} required>
              <InputLabel>وضعیت</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                label="وضعیت"
              >
                <MenuItem value="نظامی">نظامی</MenuItem>
                <MenuItem value="آزاد">آزاد</MenuItem>
                <MenuItem value="غیرنظامی">غیرنظامی</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isActive}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                />
              }
              label="کاربر فعال"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose}>
          انصراف
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={Object.keys(errors).length > 0}
        >
          ذخیره
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserForm;