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
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
} from '@mui/material';
import {
  Lock as PasswordIcon,
  Security as AccessIcon,
  PersonOff as DeactivateIcon,
  Person as ActivateIcon,
  Edit as EditIcon,
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
  const [selectedAction, setSelectedAction] = useState<ActionType>(null);
  const [isLoading, setIsLoading] = useState(false);
  
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
            alert('رمز عبور و تکرار آن یکسان نیستند');
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
      console.error('خطا در اجرای عملیات:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderActionSelection = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        انتخاب عملیات برای: {user?.personalInfo.fullName}
      </Typography>
      
      <List>
        <ListItem
          button
          onClick={() => setSelectedAction('changePassword')}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            mb: 1,
            '&:hover': { bgcolor: theme.palette.action.hover }
          }}
        >
          <ListItemIcon>
            <PasswordIcon color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="تغییر رمز عبور"
            secondary="تنظیم رمز عبور جدید برای کاربر"
          />
        </ListItem>

        <ListItem
          button
          onClick={() => setSelectedAction('updateAccessLevel')}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            mb: 1,
            '&:hover': { bgcolor: theme.palette.action.hover }
          }}
        >
          <ListItemIcon>
            <AccessIcon color="warning" />
          </ListItemIcon>
          <ListItemText
            primary="تغییر سطح دسترسی"
            secondary="ویرایش نقش و سطح دسترسی کاربر"
          />
        </ListItem>

        <ListItem
          button
          onClick={() => setSelectedAction('toggleActive')}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            mb: 1,
            '&:hover': { bgcolor: theme.palette.action.hover }
          }}
        >
          <ListItemIcon>
            {user?.isActive ? (
              <DeactivateIcon color="error" />
            ) : (
              <ActivateIcon color="success" />
            )}
          </ListItemIcon>
          <ListItemText
            primary={user?.isActive ? 'غیرفعال کردن کاربر' : 'فعال کردن کاربر'}
            secondary={user?.isActive ? 'کاربر قادر به ورود نخواهد بود' : 'کاربر قادر به ورود خواهد بود'}
          />
        </ListItem>
      </List>
    </Box>
  );

  const renderPasswordForm = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <PasswordIcon sx={{ mr: 1 }} />
        تغییر رمز عبور
      </Typography>
      
      <Alert severity="info" sx={{ mb: 2 }}>
        رمز عبور جدید باید حداقل ۸ کاراکتر و شامل حروف، اعداد و نمادها باشد.
      </Alert>

      <TextField
        fullWidth
        type="password"
        label="رمز عبور جدید"
        value={passwordData.newPassword}
        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        type="password"
        label="تکرار رمز عبور جدید"
        value={passwordData.confirmPassword}
        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
        error={passwordData.confirmPassword !== '' && passwordData.newPassword !== passwordData.confirmPassword}
        helperText={passwordData.confirmPassword !== '' && passwordData.newPassword !== passwordData.confirmPassword ? 'رمز عبور و تکرار آن یکسان نیستند' : ''}
      />
    </Box>
  );

  const renderAccessLevelForm = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <AccessIcon sx={{ mr: 1 }} />
        تغییر سطح دسترسی
      </Typography>

      <Alert severity="warning" sx={{ mb: 2 }}>
        تغییر سطح دسترسی بر روی قابلیت‌های کاربر تأثیر خواهد گذاشت.
      </Alert>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>نقش سیستمی</InputLabel>
        <Select
          value={accessData.newRole}
          onChange={(e) => setAccessData(prev => ({ ...prev, newRole: e.target.value }))}
          label="نقش سیستمی"
        >
          {roles.map((role) => (
            <MenuItem key={role.id} value={role.name}>
              {role.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
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
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          مجوزهای فعلی:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {user?.systemInfo.permissions.map((permission) => (
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
  );

  const renderToggleActiveConfirmation = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        {user?.isActive ? (
          <DeactivateIcon sx={{ mr: 1 }} color="error" />
        ) : (
          <ActivateIcon sx={{ mr: 1 }} color="success" />
        )}
        {user?.isActive ? 'غیرفعال کردن کاربر' : 'فعال کردن کاربر'}
      </Typography>

      <Alert severity={user?.isActive ? "warning" : "info"} sx={{ mb: 2 }}>
        {user?.isActive 
          ? 'با غیرفعال کردن این کاربر، وی قادر به ورود به سیستم نخواهد بود.'
          : 'با فعال کردن این کاربر، وی قادر به ورود به سیستم خواهد بود.'
        }
      </Alert>

      <Box sx={{ p: 2, bgcolor: theme.palette.grey[50], borderRadius: 2 }}>
        <Typography variant="body2">
          <strong>کاربر:</strong> {user?.personalInfo.fullName}
        </Typography>
        <Typography variant="body2">
          <strong>کد کاربری:</strong> {user?.userCode}
        </Typography>
        <Typography variant="body2">
          <strong>نقش:</strong> {user?.systemInfo.role}
        </Typography>
        <Typography variant="body2">
          <strong>وضعیت فعلی:</strong> {user?.isActive ? 'فعال' : 'غیرفعال'}
        </Typography>
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

  if (!user) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <EditIcon sx={{ mr: 1 }} />
          تغییرات فوری
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {renderContent()}
      </DialogContent>
      
      <DialogActions>
        {selectedAction && (
          <Button
            onClick={() => setSelectedAction(null)}
            disabled={isLoading}
          >
            بازگشت
          </Button>
        )}
        
        <Button
          onClick={handleClose}
          disabled={isLoading}
        >
          انصراف
        </Button>
        
        {selectedAction && (
          <Button
            variant="contained"
            onClick={handleAction}
            disabled={!isFormValid() || isLoading}
            color={selectedAction === 'toggleActive' && user.isActive ? 'error' : 'primary'}
          >
            {isLoading ? 'در حال انجام...' : 'تأیید'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default QuickActionsModal;