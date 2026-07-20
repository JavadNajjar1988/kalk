/**
 * Scenario Info Panel
 * پنل اطلاعات سناریو با تب‌های جزئیات، واحدها و آمار
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Grid,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Info as InfoIcon,
  Group as UnitsIcon,
  BarChart as StatsIcon,
  People as PersonnelIcon,
  Inventory as EquipmentIcon,
  Timeline as EventsIcon,
  Map as MapIcon,
} from '@mui/icons-material';
import { useOrbatData, useOrbatState } from '../../../orbat-integration';

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
      id={`scenario-tabpanel-${index}`}
      aria-labelledby={`scenario-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

export interface ScenarioInfoPanelProps {
  scenario: any;
  onClose?: () => void;
}

export const ScenarioInfoPanel: React.FC<ScenarioInfoPanelProps> = ({
  scenario,
  onClose,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [scenarioInfo, setScenarioInfo] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);

  // ORBAT integration
  const data = useOrbatData();
  const { state: orbatState } = useOrbatState();

  // Load scenario data
  useEffect(() => {
    const loadScenarioData = async () => {
      try {
        // Load scenario and units data
        await data.loadScenarios();
        await data.loadUnits();
        
        // Get scenario info from current scenario or use current data
        const info = {
          name: scenario?.name || 'سناریوی جدید',
          description: scenario?.description || 'توضیحاتی برای این سناریو وجود ندارد',
          created: scenario?.createdDate || new Date().toISOString(),
          lastModified: scenario?.lastModified || new Date().toISOString(),
          author: scenario?.author || 'کاربر سیستم',
          version: scenario?.version || '1.0.0'
        };
        setScenarioInfo(info);

        // Load units
        const unitsData = data.units;
        setUnits(unitsData);

        // Calculate statistics
        const stats = calculateStatistics(unitsData);
        setStatistics(stats);
      } catch (error) {
        console.error('Failed to load scenario data:', error);
        // Fallback to mock data
        setMockData();
      }
    };

    loadScenarioData();
  }, [scenario?.id, data]);

  const setMockData = () => {
    setScenarioInfo({
      name: scenario?.name || 'سناریوی نمونه',
      description: 'این یک سناریوی نمونه برای آزمایش سیستم است',
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      author: 'کاربر سیستم',
      version: '1.0.0',
    });

    const mockUnits = [
      { id: '1', name: 'گردان 1', type: 'Infantry', size: 'Battalion', parent: null },
      { id: '2', name: 'یگان A', type: 'Armor', size: 'Company', parent: '1' },
      { id: '3', name: 'یگان B', type: 'Artillery', size: 'Battery', parent: '1' },
    ];
    setUnits(mockUnits);
    setStatistics(calculateStatistics(mockUnits));
  };

  const calculateStatistics = (unitsData: any[]) => {
    return {
      totalUnits: unitsData.length,
      unitsByType: unitsData.reduce((acc, unit) => {
        acc[unit.type] = (acc[unit.type] || 0) + 1;
        return acc;
      }, {}),
      unitsBySize: unitsData.reduce((acc, unit) => {
        acc[unit.size] = (acc[unit.size] || 0) + 1;
        return acc;
      }, {}),
      personnel: Math.floor(Math.random() * 5000) + 1000,
      equipment: Math.floor(Math.random() * 500) + 100,
      events: Math.floor(Math.random() * 20) + 5,
    };
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const getUnitTypeColor = (type: string) => {
    const colors = {
      Infantry: 'primary',
      Armor: 'secondary',
      Artillery: 'error',
      Engineer: 'warning',
      'Air Defense': 'info',
    };
    return colors[type as keyof typeof colors] || 'default';
  };

  return (
    <Paper
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      {/* Header */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, py: 1 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoIcon />
          اطلاعات سناریو
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
          <Tab
            icon={<InfoIcon />}
            label="جزئیات"
            id="scenario-tab-0"
            aria-controls="scenario-tabpanel-0"
          />
          <Tab
            icon={<UnitsIcon />}
            label="واحدها"
            id="scenario-tab-1"
            aria-controls="scenario-tabpanel-1"
          />
          <Tab
            icon={<StatsIcon />}
            label="آمار"
            id="scenario-tab-2"
            aria-controls="scenario-tabpanel-2"
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* Details Tab */}
        <TabPanel value={tabValue} index={0}>
          {scenarioInfo && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {scenarioInfo.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {scenarioInfo.description}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" display="block" color="text.secondary">
                        تاریخ ایجاد
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(scenarioInfo.created)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" display="block" color="text.secondary">
                        آخرین تغییر
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(scenarioInfo.lastModified)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" display="block" color="text.secondary">
                        نویسنده
                      </Typography>
                      <Typography variant="body2">
                        {scenarioInfo.author}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" display="block" color="text.secondary">
                        نسخه
                      </Typography>
                      <Typography variant="body2">
                        {scenarioInfo.version}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          )}
        </TabPanel>

        {/* Units Tab */}
        <TabPanel value={tabValue} index={1}>
          <List>
            {units.map((unit, index) => (
              <React.Fragment key={unit.id}>
                <ListItem>
                  <ListItemIcon>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                      {unit.name.charAt(0)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={unit.name}
                    secondary={
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Chip
                          label={unit.type}
                          size="small"
                          color={getUnitTypeColor(unit.type) as any}
                          variant="outlined"
                        />
                        <Chip
                          label={unit.size}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    }
                  />
                </ListItem>
                {index < units.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </TabPanel>

        {/* Statistics Tab */}
        <TabPanel value={tabValue} index={2}>
          {statistics && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Overview Stats */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <UnitsIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4">{statistics.totalUnits}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        کل واحدها
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <PersonnelIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4">{statistics.personnel}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        پرسنل
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <EquipmentIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4">{statistics.equipment}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        تجهیزات
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <EventsIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4">{statistics.events}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        رویدادها
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Unit Type Breakdown */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    توزیع بر اساس نوع واحد
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {Object.entries(statistics.unitsByType).map(([type, count]) => (
                      <Box key={type} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">{type}</Typography>
                        <Chip
                          label={String(count)}
                          size="small"
                          color={getUnitTypeColor(type) as any}
                        />
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
        </TabPanel>
      </Box>
    </Paper>
  );
};