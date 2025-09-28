import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Alert,
  Divider
} from '@mui/material';
import ReferenceFieldRenderer from '../modules/definition-editor/components/fields/ReferenceFieldRenderer';
import { useAvailableReferenceCategories, ReferenceSections } from '../hooks/useReferenceData';
import type { CustomField } from '../modules/definition-editor/types/equipment';

const ReferenceFieldRendererTest: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('geographical');
  const [selectedSection, setSelectedSection] = useState<ReferenceSections>('hierarchy');
  const [fieldValue, setFieldValue] = useState<any>(null);
  
  const { categories, getAvailableSections } = useAvailableReferenceCategories();

  // Create a mock field for testing
  const createTestField = (category: string, section: ReferenceSections): CustomField => ({
    id: 'test-reference-field',
    name: `Test Reference Field (${category})`,
    type: 'reference',
    isRequired: false,
    isActive: true,
    order: 1,
    referenceCategory: category,
    referenceSections: section,
    options: [],
    validationRules: {}
  });

  const currentCategory = categories.find(cat => cat.id === selectedCategory);
  const availableSections = getAvailableSections(selectedCategory);
  const testField = createTestField(selectedCategory, selectedSection);

  const handleFieldChange = (value: any) => {
    setFieldValue(value);
    console.log('Field value changed:', value);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        ReferenceFieldRenderer Component Test
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This test verifies that ReferenceFieldRenderer works correctly with the updated data structure:
        <br />
        • <strong>Enhanced UI</strong>: Better display of section information and item types
        <br />
        • <strong>Data Integration</strong>: Proper integration with corrected useReferenceData hook
        <br />
        • <strong>Rich Information</strong>: Displays additional properties like coordinates, NATO ranks, etc.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Configuration
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Category</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Select Category"
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSection('hierarchy');
                    setFieldValue(null);
                  }}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Section</InputLabel>
                <Select
                  value={selectedSection}
                  label="Select Section"
                  onChange={(e) => {
                    setSelectedSection(e.target.value as ReferenceSections);
                    setFieldValue(null);
                  }}
                >
                  {availableSections.map((section) => (
                    <MenuItem key={section} value={section}>
                      {section === 'hierarchy' ? 'مديريت سطوح سلسله مراتبى' :
                       section === 'data' ? 'مديريت دادهها' :
                       'هر دو بخش'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {currentCategory && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Current Category Info:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Name:</strong> {currentCategory.name}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>English:</strong> {currentCategory.englishName}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Has Hierarchy:</strong> {currentCategory.hasHierarchy ? 'Yes' : 'No'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Has Data:</strong> {currentCategory.hasData ? 'Yes' : 'No'}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ReferenceFieldRenderer Test
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Field Configuration: Category = {selectedCategory}, Section = {selectedSection}
              </Typography>

              <Box sx={{ border: '1px dashed #ccc', p: 2, borderRadius: 1 }}>
                <ReferenceFieldRenderer
                  field={testField}
                  value={fieldValue}
                  onChange={handleFieldChange}
                  fullWidth={true}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Current Field Value
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
                  {fieldValue ? JSON.stringify(fieldValue, null, 2) : 'null'}
                </Typography>
              </Paper>

              {fieldValue && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  ✅ Field value successfully captured: {fieldValue}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Instructions
        </Typography>
        <Alert severity="info">
          <Typography variant="body2" component="div">
            <strong>Test Steps:</strong>
            <ol>
              <li>Select different categories from the dropdown</li>
              <li>Change section types (hierarchy/data/both) for categories that support it</li>
              <li>Search and select items from the autocomplete field</li>
              <li>Observe the rich information display including:</li>
              <ul>
                <li>Item type indicators (hierarchy vs data)</li>
                <li>Additional properties (level, coordinates, NATO ranks)</li>
                <li>Section-specific information</li>
                <li>Real-time data count and refresh capabilities</li>
              </ul>
            </ol>
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default ReferenceFieldRendererTest;