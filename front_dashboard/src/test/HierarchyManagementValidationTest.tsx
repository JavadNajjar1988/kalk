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
  TableRow
} from '@mui/material';
import {
  AccountTree as HierarchyIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useReferenceData, useAvailableReferenceCategories } from '../hooks/useReferenceData';

const HierarchyManagementValidationTest: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('geographical');
  
  const { categories } = useAvailableReferenceCategories();
  const hierarchyData = useReferenceData(selectedCategory, 'hierarchy');

  // Filter categories that have hierarchy
  const hierarchyCategories = categories.filter(cat => cat.hasHierarchy);

  const validateHierarchyStructure = (items: any[]) => {
    const validations = {
      hasItems: items.length > 0,
      allHaveType: items.every(item => item.type === 'hierarchy'),
      hasRequiredFields: items.every(item => item.id && item.name && item.englishName),
      hasOrderField: items.every(item => typeof item.order === 'number' || typeof item.level === 'number'),
      hasActiveStatus: items.every(item => typeof item.isActive === 'boolean'),
      sortedByOrder: (() => {
        for (let i = 0; i < items.length - 1; i++) {
          const currentOrder = items[i].order || items[i].level;
          const nextOrder = items[i + 1].order || items[i + 1].level;
          if (currentOrder > nextOrder) return false;
        }
        return true;
      })()
    };

    return validations;
  };

  const getValidationColor = (isValid: boolean) => isValid ? 'success' : 'error';
  const getValidationIcon = (isValid: boolean) => isValid ? '✅' : '❌';

  const currentCategory = categories.find(cat => cat.id === selectedCategory);
  const validations = hierarchyData.data ? validateHierarchyStructure(hierarchyData.data.items) : null;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Hierarchy Management Validation Test
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This test validates that hierarchy management section correctly displays organizational levels from the "levels" array:
        <br />
        • <strong>Data Source</strong>: JSON "levels" array with organizational level definitions
        <br />
        • <strong>Expected Type</strong>: All items should have type = 'hierarchy'
        <br />
        • <strong>Required Fields</strong>: id, name, englishName, order/level, isActive, description
        <br />
        • <strong>Sorting</strong>: Items should be sorted by order/level field
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <HierarchyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Test Configuration
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Category with Hierarchy</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Select Category with Hierarchy"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {hierarchyCategories.map((category) => (
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
                Available Hierarchy Categories ({hierarchyCategories.length}):
              </Typography>
              
              <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                {hierarchyCategories.map((category) => (
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
                Hierarchy Data Validation Results
              </Typography>
              
              {hierarchyData.loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                  <CircularProgress size={20} />
                  <Typography>Loading hierarchy data...</Typography>
                </Box>
              )}

              {hierarchyData.error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Error loading hierarchy data: {hierarchyData.error}
                </Alert>
              )}

              {hierarchyData.data && validations && (
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
                          <Chip label={`Total Items: ${hierarchyData.data.items.length}`} color="primary" sx={{ mb: 1 }} />
                          <br />
                          <Chip label={`Source: levels array`} color="info" sx={{ mb: 1 }} />
                          <br />
                          <Chip 
                            label={`All Type=hierarchy: ${getValidationIcon(validations.allHaveType)}`} 
                            color={getValidationColor(validations.allHaveType)} 
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
                                secondary={`${hierarchyData.data.items.length} levels found`}
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemText 
                                primary={`${getValidationIcon(validations.hasRequiredFields)} Required Fields`}
                                secondary="id, name, englishName present"
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemText 
                                primary={`${getValidationIcon(validations.hasOrderField)} Order/Level Field`}
                                secondary="Numeric order field present"
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemText 
                                primary={`${getValidationIcon(validations.sortedByOrder)} Proper Sorting`}
                                secondary="Sorted by order/level field"
                              />
                            </ListItem>
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" gutterBottom>
                    Hierarchy Levels Detail
                  </Typography>

                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Order</strong></TableCell>
                          <TableCell><strong>Name (Persian)</strong></TableCell>
                          <TableCell><strong>English Name</strong></TableCell>
                          <TableCell><strong>Type</strong></TableCell>
                          <TableCell><strong>Required</strong></TableCell>
                          <TableCell><strong>Active</strong></TableCell>
                          <TableCell><strong>Additional Properties</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {hierarchyData.data.items.slice(0, 10).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.order || item.level}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.englishName}</TableCell>
                            <TableCell>
                              <Chip 
                                size="small" 
                                label={item.type} 
                                color={item.type === 'hierarchy' ? 'success' : 'error'}
                              />
                            </TableCell>
                            <TableCell>
                              {item.isRequired !== undefined ? (
                                <Chip 
                                  size="small" 
                                  label={item.isRequired ? 'Yes' : 'No'} 
                                  color={item.isRequired ? 'warning' : 'default'}
                                />
                              ) : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {item.isActive !== undefined ? (
                                <Chip 
                                  size="small" 
                                  label={item.isActive ? 'Active' : 'Inactive'} 
                                  color={item.isActive ? 'success' : 'default'}
                                />
                              ) : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {item.icon && <Chip size="small" label={`Icon: ${item.icon}`} />}
                                {item.natoRank && <Chip size="small" label={`NATO: ${item.natoRank}`} />}
                                {item.standardCode && <Chip size="small" label={`Code: ${item.standardCode}`} />}
                                {item.personnelRange && <Chip size="small" label={`Personnel: ${item.personnelRange}`} />}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                        {hierarchyData.data.items.length > 10 && (
                          <TableRow>
                            <TableCell colSpan={7} align="center">
                              <Typography variant="body2" color="text.secondary">
                                ... and {hierarchyData.data.items.length - 10} more levels
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {hierarchyData.data.items.length === 0 && (
                    <Alert severity="warning">
                      No hierarchy levels found. This may indicate an issue with data extraction from the "levels" array.
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
              <strong>Hierarchy Management Validation:</strong>
              <br />
              {Object.values(validations).every(v => v) ? (
                <>
                  ✅ All validations passed! Hierarchy management is correctly displaying organizational levels from the "levels" array.
                  <br />
                  The data structure includes proper level ordering, type identification, and all required metadata.
                </>
              ) : (
                <>
                  ❌ Some validations failed. Please check the specific validation details above.
                  <br />
                  The hierarchy management may not be correctly extracting or processing data from the "levels" array.
                </>
              )}
            </Typography>
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default HierarchyManagementValidationTest;