import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Tabs,
  Tab,
  Divider,
  useTheme
} from '@mui/material';
import {
  AccountTree as TreeIcon,
  Add as AddIcon,
  Preview as PreviewIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { SmartFieldConfig, FieldDependency } from '../types/smartFieldTypes';
import FieldDependencyBuilder from '../components/dependencies/FieldDependencyBuilder';
import DependencyMapper from '../components/dependencies/DependencyMapper';
import ConditionalFieldRenderer from '../components/dependencies/ConditionalFieldRenderer';

interface DependenciesStepProps {
  config: Partial<SmartFieldConfig>;
  existingFields: SmartFieldConfig[];
  allWizardFields: Partial<SmartFieldConfig>[];
  onChange: (updates: Partial<SmartFieldConfig>) => void;
  onComplete: () => void;
}

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

const DependenciesStep: React.FC<DependenciesStepProps> = ({
  config,
  existingFields,
  allWizardFields,
  onChange,
  onComplete
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});

  // Combine existing fields with current wizard fields for dependency building
  const allFields = [
    ...existingFields,
    ...allWizardFields
      .filter(field => field.id && field.name && field.baseType)
      .map(field => field as SmartFieldConfig)
  ];

  const dependencies = config.dependencies || [];

  const handleDependenciesChange = useCallback((newDependencies: FieldDependency[]) => {
    onChange({ dependencies: newDependencies });
  }, [onChange]);

  const handleValidationError = useCallback((errors: string[]) => {
    setValidationErrors(errors);
  }, []);

  const handlePreviewValueChange = useCallback((fieldId: string, value: any) => {
    setPreviewValues(prev => ({ ...prev, [fieldId]: value }));
  }, []);

  const canProceed = validationErrors.length === 0;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        وابستگی‌های فیلد
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        وابستگی‌ها به شما اجازه می‌دهند فیلدهای شرطی ایجاد کنید که بر اساس مقادیر سایر فیلدها نمایش داده شوند
      </Typography>

      {allFields.length < 2 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          برای ایجاد وابستگی، حداقل 2 فیلد در فرم شما باید وجود داشته باشد.
          در حال حاضر {allFields.length} فیلد موجود است.
        </Alert>
      )}

      {validationErrors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Box>
            {validationErrors.map((error, index) => (
              <Typography key={index} variant="body2">
                • {error}
              </Typography>
            ))}
          </Box>
        </Alert>
      )}

      {allFields.length >= 2 && (
        <Card sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<AddIcon />} label="مدیریت وابستگی‌ها" />
            <Tab icon={<TreeIcon />} label="نقشه وابستگی" />
            <Tab icon={<PreviewIcon />} label="پیش‌نمایش" />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <Box sx={{ p: 3 }}>
              <FieldDependencyBuilder
                fields={allFields}
                dependencies={dependencies}
                onChange={handleDependenciesChange}
                onValidationError={handleValidationError}
              />
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Box sx={{ p: 3 }}>
              {dependencies.length === 0 ? (
                <Alert severity="info">
                  هنوز هیچ وابستگی تعریف نشده است. از تب "مدیریت وابستگی‌ها" استفاده کنید.
                </Alert>
              ) : (
                <DependencyMapper
                  fields={allFields}
                  dependencies={dependencies}
                  onDependencyClick={() => setActiveTab(0)}
                />
              )}
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Box sx={{ p: 3 }}>
              {dependencies.length === 0 ? (
                <Alert severity="info">
                  هنوز هیچ وابستگی تعریف نشده است.
                </Alert>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom>
                    تست عملکرد وابستگی‌ها
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    با تغییر مقادیر فیلدها، تأثیر وابستگی‌ها را مشاهده کنید
                  </Typography>
                  
                  <ConditionalFieldRenderer
                    fields={allFields}
                    dependencies={dependencies}
                    values={previewValues}
                    onChange={handlePreviewValueChange}
                  />
                </>
              )}
            </Box>
          </TabPanel>
        </Card>
      )}

      {/* Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CheckIcon color={dependencies.length > 0 ? 'success' : 'disabled'} />
            <Typography variant="h6">
              خلاصه وابستگی‌ها
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            تعداد وابستگی‌های تعریف شده: {dependencies.length}
          </Typography>
          
          {dependencies.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                انواع وابستگی‌های فعال:
              </Typography>
              {[
                { type: 'show', label: 'نمایش', count: dependencies.filter(d => d.action.type === 'show' && d.enabled).length },
                { type: 'hide', label: 'مخفی کردن', count: dependencies.filter(d => d.action.type === 'hide' && d.enabled).length },
                { type: 'require', label: 'اجباری کردن', count: dependencies.filter(d => d.action.type === 'require' && d.enabled).length },
                { type: 'optional', label: 'اختیاری کردن', count: dependencies.filter(d => d.action.type === 'optional' && d.enabled).length }
              ].map(({ type, label, count }) => (
                count > 0 && (
                  <Typography key={type} variant="body2" sx={{ ml: 2 }}>
                    • {label}: {count} مورد
                  </Typography>
                )
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          وابستگی‌ها اختیاری هستند و می‌توانید بدون تعریف آنها ادامه دهید
        </Typography>
        
        <Button
          variant="contained"
          onClick={onComplete}
          disabled={!canProceed}
        >
          ادامه به مرحله بعد
        </Button>
      </Box>
    </Box>
  );
};

export default DependenciesStep;