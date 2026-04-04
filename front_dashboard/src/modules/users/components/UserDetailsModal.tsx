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
  IconButton,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  CalendarToday as CalendarTodayIcon,
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
  const accent = theme.palette.success.main;
  const dialogBackground = `linear-gradient(135deg, ${alpha(accent, 0.08)}, ${alpha(accent, 0.04)})`;

  const cardSurfaceSx = {
    borderRadius: 3,
    padding: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: `1px solid ${alpha(accent, 0.12)}`,
    boxShadow: `0 18px 38px ${alpha(accent, 0.15)}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  } as const;
  const sectionTitleSx = {
    mb: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    fontWeight: 600,
    color: accent,
  } as const;

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
  const mobileNumbers = Array.isArray(user.contactInfo?.mobile) ? user.contactInfo.mobile : [];
  const permissions = Array.isArray(user.systemInfo?.permissions) ? user.systemInfo.permissions : [];

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

  const getAccessLevelColor = (accessLevel?: string) => {
    if (!accessLevel) return theme.palette.grey[500];
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
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          backgroundColor: theme.palette.background.paper,
          backgroundImage: dialogBackground,
          border: `1px solid ${alpha(accent, 0.24)}`,
          boxShadow: `0 24px 60px ${alpha(accent, 0.28)}`,
        },
        '& .MuiOutlinedInput-root': {
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
      <DialogTitle
        sx={{
          borderBottom: `1px solid ${alpha(accent, 0.2)}`,
          backgroundColor: alpha(accent, 0.08),
          py: 3,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PersonIcon sx={{ color: accent }} />
          <Typography
            component="h2"
            variant="h5"
            sx={{ fontWeight: 700, color: accent }}
          >
            جزئیات کاربر
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={user.isActive ? 'فعال' : 'غیرفعال'}
            color={user.isActive ? 'success' : 'error'}
            size="small"
            sx={{ fontWeight: 600 }}
          />
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: accent,
              backgroundColor: alpha(accent, 0.12),
              border: `1px solid ${alpha(accent, 0.18)}`,
              '&:hover': {
                backgroundColor: alpha(accent, 0.2),
                transform: 'translateY(-1px)',
                boxShadow: `0 6px 18px ${alpha(accent, 0.25)}`,
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: alpha(accent, 0.16), backgroundColor: 'transparent' }}>
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Header با آواتار */}
          <Box
            sx={{
              ...cardSurfaceSx,
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: { xs: 2, sm: 3 },
            }}
          >
            <Avatar
              sx={{
                width: 90,
                height: 90,
                bgcolor: getRoleColor(user.systemInfo.role),
                fontSize: '2.2rem',
                fontWeight: 'bold',
                border: '3px solid rgba(255, 255, 255, 0.82)',
                boxShadow: `0 12px 30px ${alpha(getRoleColor(user.systemInfo.role), 0.35)}`,
              }}
            >
              {initials}
            </Avatar>
            
            <Box>
              <Typography variant="h5" fontWeight={600}>
                {displayFullName}
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
              <Box sx={{ ...cardSurfaceSx, height: '100%', display: 'grid', gap: 1.5 }}>
                <Typography variant="h6" sx={sectionTitleSx}>
                  <PersonIcon sx={{ color: theme.palette.primary.main }} />
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
              <Box sx={{ ...cardSurfaceSx, height: '100%', display: 'grid', gap: 1.5 }}>
                <Typography variant="h6" sx={sectionTitleSx}>
                  <EmailIcon sx={{ color: theme.palette.primary.main }} />
                  اطلاعات تماس
                </Typography>
                
                {user.contactInfo.email && (
                  <Box sx={{ mb: 2 }}>
                    <Box component="div" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>ایمیل:</Box>
                    <Box component="div" sx={{ fontSize: '1rem' }}>{user.contactInfo.email}</Box>
                  </Box>
                )}
                
                {mobileNumbers.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Box component="span" sx={{ display: 'block', fontSize: '0.875rem', color: 'text.secondary' }}>شماره موبایل:</Box>
                    {mobileNumbers.map((mobile, index) => (
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
              <Box sx={{ ...cardSurfaceSx, height: '100%', display: 'grid', gap: 1.5 }}>
                <Typography variant="h6" sx={sectionTitleSx}>
                  <BusinessIcon sx={{ color: theme.palette.primary.main }} />
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
              <Box sx={{ ...cardSurfaceSx, height: '100%', display: 'grid', gap: 1.5 }}>
                <Typography variant="h6" sx={sectionTitleSx}>
                  <SecurityIcon sx={{ color: theme.palette.primary.main }} />
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
                    {permissions.map((permission) => (
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
  
          <Divider sx={{ my: 3, borderColor: alpha(theme.palette.primary.main, 0.1) }} />
  
          {/* تاریخ‌های مهم */}
          <Box sx={{ ...cardSurfaceSx, gap: 2 }}>
            <Typography variant="h6" sx={sectionTitleSx}>
              <CalendarTodayIcon sx={{ color: theme.palette.primary.main }} />
              تاریخ‌های مهم
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    padding: { xs: 2, sm: 2.5 },
                    display: 'grid',
                    gap: 1,
                  }}
                >
                  <Box component="div" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>تاریخ ایجاد:</Box>
                  <Box component="div" sx={{ fontSize: '1rem' }}>
                    {new Date(user.createdAt).toLocaleDateString('fa-IR')}
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    padding: { xs: 2, sm: 2.5 },
                    display: 'grid',
                    gap: 1,
                  }}
                >
                  <Box component="div" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>آخرین به‌روزرسانی:</Box>
                  <Box component="div" sx={{ fontSize: '1rem' }}>
                    {new Date(user.updatedAt).toLocaleDateString('fa-IR')}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          borderTop: `1px solid ${alpha(accent, 0.2)}`,
          backgroundColor: alpha(accent, 0.04),
          px: 3,
          py: 2,
          justifyContent: 'flex-end',
        }}
      >
        <Button 
          onClick={onClose} 
          variant="outlined" 
          color="inherit"
          startIcon={<CloseIcon />} 
          sx={{
            borderRadius: 2,
            borderColor: alpha(accent, 0.35),
          }}
        >
          بستن
        </Button>
      </DialogActions>

    </Dialog>
  );
};

export default UserDetailsModal;
