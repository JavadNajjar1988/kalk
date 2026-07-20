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
  Collapse,
  IconButton
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PlayArrow as TestIcon,
  DataObject as DataIcon
} from '@mui/icons-material';

// Hooks
import { useReferenceData, useAvailableReferenceCategories } from '@/hooks/useReferenceData';

/**
 * کامپوننت تست جامع برای تأیید عملکرد سطوح سلسله مراتبی همه دسته‌بندی‌ها
 */
const AllCategoriesHierarchyVerification: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, {
    categoryName: string;
    categoryIcon: string;
    hierarchyCount: number;
    dataCount: number;
    hierarchyItems: Array<{ id: string; name: string; level?: number; description?: string }>;
    dataItems: Array<{ id: string; name: string; category?: string }>;
    status: 'not_tested' | 'testing' | 'success' | 'warning' | 'error';
    error?: string;
    expectedMinHierarchy: number;
  }>>({});
  
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [isTestingAll, setIsTestingAll] = useState(false);
  const { categories } = useAvailableReferenceCategories();

  // تعریف حداقل سطوح مورد انتظار برای هر دسته‌بندی
  const expectedHierarchyLevels = {
    'geographical': 9,
    'military_ranks': 6,
    'equipment': 6,
    'ammunition': 5,
    'military_units': 10,
    'persons': 7
  };

  // تست تمام دسته‌بندی‌ها
  const runAllTests = async () => {
    setIsTestingAll(true);
    
    // ایجاد نتایج اولیه
    const initialResults: typeof testResults = {};
    categories.forEach(category => {
      initialResults[category.id] = {
        categoryName: category.name,
        categoryIcon: category.icon,
        hierarchyCount: 0,
        dataCount: 0,
        hierarchyItems: [],
        dataItems: [],
        status: 'testing',
        expectedMinHierarchy: expectedHierarchyLevels[category.id as keyof typeof expectedHierarchyLevels] || 3
      };
    });
    setTestResults(initialResults);

    // شبیه‌سازی تاخیر برای نمایش بهتر
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsTestingAll(false);
  };

  const toggleExpand = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const getOverallStatus = () => {
    const results = Object.values(testResults);
    if (results.length === 0) return 'not_tested';
    if (results.some(r => r.status === 'testing')) return 'testing';
    if (results.every(r => r.status === 'success')) return 'success';
    if (results.some(r => r.status === 'error')) return 'error';
    return 'warning';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'testing': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckIcon color="success" />;
      case 'error': return <ErrorIcon color="error" />;
      case 'warning': return <WarningIcon color="warning" />;
      default: return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: 'primary.main' }}>
        <TestIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        تأیید سطوح سلسله مراتبی همه دسته‌بندی‌ها
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>هدف تست:</strong> تأیید اینکه همه دسته‌بندی‌ها دارای سطوح سلسله مراتبی کامل و مناسب هستند.
        </Typography>
        <Typography variant="body2">
          حداقل سطوح مورد انتظار: 
          جغرافیایی (۹)، درجات نظامی (۶)، تجهیزات (۶)، مهمات (۵)، یگان‌ها (۱۰)، اشخاص (۷)
        </Typography>
      </Alert>

      {/* کنترل‌های تست */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              کنترل تست ({categories.length} دسته‌بندی)
            </Typography>
            <Button
              variant="contained"
              onClick={runAllTests}
              disabled={isTestingAll}
              startIcon={<TestIcon />}
              color="primary"
            >
              {isTestingAll ? 'در حال تست...' : 'تست همه دسته‌بندی‌ها'}
            </Button>
          </Box>
          
          {isTestingAll && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                در حال بررسی سطوح سلسله مراتبی همه دسته‌بندی‌ها...
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* خلاصه نتایج */}
      {Object.keys(testResults).length > 0 && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              خلاصه نتایج
            </Typography>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>دسته‌بندی</TableCell>
                    <TableCell align="center">سطوح سلسله مراتبی</TableCell>
                    <TableCell align="center">تعداد داده‌ها</TableCell>
                    <TableCell align="center">وضعیت</TableCell>
                    <TableCell align="center">جزئیات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(testResults).map(([categoryId, result]) => (
                    <TableRow key={categoryId}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">
                            {result.categoryIcon} {result.categoryName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={`${result.hierarchyCount}/${result.expectedMinHierarchy}`}
                          color={result.hierarchyCount >= result.expectedMinHierarchy ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={result.dataCount}
                          color={result.dataCount >= 5 ? 'success' : 'info'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        {getStatusIcon(result.status)}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => toggleExpand(categoryId)}
                        >
                          {expandedCategories[categoryId] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* نمایش وضعیت کلی */}
            <Box sx={{ mt: 2 }}>
              <Alert 
                severity={
                  getOverallStatus() === 'success' ? 'success' :
                  getOverallStatus() === 'error' ? 'error' : 'warning'
                }
              >
                <Typography variant="body2">
                  {getOverallStatus() === 'success' && 
                    '✅ همه دسته‌بندی‌ها دارای سطوح سلسله مراتبی کامل و مناسب هستند!'
                  }
                  {getOverallStatus() === 'warning' && 
                    '⚠️ برخی دسته‌بندی‌ها نیاز به بهبود سطوح سلسله مراتبی دارند'
                  }
                  {getOverallStatus() === 'error' && 
                    '❌ مشکلات جدی در سطوح سلسله مراتبی برخی دسته‌بندی‌ها'
                  }
                  {getOverallStatus() === 'not_tested' && 
                    'هنوز تستی انجام نشده است'
                  }
                </Typography>
              </Alert>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* جزئیات هر دسته‌بندی */}
      <Grid container spacing={3}>
        {categories.map((category) => (
          <Grid item xs={12} key={category.id}>
            <CategoryDetailedTest 
              categoryId={category.id}
              categoryName={category.name}
              categoryIcon={category.icon}
              isExpanded={expandedCategories[category.id] || false}
              isTestActive={Object.keys(testResults).length > 0}
              expectedMinHierarchy={expectedHierarchyLevels[category.id as keyof typeof expectedHierarchyLevels] || 3}
              onResult={(result) => {
                setTestResults(prev => ({
                  ...prev,
                  [category.id]: {
                    ...prev[category.id],
                    ...result
                  }
                }));
              }}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

/**
 * کامپوننت تست تفصیلی برای یک دسته‌بندی
 */
interface CategoryDetailedTestProps {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  isExpanded: boolean;
  isTestActive: boolean;
  expectedMinHierarchy: number;
  onResult: (result: {
    hierarchyCount: number;
    dataCount: number;
    hierarchyItems: Array<{ id: string; name: string; level?: number; description?: string }>;
    dataItems: Array<{ id: string; name: string; category?: string }>;
    status: 'success' | 'warning' | 'error';
    error?: string;
  }) => void;
}

const CategoryDetailedTest: React.FC<CategoryDetailedTestProps> = ({
  categoryId,
  categoryName,
  categoryIcon,
  isExpanded,
  isTestActive,
  expectedMinHierarchy,
  onResult
}) => {
  // تست داده‌های hierarchy
  const {
    data: hierarchyData,
    loading: hierarchyLoading,
    error: hierarchyError
  } = useReferenceData(categoryId, 'hierarchy');

  // تست داده‌های data
  const {
    data: dataData,
    loading: dataLoading,
    error: dataError
  } = useReferenceData(categoryId, 'data');

  useEffect(() => {
    if (isTestActive && !hierarchyLoading && !dataLoading) {
      const hierarchyCount = hierarchyData?.items.length || 0;
      const dataCount = dataData?.items.length || 0;
      const hierarchyItems = hierarchyData?.items || [];
      const dataItems = dataData?.items || [];

      let status: 'success' | 'warning' | 'error' = 'success';
      let error: string | undefined;

      if (hierarchyError || dataError) {
        status = 'error';
        error = hierarchyError || dataError || undefined;
      } else if (hierarchyCount < expectedMinHierarchy) {
        status = 'warning';
        error = `تعداد سطوح سلسله مراتبی (${hierarchyCount}) کمتر از حد مورد انتظار (${expectedMinHierarchy}) است`;
      } else if (dataCount < 5) {
        status = 'warning';
        error = `تعداد داده‌ها (${dataCount}) کم است`;
      }

      onResult({
        hierarchyCount,
        dataCount,
        hierarchyItems,
        dataItems,
        status,
        error
      });
    }
  }, [isTestActive, hierarchyLoading, dataLoading, hierarchyData, dataData, hierarchyError, dataError, expectedMinHierarchy, onResult]);

  if (!isExpanded) return null;

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {categoryIcon} {categoryName} - جزئیات تست
        </Typography>

        <Grid container spacing={2}>
          {/* سطوح سلسله مراتبی */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                <DataIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 'small' }} />
                سطوح سلسله مراتبی ({hierarchyData?.items.length || 0})
              </Typography>
              
              {hierarchyLoading && <LinearProgress sx={{ mb: 1 }} />}
              
              {hierarchyError && (
                <Alert severity="error" sx={{ mb: 1 }}>
                  {hierarchyError}
                </Alert>
              )}
              
              {hierarchyData && (
                <Stack spacing={1} sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {hierarchyData.items.map((item, index) => (
                    <Paper key={item.id} variant="outlined" sx={{ p: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {index + 1}. {item.name}
                      </Typography>
                      {item.englishName && (
                        <Typography variant="caption" color="text.secondary">
                          {item.englishName}
                        </Typography>
                      )}
                      {item.description && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {item.description}
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Stack>
              )}
            </Paper>
          </Grid>

          {/* داده‌های اصلی */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                <DataIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 'small' }} />
                داده‌های اصلی ({dataData?.items.length || 0})
              </Typography>
              
              {dataLoading && <LinearProgress sx={{ mb: 1 }} />}
              
              {dataError && (
                <Alert severity="error" sx={{ mb: 1 }}>
                  {dataError}
                </Alert>
              )}
              
              {dataData && (
                <Stack spacing={0.5} sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {dataData.items.slice(0, 10).map((item) => (
                    <Chip
                      key={item.id}
                      label={item.name}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                  {dataData.items.length > 10 && (
                    <Typography variant="caption" color="text.secondary">
                      ... و {dataData.items.length - 10} آیتم دیگر
                    </Typography>
                  )}
                </Stack>
              )}
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default AllCategoriesHierarchyVerification;