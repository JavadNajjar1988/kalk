import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  LinearProgress,
  Alert,
  Autocomplete,
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
import MapsDeleteConfirmModal from '@/modules/dashboard/pages/resources/MapsDeleteConfirmModal';

const resolveApiBase = () => {
  const raw = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
  const trimmed = raw.trim();
  if (trimmed.length > 0) {
    return trimmed.replace(/\/+$/, '');
  }
  return '/api';
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
  storage_type: 'mbtiles' | 'filesystem';
  description?: string;
  is_active: boolean;
  file_size?: number;
  created_at: string;
  updated_at?: string;
  url_template: string;
}

interface FilesystemFolderOption {
  value: string;
  label: string;
  relativePath: string;
  tileCount?: number | null;
}

const MapsTab: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const apiBase = useMemo(resolveApiBase, []);
  const mapLayers = useAppSelector(selectMapLayers);
  const activeOfflineMap = useAppSelector(selectActiveOfflineMap);
  
  // State برای نقشه‌های آفلاین
  const [offlineMaps, setOfflineMaps] = useState<OfflineMap[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'server' | 'upload' | 'offline' | 'filesystem'>('server');
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
  const [filesystemFormData, setFilesystemFormData] = useState({
    name: '',
    description: '',
    folder: '',
  });
  const [filesystemFolders, setFilesystemFolders] = useState<FilesystemFolderOption[]>([]);
  const [filesystemFoldersLoading, setFilesystemFoldersLoading] = useState(false);
  const [filesystemFoldersError, setFilesystemFoldersError] = useState<string | null>(null);
  const [filesystemRootPath, setFilesystemRootPath] = useState('');
  const [filesystemFolderInput, setFilesystemFolderInput] = useState('');

  // بارگذاری نقشه‌های آفلاین
  const loadOfflineMaps = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authFetch(apiBase, '/maps');
      if (response.ok) {
        const data = await response.json();
        const maps: OfflineMap[] = data.maps || [];
        setOfflineMaps(maps);
        const activeMapEntry = maps.find(map => map.is_active);
        if (activeMapEntry && activeMapEntry.url_template) {
          dispatch(setActiveOfflineMap({
            id: activeMapEntry.id,
            name: activeMapEntry.name,
            url: activeMapEntry.url_template,
          }));
        } else if (!activeMapEntry) {
          dispatch(setActiveOfflineMap(null));
        }
      }
    } catch (error) {
      console.error('خطا در بارگذاری نقشه‌های آفلاین:', error);
    } finally {
      setLoading(false);
    }
  }, [apiBase, dispatch]);

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

  // ثبت نقشه مبتنی بر پوشه
  const registerFilesystemMap = async () => {
    if (!filesystemFormData.name || !filesystemFormData.folder) return;

    try {
      setLoading(true);
      setUploadError(null);

      const response = await authFetch(apiBase, '/maps/register-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: filesystemFormData.name,
          description: filesystemFormData.description,
          folder: filesystemFormData.folder.trim(),
        }),
      });

      if (response.ok) {
        await loadOfflineMaps();
        handleCloseDialog();
        setFilesystemFormData({ name: '', description: '', folder: '' });
        setFilesystemFolderInput('');
      } else {
        const error = await response.json();
        setUploadError(error.detail || 'خطا در ثبت پوشه');
      }
    } catch (error) {
      setUploadError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  // فعال/غیرفعال کردن نقشه آفلاین
  useEffect(() => {
    if (!openDialog || dialogMode !== 'filesystem') {
      return;
    }

    let cancelled = false;

    const fetchFolders = async () => {
      setFilesystemFoldersLoading(true);
      setFilesystemFoldersError(null);
      try {
        const response = await authFetch(apiBase, '/maps/filesystem-folders');
        let payload: any = null;
        try {
          payload = await response.json();
        } catch (err) {
          payload = null;
        }

        if (!response.ok) {
          const detail = payload && typeof payload === 'object' && 'detail' in payload ? payload.detail : null;
          throw new Error(detail || 'Failed to fetch filesystem folders');
        }

        if (!cancelled && payload) {
          const entries = Array.isArray(payload.entries) ? payload.entries : [];
          const normalisedOptions: FilesystemFolderOption[] = entries
            .map((entry: any) => ({
              value: typeof entry.folder === 'string' ? entry.folder : '',
              label: typeof entry.label === 'string' ? entry.label : '',
              relativePath: typeof entry.relative_path === 'string' ? entry.relative_path : '',
              tileCount: typeof entry.approx_tile_count === 'number' ? entry.approx_tile_count : null,
            }))
            .filter((entry: FilesystemFolderOption) => entry.value && entry.label);

          setFilesystemRootPath(typeof payload.root === 'string' ? payload.root : '');
          setFilesystemFolders(normalisedOptions);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Failed to fetch filesystem folders';
          setFilesystemFoldersError(message);
          setFilesystemFolders([]);
          setFilesystemRootPath('');
        }
      } finally {
        if (!cancelled) {
          setFilesystemFoldersLoading(false);
        }
      }
    };

    fetchFolders();

    return () => {
      cancelled = true;
    };
  }, [openDialog, dialogMode, apiBase]);

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
        const updated = await response.json();
        await loadOfflineMaps();

        // نقشه فعال را در mapSlice تنظیم کن (بر اساس پاسخ سرور)
        if (updated && updated.id && updated.url_template) {
          dispatch(setActiveOfflineMap({
            id: updated.id,
            name: updated.name,
            url: updated.url_template,
          }));
        }
      }
    } catch (error) {
      console.error('خطا در تغییر وضعیت نقشه:', error);
    }
  };

  // حذف نقشه آفلاین با مودال تایید
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDeleteMap, setPendingDeleteMap] = useState<OfflineMap | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const requestDeleteOfflineMap = (mapItem: OfflineMap) => {
    setPendingDeleteMap(mapItem);
    setDeleteOpen(true);
  };

  const confirmDeleteOfflineMap = async (mapId: number) => {
    try {
      setIsDeleting(true);
      const response = await authFetch(apiBase, `/maps/${mapId}`, { method: 'DELETE' });
      if (response.ok) {
        await loadOfflineMaps();
      }
      setDeleteOpen(false);
      setPendingDeleteMap(null);
    } catch (error) {
      console.error('خطا در حذف نقشه:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    loadOfflineMaps();
  }, [loadOfflineMaps]);

  const handleOpenDialog = (mode: 'server' | 'upload' | 'offline' | 'filesystem') => {
    setDialogMode(mode);
    if (mode === 'offline') {
      setOfflineFormData({ name: '', description: '', file: null });
    } else if (mode === 'filesystem') {
      setFilesystemFormData({ name: '', description: '', folder: '' });
        setFilesystemFolderInput('');
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
    setFilesystemFormData({ name: '', description: '', folder: '' });
    setFilesystemFolderInput('');
    setFilesystemFoldersError(null);
    setUploadError(null);
  };

  const handleSave = () => {
    if (dialogMode === 'offline') {
      uploadOfflineMap();
    } else if (dialogMode === 'filesystem') {
      registerFilesystemMap();
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

  // Soft background surface similar to FieldEditDialog
  const getSoftSurface = () => {
    const primary = (theme.palette.primary.main || '#4a90e2').toLowerCase();
    const hex = primary.replace('#', '');
    if (hex.includes('10b981') || hex.includes('4caf50') || hex.includes('2e7d32')) return '#f0f4f3';
    if (hex.includes('4a90e2') || hex.includes('1976d2') || hex.includes('2196f3')) return '#f0f4f8';
    if (hex.includes('ef4444') || hex.includes('f44336') || hex.includes('d32f2f')) return '#fbf1f0';
    if (hex.includes('6b21a8') || hex.includes('9c27b0') || hex.includes('673ab7')) return '#22262d';
    if (hex.includes('f59e0b') || hex.includes('ff9800') || hex.includes('fb8c00')) return '#fbf1f1';
    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    const hexToRgb = (h: string) => {
      const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
      const r = parseInt(n.substring(0, 2), 16);
      const g = parseInt(n.substring(2, 4), 16);
      const b = parseInt(n.substring(4, 6), 16);
      return { r, g, b };
    };
    const rgbToHex = (r: number, g: number, b: number) => `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
    const blendWithWhite = (h: string, primaryWeight = 0.10) => {
      const { r, g, b } = hexToRgb(h);
      const wr = 255, wg = 255, wb = 255;
      const w = 1 - primaryWeight;
      const br = wr * w + r * primaryWeight;
      const bg = wg * w + g * primaryWeight;
      const bb = wb * w + b * primaryWeight;
      return rgbToHex(br, bg, bb);
    };
    if (/^[0-9a-f]{3,6}$/.test(hex)) {
      return blendWithWhite(hex, 0.10);
    }
    try {
      const fallback = (theme.palette.primary.light || '#90caf9').toLowerCase().replace('#', '');
      return blendWithWhite(fallback, 0.08);
    } catch {
      return '#f5f7fa';
    }
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
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" size="small" startIcon={<Add />} onClick={() => handleOpenDialog('offline')}>
                    آپلود فایل نقشه
                  </Button>
                  <Button variant="outlined" size="small" startIcon={<Add />} onClick={() => handleOpenDialog('filesystem')}>
                    ثبت پوشه
                  </Button>
                </Box>
              }
              sx={{ pb: 1 }}
            />
            <CardContent sx={{ pt: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip label={`تعداد: ${offlineMaps.length}`} size="small" />
                <Chip label={`فعال: ${offlineMaps.filter(m=>m.is_active).length}`} color="success" size="small" />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                می‌توانید فایل‌های .mbtiles را آپلود کنید یا پوشه‌های موجود با ساختار z/x/y را ثبت کنید. لیست کامل در جدول پایین نمایش داده می‌شود.
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
                      <TableCell align="center">نوع</TableCell>
                      <TableCell align="center">اندازه</TableCell>
                      <TableCell align="center">وضعیت</TableCell>
                      <TableCell align="center">عملیات</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {offlineMaps.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">هیچ نقشه آفلاینی یافت نشد</TableCell>
                      </TableRow>
                    ) : (
                      offlineMaps.map((map) => (
                        <TableRow key={map.id} hover>
                          <TableCell>{map.name}</TableCell>
                          <TableCell sx={{ maxWidth: 360 }}>
                            <Typography variant="body2" noWrap>{map.description || '-'}</Typography>
                            {map.storage_type === 'filesystem' && (
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }} noWrap>
                                مسیر: {map.file_path}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={map.storage_type === 'mbtiles' ? 'فایل نقشه' : 'پوشه z/x/y'}
                              size="small"
                              color={map.storage_type === 'mbtiles' ? 'primary' : 'info'}
                              variant={map.storage_type === 'mbtiles' ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell align="center">{map.file_size ? `${Math.round(map.file_size / 1024 / 1024)} مگابایت` : '-'}</TableCell>
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
                                <IconButton size="small" color="error" onClick={() => requestDeleteOfflineMap(map)}>
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
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth={isMobile ? 'xs' : 'sm'} 
        fullWidth
        fullScreen={isMobile}
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: isMobile ? 0 : '20px',
            backgroundColor: (theme) => alpha(theme.palette.primary.light, 0.10),
            backdropFilter: 'blur(20px)',
            border: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
            boxShadow: (theme) => `0 20px 60px ${alpha(theme.palette.primary.light, 0.3)}, inset 0 1px 0 rgba(255, 255, 255, 0.8)`,
            overflow: 'hidden',
            position: 'relative',
          },
          '& .MuiBackdrop-root': {
            backgroundColor: (theme) => `${alpha(theme.palette.primary.light, 0.08)}`,
            backdropFilter: 'blur(4px)',
          },
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: getSoftSurface(),
            borderBottom: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
            textAlign: 'center',
            py: isMobile ? 2 : 3,
            px: isMobile ? 2 : 3,
            fontWeight: 700,
            color: (theme) => theme.palette.primary.main,
          }}
        >
          {dialogMode === 'offline' ? 'آپلود نقشه آفلاین' : 
           dialogMode === 'filesystem' ? 'ثبت نقشه پوشه‌ای' :
           dialogMode === 'server' ? t('resources.maps.dialog.addFromServerTitle') : 
           t('resources.maps.dialog.uploadFileTitle')}
        </DialogTitle>
        <DialogContent sx={{ p: 0, backgroundColor: getSoftSurface() }}>
          <Box sx={{ p: isMobile ? 2 : 4 }}>
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
                    انتخاب فایل نقشه
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
            ) : dialogMode === 'filesystem' ? (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="نام نقشه"
                    value={filesystemFormData.name}
                    onChange={(e) => setFilesystemFormData({ ...filesystemFormData, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <Autocomplete
                    freeSolo
                    options={filesystemFolders}
                    value={
                      filesystemFolders.find((option) => option.value === filesystemFormData.folder) ??
                      (filesystemFormData.folder ? filesystemFormData.folder : null)
                    }
                    inputValue={filesystemFolderInput}
                    onInputChange={(event, newInputValue) => {
                      setFilesystemFolderInput(newInputValue);
                      setFilesystemFormData({ ...filesystemFormData, folder: newInputValue });
                    }}
                    onChange={(event, newValue) => {
                      if (typeof newValue === 'string') {
                        setFilesystemFormData({ ...filesystemFormData, folder: newValue });
                        setFilesystemFolderInput(newValue);
                      } else if (newValue) {
                        setFilesystemFormData({ ...filesystemFormData, folder: newValue.value });
                        setFilesystemFolderInput(newValue.value);
                      } else {
                        setFilesystemFormData({ ...filesystemFormData, folder: '' });
                        setFilesystemFolderInput('');
                      }
                    }}
                    loading={filesystemFoldersLoading}
                    sx={{ width: '100%' }}
                    getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
                    renderOption={(props, option) => {
                      const resolved =
                        typeof option === 'string'
                          ? filesystemFolders.find((item) => item.value === option) ?? null
                          : option;
                      return (
                        <li {...props}>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2">
                              {resolved?.label ?? (typeof option === 'string' ? option : '')}
                            </Typography>
                            {resolved?.relativePath && resolved.relativePath !== resolved.label && (
                              <Typography variant="caption" color="text.secondary">
                                {resolved.relativePath}
                              </Typography>
                            )}
                            {typeof resolved?.tileCount === 'number' && (
                              <Typography variant="caption" color="text.secondary">
                                {`تایل‌ها: ${resolved.tileCount}`}
                              </Typography>
                            )}
                          </Box>
                        </li>
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="مسیر پوشه (نسبت به سرور)"
                        helperText={
                          filesystemFoldersLoading
                            ? 'در حال بارگذاری پوشه‌ها...'
                            : filesystemRootPath
                              ? `ریشه: ${filesystemRootPath}`
                              : 'مسیر پوشه را وارد کنید یا از لیست انتخاب کنید'
                        }
                        required
                      />
                    )}
                  />
                  {filesystemFoldersError && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {filesystemFoldersError}
                    </Alert>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="توضیحات (اختیاری)"
                    value={filesystemFormData.description}
                    onChange={(e) => setFilesystemFormData({ ...filesystemFormData, description: e.target.value })}
                    multiline
                    rows={2}
                  />
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
                          <MenuItem value="xyz">تایل‌های XYZ</MenuItem>
                          <MenuItem value="osm">نقشه باز خیابان</MenuItem>
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
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            backgroundColor: getSoftSurface(),
            borderTop: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
            p: isMobile ? 2 : 3,
          }}
        >
          <Button 
            onClick={handleCloseDialog}
            sx={{
              borderRadius: '12px',
              px: isMobile ? 2 : 3,
              py: isMobile ? 1 : 1.5,
              backgroundColor: 'rgba(148, 163, 184, 0.1)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              color: '#64748B',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: 'rgba(148, 163, 184, 0.15)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(148, 163, 184, 0.2)',
              },
            }}
          >
            لغو
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={
              dialogMode === 'offline' 
                ? !offlineFormData.name || !offlineFormData.file 
                : dialogMode === 'filesystem'
                  ? !filesystemFormData.name || !filesystemFormData.folder
                  : !formData.name
            }
            sx={{
              borderRadius: '12px',
              px: isMobile ? 2 : 4,
              py: isMobile ? 1 : 1.5,
              backgroundColor: (theme) => theme.palette.primary.main,
              color: 'white',
              fontWeight: 600,
              border: '2px solid rgba(255, 255, 255, 0.3)',
              boxShadow: (theme) => `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                backgroundColor: (theme) => theme.palette.primary.dark,
                transform: 'translateY(-2px)',
                boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
              },
            }}
          >
            {dialogMode === 'offline' ? 'آپلود نقشه' :
             dialogMode === 'filesystem' ? 'ثبت نقشه' :
             dialogMode === 'server' ? t('resources.maps.dialog.addButton') : 
             t('resources.maps.dialog.uploadButton')}
          </Button>
        </DialogActions>
      </Dialog>

      <MapsDeleteConfirmModal
        open={deleteOpen}
        mapItem={pendingDeleteMap ? { id: pendingDeleteMap.id, name: pendingDeleteMap.name, description: pendingDeleteMap.description, file_size: pendingDeleteMap.file_size } : null}
        onClose={() => { setDeleteOpen(false); setPendingDeleteMap(null); }}
        onConfirm={confirmDeleteOfflineMap}
        isDeleting={isDeleting}
      />
    </Box>
  );
};

export default MapsTab;







