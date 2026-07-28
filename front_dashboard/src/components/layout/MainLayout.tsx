import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  Badge,
  Tooltip,
  Paper,
  alpha,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Alert,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Dashboard,
  People,
  Help,
  Warning as WarningIcon,
  CheckCircle,
  AccountBox,
  ExitToApp,
  Assignment,
  KeyboardBackspace,
  UploadFile,
  ManageAccounts,
  AddAPhoto,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { navigateToPreviousStep } from '@/utils/navigation';
import { useAppSelector, useAppDispatch } from '@/store';
import { selectUser, logout, updateUser } from '@/store/slices/authSlice';
import {
  selectLayout,
  selectSidePanel,
  toggleSidebar,
  toggleSidePanel,
} from '@/store/slices/uiSlice';
import {
  fetchServerNotifications,
  markAllServerNotificationsRead,
  markServerNotificationRead,
  selectServerNotifications,
  selectServerNotificationsError,
  selectServerNotificationsLoading,
  selectUnreadServerNotifications,
} from '@/store/slices/serverNotificationsSlice';
import type { ServerNotification } from '@/services/api/notificationsApiService';
import SidePanel from './SidePanel';
import NotificationBellPopover from './NotificationBellPopover';
import PersianDateTime from '@/components/common/PersianDateTime';
import { useTranslation } from '@/hooks/useTranslation';
import SearchBar from '@/components/common/SearchBar';
import {
  canAccessFeature,
  SIDEBAR_FEATURES,
} from '@/security/roleAccess';
import AvatarPicker from '@/modules/users/components/AvatarPicker';
import { resolveAvatarSrc } from '@/modules/users/utils/avatarOptions';
import { getAccessLevelColor } from '@/modules/users/utils/userPresentation';
import {
  resourcesMenuPaperSx,
  resourcesDialogTitleSx,
  resourcesDialogActionsSx,
} from '@/modules/dashboard/pages/resources/resourcesDialogStyles';

const DRAWER_WIDTH = 180; // further narrow sidebar width for more main content space
const DRAWER_WIDTH_COLLAPSED = 60;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  
  const user = useAppSelector(selectUser);
  const notifications = useAppSelector(selectServerNotifications);
  const unreadNotifications = useAppSelector(selectUnreadServerNotifications);
  const notificationsLoading = useAppSelector(selectServerNotificationsLoading);
  const notificationsError = useAppSelector(selectServerNotificationsError);
  const layout = useAppSelector(selectLayout);
  const sidePanel = useAppSelector(selectSidePanel);
  const userAccessColor = getAccessLevelColor(theme, user?.accessLevel);
  const [notificationsMenuAnchor, setNotificationsMenuAnchor] = useState<null | HTMLElement>(null);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [searchValue, setSearchValue] = useState('');
  const [notifDialogOpen, setNotifDialogOpen] = useState(false);
  const [notifDialogData, setNotifDialogData] =
    useState<ServerNotification | null>(null);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | undefined>();
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  // حذف stateهای جداگانه و استفاده از یک state واحد برای مدیریت نمایش المان‌ها
  const [sidebarElementsVisible, setSidebarElementsVisible] = useState({
    labels: !layout.sidebarCollapsed,
    dateTime: !layout.sidebarCollapsed
  });

  useEffect(() => {
    setSidebarElementsVisible({
      labels: !layout.sidebarCollapsed,
      dateTime: !layout.sidebarCollapsed
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    void dispatch(fetchServerNotifications(false));
    const refreshTimer = window.setInterval(
      () => void dispatch(fetchServerNotifications(false)),
      30_000,
    );
    const token = localStorage.getItem('access_token');
    if (!token) return () => window.clearInterval(refreshTimer);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let stopped = false;
    const connect = () => {
      socket = new WebSocket(
        `${protocol}//${window.location.host}/api/ws/notifications`,
        ['access-token', token],
      );
      socket.onmessage = () => void dispatch(fetchServerNotifications(false));
      socket.onclose = () => {
        if (!stopped) reconnectTimer = window.setTimeout(connect, 3_000);
      };
    };
    connect();
    const pingTimer = window.setInterval(() => {
      if (socket?.readyState === WebSocket.OPEN) socket.send('ping');
    }, 25_000);
    return () => {
      stopped = true;
      window.clearInterval(refreshTimer);
      window.clearInterval(pingTimer);
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [dispatch, user?.id]);

  // مدیریت انیمیشن باز و بسته شدن المان‌های منو با استفاده از یک state واحد
  useEffect(() => {
    let labelsTimeout: NodeJS.Timeout;
    let dateTimeTimeout: NodeJS.Timeout;
    
    if (!layout.sidebarCollapsed) {
      // وقتی منو باز می‌شود، لیبل‌ها را با تاخیر نمایش بده
      labelsTimeout = setTimeout(() => {
        setSidebarElementsVisible(prev => ({ ...prev, labels: true }));
      }, 250);
      
      // نمایش ساعت و تاریخ با تاخیر بعد از لیبل‌ها
      dateTimeTimeout = setTimeout(() => {
        setSidebarElementsVisible(prev => ({ ...prev, dateTime: true }));
      }, 500);
    } else {
      // وقتی منو بسته می‌شود، بلافاصله المان‌ها را مخفی کن
      setSidebarElementsVisible({ labels: false, dateTime: false });
    }
    
    return () => {
      clearTimeout(labelsTimeout);
      clearTimeout(dateTimeTimeout);
    };
  }, [layout.sidebarCollapsed]);

  const unreadCount = unreadNotifications.length;
  const isDashboardHome = location.pathname === '/dashboard';

  const menuItems = [
    { 
      id: 'home', 
      label: t('menu.dashboard'), 
      icon: <Dashboard />, 
      path: '/dashboard',
      feature: SIDEBAR_FEATURES.home,
    },
    { 
      id: 'scenarios', 
      label: 'مدیریت سناریوها', 
      icon: <Assignment />, 
      path: '/dashboard/scenarios',
      feature: SIDEBAR_FEATURES.scenarios,
    },
    { 
      id: 'users', 
      label: 'مدیریت کاربران', 
      icon: <People />, 
      path: '/dashboard/users',
      feature: SIDEBAR_FEATURES.users,
    },
    { 
      id: 'resources-module', 
      label: 'مدیریت منابع', 
      icon: <AccountBox />, 
      path: '/dashboard/resources',
      feature: SIDEBAR_FEATURES.resources,
    },
    {
      id: 'data-management',
      label: 'مدیریت داده',
      icon: <UploadFile />,
      path: '/dashboard/data-management',
      feature: SIDEBAR_FEATURES.dataManagement,
    },
  ];

  const currentRole = user?.role || 'viewer';
  const filteredMenuItems = menuItems.filter(item =>
    canAccessFeature(currentRole, item.feature)
  );
  const canManageSettings = canAccessFeature(currentRole, 'settings.manage');
  const canViewUsers = canAccessFeature(currentRole, 'users.view');
  const visibleMenuItems = filteredMenuItems.length > 0
    ? filteredMenuItems
    : menuItems.filter(item => item.id === 'home');

  const handleNotificationsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsMenuAnchor(event.currentTarget);
  };

  const handleNotificationsMenuClose = () => {
    setNotificationsMenuAnchor(null);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleOpenManagedProfile = () => {
    handleProfileMenuClose();
    if (user?.id && canViewUsers) {
      navigate(`/dashboard/users/${user.id}`);
    }
  };

  const handleOpenAvatarPicker = () => {
    setSelectedAvatar(user?.avatar);
    setAvatarError(null);
    setAvatarDialogOpen(true);
    handleProfileMenuClose();
  };

  const handleSaveAvatar = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    setAvatarSaving(true);
    setAvatarError(null);
    try {
      const response = await fetch('/api/auth/me/avatar', {
        method: 'PATCH',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ avatar: selectedAvatar || null }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.detail || payload?.message || 'ذخیره آواتار انجام نشد');
      }
      dispatch(updateUser({ avatar: selectedAvatar }));
      setAvatarDialogOpen(false);
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'ذخیره آواتار انجام نشد');
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('user');
    navigate('/auth/login');
    handleProfileMenuClose();
  };

  const handleMenuItemClick = (path: string) => {
    navigate(path);
  };

  const isActiveRoute = (path: string): boolean => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const handleSettingsClick = () => {
    dispatch(toggleSidePanel('settings'));
  };

  const handleHelpClick = () => {
    navigate('/dashboard/help');
  };

  const handleNotificationsClick = (event: React.MouseEvent<HTMLElement>) => {
    handleNotificationsMenuOpen(event);
    void dispatch(fetchServerNotifications(false));
  };

  const handleNotificationSelect = (notification: ServerNotification) => {
    if (!notification.read) {
      void dispatch(markServerNotificationRead(notification.id));
    }
    setNotifDialogData(notification);
    setNotifDialogOpen(true);
    handleNotificationsMenuClose();
  };

  const handleMarkAllNotificationsRead = () => {
    void dispatch(markAllServerNotificationsRead());
  };

  const handleRefreshNotifications = () => {
    void dispatch(fetchServerNotifications(false));
  };

  const handleViewAllNotifications = () => {
    handleNotificationsMenuClose();
    navigate('/dashboard/notifications');
  };

  const handleNotificationAction = () => {
    const actionUrl = notifDialogData?.actionUrl;
    setNotifDialogOpen(false);
    if (!actionUrl) return;

    const target = new URL(actionUrl, window.location.origin);
    if (!['http:', 'https:'].includes(target.protocol)) return;
    if (target.origin === window.location.origin) {
      navigate(`${target.pathname}${target.search}${target.hash}`);
      return;
    }
    window.location.assign(target.toString());
  };

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    handleProfileMenuOpen(event);
  };

  const handleSidebarToggle = () => {
    if (!layout.sidebarCollapsed) {
      setSidebarElementsVisible({ labels: false, dateTime: false });
      dispatch(toggleSidebar());
    } else {
      dispatch(toggleSidebar());
      setTimeout(() => {
        setSidebarElementsVisible({ labels: true, dateTime: true });
      }, 500);
    }
  };

  const handleBackToPreviousStep = () => {
    if (!isDashboardHome) {
      navigateToPreviousStep(navigate, location.pathname);
    }
  };


  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          bgcolor: 'background.default',
          color: 'text.primary',
          boxShadow: 'none',
          border: 'none',
          backdropFilter: 'none',
          background: theme.palette.background.default,
        }}
      >
        <Toolbar sx={{ 
          minHeight: '64px !important', 
          px: { xs: 1, sm: 2 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
          mt: 0.5,
        }}>
          {/* بخش سمت راست */}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}>
            {/* منوی همبرگر */}
            <IconButton
              edge="start"
              onClick={handleSidebarToggle}
              sx={{ 
                mr: 1,
                borderRadius: '50%',
                transition: 'all 0.2s ease',
                width: 40,
                height: 40,
                '&:hover': {
                  bgcolor: alpha(theme.palette.action.hover, 0.08),
                  transform: 'scale(1.05)',
                },
                '&:focus': { outline: 'none' },
                '&:focus-visible': { outline: 'none' },
              }}
            >
              <MenuIcon fontSize="small" />
            </IconButton>

            {/* لوگو و عنوان */}
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 1.5 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: '22px',
                  letterSpacing: '-0.5px',
                  fontFamily: 'Yekan, serif',
                }}
              >
                ساجد
              </Typography>
            </Box>
          </Box>

          {/* جستجو مشابه Gmail - در وسط */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            flexGrow: 1, 
            position: 'absolute', 
            left: '50%', 
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '45%',
            maxWidth: '550px',
            zIndex: 1,
          }}>
            <SearchBar
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              onSubmit={val => {
                if (val) navigate(`/dashboard/search?q=${encodeURIComponent(val)}`);
              }}
              onClear={() => setSearchValue('')}
            />
          </Box>

          {/* بخش سمت چپ */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* راهنما */}
            <Tooltip title={t('layout.helpTooltip')}>
              <IconButton
                onClick={handleHelpClick}
                sx={{ 
                  color: 'text.primary',
                  width: 40,
                  height: 40,
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                }}
              >
                <Help fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* اعلان‌ها */}
            <Tooltip title={t('layout.notificationsTooltip')}>
              <IconButton
                onClick={handleNotificationsClick}
                aria-label={
                  unreadCount > 0
                    ? `${unreadCount.toLocaleString('fa-IR')} اعلان خوانده‌نشده`
                    : 'اعلان‌ها'
                }
                aria-haspopup="dialog"
                aria-controls={
                  notificationsMenuAnchor
                    ? 'notification-bell-popover'
                    : undefined
                }
                aria-expanded={Boolean(notificationsMenuAnchor)}
                sx={{ 
                  color: 'text.primary',
                  width: 40,
                  height: 40,
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                }}
              >
                <Badge
                  badgeContent={unreadCount}
                  max={99}
                  color="error"
                  overlap="circular"
                  invisible={unreadCount === 0}
                  sx={{
                    '& .MuiBadge-badge': {
                      minWidth: 17,
                      height: 17,
                      px: 0.5,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                    },
                  }}
                >
                  <NotificationsIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* تنظیمات */}
            {canManageSettings && <Tooltip title={t('layout.settingsTooltip')}>
              <IconButton
                onClick={handleSettingsClick}
                sx={{ 
                  color: 'text.primary',
                  width: 40,
                  height: 40,
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                }}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>}

            {/* پروفایل کاربر */}
            <Tooltip title="اطلاعات حساب کاربری">
              <Button
                onClick={handleProfileClick}
                sx={{
                  minWidth: { xs: 40, sm: 156 },
                  height: 44,
                  p: { xs: 0, sm: '4px 8px' },
                  ml: 1,
                  color: 'text.primary',
                  justifyContent: 'flex-start',
                  borderRadius: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  }
                }}
              >
                <Avatar
                  src={resolveAvatarSrc(user?.avatar)}
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: userAccessColor,
                    fontSize: '14px',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {user?.name?.charAt(0) || 'ک'}
                </Avatar>
                <Box
                  sx={{
                    display: { xs: 'none', sm: 'block' },
                    minWidth: 0,
                    ml: 1,
                    textAlign: 'left',
                    lineHeight: 1.2,
                  }}
                >
                  <Typography variant="body2" noWrap sx={{ maxWidth: 104, fontWeight: 700 }}>
                    {user?.name || user?.username}
                  </Typography>
                  <Typography variant="caption" noWrap color="text.secondary" sx={{ display: 'block', maxWidth: 104 }}>
                    {user?.roleTitle || user?.role}
                  </Typography>
                </Box>
              </Button>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <NotificationBellPopover
        anchorEl={notificationsMenuAnchor}
        notifications={notifications}
        unreadCount={unreadCount}
        loading={notificationsLoading}
        error={notificationsError}
        onClose={handleNotificationsMenuClose}
        onSelect={handleNotificationSelect}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onRefresh={handleRefreshNotifications}
        onViewAll={handleViewAllNotifications}
      />

      {/* منوی پروفایل */}
      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={handleProfileMenuClose}
        PaperProps={{
          sx: resourcesMenuPaperSx(theme, {
            mt: 1.5,
            minWidth: 300,
            maxWidth: 340,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1.5,
              borderRadius: 1,
              mx: 1,
              my: 0.5,
            },
          }),
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header با اطلاعات کاربر */}
        <Box sx={{ p: 2.5, ...resourcesDialogTitleSx(theme) }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={resolveAvatarSrc(user?.avatar)}
              sx={{
                width: 48,
                height: 48,
                bgcolor: userAccessColor,
                fontSize: '1.2rem',
                fontWeight: 600,
              }}
            >
              {user?.name?.charAt(0) || user?.username?.charAt(0) || 'ک'}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, color: userAccessColor }}>
                {user?.name || 'کاربر'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                {user?.email || `${user?.username}@sajed.mil`}
              </Typography>
              <Chip
                size="small"
                label={user?.roleTitle || user?.role}
                variant="outlined"
                sx={{ mt: 0.75, maxWidth: '100%', color: userAccessColor, borderColor: userAccessColor }}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 2 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary">کد کاربری</Typography>
              <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                {user?.userCode || 'ثبت نشده'}
              </Typography>
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary">سطح دسترسی</Typography>
              <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                {user?.accessLevel || 'ثبت نشده'}
              </Typography>
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary">سمت / درجه</Typography>
              <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                {user?.rank || user?.position || 'ثبت نشده'}
              </Typography>
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary">یگان</Typography>
              <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                {user?.unit || 'ثبت نشده'}
              </Typography>
            </Box>
          </Box>
          {user?.lastLogin && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
              آخرین ورود: {new Date(user.lastLogin).toLocaleString('fa-IR')}
            </Typography>
          )}
        </Box>

        {canViewUsers && (
          <MenuItem onClick={handleOpenManagedProfile}>
            <ListItemIcon>
              <ManageAccounts fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="مشاهده در مدیریت کاربران"
              secondary="نمایش و ویرایش رکورد کامل این حساب"
            />
          </MenuItem>
        )}

        <MenuItem onClick={handleOpenAvatarPicker}>
          <ListItemIcon>
            <AddAPhoto fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="انتخاب آواتار"
            secondary="تغییر تصویر پروفایل این حساب"
          />
        </MenuItem>

        <Box sx={{ ...resourcesDialogActionsSx(theme), mt: 1, py: 1, px: 0, gap: 0 }}>
          <MenuItem 
            onClick={handleLogout}
            sx={{ 
              color: 'error.main',
              '&:hover': { 
                bgcolor: alpha(theme.palette.error.main, 0.1) 
              }
            }}
          >
            <ListItemIcon>
              <ExitToApp fontSize="small" sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText primary="خروج از سیستم" />
          </MenuItem>
        </Box>
      </Menu>

      <Dialog open={avatarDialogOpen} onClose={() => !avatarSaving && setAvatarDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>آواتار پروفایل</DialogTitle>
        <DialogContent dividers>
          {avatarError && <Alert severity="error" sx={{ mb: 2 }}>{avatarError}</Alert>}
          <AvatarPicker
            value={selectedAvatar}
            accessLevel={user?.accessLevel}
            onChange={setSelectedAvatar}
            disabled={avatarSaving}
          />
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setAvatarDialogOpen(false)} disabled={avatarSaving}>
            انصراف
          </Button>
          <Button variant="contained" onClick={handleSaveAvatar} disabled={avatarSaving}>
            ذخیره
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog نمایش جزئیات اعلان */}
      <Dialog
        open={notifDialogOpen}
        onClose={() => setNotifDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        aria-labelledby="notification-detail-title"
      >
        <DialogTitle
          id="notification-detail-title"
          sx={{ fontWeight: 700, textAlign: 'center', pb: 1 }}
        >
          {notifDialogData?.title}
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pt: 0 }}>
          <Avatar sx={{ bgcolor: 'background.paper', color: 'primary.main', mx: 'auto', my: 1, width: 48, height: 48, boxShadow: 2 }}>
            {notifDialogData?.type === 'success' ? <CheckCircle sx={{ color: 'primary.main' }} /> :
             notifDialogData?.type === 'warning' ? <WarningIcon sx={{ color: 'warning.main' }} /> :
             notifDialogData?.type === 'error' ? <WarningIcon sx={{ color: 'error.main' }} /> :
             <NotificationsIcon sx={{ color: 'info.main' }} />}
          </Avatar>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {notifDialogData?.message}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {notifDialogData?.createdAt
              ? new Date(notifDialogData.createdAt).toLocaleString('fa-IR')
              : ''}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setNotifDialogOpen(false)}>
            بستن
          </Button>
          {notifDialogData?.actionUrl && (
            <Button variant="contained" onClick={handleNotificationAction}>
              مشاهده
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: layout.sidebarCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH,
          flexShrink: 0,
          position: 'fixed',
          '& .MuiDrawer-paper': {
            width: layout.sidebarCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH,
            boxSizing: 'border-box',
            position: 'fixed',
            top: '64px !important',
            left: 0,
            height: 'calc(100vh - 64px) !important',
            border: 'none',
            background: theme.palette.background.default,
            backdropFilter: 'none',
            transition: 'width 0.25s ease',
            overflowX: 'hidden',
            zIndex: theme.zIndex.drawer,
          },
        }}
      >
        <List sx={{ pt: 2 }}>
          {visibleMenuItems.map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuItemClick(item.path);
                }}
                selected={isActiveRoute(item.path)}
                sx={{
                  mx: layout.sidebarCollapsed ? 0.5 : 0.5,
                  ml: layout.sidebarCollapsed ? 1.125 : 1.125, // 5 پیکسل اضافه در حالت بسته
                  borderRadius: '8px',
                  minHeight: 48,
                  justifyContent: layout.sidebarCollapsed ? 'center' : 'flex-start',
                  px: layout.sidebarCollapsed ? 1 : 1,
                  transition: 'background 0.3s, color 0.3s, width 0.3s',
                  '&:hover': {
                    transform: layout.sidebarCollapsed ? 'none' : 'translateX(-2px)',
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  },
                  '&.Mui-selected': {
                    background: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': {
                      background: alpha(theme.palette.primary.main, 0.15),
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                                                            ml: layout.sidebarCollapsed ? 0 : '3px',
                    display: 'flex',
                    justifyContent: layout.sidebarCollapsed ? 'center' : 'flex-start',
                    alignItems: 'center',
                    height: '30px',
                    width: '30px',
                    color: isActiveRoute(item.path) ? 'primary.main' : 'text.secondary',
                    transition: 'color 0.2s ease, margin-right 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {/* باکس ثابت برای لیبل */}
                <Box sx={{ width: 120, minWidth: 0, transition: 'width 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}>
                  <Fade in={sidebarElementsVisible.labels} timeout={250} unmountOnExit={false}>
                    <ListItemText
                      primary={item.label}
                      sx={{
                        ml: '8px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        '& .MuiListItemText-primary': {
                          fontWeight: isActiveRoute(item.path) ? 600 : 400,
                          color: isActiveRoute(item.path) ? 'primary.main' : 'text.primary',
                        },
                      }}
                    />
                  </Fade>
                </Box>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        {/* تقویم و ساعت شمسی */}
        <Box sx={{ 
          position: 'absolute', 
          bottom: 5, 
          left: 0, // همیشه 0 باشد تا وسط‌چین کامل شود
          right: 0, 
          p: 2, 
          pr: layout.sidebarCollapsed ? 2 : 0, // فاصله از راست در حالت بسته
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: 'transparent',
          width: '100%',
        }}>
          <Fade in={sidebarElementsVisible.dateTime} timeout={400}>
            <Box sx={{ width: '100%' }}>
              {!layout.sidebarCollapsed && (
                <PersianDateTime 
                  variant={layout.sidebarCollapsed ? 'minimal' : 'stacked'} 
                  showTime={true}
                  showIcons={false}
                />
              )}
            </Box>
          </Fade>
        </Box>
      </Drawer>

      {/* Side Panel (Gmail-like) */}
      <SidePanel />

      {/* محتوای اصلی */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: `${layout.sidebarCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH}px`,
          width: `calc(100% - ${layout.sidebarCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH}px - ${sidePanel.isOpen ? 276 : 0}px)`,
          ...(theme.direction==='rtl'
            ? {
                mr: sidePanel.isOpen ? '267px' : 0,
              }
            : {
                ml: (layout.sidebarCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH) + 
                    (sidePanel.isOpen ? 267 : 0),
              }),
          mt: '64px',
          p: 3,
          bgcolor: 'background.default',
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          gap: 0,
          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Paper
          sx={{
            borderRadius: 3,
            background: alpha(theme.palette.background.paper, 0.7),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            position: 'relative',
            height: 'calc(100vh - 128px)',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            p: 0,
          }}
        >
          {!isDashboardHome && (
            <Box
              sx={{
                px: 3,
                pt: 3,
                pb: 0,
                display: 'flex',
                justifyContent: theme.direction === 'rtl' ? 'flex-start' : 'flex-end',
              }}
            >
              <Tooltip title="بازگشت به مرحله قبل">
                <Button
                  variant="contained"
                  startIcon={<KeyboardBackspace />}
                  onClick={handleBackToPreviousStep}
                  sx={{
                    borderRadius: '999px',
                    px: 2.25,
                    py: 0.6,
                    minHeight: 34,
                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
                    '&:hover': {
                      boxShadow: `0 10px 28px ${alpha(theme.palette.primary.main, 0.42)}`,
                    },
                  }}
                >
                  بازگشت
                </Button>
              </Tooltip>
            </Box>
          )}
          <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
            {children}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default MainLayout;
