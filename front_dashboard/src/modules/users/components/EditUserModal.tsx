import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Avatar,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { User } from '../types';

interface EditUserModalProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onSave: (user: User, updatedData: Partial<User>) => void;
  isSaving?: boolean;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  open,
  onClose,
  onSave,
  isSaving = false,
}) => {
  const theme = useTheme();
  const [formData, setFormData] = useState<Partial<User>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        personalInfo: { ...user.personalInfo },
        contactInfo: { ...user.contactInfo },
        systemInfo: { ...user.systemInfo },
        isActive: user.isActive,
      });
    }
  }, [user]);

  if (!user) return null;

  const displayFullName =
    (user.personalInfo?.fullName || user.personalInfo?.fullNameEn || user.username || user.userCode || 'کاربر').trim();
  const initials =
    displayFullName
      .split(/\s+/)
      .filter(Boolean)
      .map(part => part[0])
      .join('') ||
    displayFullName.slice(0, 2) ||
    '؟';

  const handleChange = (field: string, value: any) => {
    const keys = field.split('.');
    setFormData(prev => {
      const newData: any = { ...prev };
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleSave = () => {
    onSave(user, formData);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'مدیر سیستم': return theme.palette.error.main;
      case 'سرپرست': return theme.palette.warning.main;
      case 'اپراتور': return theme.palette.info.main;
      case 'تحلیلگر': return theme.palette.success.main;
      case 'مهمان': return theme.palette.grey[500];
      default: return theme.palette.primary.main;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center' }}>
        <EditIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
        <Typography component="div" variant="h6">ویرایش اطلاعات کاربر</Typography>
      </DialogTitle>
      
      <DialogContent dividers>
        {/* Header با آواتار */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, p: 2, bgcolor: theme.palette.grey[50], borderRadius: 2 }}>
          <Avatar
            sx={{
              width: 60,
              height: 60,
              bgcolor: getRoleColor(user.systemInfo.role),
              fontSize: '1.5rem',
              fontWeight: 'bold',
              mr: 2,
            }}
          >
            {initials}
          </Avatar>
          
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {displayFullName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              کد کاربری: {user.userCode}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* اطلاعات شخصی */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              اطلاعات شخصی
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="نام و نام خانوادگی"
              value={formData.personalInfo?.fullName || ''}
              onChange={(e) => handleChange('personalInfo.fullName', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="نام انگلیسی (اختیاری)"
              value={formData.personalInfo?.fullNameEn || ''}
              onChange={(e) => handleChange('personalInfo.fullNameEn', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="نام پدر"
              value={formData.personalInfo?.fatherName || ''}
              onChange={(e) => handleChange('personalInfo.fatherName', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="شماره ملی"
              value={formData.personalInfo?.nationalId || ''}
              onChange={(e) => handleChange('personalInfo.nationalId', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>تابعیت</InputLabel>
              <Select
                value={formData.personalInfo?.nationality || ''}
                onChange={(e) => handleChange('personalInfo.nationality', e.target.value)}
                label="تابعیت"
              >
                <MenuItem value="ایرانی">ایرانی</MenuItem>
                <MenuItem value="غیرایرانی">غیرایرانی</MenuItem>
                <MenuItem value="تبعه مضاعف">تبعه مضاعف</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>جنسیت</InputLabel>
              <Select
                value={formData.personalInfo?.gender || ''}
                onChange={(e) => handleChange('personalInfo.gender', e.target.value)}
                label="جنسیت"
              >
                <MenuItem value="مرد">مرد</MenuItem>
                <MenuItem value="زن">زن</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* اطلاعات تماس */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
              اطلاعات تماس
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="ایمیل"
              type="email"
              value={formData.contactInfo?.email || ''}
              onChange={(e) => handleChange('contactInfo.email', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="شماره موبایل اول"
              value={formData.contactInfo?.mobile?.[0] || ''}
              onChange={(e) => {
                const newMobile = [...(formData.contactInfo?.mobile || [])];
                newMobile[0] = e.target.value;
                handleChange('contactInfo.mobile', newMobile);
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="تلفن ثابت (اختیاری)"
              value={formData.contactInfo?.landline || ''}
              onChange={(e) => handleChange('contactInfo.landline', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="کد پستی (اختیاری)"
              value={formData.contactInfo?.postalCode || ''}
              onChange={(e) => handleChange('contactInfo.postalCode', e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="آدرس (اختیاری)"
              multiline
              rows={2}
              value={formData.contactInfo?.addresses || ''}
              onChange={(e) => handleChange('contactInfo.addresses', e.target.value)}
            />
          </Grid>

          {/* اطلاعات سیستم */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
              اطلاعات سیستمی
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>نقش سیستمی</InputLabel>
              <Select
                value={formData.systemInfo?.role || ''}
                onChange={(e) => handleChange('systemInfo.role', e.target.value)}
                label="نقش سیستمی"
              >
                <MenuItem value="مدیر سیستم">مدیر سیستم</MenuItem>
                <MenuItem value="سرپرست">سرپرست</MenuItem>
                <MenuItem value="اپراتور">اپراتور</MenuItem>
                <MenuItem value="تحلیلگر">تحلیلگر</MenuItem>
                <MenuItem value="مهمان">مهمان</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>سطح دسترسی</InputLabel>
              <Select
                value={formData.systemInfo?.accessLevel || ''}
                onChange={(e) => handleChange('systemInfo.accessLevel', e.target.value)}
                label="سطح دسترسی"
              >
                <MenuItem value="سطح 1 - دسترسی کامل">سطح 1 - دسترسی کامل</MenuItem>
                <MenuItem value="سطح 2 - دسترسی عملیاتی">سطح 2 - دسترسی عملیاتی</MenuItem>
                <MenuItem value="سطح 3 - دسترسی محدود">سطح 3 - دسترسی محدود</MenuItem>
                <MenuItem value="سطح 4 - دسترسی مهمان">سطح 4 - دسترسی مهمان</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive || false}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                />
              }
              label="کاربر فعال"
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          startIcon={<CancelIcon />}
          disabled={isSaving}
          sx={{ flex: 1 }}
        >
          انصراف
        </Button>
        
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<SaveIcon />}
          disabled={isSaving}
          sx={{ flex: 1 }}
        >
          {isSaving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditUserModal;
