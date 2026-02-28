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
  SmartToy,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store';
import { selectUser, logout } from '@/store/slices/authSlice';
import { 
  selectNotifications, 
  selectLayout,
  selectSidePanel,
  toggleSidebar,
  toggleSidePanel,
  selectUnreadNotifications,
} from '@/store/slices/uiSlice';
import SidePanel from './SidePanel';
import PersianDateTime from '@/components/common/PersianDateTime';
import { useTranslation } from '@/hooks/useTranslation';
import SearchBar from '@/components/common/SearchBar';

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
  const notifications = useAppSelector(selectNotifications);
  const unreadNotifications = useAppSelector(selectUnreadNotifications);
  const layout = useAppSelector(selectLayout);
  const sidePanel = useAppSelector(selectSidePanel);
  const [notificationsMenuAnchor, setNotificationsMenuAnchor] = useState<null | HTMLElement>(null);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [searchValue, setSearchValue] = useState('');
  const [notifDialogOpen, setNotifDialogOpen] = useState(false);
  const [notifDialogData, setNotifDialogData] = useState<any>(null);
  // حذف stateهای جداگانه و استفاده از یک state واحد برای مدیریت نمایش المان‌ها
  const [sidebarElementsVisible, setSidebarElementsVisible] = useState({
    labels: !layout.sidebarCollapsed,
    dateTime: !layout.sidebarCollapsed
  });

  // Soft background surface like 4-step modal
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
    const rgbToHex = (r: number, g: number, b: number) => `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
    const blendWithWhite = (h: string, primaryWeight = 0.10) => {
      const { r, g, b } = hexToRgb(h);
      const wr = 255, wg = 255, wb = 255;
      const w = 1 - primaryWeight;
      const br = wr * w + r * primaryWeight;
      const bg = wg * w + g * primaryWeight;
      const bb = wb * w + b * primaryWeight;
      return rgbToHex(br, bg, bb);
    };
    if (/^[0-9a-f]{3,6}$/.test(hex)) return blendWithWhite(hex, 0.10);
    try {
      const fallback = (theme.palette.primary.light || '#90caf9').toLowerCase().replace('#', '');
      return blendWithWhite(fallback, 0.08);
    } catch {
      return '#f5f7fa';
    }
  };

  useEffect(() => {
    setSidebarElementsVisible({
      labels: !layout.sidebarCollapsed,
      dateTime: !layout.sidebarCollapsed
    });
  }, []);

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

  const menuItems = [
    { 
      id: 'home', 
      label: t('menu.dashboard'), 
      icon: <Dashboard />, 
      path: '/dashboard',
      roles: ['admin', 'commander', 'operator', 'viewer']
    },
    { 
      id: 'scenarios', 
      label: 'مدیریت سناریوها', 
      icon: <Assignment />, 
      path: '/dashboard/scenarios',
      roles: ['admin', 'commander', 'operator', 'viewer']
    },
    { 
      id: 'users', 
      label: 'مدیریت کاربران', 
      icon: <People />, 
      path: '/dashboard/users',
      roles: ['admin', 'commander', 'operator', 'viewer']
    },
    { 
      id: 'resources-module', 
      label: 'مدیریت منابع', 
      icon: <AccountBox />, 
      path: '/dashboard/resources',
      roles: ['admin', 'commander', 'operator', 'viewer']
    },
    { 
      id: 'data-processing', 
      label: 'پردازش اطلاعات', 
      icon: <SmartToy />, 
      path: '/dashboard/data-processing',
      roles: ['admin', 'commander', 'operator', 'viewer']
    },

  ];

  const currentRole = user?.role || 'operator';
  const filteredMenuItems = menuItems.filter(item => item.roles.includes(currentRole));
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

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('user');
    navigate('/auth/login');
    handleProfileMenuClose();
  };

  const handleMenuItemClick = (path: string, itemId: string) => {
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
                sx={{ 
                  color: 'text.primary',
                  width: 40,
                  height: 40,
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                }}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* تنظیمات */}
            <Tooltip title={t('layout.settingsTooltip')}>
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
            </Tooltip>

            {/* پروفایل کاربر */}
            <Tooltip title={user?.name || t('layout.userProfileTooltip')}>
              <IconButton
                onClick={handleProfileClick}
                sx={{
                  p: 0,
                  ml: 1.5,
                  borderRadius: '50%',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  }
                }}
              >
                <Avatar
                  src={user?.avatar}
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: '#1976d2', // رنگ ثابت آبی
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  {user?.name?.charAt(0) || 'ک'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* منوی اعلان‌ها */}
      <Menu
        anchorEl={notificationsMenuAnchor}
        open={Boolean(notificationsMenuAnchor)}
        onClose={handleNotificationsMenuClose}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 520,
            overflow: 'hidden',
            mt: 1.5,
            borderRadius: '20px',
            backgroundColor: (theme) => alpha(theme.palette.primary.light, 0.10),
            backdropFilter: 'blur(20px)',
            border: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
            boxShadow: (theme) => `0 20px 60px ${alpha(theme.palette.primary.light, 0.25)}, inset 0 1px 0 rgba(255, 255, 255, 0.75)`,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 18,
              width: 12,
              height: 12,
              bgcolor: getSoftSurface(),
              borderTop: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
              borderLeft: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2.5, borderBottom: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`, backgroundColor: getSoftSurface() }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {t('layout.notificationsTitle')}
          </Typography>
        </Box>
        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center', backgroundColor: getSoftSurface() }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {t('layout.noNewNotifications')}
            </Typography>
          </Box>
        ) : (
          notifications.slice(0, 3).map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => {
                setNotifDialogData(notification);
                setNotifDialogOpen(true);
                handleNotificationsMenuClose();
              }}
              sx={{
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                py: 0.5,
                px: 1.5,
                borderRadius: 2,
                boxShadow: '0 1px 4px rgba(25, 118, 210, 0.05)',
                mb: 0.5,
                minHeight: 36,
                bgcolor: notification.read ? alpha(theme.palette.background.paper, 0.7) : alpha(theme.palette.primary.light, 0.10),
                transition: 'all 0.15s',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.07),
                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.10)',
                  transform: 'scale(1.01)',
                },
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Avatar sx={{ bgcolor: 'background.paper', color: 'primary.main', mr: 1, width: 28, height: 28, boxShadow: 2, fontSize: 18 }}>
                {notification.type === 'success' ? <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} /> :
                 notification.type === 'warning' ? <WarningIcon sx={{ color: 'warning.main', fontSize: 20 }} /> :
                 notification.type === 'error' ? <WarningIcon sx={{ color: 'error.main', fontSize: 20 }} /> :
                 <NotificationsIcon sx={{ color: 'info.main', fontSize: 20 }} />}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: notification.read ? 'text.primary' : 'primary.main', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.93rem', mb: 0 }}>
                  {notification.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120, fontSize: '0.85rem', mb: 0 }}>
                  {notification.message}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 54, textAlign: 'left', fontSize: '0.75rem' }}>
                {notification.timestamp}
              </Typography>
            </MenuItem>
          ))
        )}
      </Menu>

      {/* منوی پروفایل */}
      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={handleProfileMenuClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 300,
            maxWidth: 340,
            borderRadius: '20px',
            overflow: 'hidden',
            backgroundColor: (theme) => alpha(theme.palette.primary.light, 0.10),
            backdropFilter: 'blur(20px)',
            border: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
            boxShadow: (theme) => `0 20px 60px ${alpha(theme.palette.primary.light, 0.25)}, inset 0 1px 0 rgba(255, 255, 255, 0.75)`,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1.5,
              borderRadius: 1,
              mx: 1,
              my: 0.5,
            }
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header با اطلاعات کاربر */}
        <Box sx={{ 
          p: 2.5, 
          borderBottom: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          bgcolor: getSoftSurface()
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={user?.avatar}
              sx={{
                width: 48,
                height: 48,
                bgcolor: theme.palette.primary.main,
                fontSize: '1.2rem',
                fontWeight: 600,
              }}
            >
              {user?.name?.charAt(0) || user?.username?.charAt(0) || 'ک'}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, color: 'primary.main' }}>
                {user?.name || 'کاربر'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                {user?.username}@sajed.mil
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {user?.rank} - {user?.unit}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* منوی عملیات - حذف شده طبق درخواست */}

        <Box sx={{ borderTop: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`, mt: 1, pt: 1, bgcolor: getSoftSurface() }}>
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

      {/* Dialog نمایش جزئیات اعلان */}
      <Dialog open={notifDialogOpen} onClose={() => setNotifDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, textAlign: 'center', pb: 1 }}>
          {notifDialogData?.title}
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pt: 0 }}>
          <Avatar sx={{ bgcolor: 'background.paper', color: 'primary.main', mx: 'auto', my: 1, width: 48, height: 48, boxShadow: 2 }}>
            {notifDialogData?.type === 'success' ? <CheckCircle sx={{ color: 'success.main' }} /> :
             notifDialogData?.type === 'warning' ? <WarningIcon sx={{ color: 'warning.main' }} /> :
             notifDialogData?.type === 'error' ? <WarningIcon sx={{ color: 'error.main' }} /> :
             <NotificationsIcon sx={{ color: 'info.main' }} />}
          </Avatar>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {notifDialogData?.message}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {notifDialogData?.timestamp}
          </Typography>
        </DialogContent>
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
                  handleMenuItemClick(item.path, item.id);
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
            height: 'calc(100vh - 128px)',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            p: 0,
          }}
        >
          <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
            {children}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default MainLayout;
