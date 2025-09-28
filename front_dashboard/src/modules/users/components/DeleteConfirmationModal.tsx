import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
  Alert,
  useTheme,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { User } from '../types';

interface DeleteConfirmationModalProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (user: User) => void;
  isDeleting?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  user,
  open,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  const theme = useTheme();

  if (!user) return null;

  const handleConfirm = () => {
    onConfirm(user);
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
      maxWidth="sm"
      fullWidth
      sx={{ 
        '& .MuiDialog-paper': { 
          borderRadius: 3,
          border: `2px solid ${theme.palette.error.main}`,
        } 
      }}
    >
      <DialogTitle sx={{ 
        pb: 1, 
        display: 'flex', 
        alignItems: 'center',
        bgcolor: theme.palette.error.light,
        color: theme.palette.error.contrastText,
      }}>
        <WarningIcon sx={{ mr: 1 }} />
        <Typography variant="h6">تأیید حذف کاربر</Typography>
      </DialogTitle>
      
      <DialogContent dividers>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body1" fontWeight={600}>
            هشدار: این عملیات قابل بازگشت نیست!
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            با حذف این کاربر، تمام اطلاعات و تاریخچه مرتبط با وی از سیستم حذف خواهد شد.
          </Typography>
        </Alert>

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          p: 2, 
          bgcolor: theme.palette.grey[50], 
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}>
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
            {user.personalInfo.fullName.split(' ').map(n => n[0]).join('')}
          </Avatar>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={600}>
              {user.personalInfo.fullName}
            </Typography>
            {user.personalInfo.fullNameEn && (
              <Typography variant="body2" color="text.secondary">
                {user.personalInfo.fullNameEn}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              کد کاربری: {user.userCode}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              نقش: {user.systemInfo.role}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            آیا مطمئن هستید که می‌خواهید کاربر <strong>{user.personalInfo.fullName}</strong> را حذف کنید؟
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            این عمل شامل حذف موارد زیر می‌شود:
          </Typography>
          
          <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              اطلاعات شخصی و تماس کاربر
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              تاریخچه ورود و فعالیت‌های سیستمی
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              دسترسی‌ها و مجوزهای سیستمی
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              تمام داده‌های مرتبط در سیستم
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          startIcon={<CancelIcon />}
          disabled={isDeleting}
          sx={{ flex: 1 }}
        >
          انصراف
        </Button>
        
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
          disabled={isDeleting}
          sx={{ flex: 1 }}
        >
          {isDeleting ? 'در حال حذف...' : 'تأیید حذف'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationModal;