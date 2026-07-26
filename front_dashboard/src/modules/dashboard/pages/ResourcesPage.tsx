import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  alpha,
  Button,
  Card,
  CardContent,
  Grid,
  ThemeProvider,
} from '@mui/material';
import { createTheme } from '@mui/material/styles';
import {
  Groups as GroupsIcon,
  Map as MapIcon,
  Inventory as EquipmentIcon,
  WorkspacePremium as RanksIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

// کامپوننت‌های تب‌ها
import {
  PersonnelTab,
  EquipmentTab,
  RanksTab,
  MapsTab
} from './resources';
import { useAppSelector } from '@/store';
import { selectTheme } from '@/store/slices/uiSlice';
import { createAppTheme } from '@/theme';
import { useTranslation } from '@/hooks/useTranslation';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`resource-tabpanel-${index}`}
      aria-labelledby={`resource-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `resource-tab-${index}`,
    'aria-controls': `resource-tabpanel-${index}`,
  };
}

const ResourcesPage: React.FC = () => {
  // Get the theme from the Redux store
  const themeState = useAppSelector(selectTheme);
  // Create a theme object
  const muiTheme = createAppTheme(themeState.mode, themeState.backgroundTheme, themeState.primaryColor, themeState.fontSize, themeState.highContrast);
  const { t } = useTranslation();
  
  const location = useLocation();
  const navigate = useNavigate();
  const unifiedAccent = muiTheme.palette.primary.main;
  const unifiedSurface = `linear-gradient(135deg, ${alpha(unifiedAccent, 0.07)}, ${alpha(unifiedAccent, 0.04)})`;
  const sectionTheme = useMemo(
    () =>
      createTheme(muiTheme, {
        components: {
          MuiDialog: {
            styleOverrides: {
              paper: {
                background: unifiedSurface,
                border: `1px solid ${alpha(unifiedAccent, 0.24)}`,
                borderRadius: 14,
              },
            },
          },
          MuiDialogTitle: {
            styleOverrides: {
              root: {
                borderBottom: `1px solid ${alpha(unifiedAccent, 0.18)}`,
              },
            },
          },
          MuiDialogActions: {
            styleOverrides: {
              root: {
                borderTop: `1px solid ${alpha(unifiedAccent, 0.18)}`,
              },
            },
          },
        },
      }),
    [muiTheme, unifiedSurface, unifiedAccent]
  );
  
  // تبدیل URL query parameter به index تب
  const getTabFromURL = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const tabMap: { [key: string]: number } = {
      'personnel': 0,
      'equipment': 1, 
      'ranks': 2,
      'maps': 3
    };
    return tabMap[tab || 'personnel'] || 0;
  };
  
  const [value, setValue] = useState(getTabFromURL());
  
  // بروزرسانی URL وقتی تب تغییر میکند
  useEffect(() => {
    const tabNames = ['personnel', 'equipment', 'ranks', 'maps'];
    const newURL = `${location.pathname}?tab=${tabNames[value]}`;
    navigate(newURL, { replace: true });
  }, [value, location.pathname, navigate]);
  
  // بروزرسانی تب وقتی URL تغییر میکند
  useEffect(() => {
    setValue(getTabFromURL());
  }, [location.search]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    // URL بروزرسانی در useEffect انجام میشود
  };

  const tabs = [
    { label: t('resources.tabs.personnel'), icon: <GroupsIcon /> },
    { label: t('resources.tabs.equipment'), icon: <EquipmentIcon /> },
    { label: t('resources.tabs.ranks'), icon: <RanksIcon /> },
    { label: t('resources.tabs.maps'), icon: <MapIcon /> },
  ];

  // Wrap the content in its own ThemeProvider with the theme from Redux
  return (
    <ThemeProvider theme={sectionTheme}>
      <Box sx={{ 
        width: '100%', 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: 3,
        '& .MuiCard-root': {
          background: unifiedSurface,
          border: `1px solid ${alpha(unifiedAccent, 0.22)}`,
          boxShadow: 'none',
        },
        '& .MuiPaper-root': {
          borderColor: alpha(unifiedAccent, 0.22),
        },
      }}>
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            fontWeight: 700,
            background: `linear-gradient(135deg, ${alpha(unifiedAccent, 0.95)} 0%, ${alpha(unifiedAccent, 0.7)} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 3,
          }}
        >
          {t('resources.pageTitle')}
        </Typography>

        <Paper
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            background: unifiedSurface,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(unifiedAccent, 0.24)}`,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ 
            borderBottom: 1, 
            borderColor: alpha(unifiedAccent, 0.2),
            background: alpha(unifiedAccent, 0.06),
          }}>
            <Tabs 
              value={value} 
              onChange={handleChange} 
              aria-label="resource tabs"
              sx={{
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                  backgroundColor: unifiedAccent,
                },
                '& .MuiTab-root': {
                  minHeight: 64,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  '&.Mui-selected': {
                    fontWeight: 700,
                    color: unifiedAccent,
                  },
                },
              }}
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  label={tab.label}
                  icon={tab.icon}
                  iconPosition="start"
                  {...a11yProps(index)}
                  sx={{
                    '&:hover': {
                      background: alpha(unifiedAccent, 0.08),
                    },
                  }}
                />
              ))}
            </Tabs>
          </Box>

          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <TabPanel value={value} index={0}>
              <PersonnelTab />
            </TabPanel>
            <TabPanel value={value} index={1}>
              <EquipmentTab />
            </TabPanel>
            <TabPanel value={value} index={2}>
              <RanksTab />
            </TabPanel>
            <TabPanel value={value} index={3}>
              <MapsTab />
            </TabPanel>
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
};

export default ResourcesPage; 
