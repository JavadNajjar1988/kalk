import React from 'react';
import {
  Menu,
  MenuItem,
  MenuList,
  Box,
  Typography,
  Divider,
  IconButton,
  Badge,
  ListItemIcon,
  ListItemText,
  Button,
  Chip,
  Avatar,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Notifications,
  Info,
  Warning,
  Error,
  CheckCircle,
  Close,
  MarkEmailRead,
  DeleteOutline,
  Circle,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectNotifications,
  selectUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeNotification,
  clearAllNotifications,
} from '@/store/slices/uiSlice';
import { formatPersianDateTime } from '@/utils/dateUtils';

interface NotificationPanelProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  anchorEl,
  open,
  onClose,
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const unreadNotifications = useAppSelector(selectUnreadNotifications);
  const unreadCount = unreadNotifications.length;

  // Soft surface like modal theme
  const getSoftSurface = () => {
    const primary = (theme.palette.primary.main || '#4a90e2').toLowerCase();
    const hex = primary.replace('#', '');
    if (
      hex.includes('10b981') ||
      hex.includes('4caf50') ||
      hex.includes('2e7d32')
    )
      return '#f0f4f3';
    if (
      hex.includes('4a90e2') ||
      hex.includes('1976d2') ||
      hex.includes('2196f3')
    )
      return '#f0f4f8';
    if (
      hex.includes('ef4444') ||
      hex.includes('f44336') ||
      hex.includes('d32f2f')
    )
      return '#fbf1f0';
    if (
      hex.includes('6b21a8') ||
      hex.includes('9c27b0') ||
      hex.includes('673ab7')
    )
      return '#22262d';
    if (
      hex.includes('f59e0b') ||
      hex.includes('ff9800') ||
      hex.includes('fb8c00')
    )
      return '#fbf1f1';
    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    const hexToRgb = (h: string) => {
      const n =
        h.length === 3
          ? h
              .split('')
              .map(c => c + c)
              .join('')
          : h;
      const r = parseInt(n.substring(0, 2), 16);
      const g = parseInt(n.substring(2, 4), 16);
      const b = parseInt(n.substring(4, 6), 16);
      return { r, g, b };
    };
    const rgbToHex = (r: number, g: number, b: number) =>
      `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
    const blendWithWhite = (h: string, primaryWeight = 0.1) => {
      const { r, g, b } = hexToRgb(h);
      const wr = 255,
        wg = 255,
        wb = 255;
      const w = 1 - primaryWeight;
      const br = wr * w + r * primaryWeight;
      const bg = wg * w + g * primaryWeight;
      const bb = wb * w + b * primaryWeight;
      return rgbToHex(br, bg, bb);
    };
    if (/^[0-9a-f]{3,6}$/.test(hex)) return blendWithWhite(hex, 0.1);
    try {
      const fallback = (theme.palette.primary.light || '#90caf9')
        .toLowerCase()
        .replace('#', '');
      return blendWithWhite(fallback, 0.08);
    } catch {
      return '#f5f7fa';
    }
  };

  // آیکن بر اساس نوع اعلان
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle sx={{ color: 'success.main' }} />;
      case 'warning':
        return <Warning sx={{ color: 'warning.main' }} />;
      case 'error':
        return <Error sx={{ color: 'error.main' }} />;
      case 'info':
      default:
        return <Info sx={{ color: 'info.main' }} />;
    }
  };

  // رنگ بر اساس نوع اعلان
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'success.light';
      case 'warning':
        return 'warning.light';
      case 'error':
        return 'error.light';
      case 'info':
      default:
        return 'info.light';
    }
  };

  // مدیریت کلیک روی اعلان
  const handleNotificationClick = (notificationId: string) => {
    dispatch(markNotificationAsRead(notificationId));
  };

  // حذف اعلان
  const handleDeleteNotification = (
    notificationId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    dispatch(removeNotification(notificationId));
  };

  // خواندن همه اعلان‌ها
  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  // پاک کردن همه اعلان‌ها
  const handleClearAll = () => {
    dispatch(clearAllNotifications());
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        elevation: 0,
        sx: {
          width: 380,
          maxHeight: 520,
          overflow: 'hidden',
          mt: 1.5,
          borderRadius: '20px',
          backgroundColor: theme => alpha(theme.palette.primary.light, 0.1),
          backdropFilter: 'blur(20px)',
          border: theme =>
            `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          boxShadow: theme =>
            `0 20px 60px ${alpha(theme.palette.primary.light, 0.25)}, inset 0 1px 0 rgba(255, 255, 255, 0.75)`,
          '&:before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: 0,
            right: 18,
            width: 12,
            height: 12,
            bgcolor: getSoftSurface(),
            borderTop: theme =>
              `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
            borderLeft: theme =>
              `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
            transform: 'translateY(-50%) rotate(45deg)',
            zIndex: 0,
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {/* هدر */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderBottom: theme =>
            `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          backgroundColor: getSoftSurface(),
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: 'primary.main' }}
          >
            اعلان‌ها
          </Typography>
          <Badge
            badgeContent={unreadCount}
            color="error"
            sx={{ '& .MuiBadge-badge': { fontWeight: 600 } }}
          >
            <Notifications />
          </Badge>
        </Box>
        {/* دکمه‌های عملیات */}
        {notifications.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            {unreadCount > 0 && (
              <Button
                size="small"
                variant="text"
                startIcon={<MarkEmailRead />}
                onClick={handleMarkAllAsRead}
                sx={{ fontSize: '0.75rem', borderRadius: '10px' }}
              >
                خواندن همه
              </Button>
            )}
            <Button
              size="small"
              variant="text"
              color="error"
              startIcon={<DeleteOutline />}
              onClick={handleClearAll}
              sx={{ fontSize: '0.75rem', borderRadius: '10px' }}
            >
              پاک کردن همه
            </Button>
          </Box>
        )}
      </Box>

      {/* لیست اعلان‌ها */}
      <MenuList
        sx={{
          p: 0,
          maxHeight: 360,
          overflow: 'auto',
          backgroundColor: getSoftSurface(),
        }}
      >
        {notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
            <Notifications
              sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              هیچ اعلانی وجود ندارد
            </Typography>
          </Box>
        ) : (
          notifications.map(notification => (
            <MenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification.id)}
              sx={{
                p: 0,
                display: 'block',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Box
                sx={{
                  p: 2,
                  borderRight: 4,
                  borderColor: getNotificationColor(notification.type),
                  bgcolor: !notification.read
                    ? `${getNotificationColor(notification.type)}08`
                    : 'transparent',
                  position: 'relative',
                }}
              >
                {/* آیکن و عنوان */}
                <Box
                  sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}
                >
                  <Box sx={{ mt: 0.25 }}>
                    {getNotificationIcon(notification.type)}
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: !notification.read ? 700 : 500,
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {notification.title}
                      </Typography>

                      {!notification.read && (
                        <Circle sx={{ color: 'primary.main', fontSize: 8 }} />
                      )}
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {notification.message}
                    </Typography>

                    {/* زمان و عملیات */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {formatPersianDateTime(notification.timestamp)}
                      </Typography>

                      <IconButton
                        size="small"
                        onClick={e =>
                          handleDeleteNotification(notification.id, e)
                        }
                        sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </MenuItem>
          ))
        )}
      </MenuList>

      {/* فوتر */}
      {notifications.length > 0 && (
        <Box
          sx={{
            p: 1.5,
            borderTop: theme =>
              `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
            backgroundColor: getSoftSurface(),
            textAlign: 'center',
          }}
        >
          <Button
            variant="text"
            size="small"
            fullWidth
            sx={{ borderRadius: '10px', fontWeight: 600 }}
          >
            مشاهده همه اعلان‌ها
          </Button>
        </Box>
      )}
    </Menu>
  );
};

export default NotificationPanel;
