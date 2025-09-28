import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  Slider,
  useTheme,
  alpha,
  Paper,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Delete,
  CloudUpload,
  Map as MapIcon,
  Layers,
  Visibility,
  VisibilityOff,
  Settings,
  Public,
  Download,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectMapLayers,
  addMapLayer,
  toggleMapLayer,
  updateMapLayer,
  deleteMapLayer,
} from '@/store/slices/orbatSlice';
import type { MapLayer } from '@/types/orbat';
import { useTranslation } from '@/hooks/useTranslation';

const MapsTab: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const mapLayers = useAppSelector(selectMapLayers);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'server' | 'upload'>('server');
  const [selectedLayer, setSelectedLayer] = useState<MapLayer | null>(null);
  const [formData, setFormData] = useState<Partial<MapLayer>>({
    name: '',
    type: 'xyz',
    url: '',
    visible: true,
    opacity: 1,
  });

  const handleOpenDialog = (mode: 'server' | 'upload') => {
    setDialogMode(mode);
    setFormData({
      name: '',
      type: mode === 'server' ? 'xyz' : 'raster',
      url: '',
      visible: true,
      opacity: 1,
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({});
  };

  const handleSave = () => {
    dispatch(addMapLayer(formData as Omit<MapLayer, 'id'>));
    handleCloseDialog();
  };

  const handleToggleVisibility = (id: string) => {
    dispatch(toggleMapLayer(id));
  };

  const handleOpacityChange = (layer: MapLayer, newOpacity: number) => {
    dispatch(updateMapLayer({
      ...layer,
      opacity: newOpacity,
    }));
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('resources.maps.deleteConfirm'))) {
      dispatch(deleteMapLayer(id));
    }
  };

  // گروه‌بندی لایه‌ها بر اساس نوع
  const serverLayers = mapLayers.filter(l => ['wms', 'wmts', 'xyz', 'osm'].includes(l.type));
  const uploadedLayers = mapLayers.filter(l => ['vector', 'raster'].includes(l.type));

  return (
    <Box>
      <Grid container spacing={3}>
        {/* کارت لایه‌های سرور */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={t('resources.maps.serverLayersTitle')}
              avatar={<Public color="primary" />}
              action={
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Add />}
                  onClick={() => handleOpenDialog('server')}
                >
                  {t('resources.maps.addFromServerButton')}
                </Button>
              }
            />
            <CardContent>
              {serverLayers.length > 0 ? (
                <List>
                  {serverLayers.map((layer, index) => (
                    <React.Fragment key={layer.id}>
                      <ListItem>
                        <ListItemIcon>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleVisibility(layer.id)}
                          >
                            {layer.visible ? <Visibility /> : <VisibilityOff />}
                          </IconButton>
                        </ListItemIcon>
                        <ListItemText
                          primary={layer.name}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                {t('resources.maps.type')}: {layer.type.toUpperCase()}
                              </Typography>
                              <Typography variant="caption" display="block" noWrap>
                                {t('resources.maps.url')}: {layer.url}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Tooltip title={t('resources.maps.opacityTooltip')}>
                              <Box sx={{ width: 100 }}>
                                <Slider
                                  size="small"
                                  value={layer.opacity}
                                  onChange={(_, value) => handleOpacityChange(layer, value as number)}
                                  min={0}
                                  max={1}
                                  step={0.1}
                                  valueLabelDisplay="auto"
                                  valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                                />
                              </Box>
                            </Tooltip>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(layer.id)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < serverLayers.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <MapIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">
                    {t('resources.maps.noServerLayers')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* کارت لایه‌های آپلود شده */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={t('resources.maps.uploadedLayersTitle')}
              avatar={<CloudUpload color="primary" />}
              action={
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Add />}
                  onClick={() => handleOpenDialog('upload')}
                >
                  {t('resources.maps.uploadFileButton')}
                </Button>
              }
            />
            <CardContent>
              {uploadedLayers.length > 0 ? (
                <List>
                  {uploadedLayers.map((layer, index) => (
                    <React.Fragment key={layer.id}>
                      <ListItem>
                        <ListItemIcon>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleVisibility(layer.id)}
                          >
                            {layer.visible ? <Visibility /> : <VisibilityOff />}
                          </IconButton>
                        </ListItemIcon>
                        <ListItemText
                          primary={layer.name}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                {t('resources.maps.type')}: {layer.type === 'vector' ? t('resources.maps.vector') : t('resources.maps.raster')}
                              </Typography>
                              <Typography variant="caption" display="block">
                                {t('resources.maps.format')}: {layer.format || t('resources.maps.unknownFormat')}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Tooltip title={t('resources.maps.opacityTooltip')}>
                              <Box sx={{ width: 100 }}>
                                <Slider
                                  size="small"
                                  value={layer.opacity}
                                  onChange={(_, value) => handleOpacityChange(layer, value as number)}
                                  min={0}
                                  max={1}
                                  step={0.1}
                                  valueLabelDisplay="auto"
                                  valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                                />
                              </Box>
                            </Tooltip>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(layer.id)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < uploadedLayers.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CloudUpload sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">
                    {t('resources.maps.noUploadedLayers')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* آمار و اطلاعات */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <Layers sx={{ verticalAlign: 'middle', mr: 1 }} />
              {t('resources.maps.summaryTitle')}
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary">
                    {mapLayers.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('resources.maps.totalLayers')}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="success.main">
                    {mapLayers.filter(l => l.visible).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('resources.maps.activeLayers')}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="info.main">
                    {serverLayers.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('resources.maps.serverLayers')}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* دیالوگ افزودن لایه */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'server' ? t('resources.maps.dialog.addFromServerTitle') : t('resources.maps.dialog.uploadFileTitle')}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('resources.maps.dialog.layerNameLabel')}
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            
            {dialogMode === 'server' ? (
              <>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>{t('resources.maps.dialog.serviceTypeLabel')}</InputLabel>
                    <Select
                      value={formData.type || 'xyz'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      label={t('resources.maps.dialog.serviceTypeLabel')}
                    >
                      <MenuItem value="wms">WMS</MenuItem>
                      <MenuItem value="wmts">WMTS</MenuItem>
                      <MenuItem value="xyz">XYZ Tiles</MenuItem>
                      <MenuItem value="osm">OpenStreetMap</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('resources.maps.dialog.serverUrlLabel')}
                    value={formData.url || ''}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://example.com/geoserver/wms"
                  />
                </Grid>
                {formData.type === 'wms' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('resources.maps.dialog.layersLabel')}
                      value={formData.layers || ''}
                      onChange={(e) => setFormData({ ...formData, layers: e.target.value })}
                      placeholder="layer1,layer2"
                    />
                  </Grid>
                )}
              </>
            ) : (
              <>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>{t('resources.maps.dialog.fileTypeLabel')}</InputLabel>
                    <Select
                      value={formData.format || ''}
                      onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                      label={t('resources.maps.dialog.fileTypeLabel')}
                    >
                      <MenuItem value="geojson">GeoJSON</MenuItem>
                      <MenuItem value="kml">KML</MenuItem>
                      <MenuItem value="gpx">GPX</MenuItem>
                      <MenuItem value="shapefile">Shapefile</MenuItem>
                      <MenuItem value="geotiff">GeoTIFF</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUpload />}
                    fullWidth
                  >
                    {t('resources.maps.dialog.selectFileButton')}
                    <input
                      type="file"
                      hidden
                      accept=".geojson,.json,.kml,.gpx,.shp,.tif,.tiff"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFormData({ ...formData, file: e.target.files[0] });
                        }
                      }}
                    />
                  </Button>
                  {formData.file && (
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      {t('resources.maps.dialog.selectedFile')}: {formData.file.name}
                    </Typography>
                  )}
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('resources.maps.dialog.cancelButton')}</Button>
          <Button onClick={handleSave} variant="contained" disabled={!formData.name}>
            {dialogMode === 'server' ? t('resources.maps.dialog.addButton') : t('resources.maps.dialog.uploadButton')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MapsTab;
