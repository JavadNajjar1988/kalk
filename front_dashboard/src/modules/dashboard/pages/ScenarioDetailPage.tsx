import React, { useState, useEffect, useCallback } from 'react';
import ms from 'milsymbol';
import {
  Box,
  Tab,
  Tabs,
  Paper,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  IconButton,
  Chip,
  LinearProgress,
  Alert,
  Toolbar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Edit,
  Delete,
  Timeline,
  Map as MapIcon,
  BarChart,
  Groups,
  Terrain,
  Settings,
  Save,
  CloudDownload,
  Assessment,
  Schedule,
  ArrowBack,
  Add,
  Movie,
  Archive,
  Unarchive,
  ContentCopy,
  OpenInNew,
  History,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppDispatch, useAppSelector } from '@/store';
import TransformFarsiNumbers from '@/components/common/TransformFarsiNumbers';
import {
  fetchScenarioById,
  selectCurrentScenario,
  selectScenariosLoading,
  selectScenariosError,
  analyzeScenario,
  selectLastAnalysisResult,
  deleteScenario,
  archiveScenario,
  restoreScenario,
  duplicateScenario,
  exportScenarioJson,
  updateScenario,
} from '@/store/slices/scenariosSlice';
import {
  EnhancedScenario,
  ScenarioStatus,
  PhaseStatus,
  EnvironmentalFactorType,
  AnalysisType,
  EnvironmentalCondition,
} from '@/types';
import ScenarioDialog from '@/components/common/ScenarioDialog';
import {
  showSuccessNotification,
  showErrorNotification,
} from '@/store/slices/uiSlice';
import ScenarioIntroSettingsPanel from '@/modules/dashboard/components/ScenarioIntroSettingsPanel';
import { scenarioApiService } from '@/services/api/scenarioApiService';
import { selectUser } from '@/store/slices/authSlice';
import { canAccessFeature } from '@/security/roleAccess';
import {
  environmentalKindLabel,
  environmentalParameters,
  environmentalSidc,
} from '@/modules/dashboard/utils/environmentPresentation';

const ANALYSIS_API_AVAILABLE = false;

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
      id={`scenario-tabpanel-${index}`}
      aria-labelledby={`scenario-tab-${index}`}
      style={{ width: '100%' }}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
}

// ---------- Managed-in-KalkNegar placeholder ----------
const ManagedInKalkNegar: React.FC<{
  scenarioId?: string;
  canLaunch: boolean;
}> = ({ scenarioId, canLaunch }) => {
  const { t } = useTranslation();
  const kalknegarUrl = scenarioId
    ? `/kalknegar/scenario/${scenarioId}?integration=react`
    : '#';

  return (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <OpenInNew sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        {t('scenarios.managedInKalknegar.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('scenarios.managedInKalknegar.description')}
      </Typography>
      {canLaunch ? (
        <Button
          variant="contained"
          startIcon={<OpenInNew />}
          href={kalknegarUrl}
          target="_blank"
          rel="noopener"
        >
          {t('scenarios.managedInKalknegar.launchButton')}
        </Button>
      ) : (
        <Button variant="contained" startIcon={<OpenInNew />} disabled>
          نیازمند دسترسی کالک‌نگار
        </Button>
      )}
    </Box>
  );
};

// ---------- Analysis tab ----------
const ScenarioAnalysis: React.FC<{ scenario: EnhancedScenario }> = ({
  scenario,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const lastResult = useAppSelector(selectLastAnalysisResult);
  const [analysisType, setAnalysisType] = useState<AnalysisType>(
    AnalysisType.FORCE_RATIO
  );
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyzeScenario = async () => {
    setAnalyzing(true);
    try {
      await dispatch(
        analyzeScenario({ id: scenario.id, analysisType })
      ).unwrap();
      dispatch(showSuccessNotification(t('scenarios.analysis.success')));
    } catch {
      dispatch(showErrorNotification(t('scenarios.analysis.error')));
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('scenarios.analysis.title')}
      </Typography>
      {!ANALYSIS_API_AVAILABLE && (
        <Alert severity="info" sx={{ mb: 2 }}>
          تحلیل عملیاتی هنوز به سرویس محاسباتی متصل نشده و اجرای آن غیرفعال است.
        </Alert>
      )}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title={t('scenarios.analysis.typeTitle')} />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Object.values(AnalysisType).map(type => (
                  <Button
                    key={type}
                    variant={analysisType === type ? 'contained' : 'outlined'}
                    startIcon={<Assessment />}
                    onClick={() => setAnalysisType(type)}
                    fullWidth
                  >
                    {t(`scenarios.analysis.types.${type}`)}
                  </Button>
                ))}
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAnalyzeScenario}
                  disabled={analyzing || !ANALYSIS_API_AVAILABLE}
                  startIcon={analyzing ? undefined : <BarChart />}
                  sx={{ mt: 2 }}
                >
                  {analyzing ? (
                    <LinearProgress style={{ width: '100%' }} />
                  ) : (
                    t('scenarios.analysis.runButton')
                  )}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title={t('scenarios.analysis.resultsTitle')}
              subheader={
                lastResult
                  ? new Date(lastResult.timestamp).toLocaleString('fa-IR')
                  : ''
              }
            />
            <CardContent>
              {!lastResult ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    {t('scenarios.analysis.noResults')}
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('scenarios.analysis.chartTitle')}
                  </Typography>
                  <Box
                    sx={{
                      height: 200,
                      bgcolor: 'background.default',
                      mb: 2,
                      p: 2,
                    }}
                  >
                    <pre>{JSON.stringify(lastResult.data.chart, null, 2)}</pre>
                  </Box>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('scenarios.analysis.statisticsTitle')}
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        {t('scenarios.analysis.effectiveness')}
                      </Typography>
                      <Typography variant="h6">
                        <TransformFarsiNumbers>
                          {lastResult.data.statistics.effectiveness.toFixed(1)}%
                        </TransformFarsiNumbers>
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        {t('scenarios.analysis.probability')}
                      </Typography>
                      <Typography variant="h6">
                        <TransformFarsiNumbers>
                          {lastResult.data.statistics.probability.toFixed(1)}%
                        </TransformFarsiNumbers>
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        {t('scenarios.analysis.risk')}
                      </Typography>
                      <Typography variant="h6">
                        <TransformFarsiNumbers>
                          {lastResult.data.statistics.risk.toFixed(1)}%
                        </TransformFarsiNumbers>
                      </Typography>
                    </Grid>
                  </Grid>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('scenarios.analysis.conclusionsTitle')}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {lastResult.conclusions?.map((c: string, i: number) => (
                      <Typography key={i} variant="body2" paragraph>
                        • {c}
                      </Typography>
                    ))}
                  </Box>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('scenarios.analysis.recommendationsTitle')}
                  </Typography>
                  <Box>
                    {lastResult.recommendations?.map((r: string, i: number) => (
                      <Typography key={i} variant="body2" paragraph>
                        • {r}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// ---------- Phases tab ----------
const ScenarioPhasesManager: React.FC<{
  scenario: EnhancedScenario;
  canLaunch: boolean;
}> = ({ scenario, canLaunch }) => {
  const { t } = useTranslation();
  const phases = [...(scenario.phases || [])].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );
  const phaseIds = new Set(phases.map(phase => phase.id));
  const events = scenario.events || [];
  const assignedEvents = events.filter(
    event => event.phaseId && phaseIds.has(event.phaseId)
  );
  const orphanedEvents = events.filter(
    event => event.phaseId && !phaseIds.has(event.phaseId)
  );
  const unassignedEvents = events.filter(event => !event.phaseId);
  const timeIssues: string[] = [];
  const chronologicalPhases = [...phases].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  chronologicalPhases.forEach((phase, index) => {
    const start = new Date(phase.startTime).getTime();
    const end = phase.endTime ? new Date(phase.endTime).getTime() : undefined;
    if (
      !Number.isFinite(start) ||
      (end !== undefined && (!Number.isFinite(end) || end <= start))
    ) {
      timeIssues.push(`بازه زمانی فاز «${phase.name}» معتبر نیست.`);
    }
    for (let previousIndex = 0; previousIndex < index; previousIndex += 1) {
      const previous = chronologicalPhases[previousIndex];
      if (previous.endTime) {
        const previousEnd = new Date(previous.endTime).getTime();
        if (
          Number.isFinite(previousEnd) &&
          Number.isFinite(start) &&
          start < previousEnd
        ) {
          timeIssues.push(
            `فاز «${phase.name}» با «${previous.name}» هم‌پوشانی زمانی دارد.`
          );
        }
      }
    }
  });

  const kalknegarUrl = `/kalknegar/scenario/${scenario.id}?integration=react`;
  const getStatusColor = (status: PhaseStatus) => {
    switch (status) {
      case PhaseStatus.COMPLETED:
        return 'primary';
      case PhaseStatus.IN_PROGRESS:
        return 'primary';
      case PhaseStatus.FAILED:
        return 'error';
      case PhaseStatus.CANCELLED:
        return 'warning';
      default:
        return 'default';
    }
  };
  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h6">مرور فازهای سناریو</Typography>
          <Typography variant="body2" color="text.secondary">
            تعریف و ویرایش فازها در کالک‌نگار انجام می‌شود؛ این بخش برای کنترل و
            بررسی است.
          </Typography>
        </Box>
        {canLaunch && (
          <Button
            component="a"
            href={kalknegarUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            size="small"
            endIcon={<OpenInNew />}
          >
            ویرایش در کالک‌نگار
          </Button>
        )}
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              تعداد فازها
            </Typography>
            <Typography variant="h6">
              <TransformFarsiNumbers>{phases.length}</TransformFarsiNumbers>
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              رویدادهای متصل
            </Typography>
            <Typography variant="h6">
              <TransformFarsiNumbers>
                {assignedEvents.length}
              </TransformFarsiNumbers>
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              رویدادهای بدون فاز
            </Typography>
            <Typography variant="h6">
              <TransformFarsiNumbers>
                {unassignedEvents.length}
              </TransformFarsiNumbers>
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              ناسازگاری‌ها
            </Typography>
            <Typography
              variant="h6"
              color={
                timeIssues.length || orphanedEvents.length
                  ? 'error.main'
                  : 'text.primary'
              }
            >
              <TransformFarsiNumbers>
                {timeIssues.length + orphanedEvents.length}
              </TransformFarsiNumbers>
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {timeIssues.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {timeIssues.map(issue => (
            <Typography key={issue} variant="body2">
              • {issue}
            </Typography>
          ))}
        </Alert>
      )}
      {orphanedEvents.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <TransformFarsiNumbers>{orphanedEvents.length}</TransformFarsiNumbers>{' '}
          رویداد به فازی متصل است که دیگر وجود ندارد.
        </Alert>
      )}

      {phases.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          هنوز فازی تعریف نشده است. برای ساخت فاز وارد کالک‌نگار شوید.
        </Alert>
      ) : (
        phases.map(phase => {
          const phaseEventCount = events.filter(
            event => event.phaseId === phase.id
          ).length;
          return (
            <Card key={phase.id} sx={{ mb: 2 }}>
              <CardHeader
                title={phase.name}
                subheader={`${new Date(phase.startTime).toLocaleString('fa-IR')} تا ${phase.endTime ? new Date(phase.endTime).toLocaleString('fa-IR') : t('scenarios.phases.noEndTime')}`}
                action={
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip
                      label={`${phaseEventCount.toLocaleString('fa-IR')} رویداد`}
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      label={t(`scenarios.phases.status.${phase.status}`)}
                      color={getStatusColor(phase.status)}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                  </Box>
                }
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {phase.description}
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                  {t('scenarios.phases.objectives')}:
                </Typography>
                <Box sx={{ ml: 2, mb: 2 }}>
                  {phase.objectives.map((o, i) => (
                    <Typography key={i} variant="body2">
                      • {o}
                    </Typography>
                  ))}
                </Box>
                <Typography variant="subtitle2" gutterBottom>
                  {t('scenarios.phases.tasks')} ({phase.tasks.length}):
                </Typography>
                <Box sx={{ ml: 2 }}>
                  {phase.tasks.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      {t('scenarios.phases.noTasks')}
                    </Typography>
                  ) : (
                    phase.tasks.map((task, i) => (
                      <Typography key={i} variant="body2">
                        • {task.description}
                      </Typography>
                    ))
                  )}
                </Box>
              </CardContent>
            </Card>
          );
        })
      )}
    </Box>
  );
};

// ---------- Environment tab ----------
const ENVIRONMENTAL_TYPE_LABELS: Record<EnvironmentalFactorType, string> = {
  [EnvironmentalFactorType.WEATHER]: 'وضعیت جوی',
  [EnvironmentalFactorType.VISIBILITY]: 'دید',
  [EnvironmentalFactorType.TEMPERATURE]: 'دما',
  [EnvironmentalFactorType.PRECIPITATION]: 'بارش',
  [EnvironmentalFactorType.WIND]: 'باد',
  [EnvironmentalFactorType.TIME_OF_DAY]: 'وضعیت روشنایی',
  [EnvironmentalFactorType.SEASON]: 'فصل',
  [EnvironmentalFactorType.TERRAIN_CONDITION]: 'وضعیت متغیر زمین',
};

const environmentLabel = (condition: EnvironmentalCondition) =>
  condition.kind
    ? environmentalKindLabel(condition)
    : condition.type
      ? ENVIRONMENTAL_TYPE_LABELS[condition.type]
      : 'شرایط محیطی';

const EnvironmentMilitarySymbol: React.FC<{
  condition: EnvironmentalCondition;
}> = ({ condition }) => {
  let svg = '';
  try {
    svg = new ms.Symbol(environmentalSidc(condition), { size: 44 }).asSVG();
  } catch {
    svg = new ms.Symbol('S-G-UCFOO-', { size: 44 }).asSVG();
  }

  return (
    <Box
      aria-label={`نماد نظامی ${environmentLabel(condition)}`}
      sx={{
        width: 56,
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        '& svg': { maxWidth: '48px', maxHeight: '48px' },
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

const EnvironmentalConditionsManager: React.FC<{
  scenario: EnhancedScenario;
}> = ({ scenario }) => {
  const conditions = scenario.environmentalConditions || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h6">مرور شرایط محیطی</Typography>
          <Typography variant="body2" color="text.secondary">
            این اطلاعات در کالک‌نگار روی نقشه و خط زمانی تعریف می‌شوند و اینجا
            فقط قابل مرور هستند.
          </Typography>
        </Box>
      </Box>

      {conditions.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          هنوز شرایط محیطی زمان‌مندی برای این سناریو ثبت نشده است.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {[...conditions]
            .sort(
              (first, second) =>
                new Date(first.startTime).getTime() -
                new Date(second.startTime).getTime()
            )
            .map(condition => (
              <Grid item xs={12} sm={6} md={4} key={condition.id}>
                <Card
                  variant="outlined"
                  sx={{ height: '100%', borderRadius: 1 }}
                >
                  <CardHeader
                    avatar={<EnvironmentMilitarySymbol condition={condition} />}
                    title={condition.name || environmentLabel(condition)}
                    subheader={`${new Date(condition.startTime).toLocaleString(
                      'fa-IR'
                    )} تا ${
                      condition.endTime
                        ? new Date(condition.endTime).toLocaleString('fa-IR')
                        : 'ادامه‌دار'
                    }`}
                    action={
                      <Chip
                        size="small"
                        color={
                          condition.enabled === false ? 'default' : 'success'
                        }
                        variant="outlined"
                        label={condition.enabled === false ? 'غیرفعال' : 'فعال'}
                      />
                    }
                    sx={{
                      alignItems: 'flex-start',
                      '& .MuiCardHeader-action': { m: 0 },
                    }}
                  />
                  <CardContent>
                    {condition.description && (
                      <Typography variant="body2" paragraph>
                        {condition.description}
                      </Typography>
                    )}
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <Chip
                        size="small"
                        label={
                          condition.scope === 'area' ? 'محدوده‌ای' : 'سراسری'
                        }
                      />
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`اولویت ${(condition.priority ?? 0).toLocaleString('fa-IR')}`}
                      />
                      {condition.geometry?.type && (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`هندسه ${
                            {
                              Point: 'نقطه',
                              LineString: 'مسیر',
                              Polygon: 'محدوده',
                              MultiPolygon: 'چندمحدوده',
                            }[condition.geometry.type] ?? 'مکانی'
                          }`}
                        />
                      )}
                    </Box>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                        gap: 1,
                      }}
                    >
                      {environmentalParameters(condition).map(parameter => (
                        <Box
                          key={parameter.key}
                          sx={{
                            minWidth: 0,
                            p: 1,
                            bgcolor: 'action.hover',
                            borderRadius: 1,
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            {parameter.label}
                          </Typography>
                          <Typography variant="body2">
                            {parameter.value}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    {condition.scope === 'area' && !condition.geometry && (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        محدوده این وضعیت روی نقشه ثبت نشده است.
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
        </Grid>
      )}
    </Box>
  );
};

// ---------- History tab ----------
const ScenarioHistoryTab: React.FC<{ scenarioId: string }> = ({
  scenarioId,
}) => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadError(false);
        const data = await scenarioApiService.getScenarioHistory(scenarioId);
        if (!cancelled) setLogs(data);
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scenarioId]);

  if (loading) return <LinearProgress />;

  if (loadError) {
    return (
      <Alert severity="error">دریافت تاریخچهٔ تغییرات سناریو انجام نشد.</Alert>
    );
  }

  if (logs.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <History sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography color="text.secondary">
          {t('scenarios.history.noHistory')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('scenarios.history.title')}
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('scenarios.history.action')}</TableCell>
              <TableCell>{t('scenarios.history.actor')}</TableCell>
              <TableCell>{t('scenarios.history.date')}</TableCell>
              <TableCell>{t('scenarios.history.details')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map(log => (
              <TableRow key={log.id}>
                <TableCell>
                  <Chip
                    label={
                      t(`scenarios.history.actions.${log.action}`) || log.action
                    }
                    size="small"
                    color={
                      log.action === 'delete'
                        ? 'error'
                        : log.action === 'archive'
                          ? 'warning'
                          : log.action === 'create'
                            ? 'success'
                            : 'default'
                    }
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{log.actor_user_id || '—'}</TableCell>
                <TableCell>
                  {new Date(log.created_at).toLocaleString('fa-IR')}
                </TableCell>
                <TableCell>
                  {log.payload_diff ? (
                    <Typography
                      variant="caption"
                      component="code"
                      sx={{ whiteSpace: 'pre-wrap' }}
                    >
                      {JSON.stringify(log.payload_diff, null, 1)}
                    </Typography>
                  ) : (
                    '—'
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

// ---------- Main Page ----------
const ScenarioDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const scenario = useAppSelector(selectCurrentScenario);
  const isLoading = useAppSelector(selectScenariosLoading);
  const error = useAppSelector(selectScenariosError);
  const user = useAppSelector(selectUser);

  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isArchived = !!scenario?.archived_at;
  const canManage = canAccessFeature(user?.role, 'scenarios.manage');
  const canDelete = canAccessFeature(user?.role, 'scenarios.delete');
  const canLaunchKalknegar = canAccessFeature(user?.role, 'kalknegar.access');

  useEffect(() => {
    if (id) dispatch(fetchScenarioById(id));
  }, [dispatch, id]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const kalknegarUrl = scenario
    ? `/kalknegar/scenario/${scenario.id}?integration=react`
    : '#';

  // ---------- Admin actions ----------
  const handleDelete = useCallback(async () => {
    if (!scenario) return;
    setActionLoading(true);
    try {
      await dispatch(deleteScenario(scenario.id)).unwrap();
      dispatch(showSuccessNotification(t('scenarios.actions.deleteSuccess')));
      navigate('/dashboard/scenarios');
    } catch {
      dispatch(showErrorNotification(t('scenarios.actions.deleteError')));
    } finally {
      setActionLoading(false);
      setDeleteConfirmOpen(false);
      setDeleteConfirmText('');
    }
  }, [scenario, dispatch, navigate, t]);

  const handleArchive = useCallback(async () => {
    if (!scenario) return;
    setActionLoading(true);
    try {
      await dispatch(archiveScenario(scenario.id)).unwrap();
      dispatch(showSuccessNotification(t('scenarios.actions.archiveSuccess')));
    } catch {
      dispatch(showErrorNotification(t('scenarios.actions.archiveError')));
    } finally {
      setActionLoading(false);
      setArchiveConfirmOpen(false);
    }
  }, [scenario, dispatch, t]);

  const handleRestore = useCallback(async () => {
    if (!scenario) return;
    setActionLoading(true);
    try {
      await dispatch(restoreScenario(scenario.id)).unwrap();
      dispatch(showSuccessNotification(t('scenarios.actions.restoreSuccess')));
    } catch {
      dispatch(showErrorNotification(t('scenarios.actions.restoreError')));
    } finally {
      setActionLoading(false);
    }
  }, [scenario, dispatch, t]);

  const handleDuplicate = useCallback(async () => {
    if (!scenario) return;
    setActionLoading(true);
    try {
      const result = await dispatch(
        duplicateScenario({ id: scenario.id })
      ).unwrap();
      dispatch(
        showSuccessNotification(t('scenarios.actions.duplicateSuccess'))
      );
      navigate(`/dashboard/scenarios/${result.id}`);
    } catch {
      dispatch(showErrorNotification(t('scenarios.actions.duplicateError')));
    } finally {
      setActionLoading(false);
    }
  }, [scenario, dispatch, navigate, t]);

  const handleExport = useCallback(async () => {
    if (!scenario) return;
    setActionLoading(true);
    try {
      await dispatch(exportScenarioJson(scenario.id)).unwrap();
      dispatch(showSuccessNotification(t('scenarios.actions.exportSuccess')));
    } catch {
      dispatch(showErrorNotification(t('scenarios.actions.exportError')));
    } finally {
      setActionLoading(false);
    }
  }, [scenario, dispatch, t]);

  const handleEditSave = useCallback(
    async (updatedScenario: any) => {
      if (!scenario) return;
      try {
        await dispatch(
          updateScenario({ id: scenario.id, updates: updatedScenario })
        ).unwrap();
        dispatch(
          showSuccessNotification(t('scenarios.notifications.updateSuccess'))
        );
      } catch {
        dispatch(
          showErrorNotification(t('scenarios.notifications.updateError'))
        );
      }
      setEditDialogOpen(false);
    },
    [scenario, dispatch, t]
  );

  // ---------- Loading / Error / NotFound ----------
  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>{t('scenarios.loading')}</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard/scenarios')}
          sx={{ mt: 2 }}
        >
          {t('scenarios.backToList')}
        </Button>
      </Box>
    );
  }

  if (!scenario) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">{t('scenarios.notFound')}</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard/scenarios')}
          sx={{ mt: 2 }}
        >
          {t('scenarios.backToList')}
        </Button>
      </Box>
    );
  }

  const scenarioStatus = scenario.status || ScenarioStatus.DRAFT;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Archived banner */}
      {isArchived && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            canManage ? (
              <Button
                color="inherit"
                size="small"
                onClick={handleRestore}
                disabled={actionLoading}
              >
                {t('scenarios.actions.restore')}
              </Button>
            ) : undefined
          }
        >
          {t('scenarios.archiveDialog.message', { name: scenario.name })}
        </Alert>
      )}

      {/* Compact scenario summary */}
      <Paper
        variant="outlined"
        sx={{ p: { xs: 2, md: 2.5 }, mb: 2, borderRadius: 3 }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
              }}
            >
              <Tooltip title={t('scenarios.backToList')}>
                <IconButton
                  onClick={() => navigate('/dashboard/scenarios')}
                  size="small"
                >
                  <ArrowBack />
                </IconButton>
              </Tooltip>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {scenario.name}
              </Typography>
              <Chip
                label={t(`scenarios.status.${scenarioStatus}`)}
                color={
                  scenarioStatus === ScenarioStatus.ACTIVE
                    ? 'primary'
                    : scenarioStatus === ScenarioStatus.PAUSED
                      ? 'warning'
                      : scenarioStatus === ScenarioStatus.COMPLETED
                        ? 'info'
                        : 'default'
                }
                size="small"
              />
              {isArchived && (
                <Chip
                  label={t('scenarios.status.archived')}
                  color="warning"
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1, mr: 5, maxWidth: 900 }}
            >
              {scenario.description || 'برای این سناریو توضیحاتی ثبت نشده است.'}
            </Typography>
          </Box>

          {canLaunchKalknegar && (
            <Tooltip title="باز کردن نقشه، یگان‌ها و جزئیات عملیاتی در کالک‌نگار">
              <Button
                variant="contained"
                color="primary"
                startIcon={<OpenInNew />}
                href={kalknegarUrl}
                target="_blank"
                rel="noopener"
                size="small"
              >
                {t('scenarios.actions.launch')}
              </Button>
            </Tooltip>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={1.5}>
          {[
            {
              label: t('scenarios.detail.startTime'),
              value: scenario.startTime
                ? new Date(scenario.startTime).toLocaleString('fa-IR')
                : 'تعریف نشده',
            },
            {
              label: t('scenarios.detail.endTime'),
              value: scenario.endTime
                ? new Date(scenario.endTime).toLocaleString('fa-IR')
                : 'تعریف نشده',
            },
            {
              label: t('scenarios.detail.created'),
              value: scenario.createdAt
                ? new Date(scenario.createdAt).toLocaleDateString('fa-IR')
                : 'نامشخص',
            },
            {
              label: t('scenarios.detail.lastModified'),
              value: scenario.updatedAt
                ? new Date(scenario.updatedAt).toLocaleDateString('fa-IR')
                : 'نامشخص',
            },
          ].map(item => (
            <Grid item xs={12} sm={6} md={3} key={item.label}>
              <Box
                sx={{
                  p: 1.5,
                  height: '100%',
                  bgcolor: 'action.hover',
                  borderRadius: 2,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
                  <TransformFarsiNumbers>{item.value}</TransformFarsiNumbers>
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              mb: 1,
            }}
          >
            <Typography variant="subtitle2">
              {t('scenarios.detail.objectives')}
            </Typography>
            {canManage &&
              (!scenario.objectives || scenario.objectives.length === 0) && (
                <Button
                  size="small"
                  startIcon={<Add />}
                  onClick={() => setEditDialogOpen(true)}
                >
                  افزودن هدف
                </Button>
              )}
          </Box>
          {scenario.objectives && scenario.objectives.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {scenario.objectives.map((objective, index) => (
                <Chip
                  key={`${objective}-${index}`}
                  label={objective}
                  size="small"
                />
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t('scenarios.detail.noObjectives')}
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Scenario actions */}
      <Paper variant="outlined" sx={{ mb: 3, borderRadius: 3 }}>
        <Toolbar
          variant="dense"
          sx={{
            gap: 1,
            py: 1,
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            عملیات سناریو
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {canManage && (
              <Tooltip title="ساخت یک سناریوی جدید با محتوای سناریوی فعلی">
                <Button
                  startIcon={<ContentCopy />}
                  onClick={handleDuplicate}
                  variant="outlined"
                  size="small"
                  disabled={actionLoading}
                >
                  {t('scenarios.actions.duplicate')}
                </Button>
              </Tooltip>
            )}

            <Tooltip title="دانلود نسخه پشتیبان و قابل انتقال سناریو">
              <Button
                startIcon={<CloudDownload />}
                onClick={handleExport}
                variant="outlined"
                size="small"
                disabled={actionLoading}
              >
                {t('scenarios.actions.export')}
              </Button>
            </Tooltip>

            {canManage &&
              (isArchived ? (
                <Tooltip title="بازگرداندن سناریو به فهرست سناریوهای فعال">
                  <Button
                    startIcon={<Unarchive />}
                    onClick={handleRestore}
                    variant="outlined"
                    color="info"
                    size="small"
                    disabled={actionLoading}
                  >
                    {t('scenarios.actions.restore')}
                  </Button>
                </Tooltip>
              ) : (
                <Tooltip title="انتقال به فیلتر «آرشیوشده» بدون حذف اطلاعات">
                  <Button
                    startIcon={<Archive />}
                    onClick={() => setArchiveConfirmOpen(true)}
                    variant="outlined"
                    color="warning"
                    size="small"
                    disabled={actionLoading}
                  >
                    {t('scenarios.actions.archive')}
                  </Button>
                </Tooltip>
              ))}

            {canManage && (
              <Tooltip title="ویرایش نام، وضعیت، زمان‌ها، توضیحات و اهداف">
                <Button
                  startIcon={<Edit />}
                  onClick={() => setEditDialogOpen(true)}
                  variant="outlined"
                  size="small"
                >
                  {t('common.edit')}
                </Button>
              </Tooltip>
            )}

            {canDelete && (
              <Tooltip title="حذف دائمی سناریو و اطلاعات وابسته">
                <Button
                  startIcon={<Delete />}
                  onClick={() => setDeleteConfirmOpen(true)}
                  color="error"
                  variant="outlined"
                  size="small"
                >
                  {t('common.delete')}
                </Button>
              </Tooltip>
            )}
          </Box>
        </Toolbar>
      </Paper>

      {/* Tabs */}
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              icon={<Schedule />}
              iconPosition="start"
              label={t('scenarios.tabs.phases')}
            />
            <Tab
              icon={<Terrain />}
              iconPosition="start"
              label={t('scenarios.tabs.environment')}
            />
            <Tab
              icon={<BarChart />}
              iconPosition="start"
              label={t('scenarios.tabs.analysis')}
            />
            <Tab
              icon={<Movie />}
              iconPosition="start"
              label={t('scenarios.tabs.intro')}
            />
            <Tab
              icon={<History />}
              iconPosition="start"
              label={t('scenarios.tabs.history')}
            />
            <Tab
              icon={<Timeline />}
              iconPosition="start"
              label={t('scenarios.tabs.timeline')}
            />
            <Tab
              icon={<MapIcon />}
              iconPosition="start"
              label={t('scenarios.tabs.map')}
            />
            <Tab
              icon={<Groups />}
              iconPosition="start"
              label={t('scenarios.tabs.units')}
            />
          </Tabs>
        </Box>

        {/* Phases */}
        <TabPanel value={tabValue} index={0}>
          <ScenarioPhasesManager
            scenario={scenario}
            canLaunch={canLaunchKalknegar}
          />
        </TabPanel>

        {/* Environment */}
        <TabPanel value={tabValue} index={1}>
          <EnvironmentalConditionsManager scenario={scenario} />
        </TabPanel>

        {/* Analysis */}
        <TabPanel value={tabValue} index={2}>
          <ScenarioAnalysis scenario={scenario} />
        </TabPanel>

        {/* Intro */}
        <TabPanel value={tabValue} index={3}>
          <ScenarioIntroSettingsPanel
            scenario={scenario}
            readOnly={!canManage}
          />
        </TabPanel>

        {/* History */}
        <TabPanel value={tabValue} index={4}>
          <ScenarioHistoryTab scenarioId={scenario.id} />
        </TabPanel>

        {/* Timeline */}
        <TabPanel value={tabValue} index={5}>
          <ManagedInKalkNegar
            scenarioId={scenario.id}
            canLaunch={canLaunchKalknegar}
          />
        </TabPanel>

        {/* Map – managed in KalkNegar */}
        <TabPanel value={tabValue} index={6}>
          <ManagedInKalkNegar
            scenarioId={scenario.id}
            canLaunch={canLaunchKalknegar}
          />
        </TabPanel>

        {/* Units – managed in KalkNegar */}
        <TabPanel value={tabValue} index={7}>
          <ManagedInKalkNegar
            scenarioId={scenario.id}
            canLaunch={canLaunchKalknegar}
          />
        </TabPanel>
      </Box>

      {/* Edit dialog */}
      <ScenarioDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        scenario={scenario}
        onSave={handleEditSave}
      />

      {/* Delete confirm dialog (strong confirmation) */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeleteConfirmText('');
        }}
      >
        <DialogTitle>{t('scenarios.deleteDialog.title')}</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            {t('scenarios.deleteDialog.message', { name: scenario.name })}
          </Typography>
          <Alert severity="error" sx={{ mb: 2 }}>
            {t('scenarios.deleteDialog.warning')}
          </Alert>
          <TextField
            fullWidth
            label={t('scenarios.deleteDialog.typeToConfirm')}
            value={deleteConfirmText}
            onChange={e => setDeleteConfirmText(e.target.value)}
            size="small"
            placeholder={scenario.name}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteConfirmOpen(false);
              setDeleteConfirmText('');
            }}
          >
            {t('scenarios.deleteDialog.cancelButton')}
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleteConfirmText !== scenario.name || actionLoading}
          >
            {t('scenarios.deleteDialog.confirmButton')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Archive confirm dialog */}
      <Dialog
        open={archiveConfirmOpen}
        onClose={() => setArchiveConfirmOpen(false)}
      >
        <DialogTitle>{t('scenarios.archiveDialog.title')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('scenarios.archiveDialog.message', { name: scenario.name })}
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            اطلاعات حذف نمی‌شود. برای مشاهده یا بازیابی، در صفحه مدیریت سناریوها
            فیلتر وضعیت را روی «آرشیوشده» قرار دهید.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchiveConfirmOpen(false)}>
            {t('scenarios.deleteDialog.cancelButton')}
          </Button>
          <Button
            onClick={handleArchive}
            color="warning"
            variant="contained"
            disabled={actionLoading}
          >
            {t('scenarios.archiveDialog.confirmButton')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScenarioDetailPage;
