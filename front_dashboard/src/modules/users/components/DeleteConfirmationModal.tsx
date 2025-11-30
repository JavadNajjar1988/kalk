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
  useMediaQuery,
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
      default: return theme.palette.primary.main;
    }
  };

  // Soft surface like FieldEditDialog
  const getSoftSurface = () => {
    const primary = (theme.palette.primary.main || '#4a90e2').toLowerCase();
    const hex = primary.replace('#', '');
    if (hex.includes('10b981') || hex.includes('4caf50') || hex.includes('2e7d32')) return '#f0f4f3';
    if (hex.includes('4a90e2') || hex.includes('1976d2') || hex.includes('2196f3')) return '#f0f4f8';
    if (hex.includes('ef4444') || hex.includes('f44336') || hex.includes('d32f2f')) return '#fbf1f0';
    if (hex.includes('6b21a8') || hex.includes('9c27b0') || hex.includes('673ab7')) return '#22262d';
    if (hex.includes('f59e0b') || hex.includes('ff9800') || hex.includes('fb8c00')) return '#fbf1f1';

    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    const hexToRgb = (h: string) => {
      const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
      const r = parseInt(n.substring(0, 2), 16);
      const g = parseInt(n.substring(2, 4), 16);
      const b = parseInt(n.substring(4, 6), 16);
      return { r, g, b };
    };
    const rgbToHex = (r: number, g: number, b: number) =>
      `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
    const blendWithWhite = (h: string, primaryWeight = 0.10) => {
      const { r, g, b } = hexToRgb(h);
      const wr = 255, wg = 255, wb = 255;
      const w = 1 - primaryWeight;
      const br = wr * w + r * primaryWeight;
      const bg = wg * w + g * primaryWeight;
      const bb = wb * w + b * primaryWeight;
      return rgbToHex(br, bg, bb);
    };
    if (/^[0-9a-f]{3,6}$/.test(hex)) {
      return blendWithWhite(hex, 0.10);
    }
    try {
      const fallback = (theme.palette.primary.light || '#90caf9').toLowerCase().replace('#', '');
      return blendWithWhite(fallback, 0.08);
    } catch {
      return '#f5f7fa';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={isMobile ? 'xs' : 'sm'}
      fullScreen={isMobile}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: isMobile ? 0 : '20px',
          backgroundColor: (theme) => alpha(theme.palette.primary.light, 0.10),
          backdropFilter: 'blur(20px)',
          border: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          boxShadow: (theme) => `0 20px 60px ${alpha(theme.palette.primary.light, 0.3)}, inset 0 1px 0 rgba(255, 255, 255, 0.8)`,
          overflow: 'hidden',
          position: 'relative',
        },
        '& .MuiBackdrop-root': {
          backgroundColor: (theme) => `${alpha(theme.palette.primary.light, 0.08)}`,
          backdropFilter: 'blur(4px)',
        },
      }}
      aria-labelledby="user-delete-dialog-title"
      aria-describedby="user-delete-dialog-description"
    >
      <DialogTitle
        id="user-delete-dialog-title"
        sx={{
          backgroundColor: getSoftSurface(),
          borderBottom: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          textAlign: 'center',
          py: isMobile ? 2 : 3,
          px: isMobile ? 2 : 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
          <WarningIcon color="error" sx={{ mr: 0.5 }} />
          <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={700} color={(theme) => theme.palette.error.main}>
            تأیید حذف کاربر
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent id="user-delete-dialog-description" sx={{ p: 0, backgroundColor: getSoftSurface() }}>
        <Box sx={{ p: isMobile ? 2 : 4 }}>
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
        backgroundColor: getSoftSurface(),
        borderTop: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
        p: isMobile ? 2 : 3,
        gap: 1.5,
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          startIcon={<CancelIcon />}
          disabled={isDeleting}
          sx={{
            borderRadius: '12px',
            px: isMobile ? 2 : 3,
            py: isMobile ? 1 : 1.5,
            backgroundColor: 'rgba(148, 163, 184, 0.1)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            color: '#64748B',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: 'rgba(148, 163, 184, 0.15)',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(148, 163, 184, 0.2)',
            },
            flex: 1,
          }}
        >
          انصراف
        </Button>

        <Button
          onClick={handleConfirm}
          variant="contained"
          startIcon={<DeleteIcon />}
          disabled={isDeleting}
          sx={{
            borderRadius: '12px',
            px: isMobile ? 2 : 4,
            py: isMobile ? 1 : 1.5,
            backgroundColor: (theme) => theme.palette.error.main,
            color: 'white',
            fontWeight: 600,
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: (theme) => `0 4px 16px ${alpha(theme.palette.error.main, 0.3)}`,
            '&:hover': {
              backgroundColor: (theme) => theme.palette.error.dark,
              transform: 'translateY(-2px)',
              boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.error.main, 0.4)}`,
            },
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
