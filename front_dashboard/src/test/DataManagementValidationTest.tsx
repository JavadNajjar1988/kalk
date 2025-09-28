import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Storage as DataIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useReferenceData, useAvailableReferenceCategories } from '../hooks/useReferenceData';

const DataManagementValidationTest: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('geographical');
  
  const { categories } = useAvailableReferenceCategories();
  const dataData = useReferenceData(selectedCategory, 'data');

  // Filter categories that have data
  const dataCategories = categories.filter(cat => cat.hasData);

  const validateDataStructure = (items: any[]) => {
    const validations = {
      hasItems: items.length > 0,
      allHaveType: items.every(item => item.type === 'data'),
      hasRequiredFields: items.every(item => item.id && item.name),
      hasHierarchicalStructure: items.some(item => item.parentId !== undefined),
      hasLevelField: items.every(item => typeof item.level === 'number'),
      hasProperIds: items.every(item => typeof item.id === 'string' && item.id.length > 0),
      hasDescriptions: items.filter(item => item.description).length > 0,
      hasAdditionalProperties: items.some(item => 
        item.coordinates || item.natoEquivalent || item.country || item.englishName
      )
    };

    return validations;
  };

  const analyzeDataProperties = (items: any[]) => {
    const properties = {
      withCoordinates: items.filter(item => item.coordinates).length,
      withNATO: items.filter(item => item.natoEquivalent).length,
      withCountry: items.filter(item => item.country).length,
      withEnglishName: items.filter(item => item.englishName).length,
      withParentId: items.filter(item => item.parentId).length,
      levels: [...new Set(items.map(item => item.level))].sort((a, b) => a - b),
      maxLevel: Math.max(...items.map(item => item.level || 0)),
      minLevel: Math.min(...items.map(item => item.level || 0))
    };

    return properties;
  };

  const getValidationColor = (isValid: boolean) => isValid ? 'success' : 'error';
  const getValidationIcon = (isValid: boolean) => isValid ? '✅' : '❌';

  const currentCategory = categories.find(cat => cat.id === selectedCategory);
  const validations = dataData.data ? validateDataStructure(dataData.data.items) : null;
  const properties = dataData.data ? analyzeDataProperties(dataData.data.items) : null;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Data Management Validation Test
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This test validates that data management section correctly displays actual category items from the "nodes" array:
        <br />
        • <strong>Data Source</strong>: JSON "nodes" array with hierarchical data relationships
        <br />
        • <strong>Expected Type</strong>: All items should have type = 'data'
        <br />
        • <strong>Required Fields</strong>: id, name, level, parentId (for hierarchical items)
        <br />
        • <strong>Properties</strong>: Additional properties like coordinates, natoEquivalent, country, etc.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <DataIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Test Configuration
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Category with Data</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Select Category with Data"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {dataCategories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {currentCategory && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Selected:</strong> {currentCategory.name}
                    <br />
                    <strong>English:</strong> {currentCategory.englishName}
                    <br />
                    <strong>Has Hierarchy:</strong> {currentCategory.hasHierarchy ? 'Yes' : 'No'}
                    <br />
                    <strong>Has Data:</strong> {currentCategory.hasData ? 'Yes' : 'No'}
                  </Typography>
                </Alert>
              )}

              <Typography variant="subtitle2" gutterBottom>
                Available Data Categories ({dataCategories.length}):
              </Typography>
              
              <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                {dataCategories.map((category) => (
                  <Chip
                    key={category.id}
                    label={category.name}
                    size="small"
                    sx={{ m: 0.25 }}
                    color={category.id === selectedCategory ? 'primary' : 'default'}
                    onClick={() => setSelectedCategory(category.id)}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Data Management Validation Results
              </Typography>
              
              {dataData.loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                  <CircularProgress size={20} />
                  <Typography>Loading data items...</Typography>
                </Box>
              )}

              {dataData.error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Error loading data: {dataData.error}
                </Alert>
              )}

              {dataData.data && validations && properties && (
                <Box>
                  <Alert severity={Object.values(validations).every(v => v) ? 'success' : 'warning'} sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={600}>
                      Validation Summary: {Object.values(validations).filter(v => v).length}/{Object.values(validations).length} checks passed
                    </Typography>
                  </Alert>

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>
                            Data Statistics
                          </Typography>
                          <Chip label={`Total Items: ${dataData.data.items.length}`} color="primary" sx={{ mb: 1 }} />
                          <br />
                          <Chip label={`Source: nodes array`} color="info" sx={{ mb: 1 }} />
                          <br />
                          <Chip 
                            label={`Levels: ${properties.minLevel}-${properties.maxLevel} (${properties.levels.length} total)`} 
                            color="secondary" 
                            sx={{ mb: 1 }}
                          />
                          <br />
                          <Chip 
                            label={`Hierarchical: ${properties.withParentId} items`} 
                            color="warning" 
                          />
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>
                            Validation Results
                          </Typography>
                          
                          <List dense>
                            <ListItem>
                              <ListItemText 
                                primary={`${getValidationIcon(validations.hasItems)} Has Items`}
                                secondary={`${dataData.data.items.length} data items found`}
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemText 
                                primary={`${getValidationIcon(validations.allHaveType)} All Type=data`}
                                secondary="All items properly typed"
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemText 
                                primary={`${getValidationIcon(validations.hasRequiredFields)} Required Fields`}
                                secondary="id, name present"
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemText 
                                primary={`${getValidationIcon(validations.hasHierarchicalStructure)} Hierarchical`}
                                secondary="Parent-child relationships"
                              />
                            </ListItem>
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6">
                        Data Properties Analysis
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" gutterBottom>Special Properties:</Typography>
                          <List dense>
                            <ListItem>
                              <ListItemText primary={`Coordinates: ${properties.withCoordinates} items`} />
                            </ListItem>
                            <ListItem>
                              <ListItemText primary={`NATO Equivalent: ${properties.withNATO} items`} />
                            </ListItem>
                            <ListItem>
                              <ListItemText primary={`Country Info: ${properties.withCountry} items`} />
                            </ListItem>
                            <ListItem>
                              <ListItemText primary={`English Names: ${properties.withEnglishName} items`} />
                            </ListItem>
                          </List>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" gutterBottom>Level Distribution:</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {properties.levels.map(level => (
                              <Chip 
                                key={level} 
                                size="small" 
                                label={`L${level}: ${dataData.data!.items.filter(item => item.level === level).length}`}
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" gutterBottom>
                    Sample Data Items (showing first 10)
                  </Typography>

                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>ID</strong></TableCell>
                          <TableCell><strong>Name</strong></TableCell>
                          <TableCell><strong>Level</strong></TableCell>
                          <TableCell><strong>Type</strong></TableCell>
                          <TableCell><strong>Parent ID</strong></TableCell>
                          <TableCell><strong>Special Properties</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dataData.data.items.slice(0, 10).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.id}</TableCell>
                            <TableCell>
                              <Typography variant="body2">{item.name}</Typography>
                              {item.englishName && (
                                <Typography variant="caption" color="text.secondary">
                                  {item.englishName}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip size="small" label={item.level} color="info" />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                size="small" 
                                label={item.type} 
                                color={item.type === 'data' ? 'success' : 'error'}
                              />
                            </TableCell>
                            <TableCell>
                              {item.parentId ? (
                                <Chip size="small" label={item.parentId} variant="outlined" />
                              ) : (
                                <Typography variant="caption" color="text.secondary">Root</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {item.coordinates && <Chip size="small" label="📍 GPS" color="warning" />}
                                {item.natoEquivalent && <Chip size="small" label="NATO" color="secondary" />}
                                {item.country && <Chip size="small" label={item.country} color="info" />}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                        {dataData.data.items.length > 10 && (
                          <TableRow>
                            <TableCell colSpan={6} align="center">
                              <Typography variant="body2" color="text.secondary">
                                ... and {dataData.data.items.length - 10} more data items
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {dataData.data.items.length === 0 && (
                    <Alert severity="warning">
                      No data items found. This may indicate an issue with data extraction from the "nodes" array.
                    </Alert>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Validation Summary
        </Typography>
        
        {validations && (
          <Alert severity={Object.values(validations).every(v => v) ? 'success' : 'error'}>
            <Typography variant="body2" component="div">
              <strong>Data Management Validation:</strong>
              <br />
              {Object.values(validations).every(v => v) ? (
                <>
                  ✅ All validations passed! Data management is correctly displaying actual category items from the "nodes" array.
                  <br />
                  The data includes proper hierarchical relationships, level information, and additional properties like coordinates and NATO equivalents.
                </>
              ) : (
                <>
                  ❌ Some validations failed. Please check the specific validation details above.
                  <br />
                  The data management may not be correctly extracting or processing data from the "nodes" array.
                </>
              )}
            </Typography>
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default DataManagementValidationTest;