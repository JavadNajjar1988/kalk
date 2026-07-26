import React, { useEffect, useState } from 'react';
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
  buildResourcesLayerDialogSx,
  resourcesDialogTitleSx,
  resourcesDialogContentDividersSx,
  resourcesDialogActionsSx,
  resourcesOutlinedCancelButtonSx,
} from '@/modules/dashboard/pages/resources/resourcesDialogStyles';
import {
  Lock as PasswordIcon,
  Security as AccessIcon,
  PersonOff as DeactivateIcon,
  Person as ActivateIcon,
  Edit as EditIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { User, QuickActionPayload, PasswordChangeData, AccessLevelChangeData } from '../types';
import { getRoleProfile } from '../utils/userPresentation';

interface QuickActionsModalProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onAction: (payload: QuickActionPayload) => Promise<void>;
  roles: Array<{ id: string; name: string; }>;
}

type ActionType = 'changePassword' | 'updateAccessLevel' | 'toggleActive' | null;

const QuickActionsModal: React.FC<QuickActionsModalProps> = ({
  user,
  open,
  onClose,
  onAction,
  roles,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const displayFullName =
    (user?.personalInfo?.fullName || user?.personalInfo?.fullNameEn || user?.username || user?.userCode || 'کاربر').trim();
  const permissions = Array.isArray(user?.systemInfo?.permissions) ? user.systemInfo.permissions : [];

  const [selectedAction, setSelectedAction] = useState<ActionType>(null);
  const [isLoading, setIsLoading] = useState(false);
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

  useEffect(() => {
    if (!user) return;
    const profile = getRoleProfile(user.systemInfo.role, roles);
    setAccessData({
      newRole: profile.role,
      newAccessLevel: profile.accessLevel,
      newPermissions: profile.permissions,
    });
  }, [user?.id, user?.systemInfo.role]);

  const getAccessLevelDescription = (level: string): string => {
    if (!level) return '';
    if (level.includes('سطح 1')) {
      return 'دسترسی کامل به تمام ماژول‌ها، مدیریت کاربران و تنظیمات سامانه.';
    }
    if (level.includes('سطح 2')) {
      return 'دسترسی عملیاتی: مدیریت/اجرای سناریوها و مشاهده کاربران، بدون دسترسی به تنظیمات حساس سامانه.';
    }
    if (level.includes('سطح 3')) {
      return 'دسترسی محدود: مشاهده داشبورد، نقشه و گزارش‌ها، بدون امکان ویرایش داده‌ها یا کاربران.';
    }
    if (level.includes('سطح 4')) {
      return 'دسترسی مهمان: فقط مشاهده‌ی محدود برخی اطلاعات، بدون هیچ عملیات مدیریتی.';
    }
    return 'سطح دسترسی سفارشی؛ سیاست‌های دسترسی آن باید در سامانه تعریف شود.';
  };

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

        اقدامات سریع برای: {displayFullName}

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

          onChange={(e) => {
            const profile = getRoleProfile(e.target.value, roles);
            setAccessData({
              newRole: profile.role,
              newAccessLevel: profile.accessLevel,
              newPermissions: profile.permissions,
            });
          }}

          label="نقش کاربری"

        >

          {roles.map((role) => (

            <MenuItem key={role.id} value={role.name}>

              {role.name}

            </MenuItem>

          ))}

        </Select>

      </FormControl>



      <TextField
        fullWidth
        label="سطح دسترسی"
        value={accessData.newAccessLevel}
        InputProps={{ readOnly: true }}
        helperText="سطح دسترسی و مجوزها از نقش انتخاب‌شده تعیین می‌شوند."
        sx={inputStyle}
      />

      {accessData.newAccessLevel && (
        <Alert
          severity="info"
          sx={{
            mt: 1,
            backgroundColor: alpha(theme.palette.info.main, 0.06),
            border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
            borderRadius: '10px',
            color: theme.palette.info.dark,
            fontSize: '0.85rem',
          }}
        >
          <strong>توضیح این سطح:</strong> {getAccessLevelDescription(accessData.newAccessLevel)}
        </Alert>
      )}



      <Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>مجوزهای فعلی:</Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>

          {permissions.map((permission) => (

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

        <Typography variant="body2"><strong>نام:</strong> {displayFullName}</Typography>

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
      sx={[
        buildResourcesLayerDialogSx(theme, isMobile),
        {
          '& .MuiDialog-paper': {
            display: 'flex',
            flexDirection: 'column',
            maxHeight: { xs: '100vh', sm: '90vh' },
            overflow: 'hidden',
          },
        },
      ]}
    >
      <DialogTitle
        sx={{
          ...resourcesDialogTitleSx(theme),
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

      <DialogContent dividers sx={{ ...resourcesDialogContentDividersSx(theme), p: 0 }}>
        <Box sx={{ p: { xs: 2.5, sm: 3.5 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {renderContent()}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          ...resourcesDialogActionsSx(theme),
          justifyContent: 'flex-end',
        }}
      >
        {selectedAction && (
          <Button
            onClick={() => setSelectedAction(null)}
            disabled={isLoading}
            variant="outlined"
            color="inherit"
            sx={resourcesOutlinedCancelButtonSx(theme)}
          >
            بازگشت
          </Button>
        )}

        <Button
          onClick={handleClose}
          disabled={isLoading}
          variant="outlined"
          color="inherit"
          sx={resourcesOutlinedCancelButtonSx(theme)}
        >
          انصراف
        </Button>

        {selectedAction && (
          <Button
            variant="contained"
            color={isDestructiveAction ? 'error' : 'primary'}
            onClick={handleAction}
            disabled={!isFormValid() || isLoading}
            sx={{ borderRadius: 2, px: 3 }}
          >
            {isLoading ? 'در حال انجام...' : 'تأیید'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default QuickActionsModal;
