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
  alpha,
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
  const accent = theme.palette.success.main;
  const dialogBackground = `linear-gradient(135deg, ${alpha(accent, 0.08)}, ${alpha(accent, 0.04)})`;

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
      default: return accent;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          backgroundColor: theme.palette.background.paper,
          backgroundImage: dialogBackground,
          border: `1px solid ${alpha(accent, 0.24)}`,
          boxShadow: `0 20px 60px ${alpha(accent, 0.18)}`,
        },
      }}
      aria-labelledby="user-delete-dialog-title"
      aria-describedby="user-delete-dialog-description"
    >
      <DialogTitle
        id="user-delete-dialog-title"
        sx={{
          borderBottom: `1px solid ${alpha(accent, 0.2)}`,
          backgroundColor: alpha(accent, 0.08),
          textAlign: 'center',
          py: 3,
          px: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
          <WarningIcon color="error" sx={{ mr: 0.5 }} />
          <Typography variant="h5" fontWeight={700} color={(theme) => theme.palette.error.main}>
            تأیید حذف کاربر
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers id="user-delete-dialog-description" sx={{ borderColor: alpha(accent, 0.16), backgroundColor: 'transparent' }}>
        <Box sx={{ p: 3 }}>
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
            bgcolor: (theme) => alpha(theme.palette.error.light, 0.06),
            borderRadius: 2,
            border: (theme) => `1px solid ${alpha(theme.palette.error.light, 0.2)}`,
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
              {initials}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={600}>
                {displayFullName}
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
              آیا مطمئن هستید که می‌خواهید کاربر <strong>{displayFullName}</strong> را حذف کنید؟
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
        </Box>
      </DialogContent>

      <DialogActions sx={{
        borderTop: `1px solid ${alpha(accent, 0.2)}`,
        backgroundColor: alpha(accent, 0.04),
        px: 3,
        py: 2,
        gap: 1.5,
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          startIcon={<CancelIcon />}
          disabled={isDeleting}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1.5,
            borderColor: alpha(accent, 0.35),
            flex: 1,
          }}
        >
          انصراف
        </Button>

        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
          disabled={isDeleting}
          sx={{
            borderRadius: 2,
            px: 4,
            py: 1.5,
            flex: 1,
          }}
        >
          {isDeleting ? 'در حال حذف...' : 'تأیید حذف'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationModal;
