import React from 'react';
import {
  Box,
  Drawer,
  useTheme,
  alpha,
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { closeSidePanel, SidePanelType } from '@/store/slices/uiSlice';
import SettingsPanel from './panels/SettingsPanel';
import NotificationsPanel from './panels/NotificationsPanel';
import ProfilePanel from './panels/ProfilePanel';
import HelpPanel from './panels/HelpPanel';
import ThemePanel from './panels/ThemePanel';

const SidePanel: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { isOpen, type, width } = useSelector((state: RootState) => state.ui.sidePanel);

  // انیمیشن هماهنگ با fade بخش‌ها
  const [settingsPanelOpen, setSettingsPanelOpen] = React.useState(true);
  React.useEffect(() => {
    if (isOpen) setSettingsPanelOpen(true);
  }, [isOpen]);
  
  const handleSettingsPanelRequestClose = () => {
    setSettingsPanelOpen(false);
    // کاهش تاخیر به 150 میلی‌ثانیه برای بهبود تجربه کاربری
    setTimeout(() => {
      dispatch(closeSidePanel());
    }, 150);
  };
  
  // اضافه کردن useEffect برای ریست کردن state پنل تنظیمات
  React.useEffect(() => {
    if (!isOpen) {
      // ریست کردن state پنل تنظیمات بعد از بسته شدن
      const timer = setTimeout(() => {
        setSettingsPanelOpen(true);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const anchor: 'left' | 'right' = type === 'settings'
    ? (theme.direction === 'rtl' ? 'right' : 'left')
    : 'right';
  const variant: 'persistent' | 'temporary' = type === 'settings' ? 'persistent' : 'temporary';
  const panelWidth = type === 'settings' ? 280 : width;

  const renderPanelContent = (panelType: SidePanelType): React.ReactNode => {
    switch (panelType) {
      case 'notifications':
        return <NotificationsPanel />;
      case 'profile':
        return <ProfilePanel />;
      case 'help':
        return <HelpPanel />;
      case 'theme':
        return <ThemePanel />;
      case 'settings':
        return settingsPanelOpen && isOpen ? (
          <SettingsPanel onClose={handleSettingsPanelRequestClose} onRequestClose={handleSettingsPanelRequestClose} />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <Drawer
      anchor={anchor}
      open={isOpen}
      onClose={handleSettingsPanelRequestClose}
      variant={variant}
      ModalProps={{
        keepMounted: true,
        hideBackdrop: type === 'settings',
      }}
      sx={{
        '& .MuiDrawer-paper': {
          width: panelWidth,
          boxSizing: 'border-box',
          border: 'none',
          boxShadow: type === 'settings' ? 'none' : theme.shadows[16],
          background: type === 'settings' ? 'transparent' : alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(20px)',
          borderLeft: type === 'settings' ? 'none' : anchor === 'right' ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
          borderRight: type === 'settings' ? 'none' : anchor === 'left' ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
          top: '64px',
          height: 'calc(100vh - 64px)',
          ...(type === 'settings' && {
            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          }),
        },
        '& .MuiBackdrop-root': {
          backgroundColor: type === 'settings' ? 'transparent' : alpha(theme.palette.common.black, 0.3),
          backdropFilter: type === 'settings' ? 'none' : 'blur(4px)',
        },
      }}
      transitionDuration={{ enter: 350, exit: 300 }}
      SlideProps={{ direction: anchor === 'left' ? 'right' : 'left' }}
    >
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: type === 'settings' ? 'visible' : 'hidden',
        }}
      >
        <Box
          sx={{
            flex: 1,
            overflow: type === 'settings' ? 'visible' : 'auto',
            '&::-webkit-scrollbar': {
              width: type === 'settings' ? 0 : '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: type === 'settings' ? 'transparent' : alpha(theme.palette.divider, 0.05),
            },
            '&::-webkit-scrollbar-thumb': {
              background: type === 'settings' ? 'transparent' : alpha(theme.palette.divider, 0.2),
              borderRadius: '3px',
              '&:hover': {
                background: type === 'settings' ? 'transparent' : alpha(theme.palette.divider, 0.3),
              },
            },
          }}
        >
          {renderPanelContent(type)}
        </Box>
      </Box>
    </Drawer>
  );
};

export default SidePanel;