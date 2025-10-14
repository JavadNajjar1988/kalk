import React, { useMemo, useState } from 'react';
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
  useMediaQuery,
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const mapLayers = useAppSelector(selectMapLayers);
  const softSurface = useMemo(() => {
    const primary = (theme.palette.primary.main || '#4a90e2').toLowerCase();
    const hex = primary.replace('#', '');
    if (hex.includes('10b981') || hex.includes('4caf50') || hex.includes('2e7d32')) return '#f0f4f3';
    if (hex.includes('4a90e2') || hex.includes('1976d2') || hex.includes('2196f3')) return '#f0f4f8';
    if (hex.includes('ef4444') || hex.includes('f44336') || hex.includes('d32f2f')) return '#fbf1f0';
    if (hex.includes('6b21a8') || hex.includes('9c27b0') || hex.includes('673ab7')) return '#22262d';
    if (hex.includes('f59e0b') || hex.includes('ff9800') || hex.includes('fb8c00')) return '#fbf1f1';

    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    const hexToRgb = (h: string) => {
      const normalized = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
      const r = parseInt(normalized.substring(0, 2), 16);
      const g = parseInt(normalized.substring(2, 4), 16);
      const b = parseInt(normalized.substring(4, 6), 16);
      return { r, g, b };
    };
    const rgbToHex = (r: number, g: number, b: number) =>
      `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
    const blendWithWhite = (h: string, primaryWeight = 0.1) => {
      const { r, g, b } = hexToRgb(h);
      const wr = 255, wg = 255, wb = 255;
      const w = 1 - primaryWeight;
      const br = wr * w + r * primaryWeight;
      const bg = wg * w + g * primaryWeight;
      const bb = wb * w + b * primaryWeight;
      return rgbToHex(br, bg, bb);
    };
    if (/^[0-9a-f]{3,6}$/.test(hex)) {
      return blendWithWhite(hex, 0.1);
    }
    try {
      const fallback = (theme.palette.primary.light || '#90caf9').toLowerCase().replace('#', '');
      return blendWithWhite(fallback, 0.08);
    } catch {
      return '#f5f7fa';
    }
  }, [theme.palette.primary.main, theme.palette.primary.light]);
  const inputRootSx = useMemo(() => ({
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(8px)',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    '& fieldset': {
      borderColor: alpha(theme.palette.primary.main, 0.2),
    },
    '&:hover fieldset': {
      borderColor: alpha(theme.palette.primary.main, 0.35),
    },
    '&.Mui-focused fieldset': {
      borderWidth: 2,
      borderColor: alpha(theme.palette.primary.main, 0.6),
      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
    },
  }), [theme.palette.primary.main]);
  const textFieldSx = useMemo(() => ({
    '& .MuiOutlinedInput-root': {
      ...inputRootSx,
      borderRadius: 2,
    },
  }), [inputRootSx]);
  const backdropSx = useMemo(
    () => ({
      backgroundColor: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(6px)',
    }),
    []
  );
  
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
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        slotProps={{
          backdrop: {
            sx: backdropSx,
          },
        }}
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: isMobile ? 0 : '20px',
            backgroundColor: (theme) => alpha(theme.palette.primary.light, 0.1),
            backdropFilter: 'blur(20px)',
            border: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
            boxShadow: (theme) => `0 20px 60px ${alpha(theme.palette.primary.light, 0.3)}, inset 0 1px 0 rgba(255, 255, 255, 0.8)`,
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: softSurface,
            borderBottom: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
            textAlign: 'center',
            py: isMobile ? 2 : 3,
            px: isMobile ? 2 : 3,
          }}
        >
          <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
            {dialogMode === 'server'
              ? t('resources.maps.dialog.addFromServerTitle')
              : t('resources.maps.dialog.uploadFileTitle')}
          </Typography>
        </DialogTitle>
        <DialogContent
          sx={{
            backgroundColor: softSurface,
            p: isMobile ? 2 : 3,
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('resources.maps.dialog.layerNameLabel')}
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                sx={textFieldSx}
              />
            </Grid>
            
            {dialogMode === 'server' ? (
              <>
                <Grid item xs={12}>
                  <FormControl
                    fullWidth
                    sx={{ '& .MuiOutlinedInput-root': inputRootSx }}
                  >
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
                    sx={textFieldSx}
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
                      sx={textFieldSx}
                    />
                  </Grid>
                )}
              </>
            ) : (
              <>
                <Grid item xs={12}>
                  <FormControl
                    fullWidth
                    sx={{ '& .MuiOutlinedInput-root': inputRootSx }}
                  >
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
                    sx={{
                      borderRadius: '12px',
                      backgroundColor: alpha(theme.palette.primary.light, 0.12),
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.light, 0.18),
                        borderColor: alpha(theme.palette.primary.main, 0.45),
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                      },
                    }}
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
        <DialogActions
          sx={{
            backgroundColor: softSurface,
            borderTop: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
            p: isMobile ? 2 : 3,
            gap: 1,
            justifyContent: 'flex-end',
          }}
        >
          <Button
            onClick={handleCloseDialog}
            sx={{
              borderRadius: '12px',
              px: isMobile ? 2 : 3,
              py: isMobile ? 1 : 1.5,
              backgroundColor: 'rgba(148, 163, 184, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              color: '#64748B',
              fontWeight: 600,
              fontSize: isMobile ? '0.8rem' : 'inherit',
              '&:hover': {
                backgroundColor: 'rgba(148, 163, 184, 0.15)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(148, 163, 184, 0.2)',
              },
            }}
          >
            {t('resources.maps.dialog.cancelButton')}
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.name}
            sx={{
              borderRadius: '12px',
              px: isMobile ? 2 : 4,
              py: isMobile ? 1 : 1.5,
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              fontWeight: 600,
              border: '2px solid rgba(255, 255, 255, 0.3)',
              boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
              fontSize: isMobile ? '0.8rem' : 'inherit',
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
              },
              '&:disabled': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                color: 'rgba(255,255,255,0.7)',
                transform: 'none',
                boxShadow: 'none',
              },
            }}
          >
            {dialogMode === 'server'
              ? t('resources.maps.dialog.addButton')
              : t('resources.maps.dialog.uploadButton')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MapsTab;
