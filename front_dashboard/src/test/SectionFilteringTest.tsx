import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { useReferenceData, useAvailableReferenceCategories, ReferenceSections } from '../hooks/useReferenceData';

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
      id={`section-tabpanel-${index}`}
      aria-labelledby={`section-tab-${index}`}
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

const SectionFilteringTest: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('geographical');
  const [selectedSection, setSelectedSection] = useState<ReferenceSections>('hierarchy');
  const [tabValue, setTabValue] = useState(0);
  
  const { categories, getAvailableSections } = useAvailableReferenceCategories();
  const referenceData = useReferenceData(selectedCategory, selectedSection);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const currentCategory = categories.find(cat => cat.id === selectedCategory);
  const availableSections = getAvailableSections(selectedCategory);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Section Filtering Test for Reference Fields
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This test verifies that section filtering works correctly:
        <br />
        • <strong>Hierarchy Section</strong>: Shows organizational levels from "levels" array
        <br />
        • <strong>Data Section</strong>: Shows actual data items from "nodes" array
        <br />
        • <strong>Both Sections</strong>: Shows combined data with proper type differentiation
      </Alert>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Select Category</InputLabel>
            <Select
              value={selectedCategory}
              label="Select Category"
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                // Reset section to hierarchy when changing category
                setSelectedSection('hierarchy');
              }}
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.icon} {category.name} ({category.englishName})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Select Section</InputLabel>
            <Select
              value={selectedSection}
              label="Select Section"
              onChange={(e) => setSelectedSection(e.target.value as ReferenceSections)}
            >
              {availableSections.map((section) => (
                <MenuItem key={section} value={section}>
                  {section === 'hierarchy' ? 'مديريت سطوح سلسله مراتبى (Hierarchy Management)' :
                   section === 'data' ? 'مديريت دادهها (Data Management)' :
                   'هر دو بخش (Both Sections)'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {currentCategory && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Category: {currentCategory.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {currentCategory.description}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip 
                size="small" 
                label={currentCategory.hasHierarchy ? "Has Hierarchy" : "No Hierarchy"} 
                color={currentCategory.hasHierarchy ? "success" : "default"} 
              />
              <Chip 
                size="small" 
                label={currentCategory.hasData ? "Has Data" : "No Data"} 
                color={currentCategory.hasData ? "info" : "default"} 
              />
              <Chip 
                size="small" 
                label={`Available Sections: ${availableSections.join(', ')}`} 
                variant="outlined"
              />
            </Box>
          </CardContent>
        </Card>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="section filtering test tabs"
          variant="fullWidth"
        >
          <Tab label="Filtered Results" />
          <Tab label="Data Analysis" />
          <Tab label="Section Comparison" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Current Selection: {selectedSection.toUpperCase()} Section
          </Typography>
          
          {referenceData.loading && <CircularProgress />}
          {referenceData.error && (
            <Alert severity="error">{referenceData.error}</Alert>
          )}
          
          {referenceData.data && (
            <Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip 
                  label={`Total Items: ${referenceData.data.items.length}`} 
                  color="primary" 
                />
                <Chip 
                  label={`Hierarchy Items: ${referenceData.data.items.filter(item => item.type === 'hierarchy').length}`} 
                  color="success" 
                />
                <Chip 
                  label={`Data Items: ${referenceData.data.items.filter(item => item.type === 'data').length}`} 
                  color="info" 
                />
              </Box>

              <List>
                {referenceData.data.items.slice(0, 15).map((item, index) => (
                  <React.Fragment key={item.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              size="small" 
                              label={item.type || 'unknown'} 
                              color={item.type === 'hierarchy' ? 'success' : 'info'} 
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
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2">
                              {item.description}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                              {item.level !== undefined && (
                                <Chip size="small" label={`Level: ${item.level}`} />
                              )}
                              {item.order !== undefined && (
                                <Chip size="small" label={`Order: ${item.order}`} />
                              )}
                              {item.parentId && (
                                <Chip size="small" label={`Parent: ${item.parentId}`} />
                              )}
                              {item.coordinates && (
                                <Chip 
                                  size="small" 
                                  label={`📍 ${item.coordinates.lat}, ${item.coordinates.lng}`} 
                                  color="warning"
                                />
                              )}
                              {item.natoEquivalent && (
                                <Chip 
                                  size="small" 
                                  label={`NATO: ${item.natoEquivalent}`} 
                                  color="secondary"
                                />
                              )}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < Math.min(14, (referenceData.data?.items.length || 0) - 1) && <Divider />}
                  </React.Fragment>
                ))}
                {referenceData.data.items.length > 15 && (
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography variant="body2" color="text.secondary" align="center">
                          ... and {referenceData.data.items.length - 15} more items
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Data Structure Analysis
          </Typography>
          
          {referenceData.data && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="success.main">
                      Hierarchy Items (Type: hierarchy)
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Source: "levels" array - Organizational level definitions
                    </Typography>
                    <Chip 
                      label={`${referenceData.data.items.filter(item => item.type === 'hierarchy').length} items`} 
                      color="success" 
                    />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Properties: id, name, englishName, order, level, isRequired, isActive, icon
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="info.main">
                      Data Items (Type: data)
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Source: "nodes" array - Actual data entries with relationships
                    </Typography>
                    <Chip 
                      label={`${referenceData.data.items.filter(item => item.type === 'data').length} items`} 
                      color="info" 
                    />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Properties: id, name, level, parentId, description, coordinates, natoEquivalent
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Section Comparison for Current Category
          </Typography>
          
          <Grid container spacing={2}>
            {['hierarchy', 'data', 'both'].map((section) => (
              <Grid item xs={12} md={4} key={section}>
                <SectionPreview 
                  categoryId={selectedCategory}
                  section={section as ReferenceSections}
                  isActive={section === selectedSection}
                />
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

const SectionPreview: React.FC<{ 
  categoryId: string; 
  section: ReferenceSections; 
  isActive: boolean;
}> = ({ categoryId, section, isActive }) => {
  const data = useReferenceData(categoryId, section);
  
  return (
    <Card variant={isActive ? "elevation" : "outlined"} sx={{ height: '300px' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom color={isActive ? 'primary' : 'text.secondary'}>
          {section.toUpperCase()} Section
          {isActive && <Chip size="small" label="Active" color="primary" sx={{ ml: 1 }} />}
        </Typography>
        
        {data.loading ? (
          <CircularProgress size={20} />
        ) : data.error ? (
          <Typography variant="body2" color="error">Error</Typography>
        ) : data.data ? (
          <Box>
            <Typography variant="body2" gutterBottom>
              Total: {data.data.items.length} items
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
              <Chip 
                size="small" 
                label={`H: ${data.data.items.filter(item => item.type === 'hierarchy').length}`} 
                color="success"
              />
              <Chip 
                size="small" 
                label={`D: ${data.data.items.filter(item => item.type === 'data').length}`} 
                color="info"
              />
            </Box>
            <Box sx={{ maxHeight: '180px', overflow: 'auto' }}>
              {data.data.items.slice(0, 5).map((item) => (
                <Typography key={item.id} variant="caption" display="block">
                  [{item.type?.charAt(0).toUpperCase()}] {item.name}
                </Typography>
              ))}
              {data.data.items.length > 5 && (
                <Typography variant="caption" color="text.secondary">
                  ... {data.data.items.length - 5} more
                </Typography>
              )}
            </Box>
          </Box>
        ) : (
          <Typography variant="body2">No data</Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default SectionFilteringTest;