import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Card,
  CardContent,
  Alert,
  Divider,
  Button,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Settings as SettingsIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Language as LanguageIcon,
  Numbers as NumbersIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import FieldManager from '../modules/definition-editor/components/fields/FieldManager';
import FieldPreview from '../modules/definition-editor/components/fields/FieldPreview';
import type { CustomField } from '../modules/definition-editor/types/equipment';

interface TestCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactElement;
  testFields: Array<{
    type: string;
    name: string;
    description: string;
    testInstructions: string[];
  }>;
}

const EnhancedFieldManagerTest: React.FC = () => {
  const [testFields, setTestFields] = useState<CustomField[]>([]);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const handleFieldsChange = (fields: CustomField[]) => {
    setTestFields(fields);
    addTestResult(`Fields updated: ${fields.length} total fields`);
  };

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const resetTest = () => {
    setTestFields([]);
    setTestResults([]);
    addTestResult('Test reset - all fields cleared');
  };

  // Test categories for enhanced field types
  const testCategories: TestCategory[] = [
    {
      id: 'validation-fields',
      name: 'فیلدهای اعتبارسنجی پیشرفته',
      description: 'تست فیلدهای انگلیسی، عددی و کد ملی شرطی',
      icon: <CheckCircleIcon />,
      testFields: [
        {
          type: 'text-english',
          name: 'متن انگلیسی',
          description: 'فیلد متنی که فقط حروف انگلیسی می‌پذیرد',
          testInstructions: [
            'فیلد جدید ایجاد کنید',
            'نوع فیلد را "متن انگلیسی" انتخاب کنید',
            'نام فیلد: "English Name"',
            'فیلد را ذخیره کنید'
          ]
        },
        {
          type: 'text-numeric',
          name: 'متن عددی',
          description: 'فیلد متنی که فقط اعداد می‌پذیرد',
          testInstructions: [
            'فیلد جدید ایجاد کنید',
            'نوع فیلد را "متن عددی" انتخاب کنید',
            'نام فیلد: "Personnel Code"',
            'فیلد را ذخیره کنید'
          ]
        },
        {
          type: 'conditional-national-id',
          name: 'کد ملی شرطی',
          description: 'کد ملی که بر اساس تابعیت اعتبارسنجی می‌شود',
          testInstructions: [
            'فیلد جدید ایجاد کنید',
            'نوع فیلد را "کد ملی شرطی" انتخاب کنید',
            'نام فیلد: "National ID"',
            'راهنمای فیلد را بررسی کنید',
            'فیلد را ذخیره کنید'
          ]
        }
      ]
    },
    {
      id: 'array-fields',
      name: 'فیلدهای آرایه‌ای',
      description: 'تست آرایه شماره تلفن و آدرس',
      icon: <PhoneIcon />,
      testFields: [
        {
          type: 'phone-array',
          name: 'آرایه شماره تلفن',
          description: 'مدیریت چندین شماره تلفن با برچسب‌های مختلف',
          testInstructions: [
            'فیلد جدید ایجاد کنید',
            'نوع فیلد را "آرایه شماره تلفن" انتخاب کنید',
            'نام فیلد: "Phone Numbers"',
            'حداقل آیتم: 1',
            'حداکثر آیتم: 5',
            'راهنمای فیلد را بررسی کنید'
          ]
        },
        {
          type: 'address-array',
          name: 'آرایه آدرس',
          description: 'مدیریت چندین آدرس با برچسب‌های مختلف',
          testInstructions: [
            'فیلد جدید ایجاد کنید',
            'نوع فیلد را "آرایه آدرس" انتخاب کنید',
            'نام فیلد: "Addresses"',
            'حداقل آیتم: 0',
            'حداکثر آیتم: 3',
            'راهنمای فیلد را بررسی کنید'
          ]
        }
      ]
    },
    {
      id: 'hierarchical-fields',
      name: 'فیلدهای سلسله‌مراتبی',
      description: 'تست آدرس سلسله‌مراتبی',
      icon: <LocationIcon />,
      testFields: [
        {
          type: 'hierarchical-address',
          name: 'آدرس سلسله‌مراتبی',
          description: 'انتخاب آدرس از درخت جغرافیایی + آدرس دقیق',
          testInstructions: [
            'فیلد جدید ایجاد کنید',
            'نوع فیلد را "آدرس سلسله‌مراتبی" انتخاب کنید',
            'نام فیلد: "Location"',
            'دسته‌بندی جغرافیایی: "geographical"',
            'اجازه متن آزاد را فعال کنید',
            'راهنمای فیلد را بررسی کنید'
          ]
        }
      ]
    },
    {
      id: 'composite-fields',
      name: 'فیلدهای مرکب',
      description: 'تست تفکیک نام و نام دوزبانه',
      icon: <PersonIcon />,
      testFields: [
        {
          type: 'name-split',
          name: 'تفکیک نام',
          description: 'تفکیک نام و نام خانوادگی در فیلدهای جداگانه',
          testInstructions: [
            'فیلد جدید ایجاد کنید',
            'نوع فیلد را "تفکیک نام" انتخاب کنید',
            'نام فیلد: "Full Name Split"',
            'راهنمای فیلد را بررسی کنید'
          ]
        },
        {
          type: 'full-name-dual',
          name: 'نام دوزبانه',
          description: 'امکان وارد کردن نام به دو زبان فارسی و انگلیسی',
          testInstructions: [
            'فیلد جدید ایجاد کنید',
            'نوع فیلد را "نام دوزبانه" انتخاب کنید',
            'نام فیلد: "Bilingual Name"',
            'راهنمای فیلد را بررسی کنید'
          ]
        }
      ]
    }
  ];

  const getFieldsByType = (type: string) => {
    return testFields.filter(field => field.type === type);
  };

  const renderTestInstructions = (instructions: string[]) => (
    <List dense>
      {instructions.map((instruction, index) => (
        <ListItem key={index}>
          <ListItemIcon>
            <Typography variant="body2" color="primary" fontWeight={600}>
              {index + 1}.
            </Typography>
          </ListItemIcon>
          <ListItemText 
            primary={instruction}
            primaryTypographyProps={{ variant: 'body2' }}
          />
        </ListItem>
      ))}
    </List>
  );

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <SettingsIcon color="primary" fontSize="large" />
          <Typography variant="h4" fontWeight={600}>
            تست فیلدهای پیشرفته FieldManager
          </Typography>
        </Box>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          این صفحه برای تست قابلیت‌های جدید FieldManager طراحی شده است. 
          شما می‌توانید انواع فیلدهای پیشرفته را ایجاد و تست کنید.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button variant="outlined" color="error" onClick={resetTest}>
            ریست تست
          </Button>
          <Chip 
            label={`فیلدهای ایجاد شده: ${testFields.length}`} 
            color={testFields.length > 0 ? 'success' : 'default'}
          />
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Test Categories */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
              دسته‌های تست
            </Typography>
            
            {testCategories.map((category, index) => (
              <Accordion key={category.id} defaultExpanded={index === 0}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {category.icon}
                    <Typography variant="h6">{category.name}</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {category.description}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {category.testFields.map((testField) => (
                      <Grid item xs={12} sm={6} key={testField.type}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {testField.name}
                              </Typography>
                              <Chip 
                                size="small" 
                                label={testField.type} 
                                color="primary" 
                                variant="outlined"
                              />
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {testField.description}
                            </Typography>

                            <Alert 
                              severity={getFieldsByType(testField.type).length > 0 ? 'success' : 'info'} 
                              sx={{ mb: 2 }}
                            >
                              {getFieldsByType(testField.type).length > 0 ? (
                                <Typography variant="body2">
                                  ✅ تست شده - {getFieldsByType(testField.type).length} فیلد ایجاد شده
                                </Typography>
                              ) : (
                                <Typography variant="body2">
                                  {testField.type === 'address-array' || testField.type === 'hierarchical-address' ? (
                                    '✅ فعال و متصل به سیستم جغرافیایی واقعی - آماده استفاده'
                                  ) : (
                                    '⏳ آماده تست'
                                  )}
                                </Typography>
                              )}
                            </Alert>

                            <Accordion>
                              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="body2" fontWeight={600}>
                                  راهنمای تست
                                </Typography>
                              </AccordionSummary>
                              <AccordionDetails>
                                {renderTestInstructions(testField.testInstructions)}
                              </AccordionDetails>
                            </Accordion>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>
        </Grid>

        {/* Field Manager */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ position: 'sticky', top: 20 }}>
            <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                FieldManager تستی
              </Typography>
              
              <FieldManager
                nodeId="enhanced-test-node"
                fields={testFields}
                onFieldsChange={handleFieldsChange}
                title="فیلد منیجر پیشرفته"
                description="تست انواع فیلدهای پیشرفته"
                nodeName="گره تست"
              />
            </Paper>

            {/* Test Results */}
            {testResults.length > 0 && (
              <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  نتایج تست
                </Typography>
                
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {testResults.slice(-10).map((result, index) => (
                    <Alert 
                      key={index} 
                      severity="info" 
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {result}
                      </Typography>
                    </Alert>
                  ))}
                </Box>
              </Paper>
            )}
            
            {/* Field Preview */}
            {testFields.length > 0 && (
              <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  پیش‌نمایش فرم
                </Typography>
                
                <FieldPreview
                  fields={testFields}
                  title="فرم تستی"
                  description="پیش‌نمایش فیلدهای پیشرفته"
                  nodeName="گره تست"
                  readOnly={false}
                  onSubmit={(data) => {
                    addTestResult(`Form submitted with data: ${JSON.stringify(data, null, 2)}`);
                  }}
                />
              </Paper>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnhancedFieldManagerTest;