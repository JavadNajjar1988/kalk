/**
 * Scenario Layers Panel
 * پنل مدیریت لایه‌های نقشه با Material-UI
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Switch,
  IconButton,
  Slider,
  Collapse,
  Divider,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Chip,
} from '@mui/material';
import {
  Layers as LayersIcon,
  Map as MapIcon,
  Satellite as SatelliteIcon,
  Terrain as TerrainIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ExpandLess,
  ExpandMore,
  Add as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useOrbatData, useOrbatCommands } from '../../../orbat-integration';
import { MapLayer, LayerType } from '../../../../types';



export interface ScenarioLayersPanelProps {
  scenario: any;
  onClose?: () => void;
}

export const ScenarioLayersPanel: React.FC<ScenarioLayersPanelProps> = ({
  scenario,
  onClose,
}) => {
  const [layers, setLayers] = useState<MapLayer[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['base', 'overlay']);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [contextMenuAnchor, setContextMenuAnchor] = useState<null | HTMLElement>(null);
  const [contextMenuLayer, setContextMenuLayer] = useState<string | null>(null);
  const [addLayerDialog, setAddLayerDialog] = useState(false);
  const [editLayerDialog, setEditLayerDialog] = useState(false);
  const [newLayer, setNewLayer] = useState<Partial<MapLayer>>({});

  // ORBAT integration
  const data = useOrbatData();
  const commands = useOrbatCommands();

  // Load layers data
  useEffect(() => {
    const loadLayers = async () => {
      try {
        // Load map layers - placeholder implementation
        // TODO: Implement getMapLayers in the ORBAT data service
        const layersData: MapLayer[] = [
          {
            id: 'base-map',
            name: 'نقشه پایه',
            type: LayerType.BASE_MAP,
            visible: true,
            opacity: 1,
            zIndex: 0,
            url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'satellite',
            name: 'تصاویر ماهواره‌ای',
            type: LayerType.OVERLAY,
            visible: false,
            opacity: 0.8,
            zIndex: 1,
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        setLayers(layersData);
      } catch (error) {
        console.error('Failed to load layers:', error);
        // Fallback to mock data
        setMockLayers();
      }
    };

    loadLayers();
  }, [scenario?.id, data]);

  const setMockLayers = () => {
    const mockLayers: MapLayer[] = [
      {
        id: 'osm-base',
        name: 'OpenStreetMap',
        type: LayerType.BASE_MAP,
        visible: true,
        opacity: 1,
        zIndex: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'satellite',
        name: 'تصاویر ماهواره‌ای',
        type: LayerType.BASE_MAP,
        visible: false,
        opacity: 1,
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        zIndex: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'terrain',
        name: 'نقشه توپوگرافی',
        type: LayerType.OVERLAY,
        visible: false,
        opacity: 0.7,
        zIndex: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'units',
        name: 'واحدهای نظامی',
        type: LayerType.TACTICAL,
        visible: true,
        opacity: 1,
        zIndex: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'boundaries',
        name: 'مرزها',
        type: LayerType.OVERLAY,
        visible: true,
        opacity: 0.8,
        zIndex: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
    ];
    setLayers(mockLayers);
  };

  const groupLayers = (layers: MapLayer[]) => {
    return {
      base: layers.filter(layer => layer.type === LayerType.BASE_MAP),
      overlay: layers.filter(layer => layer.type === LayerType.OVERLAY),
      feature: layers.filter(layer => layer.type === LayerType.TACTICAL),
    };
  };

  const handleToggleGroup = (group: string) => {
    setExpandedGroups(prev => 
      prev.includes(group) 
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  const handleLayerToggle = async (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    try {
      await commands.toggleLayer(layerId);
      setLayers(prev => prev.map(l => 
        l.id === layerId ? { ...l, visible: !l.visible } : l
      ));
    } catch (error) {
      console.error('Failed to toggle layer:', error);
      // Fallback to local state
      setLayers(prev => prev.map(l => 
        l.id === layerId ? { ...l, visible: !l.visible } : l
      ));
    }
  };

  const handleOpacityChange = async (layerId: string, opacity: number) => {
    try {
      // TODO: Implement setLayerOpacity in ORBAT commands
      // await commands.setLayerOpacity(layerId, opacity);
      console.log('Setting layer opacity:', layerId, opacity);
      setLayers(prev => prev.map(l => 
        l.id === layerId ? { ...l, opacity } : l
      ));
    } catch (error) {
      console.error('Failed to change opacity:', error);
      // Fallback to local state
      setLayers(prev => prev.map(l => 
        l.id === layerId ? { ...l, opacity } : l
      ));
    }
  };

  const handleContextMenu = (event: React.MouseEvent, layerId: string) => {
    event.preventDefault();
    setContextMenuAnchor(event.currentTarget as HTMLElement);
    setContextMenuLayer(layerId);
  };

  const handleContextMenuClose = () => {
    setContextMenuAnchor(null);
    setContextMenuLayer(null);
  };

  const handleAddLayer = () => {
    setNewLayer({
      name: '',
      type: LayerType.OVERLAY,
      visible: true,
      opacity: 1,
      zIndex: 1,
    });
    setAddLayerDialog(true);
  };

  const handleEditLayer = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      setNewLayer(layer);
      setEditLayerDialog(true);
    }
    handleContextMenuClose();
  };

  const handleDeleteLayer = async (layerId: string) => {
    try {
      // TODO: Implement removeMapLayer in ORBAT commands
      // await commands.removeMapLayer(layerId);
      console.log('Removing layer:', layerId);
      setLayers(prev => prev.filter(l => l.id !== layerId));
    } catch (error) {
      console.error('Failed to delete layer:', error);
    }
    handleContextMenuClose();
  };

  const handleSaveLayer = async () => {
    try {
      if (editLayerDialog && newLayer.id) {
        // Update existing layer
        // TODO: Implement updateMapLayer in ORBAT commands
        // await commands.updateMapLayer(newLayer.id, newLayer);
        console.log('Updating layer:', newLayer);
        setLayers(prev => prev.map(l => 
          l.id === newLayer.id ? { ...l, ...newLayer } : l
        ));
      } else {
        // Add new layer
        const layerId = `layer-${Date.now()}`;
        const layer = { ...newLayer, id: layerId } as MapLayer;
      // TODO: Implement addMapLayer in ORBAT commands
      // await commands.addMapLayer(layer);
      console.log('Adding layer:', layer);
        setLayers(prev => [...prev, layer]);
      }
    } catch (error) {
      console.error('Failed to save layer:', error);
    }
    
    setAddLayerDialog(false);
    setEditLayerDialog(false);
    setNewLayer({});
  };

  const getLayerIcon = (layer: MapLayer) => {
    if (layer.name.includes('ماهواره')) {
      return <SatelliteIcon />;
    } else if (layer.type === LayerType.TACTICAL) {
      return <LayersIcon />;
    } else {
      return <MapIcon />;
    }
  };

  const getLayerTypeLabel = (type: string) => {
    switch (type) {
      case 'base': return 'نقشه پایه';
      case 'overlay': return 'لایه رویی';
      case 'feature': return 'ویژگی‌ها';
      default: return type;
    }
  };

  const groupedLayers = groupLayers(layers);

  return (
    <Paper
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      {/* Header */}
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider', 
        px: 2, 
        py: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LayersIcon />
          لایه‌های نقشه
        </Typography>
        <IconButton size="small" onClick={handleAddLayer}>
          <AddIcon />
        </IconButton>
      </Box>

      {/* Layers List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {Object.entries(groupedLayers).map(([groupType, groupLayers]) => (
          <Box key={groupType}>
            {/* Group Header */}
            <ListItemButton onClick={() => handleToggleGroup(groupType)}>
              <ListItemText
                primary={getLayerTypeLabel(groupType)}
                primaryTypographyProps={{ fontWeight: 'medium' }}
              />
              {expandedGroups.includes(groupType) ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>

            {/* Group Layers */}
            <Collapse in={expandedGroups.includes(groupType)}>
              <List dense>
                {groupLayers.map((layer) => (
                  <ListItem
                    key={layer.id}
                    sx={{ 
                      pl: 4,
                      bgcolor: selectedLayer === layer.id ? 'action.selected' : 'transparent'
                    }}
                    onContextMenu={(e) => handleContextMenu(e, layer.id)}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {getLayerIcon(layer)}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={layer.name}
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="caption">شفافیت:</Typography>
                            <Slider
                              size="small"
                              value={layer.opacity}
                              min={0}
                              max={1}
                              step={0.1}
                              onChange={(_, value) => handleOpacityChange(layer.id, value as number)}
                              sx={{ width: 60 }}
                            />
                            <Typography variant="caption">
                              {Math.round(layer.opacity * 100)}%
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Switch
                        edge="end"
                        checked={layer.visible}
                        onChange={() => handleLayerToggle(layer.id)}
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => handleContextMenu(e, layer.id)}
                      >
                        <MoreIcon />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Collapse>
            <Divider />
          </Box>
        ))}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={contextMenuAnchor}
        open={Boolean(contextMenuAnchor)}
        onClose={handleContextMenuClose}
      >
        <MenuItem onClick={() => handleEditLayer(contextMenuLayer!)}>
          <ListItemIcon><EditIcon /></ListItemIcon>
          ویرایش
        </MenuItem>
        <MenuItem onClick={() => handleDeleteLayer(contextMenuLayer!)}>
          <ListItemIcon><DeleteIcon /></ListItemIcon>
          حذف
        </MenuItem>
      </Menu>

      {/* Add/Edit Layer Dialog */}
      <Dialog 
        open={addLayerDialog || editLayerDialog} 
        onClose={() => { setAddLayerDialog(false); setEditLayerDialog(false); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editLayerDialog ? 'ویرایش لایه' : 'افزودن لایه جدید'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="نام لایه"
              value={newLayer.name || ''}
              onChange={(e) => setNewLayer(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
            />
            
            <FormControl fullWidth>
              <InputLabel>نوع لایه</InputLabel>
              <Select
                value={newLayer.type || LayerType.OVERLAY}
                onChange={(e) => setNewLayer(prev => ({ ...prev, type: e.target.value as any }))}
              >
                <MenuItem value={LayerType.BASE_MAP}>نقشه پایه</MenuItem>
                <MenuItem value={LayerType.OVERLAY}>لایه رویی</MenuItem>
                <MenuItem value={LayerType.TACTICAL}>ویژگی‌ها</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="URL"
              value={newLayer.url || ''}
              onChange={(e) => setNewLayer(prev => ({ ...prev, url: e.target.value }))}
              fullWidth
              placeholder="https://example.com/{z}/{x}/{y}.png"
            />


          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAddLayerDialog(false); setEditLayerDialog(false); }}>
            لغو
          </Button>
          <Button onClick={handleSaveLayer} variant="contained">
            ذخیره
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};