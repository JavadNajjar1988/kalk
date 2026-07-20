import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Tab,
  Tabs,
  Button,
  Alert,
  Divider,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Preview as PreviewIcon,
  Code as CodeIcon,
  AccountTree as TreeIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { SmartFieldConfig, BaseFieldType, ValidationType } from '../../types/smartFieldTypes';
import FieldDependencyBuilder, { FieldDependency, DependencyType, ConditionOperator } from './FieldDependencyBuilder';
import DependencyMapper from './DependencyMapper';
import ConditionalFieldRenderer from './ConditionalFieldRenderer';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ paddingTop: 16 }}>
    {value === index && children}
  </div>
);

const DependencySystemDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [dependencies, setDependencies] = useState<FieldDependency[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Sample fields for demonstration
  const sampleFields: SmartFieldConfig[] = [
    {
      id: 'personal_type',
      name: 'نوع شخص',
      englishName: 'personalType',
      baseType: BaseFieldType.CHOICE,
      enhancements: [],
      validation: [
        {
          id: 'personal_type_required',
          type: ValidationType.REQUIRED,
          config: { value: true },
          message: 'انتخاب نوع شخص الزامی است',
          enabled: true
        }
      ],
      dataSource: {
        type: 'MANUAL',
        config: {
          items: [
            { id: 'individual', label: 'حقیقی' },
            { id: 'legal', label: 'حقوقی' }
          ]
        }
      },
      isRequired: true,
      order: 1
    },
    {
      id: 'national_id',
      name: 'کد ملی',
      englishName: 'nationalId',
      baseType: BaseFieldType.TEXT,
      enhancements: [],
      validation: [
        {
          id: 'national_id_pattern',
          type: ValidationType.PATTERN,
          config: { pattern: '^[0-9]{10}$' },
          message: 'کد ملی باید 10 رقم باشد',
          enabled: true
        }
      ],
      isRequired: false,
      order: 2,
      placeholder: '0123456789'
    },
    {
      id: 'company_registration',
      name: 'شماره ثبت شرکت',
      englishName: 'companyRegistration',
      baseType: BaseFieldType.TEXT,
      enhancements: [],
      validation: [
        {
          id: 'company_reg_pattern',
          type: ValidationType.PATTERN,
          config: { pattern: '^[0-9]{11}$' },
          message: 'شماره ثبت شرکت باید 11 رقم باشد',
          enabled: true
        }
      ],
      isRequired: false,
      order: 3,
      placeholder: '12345678901'
    },
    {
      id: 'has_representative',
      name: 'نماینده قانونی دارد؟',
      englishName: 'hasRepresentative',
      baseType: BaseFieldType.BOOLEAN,
      enhancements: [],
      validation: [],
      isRequired: false,
      order: 4
    },
    {
      id: 'representative_name',
      name: 'نام نماینده قانونی',
      englishName: 'representativeName',
      baseType: BaseFieldType.TEXT,
      enhancements: [],
      validation: [
        {
          id: 'rep_name_min_length',
          type: ValidationType.MIN_LENGTH,
          config: { min: 3 },
          message: 'نام نماینده باید حداقل 3 کاراکتر باشد',
          enabled: true
        }
      ],
      isRequired: false,
      order: 5,
      placeholder: 'نام و نام خانوادگی نماینده'
    },
    {
      id: 'military_service',
      name: 'وضعیت نظام وظیفه',
      englishName: 'militaryService',
      baseType: BaseFieldType.CHOICE,
      enhancements: [],
      validation: [],
      dataSource: {
        type: 'MANUAL',
        config: {
          items: [
            { id: 'completed', label: 'پایان خدمت' },
            { id: 'exempt', label: 'معاف' },
            { id: 'student', label: 'مشمول تحصیلی' }
          ]
        }
      },
      isRequired: false,
      order: 6
    }
  ];

  // Sample dependency scenarios
  const loadSampleDependencies = useCallback(() => {
    const sampleDeps: FieldDependency[] = [
      {
        id: 'dep_1',
        type: DependencyType.VISIBILITY,
        sourceFieldId: 'personal_type',
        targetFieldId: 'national_id',
        condition: {
          operator: ConditionOperator.EQUALS,
          value: 'individual'
        },
        action: {
          type: 'show'
        },
        enabled: true,
        description: 'نمایش کد ملی برای اشخاص حقیقی'
      },
      {
        id: 'dep_2',
        type: DependencyType.VISIBILITY,
        sourceFieldId: 'personal_type',
        targetFieldId: 'company_registration',
        condition: {
          operator: ConditionOperator.EQUALS,
          value: 'legal'
        },
        action: {
          type: 'show'
        },
        enabled: true,
        description: 'نمایش شماره ثبت شرکت برای اشخاص حقوقی'
      },
      {
        id: 'dep_3',
        type: DependencyType.REQUIRED,
        sourceFieldId: 'personal_type',
        targetFieldId: 'national_id',
        condition: {
          operator: ConditionOperator.EQUALS,
          value: 'individual'
        },
        action: {
          type: 'require'
        },
        enabled: true,
        description: 'اجباری کردن کد ملی برای اشخاص حقیقی'
      },
      {
        id: 'dep_4',
        type: DependencyType.VISIBILITY,
        sourceFieldId: 'has_representative',
        targetFieldId: 'representative_name',
        condition: {
          operator: ConditionOperator.EQUALS,
          value: true
        },
        action: {
          type: 'show'
        },
        enabled: true,
        description: 'نمایش نام نماینده در صورت داشتن نماینده'
      },
      {
        id: 'dep_5',
        type: DependencyType.VISIBILITY,
        sourceFieldId: 'personal_type',
        targetFieldId: 'military_service',
        condition: {
          operator: ConditionOperator.EQUALS,
          value: 'individual'
        },
        action: {
          type: 'show'
        },
        enabled: true,
        description: 'نمایش وضعیت نظام وظیفه برای اشخاص حقیقی'
      }
    ];

    setDependencies(sampleDeps);
  }, []);

  // Initialize sample dependencies on first load
  React.useEffect(() => {
    loadSampleDependencies();
  }, [loadSampleDependencies]);

  const handleFieldValueChange = useCallback((fieldId: string, value: any) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: value }));
  }, []);

  const handleValidationChange = useCallback((fieldId: string, isValid: boolean, message?: string) => {
    // Handle field validation changes if needed
  }, []);

  const handleDependencyValidationError = useCallback((errors: string[]) => {
    setValidationErrors(errors);
  }, []);

  const resetDemo = useCallback(() => {
    setFieldValues({});
    setValidationErrors([]);
  }, []);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        سیستم وابستگی فیلدهای هوشمند
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        این سیستم امکان ایجاد فیلدهای شرطی و وابستگی‌های پیچیده بین فیلدها را فراهم می‌کند
      </Typography>

      {/* Demo Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadSampleDependencies}
        >
          بارگذاری نمونه‌ها
        </Button>
        <Button
          variant="outlined"
          startIcon={<PlayIcon />}
          onClick={resetDemo}
        >
          ریست کردن
        </Button>
      </Box>

      {validationErrors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {validationErrors.map((error, index) => (
            <Typography key={index} variant="body2">
              • {error}
            </Typography>
          ))}
        </Alert>
      )}

      {/* Main Content */}
      <Paper sx={{ mt: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<CodeIcon />} label="مدیریت وابستگی‌ها" />
          <Tab icon={<TreeIcon />} label="نقشه وابستگی" />
          <Tab icon={<PreviewIcon />} label="پیش‌نمایش فرم" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: 3 }}>
            <FieldDependencyBuilder
              fields={sampleFields}
              dependencies={dependencies}
              onChange={setDependencies}
              onValidationError={handleDependencyValidationError}
            />
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 3 }}>
            <DependencyMapper
              fields={sampleFields}
              dependencies={dependencies}
              onDependencyClick={(dep) => {
                console.log('Clicked dependency:', dep);
                // Switch to dependency management tab
                setActiveTab(0);
              }}
              onFieldClick={(field) => {
                console.log('Clicked field:', field);
              }}
            />
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom>
                  فرم تعاملی
                </Typography>
                <ConditionalFieldRenderer
                  fields={sampleFields}
                  dependencies={dependencies}
                  values={fieldValues}
                  onChange={handleFieldValueChange}
                  onValidationChange={handleValidationChange}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      مقادیر فعلی
                    </Typography>
                    <Box component="pre" sx={{ fontSize: 12, overflow: 'auto' }}>
                      {JSON.stringify(fieldValues, null, 2)}
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={resetDemo}>
                      پاک کردن
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>

      <Divider sx={{ my: 3 }} />

      {/* Feature Summary */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                ویژگی‌های اصلی
              </Typography>
              <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                <li>نمایش/مخفی کردن شرطی فیلدها</li>
                <li>اجباری/اختیاری کردن بر اساس شرایط</li>
                <li>تنظیم مقادیر خودکار</li>
                <li>ویژگی‌های پیشرفته وابستگی</li>
                <li>نمایش گرافیکی روابط</li>
                <li>اعتبارسنجی شرطی</li>
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="secondary">
                عملگرهای پشتیبانی شده
              </Typography>
              <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                <li>برابری و عدم برابری</li>
                <li>مقایسه‌های عددی</li>
                <li>شامل بودن متن</li>
                <li>شروع و پایان رشته</li>
                <li>خالی بودن</li>
                <li>عضویت در لیست</li>
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="info">
                کاربردهای عملی
              </Typography>
              <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                <li>فرم‌های ثبت‌نام شرطی</li>
                <li>تعیین فیلدهای اجباری</li>
                <li>ساخت فرم‌های چندمرحله‌ای</li>
                <li>اعتبارسنجی پویا</li>
                <li>رابط کاربری تطبیقی</li>
                <li>کاهش پیچیدگی فرم</li>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DependencySystemDemo;