import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  Box,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FlashOn as QuickActionIcon,
  PersonOff as InactiveIcon,
  Person as ActiveIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import { User } from '../types';
import FarsiNumber from '@/components/common/FarsiNumber';

interface UsersCardViewProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onView: (user: User) => void;
  onQuickAction: (user: User) => void;
}

const UsersCardView: React.FC<UsersCardViewProps> = ({
  users,
  onEdit,
  onDelete,
  onView,
  onQuickAction,
}) => {
  const theme = useTheme();

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'error';
  };

  const getAccessLevelColor = (accessLevel: string) => {
    if (accessLevel.includes('سطح 1')) return theme.palette.error.main;
    if (accessLevel.includes('سطح 2')) return theme.palette.warning.main;
    if (accessLevel.includes('سطح 3')) return theme.palette.info.main;
    if (accessLevel.includes('سطح 4')) return theme.palette.success.main;
    return theme.palette.grey[500];
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

  const getCardBackgroundColor = (isActive: boolean) => {
    return isActive 
      ? theme.palette.background.paper
      : alpha(theme.palette.background.paper, 0.7);
  };

  return (
    <Grid container spacing={3}>
      {users.map((user) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={user.id}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: getCardBackgroundColor(user.isActive),
              border: user.isActive ? 'none' : `2px dashed ${theme.palette.grey[300]}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[8],
              },
              opacity: user.isActive ? 1 : 0.7,
            }}
          >
            <CardContent sx={{ flex: 1 }}>
              {/* Header با آواتار و وضعیت */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: getRoleColor(user.systemInfo.role),
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    mr: 2,
                  }}
                >
                  {user.personalInfo.fullName.split(' ').map(n => n[0]).join('')}
                </Avatar>
                
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="h6" component="div" sx={{ mb: 0.5, fontWeight: 600 }}>
                        {user.personalInfo.fullName}
                      </Typography>
                      {user.personalInfo.fullNameEn && (
                        <Typography variant="caption" color="text.secondary">
                          {user.personalInfo.fullNameEn}
                        </Typography>
                      )}
                    </Box>
                    
                    <Chip
                      icon={user.isActive ? <ActiveIcon /> : <InactiveIcon />}
                      label={user.isActive ? 'فعال' : 'غیرفعال'}
                      color={getStatusColor(user.isActive)}
                      size="small"
                      variant={user.isActive ? 'filled' : 'outlined'}
                    />
                  </Box>
                </Box>
              </Box>

              {/* کد کاربری */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <BadgeIcon sx={{ fontSize: 18, color: theme.palette.text.secondary, mr: 1 }} />
                <Typography variant="body2" fontWeight={500}>
                  کد کاربری: {user.userCode}
                </Typography>
              </Box>

              {/* اطلاعات تماس */}
              <Box sx={{ mb: 1.5 }}>
                {user.contactInfo.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <EmailIcon sx={{ fontSize: 16, color: theme.palette.text.secondary, mr: 1 }} />
                    <Typography variant="caption" color="text.secondary">
                      {user.contactInfo.email}
                    </Typography>
                  </Box>
                )}
                
                {user.contactInfo.mobile[0] && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PhoneIcon sx={{ fontSize: 16, color: theme.palette.text.secondary, mr: 1 }} />
                    <Typography variant="caption" color="text.secondary">
                      <FarsiNumber>{user.contactInfo.mobile[0]}</FarsiNumber>
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 1.5 }} />

              {/* نقش و سطح دسترسی */}
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  نقش سیستمی:
                </Typography>
                <Chip
                  label={user.systemInfo.role}
                  size="small"
                  sx={{
                    bgcolor: getRoleColor(user.systemInfo.role),
                    color: theme.palette.getContrastText(getRoleColor(user.systemInfo.role)),
                    fontWeight: 500,
                    mb: 1,
                  }}
                />
                
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  سطح دسترسی:
                </Typography>
                <Chip
                  label={user.systemInfo.accessLevel}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: getAccessLevelColor(user.systemInfo.accessLevel),
                    color: getAccessLevelColor(user.systemInfo.accessLevel),
                    fontWeight: 500,
                  }}
                />
              </Box>

              {/* تابعیت */}
              <Typography variant="body2" color="text.secondary">
                تابعیت: {user.personalInfo.nationality}
              </Typography>
            </CardContent>

            <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="مشاهده جزئیات">
                  <IconButton 
                    size="small" 
                    onClick={() => onView(user)}
                    sx={{ color: theme.palette.info.main }}
                  >
                    <ViewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="ویرایش">
                  <IconButton 
                    size="small" 
                    onClick={() => onEdit(user)}
                    sx={{ color: theme.palette.warning.main }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="تغییرات فوری">
                  <IconButton 
                    size="small" 
                    onClick={() => onQuickAction(user)}
                    sx={{ 
                      color: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                      }
                    }}
                  >
                    <QuickActionIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="حذف">
                  <IconButton 
                    size="small" 
                    onClick={() => onDelete(user)}
                    sx={{ color: theme.palette.error.main }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default UsersCardView;