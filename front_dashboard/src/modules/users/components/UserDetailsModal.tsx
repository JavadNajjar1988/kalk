import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Avatar,
  Divider,
  Grid,
  useTheme,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { User } from '../types';
import FarsiNumber from '@/components/common/FarsiNumber';

interface UserDetailsModalProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  user,
  open,
  onClose,
}) => {
  const theme = useTheme();

  if (!user) return null;

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

  const getAccessLevelColor = (accessLevel: string) => {
    if (accessLevel.includes('سطح 1')) return theme.palette.error.main;
    if (accessLevel.includes('سطح 2')) return theme.palette.warning.main;
    if (accessLevel.includes('سطح 3')) return theme.palette.info.main;
    if (accessLevel.includes('سطح 4')) return theme.palette.success.main;
    return theme.palette.grey[500];
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PersonIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h6">جزئیات کاربر</Typography>
        </Box>
        <Chip
          label={user.isActive ? 'فعال' : 'غیرفعال'}
          color={user.isActive ? 'success' : 'error'}
          size="small"
        />
      </DialogTitle>
      
      <DialogContent dividers>
        {/* Header با آواتار */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, p: 2, bgcolor: theme.palette.grey[50], borderRadius: 2 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: getRoleColor(user.systemInfo.role),
              fontSize: '2rem',
              fontWeight: 'bold',
              mr: 3,
            }}
          >
            {user.personalInfo.fullName.split(' ').map(n => n[0]).join('')}
          </Avatar>
          
          <Box>
            <Typography variant="h5" fontWeight={600}>
              {user.personalInfo.fullName}
            </Typography>
            {user.personalInfo.fullNameEn && (
              <Typography variant="subtitle1" color="text.secondary">
                {user.personalInfo.fullNameEn}
              </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <BadgeIcon sx={{ fontSize: 18, color: theme.palette.text.secondary, mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {user.userCode}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* اطلاعات شخصی */}
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                اطلاعات شخصی
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Box component="div" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>نام پدر:</Box>
                <Box component="div" sx={{ fontSize: '1rem' }}>{user.personalInfo.fatherName}</Box>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box component="span" sx={{ display: 'block', fontSize: '0.875rem', color: 'text.secondary' }}>شماره ملی:</Box>
                <Box component="span" sx={{ fontSize: '1rem' }}>
                  <FarsiNumber>{user.personalInfo.nationalId}</FarsiNumber>
                </Box>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box component="div" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>تابعیت:</Box>
                <Box component="div" sx={{ fontSize: '1rem' }}>{user.personalInfo.nationality}</Box>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box component="div" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>تاریخ تولد:</Box>
                <Box component="div" sx={{ fontSize: '1rem' }}>{user.personalInfo.birthDate}</Box>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box component="div" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>جنسیت:</Box>
                <Box component="div" sx={{ fontSize: '1rem' }}>{user.personalInfo.gender}</Box>
              </Box>
              
              {user.personalInfo.birthPlace && (
                <Box sx={{ mb: 2 }}>
                  <Box component="div" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>محل تولد:</Box>
                  <Box component="div" sx={{ fontSize: '1rem' }}>{user.personalInfo.birthPlace}</Box>
                </Box>
              )}
              
              {user.personalInfo.maritalStatus && (
                <Box sx={{ mb: 2 }}>
                  <Box component="div" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>وضعیت تأهل:</Box>
                  <Box component="div" sx={{ fontSize: '1rem' }}>{user.personalInfo.maritalStatus}</Box>
                </Box>
              )}
            </Box>
          </Grid>

          {/* اطلاعات تماس */}
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <EmailIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                اطلاعات تماس
              </Typography>
              
              {user.contactInfo.email && (
                <Box sx={{ mb: 2 }}>
                  <Box component="div" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>ایمیل:</Box>
                  <Box component="div" sx={{ fontSize: '1rem' }}>{user.contactInfo.email}</Box>
                </Box>
              )}
              
              {user.contactInfo.mobile.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Box component="span" sx={{ display: 'block', fontSize: '0.875rem', color: 'text.secondary' }}>شماره موبایل:</Box>
                  {user.contactInfo.mobile.map((mobile, index) => (
                    <Box key={index} component="span" sx={{ display: 'block', fontSize: '1rem' }}>
                      <FarsiNumber>{mobile}</FarsiNumber>
                    </Box>
                  ))}
                </Box>
              )}
              
              {user.contactInfo.landline && (
                <Box sx={{ mb: 2 }}>
                  <Box component="span" sx={{ display: 'block', fontSize: '0.875rem', color: 'text.secondary' }}>تلفن ثابت:</Box>
                  <Box component="span" sx={{ fontSize: '1rem' }}>
                    <FarsiNumber>{user.contactInfo.landline}</FarsiNumber>
                  </Box>
                </Box>
              )}
              
              {user.contactInfo.addresses && (
                <Box sx={{ mb: 2 }}>
                  <Box component="div" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>آدرس:</Box>
                  <Box component="div" sx={{ fontSize: '1rem' }}>{user.contactInfo.addresses}</Box>
                </Box>
              )}
              
              {user.contactInfo.postalCode && (
                <Box sx={{ mb: 2 }}>
                  <Box component="div" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>کد پستی:</Box>
                  <Box component="div" sx={{ fontSize: '1rem' }}>
                    <FarsiNumber>{user.contactInfo.postalCode}</FarsiNumber>
                  </Box>
                </Box>
              )}
            </Box>
          </Grid>

          {/* اطلاعات حرفه‌ای */}
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <BusinessIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                اطلاعات حرفه‌ای
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Box component="div" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>وضعیت:</Box>
                <Chip 
                  label={user.professionalInfo.status} 
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Box>
              
              {/* نمایش جزئیات بر اساس نوع وضعیت */}
              {user.professionalInfo.status === 'نظامی' && 'forceType' in user.professionalInfo.details && (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Box component="div" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>نوع نیرو:</Box>
                    <Box component="div" sx={{ fontSize: '1rem' }}>{user.professionalInfo.details.forceType}</Box>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Box component="div" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>درجه:</Box>
                    <Box component="div" sx={{ fontSize: '1rem' }}>{user.professionalInfo.details.rank}</Box>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Box component="div" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>سمت:</Box>
                    <Box component="div" sx={{ fontSize: '1rem' }}>{user.professionalInfo.details.position}</Box>
                  </Box>
                  {user.professionalInfo.details.serviceNumber && (
                    <Box sx={{ mb: 2 }}>
                      <Box component="div" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>شماره خدمتی:</Box>
                      <Box component="div" sx={{ fontSize: '1rem' }}>
                        <FarsiNumber>{user.professionalInfo.details.serviceNumber}</FarsiNumber>
                      </Box>
                    </Box>
                  )}
                  {user.professionalInfo.details.unit && (
                    <Box sx={{ mb: 2 }}>
                      <Box component="div" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>یگان:</Box>
                      <Box component="div" sx={{ fontSize: '1rem' }}>{user.professionalInfo.details.unit}</Box>
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Grid>

          {/* اطلاعات سیستم */}
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <SecurityIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                اطلاعات سیستمی
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Box component="div" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>نقش سیستمی:</Box>
                <Chip
                  label={user.systemInfo.role}
                  size="small"
                  sx={{
                    mt: 0.5,
                    bgcolor: getRoleColor(user.systemInfo.role),
                    color: theme.palette.getContrastText(getRoleColor(user.systemInfo.role)),
                  }}
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box component="div" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>سطح دسترسی:</Box>
                <Chip
                  label={user.systemInfo.accessLevel}
                  size="small"
                  variant="outlined"
                  sx={{
                    mt: 0.5,
                    borderColor: getAccessLevelColor(user.systemInfo.accessLevel),
                    color: getAccessLevelColor(user.systemInfo.accessLevel),
                  }}
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box component="div" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>تعداد ورود:</Box>
                <Box component="div" sx={{ fontSize: '1rem' }}>
                  <FarsiNumber>{user.systemInfo.loginCount}</FarsiNumber> بار
                </Box>
              </Box>
              
              {user.systemInfo.lastLogin && (
                <Box sx={{ mb: 2 }}>
                  <Box component="div" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>آخرین ورود:</Box>
                  <Box component="div" sx={{ fontSize: '1rem' }}>
                    {new Date(user.systemInfo.lastLogin).toLocaleDateString('fa-IR')}
                  </Box>
                </Box>
              )}
              
              <Box sx={{ mb: 2 }}>
                <Box component="div" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>مجوزها:</Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {user.systemInfo.permissions.map((permission) => (
                    <Chip
                      key={permission}
                      label={permission}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* تاریخ‌های مهم */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            تاریخ‌های مهم
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: theme.palette.grey[50], borderRadius: 2 }}>
                <Box component="div" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>تاریخ ایجاد:</Box>
                <Box component="div" sx={{ fontSize: '1rem' }}>
                  {new Date(user.createdAt).toLocaleDateString('fa-IR')}
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: theme.palette.grey[50], borderRadius: 2 }}>
                <Box component="div" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>آخرین به‌روزرسانی:</Box>
                <Box component="div" sx={{ fontSize: '1rem' }}>
                  {new Date(user.updatedAt).toLocaleDateString('fa-IR')}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          startIcon={<CloseIcon />}
        >
          بستن
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserDetailsModal;