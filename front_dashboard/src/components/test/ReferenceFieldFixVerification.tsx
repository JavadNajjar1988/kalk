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
  Divider
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';

// Hooks
import { useReferenceData, useAvailableReferenceCategories } from '@/hooks/useReferenceData';

/**
 * کامپوننت تست برای تأیید رفع مشکلات Reference Fields
 */
const ReferenceFieldFixVerification: React.FC = () => {
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    result: 'pass' | 'fail' | 'info';
    message: string;
  }>>([]);

  const { categories } = useAvailableReferenceCategories();

  // تست داده‌های تقسیمات جغرافیایی
  const {
    data: geoHierarchyData,
    loading: geoHierarchyLoading,
    error: geoHierarchyError
  } = useReferenceData('geographical', 'hierarchy');

  const {
    data: geoDataData,
    loading: geoDataLoading,
    error: geoDataError
  } = useReferenceData('geographical', 'data');

  // تست داده‌های درجات نظامی
  const {
    data: militaryHierarchyData,
    loading: militaryHierarchyLoading,
    error: militaryHierarchyError
  } = useReferenceData('military_ranks', 'hierarchy');

  const {
    data: militaryDataData,
    loading: militaryDataLoading,
    error: militaryDataError
  } = useReferenceData('military_ranks', 'data');

  const runVerificationTests = () => {
    const results: Array<{
      test: string;
      result: 'pass' | 'fail' | 'info';
      message: string;
    }> = [];

    // تست 1: بررسی وجود دسته‌بندی تقسیمات جغرافیایی
    const geoCategory = categories.find(cat => cat.id === 'geographical');
    if (geoCategory) {
      results.push({
        test: 'تقسیمات جغرافیایی - وجود دسته‌بندی',
        result: 'pass',
        message: `دسته‌بندی "${geoCategory.name}" موجود است`
      });
    } else {
      results.push({
        test: 'تقسیمات جغرافیایی - وجود دسته‌بندی',
        result: 'fail',
        message: 'دسته‌بندی تقسیمات جغرافیایی یافت نشد'
      });
    }

    // تست 2: بررسی ۹ سطح سلسله مراتبی جغرافیایی
    if (geoHierarchyData && !geoHierarchyLoading && !geoHierarchyError) {
      const hierarchyLevels = geoHierarchyData.items.length;
      if (hierarchyLevels === 9) {
        results.push({
          test: 'تقسیمات جغرافیایی - ۹ سطح سلسله مراتبی',
          result: 'pass',
          message: `تمام ۹ سطح سلسله مراتبی موجود است: ${geoHierarchyData.items.map(item => item.name).join('، ')}`
        });
      } else {
        results.push({
          test: 'تقسیمات جغرافیایی - ۹ سطح سلسله مراتبی',
          result: 'fail',
          message: `فقط ${hierarchyLevels} سطح یافت شد، باید ۹ سطح باشد`
        });
      }
    } else {
      results.push({
        test: 'تقسیمات جغرافیایی - ۹ سطح سلسله مراتبی',
        result: 'fail',
        message: geoHierarchyError || 'خطا در بارگذاری داده‌ها'
      });
    }

    // تست 3: بررسی داده‌های جغرافیایی
    if (geoDataData && !geoDataLoading && !geoDataError) {
      const dataCount = geoDataData.items.length;
      if (dataCount > 5) {
        results.push({
          test: 'تقسیمات جغرافیایی - داده‌های مکانی',
          result: 'pass',
          message: `${dataCount} مکان جغرافیایی موجود است`
        });
      } else {
        results.push({
          test: 'تقسیمات جغرافیایی - داده‌های مکانی',
          result: 'info',
          message: `${dataCount} مکان موجود است`
        });
      }
    } else {
      results.push({
        test: 'تقسیمات جغرافیایی - داده‌های مکانی',
        result: 'fail',
        message: geoDataError || 'خطا در بارگذاری داده‌ها'
      });
    }

    // تست 4: بررسی درجات نظامی - داده‌ها
    if (militaryDataData && !militaryDataLoading && !militaryDataError) {
      const militaryRankCount = militaryDataData.items.length;
      if (militaryRankCount >= 20) {
        results.push({
          test: 'درجات نظامی - تمام درجات',
          result: 'pass',
          message: `${militaryRankCount} درجه نظامی موجود است شامل تمام نیروها`
        });
      } else {
        results.push({
          test: 'درجات نظامی - تمام درجات',
          result: 'fail',
          message: `فقط ${militaryRankCount} درجه یافت شد، باید بیش از ۲۰ درجه باشد`
        });
      }
    } else {
      results.push({
        test: 'درجات نظامی - تمام درجات',
        result: 'fail',
        message: militaryDataError || 'خطا در بارگذاری داده‌ها'
      });
    }

    // تست 5: بررسی سطوح سلسله مراتبی درجات نظامی
    if (militaryHierarchyData && !militaryHierarchyLoading && !militaryHierarchyError) {
      const hierarchyCount = militaryHierarchyData.items.length;
      if (hierarchyCount >= 3) {
        results.push({
          test: 'درجات نظامی - سطوح سلسله مراتبی',
          result: 'pass',
          message: `${hierarchyCount} سطح سلسله مراتبی موجود است`
        });
      } else {
        results.push({
          test: 'درجات نظامی - سطوح سلسله مراتبی',
          result: 'info',
          message: `${hierarchyCount} سطح سلسله مراتبی موجود است`
        });
      }
    } else {
      results.push({
        test: 'درجات نظامی - سطوح سلسله مراتبی',
        result: 'fail',
        message: militaryHierarchyError || 'خطا در بارگذاری داده‌ها'
      });
    }

    setTestResults(results);
  };

  const getResultIcon = (result: 'pass' | 'fail' | 'info') => {
    switch (result) {
      case 'pass':
        return <CheckIcon color="success" />;
      case 'fail':
        return <ErrorIcon color="error" />;
      case 'info':
        return <InfoIcon color="info" />;
    }
  };

  const getResultColor = (result: 'pass' | 'fail' | 'info') => {
    switch (result) {
      case 'pass':
        return 'success';
      case 'fail':
        return 'error';
      case 'info':
        return 'info';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: 'primary.main' }}>
        🔍 تأیید رفع مشکلات Reference Fields
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          این صفحه مشکلات گزارش شده در Reference Fields را بررسی می‌کند:
          <br />
          1. نمایش ۹ سطح تقسیمات جغرافیایی در بخش hierarchy
          <br />
          2. نمایش تمام درجات نظامی (نه فقط گره‌های اصلی) در بخش data
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* کنترل تست */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                تست‌های تأیید رفع مشکلات
              </Typography>
              <Button
                variant="contained"
                onClick={runVerificationTests}
                color="primary"
              >
                اجرای تست‌ها
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* نتایج تست‌ها */}
        {testResults.length > 0 && (
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  نتایج تست‌ها ({testResults.length})
                </Typography>
                
                <Stack spacing={2}>
                  {testResults.map((result, index) => (
                    <Paper
                      key={index}
                      variant="outlined"
                      sx={{
                        p: 2,
                        backgroundColor: (theme) => 
                          result.result === 'pass' ? theme.palette.success.light + '20' :
                          result.result === 'fail' ? theme.palette.error.light + '20' :
                          theme.palette.info.light + '20'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        {getResultIcon(result.result)}
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {result.test}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {result.message}
                          </Typography>
                        </Box>
                        <Chip
                          label={result.result === 'pass' ? 'موفق' : result.result === 'fail' ? 'ناموفق' : 'اطلاع'}
                          color={getResultColor(result.result)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* نمایش داده‌های نمونه */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                نمونه: ۹ سطح تقسیمات جغرافیایی
              </Typography>
              
              {geoHierarchyLoading && (
                <Typography variant="body2" color="text.secondary">
                  در حال بارگذاری...
                </Typography>
              )}
              
              {geoHierarchyError && (
                <Alert severity="error">{geoHierarchyError}</Alert>
              )}
              
              {geoHierarchyData && (
                <Stack spacing={1}>
                  {geoHierarchyData.items.map((item, index) => (
                    <Chip
                      key={item.id}
                      label={`${index + 1}. ${item.name}`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                نمونه: درجات نظامی (تعداد کل)
              </Typography>
              
              {militaryDataLoading && (
                <Typography variant="body2" color="text.secondary">
                  در حال بارگذاری...
                </Typography>
              )}
              
              {militaryDataError && (
                <Alert severity="error">{militaryDataError}</Alert>
              )}
              
              {militaryDataData && (
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    تعداد کل درجات: {militaryDataData.items.length}
                  </Typography>
                  <Stack spacing={0.5} sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {militaryDataData.items.slice(0, 10).map((item) => (
                      <Chip
                        key={item.id}
                        label={item.name}
                        size="small"
                        variant="outlined"
                        color="secondary"
                      />
                    ))}
                    {militaryDataData.items.length > 10 && (
                      <Typography variant="caption" color="text.secondary">
                        ... و {militaryDataData.items.length - 10} درجه دیگر
                      </Typography>
                    )}
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />
      
      <Alert severity="success">
        <Typography variant="body2">
          ✅ رفع مشکل تقسیمات جغرافیایی: ۹ سطح کامل سلسله مراتبی اضافه شد
          <br />
          ✅ رفع مشکل درجات نظامی: تمام درجات (۲۸ درجه) شامل تمام نیروها اضافه شد
          <br />
          ✅ بهبود ساختار داده‌ها: دسته‌بندی‌ها و توضیحات به‌روزرسانی شد
        </Typography>
      </Alert>
    </Box>
  );
};

export default ReferenceFieldFixVerification;