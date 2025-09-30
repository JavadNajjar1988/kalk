import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert
} from '@mui/material';
import {
  Monitor,
  BugReport,
  Speed,
  Storage,
  NetworkCheck,
  Error as ErrorIcon,
  Warning,
  Info,
  CheckCircle,
  Clear,
  Search,
  ExpandMore,
  Download,
  Refresh,
  Settings,
  Timeline
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useOrbat } from '../components/OrbatProvider';
import type { 
  BaseMessage,
  CommandMessage,
  ResponseMessage,
  EventMessage 
} from '../types/orbat-bridge';

interface DebugEntry {
  id: string;
  timestamp: Date;
  type: 'command' | 'response' | 'event' | 'error' | 'warning' | 'info';
  category: string;
  message: string;
  data?: any;
  duration?: number;
  success?: boolean;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
}

interface ConnectionStatus {
  isConnected: boolean;
  lastHeartbeat: Date | null;
  latency: number;
  reconnectAttempts: number;
  totalMessages: number;
  errorCount: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`debug-tabpanel-${index}`}
    aria-labelledby={`debug-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

export const OrbatDebugMonitor: React.FC = () => {
  const { bridge, dataService, eventService } = useOrbat();
  
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [debugEntries, setDebugEntries] = useState<DebugEntry[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    lastHeartbeat: null,
    latency: 0,
    reconnectAttempts: 0,
    totalMessages: 0,
    errorCount: 0
  });
  
  // Filters and settings
  const [autoScroll, setAutoScroll] = useState(true);
  const [maxEntries, setMaxEntries] = useState(1000);
  const [filterText, setFilterText] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [isRecording, setIsRecording] = useState(true);

  // Add debug entry
  const addDebugEntry = useCallback((entry: Omit<DebugEntry, 'id' | 'timestamp'>) => {
    if (!isRecording) return;
    
    const newEntry: DebugEntry = {
      ...entry,
      id: `debug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    
    setDebugEntries(prev => {
      const updated = [newEntry, ...prev];
      return updated.slice(0, maxEntries);
    });
  }, [isRecording, maxEntries]);

  // Monitor bridge messages
  useEffect(() => {
    if (!bridge) return;

    const originalPostMessage = bridge.sendCommand.bind(bridge);
    
    // Wrap sendCommand to monitor outgoing commands
    bridge.sendCommand = async (command, data, options) => {
      const startTime = Date.now();
      
      addDebugEntry({
        type: 'command',
        category: 'Bridge',
        message: `Sending command: ${command}`,
        data: { command, data, options }
      });

      try {
        const result = await originalPostMessage(command, data, options);
        const duration = Date.now() - startTime;
        
        addDebugEntry({
          type: 'response',
          category: 'Bridge',
          message: `Command ${command} completed`,
          data: result,
          duration,
          success: true
        });
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        addDebugEntry({
          type: 'error',
          category: 'Bridge',
          message: `Command ${command} failed: ${error.message}`,
          data: { error: error.message, command, data },
          duration,
          success: false
        });
        
        throw error;
      }
    };

    // Monitor events
    const handleEvent = (eventType: string, data: any) => {
      addDebugEntry({
        type: 'event',
        category: 'Events',
        message: `Event received: ${eventType}`,
        data: { eventType, data }
      });
    };

    // Monitor data service operations
    if (dataService) {
      const originalGetScenarios = dataService.getScenarios.bind(dataService);
      dataService.getScenarios = async (useCache) => {
        const startTime = Date.now();
        addDebugEntry({
          type: 'info',
          category: 'DataService',
          message: 'Loading scenarios',
          data: { useCache }
        });

        try {
          const result = await originalGetScenarios(useCache);
          const duration = Date.now() - startTime;
          
          addDebugEntry({
            type: 'info',
            category: 'DataService',
            message: `Scenarios loaded (${result.length} items)`,
            data: { count: result.length, useCache },
            duration,
            success: true
          });
          
          return result;
        } catch (error) {
          addDebugEntry({
            type: 'error',
            category: 'DataService',
            message: `Failed to load scenarios: ${error.message}`,
            data: { error: error.message },
            success: false
          });
          throw error;
        }
      };
    }

    return () => {
      // Restore original methods
      bridge.sendCommand = originalPostMessage;
    };
  }, [bridge, dataService, addDebugEntry]);

  // Update performance metrics
  useEffect(() => {
    const updateMetrics = () => {
      const recentEntries = debugEntries.slice(0, 100);
      const errorEntries = recentEntries.filter(e => e.type === 'error');
      const commandEntries = recentEntries.filter(e => e.type === 'command');
      const avgLatency = commandEntries.reduce((sum, e) => sum + (e.duration || 0), 0) / Math.max(commandEntries.length, 1);
      
      const metrics: PerformanceMetric[] = [
        {
          name: 'Connection Latency',
          value: Math.round(avgLatency),
          unit: 'ms',
          status: avgLatency < 100 ? 'good' : avgLatency < 500 ? 'warning' : 'critical'
        },
        {
          name: 'Error Rate',
          value: Math.round((errorEntries.length / Math.max(recentEntries.length, 1)) * 100),
          unit: '%',
          status: errorEntries.length === 0 ? 'good' : errorEntries.length < 5 ? 'warning' : 'critical'
        },
        {
          name: 'Messages/min',
          value: Math.round(recentEntries.length),
          unit: 'msg/min',
          status: 'good'
        },
        {
          name: 'Memory Usage',
          value: Math.round((debugEntries.length * 100) / maxEntries),
          unit: '%',
          status: debugEntries.length < maxEntries * 0.8 ? 'good' : 'warning'
        }
      ];
      
      setPerformanceMetrics(metrics);
    };

    const interval = setInterval(updateMetrics, 5000);
    updateMetrics(); // Initial update
    
    return () => clearInterval(interval);
  }, [debugEntries, maxEntries]);

  // Filter debug entries
  const filteredEntries = useMemo(() => {
    return debugEntries.filter(entry => {
      if (filterText && !entry.message.toLowerCase().includes(filterText.toLowerCase())) {
        return false;
      }
      
      if (selectedCategories.size > 0 && !selectedCategories.has(entry.category)) {
        return false;
      }
      
      return true;
    });
  }, [debugEntries, filterText, selectedCategories]);

  // Get unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(debugEntries.map(e => e.category)));
  }, [debugEntries]);

  // Clear debug entries
  const clearEntries = useCallback(() => {
    setDebugEntries([]);
  }, []);

  // Export debug data
  const exportDebugData = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      entries: debugEntries,
      metrics: performanceMetrics,
      connectionStatus
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orbat-debug-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [debugEntries, performanceMetrics, connectionStatus]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error': return <ErrorIcon color="error" />;
      case 'warning': return <Warning color="warning" />;
      case 'info': return <Info color="info" />;
      case 'command': return <NetworkCheck color="primary" />;
      case 'response': return <CheckCircle color="success" />;
      case 'event': return <Timeline color="secondary" />;
      default: return <Info />;
    }
  };

  return (
    <Paper sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Monitor />
            ORBAT Integration Debug Monitor
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isRecording}
                  onChange={(e) => setIsRecording(e.target.checked)}
                  size="small"
                />
              }
              label="Recording"
            />
            
            <Button
              variant="outlined"
              size="small"
              startIcon={<Clear />}
              onClick={clearEntries}
            >
              Clear
            </Button>
            
            <Button
              variant="outlined"
              size="small"
              startIcon={<Download />}
              onClick={exportDebugData}
            >
              Export
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Debug Log" icon={<Bug />} />
        <Tab label="Performance" icon={<Speed />} />
        <Tab label="Connection" icon={<NetworkCheck />} />
        <Tab label="Cache" icon={<Storage />} />
      </Tabs>

      {/* Debug Log Tab */}
      <TabPanel value={activeTab} index={0}>
        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Filter messages..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
            sx={{ width: 300 }}
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                size="small"
              />
            }
            label="Auto-scroll"
          />
        </Box>

        {categories.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Categories:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {categories.map(category => (
                <Chip
                  key={category}
                  label={category}
                  size="small"
                  variant={selectedCategories.has(category) ? 'filled' : 'outlined'}
                  onClick={() => {
                    const newSelected = new Set(selectedCategories);
                    if (newSelected.has(category)) {
                      newSelected.delete(category);
                    } else {
                      newSelected.add(category);
                    }
                    setSelectedCategories(newSelected);
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        <TableContainer sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell>
                    {format(entry.timestamp, 'HH:mm:ss.SSS')}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getTypeIcon(entry.type)}
                      <Typography variant="caption">
                        {entry.type}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={entry.category} size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {entry.message}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {entry.duration && (
                      <Chip
                        label={`${entry.duration}ms`}
                        size="small"
                        color={entry.duration < 100 ? 'success' : entry.duration < 500 ? 'warning' : 'error'}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.data && (
                      <Tooltip title="View data">
                        <IconButton
                          size="small"
                          onClick={() => console.log('Debug entry data:', entry.data)}
                        >
                          <Info />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Performance Tab */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          {performanceMetrics.map((metric) => (
            <Grid item xs={12} sm={6} md={3} key={metric.name}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color={getStatusColor(metric.status)}>
                    {metric.value}{metric.unit}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {metric.name}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(metric.value, 100)}
                    color={getStatusColor(metric.status) as any}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <List>
            {debugEntries.slice(0, 10).map((entry) => (
              <ListItem key={entry.id}>
                <ListItemIcon>
                  {getTypeIcon(entry.type)}
                </ListItemIcon>
                <ListItemText
                  primary={entry.message}
                  secondary={`${entry.category} • ${format(entry.timestamp, 'HH:mm:ss')}`}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </TabPanel>

      {/* Connection Tab */}
      <TabPanel value={activeTab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Connection Status
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Status:</Typography>
                    <Chip
                      label={connectionStatus.isConnected ? 'Connected' : 'Disconnected'}
                      color={connectionStatus.isConnected ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Latency:</Typography>
                    <Typography>{connectionStatus.latency}ms</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Total Messages:</Typography>
                    <Typography>{connectionStatus.totalMessages}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Errors:</Typography>
                    <Typography color="error">{connectionStatus.errorCount}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Bridge Configuration
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2">
                    Vue App URL: http://localhost:5173
                  </Typography>
                  <Typography variant="body2">
                    Timeout: 30s
                  </Typography>
                  <Typography variant="body2">
                    Retry Attempts: 3
                  </Typography>
                  <Typography variant="body2">
                    Heartbeat: Enabled
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Cache Tab */}
      <TabPanel value={activeTab} index={3}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Cache monitoring features will be implemented when data service caching is active.
        </Alert>
      </TabPanel>
    </Paper>
  );
};

