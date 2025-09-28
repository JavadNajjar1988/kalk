import React, { useState, useEffect, useRef } from 'react';
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
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Memory as MemoryIcon,
  CachedOutlined as CacheIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  DataObject as DataIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Schedule as ScheduleIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Assessment as AnalyticsIcon
} from '@mui/icons-material';

// Hooks
import { useReferenceData, useAvailableReferenceCategories } from '@/hooks/useReferenceData';
import type { ReferenceSections } from '@/hooks/useReferenceData';

interface CacheMetrics {
  timestamp: string;
  category: string;
  section: string;
  operation: 'load' | 'refresh' | 'invalidate' | 'clear';
  duration: number;
  dataSize: number;
  cacheHit: boolean;
  memoryUsage?: number;
  success: boolean;
  error?: string;
}

interface MemorySnapshot {
  timestamp: string;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  activeConnections: number;
  cacheEntries: number;
}

/**
 * کامپوننت تست Cache Invalidation و Memory Management
 * این کامپوننت عملکرد cache، memory leaks و invalidation را تست می‌کند
 */
const CacheInvalidationTest: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [cacheMetrics, setCacheMetrics] = useState<CacheMetrics[]>([]);
  const [memorySnapshots, setMemorySnapshots] = useState<MemorySnapshot[]>([]);
  const [testCategories, setTestCategories] = useState<string[]>(['geographical', 'military_ranks']);
  const [stressTestRunning, setStressTestRunning] = useState(false);
  const [customCacheDialog, setCustomCacheDialog] = useState(false);
  
  const monitoringIntervalRef = useRef<NodeJS.Timeout>();
  const stressTestRef = useRef<NodeJS.Timeout>();

  // Get available categories
  const { categories } = useAvailableReferenceCategories();

  // Multiple hooks for testing cache behavior
  const connections = testCategories.map(categoryId => ({
    categoryId,
    hook: useReferenceData(categoryId, 'both')
  }));

  // Memory monitoring
  const takeMemorySnapshot = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const snapshot: MemorySnapshot = {
        timestamp: new Date().toLocaleTimeString('fa-IR'),
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        activeConnections: connections.length,
        cacheEntries: calculateCacheEntries()
      };
      
      setMemorySnapshots(prev => [...prev.slice(-19), snapshot]);
      return snapshot;
    }
    return null;
  };

  // Calculate estimated cache entries
  const calculateCacheEntries = () => {
    return connections.reduce((total, conn) => {
      return total + (conn.hook.data?.items.length || 0);
    }, 0);
  };

  // Record cache metrics
  const recordCacheMetric = (
    category: string,
    section: string,
    operation: CacheMetrics['operation'],
    duration: number,
    dataSize: number,
    cacheHit: boolean,
    success: boolean,
    error?: string
  ) => {
    const metric: CacheMetrics = {
      timestamp: new Date().toLocaleTimeString('fa-IR'),
      category,
      section,
      operation,
      duration,
      dataSize,
      cacheHit,
      success,
      error,
      memoryUsage: ('memory' in performance) ? (performance as any).memory.usedJSHeapSize : undefined
    };

    setCacheMetrics(prev => [...prev.slice(-29), metric]);
  };

  // Start monitoring
  const startMonitoring = () => {
    setIsMonitoring(true);
    
    monitoringIntervalRef.current = setInterval(() => {
      takeMemorySnapshot();
    }, 2000);
  };

  // Stop monitoring
  const stopMonitoring = () => {
    setIsMonitoring(false);
    
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
    }
  };

  // Test cache invalidation
  const testCacheInvalidation = async (categoryId: string) => {
    const startTime = Date.now();
    const connection = connections.find(c => c.categoryId === categoryId);
    
    if (!connection) return;

    try {
      // First load (should be fresh)
      await connection.hook.refresh();
      const firstLoadTime = Date.now() - startTime;
      
      recordCacheMetric(
        categoryId,
        'both',
        'load',
        firstLoadTime,
        connection.hook.data?.items.length || 0,
        false, // First load is never cache hit
        true
      );

      // Second load (might be cached)
      const secondStartTime = Date.now();
      await connection.hook.refresh();
      const secondLoadTime = Date.now() - secondStartTime;
      
      recordCacheMetric(
        categoryId,
        'both',
        'refresh',
        secondLoadTime,
        connection.hook.data?.items.length || 0,
        secondLoadTime < firstLoadTime * 0.5, // Assume cache hit if significantly faster
        true
      );

      takeMemorySnapshot();

    } catch (error) {
      recordCacheMetric(
        categoryId,
        'both',
        'load',
        Date.now() - startTime,
        0,
        false,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  // Stress test multiple categories
  const runStressTest = async () => {
    setStressTestRunning(true);
    
    const stressCycles = 10;
    let currentCycle = 0;

    const runCycle = async () => {
      if (currentCycle >= stressCycles) {
        setStressTestRunning(false);
        return;
      }

      // Test all categories simultaneously
      const promises = testCategories.map(categoryId => testCacheInvalidation(categoryId));
      await Promise.all(promises);

      currentCycle++;
      
      // Continue next cycle
      stressTestRef.current = setTimeout(runCycle, 1000);
    };

    runCycle();
  };

  // Stop stress test
  const stopStressTest = () => {
    setStressTestRunning(false);
    if (stressTestRef.current) {
      clearTimeout(stressTestRef.current);
    }
  };

  // Clear all caches (simulation)
  const clearAllCaches = () => {
    connections.forEach(connection => {
      // Force refresh all connections
      connection.hook.refresh();
    });

    recordCacheMetric(
      'all',
      'all',
      'clear',
      0,
      0,
      false,
      true
    );

    takeMemorySnapshot();
  };

  // Add test category
  const addTestCategory = (categoryId: string) => {
    if (!testCategories.includes(categoryId)) {
      setTestCategories(prev => [...prev, categoryId]);
    }
  };

  // Remove test category
  const removeTestCategory = (categoryId: string) => {
    setTestCategories(prev => prev.filter(id => id !== categoryId));
  };

  // Calculate memory usage trends
  const getMemoryTrend = () => {
    if (memorySnapshots.length < 2) return 'stable';
    
    const recent = memorySnapshots.slice(-5);
    const growth = recent[recent.length - 1].usedJSHeapSize - recent[0].usedJSHeapSize;
    
    if (growth > 5 * 1024 * 1024) return 'increasing'; // 5MB increase
    if (growth < -1 * 1024 * 1024) return 'decreasing'; // 1MB decrease
    return 'stable';
  };

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
      stopStressTest();
    };
  }, []);

  const memoryTrend = getMemoryTrend();
  const averageLoadTime = cacheMetrics.length > 0 
    ? cacheMetrics.reduce((sum, m) => sum + m.duration, 0) / cacheMetrics.length 
    : 0;
  const cacheHitRate = cacheMetrics.length > 0 
    ? (cacheMetrics.filter(m => m.cacheHit).length / cacheMetrics.length) * 100 
    : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: 'primary.main' }}>
        <MemoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        تست Cache Invalidation و Memory Management
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>اهداف تست:</strong>
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          <li>بررسی عملکرد cache و invalidation mechanisms</li>
          <li>تشخیص memory leaks در اتصالات طولانی مدت</li>
          <li>ارزیابی performance cache hit ratio</li>
          <li>تست stress با multiple connections همزمان</li>
          <li>نظارت بر memory usage در real-time</li>
          <li>تست garbage collection effectiveness</li>
        </Box>
      </Alert>

      {/* Control Panel */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                کنترل‌های تست
              </Typography>
              
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isMonitoring}
                      onChange={(e) => e.target.checked ? startMonitoring() : stopMonitoring()}
                    />
                  }
                  label="نظارت بر Memory"
                />

                <Button
                  variant="contained"
                  onClick={stressTestRunning ? stopStressTest : runStressTest}
                  startIcon={stressTestRunning ? <ErrorIcon /> : <SpeedIcon />}
                  color={stressTestRunning ? 'error' : 'primary'}
                  fullWidth
                >
                  {stressTestRunning ? 'توقف Stress Test' : 'شروع Stress Test'}
                </Button>

                <Button
                  variant="outlined"
                  onClick={clearAllCaches}
                  startIcon={<DeleteIcon />}
                  fullWidth
                >
                  پاکسازی تمام Cache
                </Button>

                <Button
                  variant="outlined"
                  onClick={takeMemorySnapshot}
                  startIcon={<CameraIcon />}
                  fullWidth
                >
                  Memory Snapshot
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                دسته‌بندی‌های تست
              </Typography>
              
              <Stack spacing={1} sx={{ mb: 2 }}>
                {testCategories.map(categoryId => (
                  <Box key={categoryId} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={categories.find(c => c.id === categoryId)?.name || categoryId}
                      onDelete={() => removeTestCategory(categoryId)}
                      size="small"
                      color="primary"
                    />
                    <Button
                      size="small"
                      onClick={() => testCacheInvalidation(categoryId)}
                      startIcon={<RefreshIcon />}
                      variant="outlined"
                    >
                      تست
                    </Button>
                  </Box>
                ))}
              </Stack>

              <Button
                variant="outlined"
                onClick={() => setCustomCacheDialog(true)}
                fullWidth
                size="small"
              >
                افزودن دسته‌بندی
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                آمار کلی
              </Typography>
              
              <Stack spacing={1}>
                <Chip
                  icon={<StorageIcon />}
                  label={`Cache Hit Rate: ${cacheHitRate.toFixed(1)}%`}
                  color={cacheHitRate > 70 ? 'success' : cacheHitRate > 40 ? 'warning' : 'error'}
                  variant="outlined"
                />
                
                <Chip
                  icon={<SpeedIcon />}
                  label={`میانگین Load Time: ${averageLoadTime.toFixed(0)}ms`}
                  color={averageLoadTime < 500 ? 'success' : averageLoadTime < 1000 ? 'warning' : 'error'}
                  variant="outlined"
                />
                
                <Chip
                  icon={<MemoryIcon />}
                  label={`Memory Trend: ${memoryTrend === 'stable' ? 'پایدار' : memoryTrend === 'increasing' ? 'افزایشی' : 'کاهشی'}`}
                  color={memoryTrend === 'stable' ? 'success' : memoryTrend === 'increasing' ? 'error' : 'info'}
                  variant="outlined"
                />
                
                <Chip
                  icon={<DataIcon />}
                  label={`اتصالات فعال: ${connections.length}`}
                  variant="outlined"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Memory Usage Chart */}
      {memorySnapshots.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              نظارت بر Memory Usage
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>زمان</TableCell>
                    <TableCell>Used Heap</TableCell>
                    <TableCell>Total Heap</TableCell>
                    <TableCell>Cache Entries</TableCell>
                    <TableCell>اتصالات</TableCell>
                    <TableCell>وضعیت</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {memorySnapshots.slice(-10).map((snapshot, index) => (
                    <TableRow key={index}>
                      <TableCell>{snapshot.timestamp}</TableCell>
                      <TableCell>{formatBytes(snapshot.usedJSHeapSize)}</TableCell>
                      <TableCell>{formatBytes(snapshot.totalJSHeapSize)}</TableCell>
                      <TableCell>{snapshot.cacheEntries}</TableCell>
                      <TableCell>{snapshot.activeConnections}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={snapshot.usedJSHeapSize / snapshot.totalJSHeapSize > 0.8 ? 'بالا' : 'عادی'}
                          color={snapshot.usedJSHeapSize / snapshot.totalJSHeapSize > 0.8 ? 'warning' : 'success'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Cache Metrics */}
      {cacheMetrics.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              متریک‌های Cache
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>زمان</TableCell>
                    <TableCell>دسته‌بندی</TableCell>
                    <TableCell>عملیات</TableCell>
                    <TableCell>مدت زمان</TableCell>
                    <TableCell>اندازه داده</TableCell>
                    <TableCell>Cache Hit</TableCell>
                    <TableCell>وضعیت</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cacheMetrics.slice(-15).map((metric, index) => (
                    <TableRow key={index}>
                      <TableCell>{metric.timestamp}</TableCell>
                      <TableCell>{metric.category}</TableCell>
                      <TableCell>
                        <Chip size="small" label={metric.operation} variant="outlined" />
                      </TableCell>
                      <TableCell>{metric.duration}ms</TableCell>
                      <TableCell>{metric.dataSize} آیتم</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={metric.cacheHit ? 'Hit' : 'Miss'}
                          color={metric.cacheHit ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={metric.success ? 'موفق' : 'خطا'}
                          color={metric.success ? 'success' : 'error'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Add Category Dialog */}
      <Dialog open={customCacheDialog} onClose={() => setCustomCacheDialog(false)}>
        <DialogTitle>افزودن دسته‌بندی برای تست</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {categories
              .filter(cat => !testCategories.includes(cat.id))
              .map(category => (
                <Button
                  key={category.id}
                  variant="outlined"
                  onClick={() => {
                    addTestCategory(category.id);
                    setCustomCacheDialog(false);
                  }}
                  startIcon={<span>{category.icon}</span>}
                  fullWidth
                >
                  {category.name}
                </Button>
              ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomCacheDialog(false)}>انصراف</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Add missing Camera icon
const CameraIcon = () => <AnalyticsIcon />;

export default CacheInvalidationTest;