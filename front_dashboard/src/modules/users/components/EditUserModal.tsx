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
  buildResourcesFormDialogSx,
  resourcesDialogContentDividersSx,
  resourcesDialogActionsSx,
  resourcesOutlinedCancelButtonSx,
} from '@/modules/dashboard/pages/resources/resourcesDialogStyles';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { User } from '../types';
import { useAppSelector } from '@/store';
import AvatarPicker from './AvatarPicker';
import { resolveAvatarSrc } from '../utils/avatarOptions';
import { getAccessLevelColor, getRoleProfile, getUserInitials } from '../utils/userPresentation';

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
  const { roles } = useAppSelector((state) => state.users);
  const [formData, setFormData] = useState<Partial<User>>({});
  const accent = getAccessLevelColor(theme, formData.systemInfo?.accessLevel || user?.systemInfo?.accessLevel);

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
  const initials = getUserInitials(displayFullName, '؟');

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

  const handleRoleChange = (role: string) => {
    const profile = getRoleProfile(role, roles);
    handleChange('systemInfo', {
      ...(formData.systemInfo || user.systemInfo),
      role: profile.role,
      accessLevel: profile.accessLevel,
      permissions: profile.permissions,
    });
  };
  const accessColor = getAccessLevelColor(theme, formData.systemInfo?.accessLevel || user.systemInfo.accessLevel);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={buildResourcesFormDialogSx(theme)}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', borderBottom: `1px solid ${alpha(accent, 0.2)}`, backgroundColor: alpha(accent, 0.08) }}>
        <EditIcon sx={{ mr: 1, color: accent }} />
        <Typography component="div" variant="h6">ویرایش اطلاعات کاربر</Typography>
      </DialogTitle>
      
      <DialogContent dividers sx={resourcesDialogContentDividersSx(theme)}>
        {/* Header با آواتار */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, p: 2, bgcolor: theme.palette.grey[50], borderRadius: 2 }}>
          <Avatar
            src={resolveAvatarSrc(formData.personalInfo?.avatar)}
            sx={{
              width: 60,
              height: 60,
              bgcolor: accessColor,
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
          <Grid item xs={12}>
            <Box sx={{ p: 2, border: `1px solid ${alpha(accessColor, 0.25)}`, borderRadius: 2, bgcolor: alpha(accessColor, 0.04) }}>
              <AvatarPicker
                value={formData.personalInfo?.avatar}
                accessLevel={formData.systemInfo?.accessLevel}
                onChange={(avatar) => handleChange('personalInfo.avatar', avatar)}
                disabled={isSaving}
              />
            </Box>
          </Grid>
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
                onChange={(e) => handleRoleChange(e.target.value)}
                label="نقش سیستمی"
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.name}>{role.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="سطح دسترسی"
              value={formData.systemInfo?.accessLevel || ''}
              InputProps={{ readOnly: true }}
              helperText="سطح دسترسی و مجوزها از نقش انتخاب‌شده تعیین می‌شوند."
              sx={{
                '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(accessColor, 0.55) },
                '& .MuiInputBase-input': { color: accessColor, fontWeight: 700 },
              }}
            />
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
      
      <DialogActions sx={resourcesDialogActionsSx(theme)}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          startIcon={<CancelIcon />}
          disabled={isSaving}
          sx={{ ...resourcesOutlinedCancelButtonSx(theme), flex: 1 }}
        >
          انصراف
        </Button>
        
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
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
