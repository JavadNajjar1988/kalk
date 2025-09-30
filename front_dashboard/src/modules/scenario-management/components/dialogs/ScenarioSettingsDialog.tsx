import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Grid,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Switch,
  FormControlLabel,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  RestoreFromTrash as RestoreIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Map as MapIcon,
  Timeline as TimelineIcon,
  Visibility as VisibilityIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { useOrbatIntegration } from '../../hooks/useOrbatIntegration';

interface ScenarioSettingsDialogProps {
  open: boolean;
  scenarioId: string | null;
  onClose: () => void;
  onSave?: (settings: ScenarioSettings) => void;
}

interface ScenarioSettings {
  general: {
    name: string;
    description: string;
    author: string;
    version: string;
    tags: string[];
  };
  map: {
    defaultZoom: number;
    centerLat: number;
    centerLng: number;
    baseLayers: string[];
    defaultBaseLayer: string;
    showGrid: boolean;
    gridSize: number;
    showCoordinates: boolean;
  };
  timeline: {
    startTime: Date;
    endTime: Date;
    timeStep: number; // in seconds
    autoPlay: boolean;
    playbackSpeed: number;
    showEvents: boolean;
  };
  display: {
    showUnitLabels: boolean;
    showUnitIcons: boolean;
    symbolSize: number;
    labelSize: number;
    showTrails: boolean;
    trailLength: number;
  };
  simulation: {
    enablePhysics: boolean;
    collisionDetection: boolean;
    weatherEffects: boolean;
    terrainEffects: boolean;
  };
  export: {
    includeMetadata: boolean;
    compressData: boolean;
    format: 'json' | 'kml' | 'geojson';
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ paddingTop: '16px' }}>
    {value === index && children}
  </div>
);

const DEFAULT_SETTINGS: ScenarioSettings = {
  general: {
    name: '',
    description: '',
    author: '',
    version: '1.0.0',
    tags: []
  },
  map: {
    defaultZoom: 12,
    centerLat: 35.6892,
    centerLng: 51.3890,
    baseLayers: ['osm', 'satellite'],
    defaultBaseLayer: 'osm',
    showGrid: false,
    gridSize: 1000,
    showCoordinates: true
  },
  timeline: {
    startTime: new Date(),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    timeStep: 300,
    autoPlay: false,
    playbackSpeed: 1,
    showEvents: true
  },
  display: {
    showUnitLabels: true,
    showUnitIcons: true,
    symbolSize: 24,
    labelSize: 12,
    showTrails: false,
    trailLength: 10
  },
  simulation: {
    enablePhysics: false,
    collisionDetection: false,
    weatherEffects: false,
    terrainEffects: false
  },
  export: {
    includeMetadata: true,
    compressData: true,
    format: 'json'
  }
};

const ScenarioSettingsDialog: React.FC<ScenarioSettingsDialogProps> = ({
  open,
  scenarioId,
  onClose,
  onSave
}) => {
  const [settings, setSettings] = useState<ScenarioSettings>(DEFAULT_SETTINGS);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const { orbatInstance } = useOrbatIntegration();

  useEffect(() => {
    if (open && scenarioId) {
      loadSettings();
    }
  }, [open, scenarioId]);

  const loadSettings = async () => {
    if (!scenarioId || !orbatInstance) return;
    
    setLoading(true);
    try {
      const scenarioSettings = await orbatInstance.getScenarioSettings(scenarioId);
      setSettings({ ...DEFAULT_SETTINGS, ...scenarioSettings });
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!scenarioId) return;
    
    try {
      if (orbatInstance) {
        await orbatInstance.updateScenarioSettings(scenarioId, settings);
      }
      onSave?.(settings);
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const updateGeneralSettings = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      general: { ...prev.general, [field]: value }
    }));
  };

  const updateMapSettings = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      map: { ...prev.map, [field]: value }
    }));
  };

  const updateTimelineSettings = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      timeline: { ...prev.timeline, [field]: value }
    }));
  };

  const updateDisplaySettings = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      display: { ...prev.display, [field]: value }
    }));
  };

  const updateSimulationSettings = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      simulation: { ...prev.simulation, [field]: value }
    }));
  };

  const updateExportSettings = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      export: { ...prev.export, [field]: value }
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon />
            <Typography variant="h6">Scenario Settings</Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="General" />
          <Tab label="Map" />
          <Tab label="Timeline" />
          <Tab label="Display" />
          <Tab label="Simulation" />
          <Tab label="Export" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Scenario Name"
                value={settings.general.name}
                onChange={(e) => updateGeneralSettings('name', e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Author"
                value={settings.general.author}
                onChange={(e) => updateGeneralSettings('author', e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Version"
                value={settings.general.version}
                onChange={(e) => updateGeneralSettings('version', e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                value={settings.general.description}
                onChange={(e) => updateGeneralSettings('description', e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Tags (comma separated)"
                value={settings.general.tags.join(', ')}
                onChange={(e) => updateGeneralSettings('tags', e.target.value.split(',').map(tag => tag.trim()))}
                margin="normal"
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MapIcon /> Map Settings
              </Typography>
              
              <TextField
                fullWidth
                type="number"
                label="Default Zoom Level"
                value={settings.map.defaultZoom}
                onChange={(e) => updateMapSettings('defaultZoom', parseInt(e.target.value))}
                margin="normal"
                inputProps={{ min: 1, max: 20 }}
              />
              
              <TextField
                fullWidth
                type="number"
                label="Center Latitude"
                value={settings.map.centerLat}
                onChange={(e) => updateMapSettings('centerLat', parseFloat(e.target.value))}
                margin="normal"
                inputProps={{ step: 0.000001 }}
              />
              
              <TextField
                fullWidth
                type="number"
                label="Center Longitude"
                value={settings.map.centerLng}
                onChange={(e) => updateMapSettings('centerLng', parseFloat(e.target.value))}
                margin="normal"
                inputProps={{ step: 0.000001 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Default Base Layer</InputLabel>
                <Select
                  value={settings.map.defaultBaseLayer}
                  onChange={(e) => updateMapSettings('defaultBaseLayer', e.target.value)}
                >
                  <MenuItem value="osm">OpenStreetMap</MenuItem>
                  <MenuItem value="satellite">Satellite</MenuItem>
                  <MenuItem value="terrain">Terrain</MenuItem>
                </Select>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.map.showGrid}
                    onChange={(e) => updateMapSettings('showGrid', e.target.checked)}
                  />
                }
                label="Show Grid"
                sx={{ mt: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.map.showCoordinates}
                    onChange={(e) => updateMapSettings('showCoordinates', e.target.checked)}
                  />
                }
                label="Show Coordinates"
              />
              
              {settings.map.showGrid && (
                <TextField
                  fullWidth
                  type="number"
                  label="Grid Size (meters)"
                  value={settings.map.gridSize}
                  onChange={(e) => updateMapSettings('gridSize', parseInt(e.target.value))}
                  margin="normal"
                />
              )}
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimelineIcon /> Timeline Settings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Start Time"
                value={settings.timeline.startTime.toISOString().slice(0, 16)}
                onChange={(e) => updateTimelineSettings('startTime', new Date(e.target.value))}
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
              
              <TextField
                fullWidth
                type="datetime-local"
                label="End Time"
                value={settings.timeline.endTime.toISOString().slice(0, 16)}
                onChange={(e) => updateTimelineSettings('endTime', new Date(e.target.value))}
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
              
              <TextField
                fullWidth
                type="number"
                label="Time Step (seconds)"
                value={settings.timeline.timeStep}
                onChange={(e) => updateTimelineSettings('timeStep', parseInt(e.target.value))}
                margin="normal"
                helperText="Time interval between simulation steps"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.timeline.autoPlay}
                    onChange={(e) => updateTimelineSettings('autoPlay', e.target.checked)}
                  />
                }
                label="Auto Play on Load"
                sx={{ mt: 2, mb: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.timeline.showEvents}
                    onChange={(e) => updateTimelineSettings('showEvents', e.target.checked)}
                  />
                }
                label="Show Timeline Events"
                sx={{ mb: 2 }}
              />
              
              <Typography variant="body2" gutterBottom>
                Playback Speed: {settings.timeline.playbackSpeed}x
              </Typography>
              <Slider
                value={settings.timeline.playbackSpeed}
                onChange={(_, value) => updateTimelineSettings('playbackSpeed', value)}
                min={0.1}
                max={10}
                step={0.1}
                marks={[
                  { value: 0.5, label: '0.5x' },
                  { value: 1, label: '1x' },
                  { value: 2, label: '2x' },
                  { value: 5, label: '5x' }
                ]}
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VisibilityIcon /> Display Settings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.display.showUnitLabels}
                    onChange={(e) => updateDisplaySettings('showUnitLabels', e.target.checked)}
                  />
                }
                label="Show Unit Labels"
                sx={{ mb: 1 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.display.showUnitIcons}
                    onChange={(e) => updateDisplaySettings('showUnitIcons', e.target.checked)}
                  />
                }
                label="Show Unit Icons"
                sx={{ mb: 1 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.display.showTrails}
                    onChange={(e) => updateDisplaySettings('showTrails', e.target.checked)}
                  />
                }
                label="Show Unit Trails"
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="body2" gutterBottom>
                Symbol Size: {settings.display.symbolSize}px
              </Typography>
              <Slider
                value={settings.display.symbolSize}
                onChange={(_, value) => updateDisplaySettings('symbolSize', value)}
                min={16}
                max={64}
                sx={{ mb: 2 }}
              />
              
              <Typography variant="body2" gutterBottom>
                Label Size: {settings.display.labelSize}px
              </Typography>
              <Slider
                value={settings.display.labelSize}
                onChange={(_, value) => updateDisplaySettings('labelSize', value)}
                min={8}
                max={24}
                sx={{ mb: 2 }}
              />
              
              {settings.display.showTrails && (
                <>
                  <Typography variant="body2" gutterBottom>
                    Trail Length: {settings.display.trailLength} points
                  </Typography>
                  <Slider
                    value={settings.display.trailLength}
                    onChange={(_, value) => updateDisplaySettings('trailLength', value)}
                    min={5}
                    max={50}
                  />
                </>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SpeedIcon /> Simulation Settings
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.simulation.enablePhysics}
                    onChange={(e) => updateSimulationSettings('enablePhysics', e.target.checked)}
                  />
                }
                label="Enable Physics Simulation"
                sx={{ mb: 1 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.simulation.collisionDetection}
                    onChange={(e) => updateSimulationSettings('collisionDetection', e.target.checked)}
                  />
                }
                label="Collision Detection"
                sx={{ mb: 1 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.simulation.weatherEffects}
                    onChange={(e) => updateSimulationSettings('weatherEffects', e.target.checked)}
                  />
                }
                label="Weather Effects"
                sx={{ mb: 1 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.simulation.terrainEffects}
                    onChange={(e) => updateSimulationSettings('terrainEffects', e.target.checked)}
                  />
                }
                label="Terrain Effects"
                sx={{ mb: 1 }}
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <Typography variant="subtitle1" gutterBottom>Export Settings</Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Export Format</InputLabel>
                <Select
                  value={settings.export.format}
                  onChange={(e) => updateExportSettings('format', e.target.value)}
                >
                  <MenuItem value="json">JSON</MenuItem>
                  <MenuItem value="kml">KML</MenuItem>
                  <MenuItem value="geojson">GeoJSON</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.export.includeMetadata}
                    onChange={(e) => updateExportSettings('includeMetadata', e.target.checked)}
                  />
                }
                label="Include Metadata"
                sx={{ mt: 2, mb: 1 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.export.compressData}
                    onChange={(e) => updateExportSettings('compressData', e.target.checked)}
                  />
                }
                label="Compress Data"
                sx={{ mb: 1 }}
              />
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleReset} startIcon={<RestoreIcon />}>
          Reset to Defaults
        </Button>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScenarioSettingsDialog;