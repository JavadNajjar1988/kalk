import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  Box,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FlashOn as QuickActionIcon,
  PersonOff as InactiveIcon,
  Person as ActiveIcon,
} from '@mui/icons-material';
import { User } from '../types';
import FarsiNumber from '@/components/common/FarsiNumber';

interface UsersTableViewProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onView: (user: User) => void;
  onQuickAction: (user: User) => void;
}

const UsersTableView: React.FC<UsersTableViewProps> = ({
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

  const getAccessLevelColor = (accessLevel: string | undefined) => {
    if (!accessLevel || typeof accessLevel !== 'string') {
      return theme.palette.grey[500];
    }
    if (accessLevel.includes('سطح 1')) return theme.palette.error.main;
    if (accessLevel.includes('سطح 2')) return theme.palette.warning.main;
    if (accessLevel.includes('سطح 3')) return theme.palette.info.main;
    if (accessLevel.includes('سطح 4')) return theme.palette.success.main;
    return theme.palette.grey[500];
  };

  const getRoleColor = (role: string | undefined) => {
    if (!role || typeof role !== 'string') {
      return theme.palette.grey[500];
    }
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
    <TableContainer 
      component={Paper} 
      sx={{ 
        maxHeight: 600, 
        bgcolor: theme.palette.background.paper,
        borderRadius: 2,
        boxShadow: theme.shadows[1],
      }}
    >
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.grey[50] }}>
              <FarsiNumber>ردیف</FarsiNumber>
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.grey[50] }}>
              کد کاربری
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.grey[50] }}>
              نام و نام خانوادگی
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.grey[50] }}>
              تابعیت
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.grey[50] }}>
              نقش
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.grey[50] }}>
              سطح دسترسی
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.grey[50] }}>
              وضعیت
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.grey[50] }}>
              عملیات
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user, index) => (
            <TableRow 
              key={user.id}
              hover
              sx={{
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                },
                opacity: user.isActive ? 1 : 0.6,
              }}
            >
              {/* ردیف */}
              <TableCell>
                <FarsiNumber>{index + 1}</FarsiNumber>
              </TableCell>
              
              {/* کد کاربری */}
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      bgcolor: getRoleColor(user.systemInfo.role),
                      fontSize: '0.875rem'
                    }}
                  >
                    {user.userCode.slice(0, 2)}
                  </Avatar>
                  <Typography variant="body2" fontWeight={500}>
                    {user.userCode}
                  </Typography>
                </Box>
              </TableCell>
              
              {/* نام و نام خانوادگی */}
              <TableCell>
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    {user.personalInfo?.fullName || 'نامشخص'}
                  </Typography>
                  {user.personalInfo?.fullNameEn && (
                    <Typography variant="caption" color="text.secondary">
                      {user.personalInfo.fullNameEn}
                    </Typography>
                  )}
                </Box>
              </TableCell>
              
              {/* تابعیت */}
              <TableCell>
                <Typography variant="body2">
                  {user.personalInfo?.nationality || 'نامشخص'}
                </Typography>
              </TableCell>
              
              {/* نقش */}
              <TableCell>
                <Chip
                  label={user.systemInfo.role || 'نامشخص'}
                  size="small"
                  sx={{
                    bgcolor: getRoleColor(user.systemInfo.role),
                    color: theme.palette.getContrastText(getRoleColor(user.systemInfo.role)),
                    fontWeight: 500,
                  }}
                />
              </TableCell>
              
              {/* سطح دسترسی */}
              <TableCell>
                <Chip
                  label={user.systemInfo.accessLevel || 'نامشخص'}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: getAccessLevelColor(user.systemInfo.accessLevel),
                    color: getAccessLevelColor(user.systemInfo.accessLevel),
                    fontWeight: 500,
                  }}
                />
              </TableCell>
              
              {/* وضعیت */}
              <TableCell>
                <Chip
                  icon={user.isActive ? <ActiveIcon /> : <InactiveIcon />}
                  label={user.isActive ? 'فعال' : 'غیرفعال'}
                  color={getStatusColor(user.isActive)}
                  size="small"
                  variant={user.isActive ? 'filled' : 'outlined'}
                />
              </TableCell>
              
              {/* عملیات */}
              <TableCell>
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
                  
                  <Tooltip title="تغییرات فوری">
                    <IconButton 
                      size="small" 
                      onClick={() => onQuickAction(user)}
                      sx={{ color: theme.palette.primary.main }}
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default UsersTableView;