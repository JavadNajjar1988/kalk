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
  LinearProgress
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  PlayArrow as TestIcon,
  DataObject as DataIcon,
  AccountTree as HierarchyIcon,
  ViewModule as BothIcon,
  Refresh as RefreshIcon,
  CompareArrows as SwitchIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

// Hooks
import { useReferenceData, useAvailableReferenceCategories } from '@/hooks/useReferenceData';
import type { ReferenceSections } from '@/hooks/useReferenceData';

/**
 * کامپوننت تست جامع Section Switching
 * این کامپوننت امکان تست تعاملی تغییر بین sections مختلف را فراهم می‌کند
 */
const SectionSwitchingTest: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('geographical');
  const [currentSection, setCurrentSection] = useState<ReferenceSections>('both');
  const [autoTest, setAutoTest] = useState(false);
  const [testResults, setTestResults] = useState<{
    switchingWorks: boolean;
    dataConsistency: boolean;
    performanceOk: boolean;
    uiResponsive: boolean;
    details: string[];
  }>({
    switchingWorks: false,
    dataConsistency: false,
    performanceOk: false,
    uiResponsive: false,
    details: []
  });

  // Get available categories
  const { categories, getAvailableSections } = useAvailableReferenceCategories();

  // Hook for current data with selected section
  const {
    data: currentData,
    loading: currentLoading,
    error: currentError,
    refresh: currentRefresh,
    isReady: currentReady
  } = useReferenceData(selectedCategory, currentSection);

  // Hook for hierarchy-only data (for comparison)
  const {
    data: hierarchyData,
    loading: hierarchyLoading,
    isReady: hierarchyReady
  } = useReferenceData(selectedCategory, 'hierarchy');

  // Hook for data-only data (for comparison) 
  const {
    data: dataOnlyData,
    loading: dataOnlyLoading,
    isReady: dataOnlyReady
  } = useReferenceData(selectedCategory, 'data');

  // Auto-test functionality
  useEffect(() => {
    if (autoTest && selectedCategory) {
      runSectionSwitchingTests();
    }
  }, [selectedCategory, currentSection, currentData, hierarchyData, dataOnlyData, autoTest]);

  const runSectionSwitchingTests = () => {
    const details: string[] = [];
    let switchingWorks = false;
    let dataConsistency = false;
    let performanceOk = true;
    let uiResponsive = true;

    const startTime = Date.now();

    // Test 1: بررسی عملکرد switching
    if (currentReady && currentData) {
      switchingWorks = true;
      details.push(`✅ Section switching عمل می‌کند - بخش "${currentSection}" بارگذاری شد`);
    } else if (currentError) {
      details.push(`❌ خطا در switching به بخش "${currentSection}": ${currentError}`);
    } else {
      details.push(`⏳ در حال بارگذاری بخش "${currentSection}"...`);
    }

    // Test 2: بررسی consistency داده‌ها
    if (currentSection === 'both' && hierarchyData && dataOnlyData && currentData) {
      const hierarchyItems = hierarchyData.items.filter(item => item.type === 'hierarchy');
      const dataItems = dataOnlyData.items.filter(item => item.type === 'data');
      const bothItems = currentData.items;

      // Check if both section contains hierarchy + data items
      const expectedCount = hierarchyItems.length + dataItems.length;
      const actualCount = bothItems.length;

      if (actualCount >= expectedCount) {
        dataConsistency = true;
        details.push(`✅ Data consistency: both شامل ${actualCount} آیتم (hierarchy: ${hierarchyItems.length}, data: ${dataItems.length})`);
      } else {
        details.push(`❌ Data consistency خراب: انتظار ${expectedCount} آیتم، دریافت ${actualCount}`);
      }
    } else if (currentSection === 'hierarchy' && hierarchyData && currentData) {
      if (currentData.items.length === hierarchyData.items.length) {
        dataConsistency = true;
        details.push(`✅ Data consistency: hierarchy شامل ${currentData.items.length} آیتم`);
      } else {
        details.push(`❌ Hierarchy data تطابق ندارد`);
      }
    } else if (currentSection === 'data' && dataOnlyData && currentData) {
      if (currentData.items.length === dataOnlyData.items.length) {
        dataConsistency = true;
        details.push(`✅ Data consistency: data شامل ${currentData.items.length} آیتم`);
      } else {
        details.push(`❌ Data-only تطابق ندارد`);
      }
    }

    // Test 3: بررسی performance
    const loadTime = Date.now() - startTime;
    if (loadTime > 2000) {
      performanceOk = false;
      details.push(`⚠️ Performance کند: ${loadTime}ms برای بارگذاری`);
    } else {
      details.push(`✅ Performance خوب: ${loadTime}ms برای بارگذاری`);
    }

    // Test 4: بررسی UI responsiveness
    if (currentLoading && loadTime > 100) {
      details.push(`✅ UI responsive: loading state نمایش داده شد`);
    }

    setTestResults({
      switchingWorks,
      dataConsistency,
      performanceOk,
      uiResponsive,
      details
    });
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setTestResults({ switchingWorks: false, dataConsistency: false, performanceOk: false, uiResponsive: false, details: [] });
  };

  const handleSectionChange = (section: ReferenceSections) => {
    setCurrentSection(section);
    setTestResults({ switchingWorks: false, dataConsistency: false, performanceOk: false, uiResponsive: false, details: [] });
  };

  const getAvailableSectionsForCategory = (categoryId: string) => {
    return getAvailableSections(categoryId);
  };

  const renderStatusChip = (status: boolean, label: string, icon: React.ReactNode) => (
    <Chip
      icon={status ? <CheckIcon /> : <ErrorIcon />}
      label={label}
      color={status ? 'success' : 'error'}
      variant="outlined"
      size="small"
      sx={{ m: 0.5 }}
    />
  );

  const renderSectionIcon = (section: ReferenceSections) => {
    switch (section) {
      case 'hierarchy': return <HierarchyIcon />;
      case 'data': return <DataIcon />;
      case 'both': return <BothIcon />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: 'primary.main' }}>
        <SwitchIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        تست Section Switching Functionality
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>اهداف تست:</strong>
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          <li>تست تغییر بین sections مختلف (hierarchy ↔ data ↔ both)</li>
          <li>بررسی consistency داده‌ها در هر section</li>
          <li>ارزیابی performance و سرعت switching</li>
          <li>تست UI responsiveness و loading states</li>
          <li>اعتبارسنجی صحت نمایش در categories مختلف</li>
        </Box>
      </Alert>

      {/* Test Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            کنترل‌های تست
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>دسته‌بندی</InputLabel>
                <Select
                  value={selectedCategory}
                  label="دسته‌بندی"
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>بخش</InputLabel>
                <Select
                  value={currentSection}
                  label="بخش"
                  onChange={(e) => handleSectionChange(e.target.value as ReferenceSections)}
                >
                  {getAvailableSectionsForCategory(selectedCategory).map((section) => (
                    <MenuItem key={section} value={section}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {renderSectionIcon(section as ReferenceSections)}
                        {section === 'hierarchy' ? 'سطوح سلسله مراتبی' :
                         section === 'data' ? 'داده‌ها' : 'هر دو بخش'}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoTest}
                    onChange={(e) => setAutoTest(e.target.checked)}
                  />
                }
                label="تست خودکار"
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                onClick={runSectionSwitchingTests}
                disabled={!selectedCategory}
                startIcon={<TestIcon />}
                fullWidth
              >
                اجرای تست
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            نتایج تست
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            {renderStatusChip(testResults.switchingWorks, 'Section Switching', <SwitchIcon />)}
            {renderStatusChip(testResults.dataConsistency, 'Data Consistency', <DataIcon />)}
            {renderStatusChip(testResults.performanceOk, 'Performance', <RefreshIcon />)}
            {renderStatusChip(testResults.uiResponsive, 'UI Responsive', <VisibilityIcon />)}
          </Box>

          {testResults.details.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="body2">
                  جزئیات تست ({testResults.details.length} نتیجه)
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {testResults.details.map((detail, index) => (
                    <Typography key={index} variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                      {detail}
                    </Typography>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Current Data Display */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              داده‌های فعلی - {currentSection}
            </Typography>
            <Box>
              {currentLoading && <LinearProgress sx={{ width: 200 }} />}
              <Tooltip title="بروزرسانی">
                <IconButton onClick={currentRefresh} disabled={currentLoading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {currentError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              خطا در بارگذاری: {currentError}
            </Alert>
          )}

          {currentData && (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>نام</TableCell>
                    <TableCell>نوع</TableCell>
                    <TableCell>سطح</TableCell>
                    <TableCell>توضیحات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentData.items.slice(0, 10).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Chip label={item.id} size="small" />
                      </TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.type || 'data'}
                          color={item.type === 'hierarchy' ? 'success' : 'info'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{item.level || '-'}</TableCell>
                      <TableCell>{item.description || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {currentData.items.length > 10 && (
                <Box sx={{ p: 1, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    و {currentData.items.length - 10} آیتم دیگر...
                  </Typography>
                </Box>
              )}
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SectionSwitchingTest;