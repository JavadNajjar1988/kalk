import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Lock as PasswordIcon,
  Security as AccessIcon,
  PersonOff as DeactivateIcon,
  Person as ActivateIcon,
  Edit as EditIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { User, QuickActionPayload, PasswordChangeData, AccessLevelChangeData } from '../types';

interface QuickActionsModalProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onAction: (payload: QuickActionPayload) => Promise<void>;
  roles: Array<{ id: string; name: string; }>;
  accessLevels: Array<{ id: string; name: string; }>;
}

type ActionType = 'changePassword' | 'updateAccessLevel' | 'toggleActive' | null;

const QuickActionsModal: React.FC<QuickActionsModalProps> = ({
  user,
  open,
  onClose,
  onAction,
  roles,
  accessLevels,
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
      const normalised = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
      const r = parseInt(normalised.slice(0, 2), 16);
      const g = parseInt(normalised.slice(2, 4), 16);
      const b = parseInt(normalised.slice(4, 6), 16);
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

  const [selectedAction, setSelectedAction] = useState<ActionType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const softSurface = getSoftSurface();
  const cardBaseSx = {
    borderRadius: '16px',
    padding: { xs: 2, sm: 3 },
    backgroundColor:
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.background.paper, 0.7)
        : 'rgba(255, 255, 255, 0.95)',
    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
    boxShadow: `0 18px 38px ${alpha(theme.palette.primary.main, 0.16)}`,
    backdropFilter: 'blur(10px)',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
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
      backgroundColor: 'rgba(148, 163, 184, 0.16)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 22px rgba(148, 163, 184, 0.24)',
    },
    '&:disabled': {
      opacity: 0.6,
      transform: 'none',
      boxShadow: 'none',
    },
  } as const;
  const getPrimaryButtonSx = (variant: 'default' | 'destructive' = 'default') => {
    const mainColor = variant === 'destructive' ? theme.palette.error.main : theme.palette.primary.main;
    const darkColor = variant === 'destructive' ? theme.palette.error.dark : theme.palette.primary.dark;
    return {
      borderRadius: '12px',
      px: { xs: 2.2, sm: 3.5 },
      py: 1.2,
      background: `linear-gradient(135deg, ${mainColor} 0%, ${darkColor} 100%)`,
      color: '#ffffff',
      border: '2px solid rgba(255, 255, 255, 0.4)',
      boxShadow: `0 12px 32px ${alpha(mainColor, 0.32)}`,
      fontWeight: 700,
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: `0 16px 44px ${alpha(darkColor, 0.4)}`,
        background: `linear-gradient(135deg, ${darkColor} 0%, ${mainColor} 100%)`,
      },
      '&:disabled': {
        background: 'rgba(148, 163, 184, 0.4)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        color: 'rgba(255, 255, 255, 0.85)',
        transform: 'none',
        boxShadow: 'none',
      },
    };
  };
  const actionItemSx = {
    borderRadius: '12px',
    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
    backgroundColor:
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.background.paper, 0.55)
        : 'rgba(255, 255, 255, 0.75)',
    backdropFilter: 'blur(8px)',
    mb: 1.5,
    px: 2,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.light, 0.18),
      transform: 'translateY(-2px)',
      boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.22)}`,
    },
  } as const;
  const inputStyle = {
    mb: 2,
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      backgroundColor:
        theme.palette.mode === 'dark'
          ? alpha(theme.palette.background.paper, 0.65)
          : 'rgba(255, 255, 255, 0.82)',
      '& fieldset': {
        borderColor: alpha(theme.palette.primary.main, 0.2),
      },
      '&:hover fieldset': {
        borderColor: alpha(theme.palette.primary.main, 0.4),
      },
      '&.Mui-focused fieldset': {
        borderColor: alpha(theme.palette.primary.main, 0.6),
        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}`,
      },
    },
  } as const;
  
  // Password Change Form
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    newPassword: '',
    confirmPassword: '',
  });

  // Access Level Change Form
  const [accessData, setAccessData] = useState<AccessLevelChangeData>({
    newAccessLevel: user?.systemInfo.accessLevel || '',
    newRole: user?.systemInfo.role || '',
    newPermissions: user?.systemInfo.permissions || [],
  });

  const handleClose = () => {
    setSelectedAction(null);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setAccessData({
      newAccessLevel: user?.systemInfo.accessLevel || '',
      newRole: user?.systemInfo.role || '',
      newPermissions: user?.systemInfo.permissions || [],
    });
    onClose();
  };

  const handleAction = async () => {
    if (!user || !selectedAction) return;

    setIsLoading(true);
    try {
      let payload: QuickActionPayload;

      switch (selectedAction) {
        case 'changePassword':
          if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('رمز عبور و تأیید آن یکسان نیست');
            return;
          }
          payload = {
            userId: user.id,
            action: 'changePassword',
            data: passwordData,
          };
          break;

        case 'updateAccessLevel':
          payload = {
            userId: user.id,
            action: 'updateAccessLevel',
            data: accessData,
          };
          break;

        case 'toggleActive':
          payload = {
            userId: user.id,
            action: 'toggleActive',
            data: { isActive: !user.isActive },
          };
          break;

        default:
          return;
      }

      await onAction(payload);
      handleClose();
    } catch (error) {
      console.error('خطا در ارسال عملیات:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderActionSelection = () => (

    <Box sx={{ ...cardBaseSx, gap: 2.5 }}>

      <Typography

        variant="h6"

        sx={{

          mb: 1,

          fontWeight: 600,

          color: theme.palette.primary.main,

        }}

      >

        اقدامات سریع برای: {user?.personalInfo.fullName}

      </Typography>

      

      <List sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>

        <ListItem

          button

          onClick={() => setSelectedAction('changePassword')}

          sx={actionItemSx}

        >

          <ListItemIcon sx={{ color: theme.palette.primary.main }}>

            <PasswordIcon />

          </ListItemIcon>

          <ListItemText

            primaryTypographyProps={{ fontWeight: 600 }}

            primary="تغییر رمز عبور"

            secondary="تنظیم رمز عبور جدید برای کاربر"

          />

        </ListItem>



        <ListItem

          button

          onClick={() => setSelectedAction('updateAccessLevel')}

          sx={actionItemSx}

        >

          <ListItemIcon sx={{ color: theme.palette.info.main }}>

            <AccessIcon />

          </ListItemIcon>

          <ListItemText

            primaryTypographyProps={{ fontWeight: 600 }}

            primary="به‌روزرسانی سطح دسترسی"

            secondary="انتخاب نقش و سطح دسترسی تازه برای کاربر"

          />

        </ListItem>



        <ListItem

          button

          onClick={() => setSelectedAction('toggleActive')}

          sx={actionItemSx}

        >

          <ListItemIcon sx={{ color: user?.isActive ? theme.palette.error.main : theme.palette.success.main }}>

            {user?.isActive ? <DeactivateIcon /> : <ActivateIcon />}

          </ListItemIcon>

          <ListItemText

            primaryTypographyProps={{ fontWeight: 600 }}

            primary={user?.isActive ? 'غیرفعال کردن حساب کاربری' : 'فعال کردن حساب کاربری'}

            secondary={user?.isActive ? 'کاربر پس از غیرفعال‌سازی قادر به ورود نخواهد بود' : 'با فعال‌سازی، دسترسی کاربر مجدداً برقرار می‌شود'}

          />

        </ListItem>

      </List>

    </Box>

  );



const renderPasswordForm = () => (

    <Box sx={{ ...cardBaseSx, gap: 2.5 }}>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>

        <PasswordIcon sx={{ color: theme.palette.primary.main }} />

        <Typography variant="h6" fontWeight={600}>تغییر رمز عبور</Typography>

      </Box>

      

      <Alert

        severity="info"

        sx={{

          backgroundColor: 'rgba(148, 163, 184, 0.12)',

          border: '1px solid rgba(148, 163, 184, 0.3)',

          color: '#475569',

          borderRadius: '12px',

          backdropFilter: 'blur(6px)',

          fontWeight: 500,

        }}

      >

        برای امنیت بیشتر از رمز عبور قوی و حداقل ۸ کاراکتر استفاده کنید.

      </Alert>



      <TextField

        fullWidth

        type="password"

        label="رمز عبور جدید"

        value={passwordData.newPassword}

        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}

        sx={inputStyle}

      />



      <TextField

        fullWidth

        type="password"

        label="تأیید رمز عبور جدید"

        value={passwordData.confirmPassword}

        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}

        error={passwordData.confirmPassword !== '' && passwordData.newPassword !== passwordData.confirmPassword}

        helperText={passwordData.confirmPassword !== '' && passwordData.newPassword !== passwordData.confirmPassword ? 'رمز عبور و تأیید آن یکسان نیست' : ''}

        sx={inputStyle}

      />

    </Box>

  );



const renderAccessLevelForm = () => (

    <Box sx={{ ...cardBaseSx, gap: 2.5 }}>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>

        <AccessIcon sx={{ color: theme.palette.info.main }} />

        <Typography variant="h6" fontWeight={600}>به‌روزرسانی سطح دسترسی</Typography>

      </Box>



      <Alert

        severity="warning"

        sx={{

          backgroundColor: alpha(theme.palette.warning.main, 0.12),

          border: `1px solid ${alpha(theme.palette.warning.main, 0.25)}`,

          color: theme.palette.warning.dark,

          borderRadius: '12px',

          backdropFilter: 'blur(6px)',

          fontWeight: 500,

        }}

      >

        تغییر نقش یا سطح دسترسی می‌تواند توانایی‌های کاربر را تغییر دهد.

      </Alert>



      <FormControl fullWidth sx={inputStyle}>

        <InputLabel>نقش کاربری</InputLabel>

        <Select

          value={accessData.newRole}

          onChange={(e) => setAccessData(prev => ({ ...prev, newRole: e.target.value }))}

          label="نقش کاربری"

        >

          {roles.map((role) => (

            <MenuItem key={role.id} value={role.name}>

              {role.name}

            </MenuItem>

          ))}

        </Select>

      </FormControl>



      <FormControl fullWidth sx={inputStyle}>

        <InputLabel>سطح دسترسی</InputLabel>

        <Select

          value={accessData.newAccessLevel}

          onChange={(e) => setAccessData(prev => ({ ...prev, newAccessLevel: e.target.value }))}

          label="سطح دسترسی"

        >

          {accessLevels.map((level) => (

            <MenuItem key={level.id} value={level.name}>

              {level.name}

            </MenuItem>

          ))}

        </Select>

      </FormControl>



      <Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>مجوزهای فعلی:</Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>

          {user?.systemInfo.permissions.map((permission) => (

            <Chip

              key={permission}

              label={permission}

              size="small"

              sx={{

                borderRadius: '8px',

                backgroundColor: 'rgba(148, 163, 184, 0.16)',

                border: '1px solid rgba(148, 163, 184, 0.24)',

                color: '#475569',

              }}

            />

          ))}

        </Box>

      </Box>

    </Box>

  );



const renderToggleActiveConfirmation = () => (

    <Box sx={{ ...cardBaseSx, gap: 2.5 }}>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>

        {user?.isActive ? (

          <DeactivateIcon sx={{ color: theme.palette.error.main }} />

        ) : (

          <ActivateIcon sx={{ color: theme.palette.success.main }} />

        )}

        <Typography variant="h6" fontWeight={600}>

          {user?.isActive ? 'غیرفعال کردن حساب کاربری' : 'فعال کردن حساب کاربری'}

        </Typography>

      </Box>



      <Alert

        severity={user?.isActive ? "warning" : "info"}

        sx={{

          mb: 2,

          backgroundColor: user?.isActive ? alpha(theme.palette.error.main, 0.12) : alpha(theme.palette.info.main, 0.12),

          border: `1px solid ${user?.isActive ? alpha(theme.palette.error.main, 0.3) : alpha(theme.palette.info.main, 0.3)}`,

          color: user?.isActive ? theme.palette.error.main : theme.palette.info.dark,

          borderRadius: '12px',

          backdropFilter: 'blur(6px)',

          fontWeight: 500,

        }}

      >

        {user?.isActive

          ? 'با غیرفعال کردن حساب، کاربر امکان ورود به سامانه را نخواهد داشت.'

          : 'با فعال کردن حساب، دسترسی کاربر به سامانه برقرار می‌شود.'

        }

      </Alert>



      <Box

        sx={{

          p: { xs: 2, sm: 2.5 },

          borderRadius: '12px',

          backgroundColor:

            theme.palette.mode === 'dark'

              ? alpha(theme.palette.background.paper, 0.6)

              : 'rgba(255, 255, 255, 0.9)',

          border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,

          backdropFilter: 'blur(6px)',

          display: 'grid',

          gap: 1,

        }}

      >

        <Typography variant="body2"><strong>نام:</strong> {user?.personalInfo.fullName}</Typography>

        <Typography variant="body2"><strong>کد کاربری:</strong> {user?.userCode}</Typography>

        <Typography variant="body2"><strong>نقش:</strong> {user?.systemInfo.role}</Typography>

        <Typography variant="body2"><strong>وضعیت حساب:</strong> {user?.isActive ? 'فعال' : 'غیرفعال'}</Typography>

      </Box>

    </Box>

  );



const renderContent = () => {
    switch (selectedAction) {
      case 'changePassword':
        return renderPasswordForm();
      case 'updateAccessLevel':
        return renderAccessLevelForm();
      case 'toggleActive':
        return renderToggleActiveConfirmation();
      default:
        return renderActionSelection();
    }
  };

  const isFormValid = () => {
    switch (selectedAction) {
      case 'changePassword':
        return passwordData.newPassword.length >= 8 && 
               passwordData.newPassword === passwordData.confirmPassword;
      case 'updateAccessLevel':
        return accessData.newRole && accessData.newAccessLevel;
      case 'toggleActive':
        return true;
      default:
        return false;
    }
  };
  const isDestructiveAction = selectedAction === 'toggleActive' && user?.isActive;

  if (!user) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: isMobile ? 0 : '20px',
          backgroundColor: (theme) => alpha(theme.palette.primary.light, 0.1),
          backdropFilter: 'blur(20px)',
          border: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          boxShadow: (theme) => `0 20px 60px ${alpha(theme.palette.primary.light, 0.3)}, inset 0 1px 0 rgba(255, 255, 255, 0.75)`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: { xs: '100vh', sm: '90vh' },
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
          <EditIcon sx={{ color: theme.palette.primary.main }} />
          <Typography
            component="h2"
            variant={isMobile ? 'h6' : 'h5'}
            sx={{ fontWeight: 700, color: theme.palette.primary.main }}
          >
            اقدامات سریع
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            minWidth: 'auto',
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
      </DialogTitle>

      <DialogContent sx={{ p: 0, backgroundColor: softSurface }}>
        <Box sx={{ p: { xs: 2.5, sm: 3.5 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {renderContent()}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          backgroundColor: softSurface,
          borderTop: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          p: isMobile ? 2 : 3,
          justifyContent: 'flex-end',
          gap: 1.5,
        }}
      >
        {selectedAction && (
          <Button
            onClick={() => setSelectedAction(null)}
            disabled={isLoading}
            sx={secondaryButtonSx}
          >
            بازگشت
          </Button>
        )}

        <Button
          onClick={handleClose}
          disabled={isLoading}
          sx={secondaryButtonSx}
        >
          انصراف
        </Button>

        {selectedAction && (
          <Button
            variant="contained"
            onClick={handleAction}
            disabled={!isFormValid() || isLoading}
            sx={getPrimaryButtonSx(isDestructiveAction ? 'destructive' : 'default')}
          >
            {isLoading ? 'در حال انجام...' : 'تأیید'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default QuickActionsModal;
