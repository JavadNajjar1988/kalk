import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  Chip,
  Divider,
  Paper,
  Stack,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Link as LinkIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Sync as SyncIcon,
  Preview as PreviewIcon,
  DataObject as DataIcon,
  Settings as SettingsIcon,
  Science as TestIcon
} from '@mui/icons-material';

// Components
import FieldManager from '@/modules/definition-editor/components/fields/FieldManager';
import FieldPreview from '@/modules/definition-editor/components/fields/FieldPreview';
import ReferenceCategorySelector from '@/modules/definition-editor/components/fields/ReferenceCategorySelector';
import ReferenceFieldRenderer from '@/modules/definition-editor/components/fields/ReferenceFieldRenderer';

// Hooks
import { useReferenceData, useAvailableReferenceCategories } from '@/hooks/useReferenceData';

// Utils
import { simulateReferenceCategoryChange } from '@/utils/definitionSync';

// Types
import type { CustomField } from '@/modules/definition-editor/types/equipment';

/**
 * Component برای تست کامل قابلیت Reference Fields
 * این component تمام جنبه‌های Reference Fields را تست می‌کند
 */
const ReferenceFieldsTest: React.FC = () => {
  const [testFields, setTestFields] = useState<CustomField[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [testResults, setTestResults] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showReferenceRenderer, setShowReferenceRenderer] = useState(false);

  // استفاده از hooks
  const { categories, getCategoryById } = useAvailableReferenceCategories();
  const {
    data: referenceData,
    loading: referenceLoading,
    error: referenceError,
    refresh: refreshReferenceData,
    hasData,
    isEmpty,
    isReady
  } = useReferenceData(selectedCategory);

  const addTestResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('fa-IR');
    setTestResults(prev => [...prev.slice(-19), `[${timestamp}] ${message}`]);
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  // تست‌های مختلف Reference Fields
  const testCreateReferenceField = () => {
    const referenceField: CustomField = {
      id: `ref_field_${Date.now()}`,
      name: 'درجه نظامی',
      englishName: 'Military Rank',
      type: 'reference',
      isRequired: true,
      order: testFields.length + 1,
      referenceCategory: 'military_ranks',
      referenceSections: 'data' // فقط بخش داده‌ها
    };

    setTestFields(prev => [...prev, referenceField]);
    addTestResult(`فیلد Reference جدید ایجاد شد: ${referenceField.name}`);
  };

  const testReferenceFieldWithEquipment = () => {
    const equipmentField: CustomField = {
      id: `ref_field_eq_${Date.now()}`,
      name: 'تجهیزات اختصاصی',
      englishName: 'Equipment',
      type: 'reference',
      isRequired: false,
      order: testFields.length + 1,
      referenceCategory: 'equipment',
      referenceSections: 'both' // هر دو بخش
    };

    setTestFields(prev => [...prev, equipmentField]);
    addTestResult(`فیلد Reference تجهیزات ایجاد شد: ${equipmentField.name}`);
  };

  const testReferenceFieldWithPersons = () => {
    const personsField: CustomField = {
      id: `ref_field_person_${Date.now()}`,
      name: 'مسئول واحد',
      englishName: 'Unit Manager',
      type: 'reference',
      isRequired: true,
      order: testFields.length + 1,
      referenceCategory: 'persons',
      referenceSections: 'hierarchy' // فقط بخش سلسله مراتبی
    };

    setTestFields(prev => [...prev, personsField]);
    addTestResult(`فیلد Reference اشخاص ایجاد شد: ${personsField.name}`);
  };

  const testReferenceCategorySync = () => {
    if (selectedCategory) {
      simulateReferenceCategoryChange(selectedCategory, {
        message: 'تست بروزرسانی دسته‌بندی مرجع',
        timestamp: Date.now()
      });
      addTestResult(`شبیه‌سازی تغییر دسته‌بندی ${selectedCategory} انجام شد`);
    } else {
      addTestResult('ابتدا یک دسته‌بندی انتخاب کنید');
    }
  };

  const editReferenceField = (fieldId: string) => {
    const field = testFields.find(f => f.id === fieldId);
    if (field && field.type === 'reference') {
      // ایجاد نسخه ویرایش شده
      const editedField: CustomField = {
        ...field,
        name: field.name + ' (ویرایش شده)',
        englishName: field.englishName + ' (Edited)',
        referenceSections: field.referenceSections === 'data' ? 'both' : 'data' // تغییر بخش نمایش
      };

      setTestFields(prev => prev.map(f => f.id === fieldId ? editedField : f));
      addTestResult(`فیلد Reference ویرایش شد: ${field.name}`);
    }
  };

  const deleteReferenceField = (fieldId: string) => {
    const field = testFields.find(f => f.id === fieldId);
    setTestFields(prev => prev.filter(f => f.id !== fieldId));
    addTestResult(`فیلد Reference حذف شد: ${field?.name}`);
  };

  const clearAllFields = () => {
    setTestFields([]);
    setFormValues({});
    addTestResult('تمام فیلدها پاک شدند');
  };

  const testFormSubmit = (data: Record<string, any>) => {
    console.log('Form submitted with data:', data);
    addTestResult(`فرم ارسال شد با ${Object.keys(data).length} فیلد`);
  };

  // فیلترکردن فیلدهای Reference
  const referenceFields = testFields.filter(field => field.type === 'reference');

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: 'primary.main' }}>
        <LinkIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        تست سیستم Reference Fields
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        این صفحه برای تست کامل قابلیت Reference Fields طراحی شده است.
        می‌توانید فیلدهای مرجع ایجاد کرده و عملکرد آنها را بررسی کنید.
      </Alert>

      <Grid container spacing={3}>
        {/* کنترل‌های تست */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              <TestIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              کنترل‌های تست
            </Typography>
            
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={testCreateReferenceField}
                color="primary"
              >
                ایجاد فیلد درجات نظامی
              </Button>
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={testReferenceFieldWithEquipment}
                color="secondary"
              >
                ایجاد فیلد تجهیزات
              </Button>
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={testReferenceFieldWithPersons}
                color="success"
              >
                ایجاد فیلد اشخاص
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<SyncIcon />}
                onClick={testReferenceCategorySync}
                color="warning"
              >
                تست همگام‌سازی
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<PreviewIcon />}
                onClick={() => setShowPreview(true)}
                disabled={testFields.length === 0}
              >
                پیش‌نمایش فرم
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<DataIcon />}
                onClick={() => setShowReferenceRenderer(true)}
                disabled={referenceFields.length === 0}
              >
                تست رندرر
              </Button>
              
              <Button
                variant="outlined"
                color="error"
                onClick={clearAllFields}
                disabled={testFields.length === 0}
              >
                پاک کردن همه
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* انتخاب دسته‌بندی برای تست */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                انتخاب دسته‌بندی مرجع
              </Typography>
              
              <ReferenceCategorySelector
                value={selectedCategory}
                onChange={setSelectedCategory}
                label="دسته‌بندی برای تست"
              />
              
              {selectedCategory && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    اطلاعات دسته‌بندی انتخاب شده:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip
                      label={`ID: ${selectedCategory}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={getCategoryById(selectedCategory)?.name || 'نامشخص'}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                    <Chip
                      label={referenceLoading ? 'بارگذاری...' : isReady ? `${referenceData?.items.length || 0} آیتم` : 'آماده نیست'}
                      size="small"
                      color={isReady ? 'success' : 'warning'}
                      variant="outlined"
                    />
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* نمایش داده‌های دسته‌بندی مرجع */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" color="secondary.main">
                  داده‌های دسته‌بندی مرجع
                </Typography>
                <Tooltip title="بروزرسانی">
                  <IconButton size="small" onClick={refreshReferenceData} disabled={referenceLoading}>
                    <SyncIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              
              {!selectedCategory ? (
                <Alert severity="info">ابتدا یک دسته‌بندی انتخاب کنید</Alert>
              ) : referenceLoading ? (
                <Alert severity="warning">در حال بارگذاری...</Alert>
              ) : referenceError ? (
                <Alert severity="error">{referenceError}</Alert>
              ) : isEmpty ? (
                <Alert severity="warning">هیچ داده‌ای یافت نشد</Alert>
              ) : hasData ? (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    آیتم‌های موجود ({referenceData?.items.length}):
                  </Typography>
                  <Stack spacing={0.5} sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {referenceData?.items.slice(0, 10).map((item, index) => (
                      <Chip
                        key={item.id}
                        label={`${item.name} (${item.id})`}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                    {(referenceData?.items.length || 0) > 10 && (
                      <Typography variant="caption" color="text.secondary">
                        ... و {(referenceData?.items.length || 0) - 10} آیتم دیگر
                      </Typography>
                    )}
                  </Stack>
                </Box>
              ) : (
                <Alert severity="info">وضعیت نامشخص</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* مدیریت فیلدها */}
        <Grid item xs={12}>
          <FieldManager
            nodeId="test-node-ref-fields"
            fields={testFields}
            onFieldsChange={setTestFields}
            title="مدیریت فیلدهای تست Reference"
            description="در این بخش می‌توانید فیلدهای Reference ایجاد و مدیریت کنید"
          />
        </Grid>

        {/* نمایش فیلدهای Reference ایجاد شده */}
        {referenceFields.length > 0 && (
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                فیلدهای Reference ایجاد شده ({referenceFields.length})
              </Typography>
              
              <Grid container spacing={2}>
                {referenceFields.map((field) => (
                  <Grid item xs={12} sm={6} md={4} key={field.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {field.name}
                          </Typography>
                          <Box>
                            <IconButton size="small" onClick={() => editReferenceField(field.id)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => deleteReferenceField(field.id)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                        
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          {field.englishName}
                        </Typography>
                        
                        <Stack spacing={0.5}>
                          <Chip
                            label={`مرجع: ${field.referenceCategory}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Chip
                            label={`بخش: ${field.referenceSections === 'hierarchy' ? 'سلسله مراتبی' : field.referenceSections === 'data' ? 'داده‌ها' : 'هر دو بخش'}`}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                          {field.isRequired && (
                            <Chip
                              label="الزامی"
                              size="small"
                              color="error"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* لاگ تست‌ها */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                لاگ تست‌ها ({testResults.length})
              </Typography>
              <Button variant="outlined" size="small" onClick={clearTestResults}>
                پاک کردن لاگ
              </Button>
            </Box>
            
            <Box
              sx={{
                maxHeight: 300,
                overflow: 'auto',
                bgcolor: 'grey.50',
                p: 2,
                borderRadius: 1,
                fontFamily: 'monospace'
              }}
            >
              {testResults.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  هیچ تستی اجرا نشده است...
                </Typography>
              ) : (
                testResults.map((result, index) => (
                  <Typography
                    key={index}
                    variant="body2"
                    sx={{
                      mb: 0.5,
                      fontSize: '0.875rem',
                      color: result.includes('شبیه‌سازی') ? 'warning.main' : 'text.primary'
                    }}
                  >
                    {result}
                  </Typography>
                ))
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog پیش‌نمایش فرم */}
      <Dialog 
        open={showPreview} 
        onClose={() => setShowPreview(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { direction: 'rtl' } }}
      >
        <DialogTitle>پیش‌نمایش فرم با فیلدهای Reference</DialogTitle>
        <DialogContent>
          <FieldPreview
            fields={testFields}
            title="فرم تست Reference Fields"
            description="این فرم شامل فیلدهای Reference ایجاد شده است"
            onSubmit={testFormSubmit}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>بستن</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog تست رندرر */}
      <Dialog 
        open={showReferenceRenderer} 
        onClose={() => setShowReferenceRenderer(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { direction: 'rtl' } }}
      >
        <DialogTitle>تست Reference Field Renderer</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {referenceFields.length > 0 && (
            <ReferenceFieldRenderer
              field={referenceFields[0]}
              value={formValues[referenceFields[0].id]}
              onChange={(value) => setFormValues(prev => ({ ...prev, [referenceFields[0].id]: value }))}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReferenceRenderer(false)}>بستن</Button>
        </DialogActions>
      </Dialog>

      {/* خلاصه وضعیت */}
      <Box sx={{ mt: 3 }}>
        <Alert severity="success">
          <Typography variant="body2">
            ✅ سیستم Reference Fields به روش section-based بروزرسانی شد
            <br />
            ✅ فیلدهای مرجع حالا از انتخاب بخش (سلسله مراتب/داده‌ها/هر دو) استفاده می‌کنند
            <br />
            ✅ رندرر بروزرسانی شده برای فیلدهای Reference با پشتیبانی از sections
            <br />
            ✅ سیستم همگام‌سازی real-time برای دسته‌بندی‌های مرجع فعال است
            <br />
            ✅ مدیریت کامل فیلدهای Reference در FieldManager با انتخاب بخش
            <br />
            ✅ حذف فیلدهای اضافی (نمایش، مقدار، مسیر) و جایگزینی با انتخاب بخش
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default ReferenceFieldsTest;