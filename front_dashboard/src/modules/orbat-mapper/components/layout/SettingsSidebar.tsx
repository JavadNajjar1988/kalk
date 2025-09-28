import React from 'react';
import { 
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Slider,
  FormControlLabel,
  Card,
  CardContent
} from '@mui/material';
import { 
  Close as CloseIcon,
  Map as MapIcon,
  Layers as LayersIcon,
  Palette as ThemeIcon,
  Language as LanguageIcon,
  Notifications as NotificationsIcon,
  Grid3x3 as GridIcon
} from '@mui/icons-material';

interface SettingsSidebarProps {
  open: boolean;
  onClose: () => void;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ open, onClose }) => {
  const [mapSettings, setMapSettings] = React.useState({
    showGrid: false,
    showScale: true,
    showCoordinates: true,
    opacity: 80,
    autoSave: true,
    notifications: true
  });

  const handleSettingChange = (setting: string, value: boolean | number) => {
    setMapSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 350,
          fontFamily: 'Vazirmatn, sans-serif'
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 2,
          bgcolor: 'primary.main',
          color: 'white'
        }}>
          <Typography variant="h6">
            تنظیمات
          </Typography>
          <IconButton 
            onClick={onClose}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Settings Content */}
        <Box sx={{ flex: 1, p: 2 }}>
          {/* Map Settings */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MapIcon sx={{ mr: 1 }} color="primary" />
                <Typography variant="h6">تنظیمات نقشه</Typography>
              </Box>
              
              <List dense>
                <ListItem>
                  <ListItemText primary="نمایش شبکه" />
                  <Switch
                    checked={mapSettings.showGrid}
                    onChange={(e) => handleSettingChange('showGrid', e.target.checked)}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemText primary="نمایش مقیاس" />
                  <Switch
                    checked={mapSettings.showScale}
                    onChange={(e) => handleSettingChange('showScale', e.target.checked)}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemText primary="نمایش مختصات" />
                  <Switch
                    checked={mapSettings.showCoordinates}
                    onChange={(e) => handleSettingChange('showCoordinates', e.target.checked)}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemText primary="شفافیت لایه‌ها" />
                  <Box sx={{ width: 100, ml: 2 }}>
                    <Slider
                      value={mapSettings.opacity}
                      onChange={(_, value) => handleSettingChange('opacity', value as number)}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => `${value}%`}
                      min={0}
                      max={100}
                      size="small"
                    />
                  </Box>
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Application Settings */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NotificationsIcon sx={{ mr: 1 }} color="primary" />
                <Typography variant="h6">تنظیمات برنامه</Typography>
              </Box>
              
              <List dense>
                <ListItem>
                  <ListItemText primary="ذخیره خودکار" />
                  <Switch
                    checked={mapSettings.autoSave}
                    onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemText primary="نوتیفیکیشن‌ها" />
                  <Switch
                    checked={mapSettings.notifications}
                    onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ThemeIcon sx={{ mr: 1 }} color="primary" />
                <Typography variant="h6">تنظیمات نمایش</Typography>
              </Box>
              
              <List dense>
                <ListItem button>
                  <ListItemIcon>
                    <LanguageIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="زبان"
                    secondary="فارسی"
                  />
                </ListItem>
                
                <ListItem button>
                  <ListItemIcon>
                    <ThemeIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="تم"
                    secondary="روشن"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* Footer */}
        <Divider />
        <Box sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary" align="center">
            نقشه‌کش آرایش نبرد v1.0
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default SettingsSidebar;