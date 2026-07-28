import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Toolbar,
  InputAdornment,
  Menu,
  MenuItem,
  Divider,
  ListSubheader,
  Fab,
  Tooltip,
  LinearProgress,
  Avatar,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  useMediaQuery,
  Fade,
  ThemeProvider,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  MoreVert,
  Edit,
  Delete,
  PlayArrow,
  Pause,
  Stop,
  Visibility,
  Assignment,
  Timeline,
  Map as MapIcon,
  Group,
  Schedule,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Info,
  ContentCopy,
  CloudUpload,
  Archive,
  Unarchive,
} from '@mui/icons-material';
import { alpha, createTheme } from '@mui/material/styles';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchScenarios,
  createScenario,
  updateScenario,
  deleteScenario,
  archiveScenario,
  restoreScenario,
  selectScenarios,
  selectScenariosLoading,
  selectScenariosError,
} from '@/store/slices/scenariosSlice';
import { selectUser } from '@/store/slices/authSlice';
import {
  showSuccessNotification,
  showErrorNotification,
} from '@/store/slices/uiSlice';
import type { Scenario } from '@/types';
import { ScenarioStatus } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useNavigate, useSearchParams } from 'react-router-dom';
import NewScenarioDialog from '@/components/scenarios/NewScenarioDialog';
import { scenarioApiService } from '@/services/api/scenarioApiService';
import KalknegarLaunchDialog from '@/components/common/KalknegarLaunchDialog';
import KalknegarLoadingDialog from '@/components/common/KalknegarLoadingDialog';
import UnityLaunchDialog from '@/components/common/UnityLaunchDialog';
import TransformFarsiNumbers from '@/components/common/TransformFarsiNumbers';
import PersianCalendarField from '@/components/common/PersianCalendarField';
import { localDateTimeToIso, toLocalDateTimeInput } from '@/utils/dateUtils';
import {
  buildResourcesFormDialogSx,
  resourcesDialogTitleSx,
  resourcesDialogContentDividersSx,
  resourcesDialogActionsSx,
  resourcesOutlinedCancelButtonSx,
} from '@/modules/dashboard/pages/resources/resourcesDialogStyles';

// انواع وضعیت سناریو
const getStatusOptions = (
  t: (key: string) => string
): {
  value: ScenarioStatus;
  label: string;
  color:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning';
}[] => [
  {
    value: ScenarioStatus.DRAFT,
    label: t('scenarios.status.draft'),
    color: 'default',
  },
  {
    value: ScenarioStatus.ACTIVE,
    label: t('scenarios.status.active'),
    color: 'primary',
  },
  {
    value: ScenarioStatus.PAUSED,
    label: t('scenarios.status.paused'),
    color: 'warning',
  },
  {
    value: ScenarioStatus.COMPLETED,
    label: t('scenarios.status.completed'),
    color: 'info',
  },
];

const isScenarioArchived = (scenario: Scenario) =>
  Boolean((scenario as Scenario & { archived_at?: string | null }).archived_at);

// کامپوننت آمار سناریوها
const ScenarioStats: React.FC<{ scenarios: Scenario[] }> = ({ scenarios }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const unifiedAccent = theme.palette.primary.main;
  const unifiedSurface = `linear-gradient(135deg, ${alpha(unifiedAccent, 0.07)}, ${alpha(unifiedAccent, 0.04)})`;

  const stats = {
    total: scenarios.length,
    active: scenarios.filter(s => s.status === 'active').length,
    completed: scenarios.filter(s => s.status === 'completed').length,
    draft: scenarios.filter(s => s.status === 'draft').length,
  };

  const statCards = [
    {
      title: t('scenarios.stats.total'),
      value: stats.total,
      icon: <Assignment />,
      color: 'primary',
    },
    {
      title: t('scenarios.stats.active'),
      value: stats.active,
      icon: <PlayArrow />,
      color: 'primary',
    },
    {
      title: t('scenarios.stats.completed'),
      value: stats.completed,
      icon: <CheckCircle />,
      color: 'info',
    },
    {
      title: t('scenarios.stats.draft'),
      value: stats.draft,
      icon: <Schedule />,
      color: 'warning',
    },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {statCards.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card
            sx={{
              background: unifiedSurface,
              border: `1px solid ${alpha(unifiedAccent, 0.24)}`,
              boxShadow: 'none',
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography
                    color="text.secondary"
                    gutterBottom
                    variant="body2"
                  >
                    {stat.title}
                  </Typography>
                  <Typography
                    variant="h4"
                    component="div"
                    sx={{ fontWeight: 700 }}
                  >
                    <TransformFarsiNumbers>{stat.value}</TransformFarsiNumbers>
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    bgcolor: alpha(unifiedAccent, 0.14),
                    color: unifiedAccent,
                    width: 48,
                    height: 48,
                  }}
                >
                  {stat.icon}
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// سناریوهای نمونه (demo) برگرفته از لندینگ کالک‌نگار
const DEMO_SCENARIOS: Scenario[] = [
  {
    id: 'demo-Operation_Beit_ol_Moqaddas_1982_FA',
    name: 'آزادسازی خرمشهر – عملیات بیت‌المقدس (۱۳۶۱)',
    description:
      'سناریوی نمونه تاریخی عملیات بیت‌المقدس برای نمایش توانمندی‌های سامانه.',
    startTime: '1982-05-01T00:00:00.000Z',
    endTime: '1982-06-01T00:00:00.000Z',
    status: ScenarioStatus.ACTIVE,
    units: [],
    layers: [],
    events: [],
    objectives: ['آزادسازی خرمشهر'],
    metadata: {
      demo: true,
      source: 'kalknegar-landing',
      image: '/kalknegar/scenarios/images/خرمشهر.jpg',
    },
    image: '/kalknegar/scenarios/images/خرمشهر.jpg',
    createdAt: '1982-05-01T00:00:00.000Z',
    updatedAt: '1982-06-01T00:00:00.000Z',
  } as any,
  {
    id: 'demo-Operation_Mersad_1988_FA',
    name: 'عملیات مرصاد (۱۳۶۷) – مقابله با تهاجم منافقین/حمایت عراق',
    description:
      'سناریوی نمونه تاریخی عملیات مرصاد برای آموزش و نمایش قابلیت‌ها.',
    startTime: '1988-07-25T00:00:00.000Z',
    endTime: '1988-08-05T00:00:00.000Z',
    status: ScenarioStatus.ACTIVE,
    units: [],
    layers: [],
    events: [],
    objectives: ['دفع تهاجم منافقین', 'تثبیت خطوط دفاعی غرب کشور'],
    metadata: {
      demo: true,
      source: 'kalknegar-landing',
      image: '/kalknegar/scenarios/images/مرصاد.jpg',
    },
    image: '/kalknegar/scenarios/images/مرصاد.jpg',
    createdAt: '1988-07-25T00:00:00.000Z',
    updatedAt: '1988-08-05T00:00:00.000Z',
  } as any,
];

const BUILTIN_DEMO_SCENARIO_IDS = new Set(
  DEMO_SCENARIOS.map(s => String((s as any)?.id))
);

const isBuiltinDemoScenario = (
  scenario?: Partial<Scenario> | null
): boolean => {
  if (!scenario) {
    return false;
  }

  const scenarioId = String((scenario as any)?.id || '');
  return BUILTIN_DEMO_SCENARIO_IDS.has(scenarioId);
};

const UNITY_HTTP_BRIDGE = (import.meta as any).env?.VITE_UNITY_LAUNCH_URL as
  | string
  | undefined;
const UNITY_PROTOCOL_BASE = (import.meta as any).env
  ?.VITE_UNITY_PROTOCOL_BASE as string | undefined;

const buildUnityLaunchUrl = (
  scenario: Scenario,
  backendLaunchUrl?: string,
  token?: string
) => {
  if (backendLaunchUrl) {
    return backendLaunchUrl;
  }

  if (UNITY_HTTP_BRIDGE) {
    const params = new URLSearchParams({
      scenarioId: String(scenario.id ?? ''),
      scenarioName: scenario.name ?? '',
    });
    if (token) {
      params.set('token', token);
    }
    const separator = UNITY_HTTP_BRIDGE.includes('?') ? '&' : '?';
    return `${UNITY_HTTP_BRIDGE}${separator}${params.toString()}`;
  }

  const protocolBase = UNITY_PROTOCOL_BASE || 'kalkunity://scenario';
  const payload = encodeURIComponent(
    JSON.stringify({
      id: scenario.id,
      name: scenario.name,
      token,
    })
  );
  return `${protocolBase}?payload=${payload}`;
};

// فرم ایجاد/ویرایش سناریو
interface ScenarioDialogProps {
  open: boolean;
  onClose: () => void;
  scenario?: Scenario;
  onSave: (scenario: Partial<Scenario>) => void;
}

const ScenarioDialog: React.FC<ScenarioDialogProps> = ({
  open,
  onClose,
  scenario,
  onSave,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const statusOptions = getStatusOptions(t);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'draft' as ScenarioStatus,
    startTime: '',
    endTime: '',
    objectives: '',
  });

  useEffect(() => {
    if (scenario) {
      setFormData({
        name: scenario.name,
        description: scenario.description,
        status: scenario.status,
        startTime: toLocalDateTimeInput(scenario.startTime),
        endTime: toLocalDateTimeInput(scenario.endTime),
        objectives: scenario.objectives?.join('\n') || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        status: ScenarioStatus.DRAFT,
        startTime: '',
        endTime: '',
        objectives: '',
      });
    }
  }, [scenario]);

  const handleSubmit = () => {
    const scenarioData: Partial<Scenario> = {
      name: formData.name,
      description: formData.description,
      status: formData.status,
      startTime: localDateTimeToIso(formData.startTime),
      endTime: localDateTimeToIso(formData.endTime),
      objectives: formData.objectives.split('\n').filter(obj => obj.trim()),
    };

    if (scenario) {
      scenarioData.id = scenario.id;
    }

    onSave(scenarioData);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={buildResourcesFormDialogSx(theme)}
    >
      <DialogTitle sx={resourcesDialogTitleSx(theme)}>
        {scenario
          ? t('scenarios.dialog.editTitle')
          : t('scenarios.dialog.createTitle')}
      </DialogTitle>
      <DialogContent dividers sx={resourcesDialogContentDividersSx(theme)}>
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label={t('scenarios.dialog.nameLabel')}
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>{t('scenarios.dialog.statusLabel')}</InputLabel>
              <Select
                value={formData.status}
                label={t('scenarios.dialog.statusLabel')}
                onChange={(e: SelectChangeEvent) =>
                  setFormData(prev => ({
                    ...prev,
                    status: e.target.value as ScenarioStatus,
                  }))
                }
              >
                {statusOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('scenarios.dialog.descriptionLabel')}
              multiline
              rows={3}
              value={formData.description}
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <PersianCalendarField
              label={t('scenarios.dialog.startTimeLabel')}
              value={formData.startTime}
              onChange={startTime =>
                setFormData(prev => ({ ...prev, startTime }))
              }
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <PersianCalendarField
              label={t('scenarios.dialog.endTimeLabel')}
              value={formData.endTime}
              onChange={endTime => setFormData(prev => ({ ...prev, endTime }))}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('scenarios.dialog.objectivesLabel')}
              multiline
              rows={4}
              value={formData.objectives}
              onChange={e =>
                setFormData(prev => ({ ...prev, objectives: e.target.value }))
              }
              placeholder={t('scenarios.dialog.objectivesPlaceholder')}
              helperText={t('scenarios.dialog.objectivesHelper')}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={resourcesDialogActionsSx(theme)}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          sx={resourcesOutlinedCancelButtonSx(theme)}
        >
          {t('scenarios.dialog.cancelButton')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={!formData.name.trim()}
          sx={{ borderRadius: 2, px: 3 }}
        >
          {scenario
            ? t('scenarios.dialog.saveButton')
            : t('scenarios.dialog.createButton')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// کامپوننت اصلی صفحه سناریوها
const ScenariosPage: React.FC = () => {
  const theme = useTheme();
  const unifiedAccent = theme.palette.primary.main;
  const unifiedSurface = `linear-gradient(135deg, ${alpha(unifiedAccent, 0.07)}, ${alpha(unifiedAccent, 0.04)})`;
  const unifiedPanelSx = {
    background: unifiedSurface,
    border: `1px solid ${alpha(unifiedAccent, 0.24)}`,
    boxShadow: 'none',
  };
  const sectionTheme = useMemo(
    () =>
      createTheme(theme, {
        components: {
          MuiDialog: {
            styleOverrides: {
              paper: {
                background: unifiedSurface,
                border: `1px solid ${alpha(unifiedAccent, 0.24)}`,
                borderRadius: 14,
              },
            },
          },
          MuiDialogTitle: {
            styleOverrides: {
              root: {
                borderBottom: `1px solid ${alpha(unifiedAccent, 0.18)}`,
              },
            },
          },
          MuiDialogActions: {
            styleOverrides: {
              root: {
                borderTop: `1px solid ${alpha(unifiedAccent, 0.18)}`,
              },
            },
          },
        },
      }),
    [theme, unifiedSurface, unifiedAccent]
  );
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useAppDispatch();

  // Soft flat background based on primary palette (same as KalknegarLaunchDialog)
  const getSoftSurface = () => {
    const primary = (theme.palette.primary.main || '#4a90e2').toLowerCase();
    const hex = primary.replace('#', '');
    // 1) Exact/brand buckets
    if (
      hex.includes('10b981') ||
      hex.includes('4caf50') ||
      hex.includes('2e7d32')
    )
      return '#f0f4f3'; // green
    if (
      hex.includes('4a90e2') ||
      hex.includes('1976d2') ||
      hex.includes('2196f3')
    )
      return '#f0f4f8'; // blue
    if (
      hex.includes('ef4444') ||
      hex.includes('f44336') ||
      hex.includes('d32f2f')
    )
      return '#fbf1f0'; // red
    if (
      hex.includes('6b21a8') ||
      hex.includes('9c27b0') ||
      hex.includes('673ab7')
    )
      return '#22262d'; // purple (dark)
    if (
      hex.includes('f59e0b') ||
      hex.includes('ff9800') ||
      hex.includes('fb8c00')
    )
      return '#fbf1f1'; // orange

    // 2) Generic: create a white-tinted version of primary (solid, 100% opacity)
    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    const hexToRgb = (h: string) => {
      const n =
        h.length === 3
          ? h
              .split('')
              .map(c => c + c)
              .join('')
          : h;
      const r = parseInt(n.substring(0, 2), 16);
      const g = parseInt(n.substring(2, 4), 16);
      const b = parseInt(n.substring(4, 6), 16);
      return { r, g, b };
    };
    const rgbToHex = (r: number, g: number, b: number) =>
      `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
    const blendWithWhite = (h: string, primaryWeight = 0.1) => {
      const { r, g, b } = hexToRgb(h);
      const wr = 255,
        wg = 255,
        wb = 255; // white
      const w = 1 - primaryWeight;
      const br = wr * w + r * primaryWeight;
      const bg = wg * w + g * primaryWeight;
      const bb = wb * w + b * primaryWeight;
      return rgbToHex(br, bg, bb);
    };
    if (/^[0-9a-f]{3,6}$/.test(hex)) {
      return blendWithWhite(hex, 0.1); // 10% رنگ اصلی + 90% سفید (تخت، 100% opacity)
    }
    // Fallback neutral tinted from theme primary.light if available
    try {
      const fallback = (theme.palette.primary.light || '#90caf9')
        .toLowerCase()
        .replace('#', '');
      return blendWithWhite(fallback, 0.08);
    } catch {
      return '#f5f7fa';
    }
  };
  const { t } = useTranslation();
  const statusOptions = getStatusOptions(t);
  const user = useAppSelector(selectUser);
  const scenarios = useAppSelector(selectScenarios);
  const loading = useAppSelector(selectScenariosLoading);
  const error = useAppSelector(selectScenariosError);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ScenarioStatus | 'all'>(
    'all'
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<
    Scenario | undefined
  >();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuScenario, setMenuScenario] = useState<Scenario | null>(null);
  const [scenarioActionLoading, setScenarioActionLoading] = useState<
    string | null
  >(null);
  const [scenarioToDelete, setScenarioToDelete] = useState<Scenario | null>(
    null
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileInfo, setSelectedFileInfo] = useState<{
    id?: string;
    name?: string;
    description?: string;
    type?: string;
    existingScenarioName?: string;
  } | null>(null);
  const [importUpdateConfirmOpen, setImportUpdateConfirmOpen] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [executionDialogOpen, setExecutionDialogOpen] = useState(false);
  const [kalknegarLaunchDialogOpen, setKalknegarLaunchDialogOpen] =
    useState(false);
  const [kalknegarLoadingOpen, setKalknegarLoadingOpen] = useState(false);
  const [kalknegarTargetUrl, setKalknegarTargetUrl] = useState<string>('');
  const [unityDialogOpen, setUnityDialogOpen] = useState(false);
  const [unityTargetScenario, setUnityTargetScenario] =
    useState<Scenario | null>(null);
  const [unityLaunching, setUnityLaunching] = useState(false);
  const [unityLaunchError, setUnityLaunchError] = useState<string | null>(null);
  const [unityFallbackLink, setUnityFallbackLink] = useState<string | null>(
    null
  );

  // بارگذاری اولیه
  useEffect(() => {
    dispatch(fetchScenarios({ include_archived: true }));
  }, [dispatch]);

  useEffect(() => {
    if (searchParams.get('create') !== '1') return;

    setSelectedScenario(undefined);
    setDialogOpen(true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('create');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // افزودن سناریوهای demo به سناریوهای سرور
  const allScenarios: Scenario[] = [...DEMO_SCENARIOS, ...scenarios];

  // فیلتر کردن سناریوها
  const filteredScenarios = allScenarios.filter(scenario => {
    const matchesSearch =
      scenario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scenario.description.toLowerCase().includes(searchTerm.toLowerCase());
    const isArchived = isScenarioArchived(scenario);
    const matchesStatus =
      statusFilter === ScenarioStatus.ARCHIVED
        ? isArchived
        : !isArchived &&
          (statusFilter === 'all' || scenario.status === statusFilter);

    return matchesSearch && matchesStatus;
  });

  // عملیات CRUD
  const handleCreateScenario = (scenarioData: Partial<Scenario>) => {
    // تبدیل به ScenarioFormData - شامل تمام فیلدها از جمله image و metadata
    const formData: any = {
      name: scenarioData.name || '',
      description: scenarioData.description || '',
      status: scenarioData.status || ScenarioStatus.DRAFT,
      startTime: scenarioData.startTime || '',
      endTime: scenarioData.endTime,
      objectives: scenarioData.objectives || [],
      // اضافه کردن تصویر از سطح اصلی یا metadata
      image:
        (scenarioData as any)?.image || (scenarioData as any)?.metadata?.image,
      // اضافه کردن metadata کامل
      metadata: (scenarioData as any)?.metadata || {},
    };
    return dispatch(createScenario(formData))
      .unwrap()
      .then(() => {
        setDialogOpen(false);
        dispatch(
          showSuccessNotification(t('scenarios.notifications.createSuccess'))
        );
      })
      .catch(error => {
        dispatch(
          showErrorNotification(t('scenarios.notifications.createError'))
        );
        throw error;
      });
  };

  const handleUpdateScenario = (scenarioData: Partial<Scenario>) => {
    if (scenarioData.id) {
      const demoScenario = isBuiltinDemoScenario(scenarioData);

      if (demoScenario) {
        const formData: any = {
          name: scenarioData.name || '',
          description: scenarioData.description || '',
          status: scenarioData.status || ScenarioStatus.DRAFT,
          startTime: scenarioData.startTime || '',
          endTime: scenarioData.endTime,
          objectives: scenarioData.objectives || [],
          image:
            (scenarioData as any)?.image ||
            (scenarioData as any)?.metadata?.image,
          metadata: (scenarioData as any)?.metadata || {},
        };
        return dispatch(createScenario(formData))
          .unwrap()
          .then(() => {
            setDialogOpen(false);
            setSelectedScenario(undefined);
            dispatch(fetchScenarios({ include_archived: true }));
            dispatch(
              showSuccessNotification(
                t('scenarios.notifications.createSuccess')
              )
            );
          })
          .catch(error => {
            dispatch(
              showErrorNotification(t('scenarios.notifications.createError'))
            );
            throw error;
          });
      }

      return dispatch(
        updateScenario({ id: scenarioData.id, updates: scenarioData })
      )
        .unwrap()
        .then(() => {
          setDialogOpen(false);
          setSelectedScenario(undefined);
          dispatch(
            showSuccessNotification(t('scenarios.notifications.updateSuccess'))
          );
        })
        .catch(error => {
          dispatch(
            showErrorNotification(t('scenarios.notifications.updateError'))
          );
          throw error;
        });
    }
    return Promise.reject(new Error('شناسه سناریو برای ویرایش موجود نیست.'));
  };

  const handleAutosaveScenario = useCallback(
    (scenarioData: Partial<Scenario>) => {
      if (!scenarioData.id || isBuiltinDemoScenario(scenarioData)) {
        return;
      }

      dispatch(updateScenario({ id: scenarioData.id, updates: scenarioData }))
        .unwrap()
        .catch(autosaveError => {
          console.error('Scenario autosave failed:', autosaveError);
        });
    },
    [dispatch]
  );

  const handleDeleteScenario = () => {
    if (scenarioToDelete) {
      if (isBuiltinDemoScenario(scenarioToDelete)) {
        setDeleteConfirmOpen(false);
        setScenarioToDelete(null);
        dispatch(
          showErrorNotification(
            t('scenarios.notifications.deleteDemoNotAllowed')
          )
        );
        return;
      }

      dispatch(deleteScenario(scenarioToDelete.id))
        .unwrap()
        .then(() => {
          setDeleteConfirmOpen(false);
          setScenarioToDelete(null);
          // Refresh the scenarios list after successful deletion
          dispatch(fetchScenarios({ include_archived: true }));
          dispatch(
            showSuccessNotification(t('scenarios.notifications.deleteSuccess'))
          );
        })
        .catch(error => {
          console.error('Delete scenario error:', error);
          dispatch(
            showErrorNotification(t('scenarios.notifications.deleteError'))
          );
        });
    }
  };

  // مدیریت منو
  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    scenario: Scenario
  ) => {
    setMenuAnchor(event.currentTarget);
    setMenuScenario(scenario);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuScenario(null);
  };

  const handleQuickStatusChange = async (
    scenario: Scenario,
    status: ScenarioStatus
  ) => {
    if (
      !canEdit ||
      isBuiltinDemoScenario(scenario) ||
      scenario.status === status ||
      status === ScenarioStatus.ARCHIVED
    ) {
      return;
    }

    setScenarioActionLoading(scenario.id);
    try {
      await dispatch(
        updateScenario({
          id: scenario.id,
          updates: { ...scenario, status },
        })
      ).unwrap();
      dispatch(
        showSuccessNotification(
          t('scenarios.notifications.statusChangeSuccess')
        )
      );
    } catch (statusChangeError) {
      console.error('Scenario status update failed:', statusChangeError);
      dispatch(
        showErrorNotification(t('scenarios.notifications.statusChangeError'))
      );
    } finally {
      setScenarioActionLoading(null);
    }
  };

  const handleArchiveToggle = async (scenario: Scenario) => {
    if (!canEdit || isBuiltinDemoScenario(scenario)) return;

    const isArchived = isScenarioArchived(scenario);
    setScenarioActionLoading(scenario.id);
    try {
      if (isArchived) {
        await dispatch(restoreScenario(scenario.id)).unwrap();
        dispatch(
          showSuccessNotification(t('scenarios.actions.restoreSuccess'))
        );
      } else {
        await dispatch(archiveScenario(scenario.id)).unwrap();
        dispatch(
          showSuccessNotification(t('scenarios.actions.archiveSuccess'))
        );
      }
    } catch (archiveError) {
      console.error('Scenario archive action failed:', archiveError);
      dispatch(
        showErrorNotification(
          t(
            isArchived
              ? 'scenarios.actions.restoreError'
              : 'scenarios.actions.archiveError'
          )
        )
      );
    } finally {
      setScenarioActionLoading(null);
    }
  };

  // دریافت رنگ وضعیت
  const getStatusChip = (scenario: Scenario) => {
    const isArchived = isScenarioArchived(scenario);
    const statusOption = statusOptions.find(
      opt => opt.value === scenario.status
    );
    return (
      <Chip
        label={
          isArchived
            ? t('scenarios.status.archived')
            : statusOption?.label || scenario.status
        }
        color={isArchived ? 'warning' : statusOption?.color || 'default'}
        size="small"
        variant={isArchived ? 'outlined' : 'filled'}
      />
    );
  };

  // مشاهده جزئیات سناریو - هدایت به صفحه جزئیات سناریو
  const handleViewScenarioDetails = (scenarioId: string) => {
    navigate(`/dashboard/scenarios/${scenarioId}`);
  };

  const handleOpenScenarioInKalknegar = (scenarioId: string) => {
    const base = window.location.origin;
    const target = `${base}/kalknegar/scenario/${scenarioId}?integration=react`;
    setKalknegarTargetUrl(target);
    setKalknegarLaunchDialogOpen(true);
  };

  // State for simulator launch warning dialog
  const [simulatorWarningOpen, setSimulatorWarningOpen] = useState(false);
  const [pendingScenarioId, setPendingScenarioId] = useState<string | null>(
    null
  );

  // اجرای سناریو = نمایش مودال هشدار و سپس باز کردن شبیه ساز
  const handleExecuteScenario = (scenarioId: string) => {
    const targetScenario = allScenarios.find(
      scenario => String(scenario.id) === String(scenarioId)
    );

    if (!targetScenario) {
      dispatch(showErrorNotification('سناریوی مورد نظر یافت نشد.'));
      return;
    }

    // نمایش مودال هشدار
    setPendingScenarioId(scenarioId);
    setSimulatorWarningOpen(true);
  };

  // تایید و باز کردن simulator
  const handleConfirmSimulatorLaunch = () => {
    if (!pendingScenarioId) {
      setSimulatorWarningOpen(false);
      return;
    }

    const targetScenario = allScenarios.find(
      scenario => String(scenario.id) === String(pendingScenarioId)
    );

    if (!targetScenario) {
      dispatch(showErrorNotification('سناریوی مورد نظر یافت نشد.'));
      setSimulatorWarningOpen(false);
      return;
    }

    // باز کردن simulator در پنجره جدید
    const simulatorBaseUrl =
      (import.meta as any).env?.VITE_SIMULATOR_URL || 'http://localhost:3001';
    const simulatorUrl = `${simulatorBaseUrl}?scenarioId=${pendingScenarioId}`;

    try {
      const popup = window.open(
        simulatorUrl,
        '_blank',
        'noopener,noreferrer,width=1920,height=1080'
      );
      if (!popup) {
        dispatch(
          showErrorNotification(
            'مرورگر مانع باز شدن شبیه ساز شد. لطفاً popup blocker را غیرفعال کنید.'
          )
        );
        setSimulatorWarningOpen(false);
        return;
      }

      dispatch(
        showSuccessNotification(
          `شبیه ساز برای سناریو "${targetScenario.name}" در حال باز شدن است...`
        )
      );
      setSimulatorWarningOpen(false);
      setPendingScenarioId(null);
    } catch (error) {
      console.error('Failed to open simulator', error);
      dispatch(showErrorNotification('باز کردن شبیه ساز با مشکل مواجه شد.'));
      setSimulatorWarningOpen(false);
    }
  };

  const handleCancelSimulatorLaunch = () => {
    setSimulatorWarningOpen(false);
    setPendingScenarioId(null);
  };

  const handleConfirmUnityLaunch = async () => {
    if (!unityTargetScenario) {
      setUnityLaunchError('سناریویی برای اجرا انتخاب نشده است.');
      return;
    }

    setUnityLaunching(true);
    setUnityLaunchError(null);
    setUnityFallbackLink(null);

    let backendLaunchUrl: string | undefined;
    let launchToken: string | undefined;

    try {
      const response = await scenarioApiService.requestUnityLaunch(
        String(unityTargetScenario.id)
      );
      backendLaunchUrl = response?.launchUrl || response?.url;
      launchToken = response?.token || response?.launchToken;
    } catch (apiError) {
      console.warn(
        'Unity launch handshake failed. Using client-side payload as fallback.',
        apiError
      );
    }

    const targetUrl = buildUnityLaunchUrl(
      unityTargetScenario,
      backendLaunchUrl,
      launchToken
    );

    try {
      const popup = window.open(targetUrl, '_blank', 'noopener,noreferrer');
      if (!popup) {
        setUnityLaunchError(
          'مرورگر مانع باز شدن شبیه ساز شد. لینک دستی زیر را اجرا کنید.'
        );
        setUnityFallbackLink(targetUrl);
        return;
      }

      dispatch(showSuccessNotification('درخواست اجرا به شبیه ساز ارسال شد.'));
      setUnityDialogOpen(false);
      setUnityTargetScenario(null);
    } catch (openError) {
      console.error('Failed to open Unity application', openError);
      setUnityLaunchError(
        'باز کردن شبیه ساز با مشکل مواجه شد. لینک زیر را به صورت دستی باز کنید.'
      );
      setUnityFallbackLink(targetUrl);
    } finally {
      setUnityLaunching(false);
    }
  };

  const handleUnityDialogClose = () => {
    if (unityLaunching) {
      return;
    }
    setUnityDialogOpen(false);
    setUnityTargetScenario(null);
    setUnityLaunchError(null);
    setUnityFallbackLink(null);
  };

  // کپی سناریو روی سرور (برای سناریوهای معمولی و demo)
  const handleCopyScenario = async (scenario: Scenario) => {
    try {
      // اگر سناریوی demo باشد، از منبع demo در بک‌اند یک سناریوی کامل می‌سازیم
      if (isBuiltinDemoScenario(scenario)) {
        const rawId = String(scenario.id);
        const demoId = rawId.startsWith('demo-')
          ? rawId.replace(/^demo-/, '')
          : rawId;
        await scenarioApiService.duplicateDemoScenario(
          demoId,
          `${scenario.name} (کپی)`
        );
      } else {
        // سناریوهای عادی که روی سرور ذخیره شده‌اند
        await scenarioApiService.duplicateScenario(
          String(scenario.id),
          `${scenario.name} (کپی)` as any
        );
      }

      // بارگذاری مجدد لیست سناریوها
      dispatch(fetchScenarios({ include_archived: true }));
      dispatch(showSuccessNotification('سناریو با موفقیت کپی شد.'));
    } catch (error) {
      console.error('Failed to duplicate scenario', error);
      dispatch(showErrorNotification('کپی سناریو با خطا مواجه شد.'));
    }
  };

  const canEdit = user?.role === 'admin' || user?.role === 'commander';
  const canDelete = user?.role === 'admin';

  const resetImportState = () => {
    setImportError(null);
    setSelectedFile(null);
    setSelectedFileInfo(null);
    setImportUpdateConfirmOpen(false);
    setIsDragActive(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenImportDialog = () => {
    resetImportState();
    setImportDialogOpen(true);
  };

  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
    resetImportState();
  };

  const validateScenarioFile = async (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      throw new Error('حجم فایل بیش از حد مجاز است (۲۵ مگابایت).');
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data?.type && data.type !== 'ORBAT-mapper') {
        throw new Error('این فایل با ساختار کالک نگار سازگار نیست.');
      }

      return {
        id: typeof data?.id === 'string' ? data.id : undefined,
        name: data?.name || data?.meta?.name,
        description: data?.description || data?.meta?.description,
        type: data?.type,
      };
    } catch (error) {
      throw new Error('فایل سناریو معتبر نیست یا امکان خواندن آن وجود ندارد.');
    }
  };

  const handleFileSelection = async (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setSelectedFileInfo(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setImportError(null);
    try {
      const info = await validateScenarioFile(file);
      const existingScenario = info.id
        ? scenarios.find(scenario => scenario.id === info.id)
        : undefined;

      setSelectedFile(file);
      setSelectedFileInfo({
        ...info,
        existingScenarioName: existingScenario?.name,
      });
    } catch (error) {
      setSelectedFile(null);
      setSelectedFileInfo(null);
      setImportError(
        error instanceof Error ? error.message : 'خطا در بررسی فایل سناریو'
      );
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    await handleFileSelection(file || null);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      await handleFileSelection(file);
    }
  };

  const performScenarioImport = async () => {
    if (!selectedFile) {
      return;
    }

    setImporting(true);
    setImportError(null);

    try {
      const result = await scenarioApiService.importScenario(selectedFile);
      dispatch(fetchScenarios({ include_archived: true }));
      const successMessage =
        result.importAction === 'updated'
          ? 'سناریوی موجود با موفقیت به‌روزرسانی شد.'
          : 'سناریو با موفقیت بارگذاری شد.';
      dispatch(showSuccessNotification(successMessage));
      handleCloseImportDialog();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطا در بارگذاری سناریو';
      setImportError(message);
      dispatch(showErrorNotification('بارگذاری سناریو با خطا مواجه شد.'));
    } finally {
      setImporting(false);
      setImportUpdateConfirmOpen(false);
    }
  };

  const handleImportScenarioFile = () => {
    if (!selectedFile) {
      return;
    }

    if (selectedFileInfo?.existingScenarioName) {
      setImportUpdateConfirmOpen(true);
      return;
    }

    void performScenarioImport();
  };

  const handleConfirmImportUpdate = () => {
    void performScenarioImport();
  };

  return (
    <ThemeProvider theme={sectionTheme}>
      <Box sx={{ p: 4 }}>
        {/* هدر صفحه */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 1,
              background: `linear-gradient(135deg, ${alpha(unifiedAccent, 0.95)} 0%, ${alpha(unifiedAccent, 0.7)} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {t('scenarios.pageTitle')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('scenarios.pageDescription')}
          </Typography>
        </Box>

        {/* نمایش خطا */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {t('scenarios.errorLoading')}: {error}
          </Alert>
        )}

        {/* آمار سناریوها */}
        <ScenarioStats scenarios={allScenarios} />

        {/* نوار ابزار */}
        <Card sx={{ ...unifiedPanelSx, mb: 3 }}>
          <Toolbar>
            <TextField
              size="small"
              placeholder={t('scenarios.toolbar.searchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 250, mr: 2 }}
            />

            <FormControl size="small" sx={{ minWidth: 150, mr: 2 }}>
              <InputLabel>{t('scenarios.toolbar.statusFilter')}</InputLabel>
              <Select
                value={statusFilter}
                label={t('scenarios.toolbar.statusFilter')}
                onChange={(e: SelectChangeEvent) =>
                  setStatusFilter(e.target.value as ScenarioStatus | 'all')
                }
              >
                <MenuItem value="all">
                  {t('scenarios.toolbar.allStatuses')}
                </MenuItem>
                {statusOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
                <MenuItem value={ScenarioStatus.ARCHIVED}>
                  {t('scenarios.status.archived')}
                </MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ flexGrow: 1 }} />

            <ToggleButtonGroup
              size="small"
              value={viewMode}
              exclusive
              onChange={(_, value) => value && setViewMode(value)}
              sx={{ mr: 2 }}
            >
              <ToggleButton value="table">جدول</ToggleButton>
              <ToggleButton value="cards">کارتی</ToggleButton>
            </ToggleButtonGroup>

            {canEdit && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => {
                    setSelectedScenario(undefined);
                    setDialogOpen(true);
                  }}
                >
                  {t('scenarios.toolbar.newScenarioButton')}
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<CloudUpload />}
                  onClick={handleOpenImportDialog}
                >
                  بارگذاری سناریو
                </Button>
              </Box>
            )}
          </Toolbar>
        </Card>

        {viewMode === 'cards' ? (
          <Box>
            {loading && <LinearProgress sx={{ mb: 2 }} />}

            {filteredScenarios.length > 0 ? (
              <Grid container spacing={3}>
                {filteredScenarios.map(scenario => {
                  // دریافت تصویر سناریو از فیلد image یا metadata.image
                  const scenarioImage =
                    (scenario as any)?.image ||
                    (scenario as any)?.metadata?.image;

                  return (
                    <Grid key={scenario.id} item xs={12} sm={6} md={4}>
                      <Card
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          border: `1px solid ${alpha(unifiedAccent, 0.24)}`,
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          overflow: 'hidden',
                          ...(scenarioImage
                            ? {}
                            : {
                                background: unifiedSurface,
                              }),
                          ...(scenarioImage
                            ? {
                                backgroundImage: `url(${scenarioImage})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                '&::before': {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  background:
                                    'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%)',
                                  zIndex: 0,
                                },
                              }
                            : {}),
                          '&:hover': {
                            boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.1)}`,
                            transform: 'translateY(-4px)',
                          },
                        }}
                      >
                        <CardContent
                          sx={{ flexGrow: 1, position: 'relative', zIndex: 1 }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              mb: 2,
                            }}
                          >
                            <Box>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  ...(scenarioImage
                                    ? {
                                        color: 'white',
                                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                      }
                                    : {}),
                                }}
                                onClick={() =>
                                  handleOpenScenarioInKalknegar(scenario.id)
                                }
                              >
                                {scenario.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  mt: 0.5,
                                  ...(scenarioImage
                                    ? {
                                        color: 'rgba(255,255,255,0.9)',
                                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                                      }
                                    : { color: 'text.secondary' }),
                                }}
                              >
                                {scenario.description || 'بدون توضیح'}
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={e => handleMenuOpen(e, scenario)}
                              sx={{
                                ...(scenarioImage
                                  ? {
                                      color: 'white',
                                      backgroundColor: alpha(
                                        theme.palette.common.white,
                                        0.2
                                      ),
                                      '&:hover': {
                                        backgroundColor: alpha(
                                          theme.palette.common.white,
                                          0.3
                                        ),
                                      },
                                    }
                                  : {}),
                              }}
                            >
                              <MoreVert fontSize="small" />
                            </IconButton>
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <Chip
                              label={
                                isScenarioArchived(scenario)
                                  ? t('scenarios.status.archived')
                                  : statusOptions.find(
                                      opt => opt.value === scenario.status
                                    )?.label || scenario.status
                              }
                              color={
                                isScenarioArchived(scenario)
                                  ? 'warning'
                                  : statusOptions.find(
                                      opt => opt.value === scenario.status
                                    )?.color || 'default'
                              }
                              size="small"
                              sx={{
                                ...(scenarioImage
                                  ? {
                                      backgroundColor: alpha(
                                        theme.palette.common.white,
                                        0.9
                                      ),
                                      color: theme.palette.text.primary,
                                      fontWeight: 600,
                                    }
                                  : {}),
                              }}
                            />
                          </Box>

                          <Grid container spacing={1} sx={{ mb: 1 }}>
                            <Grid item xs={6}>
                              <Typography
                                variant="caption"
                                sx={{
                                  ...(scenarioImage
                                    ? {
                                        color: 'rgba(255,255,255,0.8)',
                                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                                      }
                                    : { color: 'text.secondary' }),
                                }}
                              >
                                شروع
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  ...(scenarioImage
                                    ? {
                                        color: 'white',
                                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                                      }
                                    : {}),
                                }}
                              >
                                <TransformFarsiNumbers>
                                  {scenario.startTime
                                    ? new Date(
                                        scenario.startTime
                                      ).toLocaleDateString('fa-IR')
                                    : '---'}
                                </TransformFarsiNumbers>
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography
                                variant="caption"
                                sx={{
                                  ...(scenarioImage
                                    ? {
                                        color: 'rgba(255,255,255,0.8)',
                                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                                      }
                                    : { color: 'text.secondary' }),
                                }}
                              >
                                پایان
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  ...(scenarioImage
                                    ? {
                                        color: 'white',
                                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                                      }
                                    : {}),
                                }}
                              >
                                <TransformFarsiNumbers>
                                  {scenario.endTime
                                    ? new Date(
                                        scenario.endTime
                                      ).toLocaleDateString('fa-IR')
                                    : '---'}
                                </TransformFarsiNumbers>
                              </Typography>
                            </Grid>
                          </Grid>

                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Chip
                              icon={<Assignment fontSize="small" />}
                              label={
                                <TransformFarsiNumbers>{`${scenario.objectives?.length || 0} هدف`}</TransformFarsiNumbers>
                              }
                              size="small"
                              variant="outlined"
                              sx={{
                                ...(scenarioImage
                                  ? {
                                      borderColor: 'rgba(255,255,255,0.5)',
                                      color: 'white',
                                      '& .MuiChip-icon': {
                                        color: 'white',
                                      },
                                    }
                                  : {}),
                              }}
                            />
                            {scenario.units && (
                              <Chip
                                icon={<Group fontSize="small" />}
                                label={
                                  <TransformFarsiNumbers>{`${scenario.units.length} یگان`}</TransformFarsiNumbers>
                                }
                                size="small"
                                variant="outlined"
                                sx={{
                                  ...(scenarioImage
                                    ? {
                                        borderColor: 'rgba(255,255,255,0.5)',
                                        color: 'white',
                                        '& .MuiChip-icon': {
                                          color: 'white',
                                        },
                                      }
                                    : {}),
                                }}
                              />
                            )}
                          </Box>
                        </CardContent>

                        <CardActions
                          sx={{
                            justifyContent: 'space-between',
                            position: 'relative',
                            zIndex: 1,
                          }}
                        >
                          <Button
                            size="small"
                            onClick={() =>
                              handleViewScenarioDetails(scenario.id)
                            }
                            sx={{
                              ...(scenarioImage
                                ? {
                                    color: 'white',
                                    backgroundColor: alpha(
                                      theme.palette.primary.main,
                                      0.8
                                    ),
                                    '&:hover': {
                                      backgroundColor: alpha(
                                        theme.palette.primary.main,
                                        0.9
                                      ),
                                    },
                                  }
                                : {}),
                            }}
                          >
                            مشاهده جزئیات
                          </Button>
                          {canEdit && (
                            <Button
                              size="small"
                              onClick={() => {
                                setSelectedScenario(scenario);
                                setDialogOpen(true);
                              }}
                              sx={{
                                ...(scenarioImage
                                  ? {
                                      color: 'white',
                                      backgroundColor: alpha(
                                        theme.palette.secondary.main,
                                        0.8
                                      ),
                                      '&:hover': {
                                        backgroundColor: alpha(
                                          theme.palette.secondary.main,
                                          0.9
                                        ),
                                      },
                                    }
                                  : {}),
                              }}
                            >
                              ویرایش
                            </Button>
                          )}
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            ) : (
              !loading && (
                <Box
                  sx={{ textAlign: 'center', color: 'text.secondary', py: 6 }}
                >
                  <Assignment sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                  <Typography variant="body1">
                    {searchTerm || statusFilter !== 'all'
                      ? t('scenarios.table.noMatch')
                      : t('scenarios.table.noScenarios')}
                  </Typography>
                </Box>
              )
            )}
          </Box>
        ) : (
          <Card sx={unifiedPanelSx}>
            {loading && <LinearProgress />}

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('scenarios.table.name')}</TableCell>
                    <TableCell>{t('scenarios.table.status')}</TableCell>
                    <TableCell>{t('scenarios.table.startTime')}</TableCell>
                    <TableCell>{t('scenarios.table.endTime')}</TableCell>
                    <TableCell>{t('scenarios.table.objectives')}</TableCell>
                    <TableCell align="center">
                      {t('scenarios.table.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredScenarios.map(scenario => (
                    <TableRow key={scenario.id} hover>
                      <TableCell>
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 600,
                              cursor: 'pointer',
                              '&:hover': {
                                textDecoration: 'underline',
                                color: 'primary.main',
                              },
                            }}
                            onClick={() =>
                              handleOpenScenarioInKalknegar(scenario.id)
                            }
                          >
                            {scenario.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {scenario.description}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>{getStatusChip(scenario)}</TableCell>

                      <TableCell>
                        <TransformFarsiNumbers>
                          {scenario.startTime
                            ? new Date(scenario.startTime).toLocaleDateString(
                                'fa-IR'
                              )
                            : '---'}
                        </TransformFarsiNumbers>
                      </TableCell>

                      <TableCell>
                        <TransformFarsiNumbers>
                          {scenario.endTime
                            ? new Date(scenario.endTime).toLocaleDateString(
                                'fa-IR'
                              )
                            : '---'}
                        </TransformFarsiNumbers>
                      </TableCell>

                      <TableCell>
                        <TransformFarsiNumbers>
                          {scenario.objectives?.length || 0}
                        </TransformFarsiNumbers>
                      </TableCell>

                      <TableCell align="center">
                        <IconButton
                          onClick={e => handleMenuOpen(e, scenario)}
                          size="small"
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredScenarios.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Box
                          sx={{ textAlign: 'center', color: 'text.secondary' }}
                        >
                          <Assignment
                            sx={{ fontSize: 48, mb: 1, opacity: 0.5 }}
                          />
                          <Typography variant="body1">
                            {searchTerm || statusFilter !== 'all'
                              ? t('scenarios.table.noMatch')
                              : t('scenarios.table.noScenarios')}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}

        {/* دیالوگ بارگذاری سناریو */}
        <Dialog
          open={importDialogOpen}
          onClose={handleCloseImportDialog}
          maxWidth="sm"
          fullWidth
          sx={buildResourcesFormDialogSx(theme)}
        >
          <DialogTitle sx={resourcesDialogTitleSx(theme)}>
            بارگذاری سناریو
          </DialogTitle>
          <DialogContent dividers sx={resourcesDialogContentDividersSx(theme)}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              فایل سناریو ذخیره‌شده از کالک نگار را بارگذاری کنید. می‌توانید
              فایل را بکشید و رها کنید یا از طریق دکمه زیر انتخاب نمایید.
            </Typography>

            <Box
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              sx={{
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                bgcolor: isDragActive
                  ? alpha(theme.palette.primary.light, 0.15)
                  : alpha(theme.palette.background.default, 0.6),
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <CloudUpload
                sx={{ fontSize: 48, color: 'primary.main', mb: 2 }}
              />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                فایل سناریو را اینجا رها کنید
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                یا برای انتخاب فایل از سیستم خود کلیک کنید
              </Typography>
              <Button variant="contained" color="primary">
                انتخاب فایل
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                hidden
                onChange={handleFileInputChange}
              />

              {selectedFile && (
                <Box
                  sx={{
                    mt: 3,
                    textAlign: 'left',
                    borderRadius: 2,
                    p: 2,
                    bgcolor: alpha(theme.palette.primary.light, 0.15),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <TransformFarsiNumbers>
                      اندازه فایل: {(selectedFile.size / 1024).toFixed(1)}{' '}
                      کیلوبایت
                    </TransformFarsiNumbers>
                  </Typography>
                  {selectedFileInfo?.name && (
                    <Typography variant="body2" color="text.secondary">
                      نام سناریو: {selectedFileInfo.name}
                    </Typography>
                  )}
                  {selectedFileInfo?.type && (
                    <Typography variant="body2" color="text.secondary">
                      نوع:{' '}
                      {selectedFileInfo.type === 'ORBAT-mapper'
                        ? 'کالک نگار'
                        : selectedFileInfo.type}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>

            {selectedFileInfo?.existingScenarioName && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                سناریوی «{selectedFileInfo.existingScenarioName}» از قبل در
                سیستم وجود دارد. با بارگذاری این فایل، محتوای سناریوی موجود
                جایگزین می‌شود.
              </Alert>
            )}

            {importError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {importError}
              </Alert>
            )}
          </DialogContent>
          <DialogActions sx={resourcesDialogActionsSx(theme)}>
            <Button
              onClick={handleCloseImportDialog}
              disabled={importing}
              variant="outlined"
              color="inherit"
              sx={resourcesOutlinedCancelButtonSx(theme)}
            >
              انصراف
            </Button>
            <Button
              variant="contained"
              color={
                selectedFileInfo?.existingScenarioName ? 'warning' : 'primary'
              }
              onClick={handleImportScenarioFile}
              disabled={!selectedFile || importing}
              sx={{ borderRadius: 2, px: 3 }}
            >
              {importing
                ? 'در حال بارگذاری...'
                : selectedFileInfo?.existingScenarioName
                  ? 'به‌روزرسانی سناریو'
                  : 'بارگذاری سناریو'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={importUpdateConfirmOpen}
          onClose={() => !importing && setImportUpdateConfirmOpen(false)}
          maxWidth="sm"
          fullWidth
          sx={buildResourcesFormDialogSx(theme)}
        >
          <DialogTitle sx={resourcesDialogTitleSx(theme)}>
            به‌روزرسانی سناریوی موجود
          </DialogTitle>
          <DialogContent dividers sx={resourcesDialogContentDividersSx(theme)}>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8 }}>
              سناریوی «{selectedFileInfo?.existingScenarioName}» از قبل در سیستم
              ثبت شده است.
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.8 }}
            >
              آیا می‌خواهید این سناریو با محتوای فایل انتخاب‌شده به‌روزرسانی
              شود؟ داده‌های فعلی سناریو با محتوای فایل جایگزین می‌شوند.
            </Typography>
          </DialogContent>
          <DialogActions sx={resourcesDialogActionsSx(theme)}>
            <Button
              onClick={() => setImportUpdateConfirmOpen(false)}
              disabled={importing}
              variant="outlined"
              color="inherit"
              sx={resourcesOutlinedCancelButtonSx(theme)}
            >
              انصراف
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={handleConfirmImportUpdate}
              disabled={importing}
              sx={{ borderRadius: 2, px: 3 }}
            >
              {importing ? 'در حال به‌روزرسانی...' : 'بله، به‌روزرسانی شود'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* منوی عملیات */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          MenuListProps={{ 'aria-label': t('scenarios.table.actions') }}
        >
          <MenuItem
            onClick={() => {
              if (menuScenario) {
                handleViewScenarioDetails(menuScenario.id);
              }
              handleMenuClose();
            }}
          >
            <Visibility sx={{ mr: 1 }} />
            {t('scenarios.menu.viewDetails')}
          </MenuItem>

          <MenuItem
            onClick={() => {
              if (menuScenario) {
                handleExecuteScenario(menuScenario.id);
              }
              handleMenuClose();
            }}
          >
            <PlayArrow sx={{ mr: 1 }} />
            اجرای شبیه ساز
          </MenuItem>

          <MenuItem
            onClick={() => {
              if (menuScenario) {
                handleOpenScenarioInKalknegar(menuScenario.id);
              }
              handleMenuClose();
            }}
          >
            <MapIcon sx={{ mr: 1 }} />
            اجرای کالک نگار
          </MenuItem>

          <MenuItem
            disabled={!canEdit}
            onClick={async () => {
              if (menuScenario) {
                try {
                  // کپی سناریو با استفاده از API
                  const { scenarioApiService } = await import(
                    '@/services/api/scenarioApiService'
                  );
                  await scenarioApiService.duplicateScenario(menuScenario.id);
                  dispatch(fetchScenarios({ include_archived: true })); // Refresh list
                  dispatch(showSuccessNotification('سناریو با موفقیت کپی شد'));
                } catch (error) {
                  dispatch(showErrorNotification('خطا در کپی سناریو'));
                }
              }
              handleMenuClose();
            }}
          >
            <ContentCopy sx={{ mr: 1 }} />
            کپی
          </MenuItem>

          {canEdit && menuScenario && !isBuiltinDemoScenario(menuScenario) && (
            <>
              <Divider />
              <ListSubheader disableSticky>
                {t('scenarios.menu.changeStatus')}
              </ListSubheader>
              {statusOptions.map(option => (
                <MenuItem
                  key={option.value}
                  selected={
                    !isScenarioArchived(menuScenario) &&
                    menuScenario.status === option.value
                  }
                  disabled={
                    isScenarioArchived(menuScenario) ||
                    menuScenario.status === option.value ||
                    scenarioActionLoading === menuScenario.id
                  }
                  onClick={() => {
                    const scenario = menuScenario;
                    handleMenuClose();
                    void handleQuickStatusChange(scenario, option.value);
                  }}
                  sx={{ pl: 4 }}
                >
                  {option.label}
                </MenuItem>
              ))}
              <Divider />
              <MenuItem
                disabled={scenarioActionLoading === menuScenario.id}
                onClick={() => {
                  const scenario = menuScenario;
                  handleMenuClose();
                  void handleArchiveToggle(scenario);
                }}
                sx={{
                  color: isScenarioArchived(menuScenario)
                    ? 'info.main'
                    : 'warning.main',
                }}
              >
                {isScenarioArchived(menuScenario) ? (
                  <Unarchive sx={{ mr: 1 }} />
                ) : (
                  <Archive sx={{ mr: 1 }} />
                )}
                {isScenarioArchived(menuScenario)
                  ? t('scenarios.actions.restore')
                  : t('scenarios.actions.archive')}
              </MenuItem>
            </>
          )}

          <MenuItem
            onClick={() => {
              if (menuScenario) {
                setScenarioToDelete(menuScenario);
                setDeleteConfirmOpen(true);
              }
              handleMenuClose();
            }}
            disabled={
              !canDelete ||
              Boolean(menuScenario && isBuiltinDemoScenario(menuScenario))
            }
            sx={{ color: 'error.main' }}
          >
            <Delete sx={{ mr: 1 }} />
            حذف
          </MenuItem>

          {canEdit && (
            <MenuItem
              onClick={() => {
                if (menuScenario) {
                  // باز کردن دیالوگ 6 مرحله‌ای برای ویرایش سناریو
                  setSelectedScenario(menuScenario);
                  setDialogOpen(true);
                }
                handleMenuClose();
              }}
            >
              <Edit sx={{ mr: 1 }} />
              {t('scenarios.menu.edit')}
            </MenuItem>
          )}
        </Menu>

        {/* دیالوگ ایجاد/ویرایش سناریو (6 مرحله‌ای) */}
        <NewScenarioDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setSelectedScenario(undefined);
          }}
          onSave={
            selectedScenario ? handleUpdateScenario : handleCreateScenario
          }
          onAutosave={selectedScenario ? handleAutosaveScenario : undefined}
          scenario={selectedScenario}
        />

        {/* دیالوگ تأیید حذف */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => {
            setDeleteConfirmOpen(false);
            setScenarioToDelete(null);
          }}
          maxWidth={isMobile ? 'xs' : 'sm'}
          fullWidth
          fullScreen={isMobile}
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: isMobile ? 0 : '20px',
              backgroundColor: theme => alpha(theme.palette.primary.light, 0.1),
              backdropFilter: 'blur(20px)',
              border: theme =>
                `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
              boxShadow: theme =>
                `0 20px 60px ${alpha(theme.palette.primary.light, 0.3)}, inset 0 1px 0 rgba(255, 255, 255, 0.8)`,
              overflow: 'hidden',
              position: 'relative',
            },
            '& .MuiBackdrop-root': {
              backgroundColor: theme =>
                `${alpha(theme.palette.primary.light, 0.08)}`,
              backdropFilter: 'blur(4px)',
            },
          }}
        >
          <DialogTitle
            component="div"
            sx={{
              backgroundColor: getSoftSurface(),
              backdropFilter: 'none',
              borderBottom: theme =>
                `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
              textAlign: 'center',
              py: isMobile ? 2 : 3,
              px: isMobile ? 2 : 3,
            }}
          >
            <Fade in={deleteConfirmOpen} timeout={500}>
              <Typography
                component="div"
                variant={isMobile ? 'h5' : 'h4'}
                sx={{
                  fontWeight: 700,
                  color: theme => theme.palette.error.main,
                }}
              >
                {t('scenarios.deleteDialog.title')}
              </Typography>
            </Fade>
          </DialogTitle>
          <DialogContent sx={{ p: 0, backgroundColor: getSoftSurface() }}>
            <Box
              sx={{
                p: isMobile ? 2 : 4,
                minHeight: isMobile ? 150 : 200,
                textAlign: 'center',
                pt: isMobile ? 1 : undefined,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  color: 'text.primary',
                  fontWeight: 500,
                  lineHeight: 1.6,
                }}
              >
                {t('scenarios.deleteDialog.message', {
                  name: scenarioToDelete?.name || 'این سناریو',
                })}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                  lineHeight: 1.8,
                  maxWidth: 400,
                  mx: 'auto',
                }}
              >
                {t('scenarios.deleteDialog.warning')}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions
            sx={{
              backgroundColor: getSoftSurface(),
              backdropFilter: 'none',
              borderTop: theme =>
                `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
              p: isMobile ? 2 : 3,
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <Button
              onClick={() => {
                setDeleteConfirmOpen(false);
                setScenarioToDelete(null);
              }}
              variant="outlined"
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
              {t('scenarios.deleteDialog.cancelButton')}
            </Button>
            <Button
              onClick={handleDeleteScenario}
              color="error"
              variant="contained"
              sx={{
                borderRadius: '12px',
                px: isMobile ? 2 : 4,
                py: isMobile ? 1 : 1.5,
                fontWeight: 600,
                border: '2px solid rgba(255, 255, 255, 0.3)',
                boxShadow: theme =>
                  `0 4px 16px ${alpha(theme.palette.error.main, 0.3)}`,
                fontSize: isMobile ? '0.8rem' : 'inherit',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme =>
                    `0 8px 24px ${alpha(theme.palette.error.main, 0.4)}`,
                },
                transition: 'all 0.3s ease',
              }}
            >
              {t('scenarios.deleteDialog.confirmButton')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* دیالوگ بخش 3 بعدی */}
        <Dialog
          open={executionDialogOpen}
          onClose={() => setExecutionDialogOpen(false)}
          maxWidth={isMobile ? 'xs' : 'sm'}
          fullWidth
          fullScreen={isMobile}
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: isMobile ? 0 : '20px',
              backgroundColor: theme => alpha(theme.palette.primary.light, 0.1),
              backdropFilter: 'blur(20px)',
              border: theme =>
                `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
              boxShadow: theme =>
                `0 20px 60px ${alpha(theme.palette.primary.light, 0.3)}, inset 0 1px 0 rgba(255, 255, 255, 0.8)`,
              overflow: 'hidden',
              position: 'relative',
            },
            '& .MuiBackdrop-root': {
              backgroundColor: theme =>
                `${alpha(theme.palette.primary.light, 0.08)}`,
              backdropFilter: 'blur(4px)',
            },
          }}
        >
          <DialogTitle
            component="div"
            sx={{
              backgroundColor: getSoftSurface(),
              backdropFilter: 'none',
              borderBottom: theme =>
                `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
              textAlign: 'center',
              py: isMobile ? 2 : 3,
              px: isMobile ? 2 : 3,
            }}
          >
            <Fade in={executionDialogOpen} timeout={500}>
              <Typography
                component="div"
                variant={isMobile ? 'h5' : 'h4'}
                sx={{
                  fontWeight: 700,
                  color: theme => theme.palette.primary.main,
                }}
              >
                اجرای سناریو
              </Typography>
            </Fade>
          </DialogTitle>
          <DialogContent sx={{ p: 0, backgroundColor: getSoftSurface() }}>
            <Box
              sx={{
                p: isMobile ? 2 : 4,
                minHeight: isMobile ? 150 : 200,
                textAlign: 'center',
                pt: isMobile ? 1 : undefined,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  color: 'text.primary',
                  fontWeight: 500,
                  lineHeight: 1.6,
                }}
              >
                بخش 3 بعدی در حال توسعه می‌باشد.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions
            sx={{
              backgroundColor: getSoftSurface(),
              backdropFilter: 'none',
              borderTop: theme =>
                `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
              p: isMobile ? 2 : 3,
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <Button
              onClick={() => setExecutionDialogOpen(false)}
              variant="contained"
              sx={{
                borderRadius: '12px',
                px: isMobile ? 2 : 4,
                py: isMobile ? 1 : 1.5,
                backgroundColor: theme => theme.palette.primary.main,
                color: 'white',
                fontWeight: 600,
                border: '2px solid rgba(255, 255, 255, 0.3)',
                boxShadow: theme =>
                  `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                fontSize: isMobile ? '0.8rem' : 'inherit',
                '&:hover': {
                  backgroundColor: theme => theme.palette.primary.dark,
                  transform: 'translateY(-2px)',
                  boxShadow: theme =>
                    `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
                },
                transition: 'all 0.3s ease',
              }}
            >
              بستن
            </Button>
          </DialogActions>
        </Dialog>

        {/* مودال هشدار ورود به شبیه ساز */}
        <Dialog
          open={simulatorWarningOpen}
          onClose={handleCancelSimulatorLaunch}
          maxWidth="sm"
          fullWidth
          aria-labelledby="simulator-warning-dialog-title"
          sx={buildResourcesFormDialogSx(theme)}
        >
          <DialogTitle
            id="simulator-warning-dialog-title"
            sx={{
              ...resourcesDialogTitleSx(theme),
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.warning.main, 0.15),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Warning color="warning" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                هشدار ورود به شبیه ساز
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent
            dividers
            sx={{ ...resourcesDialogContentDividersSx(theme), pt: 3 }}
          >
            <Alert severity="warning" sx={{ mb: 2 }}>
              شما در حال ورود به محیط شبیه‌ساز سه‌بعدی هستید.
            </Alert>
            <Typography variant="body1" paragraph>
              با تایید این درخواست، شبیه‌ساز در یک پنجره جدید باز خواهد شد.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • اطمینان حاصل کنید که popup blocker مرورگر شما غیرفعال است
              <br />
              • شبیه‌ساز ممکن است چند ثانیه طول بکشد تا بارگذاری شود
              <br />• می‌توانید از طریق دکمه "بازگشت به مرحله قبل" در شبیه‌ساز به
              این صفحه برگردید
            </Typography>
          </DialogContent>
          <DialogActions sx={resourcesDialogActionsSx(theme)}>
            <Button
              onClick={handleCancelSimulatorLaunch}
              variant="outlined"
              color="inherit"
              sx={resourcesOutlinedCancelButtonSx(theme)}
            >
              انصراف
            </Button>
            <Button
              onClick={handleConfirmSimulatorLaunch}
              variant="contained"
              color="primary"
              startIcon={<PlayArrow />}
              sx={{ borderRadius: 2, px: 3 }}
            >
              ورود به شبیه ساز
            </Button>
          </DialogActions>
        </Dialog>

        <KalknegarLaunchDialog
          open={kalknegarLaunchDialogOpen}
          onClose={() => setKalknegarLaunchDialogOpen(false)}
          onLaunch={() => {
            if (!kalknegarTargetUrl) {
              dispatch(showErrorNotification('آدرس کالک نگار نامشخص است.'));
              return;
            }
            setKalknegarLaunchDialogOpen(false);
            setKalknegarLoadingOpen(true);
            try {
              const token = localStorage.getItem('access_token');
              if (token) {
                sessionStorage.setItem('access_token', token);
              }
            } catch (storageError) {
              console.warn(
                'Failed to persist auth token for Kalknegar bridge',
                storageError
              );
            }
            setTimeout(() => {
              setKalknegarLoadingOpen(false);
              const popup = window.open(kalknegarTargetUrl, '_blank');
              if (!popup) {
                dispatch(
                  showErrorNotification(
                    'مرورگر مانع باز شدن کالک نگار شد. لطفاً پاپ‌آپ‌ها را فعال کنید.'
                  )
                );
              }
            }, 1000);
          }}
        />

        <KalknegarLoadingDialog open={kalknegarLoadingOpen} />

        <UnityLaunchDialog
          open={unityDialogOpen}
          scenario={unityTargetScenario}
          onClose={handleUnityDialogClose}
          onLaunch={handleConfirmUnityLaunch}
          isLaunching={unityLaunching}
          error={unityLaunchError}
          fallbackLink={unityFallbackLink}
        />
      </Box>
    </ThemeProvider>
  );
};

export default ScenariosPage;
