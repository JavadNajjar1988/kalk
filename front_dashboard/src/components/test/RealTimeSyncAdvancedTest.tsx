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
  AccordionDetails
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
  Notifications as NotificationsIcon
} from '@mui/icons-material';

// Hooks
import { useReferenceData, useAvailableReferenceCategories } from '@/hooks/useReferenceData';
import type { ReferenceSections } from '@/hooks/useReferenceData';
import ReferenceFieldRenderer from '@/modules/definition-editor/components/fields/ReferenceFieldRenderer';

/**
 * کامپوننت تست پیشرفته Real-time Data Synchronization
 * این کامپوننت تست جامع همگام‌سازی real-time را برای Reference Fields فراهم می‌کند
 */
const RealTimeSyncAdvancedTest: React.FC = () => {
  const [isAutoSync, setIsAutoSync] = useState(false);
  const [syncInterval, setSyncInterval] = useState(5000); // 5 seconds
  const [testCategory, setTestCategory] = useState('geographical');
  const [testSection, setTestSection] = useState<ReferenceSections>('both');
  const [syncHistory, setSyncHistory] = useState<Array<{
    timestamp: string;
    category: string;
    section: string;
    itemCount: number;
    duration: number;
    success: boolean;
    changes?: string[];
  }>>([]);
  const [simultaneousConnections, setSimultaneousConnections] = useState<{[key: string]: any}>({});

  // Get available categories
  const { categories } = useAvailableReferenceCategories();

  // Primary test hook
  const {
    data: primaryData,
    loading: primaryLoading,
    error: primaryError,
    refresh: primaryRefresh,
    isReady: primaryReady
  } = useReferenceData(testCategory, testSection);

  // Secondary hooks for testing multiple connections
  const {
    data: geographicalData,
    loading: geoLoading,
    refresh: geoRefresh
  } = useReferenceData('geographical', 'both');

  const {
    data: militaryRanksData,
    loading: ranksLoading,
    refresh: ranksRefresh
  } = useReferenceData('military_ranks', 'both');

  const {
    data: operationalStatusData,
    loading: opStatusLoading,
    refresh: opStatusRefresh
  } = useReferenceData('operational_status', 'hierarchy');

  // Auto-sync mechanism
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isAutoSync) {
      intervalId = setInterval(() => {
        performSyncTest();
      }, syncInterval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAutoSync, syncInterval, testCategory, testSection]);

  // Perform comprehensive sync test
  const performSyncTest = useCallback(async () => {
    const startTime = Date.now();
    const timestamp = new Date().toLocaleTimeString('fa-IR');

    try {
      // Refresh all connections simultaneously
      const refreshPromises = [
        primaryRefresh(),
        geoRefresh(),
        ranksRefresh(),
        opStatusRefresh()
      ];

      await Promise.all(refreshPromises);

      const duration = Date.now() - startTime;
      const itemCount = primaryData?.items.length || 0;

      // Detect changes (simplified simulation)
      const changes: string[] = [];
      if (Math.random() > 0.7) {
        changes.push('شبیه‌سازی: تغییر در داده‌های سلسله مراتبی');
      }
      if (Math.random() > 0.8) {
        changes.push('شبیه‌سازی: اضافه شدن آیتم جدید');
      }
      if (Math.random() > 0.9) {
        changes.push('شبیه‌سازی: حذف آیتم');
      }

      setSyncHistory(prev => [...prev.slice(-9), {
        timestamp,
        category: testCategory,
        section: testSection,
        itemCount,
        duration,
        success: true,
        changes: changes.length > 0 ? changes : undefined
      }]);

    } catch (error) {
      const duration = Date.now() - startTime;
      setSyncHistory(prev => [...prev.slice(-9), {
        timestamp,
        category: testCategory,
        section: testSection,
        itemCount: 0,
        duration,
        success: false,
        changes: [`خطا: ${error}`]
      }]);
    }
  }, [testCategory, testSection, primaryData, primaryRefresh, geoRefresh, ranksRefresh, opStatusRefresh]);

  // Test multiple simultaneous connections
  const testSimultaneousConnections = () => {
    const connections = {
      geographical: { loading: geoLoading, data: geographicalData },
      military_ranks: { loading: ranksLoading, data: militaryRanksData },
      operational_status: { loading: opStatusLoading, data: operationalStatusData }
    };

    setSimultaneousConnections(connections);
  };

  // Simulate definition-editor changes
  const simulateDefinitionChange = (changeType: 'add' | 'update' | 'delete') => {
    const timestamp = new Date().toLocaleTimeString('fa-IR');
    let changeDescription = '';

    switch (changeType) {
      case 'add':
        changeDescription = 'شبیه‌سازی: اضافه کردن گره جدید در definition-editor';
        break;
      case 'update':
        changeDescription = 'شبیه‌سازی: بروزرسانی گره موجود در definition-editor';
        break;
      case 'delete':
        changeDescription = 'شبیه‌سازی: حذف گره از definition-editor';
        break;
    }

    // Trigger refresh to simulate sync
    primaryRefresh();

    setSyncHistory(prev => [...prev.slice(-9), {
      timestamp,
      category: testCategory,
      section: testSection,
      itemCount: primaryData?.items.length || 0,
      duration: Math.random() * 500 + 100, // Simulate response time
      success: true,
      changes: [changeDescription]
    }]);
  };

  const testField = {
    id: 'test-reference-field',
    name: 'فیلد تست همگام‌سازی',
    englishName: 'Test Reference Field',
    type: 'reference' as const,
    isRequired: false,
    order: 1,
    referenceCategory: testCategory,
    referenceSections: testSection
  };

  const renderConnectionStatus = (category: string, loading: boolean, data: any) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
      <Chip
        size="small"
        label={category}
        color="primary"
        variant="outlined"
      />
      {loading ? (
        <Chip size="small" label="در حال بارگذاری..." color="warning" />
      ) : data ? (
        <Chip size="small" label={`${data.items?.length || 0} آیتم`} color="success" />
      ) : (
        <Chip size="small" label="خطا" color="error" />
      )}
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: 'primary.main' }}>
        <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        تست پیشرفته Real-time Data Synchronization
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>اهداف تست:</strong>
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          <li>تست همگام‌سازی خودکار با تغییرات definition-editor</li>
          <li>بررسی cache invalidation و refresh mechanism</li>
          <li>تست اتصالات همزمان متعدد</li>
          <li>ارزیابی performance در شرایط real-time</li>
          <li>تست auto-refresh در ReferenceFieldRenderer</li>
          <li>شبیه‌سازی سناریوهای تغییر داده</li>
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
                <InputLabel>دسته‌بندی تست</InputLabel>
                <Select
                  value={testCategory}
                  label="دسته‌بندی تست"
                  onChange={(e) => setTestCategory(e.target.value)}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>بخش تست</InputLabel>
                <Select
                  value={testSection}
                  label="بخش تست"
                  onChange={(e) => setTestSection(e.target.value as ReferenceSections)}
                >
                  <MenuItem value="hierarchy">سطوح سلسله مراتبی</MenuItem>
                  <MenuItem value="data">داده‌ها</MenuItem>
                  <MenuItem value="both">هر دو بخش</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={isAutoSync}
                    onChange={(e) => setIsAutoSync(e.target.checked)}
                  />
                }
                label="همگام‌سازی خودکار"
                sx={{ mb: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>فاصله زمانی (میلی‌ثانیه)</InputLabel>
                <Select
                  value={syncInterval}
                  label="فاصله زمانی"
                  onChange={(e) => setSyncInterval(Number(e.target.value))}
                  disabled={isAutoSync}
                >
                  <MenuItem value={2000}>2 ثانیه</MenuItem>
                  <MenuItem value={5000}>5 ثانیه</MenuItem>
                  <MenuItem value={10000}>10 ثانیه</MenuItem>
                  <MenuItem value={30000}>30 ثانیه</MenuItem>
                </Select>
              </FormControl>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  onClick={performSyncTest}
                  startIcon={<SyncIcon />}
                  disabled={isAutoSync}
                  size="small"
                >
                  تست دستی
                </Button>
                <Button
                  variant="outlined"
                  onClick={testSimultaneousConnections}
                  startIcon={<DataIcon />}
                  size="small"
                >
                  تست همزمان
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Real-time Field Renderer Test */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                تست ReferenceFieldRenderer Real-time
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <ReferenceFieldRenderer
                  field={testField}
                  value={null}
                  onChange={(value) => console.log('Field value changed:', value)}
                  fullWidth
                />
              </Paper>

              {primaryLoading && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress />
                  <Typography variant="caption">در حال همگام‌سازی...</Typography>
                </Box>
              )}

              {primaryError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  خطا در همگام‌سازی: {primaryError}
                </Alert>
              )}

              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => simulateDefinitionChange('add')}
                  startIcon={<CheckIcon />}
                >
                  شبیه‌سازی اضافه
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => simulateDefinitionChange('update')}
                  startIcon={<RefreshIcon />}
                >
                  شبیه‌سازی تغییر
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => simulateDefinitionChange('delete')}
                  startIcon={<ErrorIcon />}
                >
                  شبیه‌سازی حذف
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sync History */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            تاریخچه همگام‌سازی
          </Typography>

          {syncHistory.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>زمان</TableCell>
                    <TableCell>دسته‌بندی</TableCell>
                    <TableCell>بخش</TableCell>
                    <TableCell>تعداد آیتم</TableCell>
                    <TableCell>مدت زمان</TableCell>
                    <TableCell>وضعیت</TableCell>
                    <TableCell>تغییرات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {syncHistory.slice(-10).map((sync, index) => (
                    <TableRow key={index}>
                      <TableCell>{sync.timestamp}</TableCell>
                      <TableCell>{sync.category}</TableCell>
                      <TableCell>{sync.section}</TableCell>
                      <TableCell>{sync.itemCount}</TableCell>
                      <TableCell>{sync.duration}ms</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={sync.success ? 'موفق' : 'خطا'}
                          color={sync.success ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>
                        {sync.changes && sync.changes.length > 0 ? (
                          <Tooltip title={sync.changes.join(', ')}>
                            <Chip
                              size="small"
                              label={`${sync.changes.length} تغییر`}
                              color="info"
                            />
                          </Tooltip>
                        ) : (
                          <Chip size="small" label="بدون تغییر" variant="outlined" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              هنوز تست همگام‌سازی‌ای اجرا نشده است
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Simultaneous Connections Status */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            وضعیت اتصالات همزمان
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  اتصالات فعال
                </Typography>
                {renderConnectionStatus('geographical', geoLoading, geographicalData)}
                {renderConnectionStatus('military_ranks', ranksLoading, militaryRanksData)}
                {renderConnectionStatus('operational_status', opStatusLoading, operationalStatusData)}
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  آمار performance
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Chip
                    size="small"
                    label={`میانگین مدت زمان: ${syncHistory.length > 0 ? Math.round(syncHistory.reduce((acc, s) => acc + s.duration, 0) / syncHistory.length) : 0}ms`}
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label={`نرخ موفقیت: ${syncHistory.length > 0 ? Math.round((syncHistory.filter(s => s.success).length / syncHistory.length) * 100) : 0}%`}
                    color={syncHistory.filter(s => s.success).length === syncHistory.length ? 'success' : 'warning'}
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label={`تعداد کل تست‌ها: ${syncHistory.length}`}
                    variant="outlined"
                  />
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  وضعیت فعلی سیستم
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Chip
                    size="small"
                    icon={isAutoSync ? <SyncIcon /> : <StopIcon />}
                    label={isAutoSync ? 'همگام‌سازی فعال' : 'همگام‌سازی غیرفعال'}
                    color={isAutoSync ? 'success' : 'default'}
                  />
                  <Chip
                    size="small"
                    icon={<ScheduleIcon />}
                    label={`فاصله: ${syncInterval / 1000}s`}
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    icon={primaryReady ? <CheckIcon /> : <ErrorIcon />}
                    label={primaryReady ? 'آماده' : 'در حال بارگذاری'}
                    color={primaryReady ? 'success' : 'warning'}
                    variant="outlined"
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RealTimeSyncAdvancedTest;