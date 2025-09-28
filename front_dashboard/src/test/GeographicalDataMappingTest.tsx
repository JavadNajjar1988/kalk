import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  List, 
  ListItem, 
  ListItemText,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { useReferenceData } from '../hooks/useReferenceData';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`geo-tabpanel-${index}`}
      aria-labelledby={`geo-tab-${index}`}
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

const GeographicalDataMappingTest: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  
  // Test different section combinations for geographical category
  const hierarchyData = useReferenceData('geographical', 'hierarchy');
  const dataData = useReferenceData('geographical', 'data');
  const bothData = useReferenceData('geographical', 'both');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getLocationSummary = (items: any[]) => {
    const levels = items.reduce((acc, item) => {
      if (item.level) {
        acc[item.level] = (acc[item.level] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);

    return Object.entries(levels)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([level, count]) => ({ level: Number(level), count }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Geographical Data Mapping Test
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This test verifies geographical category data structure:
        <br />
        • <strong>Hierarchy Section (مديريت سطوح سلسله مراتبى)</strong> gets 9 organizational levels from "levels" array
        <br />
        • <strong>Data Section (مديريت دادهها)</strong> gets geographical places from "nodes" array (Asia→Iran→Tehran, etc.)
        <br />
        • Geographical hierarchy: قاره → کشور → استان → شهرستان → بخش → دهستان → شهر → محله → مختصات دقیق
      </Alert>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="geographical data mapping tabs"
          variant="fullWidth"
        >
          <Tab label="Hierarchy Management (levels)" />
          <Tab label="Data Management (nodes)" />
          <Tab label="Both Sections" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Hierarchy Management - 9 Geographic Levels (مديريت سطوح سلسله مراتبى)
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Data Source: JSON "levels" array - 9-level geographical organizational structure
          </Typography>
          
          {hierarchyData.loading && <CircularProgress />}
          {hierarchyData.error && (
            <Alert severity="error">{hierarchyData.error}</Alert>
          )}
          
          {hierarchyData.data && (
            <Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip 
                  label={`Total Levels: ${hierarchyData.data.items.length}`} 
                  color="primary" 
                />
                <Chip 
                  label="Expected: 9 levels" 
                  color={hierarchyData.data.items.length === 9 ? "success" : "error"}
                />
              </Box>

              {hierarchyData.data.items.length === 9 && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  ✅ Correct number of geographical hierarchy levels found!
                </Alert>
              )}
              
              <Grid container spacing={2}>
                {hierarchyData.data.items.map((item, index) => (
                  <Grid item xs={12} md={6} key={item.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Chip size="small" label={`Level ${item.level || item.order}`} color="primary" />
                          <Typography variant="h6" component="span">
                            {item.name}
                          </Typography>
                        </Box>
                        {item.englishName && (
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {item.englishName}
                          </Typography>
                        )}
                        <Typography variant="body2">
                          {item.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                          {item.isRequired !== undefined && (
                            <Chip 
                              size="small" 
                              label={item.isRequired ? 'Required' : 'Optional'} 
                              color={item.isRequired ? 'success' : 'default'}
                            />
                          )}
                          {item.icon && (
                            <Chip size="small" label={`Icon: ${item.icon}`} />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Data Management - Geographic Places (مديريت دادهها)
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Data Source: JSON "nodes" array - Actual geographical data with coordinates
          </Typography>
          
          {dataData.loading && <CircularProgress />}
          {dataData.error && (
            <Alert severity="error">{dataData.error}</Alert>
          )}
          
          {dataData.data && (
            <Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip 
                  label={`Total Places: ${dataData.data.items.length}`} 
                  color="secondary" 
                />
                {getLocationSummary(dataData.data.items).map(({ level, count }) => (
                  <Chip 
                    key={level}
                    size="small" 
                    label={`Level ${level}: ${count} places`}
                    variant="outlined"
                  />
                ))}
              </Box>

              <Alert severity="info" sx={{ mb: 2 }}>
                📍 Geographic data includes: Asia (continent) → Iran, Iraq (countries) → provinces → cities with coordinates
              </Alert>
              
              <List>
                {dataData.data.items.slice(0, 20).map((item, index) => (
                  <React.Fragment key={item.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip size="small" label={`Level ${item.level}`} color="secondary" />
                            <Typography variant="body1">
                              {item.name}
                            </Typography>
                            {item.englishName && (
                              <Typography variant="body2" color="text.secondary">
                                ({item.englishName})
                              </Typography>
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2">
                              {item.description}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                              {item.parentId && (
                                <Chip size="small" label={`Parent: ${item.parentId}`} />
                              )}
                              {item.coordinates && (
                                <Chip 
                                  size="small" 
                                  label={`📍 ${item.coordinates.lat}, ${item.coordinates.lng}`} 
                                  color="info"
                                />
                              )}
                              {item.type && (
                                <Chip size="small" label={`Type: ${item.type}`} />
                              )}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < Math.min(19, (dataData.data?.items.length || 0) - 1) && <Divider />}
                  </React.Fragment>
                ))}
                {dataData.data.items.length > 20 && (
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography variant="body2" color="text.secondary" align="center">
                          ... and {dataData.data.items.length - 20} more geographical places
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Combined Geographical Data
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Data Source: JSON "levels" array + "nodes" array - Complete geographical system
          </Typography>
          
          {bothData.loading && <CircularProgress />}
          {bothData.error && (
            <Alert severity="error">{bothData.error}</Alert>
          )}
          
          {bothData.data && (
            <Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip 
                  label={`Total Items: ${bothData.data.items.length}`} 
                  color="info" 
                />
                <Chip 
                  label={`Hierarchy Levels: ${bothData.data.items.filter(item => item.type === 'hierarchy').length}`} 
                  color="primary" 
                />
                <Chip 
                  label={`Geographic Places: ${bothData.data.items.filter(item => item.type === 'data').length}`} 
                  color="secondary" 
                />
              </Box>

              <Alert severity="success" sx={{ mb: 2 }}>
                ✅ Combined data includes both organizational levels (9 geographical levels) and actual geographical places with coordinates
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Organizational Levels (from "levels" array)
                  </Typography>
                  <List dense>
                    {bothData.data.items
                      .filter(item => item.type === 'hierarchy')
                      .slice(0, 5)
                      .map((item) => (
                        <ListItem key={item.id}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip size="small" label="Level" color="primary" />
                                <Typography variant="body2">
                                  {item.name}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Geographic Places (from "nodes" array)
                  </Typography>
                  <List dense>
                    {bothData.data.items
                      .filter(item => item.type === 'data')
                      .slice(0, 5)
                      .map((item) => (
                        <ListItem key={item.id}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip size="small" label="Place" color="secondary" />
                                <Typography variant="body2">
                                  {item.name}
                                </Typography>
                                {item.coordinates && (
                                  <Typography variant="caption" color="text.secondary">
                                    📍
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                  </List>
                </Grid>
              </Grid>
            </Box>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default GeographicalDataMappingTest;