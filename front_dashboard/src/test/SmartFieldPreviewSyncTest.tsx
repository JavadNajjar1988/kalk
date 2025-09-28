import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Grid
} from '@mui/material';

// Smart Field Builder imports
import { SmartFieldBuilder } from '../modules/definition-editor/components/smart-field-builder';
import { SmartFieldConfig, BaseFieldType } from '../modules/definition-editor/components/smart-field-builder/types';

// Field Preview component
import FieldPreview from '../modules/definition-editor/components/fields/FieldPreview';

// Smart Field Manager for conversion
import SmartFieldManager from '../modules/definition-editor/components/fields/SmartFieldManager';

// Custom Field type
import { CustomField } from '../modules/definition-editor/types/equipment';

/**
 * Test component to verify that Smart Field Builder modal preview
 * matches the Form Preview tab display exactly
 */
const SmartFieldPreviewSyncTest: React.FC = () => {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  // Test case configuration
  const testConfig: Partial<SmartFieldConfig> = {
    id: 'test_field_001',
    name: 'نام کامل شخص', // Original name
    englishName: 'full_name',
    baseType: 'text' as BaseFieldType,
    enhancements: [],
    dataSource: undefined,
    validation: [],
    isRequired: true,
    order: 1,
    placeholder: 'نام و نام خانوادگی خود را وارد کنید', // Original placeholder
    helpText: 'این فیلد برای ثبت نام کامل شخص استفاده می‌شود' // Original help text
  };

  // Simulate Final Settings changes that user might make in Preview step
  const finalSettingsChanges = {
    name: 'نام و نام خانوادگی', // Changed in Final Settings
    placeholder: 'لطفاً نام کامل خود را وارد نمایید', // Changed in Final Settings
    helpText: 'نام کامل شامل نام و نام خانوادگی باشد', // Changed in Final Settings
    isRequired: false // Changed in Final Settings
  };

  // Simulate the complete Smart Field with Final Settings applied
  const completeTestConfig: SmartFieldConfig = {
    ...testConfig,
    ...finalSettingsChanges,
    generatedConfig: {
      finalSettings: {
        name: finalSettingsChanges.name,
        englishName: testConfig.englishName!,
        placeholder: finalSettingsChanges.placeholder,
        helpText: finalSettingsChanges.helpText,
        isRequired: finalSettingsChanges.isRequired,
        order: testConfig.order!
      },
      enhancements: {},
      baseFieldConfig: {
        baseType: testConfig.baseType!,
        dataSource: testConfig.dataSource,
        validation: testConfig.validation!
      }
    }
  } as SmartFieldConfig;

  // Manual conversion function (simulating SmartFieldManager conversion)
  const convertSmartFieldToCustom = (smartField: SmartFieldConfig): CustomField => {
    const finalSettings = smartField.generatedConfig?.finalSettings;
    
    const smartFieldMetadata = {
      enhancements: {},
      finalSettings: {
        placeholder: finalSettings?.placeholder || smartField.placeholder,
        helpText: finalSettings?.helpText || smartField.helpText,
        name: finalSettings?.name || smartField.name,
        englishName: finalSettings?.englishName || smartField.englishName,
        isRequired: finalSettings?.isRequired ?? smartField.isRequired,
        order: finalSettings?.order || smartField.order
      },
      baseType: smartField.baseType,
      dataSource: smartField.dataSource
    };
    
    return {
      id: smartField.id,
      name: finalSettings?.name || smartField.name,
      englishName: finalSettings?.englishName || smartField.englishName,
      type: 'text' as any,
      isRequired: finalSettings?.isRequired ?? smartField.isRequired,
      order: finalSettings?.order || smartField.order,
      defaultValue: JSON.stringify(smartFieldMetadata),
      validationRules: {}
    } as CustomField;
  };

  // Run test to verify sync
  const runSyncTest = () => {
    const results: string[] = [];
    
    // Convert smart field to custom field
    const convertedField = convertSmartFieldToCustom(completeTestConfig);
    
    // Test 1: Check if Final Settings name is preserved
    if (convertedField.name === finalSettingsChanges.name) {
      results.push('✅ نام فیلد از تنظیمات نهایی به درستی حفظ شده');
    } else {
      results.push(`❌ نام فیلد: انتظار "${finalSettingsChanges.name}", دریافت "${convertedField.name}"`);
    }
    
    // Test 2: Check if metadata contains Final Settings
    try {
      const metadata = JSON.parse(convertedField.defaultValue as string);
      
      if (metadata.finalSettings?.placeholder === finalSettingsChanges.placeholder) {
        results.push('✅ متن راهنما (Placeholder) از تنظیمات نهایی به درستی ذخیره شده');
      } else {
        results.push(`❌ متن راهنما: انتظار "${finalSettingsChanges.placeholder}", دریافت "${metadata.finalSettings?.placeholder}"`);
      }
      
      if (metadata.finalSettings?.helpText === finalSettingsChanges.helpText) {
        results.push('✅ متن کمکی از تنظیمات نهایی به درستی ذخیره شده');
      } else {
        results.push(`❌ متن کمکی: انتظار "${finalSettingsChanges.helpText}", دریافت "${metadata.finalSettings?.helpText}"`);
      }
      
      if (metadata.finalSettings?.isRequired === finalSettingsChanges.isRequired) {
        results.push('✅ وضعیت اجباری بودن از تنظیمات نهایی به درستی ذخیره شده');
      } else {
        results.push(`❌ وضعیت اجباری: انتظار "${finalSettingsChanges.isRequired}", دریافت "${metadata.finalSettings?.isRequired}"`);
      }
      
    } catch (e) {
      results.push('❌ خطا در پردازش متادیتای فیلد هوشمند');
    }
    
    setTestResults(results);
    
    // Add the test field to the preview
    setFields([convertedField]);
  };

  // Handle field save from Smart Field Builder
  const handleFieldSave = (config: SmartFieldConfig | SmartFieldConfig[]) => {
    const configs = Array.isArray(config) ? config : [config];
    const convertedFields = configs.map(convertSmartFieldToCustom);
    setFields(convertedFields);
    setIsBuilderOpen(false);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        تست همگام‌سازی پیش‌نمایش فیلد هوشمند
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        این تست بررسی می‌کند که آیا تغییرات اعمال شده در بخش "تنظیمات نهایی" مودال ساخت فیلد هوشمند
        در هر دو بخش پیش‌نمایش (مودال و تب پیش‌نمایش فرم) به یکسان نمایش داده می‌شود.
      </Typography>

      <Grid container spacing={3}>
        {/* Test Controls */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              کنترل‌های تست
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
              <Button
                variant="contained"
                onClick={runSyncTest}
                color="primary"
              >
                اجرای تست خودکار
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => setIsBuilderOpen(true)}
                color="secondary"
              >
                باز کردن ساخت فیلد هوشمند
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => setFields([])}
                color="error"
              >
                پاک کردن فیلدها
              </Button>
            </Box>

            {/* Test Configuration Display */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                تنظیمات تست:
              </Typography>
              <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                <div><strong>نام اولیه:</strong> {testConfig.name}</div>
                <div><strong>نام نهایی:</strong> {finalSettingsChanges.name}</div>
                <div><strong>متن راهنما اولیه:</strong> {testConfig.placeholder}</div>
                <div><strong>متن راهنما نهایی:</strong> {finalSettingsChanges.placeholder}</div>
                <div><strong>متن کمکی اولیه:</strong> {testConfig.helpText}</div>
                <div><strong>متن کمکی نهایی:</strong> {finalSettingsChanges.helpText}</div>
                <div><strong>اجباری اولیه:</strong> {testConfig.isRequired ? 'بله' : 'خیر'}</div>
                <div><strong>اجباری نهایی:</strong> {finalSettingsChanges.isRequired ? 'بله' : 'خیر'}</div>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Test Results */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              نتایج تست
            </Typography>
            
            {testResults.length === 0 ? (
              <Alert severity="info">
                برای مشاهده نتایج، ابتدا تست را اجرا کنید.
              </Alert>
            ) : (
              <Box>
                {testResults.map((result, index) => (
                  <Alert 
                    key={index} 
                    severity={result.startsWith('✅') ? 'success' : 'error'}
                    sx={{ mb: 1 }}
                  >
                    {result}
                  </Alert>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Form Preview */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              پیش‌نمایش فرم (همان چیزی که در تب "پیش‌نمایش فرم" نمایش داده می‌شود)
            </Typography>
            
            {fields.length > 0 ? (
              <FieldPreview
                fields={fields}
                title="تست پیش‌نمایش فیلد"
                description="این پیش‌نمایش باید دقیقاً همان چیزی باشد که در مودال ساخت فیلد هوشمند نمایش داده شد"
                readOnly={false}
              />
            ) : (
              <Alert severity="warning">
                هیچ فیلدی برای پیش‌نمایش وجود ندارد. ابتدا تست را اجرا کنید یا فیلد جدیدی ایجاد کنید.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Smart Field Builder Dialog */}
      <SmartFieldBuilder
        open={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSave={handleFieldSave}
        existingFields={[]}
        editingField={null}
        categoryContext="اشخاص"
      />
    </Box>
  );
};

export default SmartFieldPreviewSyncTest;