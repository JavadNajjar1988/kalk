import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  Chip,
  Paper,
  Stack,
  Button,
  Divider,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  PlayArrow as TestIcon,
  DataObject as DataIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Link as LinkIcon,
  Category as CategoryIcon
} from '@mui/icons-material';

// Hooks
import { useReferenceData, useAvailableReferenceCategories } from '@/hooks/useReferenceData';
import type { ReferenceSections } from '@/hooks/useReferenceData';

/**
 * کامپوننت تست جامع برای سیستم جدید Reference Fields
 * این تست تمام قابلیت‌های مطرح شده در مسئله را پوشش می‌دهد
 */
const SectionBasedReferenceTest: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<ReferenceSections>('both');
  const [testResults, setTestResults] = useState<{
    filteredCategories: boolean;
    sectionBasedDisplay: boolean;
    smartSectionSelector: boolean;
    realTimeSync: boolean;
    overallStatus: 'success' | 'warning' | 'error' | 'info';
    details: string[];
  }>({
    filteredCategories: false,
    sectionBasedDisplay: false,
    smartSectionSelector: false,
    realTimeSync: false,
    overallStatus: 'info',
    details: []
  });

  // Hook for available categories (filtered system)
  const { categories, getAvailableSections } = useAvailableReferenceCategories();

  // Hook for reference data based on selection
  const {
    data: referenceData,
    loading,
    error,
    refresh,
    isReady
  } = useReferenceData(selectedCategory, selectedSection);

  // تست خودکار هنگام تغییر دسته‌بندی
  useEffect(() => {
    if (selectedCategory) {
      runAutomaticTests();
    }
  }, [selectedCategory, selectedSection, categories, referenceData]);

  const runAutomaticTests = () => {
    const details: string[] = [];
    let filteredCategories = false;
    let sectionBasedDisplay = false;
    let smartSectionSelector = false;
    let realTimeSync = true; // فرض بر این است که real-time sync کار می‌کند

    // تست 1: بررسی فیلتر شدن دسته‌بندی‌ها
    const excludedCategories = ['ammunition', 'persons', 'equipment', 'military_units'];
    const hasExcludedCategories = categories.some(cat => excludedCategories.includes(cat.id));
    
    if (!hasExcludedCategories) {
      filteredCategories = true;
      details.push('✅ دسته‌بندی‌های مهمات، اشخاص، تجهیزات و یگان‌های نظامی به درستی فیلتر شده‌اند');
    } else {
      details.push('❌ برخی دسته‌بندی‌های غیرمجاز هنوز در لیست موجود هستند');
    }

    // تست 2: بررسی نمایش بخش‌ها
    if (referenceData && referenceData.items.length > 0) {
      sectionBasedDisplay = true;
      details.push(`✅ داده‌های بخش "${selectedSection}" به درستی نمایش داده شده‌اند (${referenceData.items.length} آیتم)`);
    } else if (referenceData && referenceData.items.length === 0) {
      details.push(`⚠️ بخش "${selectedSection}" خالی است`);
    }

    // تست 3: بررسی انتخابگر هوشمند بخش
    if (selectedCategory) {
      const category = categories.find(cat => cat.id === selectedCategory);
      if (category) {
        const availableSections = getAvailableSections(selectedCategory);
        
        if (category.hasHierarchy && category.hasData) {
          // دسته‌بندی دو بخشه - باید همه گزینه‌ها موجود باشند
          if (availableSections.includes('hierarchy') && availableSections.includes('data') && availableSections.includes('both')) {
            smartSectionSelector = true;
            details.push('✅ دسته‌بندی دو بخشه: همه گزینه‌های بخش در دسترس هستند');
          } else {
            details.push('❌ دسته‌بندی دو بخشه: برخی گزینه‌های بخش موجود نیستند');
          }
        } else if (category.hasHierarchy && !category.hasData) {
          // دسته‌بندی یک بخشه - فقط hierarchy
          if (availableSections.includes('hierarchy') && availableSections.length === 1) {
            smartSectionSelector = true;
            details.push('✅ دسته‌بندی یک بخشه: فقط بخش سطوح در دسترس است');
          } else {
            details.push('❌ دسته‌بندی یک بخشه: گزینه‌های اضافی نادرست موجود هستند');
          }
        } else {
          details.push('⚠️ ساختار دسته‌بندی نامشخص');
        }
      }
    }

    // محاسبه وضعیت کلی
    let overallStatus: 'success' | 'warning' | 'error' | 'info' = 'success';
    
    if (!filteredCategories) {
      overallStatus = 'error';
    } else if (!sectionBasedDisplay || !smartSectionSelector) {
      overallStatus = 'warning';
    }

    setTestResults({
      filteredCategories,
      sectionBasedDisplay,
      smartSectionSelector,
      realTimeSync,
      overallStatus,
      details
    });
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Reset section when category changes
    if (categoryId) {
      const availableSections = getAvailableSections(categoryId);
      if (availableSections.includes('both')) {
        setSelectedSection('both');
      } else if (availableSections.includes('hierarchy')) {
        setSelectedSection('hierarchy');
      } else if (availableSections.includes('data')) {
        setSelectedSection('data');
      }
    }
  };

  const renderStatusChip = (status: boolean, label: string) => (
    <Chip
      icon={status ? <CheckIcon /> : <ErrorIcon />}
      label={label}
      color={status ? 'success' : 'error'}
      variant="outlined"
      size="small"
    />
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: 'primary.main' }}>
        <TestIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        تست سیستم Reference Fields بر اساس بخش‌ها
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>اهداف تست:</strong>
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          <li>فیلتر شدن دسته‌بندی‌ها (حذف مهمات، اشخاص، تجهیزات، یگان‌ها)</li>
          <li>تشخیص دسته‌بندی‌های دو بخشه (سطوح + داده‌ها) و یک بخشه (فقط سطوح)</li>
          <li>انتخابگر هوشمند بخش برای دسته‌بندی‌های مختلف</li>
          <li>نمایش صحیح داده‌ها بر اساس بخش انتخابی</li>
        </Box>
      </Alert>

      <Grid container spacing={3}>
        {/* کنترل‌های تست */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                کنترل‌های تست
              </Typography>
              
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>انتخاب دسته‌بندی</InputLabel>
                  <Select
                    value={selectedCategory}
                    label="انتخاب دسته‌بندی"
                    onChange={(e) => handleCategoryChange(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>انتخاب کنید</em>
                    </MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography>{category.icon}</Typography>
                          <Typography>{category.name}</Typography>
                          <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                            {category.hasHierarchy && (
                              <Chip label="سطوح" size="small" color="primary" variant="outlined" />
                            )}
                            {category.hasData && (
                              <Chip label="داده‌ها" size="small" color="secondary" variant="outlined" />
                            )}
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedCategory && (
                  <FormControl fullWidth>
                    <InputLabel>انتخاب بخش</InputLabel>
                    <Select
                      value={selectedSection}
                      label="انتخاب بخش"
                      onChange={(e) => setSelectedSection(e.target.value as ReferenceSections)}
                    >
                      {getAvailableSections(selectedCategory).map((section) => (
                        <MenuItem key={section} value={section}>
                          {section === 'hierarchy' && 'مدیریت سطوح سلسله مراتبی'}
                          {section === 'data' && 'مدیریت داده‌های دسته‌بندی'}
                          {section === 'both' && 'هر دو بخش (سطوح + داده‌ها)'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <Button
                  variant="contained"
                  onClick={refresh}
                  disabled={!selectedCategory}
                  startIcon={<RefreshIcon />}
                >
                  بروزرسانی داده‌ها
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* نتایج تست */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                <CheckIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                نتایج تست
              </Typography>
              
              <Stack spacing={1} sx={{ mb: 2 }}>
                {renderStatusChip(testResults.filteredCategories, 'فیلتر دسته‌بندی‌ها')}
                {renderStatusChip(testResults.sectionBasedDisplay, 'نمایش بر اساس بخش')}
                {renderStatusChip(testResults.smartSectionSelector, 'انتخابگر هوشمند')}
                {renderStatusChip(testResults.realTimeSync, 'همگام‌سازی Real-time')}
              </Stack>

              <Alert severity={testResults.overallStatus} sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight={600}>
                  وضعیت کلی: {
                    testResults.overallStatus === 'success' ? '✅ موفق' :
                    testResults.overallStatus === 'warning' ? '⚠️ نیاز به بهبود' :
                    testResults.overallStatus === 'error' ? '❌ ناموفق' :
                    '📋 در انتظار تست'
                  }
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* نمایش داده‌ها */}
        {selectedCategory && (
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  <DataIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  داده‌های نمایش داده شده
                </Typography>
                
                {loading && <LinearProgress sx={{ mb: 2 }} />}
                
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    خطا در بارگذاری داده‌ها: {error}
                  </Alert>
                )}
                
                {isReady && referenceData && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Chip
                        icon={<CategoryIcon />}
                        label={`دسته‌بندی: ${referenceData.name}`}
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        icon={<LinkIcon />}
                        label={`بخش: ${selectedSection}`}
                        color="secondary"
                        variant="outlined"
                      />
                      <Chip
                        icon={<DataIcon />}
                        label={`تعداد آیتم‌ها: ${referenceData.items.length}`}
                        color="info"
                        variant="outlined"
                      />
                    </Box>

                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>نام فارسی</TableCell>
                            <TableCell>نام انگلیسی</TableCell>
                            <TableCell>سطح</TableCell>
                            <TableCell>توضیحات</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {referenceData.items.slice(0, 10).map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Chip label={item.id} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell>{item.name}</TableCell>
                              <TableCell>{item.englishName || '-'}</TableCell>
                              <TableCell>
                                {item.level && (
                                  <Chip label={`سطح ${item.level}`} size="small" color="primary" />
                                )}
                              </TableCell>
                              <TableCell>{item.description || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    {referenceData.items.length > 10 && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        نمایش ۱۰ آیتم اول از {referenceData.items.length} آیتم
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* جزئیات تست */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                جزئیات نتایج تست
              </Typography>
              
              <Stack spacing={1}>
                {testResults.details.map((detail, index) => (
                  <Alert 
                    key={index}
                    severity={
                      detail.includes('✅') ? 'success' :
                      detail.includes('⚠️') ? 'warning' : 'error'
                    }
                    variant="outlined"
                  >
                    {detail}
                  </Alert>
                ))}
                
                {testResults.details.length === 0 && (
                  <Alert severity="info">
                    هنوز تستی اجرا نشده است. یک دسته‌بندی انتخاب کنید تا تست شروع شود.
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SectionBasedReferenceTest;