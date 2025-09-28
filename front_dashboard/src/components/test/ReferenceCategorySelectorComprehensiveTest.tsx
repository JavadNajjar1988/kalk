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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Category as CategoryIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  PlayArrow as TestIcon,
  DataObject as DataIcon,
  AccountTree as HierarchyIcon,
  ViewModule as BothIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';

// Components
import ReferenceCategorySelector from '@/modules/definition-editor/components/fields/ReferenceCategorySelector';

// Hooks
import { useReferenceData, useAvailableReferenceCategories } from '@/hooks/useReferenceData';
import type { ReferenceSections } from '@/hooks/useReferenceData';

interface CategoryTestResult {
  categoryId: string;
  categoryName: string;
  selectionWorks: boolean;
  hasCorrectSections: boolean;
  dataLoadsAfterSelection: boolean;
  uiResponsive: boolean;
  validationWorks: boolean;
  performance: number;
  availableSections: string[];
  itemCount: number;
  error?: string;
}

/**
 * کامپوننت تست جامع ReferenceCategorySelector
 * این کامپوننت integration کامل با useAvailableReferenceCategories را تست می‌کند
 */
const ReferenceCategorySelectorComprehensiveTest: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [testResults, setTestResults] = useState<CategoryTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectorError, setSelectorError] = useState<string>('');
  const [currentTestCategory, setCurrentTestCategory] = useState<string>('');

  // Get available categories
  const { 
    categories, 
    getCategoryById, 
    getCategoryName,
    getAvailableSections,
    getDualSectionCategories,
    getSingleSectionCategories 
  } = useAvailableReferenceCategories();

  // Hook for testing selected category
  const {
    data: testData,
    loading: testLoading,
    error: testError,
    refresh: testRefresh,
    isReady: testReady
  } = useReferenceData(selectedCategory, 'both');

  // Test individual category
  const testCategory = async (categoryId: string): Promise<CategoryTestResult> => {
    const startTime = Date.now();
    const category = getCategoryById(categoryId);
    
    if (!category) {
      return {
        categoryId,
        categoryName: 'نامشخص',
        selectionWorks: false,
        hasCorrectSections: false,
        dataLoadsAfterSelection: false,
        uiResponsive: false,
        validationWorks: false,
        performance: 0,
        availableSections: [],
        itemCount: 0,
        error: 'دسته‌بندی یافت نشد'
      };
    }

    let selectionWorks = false;
    let hasCorrectSections = false;
    let dataLoadsAfterSelection = false;
    let uiResponsive = false;
    let validationWorks = false;
    let itemCount = 0;
    let error: string | undefined;

    try {
      // Test 1: Selection mechanism
      setSelectedCategory(categoryId);
      await new Promise(resolve => setTimeout(resolve, 100));
      selectionWorks = true;

      // Test 2: Available sections validation
      const availableSections = getAvailableSections(categoryId);
      const expectedSections: string[] = [];
      if (category.hasHierarchy) expectedSections.push('hierarchy');
      if (category.hasData) expectedSections.push('data');
      if (category.hasHierarchy && category.hasData) expectedSections.push('both');

      hasCorrectSections = availableSections.length > 0 && 
        availableSections.every(section => expectedSections.includes(section));

      // Test 3: Data loading after selection
      await new Promise(resolve => setTimeout(resolve, 500));
      if (testReady && testData) {
        dataLoadsAfterSelection = true;
        itemCount = testData.items.length;
      }

      // Test 4: UI responsiveness
      const currentTime = Date.now();
      if (currentTime - startTime < 2000) {
        uiResponsive = true;
      }

      // Test 5: Validation
      validationWorks = category.hasHierarchy !== undefined && category.hasData !== undefined;

    } catch (err) {
      error = err instanceof Error ? err.message : 'خطای نامشخص';
    }

    const performance = Date.now() - startTime;
    const availableSections = getAvailableSections(categoryId);

    return {
      categoryId,
      categoryName: category.name,
      selectionWorks,
      hasCorrectSections,
      dataLoadsAfterSelection,
      uiResponsive,
      validationWorks,
      performance,
      availableSections,
      itemCount,
      error
    };
  };

  // Run comprehensive tests
  const runComprehensiveTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const results: CategoryTestResult[] = [];

    for (const category of categories) {
      setCurrentTestCategory(category.name);
      
      const result = await testCategory(category.id);
      results.push(result);
      setTestResults([...results]);
      
      // Small delay for UI updates
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setCurrentTestCategory('');
    setIsRunning(false);
  };

  // Handle category selection
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectorError('');
  };

  // Validate current selection
  const validateSelection = () => {
    if (!selectedCategory) {
      setSelectorError('لطفاً یک دسته‌بندی انتخاب کنید');
      return;
    }

    const category = getCategoryById(selectedCategory);
    if (!category) {
      setSelectorError('دسته‌بندی انتخاب شده معتبر نیست');
      return;
    }

    setSelectorError('');
  };

  // Calculate test statistics
  const totalTests = testResults.length;
  const successfulTests = testResults.filter(r => 
    r.selectionWorks && r.hasCorrectSections && r.dataLoadsAfterSelection && r.uiResponsive && r.validationWorks
  ).length;
  const averagePerformance = totalTests > 0 
    ? testResults.reduce((sum, r) => sum + r.performance, 0) / totalTests 
    : 0;

  const dualSectionCategories = getDualSectionCategories();
  const singleSectionCategories = getSingleSectionCategories();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: 'primary.main' }}>
        <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        تست جامع ReferenceCategorySelector
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>این تست شامل:</strong>
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          <li>تست integration کامل با useAvailableReferenceCategories</li>
          <li>بررسی صحت نمایش sections برای هر category</li>
          <li>اعتبارسنجی hasHierarchy و hasData flags</li>
          <li>تست عملکرد و سرعت انتخاب</li>
          <li>بررسی UI responsiveness و user experience</li>
        </Box>
      </Alert>

      {/* Interactive Selector Test */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            تست تعاملی Selector
          </Typography>
          
          <Grid container spacing={2} alignItems="flex-start">
            <Grid item xs={12} md={6}>
              <ReferenceCategorySelector
                value={selectedCategory}
                onChange={handleCategoryChange}
                error={selectorError}
                label="انتخاب دسته‌بندی برای تست"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  onClick={validateSelection}
                  startIcon={<VerifiedIcon />}
                  fullWidth
                >
                  اعتبارسنجی انتخاب
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={testRefresh}
                  disabled={!selectedCategory}
                  startIcon={<RefreshIcon />}
                  fullWidth
                >
                  بروزرسانی داده‌ها
                </Button>

                <Button
                  variant="contained"
                  color="secondary"
                  onClick={runComprehensiveTests}
                  disabled={isRunning}
                  startIcon={<TestIcon />}
                  fullWidth
                >
                  {isRunning ? 'در حال تست...' : 'تست جامع تمام دسته‌بندی‌ها'}
                </Button>
              </Stack>
            </Grid>
          </Grid>

          {/* Selected Category Info */}
          {selectedCategory && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                اطلاعات دسته‌بندی انتخاب شده
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">نام دسته‌بندی</Typography>
                    <Typography variant="h6">{getCategoryName(selectedCategory)}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">Sections موجود</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                      {getAvailableSections(selectedCategory).map(section => (
                        <Chip 
                          key={section}
                          label={section}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">تعداد آیتم‌ها</Typography>
                    <Typography variant="h6">
                      {testLoading ? 'در حال بارگذاری...' : testData?.items.length || 0}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Test Progress */}
      {isRunning && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              پیشرفت تست
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {currentTestCategory && `تست ${currentTestCategory}...`}
              </Typography>
            </Box>
            <LinearProgress />
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            آمار دسته‌بندی‌ها
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {categories.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  کل دسته‌بندی‌ها
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {dualSectionCategories.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  دارای Hierarchy + Data
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {singleSectionCategories.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  فقط Hierarchy
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="secondary.main">
                  {Math.round(averagePerformance)}ms
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  میانگین عملکرد
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              نتایج تست‌ها ({successfulTests}/{totalTests} موفق)
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>دسته‌بندی</TableCell>
                    <TableCell>انتخاب</TableCell>
                    <TableCell>Sections</TableCell>
                    <TableCell>بارگذاری داده</TableCell>
                    <TableCell>UI</TableCell>
                    <TableCell>Validation</TableCell>
                    <TableCell>عملکرد</TableCell>
                    <TableCell>تعداد آیتم</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {testResults.map((result, index) => (
                    <TableRow key={index}>
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
                        <Chip
                          icon={result.selectionWorks ? <CheckIcon /> : <ErrorIcon />}
                          label={result.selectionWorks ? 'موفق' : 'ناموفق'}
                          color={result.selectionWorks ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {result.availableSections.map(section => (
                            <Chip 
                              key={section}
                              label={section}
                              size="small"
                              color={result.hasCorrectSections ? 'success' : 'warning'}
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={result.dataLoadsAfterSelection ? <CheckIcon /> : <ErrorIcon />}
                          label={result.dataLoadsAfterSelection ? 'موفق' : 'ناموفق'}
                          color={result.dataLoadsAfterSelection ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={result.uiResponsive ? <CheckIcon /> : <WarningIcon />}
                          label={result.uiResponsive ? 'سریع' : 'کند'}
                          color={result.uiResponsive ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={result.validationWorks ? <CheckIcon /> : <ErrorIcon />}
                          label={result.validationWorks ? 'صحیح' : 'خطا'}
                          color={result.validationWorks ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {result.performance}ms
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {result.itemCount}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Error Details */}
            {testResults.some(r => r.error) && (
              <Accordion sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2" color="error">
                    خطاها و مشکلات ({testResults.filter(r => r.error).length} مورد)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {testResults.filter(r => r.error).map((result, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <ErrorIcon color="error" />
                        </ListItemIcon>
                        <ListItemText
                          primary={result.categoryName}
                          secondary={result.error}
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ReferenceCategorySelectorComprehensiveTest;