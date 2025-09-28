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
import type { Resource } from '../types';

interface ResourceFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (resourceData: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>) => void;
  resource?: Resource;
  mode: 'create' | 'edit';
}

const ResourceForm: React.FC<ResourceFormProps> = ({ open, onClose, onSave, resource, mode }) => {
  const [formData, setFormData] = useState({
    // Personal Info
    fullName: resource?.personalInfo?.fullName || '',
    nationalId: resource?.personalInfo?.nationalId || '',
    gender: resource?.personalInfo?.gender || '',
    nationality: resource?.personalInfo?.nationality || '',
    
    // Legal Info
    status: resource?.legalInfo.status || '',
    subStatus: resource?.legalInfo.subStatus || '',
    
    // Additional fields based on status
    militaryRank: resource?.personalInfo?.militaryInfo?.rank || '',
    militaryForce: resource?.personalInfo?.militaryInfo?.forceType || '',
    civilianOccupation: resource?.personalInfo?.civilianInfo?.occupation || '',
    
    // Active status
    isActive: resource?.isActive ?? true,
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

    if (!formData.status) {
      newErrors.status = 'انتخاب وضعیت الزامی است';
    }

    if (!formData.subStatus) {
      newErrors.subStatus = 'انتخاب وضعیت فرعی الزامی است';
    }

    if (formData.nationalId && !/^\d{10}$/.test(formData.nationalId)) {
      newErrors.nationalId = 'شماره ملی باید ۱۰ رقم باشد';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const resourceData: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'> = {
      personalInfo: {
        fullName: formData.fullName.trim(),
        nationalId: formData.nationalId.trim(),
        gender: formData.gender,
        nationality: formData.nationality,
        militaryInfo: formData.status === 'نظامی' ? {
          rank: formData.militaryRank,
          forceType: formData.militaryForce,
        } : undefined,
        civilianInfo: formData.status === 'غیرنظامی' ? {
          occupation: formData.civilianOccupation,
        } : undefined,
      },
      legalInfo: {
        status: formData.status,
        subStatus: formData.subStatus,
        details: {},
      },
      isActive: formData.isActive,
    };

    onSave(resourceData);
  };

  const handleClose = () => {
    setFormData({
      fullName: '',
      nationalId: '',
      gender: '',
      nationality: '',
      status: '',
      subStatus: '',
      militaryRank: '',
      militaryForce: '',
      civilianOccupation: '',
      isActive: true,
    });
    setErrors({});
    onClose();
  };

  const getSubStatusOptions = () => {
    const baseOptions = [
      { value: 'زنده', label: 'زنده' },
      { value: 'شهید', label: 'شهید' },
      { value: 'آسیب دیده', label: 'آسیب دیده' },
    ];
    return baseOptions;
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
        {mode === 'create' ? 'افزودن منبع جدید' : 'ویرایش منبع'}
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* اطلاعات اصلی */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
              اطلاعات اصلی
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
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
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
            <FormControl fullWidth>
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

          {/* وضعیت */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
              وضعیت
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.status} required>
              <InputLabel>وضعیت اصلی</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                label="وضعیت اصلی"
              >
                <MenuItem value="اشخاص کلیدی">اشخاص کلیدی</MenuItem>
                <MenuItem value="نظامی">نظامی</MenuItem>
                <MenuItem value="غیرنظامی">غیرنظامی</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.subStatus} required>
              <InputLabel>وضعیت فرعی</InputLabel>
              <Select
                value={formData.subStatus}
                onChange={(e) => handleChange('subStatus', e.target.value)}
                label="وضعیت فرعی"
              >
                {getSubStatusOptions().map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* اطلاعات تخصصی */}
          {formData.status === 'نظامی' && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                  اطلاعات نظامی
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>نوع نیرو</InputLabel>
                  <Select
                    value={formData.militaryForce}
                    onChange={(e) => handleChange('militaryForce', e.target.value)}
                    label="نوع نیرو"
                  >
                    <MenuItem value="ارتش">ارتش</MenuItem>
                    <MenuItem value="سپاه">سپاه</MenuItem>
                    <MenuItem value="بسیج">بسیج</MenuItem>
                    <MenuItem value="نیروی انتظامی">نیروی انتظامی</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>درجه نظامی</InputLabel>
                  <Select
                    value={formData.militaryRank}
                    onChange={(e) => handleChange('militaryRank', e.target.value)}
                    label="درجه نظامی"
                  >
                    <MenuItem value="سرباز">سرباز</MenuItem>
                    <MenuItem value="جوخه">جوخه</MenuItem>
                    <MenuItem value="ستوان دوم">ستوان دوم</MenuItem>
                    <MenuItem value="ستوان یکم">ستوان یکم</MenuItem>
                    <MenuItem value="ستوان">ستوان</MenuItem>
                    <MenuItem value="ناخدا">ناخدا</MenuItem>
                    <MenuItem value="سروان">سروان</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}

          {formData.status === 'غیرنظامی' && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                  اطلاعات غیرنظامی
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="شغل"
                  value={formData.civilianOccupation}
                  onChange={(e) => handleChange('civilianOccupation', e.target.value)}
                />
              </Grid>
            </>
          )}

          {/* تنظیمات */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isActive}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                />
              }
              label="منبع فعال"
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
          {mode === 'create' ? 'ایجاد' : 'ذخیره'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResourceForm;