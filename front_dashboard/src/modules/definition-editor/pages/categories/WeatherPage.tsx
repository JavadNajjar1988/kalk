import React from 'react';
import { Box, Typography, Button, Tabs, Tab } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { CategoryType } from '../../types';
import { FieldsManagerBase, HierarchyLevelsManagerBase, WeatherManager } from '../../components/base';
import WeatherDataManagementDemo from '../../components/demo/WeatherDataManagementDemo';
import { useNavigate } from 'react-router-dom';
import { clearCategoryCache } from '../../data/loader';

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
      id={`weather-tabpanel-${index}`}
      aria-labelledby={`weather-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const WeatherPage: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = React.useState(0);
  
  React.useEffect(() => {
    try {
      const storageKey = `definition_editor_weather_weather`;
      localStorage.removeItem(storageKey);
      clearCategoryCache(CategoryType.WEATHER);
    } catch {}
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header with title/description and back button */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5">آب و هوا - سیستم جامع 6 سطحه</Typography>
          <Typography variant="caption" color="text.secondary">
            تعاریف و مدیریت کامل شرایط آب و هوایی عملیاتی
          </Typography>
        </Box>
        <Button variant="outlined" color="primary" onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />}>بازگشت</Button>
      </Box>

      {/* Tabs for different views */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="weather management tabs">
          <Tab label="📈 نمای جامع و آمار" />
          <Tab label="📝 مدیریت فیلدها" />
          <Tab label="🌳 مدیریت سطوح" />
          <Tab label="🌍 مدیریت داده‌ها" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <WeatherDataManagementDemo />
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <FieldsManagerBase categoryType={CategoryType.WEATHER} />
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <HierarchyLevelsManagerBase categoryType={CategoryType.WEATHER} maxLevels={6} />
      </TabPanel>
      
      <TabPanel value={tabValue} index={3}>
        <WeatherManager />
      </TabPanel>
    </Box>
  );
};

export default WeatherPage;


