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
  Slider,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Place as PlaceIcon,
  Palette as PaletteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useOrbatIntegration } from '../../hooks/useOrbatIntegration';

interface FeatureDetailsDialogProps {
  open: boolean;
  featureId: string | null;
  onClose: () => void;
  onSave?: (featureData: FeatureData) => void;
  readonly?: boolean;
}

interface FeatureData {
  id: string;
  name: string;
  type: FeatureType;
  description: string;
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon';
    coordinates: number[] | number[][] | number[][][];
  };
  properties: {
    visible: boolean;
    color: string;
    fillColor?: string;
    strokeWidth: number;
    opacity: number;
    fillOpacity?: number;
    zIndex: number;
  };
  metadata: {
    created: Date;
    modified: Date;
    author: string;
  };
  tags: string[];
  notes: string;
}

type FeatureType = 
  | 'unit_position'
  | 'objective'
  | 'boundary'
  | 'route'
  | 'obstacle'
  | 'building'
  | 'terrain'
  | 'annotation'
  | 'area_of_interest';

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

const FEATURE_TYPES: { value: FeatureType; label: string }[] = [
  { value: 'unit_position', label: 'Unit Position' },
  { value: 'objective', label: 'Objective' },
  { value: 'boundary', label: 'Boundary' },
  { value: 'route', label: 'Route' },
  { value: 'obstacle', label: 'Obstacle' },
  { value: 'building', label: 'Building' },
  { value: 'terrain', label: 'Terrain Feature' },
  { value: 'annotation', label: 'Annotation' },
  { value: 'area_of_interest', label: 'Area of Interest' }
];

const PRESET_COLORS = [
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#FF8000', '#8000FF', '#0080FF', '#80FF00', '#FF0080', '#00FF80'
];

const FeatureDetailsDialog: React.FC<FeatureDetailsDialogProps> = ({
  open,
  featureId,
  onClose,
  onSave,
  readonly = false
}) => {
  const [feature, setFeature] = useState<FeatureData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const { orbatInstance } = useOrbatIntegration();

  useEffect(() => {
    if (open && featureId) {
      loadFeatureData();
    }
  }, [open, featureId]);

  const loadFeatureData = async () => {
    if (!featureId || !orbatInstance) return;
    
    setLoading(true);
    try {
      const featureData = await orbatInstance.getFeatureData(featureId);
      setFeature(featureData);
    } catch (error) {
      console.error('Failed to load feature data:', error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!feature) return;
    
    try {
      const updatedFeature = {
        ...feature,
        metadata: {
          ...feature.metadata,
          modified: new Date()
        }
      };
      
      if (orbatInstance) {
        await orbatInstance.updateFeature(feature.id, updatedFeature);
      }
      onSave?.(updatedFeature);
      setEditMode(false);
    } catch (error) {
      console.error('Failed to save feature:', error);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    loadFeatureData(); // Reload original data
  };

  const handleFieldChange = (field: keyof FeatureData, value: any) => {
    if (!feature) return;
    setFeature({ ...feature, [field]: value });
  };

  const handlePropertyChange = (property: string, value: any) => {
    if (!feature) return;
    setFeature({
      ...feature,
      properties: {
        ...feature.properties,
        [property]: value
      }
    });
  };

  const formatCoordinates = (geometry: FeatureData['geometry']) => {
    switch (geometry.type) {
      case 'Point':
        const [lng, lat] = geometry.coordinates as number[];
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      case 'LineString':
        const coords = geometry.coordinates as number[][];
        return `${coords.length} points`;
      case 'Polygon':
        const rings = geometry.coordinates as number[][][];
        const totalPoints = rings.reduce((sum, ring) => sum + ring.length, 0);
        return `${totalPoints} points, ${rings.length} ring(s)`;
      default:
        return 'Unknown geometry';
    }
  };

  if (!feature) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Typography>Loading feature data...</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PlaceIcon />
            <Typography variant="h6">{feature.name}</Typography>
            <Chip 
              label={FEATURE_TYPES.find(t => t.value === feature.type)?.label || feature.type} 
              size="small" 
            />
          </Box>
          <Box>
            {!readonly && !editMode && (
              <IconButton onClick={() => setEditMode(true)}>
                <EditIcon />
              </IconButton>
            )}
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="General" />
          <Tab label="Appearance" />
          <Tab label="Geometry" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Feature Name"
                value={feature.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                disabled={!editMode}
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Feature Type</InputLabel>
                <Select
                  value={feature.type}
                  onChange={(e) => handleFieldChange('type', e.target.value)}
                  disabled={!editMode}
                >
                  {FEATURE_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={feature.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                disabled={!editMode}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Metadata</Typography>
                <Typography variant="body2" color="text.secondary">
                  Created: {feature.metadata.created.toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Modified: {feature.metadata.modified.toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Author: {feature.metadata.author}
                </Typography>
              </Box>
              <TextField
                fullWidth
                label="Tags (comma separated)"
                value={feature.tags.join(', ')}
                onChange={(e) => handleFieldChange('tags', e.target.value.split(',').map(tag => tag.trim()))}
                disabled={!editMode}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Notes"
                value={feature.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                disabled={!editMode}
                margin="normal"
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={feature.properties.visible}
                    onChange={(e) => handlePropertyChange('visible', e.target.checked)}
                    disabled={!editMode}
                  />
                }
                label="Visible on map"
              />
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Stroke Color
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {PRESET_COLORS.map((color) => (
                    <Box
                      key={color}
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: color,
                        border: feature.properties.color === color ? 2 : 1,
                        borderColor: feature.properties.color === color ? 'primary.main' : 'divider',
                        borderRadius: 1,
                        cursor: editMode ? 'pointer' : 'default'
                      }}
                      onClick={() => editMode && handlePropertyChange('color', color)}
                    />
                  ))}
                </Box>
                <TextField
                  size="small"
                  label="Custom Color"
                  value={feature.properties.color}
                  onChange={(e) => handlePropertyChange('color', e.target.value)}
                  disabled={!editMode}
                />
              </Box>

              {feature.geometry.type === 'Polygon' && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Fill Color
                  </Typography>
                  <TextField
                    size="small"
                    label="Fill Color"
                    value={feature.properties.fillColor || ''}
                    onChange={(e) => handlePropertyChange('fillColor', e.target.value)}
                    disabled={!editMode}
                  />
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Stroke Width: {feature.properties.strokeWidth}px
              </Typography>
              <Slider
                value={feature.properties.strokeWidth}
                onChange={(_, value) => handlePropertyChange('strokeWidth', value)}
                min={1}
                max={10}
                disabled={!editMode}
                sx={{ mb: 3 }}
              />

              <Typography variant="subtitle2" gutterBottom>
                Opacity: {Math.round(feature.properties.opacity * 100)}%
              </Typography>
              <Slider
                value={feature.properties.opacity}
                onChange={(_, value) => handlePropertyChange('opacity', value)}
                min={0}
                max={1}
                step={0.1}
                disabled={!editMode}
                sx={{ mb: 3 }}
              />

              {feature.geometry.type === 'Polygon' && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Fill Opacity: {Math.round((feature.properties.fillOpacity || 0.3) * 100)}%
                  </Typography>
                  <Slider
                    value={feature.properties.fillOpacity || 0.3}
                    onChange={(_, value) => handlePropertyChange('fillOpacity', value)}
                    min={0}
                    max={1}
                    step={0.1}
                    disabled={!editMode}
                    sx={{ mb: 3 }}
                  />
                </>
              )}

              <Typography variant="subtitle2" gutterBottom>
                Z-Index: {feature.properties.zIndex}
              </Typography>
              <Slider
                value={feature.properties.zIndex}
                onChange={(_, value) => handlePropertyChange('zIndex', value)}
                min={0}
                max={100}
                disabled={!editMode}
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Geometry Type
              </Typography>
              <Chip label={feature.geometry.type} sx={{ mb: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Coordinates
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatCoordinates(feature.geometry)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Geometry Details
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Type: {feature.geometry.type}
                </Typography>
                {feature.geometry.type === 'Point' && (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      Latitude: {(feature.geometry.coordinates as number[])[1].toFixed(6)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Longitude: {(feature.geometry.coordinates as number[])[0].toFixed(6)}
                    </Typography>
                  </>
                )}
                {feature.geometry.type === 'LineString' && (
                  <Typography variant="body2" color="text.secondary">
                    Points: {(feature.geometry.coordinates as number[][]).length}
                  </Typography>
                )}
                {feature.geometry.type === 'Polygon' && (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      Rings: {(feature.geometry.coordinates as number[][][]).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Points: {(feature.geometry.coordinates as number[][][]).reduce((sum, ring) => sum + ring.length, 0)}
                    </Typography>
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        {editMode ? (
          <>
            <Button onClick={handleCancel} startIcon={<CancelIcon />}>
              Cancel
            </Button>
            <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>
              Save Changes
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>Close</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default FeatureDetailsDialog;