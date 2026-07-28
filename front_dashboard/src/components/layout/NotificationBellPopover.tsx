import React from 'react';
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  Popover,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  CheckCircle,
  ChevronLeft,
  DoneAll,
  Error as ErrorIcon,
  Info,
  NotificationsNone,
  Refresh,
  Warning,
} from '@mui/icons-material';

import type { ServerNotification } from '@/services/api/notificationsApiService';

interface NotificationBellPopoverProps {
  anchorEl: HTMLElement | null;
  notifications: ServerNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onSelect: (notification: ServerNotification) => void;
  onMarkAllRead: () => void;
  onRefresh: () => void;
  onViewAll: () => void;
}

const notificationAppearance = {
  success: { color: 'success.main', icon: CheckCircle },
  warning: { color: 'warning.main', icon: Warning },
  error: { color: 'error.main', icon: ErrorIcon },
  info: { color: 'info.main', icon: Info },
} as const;

const formatNotificationTime = (dateValue: string) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absoluteSeconds = Math.abs(diffSeconds);
  const relativeFormatter = new Intl.RelativeTimeFormat('fa-IR', {
    numeric: 'auto',
  });

  if (absoluteSeconds < 60) {
    return relativeFormatter.format(diffSeconds, 'second');
  }
  if (absoluteSeconds < 3600) {
    return relativeFormatter.format(Math.round(diffSeconds / 60), 'minute');
  }
  if (absoluteSeconds < 86400) {
    return relativeFormatter.format(Math.round(diffSeconds / 3600), 'hour');
  }
  if (absoluteSeconds < 604800) {
    return relativeFormatter.format(Math.round(diffSeconds / 86400), 'day');
  }

  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const NotificationBellPopover: React.FC<NotificationBellPopoverProps> = ({
  anchorEl,
  notifications,
  unreadCount,
  loading,
  error,
  onClose,
  onSelect,
  onMarkAllRead,
  onRefresh,
  onViewAll,
}) => {
  const theme = useTheme();
  const visibleNotifications = notifications.slice(0, 5);

  return (
    <Popover
      id="notification-bell-popover"
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
      transformOrigin={{ horizontal: 'center', vertical: 'top' }}
      slotProps={{
        paper: {
          role: 'dialog',
          'aria-label': 'اعلان‌ها',
          sx: {
            width: { xs: 'calc(100vw - 24px)', sm: 390 },
            maxWidth: 'calc(100vw - 24px)',
            mt: 1,
            overflow: 'hidden',
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: '0 14px 36px rgba(15, 23, 42, 0.18)',
            backgroundImage: 'none',
          },
        },
      }}
    >
      <Box
        sx={{
          minHeight: 58,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            اعلان‌ها
          </Typography>
          <Typography variant="caption" color="text.secondary">
            آخرین رویدادهای سامانه
          </Typography>
        </Box>

        {unreadCount > 0 && (
          <Chip
            size="small"
            color="primary"
            label={`${unreadCount.toLocaleString('fa-IR')} خوانده‌نشده`}
            sx={{ height: 24 }}
          />
        )}

        <Tooltip title="خواندن همه">
          <span>
            <IconButton
              size="small"
              disabled={unreadCount === 0 || loading}
              onClick={onMarkAllRead}
              aria-label="علامت‌گذاری همه اعلان‌ها به‌عنوان خوانده‌شده"
            >
              <DoneAll fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="تازه‌سازی">
          <span>
            <IconButton
              size="small"
              disabled={loading}
              onClick={onRefresh}
              aria-label="تازه‌سازی اعلان‌ها"
            >
              {loading ? (
                <CircularProgress size={18} />
              ) : (
                <Refresh fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
        {error && (
          <Alert
            severity="error"
            variant="outlined"
            action={
              <Button color="inherit" size="small" onClick={onRefresh}>
                تلاش دوباره
              </Button>
            }
            sx={{ m: 1.5 }}
          >
            دریافت اعلان‌ها انجام نشد
          </Alert>
        )}

        {loading && notifications.length === 0 ? (
          <Box
            sx={{
              minHeight: 180,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <CircularProgress size={28} aria-label="در حال دریافت اعلان‌ها" />
          </Box>
        ) : visibleNotifications.length === 0 && !error ? (
          <Box
            sx={{
              minHeight: 190,
              px: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <Avatar
              sx={{
                width: 44,
                height: 44,
                mb: 1.25,
                color: 'text.secondary',
                bgcolor: alpha(theme.palette.text.secondary, 0.08),
              }}
            >
              <NotificationsNone />
            </Avatar>
            <Typography variant="body2" fontWeight={600}>
              اعلان جدیدی وجود ندارد
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              رویدادهای تازه سامانه در این بخش نمایش داده می‌شوند.
            </Typography>
          </Box>
        ) : (
          <List disablePadding aria-label="آخرین اعلان‌ها">
            {visibleNotifications.map((notification, index) => {
              const appearance =
                notificationAppearance[notification.type] ??
                notificationAppearance.info;
              const SeverityIcon = appearance.icon;

              return (
                <React.Fragment key={notification.id}>
                  <ListItemButton
                    onClick={() => onSelect(notification)}
                    sx={{
                      minHeight: 70,
                      px: 1.75,
                      py: 1,
                      gap: 1.25,
                      alignItems: 'flex-start',
                      bgcolor: notification.read
                        ? 'transparent'
                        : alpha(theme.palette.primary.main, 0.055),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.085),
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 34,
                        height: 34,
                        mt: 0.25,
                        color: appearance.color,
                        bgcolor: alpha(
                          theme.palette[
                            notification.type === 'info'
                              ? 'info'
                              : notification.type
                          ].main,
                          0.1
                        ),
                      }}
                    >
                      <SeverityIcon fontSize="small" />
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.75,
                        }}
                      >
                        {!notification.read && (
                          <Box
                            component="span"
                            aria-label="خوانده‌نشده"
                            sx={{
                              width: 7,
                              height: 7,
                              flexShrink: 0,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                            }}
                          />
                        )}
                        <Typography
                          variant="body2"
                          fontWeight={notification.read ? 600 : 750}
                          noWrap
                        >
                          {notification.title}
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          mt: 0.25,
                          display: '-webkit-box',
                          overflow: 'hidden',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: 1.55,
                        }}
                      >
                        {notification.message}
                      </Typography>
                    </Box>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ whiteSpace: 'nowrap', pt: 0.25 }}
                    >
                      {formatNotificationTime(
                        notification.createdAt || notification.timestamp
                      )}
                    </Typography>
                  </ListItemButton>
                  {index < visibleNotifications.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Box>

      <Box
        sx={{
          minHeight: 46,
          borderTop: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Button
          fullWidth
          onClick={onViewAll}
          endIcon={<ChevronLeft />}
          sx={{ minHeight: 46, borderRadius: 0, fontWeight: 700 }}
        >
          مشاهده همه اعلان‌ها
        </Button>
      </Box>
    </Popover>
  );
};

export default NotificationBellPopover;
