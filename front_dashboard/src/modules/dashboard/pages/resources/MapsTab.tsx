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
  const response = await fetch(`${baseUrl}${endpoint}`, { ...options, headers });
  
  // Handle 401 Unauthorized
  if (response.status === 401) {
    localStorage.removeItem('access_token');
    // Optionally redirect to login or show toast
    if (window.location.pathname !== '/login') {
      window.location.href = '/login?reason=session_expired';
    }
    throw new Error('Session expired. Please login again.');
  }
  
  return response;
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

// Interface برای کاتالوگ لایه‌ها
interface CatalogLayer {
  id: string;
  title: string;
  type: string;
  minzoom?: number;
  maxzoom?: number;
  srs?: string;
  updated?: string;
  status: 'draft' | 'published' | 'retired';
  category?: string;
  description?: string;
  bbox?: number[];
  path?: string;
  adminMapId?: number;
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

const MapsTab: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const apiBase = useMemo(resolveApiBase, []);
  const mapLayers = useAppSelector(selectMapLayers);
  const activeOfflineMap = useAppSelector(selectActiveOfflineMap);
  
  // Stepper state برای workflow
  const [activeStep, setActiveStep] = useState(0); // 0: افزودن منبع, 1: همگام‌سازی, 2: بازبینی و انتشار
  
  // Tab state برای بخش‌های مختلف
  const [activeTab, setActiveTab] = useState(0); // 0: Sources, 1: Catalog, 2: Jobs, 3: Settings
  
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
  // SDI server integration in server dialog
  const [saveAsSdiServer, setSaveAsSdiServer] = useState(false);
  const [savedServerId, setSavedServerId] = useState<number | null>(null);
  const [testConnLoading, setTestConnLoading] = useState(false);
  const [testConnResult, setTestConnResult] = useState<string | null>(null);

  // SDI Servers management
  interface SdiServer { id: number; name: string; base_url: string; service_types: string[]; status: string; }
  const [servers, setServers] = useState<SdiServer[]>([]);
  const loadServers = useCallback(async () => {
    try {
      const res = await authFetch(apiBase, '/sdi/servers');
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data.servers) ? data.servers : [];
        setServers(items.map((s: any) => ({ id: s.id, name: s.name, base_url: s.base_url, service_types: s.service_types || [], status: s.status })));
      }
    } catch {}
  }, [apiBase]);
  useEffect(() => { loadServers(); }, [loadServers]);

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
        setUploadError('خطا در اتصال به سرور');
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

        // اگر نقشه فعال شد، آن را در mapSlice تنظیم کن
        if (willActivate && map.url_template) {
          dispatch(setActiveOfflineMap({
            id: map.id,
            name: map.name,
            url: map.url_template,
          }));
        } else {
          // اگر غیرفعال شد، mapSlice را خالی کن اگر این نقشه فعال بود
          const currentActive = offlineMaps.find(m => m.is_active);
          if (currentActive?.id === map.id) {
            dispatch(setActiveOfflineMap(null));
          }
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
    if (mode === 'server') {
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
  };

  const handleSave = () => {
    if (dialogMode === 'offline') {
      uploadOfflineMap();
    } else if (dialogMode === 'filesystem') {
      registerFilesystemMap();
    } else {
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
        } catch {}
      }
      dispatch(addMapLayer(formData as Omit<MapLayer, 'id'>));
      handleCloseDialog();
    }
  };

  const testServerConnection = async () => {
    if (!formData.url) return;
    setTestConnLoading(true);
    setTestConnResult(null);
    try {
      const params = new URLSearchParams({ base_url: String(formData.url) });
      const res = await authFetch(apiBase, `/sdi/servers/test?${params.toString()}`, { method: 'POST' });
      const data = await res.json();
      if (data.ok) setTestConnResult('موفق'); else setTestConnResult('ناموفق');
    } catch {
      setTestConnResult('ناموفق');
    } finally {
      setTestConnLoading(false);
    }
  };

  const discoverServerLayers = async () => {
    if (!formData.url) return;
    try {
      // همیشه یک سرور SDI موقت/جدید می‌سازیم تا harvest کنیم
      const body = {
        name: (() => { try { return new URL(String(formData.url)).host; } catch { return 'server'; } })(),
        base_url: formData.url,
        service_types: [formData.type || 'wms'],
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
      if (!res.ok) throw new Error('harvest failed');
      const sdiMap = await res.json();
      const pub = await authFetch(apiBase, `/sdi/maps/${sdiMap.id}/publish`, { method: 'POST' });
      if (!pub.ok) throw new Error('publish failed');
      await loadCatalog();
      await loadOfflineSdiStatus();
      setActiveStep(2);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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

  // Steps برای Stepper
  const steps = ['افزودن منبع', 'همگام‌سازی', 'بازبینی و انتشار'];

  return (
    <Box sx={{ px: 2, pt: 2, pb: 2 }}>
      {/* Stepper برای workflow */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel
                optional={
                  index === 0 && offlineMaps.length > 0 ? (
                    <Typography variant="caption" color="success.main">✓ منابع اضافه شد</Typography>
                  ) : index === 1 && lastHarvestTime ? (
                    <Typography variant="caption" color="success.main">✓ همگام‌سازی انجام شد</Typography>
                  ) : index === 2 && catalogLayers.filter(l => l.status === 'published').length > 0 ? (
                    <Typography variant="caption" color="success.main">✓ منتشر شد</Typography>
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

        {/* کارت مدیریت سرورها (SDI) */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="سرورهای SDI" avatar={<Public color="primary" />} sx={{ pb: 1 }} />
            <CardContent sx={{ pt: 1.5 }}>
              {servers.length > 0 ? (
                <List>
                  {servers.map((s, idx) => (
                    <React.Fragment key={s.id}>
                      <ListItem>
                        <ListItemText
                          primary={`${s.name}`}
                          secondary={<>
                            <Typography variant="caption" display="block" noWrap>URL: {s.base_url}</Typography>
                            <Typography variant="caption" display="block">Types: {(s.service_types || []).join(', ') || '-'}</Typography>
                          </>}
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Tooltip title="Harvest">
                              <IconButton size="small" onClick={async () => { try { await authFetch(apiBase, `/sdi/servers/${s.id}/harvest`, { method: 'POST' }); await loadCatalog(); } catch {} }}>
                                <CloudSync fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={async () => { if (confirm('حذف سرور؟')) { try { await authFetch(apiBase, `/sdi/servers/${s.id}`, { method: 'DELETE' }); await loadServers(); } catch {} } }}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {idx < servers.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">سروری ثبت نشده است</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* کارت کاتالوگ SDI منتشر شده */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="کاتالوگ منتشر شده"
              avatar={<Public color="secondary" />}
              action={
                <Button variant="outlined" size="small" onClick={loadCatalog} startIcon={<Download />}>بروزرسانی</Button>
              }
              sx={{ pb: 1 }}
            />
            <CardContent sx={{ pt: 1.5 }}>
              {catalogLoading ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <LinearProgress />
                </Box>
              ) : catalogLayers.length > 0 ? (
                <List>
                  {catalogLayers.map((l, idx) => (
                    <React.Fragment key={l.id || idx}>
                      <ListItem>
                        <ListItemText
                          primary={l.title || l.id}
                          secondary={<>
                            <Typography variant="caption" display="block">نوع: {l.type}</Typography>
                            <Typography variant="caption" display="block" noWrap>مسیر/URL: {l.path}</Typography>
                          </>}
                        />
                      </ListItem>
                      {idx < catalogLayers.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">لایه منتشر شده‌ای وجود ندارد</Typography>
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
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                              {map.is_active ? <Chip label="فعال" color="success" size="small" /> : <Chip label="غیرفعال" size="small" />}
                              {offlineSdiStatus[map.id]?.status && (
                                <Chip 
                                  label={`SDI: ${offlineSdiStatus[map.id]?.status}`}
                                  size="small"
                                  color={offlineSdiStatus[map.id]?.status === 'published' ? 'success' : offlineSdiStatus[map.id]?.status === 'draft' ? 'warning' : 'default'}
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
                                  onClick={() => toggleOfflineMap(map)}
                                  aria-label={map.is_active ? 'غیرفعال کردن نقشه' : 'فعال کردن نقشه'}
                                >
                                  {map.is_active ? <Cancel fontSize="small" /> : <CheckCircle fontSize="small" />}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="دانلود">
                                <IconButton 
                                  size="small" 
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
                          color={layer.status === 'published' ? 'success' : layer.status === 'draft' ? 'warning' : 'default'}
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
                                color="success" 
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
                          color={job.type === 'harvest' ? 'primary' : job.type === 'publish' ? 'success' : 'warning'}
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
                          color={job.status === 'running' ? 'info' : job.status === 'success' ? 'success' : 'error'}
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
                        برای Shapefile، فایل ZIP شامل shp/dbf/shx/prj را بارگذاری کنید.
                      </Typography>
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







