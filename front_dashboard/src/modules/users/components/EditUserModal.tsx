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
import { alpha } from '@mui/material/styles';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { User } from '../types';
import { useAppSelector } from '@/store';

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
  const accent = theme.palette.success.main;
  const dialogBackground = `linear-gradient(135deg, ${alpha(accent, 0.08)}, ${alpha(accent, 0.04)})`;
  const inputSurface =
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.background.default, 0.72)
      : alpha(theme.palette.common.white, 0.92);
  const { accessLevels } = useAppSelector((state) => state.users);
  const [formData, setFormData] = useState<Partial<User>>({});

  const getAccessLevelDescription = (level: string): string => {
    if (!level) return '';
    if (level.includes('سطح 1')) {
      return 'دسترسی کامل به تمام ماژول‌ها، مدیریت کاربران و تنظیمات سامانه.';
    }
    if (level.includes('سطح 2')) {
      return 'دسترسی عملیاتی: مدیریت/اجرای سناریوها و مشاهده کاربران، بدون دسترسی به تنظیمات حساس سامانه.';
    }
    if (level.includes('سطح 3')) {
      return 'دسترسی محدود: مشاهده داشبورد، نقشه و گزارش‌ها، بدون امکان ویرایش داده‌ها یا کاربران.';
    }
    if (level.includes('سطح 4')) {
      return 'دسترسی مهمان: فقط مشاهده‌ی محدود برخی اطلاعات، بدون هیچ عملیات مدیریتی.';
    }
    return 'سطح دسترسی سفارشی؛ سیاست‌های دسترسی آن باید در سامانه تعریف شود.';
  };

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
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          backgroundColor: theme.palette.background.paper,
          backgroundImage: dialogBackground,
          border: `1px solid ${alpha(accent, 0.24)}`,
          boxShadow: `0 20px 60px ${alpha(accent, 0.18)}`,
        },
        '& .MuiOutlinedInput-root': {
          backgroundColor: inputSurface,
          '& fieldset': {
            borderColor: alpha(accent, 0.28),
          },
          '&:hover fieldset': {
            borderColor: alpha(accent, 0.45),
          },
          '&.Mui-focused fieldset': {
            borderColor: accent,
            boxShadow: `0 0 0 3px ${alpha(accent, 0.12)}`,
          },
        },
        '& .MuiInputLabel-root.Mui-focused': {
          color: accent,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', borderBottom: `1px solid ${alpha(accent, 0.2)}`, backgroundColor: alpha(accent, 0.08) }}>
        <EditIcon sx={{ mr: 1, color: accent }} />
        <Typography component="div" variant="h6">ویرایش اطلاعات کاربر</Typography>
      </DialogTitle>
      
      <DialogContent dividers sx={{ borderColor: alpha(accent, 0.16), backgroundColor: 'transparent' }}>
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
                <MenuItem value="مدیر سیستم">سوپر ادمین</MenuItem>
                <MenuItem value="فرمانده">فرمانده</MenuItem>
                <MenuItem value="ناظر مهمان">ناظر مهمان</MenuItem>
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
                {accessLevels.map((level) => (
                  <MenuItem key={level.id} value={level.name}>
                    {level.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            {formData.systemInfo?.accessLevel && (
              <Box sx={{ mt: 1, fontSize: '0.85rem', color: 'text.secondary' }}>
                <strong>توضیح سطح دسترسی:</strong> {getAccessLevelDescription(formData.systemInfo.accessLevel)}
              </Box>
            )}
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
      
      <DialogActions sx={{ px: 3, py: 2, gap: 1, borderTop: `1px solid ${alpha(accent, 0.2)}`, backgroundColor: alpha(accent, 0.04) }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          startIcon={<CancelIcon />}
          disabled={isSaving}
          sx={{ flex: 1, borderRadius: 2, borderColor: alpha(accent, 0.35) }}
        >
          انصراف
        </Button>
        
        <Button
          onClick={handleSave}
          variant="contained"
          color="success"
          startIcon={<SaveIcon />}
          disabled={isSaving}
          sx={{ flex: 1, borderRadius: 2 }}
        >
          {isSaving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditUserModal;
