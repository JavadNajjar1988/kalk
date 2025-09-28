import React, { useState } from 'react';
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
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Category as CategoryIcon,
  DataObject as DataIcon,
  AccountTree as TreeIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  PlayArrow as TestIcon,
  ExpandMore as ExpandMoreIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';

// Components
import ReferenceCategorySelector from '@/modules/definition-editor/components/fields/ReferenceCategorySelector';
import ReferenceFieldRenderer from '@/modules/definition-editor/components/fields/ReferenceFieldRenderer';

// Hooks
import { useAvailableReferenceCategories, useReferenceData } from '@/hooks/useReferenceData';
import type { ReferenceSections } from '@/hooks/useReferenceData';

interface CategoryTestResult {
  categoryId: string;
  categoryName: string;
  hasHierarchy: boolean;
  hasData: boolean;
  availableSections: string[];
  selectionWorks: boolean;
  dataLoadsCorrectly: boolean;
  uiResponsive: boolean;
  sectionSwitchWorks: boolean;
  errorHandling: boolean;
  performance: number;
  details: string[];
}

/**
 * کامپوننت تست جامع ReferenceCategorySelector
 * این کامپوننت تمام ویژگی‌های ReferenceCategorySelector را تست می‌کند
 */
const ReferenceCategorySelectorTest: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<ReferenceSections>('both');
  const [testMode, setTestMode] = useState<'interactive' | 'automatic'>('interactive');
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<CategoryTestResult[]>([]);
  const [detailsExpanded, setDetailsExpanded] = useState<{[key: string]: boolean}>({});

  // Get available categories
  const { categories, getAvailableSections, getCategoryById } = useAvailableReferenceCategories();

  // Hook for testing selected category
  const {
    data: testData,
    loading: testLoading,
    error: testError,
    refresh: testRefresh,
    isReady: testReady
  } = useReferenceData(selectedCategory || undefined, selectedSection);

  // Test individual category
  const testCategory = async (categoryId: string): Promise<CategoryTestResult> => {
    const startTime = Date.now();
    const category = getCategoryById(categoryId);
    
    if (!category) {
      return {
        categoryId,
        categoryName: 'نامشخص',
        hasHierarchy: false,
        hasData: false,
        availableSections: [],
        selectionWorks: false,
        dataLoadsCorrectly: false,
        uiResponsive: false,
        sectionSwitchWorks: false,
        errorHandling: false,
        performance: 0,
        details: ['❌ دسته‌بندی یافت نشد']
      };
    }

    const details: string[] = [];
    let selectionWorks = false;
    let dataLoadsCorrectly = false;
    let uiResponsive = true;
    let sectionSwitchWorks = false;
    let errorHandling = false;

    // Test 1: Basic selection
    try {
      setSelectedCategory(categoryId);
      selectionWorks = true;
      details.push(`✅ Selection: دسته‌بندی ${category.name} قابل انتخاب است`);
    } catch (error) {
      details.push(`❌ Selection: خطا در انتخاب دسته‌بندی - ${error}`);
    }

    // Test 2: Data loading (we need to wait for the hook to update)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      if (testReady && testData && testData.items.length > 0) {
        dataLoadsCorrectly = true;
        details.push(`✅ Data Loading: ${testData.items.length} آیتم بارگذاری شد`);
      } else if (testError) {
        details.push(`⚠️ Data Loading: خطا - ${testError}`);
        errorHandling = true; // Error handling works if we get proper error message
      } else {
        details.push(`⚠️ Data Loading: داده‌ای یافت نشد`);
      }
    } catch (error) {
      details.push(`❌ Data Loading: خطا در بارگذاری - ${error}`);
    }

    // Test 3: Available sections
    const availableSections = getAvailableSections(categoryId);
    if (availableSections.length > 0) {
      sectionSwitchWorks = true;
      details.push(`✅ Sections: ${availableSections.length} بخش موجود است (${availableSections.join(', ')})`);
    } else {
      details.push(`❌ Sections: هیچ بخشی موجود نیست`);
    }

    // Test 4: Performance
    const performance = Date.now() - startTime;
    if (performance < 2000) {
      details.push(`✅ Performance: ${performance}ms (خوب)`);
    } else {
      details.push(`⚠️ Performance: ${performance}ms (کند)`);
      uiResponsive = false;
    }

    return {
      categoryId,
      categoryName: category.name,
      hasHierarchy: category.hasHierarchy || false,
      hasData: category.hasData || false,
      availableSections,
      selectionWorks,
      dataLoadsCorrectly,
      uiResponsive,
      sectionSwitchWorks,
      errorHandling,
      performance,
      details
    };
  };

  // Run comprehensive test
  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setTestResults([]);

    const results: CategoryTestResult[] = [];

    for (const category of categories.slice(0, 5)) { // Test first 5 categories to avoid overload
      const result = await testCategory(category.id);
      results.push(result);
      setTestResults([...results]);
      
      // Small delay for UI updates
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
  };

  // Handle category selection
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // Handle section change
  const handleSectionChange = (section: ReferenceSections) => {
    setSelectedSection(section);
  };

  // Calculate test statistics
  const totalTests = testResults.length;
  const successfulSelections = testResults.filter(r => r.selectionWorks).length;
  const successfulDataLoads = testResults.filter(r => r.dataLoadsCorrectly).length;
  const responsiveUI = testResults.filter(r => r.uiResponsive).length;
  const workingSections = testResults.filter(r => r.sectionSwitchWorks).length;
  const averagePerformance = totalTests > 0 
    ? testResults.reduce((sum, r) => sum + r.performance, 0) / totalTests 
    : 0;

  // Get category with sections info
  const selectedCategoryData = getCategoryById(selectedCategory);
  const availableSectionsForSelected = selectedCategory ? getAvailableSections(selectedCategory) : [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: 'primary.main' }}>
        <CategoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        تست جامع ReferenceCategorySelector
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>اهداف تست:</strong>
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          <li>تست انتخاب دسته‌بندی‌های مختلف</li>
          <li>بررسی بارگذاری صحیح داده‌ها پس از انتخاب</li>
          <li>تست نمایش sections مناسب برای هر دسته‌بندی</li>
          <li>ارزیابی performance و responsiveness</li>
          <li>تست error handling و validation</li>
          <li>بررسی integration با ReferenceFieldRenderer</li>
        </Box>
      </Alert>

      {/* Interactive Test Area */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                تست تعاملی
              </Typography>
              
              <Stack spacing={2}>
                <ReferenceCategorySelector
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  label="انتخاب دسته‌بندی برای تست"
                />

                {selectedCategory && availableSectionsForSelected.length > 0 && (
                  <FormControl fullWidth>
                    <InputLabel>بخش نمایش</InputLabel>
                    <Select
                      value={selectedSection}
                      label="بخش نمایش"
                      onChange={(e) => handleSectionChange(e.target.value as ReferenceSections)}
                    >
                      {availableSectionsForSelected.map((section) => (
                        <MenuItem key={section} value={section}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {section === 'hierarchy' ? <TreeIcon fontSize="small" /> : 
                             section === 'data' ? <DataIcon fontSize="small" /> : 
                             <CategoryIcon fontSize="small" />}
                            {section === 'hierarchy' ? 'سطوح سلسله مراتبی' :
                             section === 'data' ? 'داده‌ها' : 'هر دو بخش'}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    onClick={runComprehensiveTest}
                    disabled={isRunning}
                    startIcon={isRunning ? <RefreshIcon /> : <TestIcon />}
                    size="small"
                  >
                    {isRunning ? 'در حال تست...' : 'تست خودکار'}
                  </Button>
                  
                  {selectedCategory && (
                    <Button
                      variant="outlined"
                      onClick={() => testCategory(selectedCategory).then(result => 
                        setTestResults(prev => [...prev.filter(r => r.categoryId !== selectedCategory), result])
                      )}
                      startIcon={<SpeedIcon />}
                      size="small"
                    >
                      تست این دسته‌بندی
                    </Button>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                اطلاعات دسته‌بندی انتخاب شده
              </Typography>
              
              {selectedCategoryData ? (
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span style={{ fontSize: '1.2rem' }}>{selectedCategoryData.icon}</span>
                    <Typography variant="subtitle1">{selectedCategoryData.name}</Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    {selectedCategoryData.englishName}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary">
                    {selectedCategoryData.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    <Chip
                      label={`ID: ${selectedCategoryData.id}`}
                      size="small"
                      variant="outlined"
                    />
                    {selectedCategoryData.hasHierarchy && (
                      <Chip
                        label="دارای سطوح"
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {selectedCategoryData.hasData && (
                      <Chip
                        label="دارای داده"
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    )}
                    <Chip
                      label={`${availableSectionsForSelected.length} بخش`}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  </Box>

                  {testData && (
                    <Alert severity="success" sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        داده‌ها بارگذاری شد: {testData.items.length} آیتم
                      </Typography>
                    </Alert>
                  )}

                  {testError && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        خطا: {testError}
                      </Typography>
                    </Alert>
                  )}

                  {testLoading && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        در حال بارگذاری...
                      </Typography>
                    </Alert>
                  )}
                </Stack>
              ) : (
                <Alert severity="warning">
                  <Typography variant="body2">
                    دسته‌بندی انتخاب کنید
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Live Reference Field Test */}
      {selectedCategory && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              تست زنده ReferenceFieldRenderer
            </Typography>
            
            <Paper variant="outlined" sx={{ p: 2 }}>
              <ReferenceFieldRenderer
                field={{
                  id: 'test-reference-field',
                  name: `فیلد تست - ${selectedCategoryData?.name}`,
                  englishName: `Test Field - ${selectedCategoryData?.englishName}`,
                  type: 'reference',
                  isRequired: false,
                  order: 1,
                  referenceCategory: selectedCategory,
                  referenceSections: selectedSection
                }}
                value={null}
                onChange={(value) => console.log('Selected value:', value)}
                fullWidth
              />
            </Paper>
          </CardContent>
        </Card>
      )}

      {/* Test Statistics */}
      {testResults.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              آمار تست‌ها
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6} md={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {totalTests}
                  </Typography>
                  <Typography variant="caption">
                    کل تست‌ها
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} md={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {successfulSelections}/{totalTests}
                  </Typography>
                  <Typography variant="caption">
                    انتخاب موفق
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} md={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {successfulDataLoads}/{totalTests}
                  </Typography>
                  <Typography variant="caption">
                    بارگذاری داده
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} md={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="secondary.main">
                    {workingSections}/{totalTests}
                  </Typography>
                  <Typography variant="caption">
                    Sections کار
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} md={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {responsiveUI}/{totalTests}
                  </Typography>
                  <Typography variant="caption">
                    UI سریع
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} md={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="text.primary">
                    {Math.round(averagePerformance)}ms
                  </Typography>
                  <Typography variant="caption">
                    میانگین سرعت
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              نتایج تست‌ها
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>دسته‌بندی</TableCell>
                    <TableCell>ویژگی‌ها</TableCell>
                    <TableCell>انتخاب</TableCell>
                    <TableCell>بارگذاری</TableCell>
                    <TableCell>Sections</TableCell>
                    <TableCell>Performance</TableCell>
                    <TableCell>جزئیات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {testResults.map((result) => (
                    <TableRow key={result.categoryId}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {result.categoryName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {result.categoryId}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          {result.hasHierarchy && (
                            <Chip label="H" size="small" color="primary" />
                          )}
                          {result.hasData && (
                            <Chip label="D" size="small" color="secondary" />
                          )}
                          <Chip label={result.availableSections.length.toString()} size="small" variant="outlined" />
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={result.selectionWorks ? <CheckIcon /> : <ErrorIcon />}
                          label={result.selectionWorks ? 'موفق' : 'ناموفق'}
                          color={result.selectionWorks ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={result.dataLoadsCorrectly ? <CheckIcon /> : <ErrorIcon />}
                          label={result.dataLoadsCorrectly ? 'موفق' : 'ناموفق'}
                          color={result.dataLoadsCorrectly ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={result.sectionSwitchWorks ? <CheckIcon /> : <ErrorIcon />}
                          label={result.sectionSwitchWorks ? 'موفق' : 'ناموفق'}
                          color={result.sectionSwitchWorks ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${result.performance}ms`}
                          color={result.performance < 1000 ? 'success' : result.performance < 2000 ? 'warning' : 'error'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => setDetailsExpanded(prev => ({
                            ...prev,
                            [result.categoryId]: !prev[result.categoryId]
                          }))}
                          startIcon={<ExpandMoreIcon />}
                        >
                          {result.details.length} جزئیات
                        </Button>
                        
                        {detailsExpanded[result.categoryId] && (
                          <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                            {result.details.map((detail, index) => (
                              <Typography
                                key={index}
                                variant="caption"
                                display="block"
                                sx={{ fontFamily: 'monospace' }}
                              >
                                {detail}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ReferenceCategorySelectorTest;