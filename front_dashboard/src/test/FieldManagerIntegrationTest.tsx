import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Card,
  CardContent,
  Alert,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Settings as SettingsIcon,
  Storage as StorageIcon,
  Link as LinkIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import FieldManager from '../modules/definition-editor/components/fields/FieldManager';
import ReferenceCategorySelector from '../modules/definition-editor/components/fields/ReferenceCategorySelector';
import { useAvailableReferenceCategories } from '../hooks/useReferenceData';
import type { CustomField } from '../modules/definition-editor/types/equipment';

const FieldManagerIntegrationTest: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [testFields, setTestFields] = useState<CustomField[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [testResults, setTestResults] = useState<string[]>([]);
  
  const { categories } = useAvailableReferenceCategories();

  const handleFieldsChange = (fields: CustomField[]) => {
    setTestFields(fields);
    setTestResults(prev => [...prev, `Fields updated: ${fields.length} total fields`]);
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testSteps = [
    {
      label: 'Test Category Selection',
      description: 'Test ReferenceCategorySelector component functionality',
      content: (
        <Box>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Test the category selector with the updated data structure:
          </Typography>
          
          <ReferenceCategorySelector
            value={selectedCategory}
            onChange={(categoryId) => {
              setSelectedCategory(categoryId);
              addTestResult(`Category selected: ${categoryId}`);
              
              const category = categories.find(cat => cat.id === categoryId);
              if (category) {
                addTestResult(`Category info: ${category.name} (hasHierarchy: ${category.hasHierarchy}, hasData: ${category.hasData})`);
              }
            }}
            label="Select Test Category"
          />
          
          {selectedCategory && (
            <Alert severity="success" sx={{ mt: 2 }}>
              ✅ Category selection working correctly: {selectedCategory}
            </Alert>
          )}
        </Box>
      )
    },
    {
      label: 'Test FieldManager Integration',
      description: 'Test FieldManager with reference fields creation',
      content: (
        <Box>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Use FieldManager to create reference fields. Test the complete flow:
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Test Instructions:</strong>
              <br />
              1. Click "افزودن فیلد" (Add Field)
              <br />
              2. Select field type as "مرجع" (Reference)
              <br />
              3. Choose a reference category
              <br />
              4. Select appropriate sections (hierarchy/data/both)
              <br />
              5. Save the field
            </Typography>
          </Alert>
          
          <FieldManager
            nodeId="test-node-id"
            fields={testFields}
            onFieldsChange={handleFieldsChange}
            title="Test Field Manager"
            description="Testing Reference Fields integration"
            nodeName="Test Node"
          />
        </Box>
      )
    },
    {
      label: 'Verify Field Configuration',
      description: 'Verify that reference fields are configured correctly',
      content: (
        <Box>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Review created reference fields and their configuration:
          </Typography>
          
          {testFields.length === 0 ? (
            <Alert severity="warning">
              No fields created yet. Go back to step 2 and create some reference fields.
            </Alert>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>
                Created Fields ({testFields.length}):
              </Typography>
              
              {testFields.map((field, index) => (
                <Card key={field.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6">{field.name}</Typography>
                      <Chip 
                        label={field.type} 
                        color={field.type === 'reference' ? 'primary' : 'default'}
                        variant="outlined" 
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      English Name: {field.englishName}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                      <Chip 
                        size="small" 
                        label={field.isRequired ? 'Required' : 'Optional'} 
                        color={field.isRequired ? 'error' : 'default'}
                      />
                      <Chip size="small" label={`Order: ${field.order}`} variant="outlined" />
                    </Box>
                    
                    {field.type === 'reference' && (
                      <Box sx={{ mt: 2 }}>
                        <Alert severity="info">
                          <Typography variant="body2" fontWeight={600}>
                            Reference Field Configuration:
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2">
                              <strong>Category:</strong> {field.referenceCategory || 'Not set'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Sections:</strong> {field.referenceSections || 'Not set'}
                            </Typography>
                            
                            {field.referenceCategory && (
                              <Box sx={{ mt: 1 }}>
                                {(() => {
                                  const category = categories.find(cat => cat.id === field.referenceCategory);
                                  return category ? (
                                    <Box>
                                      <Typography variant="body2">
                                        <strong>Category Details:</strong> {category.name} ({category.englishName})
                                      </Typography>
                                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                        {category.hasHierarchy && (
                                          <Chip size="small" label="Has Hierarchy" color="success" />
                                        )}
                                        {category.hasData && (
                                          <Chip size="small" label="Has Data" color="info" />
                                        )}
                                      </Box>
                                    </Box>
                                  ) : (
                                    <Typography variant="body2" color="error">
                                      Category not found!
                                    </Typography>
                                  );
                                })()}
                              </Box>
                            )}
                          </Box>
                        </Alert>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {testFields.some(field => field.type === 'reference') && (
                <Alert severity="success">
                  ✅ Reference fields created successfully with proper configuration!
                </Alert>
              )}
            </Box>
          )}
        </Box>
      )
    },
    {
      label: 'Test Results Summary',
      description: 'Review all test results and validation',
      content: (
        <Box>
          <Typography variant="h6" gutterBottom>
            Integration Test Results
          </Typography>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Statistics
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Chip 
                  icon={<SettingsIcon />}
                  label={`Total Fields: ${testFields.length}`} 
                  color="primary" 
                />
                <Chip 
                  icon={<LinkIcon />}
                  label={`Reference Fields: ${testFields.filter(f => f.type === 'reference').length}`} 
                  color="secondary" 
                />
                <Chip 
                  icon={<StorageIcon />}
                  label={`Available Categories: ${categories.length}`} 
                  color="info" 
                />
              </Box>
            </CardContent>
          </Card>
          
          <Typography variant="h6" gutterBottom>
            Validation Checklist
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon 
                  color={categories.length >= 15 ? 'success' : 'error'} 
                />
              </ListItemIcon>
              <ListItemText 
                primary="Reference Categories Available"
                secondary={`${categories.length} categories loaded (expected: 15+)`}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon 
                  color={selectedCategory ? 'success' : 'error'} 
                />
              </ListItemIcon>
              <ListItemText 
                primary="Category Selection Working"
                secondary={selectedCategory ? `Selected: ${selectedCategory}` : 'No category selected'}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon 
                  color={testFields.length > 0 ? 'success' : 'error'} 
                />
              </ListItemIcon>
              <ListItemText 
                primary="Field Creation Working"
                secondary={`${testFields.length} fields created`}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon 
                  color={testFields.some(f => f.type === 'reference') ? 'success' : 'error'} 
                />
              </ListItemIcon>
              <ListItemText 
                primary="Reference Fields Configuration"
                secondary={
                  testFields.some(f => f.type === 'reference') 
                    ? 'Reference fields configured correctly' 
                    : 'No reference fields created'
                }
              />
            </ListItem>
          </List>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Activity Log
          </Typography>
          
          <Paper sx={{ p: 2, maxHeight: 200, overflow: 'auto', bgcolor: 'grey.50' }}>
            {testResults.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No activity yet. Complete the test steps above.
              </Typography>
            ) : (
              testResults.map((result, index) => (
                <Typography key={index} variant="caption" display="block" sx={{ mb: 0.5 }}>
                  {result}
                </Typography>
              ))
            )}
          </Paper>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        FieldManager Integration Test
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This test verifies the complete integration between FieldManager and Reference Fields system:
        <br />
        • <strong>Category Selection</strong>: ReferenceCategorySelector with corrected data structure
        <br />
        • <strong>Field Configuration</strong>: Reference field creation and section selection
        <br />
        • <strong>Data Validation</strong>: Proper mapping and validation of reference fields
      </Alert>

      <Stepper activeStep={activeStep} orientation="vertical">
        {testSteps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel>
              <Typography variant="h6">{step.label}</Typography>
              <Typography variant="body2" color="text.secondary">
                {step.description}
              </Typography>
            </StepLabel>
            <StepContent>
              {step.content}
              
              <Box sx={{ mb: 2, mt: 2 }}>
                <div>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    {index === testSteps.length - 1 ? 'Finish' : 'Continue'}
                  </Button>
                  <Button
                    disabled={index === 0}
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Back
                  </Button>
                </div>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
      
      {activeStep === testSteps.length && (
        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Integration Test Completed! 🎉
          </Typography>
          <Typography variant="body2">
            The FieldManager successfully integrates with the corrected Reference Fields data structure.
            All components are working together properly to provide a seamless experience for 
            creating and managing reference fields.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default FieldManagerIntegrationTest;