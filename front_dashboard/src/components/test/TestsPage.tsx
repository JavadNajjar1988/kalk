import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Stack,
  Alert,
  Chip
} from '@mui/material';
import {
  PlayArrow as TestIcon,
  Link as LinkIcon,
  CheckCircle as CheckIcon,
  DataObject as DataIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/**
 * صفحه کلی تست‌ها
 */
const TestsPage: React.FC = () => {
  const navigate = useNavigate();

  const testPages = [
    {
      id: 'comprehensive-section-switching',
      title: 'تست جامع Section Switching - تمام دسته‌بندی‌ها',
      description: 'تست خودکار تمام ۱۵ دسته‌بندی و تمام sections موجود با اندازه‌گیری performance',
      icon: <TestIcon />,
      path: '/dashboard/test/comprehensive-section-switching',
      status: 'جدید - جامع',
      color: 'error'
    },
    {
      id: 'section-switching',
      title: 'تست Section Switching Functionality',
      description: 'تست تعاملی تغییر بین sections مختلف (hierarchy ↔ data ↔ both) و بررسی consistency',
      icon: <TestIcon />,
      path: '/dashboard/test/section-switching',
      status: 'موجود - تعاملی',
      color: 'primary'
    },
    {
      id: 'error-handling',
      title: 'تست Error Handling و Validation',
      description: 'تست رفتار سیستم در شرایط خطا (missing JSON, corrupted data, network errors)',
      icon: <WarningIcon />,
      path: '/dashboard/test/error-handling',
      status: 'جدید - ضروری',
      color: 'warning'
    },
    {
      id: 'realtime-sync-advanced',
      title: 'تست پیشرفته Real-time Synchronization',
      description: 'تست جامع همگام‌سازی real-time با definition-editor و cache invalidation',
      icon: <CheckIcon />,
      path: '/dashboard/test/realtime-sync-advanced',
      status: 'جدید - پیشرفته',
      color: 'info'
    },
    {
      id: 'realtime-sync-comprehensive',
      title: 'تست جامع Real-time Sync با Scenarios',
      description: 'تست شامل scenarios مختلف تغییرات و بررسی کامل سیستم همگام‌سازی',
      icon: <CheckIcon />,
      path: '/dashboard/test/realtime-sync-comprehensive',
      status: 'جدید - جامع',
      color: 'success'
    },
    {
      id: 'reference-category-selector-comprehensive',
      title: 'تست جامع ReferenceCategorySelector',
      description: 'تست integration کامل با useAvailableReferenceCategories و اعتبارسنجی sections',
      icon: <CheckIcon />,
      path: '/dashboard/test/reference-category-selector-comprehensive',
      status: 'جدید - تکمیلی',
      color: 'success'
    },
    {
      id: 'section-based-reference',
      title: 'تست سیستم Reference Fields بر اساس بخش‌ها',
      description: 'تست جامع سیستم جدید Reference Fields با قابلیت انتخاب بخش و فیلتر دسته‌بندی‌ها',
      icon: <LinkIcon />,
      path: '/dashboard/test/section-based-reference',
      status: 'موجود - اولویت‌دار',
      color: 'primary'
    },
    {
      id: 'final-integration',
      title: 'تست جامع Integration - End-to-End',
      description: 'تست کامل workflow ایجاد و استفاده از فیلدهای Reference و performance testing',
      icon: <CheckIcon />,
      path: '/dashboard/test/final-integration',
      status: 'جدید - نهایی',
      color: 'success'
    },
    {
      id: 'all-categories-hierarchy',
      title: 'تست جامع سطوح سلسله مراتبی همه دسته‌بندی‌ها',
      description: 'بررسی تأیید اینکه همه دسته‌بندی‌ها دارای سطوح سلسله مراتبی کامل و مناسب هستند',
      icon: <CheckIcon />,
      path: '/dashboard/test/all-categories-hierarchy',
      status: 'جدید',
      color: 'success'
    },
    {
      id: 'hierarchical-selector',
      title: 'تست انتخابگر سلسله مراتبی',
      description: 'تست عملکرد کامپوننت HierarchicalSelector',
      icon: <DataIcon />,
      path: '/dashboard/test/hierarchical-selector',
      status: 'موجود',
      color: 'primary'
    },
    {
      id: 'real-time-sync',
      title: 'تست همگام‌سازی Real-time',
      description: 'تست قابلیت همگام‌سازی Real-time داده‌ها',
      icon: <LinkIcon />,
      path: '/dashboard/test/real-time-sync',
      status: 'موجود',
      color: 'secondary'
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: 'primary.main' }}>
        <TestIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        صفحه تست‌های سیستم
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          این صفحه شامل تمام تست‌های سیستم است که برای بررسی عملکرد صحیح قابلیت‌های مختلف طراحی شده‌اند.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {testPages.map((test) => (
          <Grid item xs={12} md={6} lg={4} key={test.id}>
            <Card 
              variant="outlined" 
              sx={{ 
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 2
                }
              }}
            >
              <CardContent>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {test.icon}
                      <Typography variant="h6" component="div">
                        {test.title}
                      </Typography>
                    </Box>
                    <Chip 
                      label={test.status}
                      color={test.color as any}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    {test.description}
                  </Typography>
                  
                  <Button
                    variant="contained"
                    color={test.color as any}
                    fullWidth
                    onClick={() => navigate(test.path)}
                    startIcon={<TestIcon />}
                  >
                    اجرای تست
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Alert severity="error">
          <Typography variant="body2">
            <strong>تست‌های ضروری:</strong>
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2, mt: 1 }}>
            <li>تست Section Switching - برای تأیید عملکرد switch بین بخش‌های مختلف</li>
            <li>تست سیستم Reference Fields - برای تأیید عملکرد صحیح پیاده‌سازی جدید</li>
          </Box>
        </Alert>
      </Box>
    </Box>
  );
};

export default TestsPage;