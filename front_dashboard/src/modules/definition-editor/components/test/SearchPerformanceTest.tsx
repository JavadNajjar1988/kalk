import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Timer as TimerIcon,
  Assessment as ReportIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

// Components
import NodeSearchComponent from '../search/NodeSearchComponent';
import { CategoryType } from '../../types';
import type { NodeSearchResult } from '../../types/fieldConstructor';

interface PerformanceMetrics {
  searchTerm: string;
  categoryType: CategoryType;
  resultsCount: number;
  searchTime: number;
  renderTime: number;
  memoryUsage?: number;
  filterTime?: number;
  totalTime: number;
}

interface TestConfiguration {
  categories: CategoryType[];
  searchTerms: string[];
  enableFilters: boolean;
  enableAdvancedFilters: boolean;
  maxResults: number;
  iterations: number;
  measureMemory: boolean;
}

const SearchPerformanceTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [selectedNodes, setSelectedNodes] = useState<NodeSearchResult[]>([]);
  
  const [testConfig, setTestConfig] = useState<TestConfiguration>({
    categories: [
      CategoryType.GEOGRAPHICAL,
      CategoryType.MILITARY_RANKS,
      CategoryType.EQUIPMENT,
      CategoryType.PERSONS
    ],
    searchTerms: [
      'ایران', 'تهران', 'سرگرد', 'ستوان',
      'تانک', 'موشک', 'احمد', 'محمد',
      'نظارت', 'حمله', 'پدافند', 'ارتباطات'
    ],
    enableFilters: true,
    enableAdvancedFilters: false,
    maxResults: 50,
    iterations: 3,
    measureMemory: true
  });

  const performanceRef = useRef<{
    startTime: number;
    renderStartTime: number;
    observer?: PerformanceObserver;
  }>({
    startTime: 0,
    renderStartTime: 0
  });

  // Measure memory usage (if available)
  const measureMemory = useCallback((): number | undefined => {
    if (testConfig.measureMemory && 'memory' in performance) {
      // @ts-ignore - performance.memory is not in standard types
      return performance.memory?.usedJSHeapSize || undefined;
    }
    return undefined;
  }, [testConfig.measureMemory]);

  // Run performance test
  const runPerformanceTest = async () => {
    setIsRunning(true);
    setProgress(0);
    setMetrics([]);
    
    const totalTests = testConfig.categories.length * testConfig.searchTerms.length * testConfig.iterations;
    let completedTests = 0;
    const results: PerformanceMetrics[] = [];

    for (const category of testConfig.categories) {
      for (const searchTerm of testConfig.searchTerms) {
        for (let iteration = 0; iteration < testConfig.iterations; iteration++) {
          setCurrentTest(`Testing ${category} - "${searchTerm}" (${iteration + 1}/${testConfig.iterations})`);
          
          // Measure search performance
          const searchStartTime = performance.now();
          const initialMemory = measureMemory();
          
          try {
            // Simulate search (in real app, this would trigger the actual search)
            await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
            
            const searchEndTime = performance.now();
            const searchTime = searchEndTime - searchStartTime;
            
            // Simulate render time
            const renderStartTime = performance.now();
            await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 30));
            const renderEndTime = performance.now();
            const renderTime = renderEndTime - renderStartTime;
            
            const finalMemory = measureMemory();
            const memoryDelta = finalMemory && initialMemory ? finalMemory - initialMemory : undefined;
            
            // Simulate results count
            const resultsCount = Math.floor(Math.random() * testConfig.maxResults);
            
            const metric: PerformanceMetrics = {
              searchTerm,
              categoryType: category,
              resultsCount,
              searchTime,
              renderTime,
              memoryUsage: memoryDelta,
              totalTime: searchTime + renderTime
            };
            
            results.push(metric);
            
          } catch (error) {
            console.error('Performance test error:', error);
          }
          
          completedTests++;
          setProgress((completedTests / totalTests) * 100);
          
          // Small delay between tests
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }
    
    setMetrics(results);
    setIsRunning(false);
    setProgress(100);
  };

  // Calculate performance statistics
  const calculateStats = () => {
    if (metrics.length === 0) return null;

    const avgSearchTime = metrics.reduce((sum, m) => sum + m.searchTime, 0) / metrics.length;
    const avgRenderTime = metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length;
    const avgTotalTime = metrics.reduce((sum, m) => sum + m.totalTime, 0) / metrics.length;
    const avgResultsCount = metrics.reduce((sum, m) => sum + m.resultsCount, 0) / metrics.length;
    
    const maxSearchTime = Math.max(...metrics.map(m => m.searchTime));
    const minSearchTime = Math.min(...metrics.map(m => m.searchTime));
    
    const slowestSearch = metrics.find(m => m.searchTime === maxSearchTime);
    const fastestSearch = metrics.find(m => m.searchTime === minSearchTime);
    
    return {
      avgSearchTime: Math.round(avgSearchTime * 100) / 100,
      avgRenderTime: Math.round(avgRenderTime * 100) / 100,
      avgTotalTime: Math.round(avgTotalTime * 100) / 100,
      avgResultsCount: Math.round(avgResultsCount * 100) / 100,
      maxSearchTime: Math.round(maxSearchTime * 100) / 100,
      minSearchTime: Math.round(minSearchTime * 100) / 100,
      slowestSearch,
      fastestSearch,
      totalTests: metrics.length
    };
  };

  const stats = calculateStats();

  // Get category display name
  const getCategoryDisplayName = (category: CategoryType): string => {
    const names: Record<CategoryType, string> = {
      [CategoryType.GEOGRAPHICAL]: 'جغرافیایی',
      [CategoryType.MILITARY_RANKS]: 'درجات نظامی',
      [CategoryType.EQUIPMENT]: 'تجهیزات',
      [CategoryType.PERSONS]: 'اشخاص',
      [CategoryType.MISSION_TYPE]: 'نوع مأموریت',
      [CategoryType.MILITARY_UNITS]: 'واحدهای نظامی',
      [CategoryType.OPERATIONAL_STATUS]: 'وضعیت عملیاتی',
      [CategoryType.OPERATIONAL_ENVIRONMENT]: 'محیط عملیاتی',
      [CategoryType.TIME_DEFINITIONS]: 'تعاریف زمانی',
      [CategoryType.CODING_CLASSIFICATION]: 'طبقه‌بندی کدها',
      [CategoryType.FORCE_TYPE]: 'نوع نیرو',
      [CategoryType.ORGANIZATIONAL_AFFILIATION]: 'وابستگی سازمانی',
      [CategoryType.THREAT_TYPE]: 'نوع تهدید',
      [CategoryType.INFO_CLASSIFICATION]: 'طبقه‌بندی اطلاعات',
      [CategoryType.LOGISTICS_STATUS]: 'وضعیت لجستیک',
      [CategoryType.LOGISTICS]: 'لجستیک',
      [CategoryType.AMMUNITION]: 'مهمات',
      [CategoryType.WEATHER]: 'آب و هوا'
    };
    return names[category] || category;
  };

  // Export performance report
  const exportReport = () => {
    const report = {
      testConfiguration: testConfig,
      metrics,
      statistics: stats,
      timestamp: new Date().toISOString(),
      environment: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform
      }
    };
    
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `search-performance-report-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Search Performance Test
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Test search performance across different categories with various scenarios
      </Typography>

      <Grid container spacing={3}>
        {/* Test Configuration */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Configuration
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Max Results</InputLabel>
                    <Select
                      value={testConfig.maxResults}
                      onChange={(e) => setTestConfig(prev => ({
                        ...prev,
                        maxResults: e.target.value as number
                      }))}
                    >
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={25}>25</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                      <MenuItem value={100}>100</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Iterations per test"
                    type="number"
                    value={testConfig.iterations}
                    onChange={(e) => setTestConfig(prev => ({
                      ...prev,
                      iterations: parseInt(e.target.value) || 1
                    }))}
                    inputProps={{ min: 1, max: 10 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={testConfig.enableFilters}
                        onChange={(e) => setTestConfig(prev => ({
                          ...prev,
                          enableFilters: e.target.checked
                        }))}
                      />
                    }
                    label="Enable Basic Filters"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={testConfig.enableAdvancedFilters}
                        onChange={(e) => setTestConfig(prev => ({
                          ...prev,
                          enableAdvancedFilters: e.target.checked
                        }))}
                      />
                    }
                    label="Enable Advanced Filters"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={testConfig.measureMemory}
                        onChange={(e) => setTestConfig(prev => ({
                          ...prev,
                          measureMemory: e.target.checked
                        }))}
                      />
                    }
                    label="Measure Memory Usage"
                  />
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Button
                fullWidth
                variant="contained"
                startIcon={isRunning ? <StopIcon /> : <PlayIcon />}
                onClick={isRunning ? () => setIsRunning(false) : runPerformanceTest}
                disabled={isRunning}
              >
                {isRunning ? 'Running...' : 'Start Performance Test'}
              </Button>
              
              {isRunning && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" display="block" gutterBottom>
                    {currentTest}
                  </Typography>
                  <LinearProgress variant="determinate" value={progress} />
                  <Typography variant="caption" color="text.secondary">
                    {Math.round(progress)}% Complete
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Live Search Demo */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Live Search Demo
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                Use this section to manually test search performance and functionality
              </Alert>
              
              <NodeSearchComponent
                categoryTypes={testConfig.categories}
                placeholder="Type to search and measure performance..."
                enableFilters={testConfig.enableFilters}
                enableAdvancedFilters={testConfig.enableAdvancedFilters}
                maxResults={testConfig.maxResults}
                multiSelect={true}
                selectedNodes={selectedNodes}
                onSelectionChange={setSelectedNodes}
                showPath={true}
                showCoordinates={true}
                showLevel={true}
                groupByCategory={true}
                enableFavorites={true}
                enableRecent={true}
                onSearchStart={() => {
                  performanceRef.current.startTime = performance.now();
                  console.log('Search started');
                }}
                onSearchComplete={(results) => {
                  const endTime = performance.now();
                  const searchTime = endTime - performanceRef.current.startTime;
                  console.log(`Search completed in ${searchTime.toFixed(2)}ms with ${results.length} results`);
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Statistics */}
        {stats && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Performance Statistics
                  </Typography>
                  <Button startIcon={<ReportIcon />} onClick={exportReport} variant="outlined">
                    Export Report
                  </Button>
                </Box>
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6} sm={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <TimerIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                        <Typography variant="h6">{stats.avgSearchTime}ms</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Avg Search Time
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <SpeedIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
                        <Typography variant="h6">{stats.avgRenderTime}ms</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Avg Render Time
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <AssessmentIcon color="info" sx={{ fontSize: 32, mb: 1 }} />
                        <Typography variant="h6">{stats.avgResultsCount}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Avg Results
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <MemoryIcon color="warning" sx={{ fontSize: 32, mb: 1 }} />
                        <Typography variant="h6">{stats.totalTests}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Total Tests
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Performance Breakdown */}
                <Typography variant="subtitle2" gutterBottom>
                  Performance Breakdown
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={`Fastest: ${stats.minSearchTime}ms`}
                    color="success"
                    size="small"
                  />
                  <Chip
                    label={`Slowest: ${stats.maxSearchTime}ms`}
                    color="error"
                    size="small"
                  />
                  <Chip
                    label={`Total Time: ${stats.avgTotalTime}ms`}
                    color="info"
                    size="small"
                  />
                </Box>
                
                {/* Detailed Results Table */}
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell>Search Term</TableCell>
                        <TableCell align="right">Results</TableCell>
                        <TableCell align="right">Search (ms)</TableCell>
                        <TableCell align="right">Render (ms)</TableCell>
                        <TableCell align="right">Total (ms)</TableCell>
                        {testConfig.measureMemory && (
                          <TableCell align="right">Memory (KB)</TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {metrics.map((metric, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {getCategoryDisplayName(metric.categoryType)}
                          </TableCell>
                          <TableCell>{metric.searchTerm}</TableCell>
                          <TableCell align="right">{metric.resultsCount}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={metric.searchTime.toFixed(1)}
                              size="small"
                              color={metric.searchTime > 100 ? 'error' : metric.searchTime > 50 ? 'warning' : 'success'}
                            />
                          </TableCell>
                          <TableCell align="right">{metric.renderTime.toFixed(1)}</TableCell>
                          <TableCell align="right">{metric.totalTime.toFixed(1)}</TableCell>
                          {testConfig.measureMemory && (
                            <TableCell align="right">
                              {metric.memoryUsage ? (metric.memoryUsage / 1024).toFixed(1) : 'N/A'}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default SearchPerformanceTest;