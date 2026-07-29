import React from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  Grid,
  IconButton,
  LinearProgress,
  ListItemText,
  Menu,
  MenuItem,
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
  CalendarMonthOutlined,
  CloudOutlined,
  EditNoteOutlined,
  FolderOpenOutlined,
  Inventory2Outlined,
  LayersOutlined,
  MapOutlined,
  MoreVertOutlined,
  OpenInNewOutlined,
  PeopleAltOutlined,
  RefreshOutlined,
  RouteOutlined,
  TimelineOutlined,
  TuneOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectUser } from '@/store/slices/authSlice';
import {
  DashboardModulesSettings,
  updateDashboardModules,
} from '@/store/slices/uiSlice';
import {
  DashboardScenarioCard,
  DashboardSummary,
} from '@/services/api/dashboardApiService';
import { canAccessFeature } from '@/security/roleAccess';
import { formatPersianDateTime } from '@/utils/dateUtils';
import ScenarioMapPreview from './ScenarioMapPreview';

interface KalkWorkbenchCardsProps {
  summary: DashboardSummary;
  modules: DashboardModulesSettings;
  loading: boolean;
  onRefresh: () => void;
}

const faNumber = (value: number) => value.toLocaleString('fa-IR');

const statusPresentation: Record<string, { label: string; color: string; background: string }> = {
  draft: { label: 'پیش‌نویس', color: '#2563a8', background: '#eaf3fb' },
  ready: { label: 'آماده مرور', color: '#2e7d42', background: '#eaf4ec' },
  review: { label: 'آماده مرور', color: '#2e7d42', background: '#eaf4ec' },
  under_review: { label: 'در حال مرور', color: '#9b5a11', background: '#fff3e5' },
  awaiting_review: { label: 'آماده مرور', color: '#2e7d42', background: '#eaf4ec' },
  ready_for_review: { label: 'آماده مرور', color: '#2e7d42', background: '#eaf4ec' },
  active: { label: 'فعال', color: '#2e7d42', background: '#eaf4ec' },
  paused: { label: 'متوقف', color: '#9b5a11', background: '#fff3e5' },
  completed: { label: 'تکمیل‌شده', color: '#177773', background: '#e8f5f3' },
  archived: { label: 'بایگانی‌شده', color: '#626d67', background: '#eef1ef' },
};

const scenarioStatus = (scenario: DashboardScenarioCard) =>
  statusPresentation[scenario.archivedAt ? 'archived' : scenario.status] || statusPresentation.draft;

const panelSx = {
  borderRadius: 1.5,
  overflow: 'hidden',
  boxShadow: 'none',
  bgcolor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
};

const PanelHeader = ({
  title,
  caption,
  action,
}: {
  title: string;
  caption?: string;
  action?: React.ReactNode;
}) => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    spacing={2}
    sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}
  >
    <Box>
      <Typography variant="subtitle1" fontWeight={800}>{title}</Typography>
      {caption && <Typography variant="caption" color="text.secondary">{caption}</Typography>}
    </Box>
    {action}
  </Stack>
);

const ScenarioImage = ({
  scenario,
  height,
}: {
  scenario: DashboardScenarioCard;
  height: number;
}) => (
  <ScenarioMapPreview scenario={scenario} height={height} />
);

const ContentMetric = ({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) => (
  <Stack alignItems="center" spacing={0.35} sx={{ minWidth: 62 }}>
    <Stack direction="row" alignItems="center" spacing={0.55}>
      <Box sx={{ color: 'text.secondary', display: 'flex', '& svg': { fontSize: 17 } }}>{icon}</Box>
      <Typography variant="body2" fontWeight={800}>{faNumber(value)}</Typography>
    </Stack>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
  </Stack>
);

const KalkWorkbenchCards: React.FC<KalkWorkbenchCardsProps> = ({
  summary,
  modules,
  loading,
  onRefresh,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const [cardsMenuAnchor, setCardsMenuAnchor] = React.useState<null | HTMLElement>(null);
  const latest = summary.latestScenario;
  const canOpenKalk = canAccessFeature(user?.role, 'kalknegar.access');
  const canManageScenarios = canAccessFeature(user?.role, 'scenarios.manage');
  const canManageResources = canAccessFeature(user?.role, 'resources.manage');
  const canManageUsers = canAccessFeature(user?.role, 'users.manage');
  const primary = theme.palette.primary.main;

  const openKalk = (scenarioId: string) => {
    navigate(`/kalknegar/scenario/${scenarioId}?integration=react`);
  };

  const quickActions = [
    {
      title: 'سناریوی جدید',
      caption: 'آغاز فرم ایجاد سناریو',
      icon: <AddOutlined />,
      visible: canManageScenarios,
      action: () => navigate('/dashboard/scenarios?create=1'),
    },
    {
      title: 'ورود به کالک‌نگار',
      caption: latest ? `ادامه ${latest.name}` : 'انتخاب سناریو',
      icon: <MapOutlined />,
      visible: canOpenKalk,
      action: () => latest ? openKalk(latest.id) : navigate('/dashboard/scenarios'),
    },
    {
      title: 'مشاهده بایگانی',
      caption: `${faNumber(summary.scenarioOverview.archived)} سناریوی بایگانی‌شده`,
      icon: <ArchiveOutlined />,
      visible: true,
      action: () => navigate('/dashboard/scenarios'),
    },
    {
      title: 'مدیریت منابع',
      caption: 'نمادها و اقلام کالک',
      icon: <Inventory2Outlined />,
      visible: canManageResources,
      action: () => navigate('/dashboard/resources'),
    },
    {
      title: 'مدیریت کاربران',
      caption: 'حساب‌ها و سطح دسترسی',
      icon: <PeopleAltOutlined />,
      visible: canManageUsers,
      action: () => navigate('/dashboard/users'),
    },
  ].filter((action) => action.visible).slice(0, 4);

  const openActivity = (activity: DashboardSummary['activities'][number]) => {
    const [kind, id] = activity.id.split(':');
    if (kind === 'scenario') navigate(`/dashboard/scenarios/${id}`);
    else if (kind === 'resource') navigate('/dashboard/resources');
    else if (kind === 'user' && canManageUsers) navigate(`/dashboard/users/${id}`);
  };

  const activityIcon = (kind: string) => {
    if (kind === 'scenario') return <AssignmentOutlined />;
    if (kind === 'resource') return <Inventory2Outlined />;
    return <PeopleAltOutlined />;
  };

  const overviewCards = [
    {
      title: 'همه سناریوها',
      value: summary.scenarioOverview.total,
      icon: <FolderOpenOutlined />,
      color: '#26733c',
      action: () => navigate('/dashboard/scenarios'),
    },
    {
      title: 'پیش‌نویس‌ها',
      value: summary.scenarioOverview.draft,
      icon: <EditNoteOutlined />,
      color: '#2563a8',
      action: () => navigate('/dashboard/scenarios'),
    },
    {
      title: 'آماده مرور',
      value: summary.scenarioOverview.readyForReview,
      icon: <TimelineOutlined />,
      color: '#177773',
      action: () => navigate('/dashboard/scenarios'),
    },
    {
      title: 'بایگانی‌شده',
      value: summary.scenarioOverview.archived,
      icon: <ArchiveOutlined />,
      color: '#626d67',
      action: () => navigate('/dashboard/scenarios'),
    },
  ];

  const showLatest = modules.showContinueLatestKalk && canOpenKalk;
  const showOverview = modules.showScenarioOverview;
  const showRecentScenarios = modules.showRecentScenarios;
  const showQuickAccess = modules.showQuickAccess && quickActions.length > 0;
  const showActivities = modules.showRecentActivities && summary.visibleCards.includes('recent_activities');
  const showLowerSection = showRecentScenarios || showQuickAccess || showActivities;
  const cardVisibilityOptions: Array<{
    key: keyof DashboardModulesSettings;
    label: string;
    available: boolean;
  }> = [
    { key: 'showContinueLatestKalk', label: 'ادامه آخرین کالک', available: canOpenKalk },
    { key: 'showScenarioOverview', label: 'خلاصه وضعیت سناریوها', available: true },
    { key: 'showRecentScenarios', label: 'سناریوهای اخیر', available: true },
    { key: 'showQuickAccess', label: 'دسترسی سریع', available: quickActions.length > 0 },
    {
      key: 'showRecentActivities',
      label: 'آخرین تغییرات',
      available: summary.visibleCards.includes('recent_activities'),
    },
  ];

  return (
    <Box sx={{ mb: 2.5 }}>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<TuneOutlined />}
          onClick={(event) => setCardsMenuAnchor(event.currentTarget)}
          sx={{ borderRadius: 1.25 }}
        >
          مدیریت کارت‌ها
        </Button>
        <Menu
          anchorEl={cardsMenuAnchor}
          open={Boolean(cardsMenuAnchor)}
          onClose={() => setCardsMenuAnchor(null)}
          PaperProps={{ sx: { width: 290, borderRadius: 1.5, mt: 0.5 } }}
        >
          {cardVisibilityOptions.map((option) => (
            <MenuItem
              key={option.key}
              disabled={!option.available}
              onClick={() => {
                if (!option.available) return;
                dispatch(updateDashboardModules({ [option.key]: !modules[option.key] }));
              }}
              sx={{ minHeight: 48 }}
            >
              <ListItemText
                primary={option.label}
                secondary={!option.available ? 'برای نقش فعلی در دسترس نیست' : undefined}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 700 }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
              <Switch
                size="small"
                edge="end"
                checked={Boolean(modules[option.key] && option.available)}
                disabled={!option.available}
                inputProps={{ 'aria-label': `نمایش ${option.label}` }}
              />
            </MenuItem>
          ))}
        </Menu>
      </Stack>

      {showLatest && (
        <Paper sx={{ ...panelSx, mb: 1.5 }}>
          <PanelHeader
            title="ادامه آخرین کالک"
            caption="آخرین سناریوی غیر بایگانی بر اساس زمان ذخیره"
            action={
              <Tooltip title="به‌روزرسانی اطلاعات">
                <span>
                  <IconButton size="small" onClick={onRefresh} disabled={loading}>
                    <RefreshOutlined fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            }
          />
          {latest ? (
            <Grid container>
              <Grid item xs={12} md={3.2}>
                <ScenarioImage scenario={latest} height={210} />
              </Grid>
              <Grid item xs={12} md={8.8}>
                <Stack sx={{ height: '100%', p: 2.2 }} justifyContent="space-between" spacing={2}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5}>
                    <Box>
                      <Typography variant="h6" fontWeight={900}>{latest.name}</Typography>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.8 }}>
                        <Chip
                          size="small"
                          label={scenarioStatus(latest).label}
                          sx={{
                            color: scenarioStatus(latest).color,
                            bgcolor: scenarioStatus(latest).background,
                            fontWeight: 800,
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          آخرین ذخیره: {formatPersianDateTime(latest.modifiedAt)}
                        </Typography>
                      </Stack>
                    </Box>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<OpenInNewOutlined />}
                      onClick={() => openKalk(latest.id)}
                      sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' }, borderRadius: 1.25, boxShadow: 'none' }}
                    >
                      ادامه در کالک‌نگار
                    </Button>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 850 }}>
                    {latest.description || 'برای این سناریو توضیحی ثبت نشده است.'}
                  </Typography>
                  <Stack
                    direction="row"
                    justifyContent="space-around"
                    divider={<Box sx={{ width: '1px', bgcolor: 'divider' }} />}
                    sx={{ pt: 1.2, borderTop: '1px solid', borderColor: 'divider', overflowX: 'auto' }}
                  >
                    <ContentMetric icon={<PeopleAltOutlined />} value={latest.contentStats.units} label="یگان" />
                    <ContentMetric icon={<LayersOutlined />} value={latest.contentStats.layers} label="لایه ترسیمی" />
                    <ContentMetric icon={<RouteOutlined />} value={latest.contentStats.features} label="عارضه" />
                    <ContentMetric icon={<CalendarMonthOutlined />} value={latest.contentStats.events} label="رویداد" />
                    <ContentMetric icon={<CloudOutlined />} value={latest.contentStats.conditions} label="شرایط محیطی" />
                    <ContentMetric icon={<TimelineOutlined />} value={latest.contentStats.storyboardScenes} label="صحنه استوری‌بورد" />
                  </Stack>
                </Stack>
              </Grid>
            </Grid>
          ) : (
            <Stack alignItems="center" spacing={1.2} sx={{ py: 5 }}>
              <MapOutlined color="disabled" sx={{ fontSize: 42 }} />
              <Typography variant="body2" color="text.secondary">سناریوی فعالی برای ادامه کالک وجود ندارد.</Typography>
              {canManageScenarios && (
                <Button size="small" onClick={() => navigate('/dashboard/scenarios?create=1')}>ایجاد سناریو</Button>
              )}
            </Stack>
          )}
        </Paper>
      )}

      {showOverview && (
        <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
          {overviewCards.map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item.title}>
              <Card variant="outlined" sx={{ borderRadius: 1.5, boxShadow: 'none', height: '100%' }}>
                <CardActionArea onClick={item.action} sx={{ p: 1.7, textAlign: 'right', height: '100%' }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="body2" fontWeight={800}>{item.title}</Typography>
                      <Typography variant="h5" fontWeight={900} sx={{ mt: 0.7 }}>{faNumber(item.value)}</Typography>
                      <Typography variant="caption" sx={{ color: item.color }}>مشاهده فهرست</Typography>
                    </Box>
                    <Avatar
                      variant="rounded"
                      sx={{ bgcolor: alpha(item.color, 0.09), color: item.color, borderRadius: 1.25 }}
                    >
                      {item.icon}
                    </Avatar>
                  </Stack>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {showLowerSection && (
        <Grid container spacing={1.5}>
          {showRecentScenarios && (
            <Grid item xs={12} lg={8}>
              <Paper sx={{ ...panelSx, height: '100%' }}>
                <PanelHeader
                  title="سناریوهای اخیر"
                  caption="آخرین سناریوها بر اساس زمان ویرایش"
                  action={
                    <Button size="small" onClick={() => navigate('/dashboard/scenarios')}>
                      مشاهده همه
                    </Button>
                  }
                />
                <Stack divider={<Box sx={{ height: '1px', bgcolor: 'divider' }} />}>
                  {summary.recentScenarios.length > 0 ? summary.recentScenarios.map((scenario) => {
                    const status = scenarioStatus(scenario);
                    return (
                      <Stack
                        key={scenario.id}
                        direction="row"
                        alignItems="center"
                        spacing={1.3}
                        sx={{ px: 1.5, py: 1, '&:hover': { bgcolor: 'action.hover' } }}
                      >
                        <Box sx={{ width: 72, flex: '0 0 72px', borderRadius: 1, overflow: 'hidden' }}>
                          <ScenarioImage scenario={scenario} height={46} />
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="body2" fontWeight={800} noWrap>{scenario.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatPersianDateTime(scenario.modifiedAt)}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={status.label}
                          sx={{ color: status.color, bgcolor: status.background, fontWeight: 700 }}
                        />
                        <Stack direction="row" spacing={1.1} sx={{ color: 'text.secondary', minWidth: 180 }}>
                          <Typography variant="caption">{faNumber(scenario.contentStats.units)} یگان</Typography>
                          <Typography variant="caption">{faNumber(scenario.contentStats.features)} عارضه</Typography>
                          <Typography variant="caption">{faNumber(scenario.contentStats.events)} رویداد</Typography>
                        </Stack>
                        <Tooltip title="عملیات سناریو">
                          <IconButton size="small" onClick={() => navigate(`/dashboard/scenarios/${scenario.id}`)}>
                            <MoreVertOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    );
                  }) : (
                    <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 5 }}>
                      سناریویی برای نمایش وجود ندارد.
                    </Typography>
                  )}
                </Stack>
              </Paper>
            </Grid>
          )}

          {(showQuickAccess || showActivities) && (
            <Grid item xs={12} lg={showRecentScenarios ? 4 : 12}>
              <Stack spacing={1.5} direction={showRecentScenarios ? 'column' : { xs: 'column', md: 'row' }}>
                {showQuickAccess && (
                  <Paper sx={{ ...panelSx, flex: 1 }}>
                    <PanelHeader title="دسترسی سریع" caption="فرمان‌های مجاز برای نقش فعلی" />
                    <Grid container>
                      {quickActions.map((action, index) => (
                        <Grid item xs={6} key={action.title}>
                          <Button
                            fullWidth
                            onClick={action.action}
                            sx={{
                              minHeight: 78,
                              borderRadius: 0,
                              justifyContent: 'flex-start',
                              px: 1.5,
                              color: 'text.primary',
                              borderLeft: index % 2 === 0 ? '1px solid' : 0,
                              borderBottom: index < quickActions.length - 2 ? '1px solid' : 0,
                              borderColor: 'divider',
                            }}
                          >
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Avatar
                                variant="rounded"
                                sx={{ width: 34, height: 34, borderRadius: 1, color: primary, bgcolor: alpha(primary, 0.09) }}
                              >
                                {action.icon}
                              </Avatar>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" display="block" fontWeight={800}>{action.title}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.66rem' }}>{action.caption}</Typography>
                              </Box>
                            </Stack>
                          </Button>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                )}

                {showActivities && (
                  <Paper sx={{ ...panelSx, flex: 1 }}>
                    <PanelHeader
                      title="آخرین تغییرات"
                      caption="ثبت‌شده در سامانه"
                      action={
                        <Tooltip title="به‌روزرسانی">
                          <span>
                            <IconButton size="small" onClick={onRefresh} disabled={loading}>
                              <RefreshOutlined fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      }
                    />
                    <Stack sx={{ px: 1.5, py: 0.5 }}>
                      {summary.activities.slice(0, 3).map((activity, index) => (
                        <Stack
                          key={activity.id}
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          onClick={() => openActivity(activity)}
                          sx={{
                            py: 1.1,
                            cursor: 'pointer',
                            borderBottom: index < Math.min(summary.activities.length, 3) - 1 ? '1px solid' : 0,
                            borderColor: 'divider',
                          }}
                        >
                          <Avatar
                            variant="rounded"
                            sx={{ width: 30, height: 30, borderRadius: 1, color: primary, bgcolor: alpha(primary, 0.09), '& svg': { fontSize: 17 } }}
                          >
                            {activityIcon(activity.kind)}
                          </Avatar>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="caption" display="block" fontWeight={800} noWrap>{activity.title}</Typography>
                            <Typography variant="caption" color="text.secondary" noWrap display="block">{activity.description}</Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', fontSize: '0.65rem' }}>
                            {formatPersianDateTime(activity.occurredAt, { year: undefined, month: 'short', day: 'numeric' })}
                          </Typography>
                        </Stack>
                      ))}
                      {summary.activities.length === 0 && (
                        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                          تغییری ثبت نشده است.
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                )}
              </Stack>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default KalkWorkbenchCards;
