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
  useMediaQuery,
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getSoftSurface = () => {
    const primary = (theme.palette.primary.main || '#4a90e2').toLowerCase();
    const hex = primary.replace('#', '');

    if (hex.includes('10b981') || hex.includes('4caf50') || hex.includes('2e7d32')) return '#f0f4f3';
    if (hex.includes('4a90e2') || hex.includes('1976d2') || hex.includes('2196f3')) return '#f0f4f8';
    if (hex.includes('ef4444') || hex.includes('f44336') || hex.includes('d32f2f')) return '#fbf1f0';
    if (hex.includes('6b21a8') || hex.includes('9c27b0') || hex.includes('673ab7')) return theme.palette.mode === 'dark' ? '#1f2330' : '#f3f0f9';
    if (hex.includes('f59e0b') || hex.includes('ff9800') || hex.includes('fb8c00')) return '#fbf5ef';

    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    const hexToRgb = (h: string) => {
      const norm = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
      const r = parseInt(norm.slice(0, 2), 16);
      const g = parseInt(norm.slice(2, 4), 16);
      const b = parseInt(norm.slice(4, 6), 16);
      return { r, g, b };
    };
    const rgbToHex = (r: number, g: number, b: number) =>
      `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
    const blendWithWhite = (h: string, primaryWeight = 0.1) => {
      const { r, g, b } = hexToRgb(h);
      const white = 255;
      const weight = 1 - primaryWeight;
      const br = white * weight + r * primaryWeight;
      const bg = white * weight + g * primaryWeight;
      const bb = white * weight + b * primaryWeight;
      return rgbToHex(br, bg, bb);
    };

    if (/^[0-9a-f]{3,6}$/.test(hex)) {
      return blendWithWhite(hex, 0.1);
    }

    try {
      const fallback = (theme.palette.primary.light || '#90caf9').toLowerCase().replace('#', '');
      return blendWithWhite(fallback, 0.08);
    } catch {
      return theme.palette.mode === 'dark' ? '#1f2430' : '#f5f7fa';
    }
  };

  const softSurface = getSoftSurface();
  const cardSurfaceSx = {
    borderRadius: '16px',
    padding: { xs: 2, sm: 3 },
    backgroundColor:
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.background.paper, 0.72)
        : 'rgba(255, 255, 255, 0.95)',
    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
    boxShadow: `0 18px 38px ${alpha(theme.palette.primary.main, 0.15)}`,
    backdropFilter: 'blur(10px)',
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
    color: theme.palette.primary.main,
  } as const;
  const secondaryButtonSx = {
    borderRadius: '12px',
    px: { xs: 2, sm: 3 },
    py: 1.2,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    color: '#475569',
    border: '1px solid rgba(148, 163, 184, 0.25)',
    backdropFilter: 'blur(10px)',
    fontWeight: 600,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(148, 163, 184, 0.18)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 22px rgba(148, 163, 184, 0.24)',
    },
  } as const;

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
      fullScreen={isMobile}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: isMobile ? 0 : '20px',
          backgroundColor: (theme) => alpha(theme.palette.primary.light, 0.1),
          backdropFilter: 'blur(20px)',
          border: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          boxShadow: (theme) => `0 24px 60px ${alpha(theme.palette.primary.light, 0.28)}, inset 0 1px 0 rgba(255, 255, 255, 0.75)`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: { xs: '100vh', lg: '90vh' },
        },
        '& .MuiBackdrop-root': {
          backgroundColor: (theme) => alpha(theme.palette.primary.light, 0.08),
          backdropFilter: 'blur(4px)',
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: softSurface,
          borderBottom: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          py: isMobile ? 2 : 3,
          px: isMobile ? 2 : 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PersonIcon sx={{ color: theme.palette.primary.main }} />
          <Typography
            component="h2"
            variant={isMobile ? 'h6' : 'h5'}
            sx={{ fontWeight: 700, color: theme.palette.primary.main }}
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
              color: theme.palette.primary.main,
              backgroundColor: alpha(theme.palette.primary.main, 0.12),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                transform: 'translateY(-1px)',
                boxShadow: `0 6px 18px ${alpha(theme.palette.primary.main, 0.25)}`,
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0, backgroundColor: softSurface }}>
        <Box sx={{ p: { xs: 3, sm: 4 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
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
          backgroundColor: softSurface,
          borderTop: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          p: isMobile ? 2 : 3,
          justifyContent: 'flex-end',
        }}
      >
        <Button onClick={onClose} variant="outlined" startIcon={<CloseIcon />} sx={secondaryButtonSx}>
          بستن
        </Button>
      </DialogActions>

    </Dialog>
  );
};

export default UserDetailsModal;
