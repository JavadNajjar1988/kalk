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
  Stepper,
  Step,
  StepLabel,
  Tabs,
  Tab,
  Drawer,
  Stack,
  Checkbox,
  FormControlLabel,
  Snackbar,
  CircularProgress,
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
  Source,
  Inventory,
  History,
  Sync,
  Preview,
  Edit,
  Publish,
  Undo,
  Block,
  Refresh,
  CloudSync,
  Folder,
  Storage,
  CheckCircleOutline,
  RadioButtonUnchecked,
  HelpOutline,
  CompareArrows,
  Storage as StorageIcon,
  CloudQueue,
  CheckCircle as CheckCircleIcon,
  Info,
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
  setActiveOfflineMaps,
} from '@/store/slices/mapSlice';
import type { MapLayer } from '@/types/orbat';

/** فرم دیالوگ لایه؛ `file` فقط در UI است و هرگز در Redux ذخیره نمی‌شود */
type MapLayerFormState = Partial<Omit<MapLayer, 'id'>> & { file?: File | null };
import { useTranslation } from '@/hooks/useTranslation';
import MapsDeleteConfirmModal from '@/modules/dashboard/pages/resources/MapsDeleteConfirmModal';
import {
  buildResourcesFormDialogSx,
  buildResourcesLayerDialogSx,
  resourcesDialogTitleSx,
  resourcesDialogContentDividersSx,
  resourcesDialogActionsSx,
  resourcesOutlinedCancelButtonSx,
} from '@/modules/dashboard/pages/resources/resourcesDialogStyles';

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
  const response = await fetch(`${baseUrl}${endpoint}`, { ...options, headers });
  
  // Handle 401 Unauthorized
  if (response.status === 401) {
    localStorage.removeItem('access_token');
    // Optionally redirect to login or show toast
    if (window.location.pathname !== '/auth/login') {
      window.location.href = '/auth/login?reason=session_expired';
    }
    throw new Error('Session expired. Please login again.');
  }
  
  return response;
};

/** پاسخ خطای این بک‌اند معمولاً { success:false, message } است نه تنها FastAPI { detail } */
function parseBackendErrorBody(errBody: unknown, fallback: string): string {
  if (!errBody || typeof errBody !== 'object') return fallback;
  const o = errBody as Record<string, unknown>;
  if (typeof o.message === 'string' && o.message.trim()) return o.message.trim();
  if (typeof o.detail === 'string' && (o.detail as string).trim()) return (o.detail as string).trim();
  const d = o.detail;
  if (Array.isArray(d)) {
    const msgs = d
      .map((x) =>
        typeof x === 'object' && x !== null && 'msg' in x && typeof (x as { msg: unknown }).msg === 'string'
          ? (x as { msg: string }).msg
          : null,
      )
      .filter(Boolean) as string[];
    if (msgs.length) return msgs.join('؛ ');
  }
  return fallback;
}

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

// Interface برای کاتالوگ لایه‌ها
interface CatalogLayer {
  id: string;
  title: string;
  type: string;
  minzoom?: number | null;
  maxzoom?: number | null;
  srs?: string;
  updated?: string;
  status?: 'draft' | 'published' | 'retired';
  category?: string;
  description?: string;
  bbox?: number[];
  path?: string;
  adminMapId?: number;
  ui?: { visibleByDefault?: boolean; defaultOpacity?: number };
}

// Helper component for TabPanel
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`maps-tabpanel-${index}`}
      aria-labelledby={`maps-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// ---- مدیریت مسیرهای مجاز تایل (Tile Roots) ----
interface TileRootItem {
  id: number;
  label: string;
  path: string;
  is_active: boolean;
  valid: boolean;
  created_at: string;
}

const TileRootsManager: React.FC<{ apiBase: string }> = ({ apiBase }) => {
  const theme = useTheme();
  const [roots, setRoots] = React.useState<TileRootItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [newLabel, setNewLabel] = React.useState('');
  const [newPath, setNewPath] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const authHeaders = React.useCallback(() => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('access_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }, []);

  const loadRoots = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/tile-roots`, { headers: authHeaders() });
      if (!res.ok) throw new Error('خطا در دریافت مسیرها');
      const data = await res.json();
      setRoots(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setLoading(false);
    }
  }, [apiBase, authHeaders]);

  React.useEffect(() => { loadRoots(); }, [loadRoots]);

  const handleAdd = async () => {
    if (!newLabel.trim() || !newPath.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/tile-roots`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ label: newLabel.trim(), path: newPath.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || 'خطا در افزودن مسیر');
      }
      setNewLabel('');
      setNewPath('');
      setAddOpen(false);
      await loadRoots();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await fetch(`${apiBase}/tile-roots/${id}/toggle`, { method: 'PUT', headers: authHeaders() });
      await loadRoots();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('آیا از حذف این مسیر مطمئنید؟')) return;
    try {
      await fetch(`${apiBase}/tile-roots/${id}`, { method: 'DELETE', headers: authHeaders() });
      await loadRoots();
    } catch {}
  };

  return (
    <Card>
      <CardHeader
        title="مسیرهای مجاز نقشه (Tile Roots)"
        subheader="مسیرهایی که سیستم مجاز است پوشه تایل‌ها را از آنها بخواند"
        action={
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={() => setAddOpen(true)}
          >
            افزودن مسیر
          </Button>
        }
      />
      <CardContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : roots.length === 0 ? (
          <Alert severity="info">
            هیچ مسیر اضافه‌ای تعریف نشده. مسیر پیش‌فرض (FILESYSTEM_TILE_ROOT) همچنان فعال است.
          </Alert>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>برچسب</TableCell>
                <TableCell>مسیر</TableCell>
                <TableCell align="center">وضعیت</TableCell>
                <TableCell align="center">معتبر</TableCell>
                <TableCell align="center">عملیات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roots.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.label}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem', direction: 'ltr', textAlign: 'left' }}>
                    {r.path}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={r.is_active ? 'فعال' : 'غیرفعال'}
                      color={r.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={r.valid ? 'موجود' : 'ناموجود'}
                      color={r.valid ? 'info' : 'error'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={r.is_active ? 'غیرفعال‌سازی' : 'فعال‌سازی'}>
                      <IconButton size="small" onClick={() => handleToggle(r.id)}>
                        {r.is_active ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="حذف">
                      <IconButton size="small" color="error" onClick={() => handleDelete(r.id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* فرم افزودن مسیر جدید */}
        {addOpen && (
          <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>افزودن مسیر جدید</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="برچسب (نام نمایشی)"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="مثلاً: دیتاسنتر شرق"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="مسیر مطلق"
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  placeholder="D:/maps/tiles یا /mnt/nas/tiles"
                  sx={{ direction: 'ltr' }}
                  inputProps={{ style: { fontFamily: 'monospace' } }}
                />
              </Grid>
              <Grid item xs={12} sm={2} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleAdd}
                  disabled={submitting || !newLabel.trim() || !newPath.trim()}
                >
                  {submitting ? <CircularProgress size={18} /> : 'ثبت'}
                </Button>
                <Button
                  size="small"
                  onClick={() => { setAddOpen(false); setNewLabel(''); setNewPath(''); setError(null); }}
                >
                  لغو
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const DEFAULT_BASEMAP_ID_KEY = 'kalk.defaultBasemapId';
const DEFAULT_BASEMAP_OPACITY_KEY = 'kalk.defaultBasemapOpacity';

const DefaultBasemapFromCatalog: React.FC<{ apiBase: string }> = ({ apiBase }) => {
  const [items, setItems] = React.useState<CatalogLayer[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedId, setSelectedId] = React.useState<string>(() => localStorage.getItem(DEFAULT_BASEMAP_ID_KEY) || '');
  const [opacity, setOpacity] = React.useState<number>(() => {
    const raw = localStorage.getItem(DEFAULT_BASEMAP_OPACITY_KEY);
    const v = raw ? Number(raw) : NaN;
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 1;
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/catalog/layers.json`);
      if (!res.ok) throw new Error('خطا در دریافت کاتالوگ');
      const payload = await res.json();
      const layers = Array.isArray(payload?.layers) ? (payload.layers as CatalogLayer[]) : [];
      const publishedRaster = layers.filter(
        (l) => l && l.status === 'published' && l.type === 'raster-xyz' && typeof l.path === 'string' && l.path.length > 0
      );
      setItems(publishedRaster);

      if (!selectedId) {
        const pick = publishedRaster.find((l) => l?.ui?.visibleByDefault === true) ?? publishedRaster[0];
        if (pick?.id) setSelectedId(pick.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setLoading(false);
    }
  }, [apiBase, selectedId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const save = () => {
    if (selectedId) localStorage.setItem(DEFAULT_BASEMAP_ID_KEY, selectedId);
    localStorage.setItem(DEFAULT_BASEMAP_OPACITY_KEY, String(opacity));
  };

  return (
    <Card>
      <CardHeader
        title="Basemap پیش‌فرض (از کاتالوگ)"
        subheader="گزینه B: Basemap بر اساس layers.json انتخاب می‌شود (بدون وابستگی به maps.mbtiles ثابت)"
        action={
          <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={load} disabled={loading}>
            بروزرسانی
          </Button>
        }
      />
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ py: 2 }}>
            <LinearProgress />
          </Box>
        ) : items.length === 0 ? (
          <Alert severity="warning">
            هیچ لایه‌ی منتشرشده‌ای از نوع <b>raster-xyz</b> در کاتالوگ پیدا نشد.
          </Alert>
        ) : (
          <>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Basemap پیش‌فرض</InputLabel>
              <Select
                label="Basemap پیش‌فرض"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value as string)}
              >
                {items.map((l) => (
                  <MenuItem key={l.id} value={l.id}>
                    {l.title} ({l.id})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              شفافیت پیش‌فرض: {Math.round(opacity * 100)}%
            </Typography>
            <Slider value={opacity} min={0} max={1} step={0.05} onChange={(_e, v) => setOpacity(v as number)} />

            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button variant="contained" onClick={save} disabled={!selectedId}>
                ذخیره
              </Button>
              <Button
                variant="text"
                onClick={() => {
                  localStorage.removeItem(DEFAULT_BASEMAP_ID_KEY);
                  localStorage.removeItem(DEFAULT_BASEMAP_OPACITY_KEY);
                  setSelectedId('');
                  setOpacity(1);
                }}
              >
                پاک کردن تنظیمات
              </Button>
            </Box>

            <Alert severity="info" sx={{ mt: 2, fontSize: '0.875rem' }}>
              این تنظیم روی همین داشبورد ذخیره می‌شود و در صفحه نقشه (Map) به عنوان Basemap پیش‌فرض استفاده می‌گردد.
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const MapsTab: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const resourcesFormDialogSx = buildResourcesFormDialogSx(theme);
  const resourcesLayerDialogSx = buildResourcesLayerDialogSx(theme, isMobile);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const apiBase = useMemo(resolveApiBase, []);
  const mapLayers = useAppSelector(selectMapLayers);
  
  // Stepper state برای workflow
  const [activeStep, setActiveStep] = useState(0); // 0: افزودن منبع, 1: همگام‌سازی, 2: بازبینی و انتشار
  
  // Tab state برای بخش‌های مختلف
  const [activeTab, setActiveTab] = useState(0); // 0: Sources, 1: Catalog, 2: Jobs, 3: Settings
  
  // State برای Modal راهنما
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  
  // SDI demo config (persisted locally) for phase-1 visibility
  const [sdiConfig, setSdiConfig] = useState<{
    geoserverBase: string;
    wmsUrl: string;
    wmtsUrl: string;
    wfsUrl: string;
    serverId?: number;
  }>({
    geoserverBase: '',
    wmsUrl: '',
    wmtsUrl: '',
    wfsUrl: '',
  });
  useEffect(() => {
    setSdiConfig({
      geoserverBase: localStorage.getItem('sdi.geoserver.base') || '',
      wmsUrl: localStorage.getItem('sdi.wms.url') || '',
      wmtsUrl: localStorage.getItem('sdi.wmts.url') || '',
      wfsUrl: localStorage.getItem('sdi.wfs.url') || '',
    });
  }, []);
  const updateSdi = (key: keyof typeof sdiConfig, value: string) => {
    setSdiConfig(prev => {
      const next = { ...prev, [key]: value };
      try { localStorage.setItem(`sdi.${key === 'geoserverBase' ? 'geoserver.base' : key.replace('Url','').toLowerCase()+'.url'}`, value); } catch {}
      return next;
    });
  };
  const copySdi = () => {
    const summary = `GeoServer: ${sdiConfig.geoserverBase || '-'}\nWMS: ${sdiConfig.wmsUrl || '-'}\nWMTS: ${sdiConfig.wmtsUrl || '-'}\nWFS/OGC Features: ${sdiConfig.wfsUrl || '-'}`;
    navigator.clipboard?.writeText(summary).catch(() => {});
  };

  // State برای SDI Connection و Harvest
  const [sdiConnectionStatus, setSdiConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [sdiConnectionError, setSdiConnectionError] = useState<string | null>(null);
  const [lastHarvestTime, setLastHarvestTime] = useState<string | null>(null);
  const [harvestStatus, setHarvestStatus] = useState<'idle' | 'harvesting' | 'success' | 'error'>('idle');
  const [harvestedLayers, setHarvestedLayers] = useState<any[]>([]);

  // Test SDI Connection
  const testSdiConnection = async () => {
    if (!sdiConfig.wmsUrl && !sdiConfig.wmtsUrl && !sdiConfig.wfsUrl) {
      setSdiConnectionError('حداقل یک URL باید وارد شود');
      setSdiConnectionStatus('error');
      return;
    }

    setSdiConnectionStatus('testing');
    setSdiConnectionError(null);
    
    try {
      // تشخیص نوع سرویس از URL
      const serviceTypes: string[] = [];
      if (sdiConfig.wmsUrl) serviceTypes.push('wms');
      if (sdiConfig.wmtsUrl) serviceTypes.push('wmts');
      if (sdiConfig.wfsUrl) serviceTypes.push('wfs');

      // ایجاد یا به‌روزرسانی SDI Server
      const baseUrl = sdiConfig.wmsUrl || sdiConfig.wmtsUrl || sdiConfig.wfsUrl || '';
      
      const response = await authFetch(apiBase, '/sdi/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `SDI Server (${new Date().toLocaleTimeString('fa-IR')})`,
          base_url: baseUrl,
          service_types: serviceTypes,
          auth_type: 'none',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSdiConnectionStatus('success');
        setSdiConnectionError(null);
        // ذخیره server_id برای استفاده در harvest
        setSdiConfig(prev => ({ ...prev, serverId: data.id }));
      } else {
        const error = await response.json();
        throw new Error(error.message || 'خطا در ایجاد سرور SDI');
      }
    } catch (error) {
      setSdiConnectionStatus('error');
      setSdiConnectionError(error instanceof Error ? error.message : 'خطا در اتصال');
    }
  };

  // Harvest layers from SDI
  const harvestSdiLayers = async () => {
    if (sdiConnectionStatus !== 'success') {
      setSdiConnectionError('ابتدا اتصال را تست کنید');
      return;
    }

    if (!sdiConfig.serverId) {
      setSdiConnectionError('شناسه سرور یافت نشد');
      return;
    }
    const serverId = sdiConfig.serverId;

    setHarvestStatus('harvesting');
    
    try {
      const response = await authFetch(apiBase, `/sdi/servers/${serverId}/harvest`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setHarvestedLayers(data.map_ids || []);
        setLastHarvestTime(new Date().toLocaleString('fa-IR'));
        setHarvestStatus('success');
        setActiveStep(1); // به مرحله همگام‌سازی برو
        
        // بارگذاری مجدد کاتالوگ برای نمایش نقشه‌های harvested شده
        await loadCatalog();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'خطا در Harvest');
      }
    } catch (error) {
      setHarvestStatus('error');
      setSdiConnectionError(error instanceof Error ? error.message : 'خطا در Harvest');
    }
  };

  // State برای کاتالوگ
  const [catalogLayers, setCatalogLayers] = useState<CatalogLayer[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogFilterStatus, setCatalogFilterStatus] = useState<'all' | 'draft' | 'published' | 'retired'>('all');
  const [catalogFilterType, setCatalogFilterType] = useState<string>('all');
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
  const [previewLayer, setPreviewLayer] = useState<CatalogLayer | null>(null);
  const [editLayer, setEditLayer] = useState<CatalogLayer | null>(null);

  // بارگذاری کاتالوگ از layers.json
  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const response = await authFetch(apiBase, '/catalog/layers.json');
      if (response.ok) {
        const data = await response.json();
        const layers = Array.isArray(data.layers) ? data.layers : [];
        setCatalogLayers(layers.map((l: any) => ({
          id: String(l.id ?? ''),
          title: String(l.title ?? ''),
          type: String(l.type ?? ''),
          minzoom: typeof l.minzoom === 'number' ? l.minzoom : undefined,
          maxzoom: typeof l.maxzoom === 'number' ? l.maxzoom : undefined,
          srs: typeof l.srs === 'string' ? l.srs : undefined,
          updated: typeof l.updated === 'string' ? l.updated : undefined,
          status: 'published',
          category: typeof l.category === 'string' ? l.category : undefined,
          description: typeof l.description === 'string' ? l.description : undefined,
          bbox: Array.isArray(l.bbox) ? l.bbox : undefined,
          path: typeof l.path === 'string' ? l.path : undefined,
          adminMapId: typeof l.admin === 'object' && l.admin && typeof l.admin.map_id === 'number' ? l.admin.map_id : undefined,
        })));
      }
      // همچنین Draftها را از SDI بخوانیم و به لیست اضافه کنیم
      try {
        const r2 = await authFetch(apiBase, '/sdi/maps?status=draft');
        if (r2.ok) {
          const data2 = await r2.json();
          const items = Array.isArray(data2.maps) ? data2.maps : [];
          const drafts: CatalogLayer[] = items.map((m: any) => ({
            id: String(m.id),
            title: String(m.title || m.layer_name || `map-${m.id}`),
            type: String(m.source_type || 'wms'),
            status: 'draft',
            adminMapId: Number(m.id),
            path: String(m.url_or_path || ''),
            srs: String(m.srs || ''),
          }));
          setCatalogLayers(prev => {
            const publishedIds = new Set(prev.map(p => p.id));
            return [...prev, ...drafts.filter(d => !publishedIds.has(d.id))];
          });
        }
      } catch {}
    } catch (error) {
      console.error('خطا در بارگذاری کاتالوگ:', error);
    } finally {
      setCatalogLoading(false);
    }
  }, [apiBase]);

  // فیلتر لایه‌ها
  const filteredCatalogLayers = useMemo(() => {
    return catalogLayers.filter(layer => {
      const matchesSearch = catalogSearch === '' || 
        layer.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        layer.description?.toLowerCase().includes(catalogSearch.toLowerCase());
      const matchesStatus = catalogFilterStatus === 'all' || layer.status === catalogFilterStatus;
      const matchesType = catalogFilterType === 'all' || layer.type === catalogFilterType || layer.category === catalogFilterType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [catalogLayers, catalogSearch, catalogFilterStatus, catalogFilterType]);

  // Interface و State برای Jobs
  interface Job {
    id: string;
    type: 'harvest' | 'publish' | 'rollback';
    status: 'running' | 'success' | 'error';
    startTime: string;
    endTime?: string;
    duration?: number; // به ثانیه
    layerCount?: number;
    error?: string;
    log?: string[];
  }

  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showLogDialog, setShowLogDialog] = useState(false);

  // بارگذاری Jobs
  const loadJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      const response = await authFetch(apiBase, '/sdi/jobs');
      if (response.ok) {
        const data = await response.json();
        const jobs = Array.isArray(data.jobs) ? data.jobs : [];
        setJobs(jobs.map((j: any) => ({
          id: String(j.id),
          type: j.type,
          status: j.status,
          startTime: j.started_at,
          endTime: j.ended_at,
          layerCount: Array.isArray(j.map_ids) ? j.map_ids.length : undefined,
          error: j.error || undefined,
          log: Array.isArray(j.logs) ? j.logs : undefined,
        })));
      }
    } catch (error) {
      console.error('خطا در بارگذاری Jobs:', error);
    } finally {
      setJobsLoading(false);
    }
  }, [apiBase]);

  // فرمت مدت زمان
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}ثانیه`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} دقیقه`;
    return `${Math.floor(seconds / 3600)} ساعت`;
  };

  // عملیات اتمیک Publish (نوشتن layers.tmp.json سپس rename)
  const publishCatalog = async (layerIds?: string[]) => {
    try {
      const targets = (layerIds ? catalogLayers.filter(l => layerIds.includes(l.id)) : [])
        .map(l => l.adminMapId)
        .filter((id): id is number => typeof id === 'number');
      if (targets.length === 0) {
        alert('شناسه SDI برای انتشار یافت نشد');
        return;
      }
      const response = await authFetch(apiBase, '/sdi/maps/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targets)
      });
      if (response.ok) {
        await loadCatalog();
        setActiveStep(2);
      } else {
        throw new Error('publish failed');
      }
    } catch (error) {
      console.error('خطا در Publish:', error);
    }
  };

  // عملیات Rollback (بازگشت به نسخه قبلی)
  const rollbackCatalog = async () => {
    if (!window.confirm('آیا از بازگشت به نسخه قبلی کاتالوگ مطمئن هستید؟')) {
      return;
    }

    try {
      const response = await authFetch(apiBase, '/catalog/rollback', {
        method: 'POST'
      });

      if (response.ok) {
        await loadCatalog();
        alert('کاتالوگ به نسخه قبلی بازگشت');
      } else {
        throw new Error('خطا در Rollback');
      }
    } catch (error) {
      console.error('خطا در Rollback:', error);
      alert('خطا در بازگشت کاتالوگ');
    }
  };
  
  // State برای نقشه‌های آفلاین
  const [offlineMaps, setOfflineMaps] = useState<OfflineMap[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [vectorUploadLoading, setVectorUploadLoading] = useState(false);
  /** بدون فایل .prj در ZIP شیپ؛ کد عددی EPSG برای تبدیل به WGS84 (مثل 32639) */
  const [vectorCrsEpsg, setVectorCrsEpsg] = useState('');
  
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'serverLayer' | 'upload' | 'offline' | 'filesystem'>('serverLayer');
  const [formData, setFormData] = useState<MapLayerFormState>({
    name: '',
    type: 'xyz',
    url: '',
    visible: true,
    opacity: 1,
  });
  // SDI server integration in server dialog
  const [saveAsSdiServer, setSaveAsSdiServer] = useState(false);
  const [savedServerId, setSavedServerId] = useState<number | null>(null);
  const [testConnLoading, setTestConnLoading] = useState(false);
  const [testConnResult, setTestConnResult] = useState<string | null>(null);

  // SDI Servers management
  interface SdiServer {
    id: number;
    name: string;
    base_url: string;
    service_types: string[];
    status: string;
    auth_type?: string;
    created_at?: string;
  }
  const [servers, setServers] = useState<SdiServer[]>([]);
  const loadServers = useCallback(async () => {
    try {
      const res = await authFetch(apiBase, '/sdi/servers');
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data.servers) ? data.servers : [];
        setServers(
          items.map((s: any) => ({
            id: s.id,
            name: s.name,
            base_url: s.base_url,
            service_types: s.service_types || [],
            status: s.status,
            auth_type: s.auth_type,
            created_at: s.created_at,
          }))
        );
      } else {
        const raw = await res.text();
        let detail: unknown = raw;
        try {
          detail = raw ? JSON.parse(raw) : raw;
        } catch {
          /* نگه داشتن متن خام اگر JSON نبود */
        }
        console.error('GET /sdi/servers failed', res.status, detail);
      }
    } catch (e) {
      console.error('GET /sdi/servers', e);
    }
  }, [apiBase]);
  useEffect(() => { loadServers(); }, [loadServers]);

  const [serverDialogOpen, setServerDialogOpen] = useState(false);
  const [serverSubmitting, setServerSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverForm, setServerForm] = useState<{
    name: string;
    baseUrl: string;
    serviceTypes: string[];
    authType: 'none' | 'basic' | 'token';
    username: string;
    password: string;
    token: string;
  }>({
    name: '',
    baseUrl: '',
    serviceTypes: ['wms'],
    authType: 'none',
    username: '',
    password: '',
    token: '',
  });
  const resetServerForm = useCallback(() => {
    setServerForm({
      name: '',
      baseUrl: '',
      serviceTypes: ['wms'],
      authType: 'none',
      username: '',
      password: '',
      token: '',
    });
    setServerError(null);
  }, []);

  const openServerDialog = () => {
    resetServerForm();
    setServerDialogOpen(true);
  };

  const closeServerDialog = () => {
    if (serverSubmitting) return;
    setServerDialogOpen(false);
  };

  const handleServerInputChange = <K extends keyof typeof serverForm>(field: K, value: (typeof serverForm)[K]) => {
    setServerForm(prev => ({ ...prev, [field]: value }));
    if (serverError) {
      setServerError(null);
    }
  };

  const submitServerForm = async () => {
    if (!serverForm.name.trim()) {
      setServerError('نام سرور الزامی است');
      return;
    }
    if (!serverForm.baseUrl.trim()) {
      setServerError('آدرس پایه سرور الزامی است');
      return;
    }
    const payload: any = {
      name: serverForm.name.trim(),
      base_url: serverForm.baseUrl.trim(),
      service_types: serverForm.serviceTypes.length > 0 ? serverForm.serviceTypes : ['wms'],
      auth_type: serverForm.authType,
    };
    if (serverForm.authType === 'basic') {
      payload.auth_config = {
        username: serverForm.username,
        password: serverForm.password,
      };
    } else if (serverForm.authType === 'token') {
      payload.auth_config = {
        token: serverForm.token,
      };
    }

    setServerSubmitting(true);
    try {
      const res = await authFetch(apiBase, '/sdi/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseBody = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = responseBody?.detail || 'خطا در ثبت سرور';
        setServerError(typeof msg === 'string' ? msg : 'خطا در ثبت سرور');
        return;
      }

      setServerDialogOpen(false);
      await loadServers();
      resetServerForm();
    } catch (error) {
      setServerError('ارتباط با سرور برقرار نشد');
    } finally {
      setServerSubmitting(false);
    }
  };

  const serverServiceOptions = useMemo(
    () => [
      { value: 'wms', label: 'WMS' },
      { value: 'wmts', label: 'WMTS' },
      { value: 'wfs', label: 'WFS' },
      { value: 'xyz', label: 'XYZ' },
      { value: 'tms', label: 'TMS' },
      { value: 'wcs', label: 'WCS' },
    ],
    []
  );

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
        const activeEntries = maps
          .filter(map => map.is_active && typeof map.url_template === 'string' && map.url_template.length > 0)
          .map(map => ({
            id: map.id,
            name: map.name,
            url: map.url_template,
          }));
        dispatch(setActiveOfflineMaps(activeEntries));
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

      const token = localStorage.getItem('access_token');
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200 || xhr.status === 201) {
          await loadOfflineMaps();
          handleCloseDialog();
          setOfflineFormData({ name: '', description: '', file: null });
          setUploadProgress(0);
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            setUploadError(error.detail || 'خطا در آپلود فایل');
          } catch {
            setUploadError('خطا در آپلود فایل');
          }
          setUploadProgress(0);
        }
        setLoading(false);
      };

      xhr.onerror = () => {
        setUploadError(
          'اتصال هنگام آپلود قطع شد (Connection reset). با حالت reload معمولاً به‌خاطر ری‌استارت سرور پس از ذخیرهٔ فایل نقشه رخ می‌دهد؛ سرور را با «فقط نظارت بر پوشه app» اجرا کنید (به README بک‌اند یا docker-compose نگاه کنید) و مطمئن شوید API روی پورت پروکسی (مثل 8002) در دسترس است.',
        );
        setUploadProgress(0);
        setLoading(false);
      };

      xhr.open('POST', `${apiBase}/maps/upload`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    } catch (error) {
      setUploadError('خطا در اتصال به سرور');
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

  const toggleOfflineMap = async (map: OfflineMap) => {
    const willActivate = !map.is_active;
    
    try {
      const response = await authFetch(apiBase, `/maps/${map.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: willActivate }),
      });

      if (response.ok) {
        await loadOfflineMaps();
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

  // بارگذاری کاتالوگ وقتی تب Catalog فعال است
  useEffect(() => {
    if (activeTab === 1) {
      loadCatalog();
    }
  }, [activeTab, loadCatalog]);

  // بارگذاری Jobs وقتی تب Jobs فعال است
  useEffect(() => {
    if (activeTab === 2) {
      loadJobs();
    }
  }, [activeTab, loadJobs]);

  const handleOpenDialog = (mode: 'serverLayer' | 'upload' | 'offline' | 'filesystem') => {
    setVectorCrsEpsg('');
    setDialogMode(mode);
    if (mode === 'offline') {
      setOfflineFormData({ name: '', description: '', file: null });
    } else if (mode === 'filesystem') {
      setFilesystemFormData({ name: '', description: '', folder: '' });
        setFilesystemFolderInput('');
    } else {
      setFormData({
        name: '',
        type: mode === 'serverLayer' ? 'xyz' : 'raster',
        url: '',
        visible: true,
        opacity: 1,
      });
    }
    if (mode === 'serverLayer') {
      setSaveAsSdiServer(false);
      setSavedServerId(null);
      setTestConnResult(null);
    }
    setOpenDialog(true);
  };

  // SDI status mapping for offline maps
  const [offlineSdiStatus, setOfflineSdiStatus] = useState<Record<number, { status: 'draft'|'published'|'retired'; mapId?: number }>>({});
  const loadOfflineSdiStatus = useCallback(async () => {
    try {
      const res = await authFetch(apiBase, '/sdi/maps?status=all');
      if (res.ok) {
        const data = await res.json();
        const map: Record<number, {status:'draft'|'published'|'retired'; mapId?: number}> = {};
        const items = Array.isArray(data.maps) ? data.maps : [];
        for (const m of items) {
          const offId = m?.metadata?.offline_map_id as number | undefined;
          if (typeof offId === 'number') {
            map[offId] = { status: m.status, mapId: m.id };
          }
        }
        setOfflineSdiStatus(map);
      }
    } catch {}
  }, [apiBase]);

  // پس از آماده شدن تابع بالا، یکبار در مونت وضعیت SDI را بارگذاری کن
  useEffect(() => {
    loadOfflineSdiStatus();
  }, [loadOfflineSdiStatus]);

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({});
    setOfflineFormData({ name: '', description: '', file: null });
    setFilesystemFormData({ name: '', description: '', folder: '' });
    setFilesystemFolderInput('');
    setFilesystemFoldersError(null);
    setUploadError(null);
    setVectorCrsEpsg('');
  };

  const handleSave = async () => {
    if (dialogMode === 'offline') {
      uploadOfflineMap();
      return;
    }
    if (dialogMode === 'filesystem') {
      registerFilesystemMap();
      return;
    }
    // Optionally save SDI server metadata
    if (saveAsSdiServer && formData.url) {
      try {
        const u = new URL(formData.url);
        const body = {
          name: u.host,
          base_url: formData.url,
          service_types: [formData.type || 'xyz'],
          auth_type: 'none',
        } as any;
        authFetch(apiBase, '/sdi/servers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
          .then(r => r.json())
          .then(s => setSavedServerId(s.id))
          .catch(() => {});
      } catch { /* ignore */ }
    }
    if (dialogMode === 'upload') {
      const file = formData.file;
      const name = formData.name?.trim();
      const fmt = formData.format?.trim();
      if (!name || !file || !fmt) {
        return;
      }
      setVectorUploadLoading(true);
      setUploadError(null);
      try {
        const fd = new FormData();
        fd.append('title', name);
        fd.append('file', file);
        if (vectorCrsEpsg.trim()) {
          fd.append('crs_epsg', vectorCrsEpsg.trim());
        }
        const res = await authFetch(apiBase, '/catalog/upload-vector', { method: 'POST', body: fd });
        if (!res.ok) {
          let msg = `آپلود ناموفق بود (HTTP ${res.status}).`;
          try {
            const errBody = await res.json();
            msg = parseBackendErrorBody(errBody, msg);
          } catch {
            /* ignore */
          }
          setUploadError(msg);
          return;
        }
        const data = await res.json() as { layer_url: string; source_type?: string };
        dispatch(
          addMapLayer({
            name,
            type: fmt === 'geotiff' ? 'raster' : 'vector',
            url: data.layer_url,
            visible: formData.visible ?? true,
            opacity: typeof formData.opacity === 'number' ? formData.opacity : 1,
            format: fmt,
            minZoom: formData.minZoom,
            maxZoom: formData.maxZoom,
            attribution: formData.attribution,
            extent: formData.extent,
            layers: formData.layers,
            tileSize: formData.tileSize,
            projection: formData.projection,
          }),
        );
        await loadCatalog();
        handleCloseDialog();
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : 'خطا در ارتباط با سرور');
      } finally {
        setVectorUploadLoading(false);
      }
      return;
    }
    dispatch(addMapLayer(formData as Omit<MapLayer, 'id'>));
    handleCloseDialog();
  };

  const testServerConnection = async () => {
    if (!formData.url) return;
    setTestConnLoading(true);
    setTestConnResult(null);
    try {
      const params = new URLSearchParams({ base_url: String(formData.url) });
      const res = await authFetch(apiBase, `/sdi/servers/test?${params.toString()}`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof (data as { detail?: unknown }).detail === 'string'
            ? (data as { detail: string }).detail
            : res.status === 403
              ? 'دسترسی رد شد (نیاز به ورود / نقش)'
              : `HTTP ${res.status}`;
        setTestConnResult(`ناموفق: ${msg}`);
        return;
      }
      if (data.ok) {
        setTestConnResult(`موفق (کد ${(data as { status?: number }).status ?? '—'})`);
      } else {
        setTestConnResult(`ناموفق: ${(data as { error?: string }).error || 'پاسخ غیرمنتظره'}`);
      }
    } catch {
      setTestConnResult('ناموفق: خطای شبکه یا نشست');
    } finally {
      setTestConnLoading(false);
    }
  };

  const discoverServerLayers = async () => {
    if (!formData.url) return;
    try {
      const svc = formData.type === 'osm' ? 'xyz' : formData.type || 'wms';
      // همیشه یک سرور SDI موقت/جدید می‌سازیم تا harvest کنیم
      const body = {
        name: (() => { try { return new URL(String(formData.url)).host; } catch { return 'server'; } })(),
        base_url: formData.url,
        service_types: [svc],
        auth_type: 'none',
      } as any;
      const created = await authFetch(apiBase, '/sdi/servers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const server = await created.json();
      await authFetch(apiBase, `/sdi/servers/${server.id}/harvest`, { method: 'POST' });
      setSavedServerId(server.id);
      alert('Discover/Harvest انجام شد. Draftها در تب Catalog قابل مشاهده خواهند بود.');
    } catch (e) {
      alert('خطا در Discover/Harvest');
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

  // افزودن نقشه آفلاین به کاتالوگ SDI و انتشار
  const addOfflineToCatalogAndPublish = async (offlineId: number) => {
    try {
      setLoading(true);
      const res = await authFetch(apiBase, `/sdi/offline/harvest-from-offline-map/${offlineId}`, { method: 'POST' });
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('دسترسی کافی ندارید (نیاز به نقش ADMIN).');
        }
        const detail = await res.text().catch(() => '');
        throw new Error(detail || 'harvest failed');
      }
      const sdiMap = await res.json();
      const pub = await authFetch(apiBase, `/sdi/maps/${sdiMap.id}/publish`, { method: 'POST' });
      if (!pub.ok) {
        if (pub.status === 403) {
          throw new Error('انتشار نیاز به نقش ADMIN دارد.');
        }
        const detail = await pub.text().catch(() => '');
        throw new Error(detail || 'publish failed');
      }
      await loadCatalog();
      await loadOfflineSdiStatus();
      setActiveStep(2);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'خطا در Harvest/Publish');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('resources.maps.deleteConfirm'))) {
      const layer = mapLayers.find((l) => l.id === id);
      if (layer?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(layer.url);
      }
      dispatch(deleteMapLayer(id));
    }
  };

  // گروه‌بندی لایه‌ها بر اساس نوع
  const serverLayers = mapLayers.filter(l => ['wms', 'wmts', 'xyz', 'osm'].includes(l.type));
  const uploadedLayers = mapLayers.filter(l => ['vector', 'raster'].includes(l.type));

  // Steps برای Stepper
  const steps = ['افزودن منبع', 'همگام‌سازی', 'بازبینی و انتشار'];

  return (
    <Box sx={{ px: 2, pt: 2, pb: 2 }}>
      {/* Stepper برای workflow */}
      <Paper sx={{ p: 3, mb: 3, position: 'relative' }}>
        <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1 }}>
          <Button
            variant="outlined"
            startIcon={<HelpOutline />}
            onClick={() => setHelpModalOpen(true)}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            راهنمای استفاده
          </Button>
        </Box>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel
                optional={
                  index === 0 && offlineMaps.length > 0 ? (
                    <Typography variant="caption" color="primary.main">✓ منابع اضافه شد</Typography>
                  ) : index === 1 && lastHarvestTime ? (
                    <Typography variant="caption" color="primary.main">✓ همگام‌سازی انجام شد</Typography>
                  ) : index === 2 && catalogLayers.filter(l => l.status === 'published').length > 0 ? (
                    <Typography variant="caption" color="primary.main">✓ منتشر شد</Typography>
                  ) : null
                }
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
        {activeStep === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            در تب «منابع»، سرور SDI را اضافه کنید یا نقشه‌های آفلاین را آپلود کنید.
          </Alert>
        )}
        {activeStep === 1 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            در تب «کاتالوگ»، لایه‌های Harvest شده را بازبینی کنید و منتشر کنید.
          </Alert>
        )}
        {activeStep === 2 && (
          <Alert severity="success" sx={{ mt: 2 }}>
            لایه‌ها منتشر شدند. در تب «کاتالوگ» می‌توانید وضعیت را مشاهده کنید.
          </Alert>
        )}
      </Paper>

      {/* Tabs برای بخش‌های مختلف */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<Source />} iconPosition="start" label="منابع (Sources)" />
          <Tab icon={<Inventory />} iconPosition="start" label="کاتالوگ (Catalog)" />
          <Tab icon={<History />} iconPosition="start" label="Job‌ها / Log‌ها" />
          <Tab icon={<Settings />} iconPosition="start" label="تنظیمات" />
        </Tabs>
      </Paper>

      {/* محتوای تب‌ها */}
      <TabPanel value={activeTab} index={0}>
        {/* تب Sources */}
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
                <Chip label={`فعال: ${offlineMaps.filter(m=>m.is_active).length}`} color="primary" size="small" />
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
                  onClick={() => handleOpenDialog('serverLayer')}
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
                          secondaryTypographyProps={{ component: 'div' }}
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
                          secondaryTypographyProps={{ component: 'div' }}
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

        {/* بخش مدیریت سرورهای SDI - تمام صفحه */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Public color="primary" sx={{ fontSize: 32 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    مدیریت سرورهای SDI
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    افزودن و مدیریت سرورهای نقشه SDI (GeoServer, WMS, WMTS و...)
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={openServerDialog}
                sx={{ borderRadius: 2 }}
              >
                افزودن سرور جدید
              </Button>
            </Box>

            {servers.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, border: '2px dashed', borderColor: 'divider', borderRadius: 2 }}>
                <Public sx={{ fontSize: 80, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  هیچ سروری ثبت نشده است
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  برای شروع، یک سرور نقشه SDI اضافه کنید
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={openServerDialog}
                >
                  افزودن اولین سرور
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>نام سرور</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>URL پایه</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">نوع سرویس‌ها</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">نوع احراز هویت</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">وضعیت</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">تاریخ ایجاد</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center" width={180}>عملیات</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {servers.map((server) => (
                      <TableRow key={server.id} hover>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {server.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 400 }}>
                            {server.base_url}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                            {(server.service_types || []).map((type, idx) => (
                              <Chip
                                key={idx}
                                label={type.toUpperCase()}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            ))}
                            {(!server.service_types || server.service_types.length === 0) && (
                              <Typography variant="caption" color="text.secondary">-</Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={server.auth_type === 'none' ? 'بدون احراز هویت' : server.auth_type || 'none'}
                            size="small"
                            color={server.auth_type === 'none' ? 'default' : 'warning'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={server.status === 'active' ? 'فعال' : 'غیرفعال'}
                            size="small"
                            color={server.status === 'active' ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="caption" color="text.secondary">
                            {server.created_at ? new Date(server.created_at).toLocaleDateString('fa-IR') : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            <Tooltip title="Harvest - دریافت لایه‌ها از سرور">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={async () => {
                                  try {
                                    await authFetch(apiBase, `/sdi/servers/${server.id}/harvest`, { method: 'POST' });
                                    await loadCatalog();
                                  } catch (error) {
                                    console.error('خطا در Harvest:', error);
                                  }
                                }}
                              >
                                <CloudSync fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Test Connection - تست اتصال">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={async () => {
                                  try {
                                    const res = await authFetch(apiBase, `/sdi/servers/${server.id}/test`, { method: 'POST' });
                                    const data = await res.json().catch(() => ({}));
                                    if (!res.ok) {
                                      const detail = typeof (data as { detail?: unknown }).detail === 'string'
                                        ? (data as { detail: string }).detail
                                        : `HTTP ${res.status}`;
                                      alert(`اتصال ناموفق (${detail})`);
                                      return;
                                    }
                                    if (data.ok) {
                                      alert(`اتصال موفق ✓ (کد HTTP ${(data as { status?: number }).status ?? '—'})`);
                                    } else {
                                      alert(`اتصال ناموفق: ${(data as { error?: string }).error || 'خطای نامشخص'}`);
                                    }
                                  } catch {
                                    alert('خطا در تست اتصال');
                                  }
                                }}
                              >
                                <CheckCircle fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="حذف سرور">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={async () => {
                                  if (confirm(`آیا از حذف سرور "${server.name}" اطمینان دارید؟`)) {
                                    try {
                                      await authFetch(apiBase, `/sdi/servers/${server.id}`, { method: 'DELETE' });
                                      await loadServers();
                                    } catch (error) {
                                      console.error('خطا در حذف سرور:', error);
                                    }
                                  }
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
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
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                              {map.is_active ? <Chip label="فعال" color="primary" size="small" /> : <Chip label="غیرفعال" size="small" />}
                              {offlineSdiStatus[map.id]?.status && (
                                <Chip 
                                  label={`SDI: ${offlineSdiStatus[map.id]?.status}`}
                                  size="small"
                                  color={offlineSdiStatus[map.id]?.status === 'published' ? 'primary' : offlineSdiStatus[map.id]?.status === 'draft' ? 'warning' : 'default'}
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                              <Tooltip title="افزودن به کاتالوگ و انتشار">
                                <IconButton 
                                  size="small" 
                                  color="info"
                                  onClick={() => addOfflineToCatalogAndPublish(map.id)}
                                  aria-label={`افزودن ${map.name} به کاتالوگ و انتشار`}
                                >
                                  <CloudSync fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {offlineSdiStatus[map.id]?.status === 'published' && offlineSdiStatus[map.id]?.mapId && (
                                <Tooltip title="Retire در SDI">
                                  <IconButton size="small" color="warning" onClick={async () => {
                                    try {
                                      const id = offlineSdiStatus[map.id]?.mapId as number;
                                      const r = await authFetch(apiBase, `/sdi/maps/${id}/retire`, { method: 'POST' });
                                      if (r.ok) {
                                        await loadCatalog();
                                        await loadOfflineSdiStatus();
                                      }
                                    } catch {}
                                  }}>
                                    <Block fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title={map.is_active ? 'غیرفعال کردن' : 'فعال کردن'}>
                                <IconButton 
                                  size="small" 
                                  color={map.is_active ? "warning" : "primary"}
                                  onClick={() => toggleOfflineMap(map)}
                                  aria-label={map.is_active ? 'غیرفعال کردن نقشه' : 'فعال کردن نقشه'}
                                >
                                  {map.is_active ? <Cancel fontSize="small" /> : <CheckCircle fontSize="small" />}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="دانلود">
                                <IconButton 
                                  size="small" 
                                  color="primary"
                                  onClick={() => window.open(`${apiBase}/maps/${map.id}/download`)}
                                  aria-label={`دانلود نقشه ${map.name}`}
                                >
                                  <Download fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="حذف">
                                <IconButton 
                                  size="small" 
                                  color="error" 
                                  onClick={() => requestDeleteOfflineMap(map)}
                                  aria-label={`حذف نقشه ${map.name}`}
                                >
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
                  <Typography variant="h3" color="primary.main">
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
      </TabPanel>

      {/* تب Catalog */}
      <TabPanel value={activeTab} index={1}>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6">کاتالوگ لایه‌ها</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <TextField 
                size="small" 
                placeholder="جست‌وجو..." 
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                sx={{ width: 250 }} 
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>وضعیت</InputLabel>
                <Select
                  value={catalogFilterStatus}
                  label="وضعیت"
                  onChange={(e) => setCatalogFilterStatus(e.target.value as any)}
                >
                  <MenuItem value="all">همه</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="retired">Retired</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>نوع</InputLabel>
                <Select
                  value={catalogFilterType}
                  label="نوع"
                  onChange={(e) => setCatalogFilterType(e.target.value)}
                >
                  <MenuItem value="all">همه</MenuItem>
                  <MenuItem value="wms">WMS</MenuItem>
                  <MenuItem value="wmts">WMTS</MenuItem>
                  <MenuItem value="xyz">XYZ</MenuItem>
                  <MenuItem value="raster-xyz">Raster XYZ</MenuItem>
                </Select>
              </FormControl>
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={catalogLoading ? <CircularProgress size={16} color="inherit" /> : <Sync />}
                onClick={loadCatalog}
                disabled={catalogLoading}
              >
                همگام‌سازی
              </Button>
              {selectedLayers.length > 0 && (
                <Button 
                  variant="contained" 
                  size="small" 
                  startIcon={<Publish />}
                  onClick={() => publishCatalog(selectedLayers)}
                >
                  انتشار گروهی ({selectedLayers.length})
                </Button>
              )}
            </Box>
          </Box>
          {catalogLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <LinearProgress sx={{ mb: 2 }} />
              <Typography>در حال بارگذاری...</Typography>
            </Box>
          ) : filteredCatalogLayers.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              {catalogLayers.length === 0 
                ? 'هیچ لایه‌ای در کاتالوگ یافت نشد. ابتدا منابع را اضافه کنید و Harvest انجام دهید.'
                : 'با فیلتر انتخابی هیچ لایه‌ای یافت نشد.'}
            </Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedLayers.length > 0 && selectedLayers.length < filteredCatalogLayers.length}
                        checked={filteredCatalogLayers.length > 0 && selectedLayers.length === filteredCatalogLayers.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLayers(filteredCatalogLayers.map(l => l.id));
                          } else {
                            setSelectedLayers([]);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>عنوان/نام</TableCell>
                    <TableCell>نوع</TableCell>
                    <TableCell>min/maxZoom</TableCell>
                    <TableCell>SRS</TableCell>
                    <TableCell>تاریخ به‌روزرسانی</TableCell>
                    <TableCell>وضعیت</TableCell>
                    <TableCell align="center">عملیات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCatalogLayers.map((layer) => (
                    <TableRow key={layer.id} hover selected={selectedLayers.includes(layer.id)}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedLayers.includes(layer.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLayers([...selectedLayers, layer.id]);
                            } else {
                              setSelectedLayers(selectedLayers.filter(id => id !== layer.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">{layer.title}</Typography>
                        {layer.description && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {layer.description.substring(0, 50)}...
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={layer.type} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        {layer.minzoom !== undefined && layer.maxzoom !== undefined 
                          ? `${layer.minzoom}/${layer.maxzoom}`
                          : '-'}
                      </TableCell>
                      <TableCell>{layer.srs || '-'}</TableCell>
                      <TableCell>{layer.updated || '-'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={layer.status === 'published' ? 'Published' : layer.status === 'draft' ? 'Draft' : 'Retired'}
                          size="small"
                          color={layer.status === 'published' ? 'primary' : layer.status === 'draft' ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="Preview">
                            <IconButton 
                              size="small" 
                              onClick={() => setPreviewLayer(layer)}
                              aria-label={`Preview لایه ${layer.title}`}
                            >
                              <Preview fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton 
                              size="small" 
                              onClick={() => setEditLayer(layer)}
                              aria-label={`ویرایش لایه ${layer.title}`}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {layer.status !== 'published' && (
                            <Tooltip title="Publish">
                              <IconButton 
                                size="small" 
                                color="primary" 
                                onClick={() => publishCatalog([layer.id])}
                                aria-label={`انتشار لایه ${layer.title}`}
                              >
                                <Publish fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {layer.status === 'published' && (
                            <Tooltip title="Retire">
                              <IconButton 
                                size="small" 
                                color="warning" 
                                onClick={async () => {
                                  if (!layer.adminMapId) return;
                                  try {
                                    const res = await authFetch(apiBase, `/sdi/maps/${layer.adminMapId}/retire`, { method: 'POST' });
                                    if (res.ok) await loadCatalog();
                                  } catch {}
                                }}
                                aria-label={`Retire لایه ${layer.title}`}
                              >
                                <Block fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {layer.status === 'retired' && (
                            <Tooltip title="Rollback">
                              <IconButton 
                                size="small" 
                                onClick={() => rollbackCatalog()}
                                aria-label={`Rollback لایه ${layer.title}`}
                              >
                                <Undo fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </TabPanel>

      {/* تب Jobs/Logs */}
      <TabPanel value={activeTab} index={2}>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">وضعیت Jobها و Logها</Typography>
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<Refresh />}
              onClick={loadJobs}
              disabled={jobsLoading}
            >
              بروزرسانی
            </Button>
          </Box>
          {jobsLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <LinearProgress sx={{ mb: 2 }} />
              <Typography>در حال بارگذاری...</Typography>
            </Box>
          ) : jobs.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <History sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary">هنوز هیچ Jobی ثبت نشده است</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>نوع</TableCell>
                    <TableCell>وضعیت</TableCell>
                    <TableCell>شروع</TableCell>
                    <TableCell>پایان</TableCell>
                    <TableCell>مدت اجرا</TableCell>
                    <TableCell>تعداد لایه</TableCell>
                    <TableCell align="center">عملیات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id} hover>
                      <TableCell>
                        <Chip 
                          label={job.type === 'harvest' ? 'Harvest' : job.type === 'publish' ? 'Publish' : 'Rollback'}
                          size="small"
                          color={job.type === 'harvest' ? 'primary' : job.type === 'publish' ? 'primary' : 'warning'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          icon={
                            job.status === 'running' ? undefined :
                            job.status === 'success' ? <CheckCircle /> : <Cancel />
                          }
                          label={
                            job.status === 'running' ? 'در حال اجرا' :
                            job.status === 'success' ? 'موفق' : 'ناموفق'
                          }
                          size="small"
                          color={job.status === 'running' ? 'info' : job.status === 'success' ? 'primary' : 'error'}
                        />
                      </TableCell>
                      <TableCell>{new Date(job.startTime).toLocaleString('fa-IR')}</TableCell>
                      <TableCell>{job.endTime ? new Date(job.endTime).toLocaleString('fa-IR') : '-'}</TableCell>
                      <TableCell>{formatDuration(job.duration)}</TableCell>
                      <TableCell>{job.layerCount || '-'}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          {job.log && job.log.length > 0 && (
                            <Tooltip title="مشاهده Log">
                              <IconButton 
                                size="small" 
                                onClick={() => {
                                  setSelectedJob(job);
                                  setShowLogDialog(true);
                                }}
                              >
                                <History fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {job.status === 'error' && (
                            <Tooltip title="اجرای مجدد">
                              <IconButton 
                                size="small" 
                                color="warning"
                                onClick={() => {/* Run Again */}}
                              >
                                <Refresh fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Dialog برای نمایش Log */}
          <Dialog
            open={showLogDialog}
            onClose={() => setShowLogDialog(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              Log Job: {selectedJob?.type} - {selectedJob?.id}
            </DialogTitle>
            <DialogContent>
              {selectedJob?.log && selectedJob.log.length > 0 ? (
                <Box sx={{ mt: 2 }}>
                  {selectedJob.log.map((line, index) => (
                    <Typography 
                      key={index} 
                      variant="body2" 
                      component="pre"
                      sx={{ 
                        fontFamily: 'monospace', 
                        fontSize: '0.75rem',
                        mb: 0.5,
                        color: line.toLowerCase().includes('error') ? 'error.main' : 'text.primary'
                      }}
                    >
                      {line}
                    </Typography>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">Log موجود نیست</Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowLogDialog(false)}>بستن</Button>
            </DialogActions>
          </Dialog>
        </Paper>
      </TabPanel>

      {/* تب Settings */}
      <TabPanel value={activeTab} index={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>تنظیمات</Typography>
          <Grid container spacing={3}>

            {/* بخش مدیریت مسیرهای مجاز تایل */}
            <Grid item xs={12}>
              <TileRootsManager apiBase={apiBase} />
            </Grid>

            {/* انتخاب Basemap پیش‌فرض از کاتالوگ (گزینه B) */}
            <Grid item xs={12} md={6}>
              <DefaultBasemapFromCatalog apiBase={apiBase} />
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="مسیر کاتالوگ" />
                <CardContent>
                  <TextField 
                    fullWidth 
                    label="مسیر layers.json" 
                    defaultValue="backend/static/maps/layers.json"
                    helperText="مسیر فایل کاتالوگ لایه‌ها (نسبت به root پروژه)"
                    sx={{ mb: 2 }}
                  />
                  <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                    برای به‌روزرسانی اتمیک، ابتدا layers.tmp.json نوشته می‌شود سپس rename به layers.json انجام می‌شود.
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="خط‌مشی انتشار" />
                <CardContent>
                  <FormControlLabel 
                    control={<Switch defaultChecked />} 
                    label="انتشار خودکار برای Basemapها" 
                    sx={{ mb: 1, display: 'block' }}
                  />
                  <FormControlLabel 
                    control={<Switch />} 
                    label="انتشار دستی برای همه لایه‌ها" 
                    sx={{ mb: 1, display: 'block' }}
                  />
                  <Alert severity="warning" sx={{ mt: 2, fontSize: '0.875rem' }}>
                    عملیات Publish/Rollback همیشه به صورت اتمیک انجام می‌شود تا از خرابی فایل جلوگیری شود.
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="نقش‌ها و دسترسی" />
                <CardContent>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>نقش پیش‌فرض برای لایه‌های جدید</InputLabel>
                    <Select defaultValue="user">
                      <MenuItem value="user">کاربر عادی</MenuItem>
                      <MenuItem value="admin">ادمین</MenuItem>
                      <MenuItem value="operator">اپراتور</MenuItem>
                    </Select>
                  </FormControl>
                  <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                    لایه‌ها بر اساس فیلد admin.roles فیلتر می‌شوند. کاربران عادی فقط لایه‌های مجاز را می‌بینند.
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="پیش‌فرض‌های UI" />
                <CardContent>
                  <FormControlLabel 
                    control={<Switch defaultChecked />} 
                    label="visibleByDefault برای Basemapها" 
                    sx={{ mb: 1, display: 'block' }}
                  />
                  <TextField 
                    fullWidth
                    label="Default Opacity"
                    type="number"
                    defaultValue={1.0}
                    inputProps={{ min: 0, max: 1, step: 0.1 }}
                    helperText="Opacity پیش‌فرض برای لایه‌های جدید"
                    sx={{ mt: 2 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </TabPanel>

      <Dialog
        open={serverDialogOpen}
        onClose={closeServerDialog}
        fullWidth
        maxWidth="md"
        sx={resourcesFormDialogSx}
      >
        <DialogTitle sx={resourcesDialogTitleSx(theme)}>
          ثبت سرور SDI جدید
        </DialogTitle>
        <DialogContent dividers sx={resourcesDialogContentDividersSx(theme)}>
          {serverError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {serverError}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                label="نام سرور"
                fullWidth
                required
                value={serverForm.name}
                onChange={(e) => handleServerInputChange('name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="URL پایه سرور"
                fullWidth
                required
                placeholder="https://example.com/geoserver"
                value={serverForm.baseUrl}
                onChange={(e) => handleServerInputChange('baseUrl', e.target.value)}
                helperText="آدرس کامل سرویس اصلی (بدون اسلش پایانی)"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>نوع سرویس‌ها</InputLabel>
                <Select
                  multiple
                  label="نوع سرویس‌ها"
                  value={serverForm.serviceTypes}
                  renderValue={(selected) => (selected as string[]).map(v => v.toUpperCase()).join(', ')}
                  onChange={(event) => {
                    const value = event.target.value;
                    handleServerInputChange(
                      'serviceTypes',
                      typeof value === 'string' ? value.split(',') : (value as string[])
                    );
                  }}
                >
                  {serverServiceOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      <Checkbox checked={serverForm.serviceTypes.indexOf(option.value) > -1} />
                      <ListItemText primary={option.label} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>نوع احراز هویت</InputLabel>
                <Select
                  label="نوع احراز هویت"
                  value={serverForm.authType}
                  onChange={(event) => handleServerInputChange('authType', event.target.value as typeof serverForm.authType)}
                >
                  <MenuItem value="none">بدون احراز هویت</MenuItem>
                  <MenuItem value="basic">Basic Auth</MenuItem>
                  <MenuItem value="token">Token</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {serverForm.authType === 'basic' && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="نام کاربری"
                    fullWidth
                    value={serverForm.username}
                    onChange={(e) => handleServerInputChange('username', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="رمز عبور"
                    type="password"
                    fullWidth
                    value={serverForm.password}
                    onChange={(e) => handleServerInputChange('password', e.target.value)}
                  />
                </Grid>
              </>
            )}
            {serverForm.authType === 'token' && (
              <Grid item xs={12}>
                <TextField
                  label="توکن دسترسی"
                  fullWidth
                  value={serverForm.token}
                  onChange={(e) => handleServerInputChange('token', e.target.value)}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={resourcesDialogActionsSx(theme)}>
          <Button
            onClick={closeServerDialog}
            disabled={serverSubmitting}
            variant="outlined"
            color="inherit"
            sx={resourcesOutlinedCancelButtonSx(theme)}
          >
            انصراف
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={submitServerForm}
            disabled={serverSubmitting}
            startIcon={serverSubmitting ? <CircularProgress size={18} color="inherit" /> : null}
            sx={{ borderRadius: 2, px: 3 }}
          >
            ثبت سرور
          </Button>
        </DialogActions>
      </Dialog>

      {/* دیالوگ افزودن لایه */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        sx={resourcesLayerDialogSx}
      >
        <DialogTitle sx={resourcesDialogTitleSx(theme)}>
          {dialogMode === 'offline' ? 'آپلود نقشه آفلاین' : 
           dialogMode === 'filesystem' ? 'ثبت نقشه پوشه‌ای' :
           dialogMode === 'serverLayer' ? t('resources.maps.dialog.addFromServerTitle') : 
           t('resources.maps.dialog.uploadFileTitle')}
        </DialogTitle>
        <DialogContent dividers sx={resourcesDialogContentDividersSx(theme)}>
          {uploadError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {uploadError}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 0.5 }}>
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
                    sx={resourcesOutlinedCancelButtonSx(theme)}
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
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" display="block">
                        فایل انتخاب شده: {offlineFormData.file.name}
                      </Typography>
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <Box sx={{ mt: 1 }}>
                          <LinearProgress variant="determinate" value={uploadProgress} sx={{ mb: 0.5 }} />
                          <Typography variant="caption" color="text.secondary">
                            {Math.round(uploadProgress)}% آپلود شده
                          </Typography>
                        </Box>
                      )}
                    </Box>
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
                    value={filesystemFolders.find(o => o.value === filesystemFormData.folder) || null}
                    isOptionEqualToValue={(opt, val) => opt.value === val.value}
                    inputValue={filesystemFolderInput}
                    onInputChange={(_, newInputValue) => {
                      setFilesystemFolderInput(newInputValue);
                      // فقط وقتی که از لیست انتخاب نشده، folder را به‌روزرسانی کن
                      if (!filesystemFolders.find(o => o.value === newInputValue)) {
                        setFilesystemFormData({ ...filesystemFormData, folder: newInputValue });
                      }
                    }}
                    onChange={(_, newValue) => {
                      if (newValue && typeof newValue !== 'string') {
                        setFilesystemFormData({ ...filesystemFormData, folder: newValue.value });
                        setFilesystemFolderInput(newValue.value || '');
                      } else if (typeof newValue === 'string') {
                        setFilesystemFormData({ ...filesystemFormData, folder: newValue });
                        setFilesystemFolderInput(newValue);
                      } else {
                        setFilesystemFormData({ ...filesystemFormData, folder: '' });
                        setFilesystemFolderInput('');
                      }
                    }}
                    loading={filesystemFoldersLoading}
                    sx={{ width: '100%' }}
                    getOptionLabel={(option) => {
                      if (typeof option === 'string') return option;
                      return option.label || option.value || '';
                    }}
                    renderOption={(props, option) => {
                      return (
                        <li {...props}>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2">
                              {option.label || option.value}
                            </Typography>
                            {option.relativePath && option.relativePath !== option.label && (
                              <Typography variant="caption" color="text.secondary">
                                {option.relativePath}
                              </Typography>
                            )}
                            {typeof option.tileCount === 'number' && (
                              <Typography variant="caption" color="text.secondary">
                                {`تایل‌ها: ${option.tileCount}`}
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
                
                {dialogMode === 'serverLayer' ? (
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
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={<Checkbox checked={saveAsSdiServer} onChange={(e) => setSaveAsSdiServer(e.target.checked)} />}
                        label="ذخیره به عنوان SDI Server"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Button onClick={testServerConnection} variant="outlined" size="small" startIcon={testConnLoading ? <CircularProgress size={16} /> : <Sync />} disabled={testConnLoading || !formData.url}>
                        Test Connection {testConnResult ? `(${testConnResult})` : ''}
                      </Button>
                      <Button onClick={discoverServerLayers} variant="contained" size="small" sx={{ ml: 1 }} disabled={!formData.url} startIcon={<CloudSync />}>
                        Discover/Harvest
                      </Button>
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
                          <MenuItem value="shapefile">Shapefile (ZIP)</MenuItem>
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
                        sx={resourcesOutlinedCancelButtonSx(theme)}
                      >
                        {t('resources.maps.dialog.selectFileButton')}
                        <input
                          type="file"
                          hidden
                          accept=".geojson,.json,.kml,.gpx,.tif,.tiff,.zip"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setFormData({ ...formData, file: e.target.files[0] });
                            }
                          }}
                        />
                      </Button>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        برای Shapefile، ZIP را با shp/dbf/shx (و ترجیحاً prj) بفرستید. اگر prj ندارید، EPSG سیستم مختصات را پایین وارد کنید (مثل ۳۲۶۳۹ برای یک ناحیهٔ UTM در ایران؛ بستهٔ پروژهٔ شما ممکن است متفاوت باشد).
                      </Typography>
                      {formData.format === 'shapefile' && (
                        <TextField
                          fullWidth
                          sx={{ mt: 2 }}
                          label="EPSG (اختیاری — اگر بدون فایل .prj آپلود می‌کنید)"
                          placeholder="32639"
                          value={vectorCrsEpsg}
                          onChange={(e) => setVectorCrsEpsg(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                          helperText="فقط اعداد؛ خالی یعنی باید .prj داخل ZIP باشد یا مختصات از قبل طول‌عرض جغرافی است."
                        />
                      )}
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
        <DialogActions sx={resourcesDialogActionsSx(theme)}>
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            color="inherit"
            sx={resourcesOutlinedCancelButtonSx(theme)}
          >
            انصراف
          </Button>
          <Button
            onClick={() => void handleSave()}
            variant="contained"
            color="primary"
            disabled={
              vectorUploadLoading ||
              (dialogMode === 'offline'
                ? !offlineFormData.name || !offlineFormData.file
                : dialogMode === 'filesystem'
                  ? !filesystemFormData.name || !filesystemFormData.folder
                  : dialogMode === 'serverLayer'
                    ? !formData.name?.trim() || !formData.url?.trim()
                    : !formData.name?.trim() ||
                      !formData.file ||
                      !formData.format?.trim() ||
                      formData.format === 'geotiff')
            }
            startIcon={
              dialogMode === 'upload' && vectorUploadLoading ? (
                <CircularProgress size={18} color="inherit" />
              ) : null
            }
            sx={{ borderRadius: 2, px: 3 }}
          >
            {dialogMode === 'offline' ? 'آپلود نقشه' :
             dialogMode === 'filesystem' ? 'ثبت نقشه' :
            dialogMode === 'serverLayer' ? t('resources.maps.dialog.addButton') : 
             t('resources.maps.dialog.uploadButton')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal راهنمای استفاده */}
      <Dialog
        open={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: alpha('#000', 0.5),
              backdropFilter: 'blur(4px)',
            },
          },
        }}
        sx={{
          zIndex: 1300,
          '& .MuiDialog-paper': {
            borderRadius: isMobile ? 0 : '20px',
            maxHeight: isMobile ? '100vh' : '90vh',
            backgroundColor: (theme) => alpha(theme.palette.primary.light, 0.05),
            backdropFilter: 'blur(20px)',
            border: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
            boxShadow: (theme) => `0 20px 60px ${alpha(theme.palette.primary.light, 0.3)}`,
          },
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
            borderBottom: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            py: 3,
            px: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <HelpOutline sx={{ color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" fontWeight={700} sx={{ color: 'primary.main' }}>
            راهنمای سرو نقشه‌ها
          </Typography>
          <IconButton
            onClick={() => setHelpModalOpen(false)}
            size="small"
            sx={{
              ml: 'auto',
              color: 'primary.main',
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
              },
            }}
          >
            <Cancel />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 4, backgroundColor: alpha(theme.palette.background.paper, 0.5) }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
              دو روش برای سرو نقشه‌ها
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              سیستم شما از دو روش برای مدیریت و سرو نقشه‌ها پشتیبانی می‌کند. بر اساس حجم داده‌ها و نیازهای خود، یکی از این روش‌ها را انتخاب کنید.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {/* روش 1: Mount مستقیم */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: '16px',
                  border: (theme) => `2px solid ${alpha(theme.palette.info.main, 0.3)}`,
                  backgroundColor: alpha(theme.palette.info.light, 0.05),
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.info.main, 0.2)}`,
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <StorageIcon sx={{ fontSize: 32, color: 'info.main', mr: 1 }} />
                  <Typography variant="h6" fontWeight={700} sx={{ color: 'info.main' }}>
                    روش 1: Mount مستقیم
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  اتصال مستقیم هارد خارجی به کانتینرهای Docker
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                    مزایا:
                  </Typography>
                  <List dense>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircleOutline sx={{ fontSize: 16, color: 'primary.main' }} />
                      </ListItemIcon>
                      <ListItemText primary="ساده و سریع برای راه‌اندازی" />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircleOutline sx={{ fontSize: 16, color: 'primary.main' }} />
                      </ListItemIcon>
                      <ListItemText primary="بدون نیاز به سرور جداگانه" />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircleOutline sx={{ fontSize: 16, color: 'primary.main' }} />
                      </ListItemIcon>
                      <ListItemText primary="مناسب برای حجم متوسط (کمتر از 1TB)" />
                    </ListItem>
                  </List>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'warning.main' }}>
                    <Cancel sx={{ fontSize: 18, color: 'warning.main' }} />
                    معایب:
                  </Typography>
                  <List dense>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Cancel sx={{ fontSize: 16, color: 'warning.main' }} />
                      </ListItemIcon>
                      <ListItemText primary="وابسته به سیستم اصلی" />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Cancel sx={{ fontSize: 16, color: 'warning.main' }} />
                      </ListItemIcon>
                      <ListItemText primary="برای حجم بالا (10TB+) کندتر است" />
                    </ListItem>
                  </List>
                </Box>

                <Paper sx={{ p: 2, backgroundColor: alpha(theme.palette.info.main, 0.1), borderRadius: '8px' }}>
                  <Typography variant="caption" fontWeight={600} display="block" gutterBottom>
                    نحوه استفاده:
                  </Typography>
                  <Typography variant="body2" component="div">
                    <ol style={{ margin: 0, paddingRight: '20px' }}>
                      <li>هارد خارجی را به سرور متصل کنید</li>
                      <li>در docker-compose.yml، متغیر EXTERNAL_MAPS_PATH را تنظیم کنید</li>
                      <li>نقشه‌ها را در پوشه مشخص شده قرار دهید</li>
                      <li>از بخش "ثبت پوشه" استفاده کنید</li>
                    </ol>
                  </Typography>
                </Paper>
              </Paper>
            </Grid>

            {/* روش 2: سرور جداگانه */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: '16px',
                  border: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  backgroundColor: alpha(theme.palette.primary.light, 0.05),
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CloudQueue sx={{ fontSize: 32, color: 'primary.main', mr: 1 }} />
                  <Typography variant="h6" fontWeight={700} sx={{ color: 'primary.main' }}>
                    روش 2: سرور نقشه جداگانه (توصیه برای 10TB+)
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  راه‌اندازی TileServer-GL جداگانه و اتصال از طریق SDI
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                    مزایا:
                  </Typography>
                  <List dense>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircleOutline sx={{ fontSize: 16, color: 'primary.main' }} />
                      </ListItemIcon>
                      <ListItemText primary="جداسازی کامل از سیستم اصلی" />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircleOutline sx={{ fontSize: 16, color: 'primary.main' }} />
                      </ListItemIcon>
                      <ListItemText primary="عملکرد بهتر برای حجم بالا" />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircleOutline sx={{ fontSize: 16, color: 'primary.main' }} />
                      </ListItemIcon>
                      <ListItemText primary="مقیاس‌پذیری و انعطاف بیشتر" />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircleOutline sx={{ fontSize: 16, color: 'primary.main' }} />
                      </ListItemIcon>
                      <ListItemText primary="مناسب برای 10TB+ داده" />
                    </ListItem>
                  </List>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'info.main' }}>
                    <Info sx={{ fontSize: 18, color: 'info.main' }} />
                    نکات:
                  </Typography>
                  <List dense>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Info sx={{ fontSize: 16, color: 'info.main' }} />
                      </ListItemIcon>
                      <ListItemText primary="نیاز به راه‌اندازی TileServer-GL" />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Info sx={{ fontSize: 16, color: 'info.main' }} />
                      </ListItemIcon>
                      <ListItemText primary="از طریق SDI Server ثبت می‌شود" />
                    </ListItem>
                  </List>
                </Box>

                <Paper sx={{ p: 2, backgroundColor: alpha(theme.palette.primary.main, 0.1), borderRadius: '8px' }}>
                  <Typography variant="caption" fontWeight={600} display="block" gutterBottom>
                    نحوه استفاده:
                  </Typography>
                  <Typography variant="body2" component="div">
                    <ol style={{ margin: 0, paddingRight: '20px' }}>
                      <li>TileServer-GL را روی هارد خارجی راه‌اندازی کنید</li>
                      <li>سرور نقشه را در بخش "SDI Servers" ثبت کنید</li>
                      <li>از Harvest برای دریافت لایه‌ها استفاده کنید</li>
                      <li>لایه‌ها را در کاتالوگ منتشر کنید</li>
                    </ol>
                  </Typography>
                </Paper>
              </Paper>
            </Grid>
          </Grid>

          {/* جدول مقایسه */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
              جدول مقایسه
            </Typography>
            <TableContainer component={Paper} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
                    <TableCell sx={{ fontWeight: 700 }}>ویژگی</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Mount مستقیم</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>سرور جداگانه</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>سادگی راه‌اندازی</TableCell>
                    <TableCell align="center">
                      <Chip label="⭐⭐⭐⭐⭐" size="small" color="primary" />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label="⭐⭐⭐" size="small" color="info" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>عملکرد برای حجم بالا</TableCell>
                    <TableCell align="center">
                      <Chip label="⭐⭐⭐" size="small" color="warning" />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label="⭐⭐⭐⭐⭐" size="small" color="primary" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>مقیاس‌پذیری</TableCell>
                    <TableCell align="center">
                      <Chip label="⭐⭐" size="small" color="warning" />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label="⭐⭐⭐⭐⭐" size="small" color="primary" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>جداسازی</TableCell>
                    <TableCell align="center">
                      <Chip label="⭐⭐" size="small" color="warning" />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label="⭐⭐⭐⭐⭐" size="small" color="primary" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>مناسب برای حجم</TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">کمتر از 1TB</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        1TB+ (10TB+ توصیه می‌شود)
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* توصیه نهایی */}
          <Alert severity="success" sx={{ mt: 4, borderRadius: '12px' }} icon={<CheckCircleIcon />}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              توصیه نهایی
            </Typography>
            <Typography variant="body2">
              برای حجم کمتر از 1TB از <strong>روش 1 (Mount مستقیم)</strong> استفاده کنید. 
              برای حجم 1TB یا بیشتر، به ویژه 10TB+، از <strong>روش 2 (سرور جداگانه)</strong> استفاده کنید تا بهترین عملکرد را داشته باشید.
            </Typography>
          </Alert>
        </DialogContent>

        <DialogActions sx={{ p: 3, backgroundColor: alpha(theme.palette.background.paper, 0.5) }}>
          <Button
            onClick={() => setHelpModalOpen(false)}
            variant="contained"
            sx={{
              borderRadius: '12px',
              px: 4,
              py: 1.5,
              fontWeight: 600,
            }}
          >
            متوجه شدم
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
