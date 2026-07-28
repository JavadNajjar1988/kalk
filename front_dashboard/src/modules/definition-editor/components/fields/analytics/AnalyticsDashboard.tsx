import React, { useState, useEffect, useMemo } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Tooltip,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material';
import { formatPersianDateTime } from '@/utils/dateUtils';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Analytics as AnalyticsIcon,
  Speed as SpeedIcon,
  Error as ErrorIcon,
  People as PeopleIcon,
  Visibility as VisibilityIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

import { FieldAnalyticsEngine } from './FieldAnalyticsEngine';
import { GlobalAnalytics, FieldAnalytics, AnalyticsFilters } from './types';

interface AnalyticsDashboardProps {
  fieldIds?: string[];
  autoRefresh?: boolean;
  refreshInterval?: number;
  onExport?: (format: string, data: any) => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  fieldIds = [],
  autoRefresh = true,
  refreshInterval = 30000,
  onExport,
}) => {
  const analyticsEngine = useMemo(() => FieldAnalyticsEngine.getInstance(), []);

  const [globalAnalytics, setGlobalAnalytics] =
    useState<GlobalAnalytics | null>(null);
  const [fieldAnalytics, setFieldAnalytics] = useState<FieldAnalytics[]>([]);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    timeRange: 'week',
    fieldTypes: [],
    categories: [],
    userSegments: [],
    includeInactive: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Color schemes for charts
  const colors = [
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff7c7c',
    '#8dd1e1',
    '#d084d0',
  ];

  // Load analytics data
  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const dateRange = getDateRangeFromFilter(
        filters.timeRange,
        filters.customRange
      );

      // Load global analytics
      const global = analyticsEngine.getGlobalAnalytics(dateRange);
      setGlobalAnalytics(global);

      // Load field-specific analytics
      const targetFieldIds =
        fieldIds.length > 0
          ? fieldIds
          : global.topFields.map(f => f.fieldId).slice(0, 10);
      const fieldData = targetFieldIds.map(fieldId =>
        analyticsEngine.getFieldAnalytics(fieldId, dateRange)
      );
      setFieldAnalytics(fieldData);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    loadAnalytics();

    if (autoRefresh) {
      const interval = setInterval(loadAnalytics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [filters, autoRefresh, refreshInterval]);

  // Handle export
  const handleExport = (format: string) => {
    const data = {
      global: globalAnalytics,
      fields: fieldAnalytics,
      timestamp: new Date(),
      filters,
    };
    onExport?.(format, data);
  };

  if (isLoading || !globalAnalytics) {
    return (
      <Box p={3}>
        <LinearProgress />
        <Typography variant="h6" align="center" sx={{ mt: 2 }}>
          Loading Analytics...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Field Analytics Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            آخرین به‌روزرسانی: {formatPersianDateTime(lastUpdated)}
          </Typography>
        </Box>

        <Box display="flex" gap={1}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={filters.timeRange}
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  timeRange: e.target.value as any,
                }))
              }
              label="Time Range"
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>

          <Tooltip title="Refresh">
            <IconButton onClick={loadAnalytics}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Export">
            <IconButton onClick={() => handleExport('json')}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {globalAnalytics.totalFields}
                  </Typography>
                  <Typography variant="body2">Total Fields</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                  <AssignmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {globalAnalytics.uniqueUsers}
                  </Typography>
                  <Typography variant="body2">Active Users</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                  <PeopleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {globalAnalytics.totalEvents.toLocaleString()}
                  </Typography>
                  <Typography variant="body2">Total Events</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                  <AnalyticsIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {globalAnalytics.performance.errorRate.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2">Error Rate</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                  <SpeedIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} mb={3}>
        {/* Usage Trends */}
        <Grid item xs={12} lg={8}>
          <Paper
            sx={{
              p: 3,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Usage Trends
            </Typography>
            <Box
              sx={{
                height: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Usage trends chart would be displayed here
                <br />({globalAnalytics.usageTrends.length} data points)
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Field Type Distribution */}
        <Grid item xs={12} lg={4}>
          <Paper
            sx={{
              p: 3,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Field Types
            </Typography>
            <Box sx={{ height: 300 }}>
              {globalAnalytics.fieldTypeDistribution.map((item, index) => (
                <Box key={item.type} sx={{ mb: 2 }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                  >
                    <Typography variant="body2">{item.type}</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {item.percentage.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={item.percentage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: colors[index % colors.length],
                      },
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Top Performing Fields */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} lg={6}>
          <Paper
            sx={{
              p: 3,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Top Performing Fields
            </Typography>
            <List>
              {globalAnalytics.topFields.slice(0, 5).map((field, index) => (
                <React.Fragment key={field.fieldId}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: colors[index % colors.length] }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={field.name}
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {field.type} • Score: {field.score}
                          </Typography>
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            mt={0.5}
                          >
                            <Chip
                              label={`${field.totalEvents} events`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            <TrendingUpIcon fontSize="small" color="success" />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < 4 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Problem Fields */}
        <Grid item xs={12} lg={6}>
          <Paper
            sx={{
              p: 3,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Fields Needing Attention
            </Typography>
            <List>
              {globalAnalytics.problemFields.slice(0, 5).map((field, index) => (
                <React.Fragment key={field.fieldId}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor:
                            field.severity === 'high'
                              ? 'error.main'
                              : field.severity === 'medium'
                                ? 'warning.main'
                                : 'info.main',
                        }}
                      >
                        {field.severity === 'high' ? (
                          <ErrorIcon />
                        ) : (
                          <WarningIcon />
                        )}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={field.name}
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {field.type}
                          </Typography>
                          <Box
                            display="flex"
                            flexWrap="wrap"
                            gap={0.5}
                            mt={0.5}
                          >
                            {field.issues.slice(0, 2).map((issue, idx) => (
                              <Chip
                                key={idx}
                                label={issue}
                                size="small"
                                color="error"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < 4 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Field Performance Chart */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Field Performance Comparison
            </Typography>
            <Box sx={{ height: 400 }}>
              {fieldAnalytics.slice(0, 10).map((field, index) => (
                <Box key={field.fieldId} sx={{ mb: 3 }}>
                  <Typography variant="body2" gutterBottom>
                    {field.fieldName}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="caption">
                        Events: {field.totalEvents}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min((field.totalEvents / 100) * 10, 100)}
                        sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption">
                        Users: {field.uniqueUsers}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min((field.uniqueUsers / 50) * 10, 100)}
                        color="secondary"
                        sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption">
                        Completion: {field.completionRate.toFixed(1)}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={field.completionRate}
                        color="success"
                        sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// Helper function to convert filter to date range
const getDateRangeFromFilter = (
  timeRange: string,
  customRange?: { start: Date; end: Date }
) => {
  const end = new Date();
  const start = new Date();

  switch (timeRange) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(end.getDate() - 7);
      break;
    case 'month':
      start.setMonth(end.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(end.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(end.getFullYear() - 1);
      break;
    case 'custom':
      return customRange || { start, end };
    default:
      start.setDate(end.getDate() - 7);
  }

  return { start, end };
};

export default AnalyticsDashboard;
