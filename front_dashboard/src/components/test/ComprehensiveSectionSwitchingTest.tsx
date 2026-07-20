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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse
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
  Schedule as TimerIcon,
  Assessment as AnalyticsIcon,
  Category as CategoryIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';

// Hooks
import { useReferenceData, useAvailableReferenceCategories } from '@/hooks/useReferenceData';
import type { ReferenceSections } from '@/hooks/useReferenceData';

interface CategoryTestResult {
  categoryId: string;
  categoryName: string;
  sections: {
    [key in ReferenceSections]?: {
      tested: boolean;
      success: boolean;
      dataCount: number;
      loadTime: number;
      error?: string;
    };
  };
  overallScore: number;
  details: string[];
}

/**
 * کامپوننت تست جامع Section Switching برای تمام دسته‌بندی‌ها
 * این کامپوننت تمام ۱۵ دسته‌بندی و تمام sections موجود را تست می‌کند
 */
const ComprehensiveSectionSwitchingTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [testResults, setTestResults] = useState<CategoryTestResult[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [autoRunEnabled, setAutoRunEnabled] = useState(false);
  const [detailedView, setDetailedView] = useState(false);

  // Get available categories
  const { categories, getAvailableSections } = useAvailableReferenceCategories();

  // تابع تست یک دسته‌بندی در یک بخش خاص
  const testCategorySection = async (
    categoryId: string, 
    section: ReferenceSections
  ): Promise<{
    success: boolean;
    dataCount: number;
    loadTime: number;
    error?: string;
  }> => {
    const startTime = Date.now();
    
    try {
      // استفاده از hook به صورت داینامیک (در عمل باید از state management استفاده کنیم)
      // اینجا برای سادگی، شبیه‌سازی می‌کنیم
      const loadCategoryData = async (catId: string): Promise<any> => {
        const fileName = {
          'geographical': 'geographical',
          'military_ranks': 'military_ranks',
          'mission_type': 'mission_type',
          'operational_status': 'operational_status',
          'operational_environment': 'operational_environment',
          'time_definitions': 'time_definitions',
          'coding_classification': 'coding_classification',
          'force_type': 'force_type',
          'organizational_affiliation': 'organizational_affiliation',
          'specialty_training': 'specialty_training',
          'threat_type': 'threat_type',
          'info_classification': 'info_classification',
          'logistics_status': 'logistics_status',
          'weather': 'weather',
          'logistics': 'logistics'
        }[catId];
        
        if (!fileName) {
          throw new Error(`Unknown category: ${catId}`);
        }
        
        const module = await import(`@/modules/definition-editor/data/json/${fileName}.json`);
        return module.default || module;
      };

      const jsonData = await loadCategoryData(categoryId);
      const loadTime = Date.now() - startTime;
      
      // استخراج داده‌ها بر اساس بخش
      let itemCount = 0;
      
      switch (section) {
        case 'hierarchy':
          itemCount = jsonData.levels ? jsonData.levels.length : 0;
          break;
        case 'data':
          itemCount = jsonData.nodes ? jsonData.nodes.length : 0;
          break;
        case 'both':
          const hierarchyCount = jsonData.levels ? jsonData.levels.length : 0;
          const dataCount = jsonData.nodes ? jsonData.nodes.length : 0;
          itemCount = hierarchyCount + dataCount;
          break;
      }

      return {
        success: true,
        dataCount: itemCount,
        loadTime,
      };
      
    } catch (error) {
      const loadTime = Date.now() - startTime;
      return {
        success: false,
        dataCount: 0,
        loadTime,
        error: error instanceof Error ? error.message : 'خطای نامشخص'
      };
    }
  };

  // تابع اجرای تست جامع
  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    setOverallProgress(0);
    
    const results: CategoryTestResult[] = [];
    let totalTests = 0;
    let completedTests = 0;

    // محاسبه تعداد کل تست‌ها
    categories.forEach(category => {
      const availableSections = getAvailableSections(category.id);
      totalTests += availableSections.length;
    });

    for (const category of categories) {
      setCurrentTest(`تست دسته‌بندی: ${category.name}`);
      
      const categoryResult: CategoryTestResult = {
        categoryId: category.id,
        categoryName: category.name,
        sections: {},
        overallScore: 0,
        details: []
      };

      const availableSections = getAvailableSections(category.id);
      let successfulSections = 0;

      for (const section of availableSections as ReferenceSections[]) {
        setCurrentTest(`تست ${category.name} - بخش ${section}`);
        
        const sectionResult = await testCategorySection(category.id, section);
        categoryResult.sections[section] = {
          tested: true,
          success: sectionResult.success,
          dataCount: sectionResult.dataCount,
          loadTime: sectionResult.loadTime,
          error: sectionResult.error
        };

        if (sectionResult.success) {
          successfulSections++;
          categoryResult.details.push(
            `✅ ${section}: ${sectionResult.dataCount} آیتم در ${sectionResult.loadTime}ms`
          );
        } else {
          categoryResult.details.push(
            `❌ ${section}: ${sectionResult.error} (${sectionResult.loadTime}ms)`
          );
        }

        completedTests++;
        setOverallProgress((completedTests / totalTests) * 100);

        // کمی تأخیر برای نمایش بهتر
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // محاسبه نمره کلی
      categoryResult.overallScore = availableSections.length > 0 
        ? (successfulSections / availableSections.length) * 100 
        : 0;

      results.push(categoryResult);
      setTestResults([...results]);
    }

    setCurrentTest('تست‌ها تکمیل شد');
    setIsRunning(false);
  };

  // تابع دریافت رنگ بر اساس نمره
  const getScoreColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 80) return 'success';
    if (score >= 50) return 'warning';
    return 'error';
  };

  // تابع دریافت آیکون بر اساس بخش
  const getSectionIcon = (section: ReferenceSections) => {
    switch (section) {
      case 'hierarchy': return <HierarchyIcon fontSize="small" />;
      case 'data': return <DataIcon fontSize="small" />;
      case 'both': return <BothIcon fontSize="small" />;
    }
  };

  // تابع دریافت نام فارسی بخش
  const getSectionName = (section: ReferenceSections) => {
    switch (section) {
      case 'hierarchy': return 'سطوح سلسله مراتبی';
      case 'data': return 'داده‌ها';
      case 'both': return 'هر دو بخش';
    }
  };

  // محاسبه آمار کلی
  const totalCategories = categories.length;
  const testedCategories = testResults.length;
  const successfulCategories = testResults.filter(r => r.overallScore >= 80).length;
  const averageScore = testResults.length > 0 
    ? testResults.reduce((sum, r) => sum + r.overallScore, 0) / testResults.length 
    : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: 'primary.main' }}>
        <AnalyticsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        تست جامع Section Switching - تمام دسته‌بندی‌ها
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>این تست شامل:</strong>
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          <li>تست تمام ۱۵ دسته‌بندی موجود</li>
          <li>تست تمام sections در هر دسته‌بندی (hierarchy, data, both)</li>
          <li>اندازه‌گیری performance و سرعت بارگذاری</li>
          <li>بررسی تعداد آیتم‌های بارگذاری شده</li>
          <li>تشخیص و گزارش خطاها</li>
        </Box>
      </Alert>

      {/* کنترل‌های تست */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              کنترل‌های تست
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={detailedView}
                    onChange={(e) => setDetailedView(e.target.checked)}
                  />
                }
                label="نمایش جزئیات"
              />
              <Button
                variant="contained"
                onClick={runComprehensiveTest}
                disabled={isRunning}
                startIcon={isRunning ? <TimerIcon /> : <TestIcon />}
              >
                {isRunning ? 'در حال اجرا...' : 'شروع تست جامع'}
              </Button>
            </Box>
          </Box>

          {isRunning && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {currentTest}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(overallProgress)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={overallProgress}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* آمار کلی */}
      {testResults.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              آمار کلی
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {testedCategories}/{totalCategories}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    دسته‌بندی تست شده
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {successfulCategories}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    موفق (نمره ≥ 80%)
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color={getScoreColor(averageScore)}>
                    {Math.round(averageScore)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    میانگین نمره
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {testResults.reduce((sum, r) => sum + Object.keys(r.sections).length, 0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    تست انجام شده
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* نتایج تست‌ها */}
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
                    <TableCell>Sections</TableCell>
                    <TableCell>نمره کلی</TableCell>
                    <TableCell>عملکرد</TableCell>
                    {detailedView && <TableCell>جزئیات</TableCell>}
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
                          {Object.entries(result.sections).map(([section, data]) => (
                            <Tooltip 
                              key={section}
                              title={`${getSectionName(section as ReferenceSections)}: ${
                                data?.success ? 
                                `${data.dataCount} آیتم، ${data.loadTime}ms` : 
                                data?.error || 'خطا'
                              }`}
                            >
                              <Chip
                                icon={getSectionIcon(section as ReferenceSections)}
                                label={section}
                                size="small"
                                color={data?.success ? 'success' : 'error'}
                                variant="outlined"
                              />
                            </Tooltip>
                          ))}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${Math.round(result.overallScore)}%`}
                          color={getScoreColor(result.overallScore)}
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell>
                        {result.overallScore >= 80 ? (
                          <Chip icon={<CheckIcon />} label="عالی" color="success" size="small" />
                        ) : result.overallScore >= 50 ? (
                          <Chip icon={<WarningIcon />} label="قابل بهبود" color="warning" size="small" />
                        ) : (
                          <Chip icon={<ErrorIcon />} label="نیاز به بررسی" color="error" size="small" />
                        )}
                      </TableCell>
                      {detailedView && (
                        <TableCell>
                          <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography variant="caption">
                                {result.details.length} جزئیات
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <List dense>
                                {result.details.map((detail, index) => (
                                  <ListItem key={index}>
                                    <ListItemText
                                      primary={
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                          {detail}
                                        </Typography>
                                      }
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            </AccordionDetails>
                          </Accordion>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {!isRunning && testResults.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <CategoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              آماده برای شروع تست
            </Typography>
            <Typography variant="body2" color="text.secondary">
              روی "شروع تست جامع" کلیک کنید تا تست تمام دسته‌بندی‌ها آغاز شود
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ComprehensiveSectionSwitchingTest;