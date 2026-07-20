// Performance Monitor Component
// کامپوننت نظارت بر عملکرد

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Collapse,
  Alert,
  Chip,
  Grid,
  LinearProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Switch,
  FormControlLabel,
  alpha
} from '@mui/material';
import {
  Speed as SpeedIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Memory as MemoryIcon,
  Timer as TimerIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

import { 
  clearAllCaches, 
  fieldValidationCache, 
  fieldRenderCache, 
  hierarchicalDataCache 
} from '../../utils/memoizationUtils';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  componentRenderCount: number;
  slowRenders: number;
  totalFields: number;
  visibleFields: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  threshold?: number; // Warning threshold for render time (ms)
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  threshold = 16, // 60fps = 16.67ms per frame
  onMetricsUpdate
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(enabled);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    componentRenderCount: 0,
    slowRenders: 0,
    totalFields: 0,
    visibleFields: 0
  });
  const [warnings, setWarnings] = useState<string[]>([]);

  // Performance observation
  const measurePerformance = useCallback(() => {
    if (!isMonitoring) return;

    // Measure memory usage
    const memory = (performance as any).memory;
    const memoryUsage = memory ? (memory.usedJSHeapSize / 1024 / 1024) : 0;

    // Calculate cache hit rates
    const validationCacheSize = fieldValidationCache.size();
    const renderCacheSize = fieldRenderCache.size();
    const hierarchicalCacheSize = hierarchicalDataCache.size();
    const totalCacheSize = validationCacheSize + renderCacheSize + hierarchicalCacheSize;
    
    // Estimate cache hit rate (simplified)
    const cacheHitRate = totalCacheSize > 0 ? Math.min(totalCacheSize / 100, 1) * 100 : 0;

    // Get render timing from Performance API
    const renderEntries = performance.getEntriesByType('measure');
    const avgRenderTime = renderEntries.length > 0 
      ? renderEntries.reduce((sum, entry) => sum + entry.duration, 0) / renderEntries.length 
      : 0;

    const newMetrics: PerformanceMetrics = {
      renderTime: avgRenderTime,
      memoryUsage,
      cacheHitRate,
      componentRenderCount: renderEntries.length,
      slowRenders: renderEntries.filter(entry => entry.duration > threshold).length,
      totalFields: 0, // Will be updated by parent components
      visibleFields: 0 // Will be updated by parent components
    };

    setMetrics(newMetrics);
    onMetricsUpdate?.(newMetrics);

    // Generate warnings
    const newWarnings: string[] = [];
    if (newMetrics.renderTime > threshold) {
      newWarnings.push(`Slow render detected: ${newMetrics.renderTime.toFixed(2)}ms`);
    }
    if (newMetrics.memoryUsage > 50) {
      newWarnings.push(`High memory usage: ${newMetrics.memoryUsage.toFixed(1)}MB`);
    }
    if (newMetrics.slowRenders > 5) {
      newWarnings.push(`${newMetrics.slowRenders} slow renders detected`);
    }
    if (newMetrics.cacheHitRate < 30) {
      newWarnings.push(`Low cache hit rate: ${newMetrics.cacheHitRate.toFixed(1)}%`);
    }

    setWarnings(newWarnings);
  }, [isMonitoring, threshold, onMetricsUpdate]);

  // Update metrics periodically
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(measurePerformance, 2000);
    return () => clearInterval(interval);
  }, [isMonitoring, measurePerformance]);

  // Initial measurement
  useEffect(() => {
    if (isMonitoring) {
      measurePerformance();
    }
  }, [isMonitoring, measurePerformance]);

  const handleClearCaches = useCallback(() => {
    clearAllCaches();
    setWarnings(prev => [...prev, 'All caches cleared']);
    setTimeout(() => {
      setWarnings(prev => prev.filter(w => w !== 'All caches cleared'));
    }, 3000);
  }, []);

  const getPerformanceLevel = (renderTime: number) => {
    if (renderTime < 8) return { level: 'excellent', color: 'success' as const };
    if (renderTime < 16) return { level: 'good', color: 'info' as const };
    if (renderTime < 32) return { level: 'warning', color: 'warning' as const };
    return { level: 'poor', color: 'error' as const };
  };

  const performanceLevel = getPerformanceLevel(metrics.renderTime);

  if (!enabled && !isMonitoring) {
    return null;
  }

  return (
    <Card 
      sx={{ 
        position: 'fixed',
        top: 100,
        right: 16,
        width: isExpanded ? 400 : 200,
        zIndex: 1300,
        transition: 'all 0.3s ease',
        backgroundColor: alpha('#000', 0.85),
        color: 'white',
        backdropFilter: 'blur(10px)'
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SpeedIcon fontSize="small" />
            <Typography variant="subtitle2" color="inherit">
              Performance
            </Typography>
            <Chip 
              size="small" 
              label={performanceLevel.level}
              color={performanceLevel.color}
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isMonitoring}
                  onChange={(e) => setIsMonitoring(e.target.checked)}
                  size="small"
                />
              }
              label=""
              sx={{ m: 0, mr: 1 }}
            />
            <IconButton 
              size="small" 
              onClick={() => setIsExpanded(!isExpanded)}
              sx={{ color: 'inherit' }}
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {!isExpanded && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" display="block">
              Render: {metrics.renderTime.toFixed(1)}ms
            </Typography>
            <Typography variant="caption" display="block">
              Memory: {metrics.memoryUsage.toFixed(1)}MB
            </Typography>
          </Box>
        )}

        <Collapse in={isExpanded}>
          <Box sx={{ mt: 2 }}>
            {warnings.length > 0 && (
              <Alert 
                severity="warning" 
                sx={{ mb: 2, fontSize: '0.75rem' }}
                icon={<WarningIcon fontSize="small" />}
              >
                {warnings.map((warning, index) => (
                  <Typography key={index} variant="caption" display="block">
                    {warning}
                  </Typography>
                ))}
              </Alert>
            )}

            <Grid container spacing={1} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <TimerIcon fontSize="small" sx={{ mb: 0.5 }} />
                  <Typography variant="h6" color="inherit">
                    {metrics.renderTime.toFixed(1)}
                  </Typography>
                  <Typography variant="caption" color="inherit">
                    Render Time (ms)
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <MemoryIcon fontSize="small" sx={{ mb: 0.5 }} />
                  <Typography variant="h6" color="inherit">
                    {metrics.memoryUsage.toFixed(1)}
                  </Typography>
                  <Typography variant="caption" color="inherit">
                    Memory (MB)
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'inherit', fontSize: '0.75rem', border: 'none' }}>
                    Metric
                  </TableCell>
                  <TableCell sx={{ color: 'inherit', fontSize: '0.75rem', border: 'none' }}>
                    Value
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ color: 'inherit', fontSize: '0.7rem', border: 'none' }}>
                    Cache Hit Rate
                  </TableCell>
                  <TableCell sx={{ color: 'inherit', fontSize: '0.7rem', border: 'none' }}>
                    {metrics.cacheHitRate.toFixed(1)}%
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: 'inherit', fontSize: '0.7rem', border: 'none' }}>
                    Component Renders
                  </TableCell>
                  <TableCell sx={{ color: 'inherit', fontSize: '0.7rem', border: 'none' }}>
                    {metrics.componentRenderCount}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: 'inherit', fontSize: '0.7rem', border: 'none' }}>
                    Slow Renders
                  </TableCell>
                  <TableCell sx={{ color: 'inherit', fontSize: '0.7rem', border: 'none' }}>
                    {metrics.slowRenders}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Tooltip title="Clear all performance caches">
                <IconButton 
                  size="small" 
                  onClick={handleClearCaches}
                  sx={{ color: 'inherit' }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Reset performance metrics">
                <IconButton 
                  size="small" 
                  onClick={() => {
                    performance.clearMeasures();
                    performance.clearMarks();
                    measurePerformance();
                  }}
                  sx={{ color: 'inherit' }}
                >
                  <TimerIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {warnings.length === 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
                <CheckCircleIcon fontSize="small" color="success" />
                <Typography variant="caption" color="inherit">
                  Performance looks good
                </Typography>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default React.memo(PerformanceMonitor);