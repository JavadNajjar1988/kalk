import React from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stack,
  Switch,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  AddOutlined,
  ArchiveOutlined,
  AssignmentOutlined,
  CheckCircleOutline,
  CloudDoneOutlined,
  DescriptionOutlined,
  DragIndicator,
  ErrorOutline,
  FolderOpenOutlined,
  GroupOutlined,
  HistoryOutlined,
  Inventory2Outlined,
  LoginOutlined,
  MapOutlined,
  OpenInNewOutlined,
  RefreshOutlined,
  RestartAltOutlined,
  SaveOutlined,
  StorageOutlined,
  TimelineOutlined,
  TuneOutlined,
} from '@mui/icons-material';
import {
  Layout,
  Layouts,
  Responsive,
  WidthProvider,
} from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store';
import { selectUser } from '@/store/slices/authSlice';
import { DashboardModulesSettings } from '@/store/slices/uiSlice';
import {
  DashboardCardKey,
  DashboardSummary,
  DashboardWidgetId,
  DashboardWorkspace,
  dashboardApiService,
} from '@/services/api/dashboardApiService';
import { canAccessFeature } from '@/security/roleAccess';
import { formatPersianDateTime } from '@/utils/dateUtils';
import ScenarioMapPreview from './ScenarioMapPreview';

const ResponsiveGrid = WidthProvider(Responsive);
const BREAKPOINTS = { lg: 1200, md: 900, sm: 600, xs: 360, xxs: 0 };
const COLS = { lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 };

interface Props {
  summary: DashboardSummary;
  modules: DashboardModulesSettings;
  loading: boolean;
  onRefresh: () => void;
}

interface WidgetDefinition {
  id: DashboardWidgetId;
  title: string;
  minW: number;
  minH: number;
  defaultLayout: Layout;
  enabled: (summary: DashboardSummary, modules: DashboardModulesSettings) => boolean;
}

const definitions: WidgetDefinition[] = [
  { id: 'active_users_24h', title: 'کاربران فعال در ۲۴ ساعت', minW: 3, minH: 2, defaultLayout: { i: 'active_users_24h', x: 0, y: 0, w: 3, h: 2 }, enabled: (s) => s.visibleCards.includes('active_users_24h') },
  { id: 'failed_logins_24h', title: 'ورودهای ناموفق', minW: 3, minH: 2, defaultLayout: { i: 'failed_logins_24h', x: 3, y: 0, w: 3, h: 2 }, enabled: (s) => s.visibleCards.includes('failed_logins_24h') },
  { id: 'storage_usage', title: 'فضای ذخیره‌سازی', minW: 3, minH: 2, defaultLayout: { i: 'storage_usage', x: 6, y: 0, w: 3, h: 2 }, enabled: (s) => s.visibleCards.includes('storage_usage') },
  { id: 'healthy_services', title: 'سرویس‌های سالم', minW: 3, minH: 2, defaultLayout: { i: 'healthy_services', x: 9, y: 0, w: 3, h: 2 }, enabled: (s) => s.visibleCards.includes('healthy_services') },
  { id: 'continue_latest_kalk', title: 'ادامه آخرین کالک', minW: 5, minH: 3, defaultLayout: { i: 'continue_latest_kalk', x: 0, y: 2, w: 8, h: 4 }, enabled: (_s, m) => m.showContinueLatestKalk },
  { id: 'scenario_overview', title: 'وضعیت سناریوها', minW: 4, minH: 2, defaultLayout: { i: 'scenario_overview', x: 0, y: 7, w: 12, h: 2 }, enabled: (_s, m) => m.showScenarioOverview },
  { id: 'recent_scenarios', title: 'سناریوهای اخیر', minW: 5, minH: 4, defaultLayout: { i: 'recent_scenarios', x: 0, y: 9, w: 8, h: 5 }, enabled: (_s, m) => m.showRecentScenarios },
  { id: 'quick_access', title: 'دسترسی سریع', minW: 3, minH: 3, defaultLayout: { i: 'quick_access', x: 8, y: 2, w: 4, h: 4 }, enabled: (_s, m) => m.showQuickAccess },
  { id: 'user_activity_chart', title: 'فعالیت کاربران و ساخت سناریو', minW: 5, minH: 4, defaultLayout: { i: 'user_activity_chart', x: 0, y: 14, w: 8, h: 5 }, enabled: (s) => s.visibleCards.includes('user_activity_chart') },
  { id: 'recent_activities', title: 'آخرین تغییرات', minW: 3, minH: 3, defaultLayout: { i: 'recent_activities', x: 8, y: 14, w: 4, h: 5 }, enabled: (s, m) => m.showRecentActivities && s.visibleCards.includes('recent_activities') },
  { id: 'archived_scenarios', title: 'سناریوهای بایگانی‌شده', minW: 3, minH: 2, defaultLayout: { i: 'archived_scenarios', x: 0, y: 19, w: 3, h: 2 }, enabled: (s, m) => m.showStatArchivedScenarios && s.visibleCards.includes('archived_scenarios') },
  { id: 'available_forces', title: 'نیروهای موجود', minW: 3, minH: 2, defaultLayout: { i: 'available_forces', x: 3, y: 19, w: 3, h: 2 }, enabled: (s, m) => m.showStatAvailableForces && s.visibleCards.includes('available_forces') },
  { id: 'ongoing_operations', title: 'عملیات در حال اجرا', minW: 3, minH: 2, defaultLayout: { i: 'ongoing_operations', x: 6, y: 19, w: 3, h: 2 }, enabled: (s, m) => m.showStatOngoingOperations && s.visibleCards.includes('ongoing_operations') },
  { id: 'security_alerts', title: 'هشدارهای امنیتی', minW: 3, minH: 2, defaultLayout: { i: 'security_alerts', x: 9, y: 19, w: 3, h: 2 }, enabled: (s, m) => m.showStatSecurityAlerts && s.visibleCards.includes('security_alerts') },
  { id: 'system_status', title: 'وضعیت منابع سامانه', minW: 3, minH: 3, defaultLayout: { i: 'system_status', x: 0, y: 21, w: 6, h: 4 }, enabled: (s, m) => m.showSystemStatus && s.visibleCards.includes('system_status') },
  { id: 'important_notices', title: 'اطلاعیه‌های مهم', minW: 3, minH: 3, defaultLayout: { i: 'important_notices', x: 6, y: 21, w: 6, h: 4 }, enabled: (s, m) => m.showImportantNotices && s.visibleCards.includes('important_notices') },
];

const fa = (value: number) => value.toLocaleString('fa-IR');

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '۰ بایت';
  const units = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت', 'ترابایت'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} ${units[index]}`;
};

const defaultLayouts = (): Layouts => ({
  lg: definitions.map(({ defaultLayout, minW, minH }) => ({ ...defaultLayout, minW, minH })),
});

const normalizeLayouts = (
  stored: DashboardWorkspace['layouts'],
  workspaceVersion = 4,
): Layouts => {
  const defaults = defaultLayouts();
  const result: Layouts = {};
  for (const breakpoint of Object.keys(BREAKPOINTS)) {
    const source = workspaceVersion === 3
      ? defaults[breakpoint] || defaults.lg
      : stored?.[breakpoint] || defaults[breakpoint] || defaults.lg;
    const known = source
      .filter((item) => definitions.some((definition) => definition.id === item.i))
      .map((item) => {
        if (
          workspaceVersion < 2
          && item.i === 'continue_latest_kalk'
          && item.w === 12
          && item.h === 5
        ) {
          return { ...item, w: 8, h: 4, minW: 5, minH: 3 };
        }
        if (
          workspaceVersion < 3
          && item.i === 'quick_access'
          && item.w === 4
          && item.h === 5
          && (item.y === 2 || (item.x === 8 && item.y === 9))
        ) {
          return {
            ...item,
            x: item.y === 2 ? item.x : 8,
            y: 2,
            w: 4,
            h: 4,
            minW: 3,
            minH: 3,
          };
        }
        return { ...item };
      });
    const present = new Set<string>(known.map((item) => item.i));
    const additions = (defaults.lg || [])
      .filter((item) => !present.has(item.i))
      .map((item, index) => ({ ...item, y: 100 + index }));
    result[breakpoint] = [...known, ...additions];
  }
  return result;
};

const mergeLayouts = (previous: Layouts, next: Layouts): Layouts => {
  const merged: Layouts = {};
  for (const breakpoint of Object.keys(BREAKPOINTS)) {
    const current = next[breakpoint] || [];
    const changedIds = new Set(current.map((item) => item.i));
    merged[breakpoint] = [
      ...current,
      ...(previous[breakpoint] || []).filter((item) => !changedIds.has(item.i)),
    ];
  }
  return merged;
};

const panelSx = {
  height: '100%',
  overflow: 'hidden',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1.5,
  boxShadow: 'none',
  bgcolor: 'background.paper',
};

const WidgetHeader = ({
  title,
  action,
}: {
  title: string;
  editing: boolean;
  action?: React.ReactNode;
}) => (
  <Stack
    dir="ltr"
    className="dashboard-drag-handle"
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    sx={{
      minHeight: 45,
      px: 1.5,
      borderBottom: '1px solid',
      borderColor: 'divider',
      cursor: 'grab',
      bgcolor: 'transparent',
    }}
    style={{ direction: 'ltr', flexDirection: 'row-reverse' }}
  >
    <Stack
      dir="rtl"
      direction="row"
      alignItems="center"
      spacing={0.75}
      sx={{ minWidth: 0 }}
      style={{ direction: 'rtl' }}
    >
      <DragIndicator fontSize="small" color="disabled" />
      <Typography
        className="dashboard-widget-title"
        variant="subtitle2"
        fontWeight={800}
        style={{ textAlign: 'right' }}
      >
        {title}
      </Typography>
    </Stack>
    {action}
  </Stack>
);

const MetricWidget = ({
  title,
  value,
  detail,
  icon,
  color,
  editing,
  progress,
  valueDirection = 'rtl',
}: {
  title: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  color: string;
  editing: boolean;
  progress?: number;
  valueDirection?: 'ltr' | 'rtl';
}) => (
  <Paper sx={panelSx}>
    <WidgetHeader title={title} editing={editing} />
    <Stack sx={{ p: 1.5, height: 'calc(100% - 45px)' }} justifyContent="space-between">
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(color, 0.1), color }}>{icon}</Avatar>
        <Typography
          dir={valueDirection}
          variant="h5"
          fontWeight={900}
          sx={{ direction: valueDirection, unicodeBidi: 'isolate' }}
        >
          {value}
        </Typography>
      </Stack>
      <Box>
        <Typography
          className="dashboard-widget-description"
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', width: '100%' }}
          style={{ textAlign: 'right' }}
        >
          {detail}
        </Typography>
        {typeof progress === 'number' && (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ mt: 0.75, height: 4, borderRadius: 2, '& .MuiLinearProgress-bar': { bgcolor: color } }}
          />
        )}
      </Box>
    </Stack>
  </Paper>
);

const EditableDashboardWorkspace: React.FC<Props> = ({
  summary,
  modules,
  loading,
  onRefresh,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const [editing, setEditing] = React.useState(false);
  const [layouts, setLayouts] = React.useState<Layouts>(defaultLayouts);
  const [hiddenIds, setHiddenIds] = React.useState<DashboardWidgetId[]>([]);
  const [workspaceReady, setWorkspaceReady] = React.useState(false);
  const [saveState, setSaveState] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const dirtyRef = React.useRef(false);
  const saveTimerRef = React.useRef<number>();

  const available = React.useMemo(
    () => definitions.filter((definition) => definition.enabled(summary, modules)),
    [summary, modules],
  );
  const availableIds = React.useMemo(() => new Set(available.map((item) => item.id)), [available]);
  const visible = React.useMemo(
    () => available.filter((definition) => !hiddenIds.includes(definition.id)),
    [available, hiddenIds],
  );

  React.useEffect(() => {
    let active = true;
    dashboardApiService.getWorkspace()
      .then((workspace) => {
        if (!active) return;
        const nextLayouts = normalizeLayouts(workspace.layouts, workspace.version);
        const nextHiddenIds = workspace.hiddenWidgetIds || [];
        setLayouts(nextLayouts);
        setHiddenIds(nextHiddenIds);
        if (workspace.version < 4) {
          void dashboardApiService.saveWorkspace({
            version: 4,
            layouts: nextLayouts as DashboardWorkspace['layouts'],
            hiddenWidgetIds: nextHiddenIds,
          });
        }
      })
      .catch(() => {
        if (active) setSaveState('error');
      })
      .finally(() => {
        if (active) setWorkspaceReady(true);
      });
    return () => {
      active = false;
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [user?.id]);

  const persistWorkspace = React.useCallback(async (
    nextLayouts: Layouts,
    nextHidden: DashboardWidgetId[],
  ) => {
    if (!workspaceReady) return;
    setSaveState('saving');
    try {
      const payload: DashboardWorkspace = {
        version: 4,
        layouts: nextLayouts as DashboardWorkspace['layouts'],
        hiddenWidgetIds: nextHidden,
      };
      await dashboardApiService.saveWorkspace(payload);
      dirtyRef.current = false;
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }, [workspaceReady]);

  const scheduleSave = React.useCallback((
    nextLayouts: Layouts,
    nextHidden: DashboardWidgetId[],
  ) => {
    dirtyRef.current = true;
    setSaveState('idle');
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      void persistWorkspace(nextLayouts, nextHidden);
    }, 700);
  }, [persistWorkspace]);

  const handleLayoutChange = (_current: Layout[], next: Layouts) => {
    if (!workspaceReady) return;
    const merged = mergeLayouts(layouts, next);
    setLayouts(merged);
    scheduleSave(merged, hiddenIds);
  };

  const toggleWidget = (id: DashboardWidgetId) => {
    const next = hiddenIds.includes(id)
      ? hiddenIds.filter((item) => item !== id)
      : [...hiddenIds, id];
    setHiddenIds(next);
    scheduleSave(layouts, next);
  };

  const resetWorkspace = () => {
    const nextLayouts = normalizeLayouts({}, 4);
    setLayouts(nextLayouts);
    setHiddenIds([]);
    scheduleSave(nextLayouts, []);
  };

  const closeEditor = () => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    if (dirtyRef.current) void persistWorkspace(layouts, hiddenIds);
    setEditing(false);
  };

  const openKalk = (scenarioId: string) =>
    navigate(`/kalknegar/scenario/${scenarioId}?integration=react`);

  const renderWidget = (id: DashboardWidgetId) => {
    const management = summary.managementMetrics;
    const latest = summary.latestScenario;
    const color = theme.palette.primary.main;

    if (id === 'active_users_24h') {
      return <MetricWidget title="کاربران فعال در ۲۴ ساعت" value={fa(management?.activeUsers24h || 0)} detail="بر اساس ورود موفق ثبت‌شده" icon={<GroupOutlined />} color="#2e7d42" editing={editing} />;
    }
    if (id === 'failed_logins_24h') {
      return <MetricWidget title="ورودهای ناموفق" value={fa(management?.failedLogins24h || 0)} detail="در ۲۴ ساعت گذشته" icon={<LoginOutlined />} color="#d32f2f" editing={editing} />;
    }
    if (id === 'storage_usage') {
      const storage = management?.storage;
      return <MetricWidget title="فضای ذخیره‌سازی استفاده‌شده" value={`${fa(Math.round(storage?.percent || 0))}٪`} detail={storage ? `${formatBytes(storage.usedBytes)} از ${formatBytes(storage.totalBytes)}` : 'اطلاعات در دسترس نیست'} icon={<StorageOutlined />} color="#2774b8" editing={editing} progress={storage?.percent || 0} />;
    }
    if (id === 'healthy_services') {
      const services = management?.services;
      return <MetricWidget title="سرویس‌های سالم" value={`${fa(services?.healthy || 0)} / ${fa(services?.total || 0)}`} valueDirection="ltr" detail="تعداد سرویس‌های سالم از کل سرویس‌ها" icon={<CloudDoneOutlined />} color="#2e7d42" editing={editing} progress={services?.total ? services.healthy / services.total * 100 : 0} />;
    }
    if (id === 'continue_latest_kalk') {
      return (
        <Paper sx={panelSx}>
          <WidgetHeader title="ادامه آخرین کالک" editing={editing} action={<Tooltip title="به‌روزرسانی"><span><IconButton size="small" disabled={loading} onClick={onRefresh}><RefreshOutlined fontSize="small" /></IconButton></span></Tooltip>} />
          {latest ? (
            <Stack
              dir="ltr"
              direction={{ xs: 'column', md: 'row' }}
              sx={{ height: 'calc(100% - 45px)' }}
              style={{ direction: 'ltr' }}
            >
              <Box sx={{ width: { xs: '100%', md: '46%' }, height: { xs: 140, md: '100%' }, minHeight: 0 }}>
                <ScenarioMapPreview scenario={latest} height="100%" />
              </Box>
              <Stack
                dir="rtl"
                spacing={0.9}
                sx={{ p: 1.5, flex: 1, minWidth: 0, overflow: 'auto' }}
                style={{ direction: 'rtl', textAlign: 'right' }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h6" fontWeight={900} noWrap style={{ textAlign: 'right' }}>{latest.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} style={{ textAlign: 'right' }}>آخرین ذخیره: {formatPersianDateTime(latest.modifiedAt)}</Typography>
                  </Box>
                  <Chip size="small" label={latest.archivedAt ? 'بایگانی‌شده' : 'ذخیره‌شده'} color={latest.archivedAt ? 'default' : 'success'} variant="outlined" />
                </Stack>
                <Stack
                  dir="rtl"
                  direction="row"
                  spacing={1}
                  flexWrap="wrap"
                  useFlexGap
                  style={{ direction: 'rtl', textAlign: 'right' }}
                >
                  <Chip size="small" icon={<Inventory2Outlined />} label={`${fa(latest.contentStats.units)} یگان`} />
                  <Chip size="small" icon={<MapOutlined />} label={`${fa(latest.contentStats.features)} عارضه`} />
                  <Chip size="small" icon={<TimelineOutlined />} label={`${fa(latest.contentStats.events)} رویداد`} />
                  <Chip size="small" icon={<DescriptionOutlined />} label={`${fa(latest.contentStats.conditions)} شرایط محیطی`} />
                </Stack>
                <Box sx={{ flex: 1 }} />
                <Button
                  component="a"
                  href={`/kalknegar/scenario/${latest.id}?integration=react`}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="contained"
                  startIcon={<OpenInNewOutlined />}
                  disabled={!canAccessFeature(user?.role, 'kalknegar.access')}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  ادامه در کالک‌نگار
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Stack alignItems="center" justifyContent="center" sx={{ height: 'calc(100% - 45px)' }} spacing={1}>
              <MapOutlined color="disabled" />
              <Typography color="text.secondary">هنوز سناریویی برای ادامه وجود ندارد.</Typography>
            </Stack>
          )}
        </Paper>
      );
    }
    if (id === 'scenario_overview') {
      const items = [
        ['همه سناریوها', summary.scenarioOverview.total, <FolderOpenOutlined />, '#3b6f4a'],
        ['پیش‌نویس‌ها', summary.scenarioOverview.draft, <DescriptionOutlined />, '#2774b8'],
        ['آماده مرور', summary.scenarioOverview.readyForReview, <CheckCircleOutline />, '#2e7d42'],
        ['بایگانی‌شده', summary.scenarioOverview.archived, <ArchiveOutlined />, '#6c746f'],
      ] as const;
      return (
        <Paper sx={panelSx}>
          <WidgetHeader title="وضعیت سناریوها" editing={editing} />
          <Stack direction="row" sx={{ height: 'calc(100% - 45px)' }}>
            {items.map(([label, value, icon, itemColor], index) => (
              <Stack key={label} direction="row" alignItems="center" justifyContent="space-between" sx={{ flex: 1, minWidth: 0, px: 1.5, borderLeft: index < items.length - 1 ? '1px solid' : 0, borderColor: 'divider' }}>
                <Avatar sx={{ width: 34, height: 34, bgcolor: alpha(itemColor, 0.1), color: itemColor }}>{icon}</Avatar>
                <Box style={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} style={{ textAlign: 'right' }}>{label}</Typography>
                  <Typography fontWeight={900}>{fa(value)}</Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Paper>
      );
    }
    if (id === 'recent_scenarios') {
      return (
        <Paper sx={panelSx}>
          <WidgetHeader title="سناریوهای اخیر" editing={editing} action={<Button size="small" onClick={() => navigate('/dashboard/scenarios')}>مشاهده همه</Button>} />
          <List dense disablePadding sx={{ height: 'calc(100% - 45px)', overflow: 'auto' }}>
            {summary.recentScenarios.map((scenario) => (
              <ListItem key={scenario.id} divider secondaryAction={<IconButton size="small" onClick={() => openKalk(scenario.id)}><OpenInNewOutlined fontSize="small" /></IconButton>}>
                <ListItemAvatar><Avatar variant="rounded" sx={{ bgcolor: alpha(color, 0.1), color }}><MapOutlined /></Avatar></ListItemAvatar>
                <ListItemText
                  primary={<Typography variant="body2" fontWeight={800}>{scenario.name}</Typography>}
                  secondary={`${formatPersianDateTime(scenario.modifiedAt)} · ${fa(scenario.contentStats.features)} عارضه · ${fa(scenario.contentStats.units)} یگان`}
                  style={{ textAlign: 'right' }}
                  secondaryTypographyProps={{ style: { textAlign: 'right' } }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      );
    }
    if (id === 'quick_access') {
      const actions = [
        { label: 'سناریوی جدید', icon: <AddOutlined />, allowed: canAccessFeature(user?.role, 'scenarios.manage'), onClick: () => navigate('/dashboard/scenarios?create=1') },
        { label: 'مدیریت سناریوها', icon: <FolderOpenOutlined />, allowed: true, onClick: () => navigate('/dashboard/scenarios') },
        { label: 'مدیریت منابع', icon: <Inventory2Outlined />, allowed: canAccessFeature(user?.role, 'resources.view'), onClick: () => navigate('/dashboard/resources') },
        { label: 'ورود به کالک‌نگار', icon: <MapOutlined />, allowed: canAccessFeature(user?.role, 'kalknegar.access'), onClick: () => latest ? openKalk(latest.id) : navigate('/dashboard/scenarios') },
      ].filter((item) => item.allowed);
      return (
        <Paper sx={panelSx}>
          <WidgetHeader title="دسترسی سریع" editing={editing} />
          <Box sx={{ p: 1.25, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1, height: 'calc(100% - 45px)', overflow: 'auto' }}>
            {actions.map((action) => (
              <Button key={action.label} variant="outlined" color="inherit" onClick={action.onClick} sx={{ minHeight: 70, display: 'flex', flexDirection: 'column', gap: 0.5, borderColor: 'divider' }}>
                {action.icon}<Typography variant="caption">{action.label}</Typography>
              </Button>
            ))}
          </Box>
        </Paper>
      );
    }
    if (id === 'user_activity_chart') {
      const rows = management?.userActivity || [];
      const max = Math.max(1, ...rows.flatMap((row) => [row.created, row.changed]));
      return (
        <Paper sx={panelSx}>
          <WidgetHeader title="فعالیت کاربران و ساخت سناریوها" editing={editing} action={<Typography variant="caption" color="text.secondary">۷ روز گذشته</Typography>} />
          <Box sx={{ p: 1.5, height: 'calc(100% - 45px)', overflow: 'auto' }}>
            <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
              <Typography variant="caption"><Box component="span" sx={{ display: 'inline-block', width: 9, height: 9, bgcolor: '#2e7d42', ml: 0.5 }} />سناریوی جدید</Typography>
              <Typography variant="caption"><Box component="span" sx={{ display: 'inline-block', width: 9, height: 9, bgcolor: '#2774b8', ml: 0.5 }} />سایر تغییرات</Typography>
            </Stack>
            {rows.length ? rows.map((row) => (
              <Stack key={row.userId} direction="row" alignItems="center" spacing={1} sx={{ minHeight: 38 }}>
                <Typography variant="caption" noWrap sx={{ width: 115 }}>{row.name}</Typography>
                <Stack spacing={0.4} sx={{ flex: 1 }}>
                  <Box sx={{ width: `${Math.max(2, row.created / max * 100)}%`, height: 8, bgcolor: '#2e7d42' }} />
                  <Box sx={{ width: `${Math.max(2, row.changed / max * 100)}%`, height: 8, bgcolor: '#2774b8' }} />
                </Stack>
                <Typography variant="caption" sx={{ width: 58, textAlign: 'left' }}>{fa(row.created)} / {fa(row.changed)}</Typography>
              </Stack>
            )) : <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>در این بازه فعالیت سناریویی ثبت نشده است.</Typography>}
          </Box>
        </Paper>
      );
    }
    if (id === 'recent_activities') {
      return (
        <Paper sx={panelSx}>
          <WidgetHeader title="آخرین تغییرات" editing={editing} action={<IconButton size="small" onClick={onRefresh}><RefreshOutlined fontSize="small" /></IconButton>} />
          <List dense disablePadding sx={{ height: 'calc(100% - 45px)', overflow: 'auto' }}>
            {summary.activities.slice(0, 8).map((activity) => (
              <ListItem key={activity.id} divider>
                <ListItemAvatar><Avatar sx={{ width: 30, height: 30, bgcolor: alpha(color, 0.1), color }}><HistoryOutlined sx={{ fontSize: 17 }} /></Avatar></ListItemAvatar>
                <ListItemText
                  primary={activity.title}
                  secondary={`${activity.description} · ${formatPersianDateTime(activity.occurredAt)}`}
                  style={{ textAlign: 'right' }}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 700, style: { textAlign: 'right' } }}
                  secondaryTypographyProps={{ variant: 'caption', noWrap: true, style: { textAlign: 'right' } }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      );
    }
    if (id === 'archived_scenarios') {
      return <MetricWidget title="سناریوهای بایگانی‌شده" value={fa(summary.scenarioStats.archived)} detail={`از ${fa(summary.scenarioStats.total)} سناریو`} icon={<ArchiveOutlined />} color="#64716b" editing={editing} />;
    }
    if (id === 'available_forces') {
      return <MetricWidget title="نیروهای موجود" value={fa(summary.forceStats.total)} detail={`${fa(summary.forceStats.iranian)} ایرانی، ${fa(summary.forceStats.foreign)} خارجی`} icon={<GroupOutlined />} color="#2e7d42" editing={editing} />;
    }
    if (id === 'ongoing_operations') {
      return <MetricWidget title="عملیات در حال اجرا" value={fa(summary.operationStats.active)} detail={`${fa(summary.operationStats.ready)} آماده اجرا`} icon={<TimelineOutlined />} color="#2774b8" editing={editing} />;
    }
    if (id === 'security_alerts') {
      return <MetricWidget title="هشدارهای امنیتی" value={fa(summary.alertStats.total)} detail={`${fa(summary.alertStats.lockedAccounts)} حساب قفل‌شده`} icon={<ErrorOutline />} color="#e87516" editing={editing} />;
    }
    if (id === 'system_status') {
      return (
        <Paper sx={panelSx}>
          <WidgetHeader title="وضعیت منابع سامانه" editing={editing} />
          <Stack spacing={1.2} sx={{ p: 1.5, height: 'calc(100% - 45px)', overflow: 'auto' }}>
            {summary.systemStatus.map((metric) => (
              <Box key={metric.key}>
                <Stack direction="row" justifyContent="space-between"><Typography variant="caption">{metric.name}</Typography><Typography variant="caption" fontWeight={800}>{fa(metric.value)}٪</Typography></Stack>
                <LinearProgress variant="determinate" value={metric.value} color={metric.color} sx={{ mt: 0.4, height: 5 }} />
              </Box>
            ))}
          </Stack>
        </Paper>
      );
    }
    return (
      <Paper sx={panelSx}>
        <WidgetHeader title="اطلاعیه‌های مهم" editing={editing} />
        <Stack spacing={1} sx={{ p: 1.25, height: 'calc(100% - 45px)', overflow: 'auto' }}>
          {summary.notices.map((notice, index) => <Alert key={index} severity={notice.severity} sx={{ py: 0 }} style={{ textAlign: 'right' }}><Typography variant="caption" sx={{ display: 'block' }} style={{ textAlign: 'right' }}>{notice.message}</Typography></Alert>)}
        </Stack>
      </Paper>
    );
  };

  return (
    <Box>
      <Stack
        dir="ltr"
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1.5 }}
        style={{ direction: 'ltr' }}
      >
        <Button
          dir="rtl"
          variant="outlined"
          startIcon={<TuneOutlined />}
          onClick={() => setEditing(true)}
        >
          مدیریت کارت‌ها
        </Button>
        <Stack dir="rtl" direction="row" alignItems="center" spacing={1}>
          {saveState === 'saving' && <Typography variant="caption" color="text.secondary">در حال ذخیره میزکار...</Typography>}
          {saveState === 'saved' && <Typography variant="caption" color="success.main">میزکار ذخیره شد</Typography>}
          {saveState === 'error' && <Typography variant="caption" color="error.main">ذخیره میزکار انجام نشد</Typography>}
        </Stack>
      </Stack>

      <Box
        dir="ltr"
        style={{ direction: 'ltr' }}
        sx={{
          '& .react-grid-item > *': { direction: 'rtl' },
          '& .react-grid-item.react-grid-placeholder': {
            bgcolor: alpha(theme.palette.primary.main, 0.18),
            border: `1px dashed ${theme.palette.primary.main}`,
            borderRadius: 1.5,
          },
          '& .react-resizable-handle': {
            display: 'none !important',
          },
        }}
      >
        <ResponsiveGrid
          key={visible.map((item) => item.id).join('|')}
          layouts={layouts}
          breakpoints={BREAKPOINTS}
          cols={COLS}
          rowHeight={72}
          margin={[12, 12]}
          containerPadding={[0, 0]}
          compactType="vertical"
          isDraggable
          isResizable={false}
          draggableHandle=".dashboard-drag-handle"
          onLayoutChange={handleLayoutChange}
        >
          {visible.map((definition) => (
            <Box key={definition.id} dir="rtl">{renderWidget(definition.id)}</Box>
          ))}
        </ResponsiveGrid>
      </Box>

      <Drawer variant="persistent" anchor="left" open={editing}>
        <Stack sx={{ width: 310, p: 2, height: '100%' }} spacing={1.5}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6" fontWeight={900}>ویرایش داشبورد</Typography>
              <Typography variant="caption" color="text.secondary">تنظیمات برای حساب شما ذخیره می‌شود.</Typography>
            </Box>
            <IconButton onClick={closeEditor}><SaveOutlined /></IconButton>
          </Stack>
          <List dense sx={{ flex: 1, overflow: 'auto', borderTop: '1px solid', borderColor: 'divider' }}>
            {available.map((definition) => (
              <ListItem key={definition.id} divider secondaryAction={<Switch edge="end" checked={!hiddenIds.includes(definition.id)} onChange={() => toggleWidget(definition.id)} />}>
                <ListItemAvatar><Avatar sx={{ width: 30, height: 30, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}><DragIndicator sx={{ fontSize: 17 }} /></Avatar></ListItemAvatar>
                <ListItemText
                  primary={definition.title}
                  style={{ textAlign: 'right' }}
                  primaryTypographyProps={{ variant: 'body2', style: { textAlign: 'right' } }}
                />
              </ListItem>
            ))}
          </List>
          <Button startIcon={<RestartAltOutlined />} variant="outlined" color="inherit" onClick={resetWorkspace}>بازنشانی چیدمان</Button>
          <Button startIcon={<SaveOutlined />} variant="contained" onClick={closeEditor}>ذخیره و پایان</Button>
        </Stack>
      </Drawer>
    </Box>
  );
};

export default EditableDashboardWorkspace;
