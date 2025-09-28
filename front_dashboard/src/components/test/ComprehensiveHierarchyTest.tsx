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
  TableRow
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Visibility as TestIcon
} from '@mui/icons-material';

// Hooks
import { useReferenceData, useAvailableReferenceCategories } from '@/hooks/useReferenceData';

/**
 * کامپوننت تست جامع برای بررسی سطوح سلسله مراتبی همه دسته‌بندی‌ها
 */
const ComprehensiveHierarchyTest: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, {
    categoryName: string;
    hierarchyCount: number;
    dataCount: number;
    hierarchyItems: Array<{ name: string; level?: number; description?: string }>;
    status: 'loading' | 'success' | 'error';
    error?: string;
  }>>({});
  
  const [isTestingComplete, setIsTestingComplete] = useState(false);
  const { categories } = useAvailableReferenceCategories();

  // تست تمام دسته‌بندی‌ها
  const runComprehensiveTest = async () => {
    setTestResults({});
    setIsTestingComplete(false);

    for (const category of categories) {
      setTestResults(prev => ({
        ...prev,
        [category.id]: {
          categoryName: category.name,
          hierarchyCount: 0,
          dataCount: 0,
          hierarchyItems: [],
          status: 'loading'
        }
      }));
    }

    // شبیه‌سازی تاخیر برای نمایش بهتر
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsTestingComplete(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: 'primary.main' }}>
        <TestIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        تست جامع سطوح سلسله مراتبی همه دسته‌بندی‌ها
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          این تست بررسی می‌کند که آیا همه دسته‌بندی‌ها دارای سطوح سلسله مراتبی کامل و مناسب هستند.
          هر دسته‌بندی باید حداقل ۳ سطح سلسله مراتبی داشته باشد.
        </Typography>
      </Alert>

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          onClick={runComprehensiveTest}
          color="primary"
          size="large"
        >
          شروع تست جامع
        </Button>
      </Box>

      <Grid container spacing={3}>
        {categories.map((category) => (
          <Grid item xs={12} lg={6} key={category.id}>
            <CategoryHierarchyTest 
              categoryId={category.id}
              categoryName={category.name}
              categoryIcon={category.icon}
              isTestActive={isTestingComplete}
              onResult={(result) => {
                setTestResults(prev => ({
                  ...prev,
                  [category.id]: result
                }));
              }}
            />
          </Grid>
        ))}
      </Grid>

      {/* خلاصه نتایج */}
      {isTestingComplete && Object.keys(testResults).length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            خلاصه نتایج تست
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>دسته‌بندی</TableCell>
                  <TableCell align="center">تعداد سطوح سلسله مراتبی</TableCell>
                  <TableCell align="center">تعداد داده‌ها</TableCell>
                  <TableCell align="center">وضعیت</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(testResults).map(([categoryId, result]) => (
                  <TableRow key={categoryId}>
                    <TableCell>{result.categoryName}</TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={result.hierarchyCount}
                        color={result.hierarchyCount >= 3 ? 'success' : 'warning'}
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
                      {result.status === 'success' ? (
                        <CheckIcon color="success" />
                      ) : result.status === 'error' ? (
                        <ErrorIcon color="error" />
                      ) : (
                        <WarningIcon color="warning" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 2 }}>
            <Alert 
              severity={
                Object.values(testResults).every(r => r.status === 'success' && r.hierarchyCount >= 3) 
                  ? 'success' 
                  : 'warning'
              }
            >
              <Typography variant="body2">
                {Object.values(testResults).every(r => r.status === 'success' && r.hierarchyCount >= 3)
                  ? '✅ همه دسته‌بندی‌ها دارای سطوح سلسله مراتبی کامل هستند'
                  : '⚠️ برخی دسته‌بندی‌ها نیاز به بهبود سطوح سلسله مراتبی دارند'
                }
              </Typography>
            </Alert>
          </Box>
        </Box>
      )}
    </Box>
  );
};

/**
 * کامپوننت تست برای یک دسته‌بندی خاص
 */
interface CategoryHierarchyTestProps {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  isTestActive: boolean;
  onResult: (result: {
    categoryName: string;
    hierarchyCount: number;
    dataCount: number;
    hierarchyItems: Array<{ name: string; level?: number; description?: string }>;
    status: 'loading' | 'success' | 'error';
    error?: string;
  }) => void;
}

const CategoryHierarchyTest: React.FC<CategoryHierarchyTestProps> = ({
  categoryId,
  categoryName,
  categoryIcon,
  isTestActive,
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

      const status = hierarchyError || dataError ? 'error' : 'success';
      const error = hierarchyError || dataError || undefined;

      onResult({
        categoryName,
        hierarchyCount,
        dataCount,
        hierarchyItems,
        status,
        error
      });
    }
  }, [isTestActive, hierarchyLoading, dataLoading, hierarchyData, dataData, hierarchyError, dataError, categoryName, onResult]);

  const getStatusColor = () => {
    if (hierarchyLoading || dataLoading) return 'info';
    if (hierarchyError || dataError) return 'error';
    
    const hierarchyCount = hierarchyData?.items.length || 0;
    return hierarchyCount >= 3 ? 'success' : 'warning';
  };

  const getStatusText = () => {
    if (hierarchyLoading || dataLoading) return 'در حال بررسی...';
    if (hierarchyError || dataError) return 'خطا در بارگذاری';
    
    const hierarchyCount = hierarchyData?.items.length || 0;
    return hierarchyCount >= 3 ? 'سطوح کامل' : 'نیاز به بهبود';
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="h6">
            {categoryIcon} {categoryName}
          </Typography>
          <Chip 
            label={getStatusText()}
            color={getStatusColor()}
            size="small"
            variant="outlined"
          />
        </Box>

        {(hierarchyLoading || dataLoading) && (
          <LinearProgress sx={{ mb: 2 }} />
        )}

        {(hierarchyError || dataError) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {hierarchyError || dataError}
          </Alert>
        )}

        {isTestActive && hierarchyData && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              سطوح سلسله مراتبی ({hierarchyData.items.length}):
            </Typography>
            <Stack spacing={0.5} sx={{ mb: 2 }}>
              {hierarchyData.items.map((item, index) => (
                <Paper key={item.id} variant="outlined" sx={{ p: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {index + 1}. {item.name}
                  </Typography>
                  {item.description && (
                    <Typography variant="caption" color="text.secondary">
                      {item.description}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Stack>

            {dataData && (
              <Typography variant="caption" color="text.secondary">
                تعداد کل داده‌ها: {dataData.items.length}
              </Typography>
            )}
          </Box>
        )}

        {!isTestActive && (
          <Typography variant="body2" color="text.secondary">
            برای شروع تست، دکمه "شروع تست جامع" را کلیک کنید
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default ComprehensiveHierarchyTest;