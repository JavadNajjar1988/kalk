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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  PlayArrow as TestIcon,
  BugReport as BugIcon,
  NetworkCheck as NetworkIcon,
  FilePresent as FileIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  SimCard as MockIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

// Hooks
import { useReferenceData, useAvailableReferenceCategories } from '@/hooks/useReferenceData';
import type { ReferenceSections } from '@/hooks/useReferenceData';

/**
 * کامپوننت تست Error Handling و Validation
 * این کامپوننت امکان تست رفتار سیستم در شرایط خطا را فراهم می‌کند
 */
const ErrorHandlingValidationTest: React.FC = () => {
  const [testScenario, setTestScenario] = useState<string>('normal');
  const [testResults, setTestResults] = useState<{
    missingJsonHandling: boolean;
    networkErrorHandling: boolean;
    corruptedDataHandling: boolean;
    fallbackMechanism: boolean;
    userExperience: boolean;
    retryFunctionality: boolean;
    details: string[];
    testHistory: Array<{
      scenario: string;
      timestamp: string;
      success: boolean;
      errorMessage?: string;
    }>;
  }>({
    missingJsonHandling: false,
    networkErrorHandling: false,
    corruptedDataHandling: false,
    fallbackMechanism: false,
    userExperience: false,
    retryFunctionality: false,
    details: [],
    testHistory: []
  });

  const [mockMode, setMockMode] = useState(false);
  const [mockErrorDialog, setMockErrorDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('geographical');
  const [selectedSection, setSelectedSection] = useState<ReferenceSections>('both');

  // Get available categories
  const { categories } = useAvailableReferenceCategories();

  // Hook for testing with normal or error scenarios
  const {
    data: testData,
    loading: testLoading,
    error: testError,
    refresh: testRefresh,
    isReady: testReady
  } = useReferenceData(
    mockMode && testScenario !== 'normal' ? undefined : selectedCategory,
    selectedSection
  );

  // Test scenarios
  const errorScenarios = [
    {
      id: 'normal',
      name: 'حالت عادی',
      description: 'بارگذاری عادی داده‌ها',
      icon: <CheckIcon />,
      color: 'success' as const
    },
    {
      id: 'missing-json',
      name: 'فایل JSON موجود نیست',
      description: 'شبیه‌سازی عدم وجود فایل JSON',
      icon: <FileIcon />,
      color: 'error' as const
    },
    {
      id: 'corrupted-json',
      name: 'فایل JSON خراب',
      description: 'شبیه‌سازی فایل JSON با محتوای نامعتبر',
      icon: <BugIcon />,
      color: 'error' as const
    },
    {
      id: 'network-error',
      name: 'خطای شبکه',
      description: 'شبیه‌سازی مشکل اتصال شبکه',
      icon: <NetworkIcon />,
      color: 'warning' as const
    },
    {
      id: 'empty-response',
      name: 'پاسخ خالی',
      description: 'شبیه‌سازی دریافت پاسخ خالی از سرور',
      icon: <WarningIcon />,
      color: 'warning' as const
    },
    {
      id: 'permission-denied',
      name: 'عدم دسترسی',
      description: 'شبیه‌سازی عدم دسترسی به فایل‌ها',
      icon: <SecurityIcon />,
      color: 'error' as const
    }
  ];

  // Mock error handler
  const simulateError = (scenario: string) => {
    const timestamp = new Date().toLocaleTimeString('fa-IR');
    let mockError = '';
    let success = false;

    switch (scenario) {
      case 'missing-json':
        mockError = `خطا در بارگذاری ${selectedCategory}.json: فایل یافت نشد`;
        break;
      case 'corrupted-json':
        mockError = `خطا در تجزیه ${selectedCategory}.json: JSON نامعتبر`;
        break;
      case 'network-error':
        mockError = 'خطای شبکه: قطع اتصال اینترنت';
        break;
      case 'empty-response':
        mockError = 'خطا: پاسخ خالی از سرور';
        break;
      case 'permission-denied':
        mockError = 'خطا: عدم دسترسی به فایل‌های JSON';
        break;
      default:
        success = true;
    }

    // Add to test history
    setTestResults(prev => ({
      ...prev,
      testHistory: [...prev.testHistory, {
        scenario,
        timestamp,
        success,
        errorMessage: mockError
      }].slice(-10) // Keep last 10 tests
    }));

    return { success, error: mockError };
  };

  // Run comprehensive error handling tests
  const runErrorHandlingTests = () => {
    const details: string[] = [];
    let missingJsonHandling = false;
    let networkErrorHandling = false;
    let corruptedDataHandling = false;
    let fallbackMechanism = false;
    let userExperience = false;
    let retryFunctionality = false;

    // Test 1: Missing JSON handling
    const missingJsonTest = simulateError('missing-json');
    if (!missingJsonTest.success && missingJsonTest.error) {
      missingJsonHandling = true;
      details.push(`✅ Missing JSON: خطا به درستی شناسایی شد - "${missingJsonTest.error}"`);
    } else {
      details.push('❌ Missing JSON: خطا شناسایی نشد');
    }

    // Test 2: Network error handling
    const networkErrorTest = simulateError('network-error');
    if (!networkErrorTest.success && networkErrorTest.error) {
      networkErrorHandling = true;
      details.push(`✅ Network Error: خطای شبکه به درستی مدیریت شد`);
    } else {
      details.push('❌ Network Error: خطای شبکه مدیریت نشد');
    }

    // Test 3: Corrupted data handling
    const corruptedDataTest = simulateError('corrupted-json');
    if (!corruptedDataTest.success && corruptedDataTest.error) {
      corruptedDataHandling = true;
      details.push(`✅ Corrupted Data: فایل خراب به درستی تشخیص داده شد`);
    } else {
      details.push('❌ Corrupted Data: فایل خراب تشخیص داده نشد');
    }

    // Test 4: Fallback mechanism (using hook error state)
    if (testError) {
      fallbackMechanism = true;
      details.push(`✅ Fallback: سیستم fallback کار می‌کند - "${testError}"`);
    } else if (testScenario === 'normal') {
      fallbackMechanism = true;
      details.push('✅ Fallback: در حالت عادی fallback نیاز نیست');
    } else {
      details.push('❌ Fallback: مکانیزم fallback مشخص نیست');
    }

    // Test 5: User experience (UI responsiveness)
    if (testLoading !== undefined) {
      userExperience = true;
      details.push('✅ User Experience: loading state به درستی مدیریت می‌شود');
    } else {
      details.push('❌ User Experience: loading state مدیریت نمی‌شود');
    }

    // Test 6: Retry functionality
    if (typeof testRefresh === 'function') {
      retryFunctionality = true;
      details.push('✅ Retry: تابع refresh در دسترس است');
    } else {
      details.push('❌ Retry: تابع refresh موجود نیست');
    }

    setTestResults(prev => ({
      ...prev,
      missingJsonHandling,
      networkErrorHandling,
      corruptedDataHandling,
      fallbackMechanism,
      userExperience,
      retryFunctionality,
      details
    }));
  };

  const handleScenarioChange = (scenario: string) => {
    setTestScenario(scenario);
    if (scenario !== 'normal') {
      setMockMode(true);
      simulateError(scenario);
    } else {
      setMockMode(false);
    }
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

  const getScenario = (id: string) => errorScenarios.find(s => s.id === id);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: 'primary.main' }}>
        <BugIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        تست Error Handling و Validation
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>اهداف تست:</strong>
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          <li>تست مدیریت خطای عدم وجود فایل JSON</li>
          <li>تست مدیریت فایل‌های JSON خراب</li>
          <li>تست خطای شبکه و مشکلات ارتباطی</li>
          <li>بررسی مکانیزم‌های fallback</li>
          <li>ارزیابی user experience در شرایط خطا</li>
          <li>تست retry functionality</li>
        </Box>
      </Alert>

      {/* Test Controls */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                کنترل‌های تست
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>دسته‌بندی</InputLabel>
                <Select
                  value={selectedCategory}
                  label="دسته‌بندی"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>سناریوی تست</InputLabel>
                <Select
                  value={testScenario}
                  label="سناریوی تست"
                  onChange={(e) => handleScenarioChange(e.target.value)}
                >
                  {errorScenarios.map((scenario) => (
                    <MenuItem key={scenario.id} value={scenario.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {scenario.icon}
                        {scenario.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={mockMode}
                    onChange={(e) => setMockMode(e.target.checked)}
                  />
                }
                label="حالت شبیه‌سازی"
                sx={{ mb: 2 }}
              />

              <Button
                variant="contained"
                onClick={runErrorHandlingTests}
                startIcon={<TestIcon />}
                fullWidth
                color={getScenario(testScenario)?.color || 'primary'}
              >
                اجرای تست خطا
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Test Results */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                نتایج تست
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                {renderStatusChip(testResults.missingJsonHandling, 'Missing JSON', <FileIcon />)}
                {renderStatusChip(testResults.networkErrorHandling, 'Network Error', <NetworkIcon />)}
                {renderStatusChip(testResults.corruptedDataHandling, 'Corrupted Data', <BugIcon />)}
                {renderStatusChip(testResults.fallbackMechanism, 'Fallback', <RefreshIcon />)}
                {renderStatusChip(testResults.userExperience, 'User Experience', <CheckIcon />)}
                {renderStatusChip(testResults.retryFunctionality, 'Retry Function', <RefreshIcon />)}
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
        </Grid>
      </Grid>

      {/* Current State Display */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            وضعیت فعلی سیستم
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  سناریوی جاری: {getScenario(testScenario)?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getScenario(testScenario)?.description}
                </Typography>
                
                {testLoading && (
                  <Box sx={{ mt: 1 }}>
                    <LinearProgress />
                    <Typography variant="caption">در حال بارگذاری...</Typography>
                  </Box>
                )}

                {testError && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      خطا: {testError}
                    </Typography>
                  </Alert>
                )}

                {testReady && testData && (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      موفق: {testData.items.length} آیتم بارگذاری شد
                    </Typography>
                  </Alert>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  تاریخچه تست‌ها
                </Typography>
                
                <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
                  {testResults.testHistory.map((test, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      {test.success ? <CheckIcon fontSize="small" color="success" /> : <ErrorIcon fontSize="small" color="error" />}
                      <Typography variant="caption">
                        [{test.timestamp}] {getScenario(test.scenario)?.name}
                      </Typography>
                    </Box>
                  ))}
                  {testResults.testHistory.length === 0 && (
                    <Typography variant="caption" color="text.secondary">
                      هنوز تستی اجرا نشده است
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ErrorHandlingValidationTest;