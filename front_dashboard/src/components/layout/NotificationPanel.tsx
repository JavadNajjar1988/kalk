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
  clearAllNotifications
} from '@/store/slices/uiSlice';
import { format } from 'date-fns';
import { faIR } from 'date-fns/locale';

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
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const unreadNotifications = useAppSelector(selectUnreadNotifications);
  const unreadCount = unreadNotifications.length;

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
  const handleDeleteNotification = (notificationId: string, event: React.MouseEvent) => {
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
        elevation: 8,
        sx: {
          width: 360,
          maxHeight: 480,
          overflow: 'visible',
          filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
          mt: 1.5,
          '&:before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: 0,
            right: 14,
            width: 10,
            height: 10,
            bgcolor: 'background.paper',
            transform: 'translateY(-50%) rotate(45deg)',
            zIndex: 0,
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {/* هدر */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            اعلان‌ها
          </Typography>
          <Badge badgeContent={unreadCount} color="error">
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
                sx={{ fontSize: '0.75rem' }}
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
              sx={{ fontSize: '0.75rem' }}
            >
              پاک کردن همه
            </Button>
          </Box>
        )}
      </Box>

      {/* لیست اعلان‌ها */}
      <MenuList sx={{ p: 0, maxHeight: 320, overflow: 'auto' }}>
        {notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
            <Notifications sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              هیچ اعلانی وجود ندارد
            </Typography>
          </Box>
        ) : (
          notifications.map((notification) => (
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
                  bgcolor: !notification.read ? `${getNotificationColor(notification.type)}08` : 'transparent',
                  position: 'relative',
                }}
              >
                {/* آیکن و عنوان */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box sx={{ mt: 0.25 }}>
                    {getNotificationIcon(notification.type)}
                  </Box>
                  
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: !notification.read ? 600 : 400,
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
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(notification.timestamp), 'HH:mm - dd/MM/yyyy', { locale: faIR })}
                      </Typography>
                      
                      <IconButton
                        size="small"
                        onClick={(e) => handleDeleteNotification(notification.id, e)}
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
        <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <Button variant="text" size="small" fullWidth>
            مشاهده همه اعلان‌ها
          </Button>
        </Box>
      )}
    </Menu>
  );
};

export default NotificationPanel; 