import React, { useEffect, useState } from 'react';
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
  Divider
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
      id={`reference-tabpanel-${index}`}
      aria-labelledby={`reference-tab-${index}`}
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

const MilitaryRanksDataMappingTest: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  
  // Test different section combinations
  const hierarchyData = useReferenceData('military_ranks', 'hierarchy');
  const dataData = useReferenceData('military_ranks', 'data');
  const bothData = useReferenceData('military_ranks', 'both');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Military Ranks Data Mapping Test
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This test verifies that:
        <br />
        • <strong>Hierarchy Section (مديريت سطوح سلسله مراتبى)</strong> gets data from "levels" array
        <br />
        • <strong>Data Section (مديريت دادهها)</strong> gets data from "nodes" array
        <br />
        • <strong>Both Section</strong> combines both arrays appropriately
      </Alert>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="military ranks data mapping tabs"
          variant="fullWidth"
        >
          <Tab label="Hierarchy Only (levels array)" />
          <Tab label="Data Only (nodes array)" />
          <Tab label="Both (levels + nodes)" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Hierarchy Management (مديريت سطوح سلسله مراتبى)
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Data Source: JSON "levels" array - Organizational hierarchy definitions
          </Typography>
          
          {hierarchyData.loading && <CircularProgress />}
          {hierarchyData.error && (
            <Alert severity="error">{hierarchyData.error}</Alert>
          )}
          
          {hierarchyData.data && (
            <Box>
              <Chip 
                label={`Total Items: ${hierarchyData.data.items.length}`} 
                color="primary" 
                sx={{ mb: 2 }} 
              />
              
              <List>
                {hierarchyData.data.items.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                              <Chip size="small" label={`Order: ${item.order || item.level}`} />
                              {item.isRequired !== undefined && (
                                <Chip 
                                  size="small" 
                                  label={item.isRequired ? 'Required' : 'Optional'} 
                                  color={item.isRequired ? 'success' : 'default'}
                                />
                              )}
                              {item.natoRank && (
                                <Chip size="small" label={`NATO: ${item.natoRank}`} />
                              )}
                              {item.standardCode && (
                                <Chip size="small" label={`Code: ${item.standardCode}`} />
                              )}
                              {item.icon && (
                                <Chip size="small" label={`Icon: ${item.icon}`} />
                              )}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < (hierarchyData.data?.items.length || 0) - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Data Management (مديريت دادهها)
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Data Source: JSON "nodes" array - Actual rank data items with hierarchical structure
          </Typography>
          
          {dataData.loading && <CircularProgress />}
          {dataData.error && (
            <Alert severity="error">{dataData.error}</Alert>
          )}
          
          {dataData.data && (
            <Box>
              <Chip 
                label={`Total Items: ${dataData.data.items.length}`} 
                color="secondary" 
                sx={{ mb: 2 }} 
              />
              
              <List>
                {dataData.data.items.slice(0, 15).map((item, index) => (
                  <React.Fragment key={item.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                              <Chip size="small" label={`Level: ${item.level}`} />
                              {item.country && (
                                <Chip size="small" label={`Country: ${item.country}`} />
                              )}
                              {item.natoEquivalent && (
                                <Chip size="small" label={`NATO: ${item.natoEquivalent}`} />
                              )}
                              {item.parentId && (
                                <Chip size="small" label={`Parent: ${item.parentId}`} />
                              )}
                              {item.icon && (
                                <Chip size="small" label={`Icon: ${item.icon}`} />
                              )}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < Math.min(14, (dataData.data?.items.length || 0) - 1) && <Divider />}
                  </React.Fragment>
                ))}
                {dataData.data.items.length > 15 && (
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography variant="body2" color="text.secondary" align="center">
                          ... and {dataData.data.items.length - 15} more items
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
            Both Sections Combined
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Data Source: JSON "levels" array + "nodes" array - Complete dataset
          </Typography>
          
          {bothData.loading && <CircularProgress />}
          {bothData.error && (
            <Alert severity="error">{bothData.error}</Alert>
          )}
          
          {bothData.data && (
            <Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip 
                  label={`Total Items: ${bothData.data.items.length}`} 
                  color="info" 
                />
                <Chip 
                  label={`Hierarchy Items: ${bothData.data.items.filter(item => item.type === 'hierarchy').length}`} 
                  color="primary" 
                />
                <Chip 
                  label={`Data Items: ${bothData.data.items.filter(item => item.type === 'data').length}`} 
                  color="secondary" 
                />
              </Box>

              <Alert severity="success" sx={{ mb: 2 }}>
                ✅ Combined data includes both organizational levels (from "levels" array) and actual rank data (from "nodes" array)
              </Alert>
              
              <Typography variant="body2" color="text.secondary">
                Showing first 10 items from combined dataset...
              </Typography>
              
              <List>
                {bothData.data.items.slice(0, 10).map((item, index) => (
                  <React.Fragment key={item.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              size="small"
                              label={item.type === 'hierarchy' ? 'Level' : 'Data'}
                              color={item.type === 'hierarchy' ? 'primary' : 'secondary'}
                            />
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
                        secondary={item.description}
                      />
                    </ListItem>
                    {index < 9 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default MilitaryRanksDataMappingTest;