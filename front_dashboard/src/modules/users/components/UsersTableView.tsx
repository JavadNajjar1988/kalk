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
  alpha,
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
import { resolveAvatarSrc } from '../utils/avatarOptions';
import { getAccessLevelColor, getUserInitials } from '../utils/userPresentation';

interface UsersTableViewProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onView: (user: User) => void;
  onQuickAction: (user: User) => void;
  canManage?: boolean;
}

const UsersTableView: React.FC<UsersTableViewProps> = ({
  users,
  onEdit,
  onDelete,
  onView,
  onQuickAction,
  canManage = true,
}) => {
  const theme = useTheme();

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'error';
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
          {users.filter(Boolean).map((user, index) => {
            const accessColor = getAccessLevelColor(theme, user.systemInfo?.accessLevel);
            return (
            <TableRow
              key={user.id}
              hover
              sx={{
                borderRight: `4px solid ${accessColor}`,
                bgcolor: alpha(accessColor, 0.025),
                '&:hover': {
                  bgcolor: alpha(accessColor, 0.08),
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
                    src={resolveAvatarSrc(user.personalInfo?.avatar)}
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      bgcolor: accessColor,
                      fontSize: '0.875rem'
                    }}
                  >
                    {getUserInitials(user.personalInfo?.fullName, user.userCode.slice(0, 2))}
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
                    bgcolor: accessColor,
                    color: theme.palette.getContrastText(accessColor),
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
                    borderColor: accessColor,
                    color: accessColor,
                    bgcolor: alpha(accessColor, 0.06),
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
                  
                  {canManage && <Tooltip title="ویرایش">
                    <IconButton 
                      size="small" 
                      onClick={() => onEdit(user)}
                      sx={{ color: theme.palette.warning.main }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>}
                  
                  {canManage && <Tooltip title="تغییرات فوری">
                    <IconButton 
                      size="small" 
                      onClick={() => onQuickAction(user)}
                      sx={{ color: theme.palette.primary.main }}
                    >
                      <QuickActionIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>}
                  
                  {canManage && <Tooltip title="حذف">
                    <IconButton 
                      size="small" 
                      onClick={() => onDelete(user)}
                      sx={{ color: theme.palette.error.main }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>}
                </Box>
              </TableCell>
            </TableRow>
          )})}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default UsersTableView;
