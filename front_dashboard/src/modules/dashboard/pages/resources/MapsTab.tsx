import React, { useState, useEffect, useMemo } from 'react';
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
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectMapLayers,
  addMapLayer,
  toggleMapLayer,
  updateMapLayer,
  deleteMapLayer,
} from '@/store/slices/orbatSlice';
import {
  setActiveOfflineMap,
  selectActiveOfflineMap,
} from '@/store/slices/mapSlice';
import type { MapLayer } from '@/types/orbat';
import { useTranslation } from '@/hooks/useTranslation';

const resolveApiBase = () => {
  const raw = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
  const trimmed = raw.trim();
  if (trimmed.length > 0) {
    return trimmed.replace(/\/+$/, '');
  }
  return '/api';
};

const resolveTileServerBase = () => {
  const raw = (import.meta.env.VITE_TILESERVER_URL as string | undefined) ?? '';
  const trimmed = raw.trim();
  if (trimmed.length > 0) {
    return trimmed.replace(/\/+$/, '');
  }
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:8480`;
};

const authFetch = async (baseUrl: string, endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('access_token');
  const headers = new Headers(options.headers as HeadersInit | undefined);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(`${baseUrl}${endpoint}`, { ...options, headers });
};

// Interface برای نقشه‌های آفلاین
interface OfflineMap {
  id: number;
  name: string;
  filename: string;
  file_path: string;
  description?: string;
  is_active: boolean;
  file_size?: number;
  created_at: string;
  updated_at?: string;
}

const MapsTab: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const apiBase = useMemo(resolveApiBase, []);
  const tileServerBase = useMemo(resolveTileServerBase, []);
  const mapLayers = useAppSelector(selectMapLayers);
  const activeOfflineMap = useAppSelector(selectActiveOfflineMap);
  
  // State برای نقشه‌های آفلاین
  const [offlineMaps, setOfflineMaps] = useState<OfflineMap[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'server' | 'upload' | 'offline'>('server');
  const [selectedLayer, setSelectedLayer] = useState<MapLayer | null>(null);
  const [formData, setFormData] = useState<Partial<MapLayer>>({
    name: '',
    type: 'xyz',
    url: '',
    visible: true,
    opacity: 1,
  });

  // State برای آپلود نقشه آفلاین
  const [offlineFormData, setOfflineFormData] = useState({
    name: '',
    description: '',
    file: null as File | null,
  });

  // بارگذاری نقشه‌های آفلاین
  const loadOfflineMaps = async () => {
    try {
      setLoading(true);
      const response = await authFetch(apiBase, '/maps');
      if (response.ok) {
        const data = await response.json();
        setOfflineMaps(data.maps || []);
      }
    } catch (error) {
      console.error('خطا در بارگذاری نقشه‌های آفلاین:', error);
    } finally {
      setLoading(false);
    }
  };

  // آپلود نقشه آفلاین
  const uploadOfflineMap = async () => {
    if (!offlineFormData.file || !offlineFormData.name) return;

    try {
      setLoading(true);
      setUploadProgress(0);
      setUploadError(null);

      const formData = new FormData();
      formData.append('file', offlineFormData.file);
      formData.append('name', offlineFormData.name);
      formData.append('description', offlineFormData.description);

      const response = await authFetch(apiBase, '/maps/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await loadOfflineMaps();
        handleCloseDialog();
        setOfflineFormData({ name: '', description: '', file: null });
      } else {
        const error = await response.json();
        setUploadError(error.detail || 'خطا در آپلود فایل');
      }
    } catch (error) {
      setUploadError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // فعال/غیرفعال کردن نقشه آفلاین
  const toggleOfflineMap = async (mapId: number) => {
    try {
      const response = await authFetch(apiBase, `/maps/${mapId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: true }),
      });

      if (response.ok) {
        await loadOfflineMaps();
        
        // نقشه فعال را در mapSlice تنظیم کن
        const activeMap = offlineMaps.find(map => map.id === mapId);
        if (activeMap) {
          dispatch(setActiveOfflineMap({
            id: activeMap.id,
            name: activeMap.name,
            url: `${tileServerBase}/data/${activeMap.filename}/{z}/{x}/{y}.png`
          }));
        }
      }
    } catch (error) {
      console.error('خطا در تغییر وضعیت نقشه:', error);
    }
  };

  // حذف نقشه آفلاین
  const deleteOfflineMap = async (mapId: number) => {
    if (!window.confirm('آیا مطمئن هستید که می‌خواهید این نقشه را حذف کنید؟')) {
      return;
    }

    try {
      const response = await authFetch(apiBase, `/maps/${mapId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadOfflineMaps();
      }
    } catch (error) {
      console.error('خطا در حذف نقشه:', error);
    }
  };

  useEffect(() => {
    loadOfflineMaps();
  }, []);

  const handleOpenDialog = (mode: 'server' | 'upload' | 'offline') => {
    setDialogMode(mode);
    if (mode === 'offline') {
      setOfflineFormData({ name: '', description: '', file: null });
    } else {
      setFormData({
        name: '',
        type: mode === 'server' ? 'xyz' : 'raster',
        url: '',
        visible: true,
        opacity: 1,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({});
    setOfflineFormData({ name: '', description: '', file: null });
    setUploadError(null);
  };

  const handleSave = () => {
    if (dialogMode === 'offline') {
      uploadOfflineMap();
    } else {
      dispatch(addMapLayer(formData as Omit<MapLayer, 'id'>));
      handleCloseDialog();
    }
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
    <Box sx={{ px: 2, pt: 2 }}>
      <Grid container spacing={3}>
        {/* کارت «نقشه‌های آفلاین» */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="نقشه‌های آفلاین"
              avatar={<MapIcon color="primary" />}
              action={
                <Button variant="contained" size="small" startIcon={<Add />} onClick={() => handleOpenDialog('offline')}>
                  آپلود نقشه
                </Button>
              }
              sx={{ pb: 1 }}
            />
            <CardContent sx={{ pt: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip label={`تعداد: ${offlineMaps.length}`} size="small" />
                <Chip label={`فعال: ${offlineMaps.filter(m=>m.is_active).length}`} color="success" size="small" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                از دکمه بالا برای بارگذاری فایل .mbtiles استفاده کنید. لیست کامل در جدول پایین نمایش داده می‌شود.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* کارت لایه‌های سرور */}
        <Grid item xs={12} sm={6} md={4}>
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
              sx={{ pb: 1 }}
            />
            <CardContent sx={{ pt: 1.5 }}>
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
        <Grid item xs={12} sm={6} md={4}>
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
              sx={{ pb: 1 }}
            />
            <CardContent sx={{ pt: 1.5 }}>
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

        {/* جدول نقشه‌های آفلاین */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">لیست نقشه‌های آفلاین</Typography>
            </Box>
            {loading ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <LinearProgress />
                <Typography sx={{ mt: 2 }}>در حال بارگذاری...</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>نام</TableCell>
                      <TableCell>توضیحات</TableCell>
                      <TableCell align="center">اندازه</TableCell>
                      <TableCell align="center">وضعیت</TableCell>
                      <TableCell align="center">عملیات</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {offlineMaps.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">هیچ نقشه آفلاینی یافت نشد</TableCell>
                      </TableRow>
                    ) : (
                      offlineMaps.map((map) => (
                        <TableRow key={map.id} hover>
                          <TableCell>{map.name}</TableCell>
                          <TableCell sx={{ maxWidth: 360 }}>
                            <Typography variant="body2" noWrap>{map.description || '-'}</Typography>
                          </TableCell>
                          <TableCell align="center">{map.file_size ? `${Math.round(map.file_size / 1024 / 1024)} MB` : '-'}</TableCell>
                          <TableCell align="center">
                            {map.is_active ? <Chip label="فعال" color="success" size="small" /> : <Chip label="غیرفعال" size="small" />}
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                              <Tooltip title={map.is_active ? 'غیرفعال کردن' : 'فعال کردن'}>
                                <IconButton size="small" onClick={() => toggleOfflineMap(map.id)}>
                                  {map.is_active ? <Cancel fontSize="small" /> : <CheckCircle fontSize="small" />}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="دانلود">
                                <IconButton size="small" onClick={() => window.open(`${apiBase}/maps/${map.id}/download`)}>
                                  <Download fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="حذف">
                                <IconButton size="small" color="error" onClick={() => deleteOfflineMap(map.id)}>
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
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
          {dialogMode === 'offline' ? 'آپلود نقشه آفلاین' : 
           dialogMode === 'server' ? t('resources.maps.dialog.addFromServerTitle') : 
           t('resources.maps.dialog.uploadFileTitle')}
        </DialogTitle>
        <DialogContent>
          {uploadError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {uploadError}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {dialogMode === 'offline' ? (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="نام نقشه"
                    value={offlineFormData.name}
                    onChange={(e) => setOfflineFormData({ ...offlineFormData, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="توضیحات (اختیاری)"
                    value={offlineFormData.description}
                    onChange={(e) => setOfflineFormData({ ...offlineFormData, description: e.target.value })}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUpload />}
                    fullWidth
                  >
                    انتخاب فایل MBTiles
                    <input
                      type="file"
                      hidden
                      accept=".mbtiles"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setOfflineFormData({ ...offlineFormData, file: e.target.files[0] });
                        }
                      }}
                    />
                  </Button>
                  {offlineFormData.file && (
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      فایل انتخاب شده: {offlineFormData.file.name}
                    </Typography>
                  )}
                </Grid>
              </>
            ) : (
              <>
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
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>لغو</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={
              dialogMode === 'offline' 
                ? !offlineFormData.name || !offlineFormData.file 
                : !formData.name
            }
          >
            {dialogMode === 'offline' ? 'آپلود نقشه' :
             dialogMode === 'server' ? t('resources.maps.dialog.addButton') : 
             t('resources.maps.dialog.uploadButton')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MapsTab;
