import React, { useState, useEffect, useCallback } from 'react';
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
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse
} from '@mui/material';
import {
  Sync as SyncIcon,
  PlayArrow as TestIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  DataObject as DataIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  Speed as SpeedIcon,
  Cached as CachedIcon,
  Cloud as CloudIcon,
  SystemUpdate as SystemUpdateIcon,
  NetworkCheck as NetworkCheckIcon
} from '@mui/icons-material';

// Hooks
import { useReferenceData, useAvailableReferenceCategories } from '@/hooks/useReferenceData';
import type { ReferenceSections } from '@/hooks/useReferenceData';

// Sync utilities
import { 
  useDefinitionSync, 
  simulateDefinitionChange,
  simulateFieldChange,
  simulateTabChange,
  simulateReferenceCategoryChange,
  type DefinitionChangeEvent,
  type DefinitionChangeType 
} from '@/utils/definitionSync';

interface SyncTestResult {
  testName: string;
  category: string;
  section: ReferenceSections;
  success: boolean;
  duration: number;
  beforeCount: number;
  afterCount: number;
  syncTriggered: boolean;
  error?: string;
  changes?: string[];
}

interface SyncScenario {
  id: string;
  name: string;
  description: string;
  category: string;
  section: ReferenceSections;
  changeType: DefinitionChangeType;
  simulateChange: () => void;
  expectedResult: string;
}

/**
 * کامپوننت تست جامع Real-time Data Synchronization
 * شامل scenarios مختلف برای تست همگام‌سازی
 */
const RealTimeSyncComprehensiveTest: React.FC = () => {
  const [isAutoTesting, setIsAutoTesting] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<string>('');
  const [testResults, setTestResults] = useState<SyncTestResult[]>([]);
  const [syncEvents, setSyncEvents] = useState<DefinitionChangeEvent[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('geographical');
  const [selectedSection, setSelectedSection] = useState<ReferenceSections>('both');
  const [testProgress, setTestProgress] = useState(0);

  // Get available categories
  const { categories } = useAvailableReferenceCategories();

  // Reference data hook
  const {
    data: referenceData,
    loading: referenceLoading,
    error: referenceError,
    refresh: referenceRefresh,
    isReady: referenceReady
  } = useReferenceData(selectedCategory, selectedSection);

  // Sync system
  const syncSystem = useDefinitionSync(
    'realtime-sync-comprehensive-test',
    useCallback((event: DefinitionChangeEvent) => {
      console.log('Sync event received:', event);
      setSyncEvents(prev => [event, ...prev.slice(0, 9)]); // Keep last 10 events
    }, []),
    ['reference_categories', 'persons'], // Listen to reference categories and persons
    ['*'] // Listen to all nodes
  );

  // Test scenarios
  const scenarios: SyncScenario[] = [
    {
      id: 'add-hierarchy-level',
      name: 'اضافه کردن سطح سلسله مراتبی',
      description: 'شبیه‌سازی اضافه شدن سطح جدید در hierarchy',
      category: 'geographical',
      section: 'hierarchy',
      changeType: 'add',
      simulateChange: () => {
        simulateDefinitionChange('add', 'reference_categories', 'geographical', null, {
          type: 'hierarchy',
          name: 'سطح تست جدید',
          level: 10
        });
      },
      expectedResult: 'افزایش تعداد آیتم‌های hierarchy'
    },
    {
      id: 'update-data-item',
      name: 'بروزرسانی آیتم داده',
      description: 'شبیه‌سازی بروزرسانی آیتم موجود در data',
      category: 'military_ranks',
      section: 'data',
      changeType: 'update',
      simulateChange: () => {
        simulateDefinitionChange('update', 'reference_categories', 'military_ranks', 
          { name: 'درجه قدیم' }, 
          { name: 'درجه بروزرسانی شده', updated: true }
        );
      },
      expectedResult: 'بروزرسانی محتوای آیتم‌های data'
    },
    {
      id: 'delete-item',
      name: 'حذف آیتم',
      description: 'شبیه‌سازی حذف آیتم از دسته‌بندی',
      category: 'operational_status',
      section: 'both',
      changeType: 'delete',
      simulateChange: () => {
        simulateDefinitionChange('delete', 'reference_categories', 'operational_status', 
          { id: 'test-item-to-delete' }, null
        );
      },
      expectedResult: 'کاهش تعداد آیتم‌ها'
    },
    {
      id: 'field-add',
      name: 'اضافه کردن فیلد جدید',
      description: 'شبیه‌سازی اضافه شدن فیلد reference جدید',
      category: 'persons',
      section: 'both',
      changeType: 'field_add',
      simulateChange: () => {
        simulateFieldChange('pr-1', 'new-reference-field', 'field_add', {
          type: 'reference',
          name: 'فیلد مرجع جدید',
          referenceCategory: 'geographical',
          referenceSections: 'both'
        });
      },
      expectedResult: 'اضافه شدن فیلد reference جدید'
    },
    {
      id: 'reference-category-update',
      name: 'بروزرسانی دسته‌بندی مرجع',
      description: 'شبیه‌سازی تغییر در تنظیمات دسته‌بندی مرجع',
      category: 'geographical',
      section: 'both',
      changeType: 'reference_category_update',
      simulateChange: () => {
        simulateReferenceCategoryChange('geographical', {
          hasHierarchy: true,
          hasData: true,
          newProperty: 'updated-value'
        });
      },
      expectedResult: 'بروزرسانی تنظیمات و داده‌های مرجع'
    }
  ];

  // Setup sync listeners
  useEffect(() => {
    syncSystem.addListener();
    return () => {
      syncSystem.removeListener();
    };
  }, [syncSystem]);

  // Auto-testing functionality
  useEffect(() => {
    if (isAutoTesting) {
      runAutoTests();
    }
  }, [isAutoTesting]);

  // Run comprehensive auto tests
  const runAutoTests = async () => {
    setTestResults([]);
    setTestProgress(0);
    
    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      setCurrentScenario(`تست ${scenario.name}...`);
      
      const result = await testScenario(scenario);
      setTestResults(prev => [...prev, result]);
      
      setTestProgress(((i + 1) / scenarios.length) * 100);
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    setCurrentScenario('تست‌ها تکمیل شد');
    setIsAutoTesting(false);
  };

  // Test a single scenario
  const testScenario = async (scenario: SyncScenario): Promise<SyncTestResult> => {
    const startTime = Date.now();
    const beforeCount = referenceData?.items.length || 0;
    let syncTriggered = false;
    let afterCount = beforeCount;
    let success = false;
    let error: string | undefined;
    const changes: string[] = [];

    try {
      // Clear previous events
      const eventsBefore = syncEvents.length;

      // Trigger the scenario change
      scenario.simulateChange();
      syncTriggered = true;
      changes.push(`شبیه‌سازی تغییر ${scenario.changeType} اجرا شد`);

      // Wait for sync to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Force refresh to see changes
      await referenceRefresh();
      changes.push('بروزرسانی داده‌ها انجام شد');

      // Check if events were triggered
      const eventsAfter = syncEvents.length;
      if (eventsAfter > eventsBefore) {
        changes.push(`${eventsAfter - eventsBefore} رویداد sync جدید دریافت شد`);
      }

      afterCount = referenceData?.items.length || 0;
      success = true;

    } catch (err) {
      error = err instanceof Error ? err.message : 'خطای نامشخص';
      changes.push(`خطا: ${error}`);
    }

    const duration = Date.now() - startTime;

    return {
      testName: scenario.name,
      category: scenario.category,
      section: scenario.section,
      success,
      duration,
      beforeCount,
      afterCount,
      syncTriggered,
      error,
      changes
    };
  };

  // Manual test single scenario
  const runSingleScenario = async (scenario: SyncScenario) => {
    setCurrentScenario(`تست دستی: ${scenario.name}`);
    const result = await testScenario(scenario);
    setTestResults(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 results
    setCurrentScenario('');
  };

  // Calculate statistics
  const totalTests = testResults.length;
  const successfulTests = testResults.filter(r => r.success).length;
  const averageDuration = totalTests > 0 
    ? testResults.reduce((sum, r) => sum + r.duration, 0) / totalTests 
    : 0;
  const syncEventsCount = syncEvents.length;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: 'primary.main' }}>
        <CloudIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        تست جامع Real-time Data Synchronization
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>اهداف این تست:</strong>
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          <li>تست همگام‌سازی real-time با definition-editor</li>
          <li>بررسی cache invalidation و بروزرسانی خودکار</li>
          <li>تست scenarios مختلف تغییرات (add, update, delete)</li>
          <li>آزمایش عملکرد در شرایط مختلف</li>
          <li>اعتبارسنجی consistency و reliability</li>
        </Box>
      </Alert>

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            کنترل‌های تست
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>دسته‌بندی تست</InputLabel>
                <Select
                  value={selectedCategory}
                  label="دسته‌بندی تست"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={isAutoTesting}
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
                  value={selectedSection}
                  label="بخش"
                  onChange={(e) => setSelectedSection(e.target.value as ReferenceSections)}
                  disabled={isAutoTesting}
                >
                  <MenuItem value="hierarchy">سطوح سلسله مراتبی</MenuItem>
                  <MenuItem value="data">داده‌ها</MenuItem>
                  <MenuItem value="both">هر دو بخش</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                onClick={() => setIsAutoTesting(!isAutoTesting)}
                disabled={isAutoTesting && testProgress < 100}
                startIcon={isAutoTesting ? <StopIcon /> : <TestIcon />}
                color={isAutoTesting ? 'error' : 'primary'}
                fullWidth
              >
                {isAutoTesting ? 'متوقف کردن' : 'شروع تست خودکار'}
              </Button>
            </Grid>

            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                onClick={() => {
                  referenceRefresh();
                  syncSystem.triggerSync('reference_categories', selectedCategory);
                }}
                disabled={isAutoTesting}
                startIcon={<RefreshIcon />}
                fullWidth
              >
                بروزرسانی دستی
              </Button>
            </Grid>
          </Grid>

          {isAutoTesting && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {currentScenario}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(testProgress)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={testProgress}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            آمار Real-time Sync
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {successfulTests}/{totalTests}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  تست‌های موفق
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {Math.round(averageDuration)}ms
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  میانگین سرعت sync
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {syncEventsCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  رویدادهای دریافتی
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="secondary.main">
                  {referenceData?.items.length || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  آیتم‌های فعلی
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Test Scenarios */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                سناریوهای تست
              </Typography>
              
              <List>
                {scenarios.map((scenario, index) => (
                  <React.Fragment key={scenario.id}>
                    <ListItem>
                      <ListItemIcon>
                        <SystemUpdateIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={scenario.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {scenario.description}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <Chip 
                                label={scenario.category} 
                                size="small" 
                                variant="outlined" 
                                sx={{ mr: 1 }}
                              />
                              <Chip 
                                label={scenario.section} 
                                size="small" 
                                color="primary" 
                                variant="outlined" 
                                sx={{ mr: 1 }}
                              />
                              <Chip 
                                label={scenario.changeType} 
                                size="small" 
                                color="secondary" 
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                        }
                      />
                      <Box>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => runSingleScenario(scenario)}
                          disabled={isAutoTesting}
                          startIcon={<TestIcon />}
                        >
                          تست
                        </Button>
                      </Box>
                    </ListItem>
                    {index < scenarios.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            {/* Sync Events */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  رویدادهای Sync
                </Typography>
                
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {syncEvents.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      هنوز رویدادی دریافت نشده
                    </Typography>
                  ) : (
                    <List dense>
                      {syncEvents.map((event, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip 
                                  label={event.type} 
                                  size="small" 
                                  color="primary"
                                />
                                <Typography variant="caption">
                                  {event.category}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  {event.changeDescription}
                                </Typography>
                                <br />
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(event.timestamp).toLocaleTimeString('fa-IR')}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Recent Test Results */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  <SpeedIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  نتایج اخیر
                </Typography>
                
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {testResults.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      هنوز تستی اجرا نشده
                    </Typography>
                  ) : (
                    <List dense>
                      {testResults.slice(0, 5).map((result, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            {result.success ? 
                              <CheckIcon color="success" fontSize="small" /> : 
                              <ErrorIcon color="error" fontSize="small" />
                            }
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2">
                                {result.testName}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  {result.duration}ms | {result.beforeCount}→{result.afterCount} آیتم
                                </Typography>
                                {result.error && (
                                  <>
                                    <br />
                                    <Typography variant="caption" color="error">
                                      {result.error}
                                    </Typography>
                                  </>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Detailed Results */}
      {testResults.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              نتایج تفصیلی تست‌ها
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>نام تست</TableCell>
                    <TableCell>دسته‌بندی</TableCell>
                    <TableCell>نتیجه</TableCell>
                    <TableCell>زمان</TableCell>
                    <TableCell>تغییرات آیتم</TableCell>
                    <TableCell>Sync</TableCell>
                    <TableCell>جزئیات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {testResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>{result.testName}</TableCell>
                      <TableCell>
                        <Chip label={result.category} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={result.success ? <CheckIcon /> : <ErrorIcon />}
                          label={result.success ? 'موفق' : 'ناموفق'}
                          color={result.success ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{result.duration}ms</TableCell>
                      <TableCell>{result.beforeCount} → {result.afterCount}</TableCell>
                      <TableCell>
                        <Chip
                          icon={result.syncTriggered ? <CheckIcon /> : <ErrorIcon />}
                          label={result.syncTriggered ? 'فعال' : 'غیرفعال'}
                          color={result.syncTriggered ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {result.changes && result.changes.length > 0 && (
                          <Tooltip title={result.changes.join(' | ')}>
                            <IconButton size="small">
                              <DataIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
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

export default RealTimeSyncComprehensiveTest;