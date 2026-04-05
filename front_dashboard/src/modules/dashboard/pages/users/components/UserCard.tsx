import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  useTheme,
  alpha,
  Avatar,
} from '@mui/material';
import {
  Edit,
  Delete,
  Shield,
  VpnKey,
  Block,
  CheckCircle,
  Cancel,
  MoreVert,
  Person,
  AdminPanelSettings,
  Security,
  Engineering,
  Visibility,
} from '@mui/icons-material';

import { UserCardProps } from '../types';
import { convertToFarsiNumbers } from '../utils/formatters';
import { getRoleColor, getRoleText, getClearanceColor, getClearanceText } from '../utils/access-controls';
import { MILITARY_AVATARS } from '../utils/geo-data';

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onDelete,
  onToggleStatus,
  onResetPassword,
  onViewPermissions,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <AdminPanelSettings />;
      case 'commander': return <Security />;
      case 'operator': return <Engineering />;
      case 'viewer': return <Visibility />;
      default: return <Person />;
    }
  };

  // تعیین گرادینت بر اساس نقش کاربر با رنگ‌های اصلی تم
  const getCardGradient = (role: string, isActive: boolean) => {
    if (!isActive) {
      return theme.palette.mode === 'dark' 
        ? `linear-gradient(135deg, ${alpha(theme.palette.grey[800], 0.8)} 0%, ${alpha(theme.palette.grey[700], 0.6)} 100%)`
        : `linear-gradient(135deg, ${alpha(theme.palette.grey[100], 0.8)} 0%, ${alpha(theme.palette.grey[200], 0.6)} 100%)`;
    }
    
    // استفاده از رنگ‌های اصلی تم
    const primaryColor = theme.palette.primary.main;
    const secondaryColor = theme.palette.secondary.main;
    
    switch (role) {
      case 'admin':
        return `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.08)} 0%, ${alpha(primaryColor, 0.05)} 50%, ${alpha(theme.palette.error.main, 0.03)} 100%)`;
      case 'commander':
        return `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.12)} 0%, ${alpha(primaryColor, 0.05)} 50%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`;
      case 'operator':
        return `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)} 0%, ${alpha(primaryColor, 0.05)} 50%, ${alpha(theme.palette.info.main, 0.03)} 100%)`;
      case 'viewer':
        return `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.08)} 0%, ${alpha(primaryColor, 0.05)} 50%, ${alpha(theme.palette.warning.main, 0.03)} 100%)`;
      default:
        return `linear-gradient(135deg, ${alpha(primaryColor, 0.08)} 0%, ${alpha(secondaryColor, 0.05)} 100%)`;
    }
  };

  // تابع نمایش آواتار کاربر
  const renderUserAvatar = (user: { name?: string; username: string; avatar?: string }, size: number = 40) => {
    if (user.avatar && user.avatar !== 'none') {
      const avatarData = MILITARY_AVATARS.find(a => a.id === user.avatar);
      if (avatarData && avatarData.path) {
        return (
          <Avatar
            src={avatarData.path}
            sx={{
              width: size,
              height: size,
              border: '2px solid',
              borderColor: 'primary.main',
            }}
          />
        );
      }
    }
    
    // حرف اول نام با فونت ایران نستعلیق
    const firstLetter = user.name?.[0] || user.username[0];
    return (
      <Avatar
        sx={{
          width: size,
          height: size,
          bgcolor: 'secondary.main',
          fontFamily: 'Iran Nastaliq, serif',
          fontSize: '1.4rem',
          fontWeight: 'bold',
          border: '2px solid',
          borderColor: 'secondary.main',
        }}
      >
        {firstLetter?.toUpperCase()}
      </Avatar>
    );
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        background: getCardGradient(user.role, user.isActive),
        borderRadius: 3,
        boxShadow: user.isActive 
          ? '0 4px 20px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.06)' 
          : '0 2px 8px rgba(0, 0, 0, 0.04)',
        border: user.isActive ? 'none' : '2px dashed',
        borderColor: user.isActive ? 'none' : 'error.main',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: user.isActive 
            ? '0 8px 30px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)' 
            : '0 4px 16px rgba(0, 0, 0, 0.08)',
        },
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: user.isActive ? 1 : 0.8,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: user.isActive 
            ? `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.6)})`
            : `linear-gradient(90deg, ${theme.palette.grey[400]}, ${theme.palette.grey[300]})`,
        },
      }}
    >
      <CardContent>
        {/* هدر کارت */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, pt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                user.isActive ? (
                  <CheckCircle sx={{ 
                    color: 'primary.main', 
                    fontSize: 18,
                    backgroundColor: 'background.paper',
                    borderRadius: '50%',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  }} />
                ) : (
                  <Cancel sx={{ 
                    color: 'error.main', 
                    fontSize: 18,
                    backgroundColor: 'background.paper',
                    borderRadius: '50%',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  }} />
                )
              }
            >
              <Box sx={{ 
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: -2,
                  left: -2,
                  right: -2,
                  bottom: -2,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)}, ${alpha(theme.palette.primary.main, 0.1)})`,
                  zIndex: -1,
                },
              }}>
                {renderUserAvatar(user, 56)}
              </Box>
            </Badge>
            
            <Box sx={{ flex: 1, ml: 2 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 0.5,
                  color: 'text.primary',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                }}
              >
                {user.name || user.username}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mb: 0.5,
                  fontWeight: 500,
                }}
              >
                {user.email}
              </Typography>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  padding: '2px 8px',
                  borderRadius: 2,
                  fontSize: '0.75rem',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                }}
              >
                {user.position} - {user.department}
              </Typography>
            </Box>
          </Box>
          
          <IconButton
            size="small"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <MoreVert />
          </IconButton>
        </Box>

        {/* نقش و سطح دسترسی */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip
            icon={getRoleIcon(user.role)}
            label={getRoleText(user.role)}
            color={getRoleColor(user.role) as any}
            size="small"
            variant="outlined"
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              borderColor: alpha(theme.palette.primary.main, 0.3),
              color: theme.palette.primary.main,
              fontWeight: 500,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.15),
              },
            }}
          />
          <Chip
            label={getClearanceText(user.securityClearance)}
            color={getClearanceColor(user.securityClearance) as any}
            size="small"
            variant="filled"
            sx={{
              fontWeight: 500,
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          />
        </Box>

        {/* اطلاعات تماس */}
        <Box sx={{ 
          mb: 2, 
          backgroundColor: alpha(theme.palette.primary.main, 0.05),
          borderRadius: 2,
          padding: 1.5,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}>
          {user.phoneNumber && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                شماره تماس:
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ 
                fontWeight: 500,
                direction: 'ltr',
                textAlign: 'left',
                fontFamily: 'Arial, sans-serif'
              }}>
                {convertToFarsiNumbers(user.phoneNumber?.replace(/^\+(\d+)(.*)$/, '$2$1+') || '')}
              </Typography>
            </Box>
          )}
          
          {user.nationalId && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                {user.nationality === 'iranian' ? 'کد ملی:' : 'کد پاسپورت:'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ 
                fontWeight: 500,
                direction: 'ltr',
                textAlign: 'left',
                fontFamily: 'Arial, sans-serif'
              }}>
                {convertToFarsiNumbers(user.nationalId || '')}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              آخرین ورود:
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ 
              fontWeight: 500,
              direction: 'ltr',
              textAlign: 'left',
              fontFamily: 'Arial, sans-serif'
            }}>
              {user.lastLogin ? 
                convertToFarsiNumbers(new Date(user.lastLogin).toLocaleDateString('fa-IR')) : 
                'هرگز'
              }
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              تعداد ورود:
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ 
              fontWeight: 500,
              direction: 'ltr',
              textAlign: 'left',
              fontFamily: 'Arial, sans-serif'
            }}>
              {convertToFarsiNumbers(user.loginCount)} بار
            </Typography>
          </Box>
        </Box>

        {/* وضعیت */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Chip
            label={user.isActive ? 'فعال' : 'غیرفعال'}
            color={user.isActive ? 'primary' : 'error'}
            size="small"
            variant="filled"
            sx={{
              fontWeight: 600,
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          />
          
          <Chip
            label={`${convertToFarsiNumbers(user.permissions.length)} مجوز`}
            size="small"
            variant="outlined"
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              borderColor: alpha(theme.palette.primary.main, 0.3),
              color: theme.palette.primary.main,
              fontWeight: 500,
            }}
          />
        </Box>

        {/* تاریخ ایجاد */}
        <Box sx={{ 
          textAlign: 'center',
          backgroundColor: alpha(theme.palette.primary.main, 0.05),
          borderRadius: 2,
          padding: 1,
          borderTop: '2px solid',
          borderColor: theme.palette.primary.main,
        }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            عضویت: {convertToFarsiNumbers(new Date(user.createdAt).toLocaleDateString('fa-IR'))}
          </Typography>
        </Box>
      </CardContent>

      {/* منوی عملیات */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => { onEdit(user); setAnchorEl(null); }}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>ویرایش</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { onViewPermissions(user); setAnchorEl(null); }}>
          <ListItemIcon><Shield fontSize="small" /></ListItemIcon>
          <ListItemText>مجوزها</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { onResetPassword(user); setAnchorEl(null); }}>
          <ListItemIcon><VpnKey fontSize="small" /></ListItemIcon>
          <ListItemText>تنظیم مجدد رمز</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { onToggleStatus(user.id); setAnchorEl(null); }}>
          <ListItemIcon>
            {user.isActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            {user.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
          </ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => { onDelete(user.id); setAnchorEl(null); }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>حذف</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
}; 