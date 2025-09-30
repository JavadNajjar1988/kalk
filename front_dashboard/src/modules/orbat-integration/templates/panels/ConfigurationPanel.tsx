import React, { useState, useCallback, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  FormControl,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  Slider,
  Button,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Alert,
  Chip
} from '@mui/material';
import {
  Settings,
  AccountTree as Network,
  Security,
  Speed as Performance,
  Map,
  Save,
  Refresh as Reset,
  Upload as Import,
  Download as Export
} from '@mui/icons-material';

// Configuration interfaces
export interface GeneralConfig {
  language: 'en' | 'fa' | 'ar';
  theme: 'light' | 'dark' | 'auto';
  autoSave: boolean;
  autoSaveInterval: number;
  enableNotifications: boolean;
  enableAnimations: boolean;
}

export interface OrbatConfig {
  vueAppUrl: string;
  enableCaching: boolean;
  cacheExpiration: number;
  enableRealTimeSync: boolean;
  syncInterval: number;
  commandTimeout: number;
  retryAttempts: number;
}

export interface SecurityConfig {
  enableValidation: boolean;
  strictValidation: boolean;
  sessionTimeout: number;
  enableAuditLog: boolean;
  restrictedMode: boolean;
}

export interface PerformanceConfig {
  enablePerformanceMonitoring: boolean;
  enableDebugMode: boolean;
  enableErrorRecovery: boolean;
  maxCacheSize: number;
  enableVirtualization: boolean;
  enableLazyLoading: boolean;
}

export interface DisplayConfig {
  mapStyle: 'satellite' | 'terrain' | 'hybrid' | 'standard';
  showCoordinates: boolean;
  showScale: boolean;
  symbolSize: 'small' | 'medium' | 'large';
  symbolOpacity: number;
  showUnitLabels: boolean;
}

export interface ConfigurationState {
  general: GeneralConfig;
  orbat: OrbatConfig;
  security: SecurityConfig;
  performance: PerformanceConfig;
  display: DisplayConfig;
}

// Default configuration
const DEFAULT_CONFIG: ConfigurationState = {
  general: {
    language: 'en',
    theme: 'light',
    autoSave: true,
    autoSaveInterval: 5,
    enableNotifications: true,
    enableAnimations: true
  },
  orbat: {
    vueAppUrl: 'http://localhost:5173',
    enableCaching: true,
    cacheExpiration: 30,
    enableRealTimeSync: true,
    syncInterval: 5,
    commandTimeout: 30,
    retryAttempts: 3
  },
  security: {
    enableValidation: true,
    strictValidation: false,
    sessionTimeout: 60,
    enableAuditLog: true,
    restrictedMode: false
  },
  performance: {
    enablePerformanceMonitoring: true,
    enableDebugMode: false,
    enableErrorRecovery: true,
    maxCacheSize: 100,
    enableVirtualization: true,
    enableLazyLoading: true
  },
  display: {
    mapStyle: 'standard',
    showCoordinates: true,
    showScale: true,
    symbolSize: 'medium',
    symbolOpacity: 0.8,
    showUnitLabels: true
  }
};

// Tab panel component
const TabPanel: React.FC<{ children?: React.ReactNode; index: number; value: number }> = ({ 
  children, value, index 
}) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

// Styled components
const ConfigContainer = styled(Paper)({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
});

const ConfigHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}));

const SectionCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '&:last-child': { marginBottom: 0 }
}));

// Props interface
export interface ConfigurationPanelProps {
  config?: Partial<ConfigurationState>;
  onConfigChange?: (config: ConfigurationState) => void;
  onReset?: () => void;
  onSave?: (config: ConfigurationState) => void;
  onImport?: (file: File) => void;
  onExport?: (config: ConfigurationState) => void;
  loading?: boolean;
  error?: string;
  readonly?: boolean;
}

// Main configuration panel component
export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  config: initialConfig = {},
  onConfigChange,
  onReset,
  onSave,
  onImport,
  onExport,
  loading = false,
  error,
  readonly = false
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [config, setConfig] = useState<ConfigurationState>({
    ...DEFAULT_CONFIG,
    ...initialConfig
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Update config when prop changes
  useEffect(() => {
    setConfig(prev => ({ ...DEFAULT_CONFIG, ...initialConfig }));
  }, [initialConfig]);

  // Handle config update
  const updateConfig = useCallback(<T extends keyof ConfigurationState>(
    section: T,
    key: keyof ConfigurationState[T],
    value: any
  ) => {
    if (readonly) return;

    setConfig(prev => {
      const newConfig = {
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value
        }
      };
      setHasChanges(true);
      onConfigChange?.(newConfig);
      return newConfig;
    });
  }, [onConfigChange, readonly]);

  // Handle actions
  const handleReset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    setHasChanges(false);
    onReset?.();
  }, [onReset]);

  const handleSave = useCallback(() => {
    onSave?.(config);
    setHasChanges(false);
  }, [config, onSave]);

  const handleExport = useCallback(() => {
    onExport?.(config);
  }, [config, onExport]);

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onImport?.(file);
  }, [onImport]);

  return (
    <ConfigContainer>
      {/* Header */}
      <ConfigHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings color="primary" />
          <Typography variant="h6">Configuration</Typography>
          {hasChanges && <Chip label="Unsaved Changes" color="warning" size="small" />}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <input
            accept=".json"
            style={{ display: 'none' }}
            id="import-config"
            type="file"
            onChange={handleImport}
            disabled={readonly}
          />
          <label htmlFor="import-config">
            <Button component="span" variant="outlined" size="small" startIcon={<Import />} disabled={readonly}>
              Import
            </Button>
          </label>
          <Button variant="outlined" size="small" startIcon={<Export />} onClick={handleExport}>
            Export
          </Button>
          <Button variant="outlined" size="small" startIcon={<Reset />} onClick={handleReset} disabled={readonly}>
            Reset
          </Button>
          <Button variant="contained" size="small" startIcon={<Save />} onClick={handleSave} disabled={readonly || !hasChanges}>
            Save
          </Button>
        </Box>
      </ConfigHeader>

      {/* Error Alert */}
      {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="General" icon={<Settings />} />
        <Tab label="ORBAT" icon={<Network />} />
        <Tab label="Security" icon={<Security />} />
        <Tab label="Performance" icon={<Performance />} />
        <Tab label="Display" icon={<Map />} />
      </Tabs>

      {/* Tab Panels */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* General Settings */}
        <TabPanel value={activeTab} index={0}>
          <SectionCard>
            <CardHeader title="زبان و تم" />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>زبان</InputLabel>
                    <Select
                      value={config.general.language}
                      label="زبان"
                      onChange={(e) => updateConfig('general', 'language', e.target.value)}
                      disabled={readonly}
                    >
                      <MenuItem value="en">انگلیسی</MenuItem>
                      <MenuItem value="fa">فارسی (فارسی)</MenuItem>
                      <MenuItem value="ar">عربی (العربية)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Theme</InputLabel>
                    <Select
                      value={config.general.theme}
                      label="Theme"
                      onChange={(e) => updateConfig('general', 'theme', e.target.value)}
                      disabled={readonly}
                    >
                      <MenuItem value="light">Light</MenuItem>
                      <MenuItem value="dark">Dark</MenuItem>
                      <MenuItem value="auto">Auto</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </SectionCard>

          <SectionCard>
            <CardHeader title="Auto Save" />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.general.autoSave}
                    onChange={(e) => updateConfig('general', 'autoSave', e.target.checked)}
                    disabled={readonly}
                  />
                }
                label="Enable Auto Save"
              />
              {config.general.autoSave && (
                <Box sx={{ mt: 2 }}>
                  <Typography gutterBottom>Auto Save Interval (minutes)</Typography>
                  <Slider
                    value={config.general.autoSaveInterval}
                    onChange={(_, value) => updateConfig('general', 'autoSaveInterval', value)}
                    min={1}
                    max={60}
                    marks={[{ value: 1, label: '1' }, { value: 30, label: '30' }, { value: 60, label: '60' }]}
                    disabled={readonly}
                  />
                </Box>
              )}
            </CardContent>
          </SectionCard>
        </TabPanel>

        {/* ORBAT Settings */}
        <TabPanel value={activeTab} index={1}>
          <SectionCard>
            <CardHeader title="Connection" />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Vue Application URL"
                    value={config.orbat.vueAppUrl}
                    onChange={(e) => updateConfig('orbat', 'vueAppUrl', e.target.value)}
                    disabled={readonly}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Command Timeout (seconds)"
                    type="number"
                    value={config.orbat.commandTimeout}
                    onChange={(e) => updateConfig('orbat', 'commandTimeout', parseInt(e.target.value))}
                    disabled={readonly}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Retry Attempts"
                    type="number"
                    value={config.orbat.retryAttempts}
                    onChange={(e) => updateConfig('orbat', 'retryAttempts', parseInt(e.target.value))}
                    disabled={readonly}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </SectionCard>

          <SectionCard>
            <CardHeader title="Caching & Sync" />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.orbat.enableCaching}
                    onChange={(e) => updateConfig('orbat', 'enableCaching', e.target.checked)}
                    disabled={readonly}
                  />
                }
                label="Enable Caching"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={config.orbat.enableRealTimeSync}
                    onChange={(e) => updateConfig('orbat', 'enableRealTimeSync', e.target.checked)}
                    disabled={readonly}
                  />
                }
                label="Real-Time Sync"
              />
            </CardContent>
          </SectionCard>
        </TabPanel>

        {/* Security Settings */}
        <TabPanel value={activeTab} index={2}>
          <SectionCard>
            <CardHeader title="Validation & Security" />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.security.enableValidation}
                    onChange={(e) => updateConfig('security', 'enableValidation', e.target.checked)}
                    disabled={readonly}
                  />
                }
                label="Enable Validation"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={config.security.enableAuditLog}
                    onChange={(e) => updateConfig('security', 'enableAuditLog', e.target.checked)}
                    disabled={readonly}
                  />
                }
                label="Audit Logging"
              />
              <TextField
                fullWidth
                label="Session Timeout (minutes)"
                type="number"
                value={config.security.sessionTimeout}
                onChange={(e) => updateConfig('security', 'sessionTimeout', parseInt(e.target.value))}
                disabled={readonly}
                sx={{ mt: 2 }}
              />
            </CardContent>
          </SectionCard>
        </TabPanel>

        {/* Performance Settings */}
        <TabPanel value={activeTab} index={3}>
          <SectionCard>
            <CardHeader title="Performance & Optimization" />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.performance.enablePerformanceMonitoring}
                    onChange={(e) => updateConfig('performance', 'enablePerformanceMonitoring', e.target.checked)}
                    disabled={readonly}
                  />
                }
                label="Performance Monitoring"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={config.performance.enableErrorRecovery}
                    onChange={(e) => updateConfig('performance', 'enableErrorRecovery', e.target.checked)}
                    disabled={readonly}
                  />
                }
                label="Error Recovery"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={config.performance.enableVirtualization}
                    onChange={(e) => updateConfig('performance', 'enableVirtualization', e.target.checked)}
                    disabled={readonly}
                  />
                }
                label="List Virtualization"
              />
            </CardContent>
          </SectionCard>
        </TabPanel>

        {/* Display Settings */}
        <TabPanel value={activeTab} index={4}>
          <SectionCard>
            <CardHeader title="Map & Display" />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Map Style</InputLabel>
                    <Select
                      value={config.display.mapStyle}
                      label="Map Style"
                      onChange={(e) => updateConfig('display', 'mapStyle', e.target.value)}
                      disabled={readonly}
                    >
                      <MenuItem value="standard">Standard</MenuItem>
                      <MenuItem value="satellite">Satellite</MenuItem>
                      <MenuItem value="terrain">Terrain</MenuItem>
                      <MenuItem value="hybrid">Hybrid</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Symbol Size</InputLabel>
                    <Select
                      value={config.display.symbolSize}
                      label="Symbol Size"
                      onChange={(e) => updateConfig('display', 'symbolSize', e.target.value)}
                      disabled={readonly}
                    >
                      <MenuItem value="small">Small</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="large">Large</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.display.showCoordinates}
                    onChange={(e) => updateConfig('display', 'showCoordinates', e.target.checked)}
                    disabled={readonly}
                  />
                }
                label="Show Coordinates"
                sx={{ mt: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={config.display.showUnitLabels}
                    onChange={(e) => updateConfig('display', 'showUnitLabels', e.target.checked)}
                    disabled={readonly}
                  />
                }
                label="Show Unit Labels"
              />
            </CardContent>
          </SectionCard>
        </TabPanel>
      </Box>
    </ConfigContainer>
  );
};

export default ConfigurationPanel;