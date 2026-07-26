import React, { useState, useEffect, useCallback } from 'react';
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
  PlayArrow, 
  Pause, 
  Stop, 
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
  startScenarioExecution,
  pauseScenarioExecution,
  resumeScenarioExecution,
  stopScenarioExecution,
  analyzeScenario,
  selectSimulationStatus,
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
  ExecutionStatus,
  PhaseStatus,
  EnvironmentalFactorType,
  AnalysisType,
  EnvironmentalCondition,
} from '@/types';
import ScenarioDialog from '@/components/common/ScenarioDialog';
import { showSuccessNotification, showErrorNotification } from '@/store/slices/uiSlice';
import ScenarioIntroSettingsPanel from '@/modules/dashboard/components/ScenarioIntroSettingsPanel';
import { scenarioApiService } from '@/services/api/scenarioApiService';

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
const ManagedInKalkNegar: React.FC<{ scenarioId?: string }> = ({ scenarioId }) => {
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
      <Button
        variant="contained"
        startIcon={<OpenInNew />}
        href={kalknegarUrl}
        target="_blank"
        rel="noopener"
      >
        {t('scenarios.managedInKalknegar.launchButton')}
      </Button>
    </Box>
  );
};

// ---------- Analysis tab ----------
const ScenarioAnalysis: React.FC<{ scenario: EnhancedScenario }> = ({ scenario }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const lastResult = useAppSelector(selectLastAnalysisResult);
  const [analysisType, setAnalysisType] = useState<AnalysisType>(AnalysisType.FORCE_RATIO);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyzeScenario = async () => {
    setAnalyzing(true);
    try {
      await dispatch(analyzeScenario({ id: scenario.id, analysisType })).unwrap();
      dispatch(showSuccessNotification(t('scenarios.analysis.success')));
    } catch {
      dispatch(showErrorNotification(t('scenarios.analysis.error')));
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>{t('scenarios.analysis.title')}</Typography>
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
                  disabled={analyzing}
                  startIcon={analyzing ? undefined : <BarChart />}
                  sx={{ mt: 2 }}
                >
                  {analyzing ? <LinearProgress style={{ width: '100%' }} /> : t('scenarios.analysis.runButton')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title={t('scenarios.analysis.resultsTitle')}
              subheader={lastResult ? new Date(lastResult.timestamp).toLocaleString('fa-IR') : ''}
            />
            <CardContent>
              {!lastResult ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">{t('scenarios.analysis.noResults')}</Typography>
                </Box>
              ) : (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>{t('scenarios.analysis.chartTitle')}</Typography>
                  <Box sx={{ height: 200, bgcolor: 'background.default', mb: 2, p: 2 }}>
                    <pre>{JSON.stringify(lastResult.data.chart, null, 2)}</pre>
                  </Box>
                  <Typography variant="subtitle1" gutterBottom>{t('scenarios.analysis.statisticsTitle')}</Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">{t('scenarios.analysis.effectiveness')}</Typography>
                      <Typography variant="h6"><TransformFarsiNumbers>{lastResult.data.statistics.effectiveness.toFixed(1)}%</TransformFarsiNumbers></Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">{t('scenarios.analysis.probability')}</Typography>
                      <Typography variant="h6"><TransformFarsiNumbers>{lastResult.data.statistics.probability.toFixed(1)}%</TransformFarsiNumbers></Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">{t('scenarios.analysis.risk')}</Typography>
                      <Typography variant="h6"><TransformFarsiNumbers>{lastResult.data.statistics.risk.toFixed(1)}%</TransformFarsiNumbers></Typography>
                    </Grid>
                  </Grid>
                  <Typography variant="subtitle1" gutterBottom>{t('scenarios.analysis.conclusionsTitle')}</Typography>
                  <Box sx={{ mb: 2 }}>
                    {lastResult.conclusions?.map((c: string, i: number) => (
                      <Typography key={i} variant="body2" paragraph>• {c}</Typography>
                    ))}
                  </Box>
                  <Typography variant="subtitle1" gutterBottom>{t('scenarios.analysis.recommendationsTitle')}</Typography>
                  <Box>
                    {lastResult.recommendations?.map((r: string, i: number) => (
                      <Typography key={i} variant="body2" paragraph>• {r}</Typography>
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
const ScenarioPhasesManager: React.FC<{ scenario: EnhancedScenario }> = ({ scenario }) => {
  const { t } = useTranslation();
  const getStatusColor = (status: PhaseStatus) => {
    switch (status) {
      case PhaseStatus.COMPLETED: return 'primary';
      case PhaseStatus.IN_PROGRESS: return 'primary';
      case PhaseStatus.FAILED: return 'error';
      case PhaseStatus.CANCELLED: return 'warning';
      default: return 'default';
    }
  };
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">{t('scenarios.phases.title')}</Typography>
        <Button variant="outlined" startIcon={<Add />} size="small">{t('scenarios.phases.addPhase')}</Button>
      </Box>
      {!scenario.phases || scenario.phases.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>{t('scenarios.phases.noPhases')}</Alert>
      ) : (
        [...scenario.phases]
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map(phase => (
            <Card key={phase.id} sx={{ mb: 2 }}>
              <CardHeader
                title={phase.name}
                subheader={`${new Date(phase.startTime).toLocaleString('fa-IR')} تا ${phase.endTime ? new Date(phase.endTime).toLocaleString('fa-IR') : t('scenarios.phases.noEndTime')}`}
                action={
                  <Box>
                    <Chip label={t(`scenarios.phases.status.${phase.status}`)} color={getStatusColor(phase.status)} size="small" sx={{ mr: 1 }} />
                    <IconButton size="small"><Edit fontSize="small" /></IconButton>
                  </Box>
                }
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary" paragraph>{phase.description}</Typography>
                <Typography variant="subtitle2" gutterBottom>{t('scenarios.phases.objectives')}:</Typography>
                <Box sx={{ ml: 2, mb: 2 }}>
                  {phase.objectives.map((o, i) => <Typography key={i} variant="body2">• {o}</Typography>)}
                </Box>
                <Typography variant="subtitle2" gutterBottom>{t('scenarios.phases.tasks')} ({phase.tasks.length}):</Typography>
                <Box sx={{ ml: 2 }}>
                  {phase.tasks.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">{t('scenarios.phases.noTasks')}</Typography>
                  ) : (
                    phase.tasks.map((task, i) => <Typography key={i} variant="body2">• {task.description}</Typography>)
                  )}
                </Box>
              </CardContent>
            </Card>
          ))
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

const toDateTimeLocal = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const EnvironmentalConditionsManager: React.FC<{
  scenario: EnhancedScenario;
}> = ({ scenario }) => {
  const dispatch = useAppDispatch();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    type: EnvironmentalFactorType.WEATHER,
    startTime: toDateTimeLocal(scenario.startTime),
    endTime: '',
    value: 0,
    description: '',
  });

  const conditions = scenario.environmentalConditions || [];

  const openCreateDialog = () => {
    setEditingId(null);
    setForm({
      type: EnvironmentalFactorType.WEATHER,
      startTime: toDateTimeLocal(scenario.startTime),
      endTime: '',
      value: 0,
      description: '',
    });
    setFormError('');
    setDialogOpen(true);
  };

  const openEditDialog = (condition: EnvironmentalCondition) => {
    setEditingId(condition.id);
    setForm({
      type: condition.type,
      startTime: toDateTimeLocal(condition.startTime),
      endTime: toDateTimeLocal(condition.endTime),
      value: condition.value,
      description: condition.description || '',
    });
    setFormError('');
    setDialogOpen(true);
  };

  const persistConditions = async (nextConditions: EnvironmentalCondition[]) => {
    await dispatch(
      updateScenario({
        id: scenario.id,
        updates: {
          ...scenario,
          environmentalConditions: nextConditions,
        },
      })
    ).unwrap();
    await dispatch(fetchScenarioById(scenario.id));
  };

  const handleSave = async () => {
    const start = new Date(form.startTime);
    const end = form.endTime ? new Date(form.endTime) : undefined;
    if (!form.startTime || Number.isNaN(start.getTime())) {
      setFormError('زمان شروع شرایط محیطی معتبر نیست.');
      return;
    }
    if (end && (Number.isNaN(end.getTime()) || end <= start)) {
      setFormError('زمان پایان باید بعد از زمان شروع باشد.');
      return;
    }

    const condition: EnvironmentalCondition = {
      id: editingId || crypto.randomUUID(),
      type: form.type,
      startTime: start.toISOString(),
      endTime: end?.toISOString(),
      value: Number(form.value),
      description: form.description.trim() || undefined,
    };
    const nextConditions = editingId
      ? conditions.map(item => (item.id === editingId ? condition : item))
      : [...conditions, condition];

    setSaving(true);
    setFormError('');
    try {
      await persistConditions(nextConditions);
      setDialogOpen(false);
      dispatch(showSuccessNotification('شرایط محیطی روی خط زمانی ذخیره شد.'));
    } catch {
      setFormError('ذخیره شرایط محیطی انجام نشد.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (conditionId: string) => {
    try {
      await persistConditions(
        conditions.filter(condition => condition.id !== conditionId)
      );
      dispatch(showSuccessNotification('شرایط محیطی حذف شد.'));
    } catch {
      dispatch(showErrorNotification('حذف شرایط محیطی انجام نشد.'));
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h6">خط زمانی شرایط محیطی</Typography>
          <Typography variant="body2" color="text.secondary">
            آب‌وهوا و وضعیت متغیر زمین به‌صورت بازه زمانی ثبت می‌شوند.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Add />}
          size="small"
          onClick={openCreateDialog}
        >
          افزودن شرایط
        </Button>
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
                <Card>
                  <CardHeader
                    title={ENVIRONMENTAL_TYPE_LABELS[condition.type]}
                    subheader={`${new Date(condition.startTime).toLocaleString(
                      'fa-IR'
                    )} تا ${
                      condition.endTime
                        ? new Date(condition.endTime).toLocaleString('fa-IR')
                        : 'ادامه‌دار'
                    }`}
                    action={
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => openEditDialog(condition)}
                          aria-label="ویرایش شرایط"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(condition.id)}
                          aria-label="حذف شرایط"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    }
                  />
                  <CardContent>
                    {condition.description && (
                      <Typography variant="body2" paragraph>
                        {condition.description}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      مقدار: {condition.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
        </Grid>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingId ? 'ویرایش شرایط محیطی' : 'افزودن شرایط محیطی'}
        </DialogTitle>
        <DialogContent dividers>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>نوع شرایط</InputLabel>
                <Select
                  value={form.type}
                  label="نوع شرایط"
                  onChange={event =>
                    setForm(previous => ({
                      ...previous,
                      type: event.target.value as EnvironmentalFactorType,
                    }))
                  }
                >
                  {Object.values(EnvironmentalFactorType).map(type => (
                    <MenuItem key={type} value={type}>
                      {ENVIRONMENTAL_TYPE_LABELS[type]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="زمان شروع"
                type="datetime-local"
                value={form.startTime}
                onChange={event =>
                  setForm(previous => ({
                    ...previous,
                    startTime: event.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="زمان پایان"
                type="datetime-local"
                value={form.endTime}
                onChange={event =>
                  setForm(previous => ({
                    ...previous,
                    endTime: event.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                helperText="برای وضعیت ادامه‌دار خالی بگذارید"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="مقدار"
                value={form.value}
                onChange={event =>
                  setForm(previous => ({
                    ...previous,
                    value: Number(event.target.value),
                  }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="توضیحات"
                value={form.description}
                onChange={event =>
                  setForm(previous => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            انصراف
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'در حال ذخیره...' : 'ذخیره روی خط زمانی'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ---------- History tab ----------
const ScenarioHistoryTab: React.FC<{ scenarioId: string }> = ({ scenarioId }) => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await scenarioApiService.getScenarioHistory(scenarioId);
        if (!cancelled) setLogs(data);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [scenarioId]);

  if (loading) return <LinearProgress />;

  if (logs.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <History sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography color="text.secondary">{t('scenarios.history.noHistory')}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>{t('scenarios.history.title')}</Typography>
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
                    label={t(`scenarios.history.actions.${log.action}`) || log.action}
                    size="small"
                    color={
                      log.action === 'delete' ? 'error' :
                      log.action === 'archive' ? 'warning' :
                      log.action === 'create' ? 'success' : 'default'
                    }
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{log.actor_user_id || '—'}</TableCell>
                <TableCell>{new Date(log.created_at).toLocaleString('fa-IR')}</TableCell>
                <TableCell>
                  {log.payload_diff ? (
                    <Typography variant="caption" component="code" sx={{ whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(log.payload_diff, null, 1)}
                    </Typography>
                  ) : '—'}
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
  const simulationStatus = useAppSelector(selectSimulationStatus);
  
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const isArchived = !!scenario?.archived_at;
  
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
      const result = await dispatch(duplicateScenario({ id: scenario.id })).unwrap();
      dispatch(showSuccessNotification(t('scenarios.actions.duplicateSuccess')));
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

  const handleEditSave = useCallback(async (updatedScenario: any) => {
    if (!scenario) return;
    try {
      await dispatch(updateScenario({ id: scenario.id, updates: updatedScenario })).unwrap();
      dispatch(showSuccessNotification(t('scenarios.notifications.updateSuccess')));
    } catch {
      dispatch(showErrorNotification(t('scenarios.notifications.updateError')));
    }
    setEditDialogOpen(false);
  }, [scenario, dispatch, t]);

  // ---------- Execution control ----------
  const handleExecutionControl = async () => {
    if (!scenario) return;
    try {
      switch (simulationStatus) {
        case ExecutionStatus.NOT_STARTED:
        case ExecutionStatus.COMPLETED:
        case ExecutionStatus.TERMINATED:
          await dispatch(startScenarioExecution(scenario.id)).unwrap();
          dispatch(showSuccessNotification(t('scenarios.execution.startSuccess')));
          break;
        case ExecutionStatus.RUNNING:
          await dispatch(pauseScenarioExecution(scenario.id)).unwrap();
          dispatch(showSuccessNotification(t('scenarios.execution.pauseSuccess')));
          break;
        case ExecutionStatus.PAUSED:
          await dispatch(resumeScenarioExecution(scenario.id)).unwrap();
          dispatch(showSuccessNotification(t('scenarios.execution.resumeSuccess')));
          break;
      }
    } catch {
      dispatch(showErrorNotification(t('scenarios.execution.error')));
    }
  };
  
  const handleStopExecution = async () => {
    if (!scenario) return;
    try {
      await dispatch(stopScenarioExecution(scenario.id)).unwrap();
      dispatch(showSuccessNotification(t('scenarios.execution.stopSuccess')));
    } catch {
      dispatch(showErrorNotification(t('scenarios.execution.stopError')));
    }
  };
  
  const getExecutionControlIcon = () => {
    if (simulationStatus === ExecutionStatus.RUNNING) return <Pause />;
    return <PlayArrow />;
  };
  
  const getExecutionControlText = () => {
    switch (simulationStatus) {
      case ExecutionStatus.RUNNING: return t('scenarios.execution.pause');
      case ExecutionStatus.PAUSED: return t('scenarios.execution.resume');
      default: return t('scenarios.execution.start');
    }
  };
  
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
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard/scenarios')} sx={{ mt: 2 }}>
          {t('scenarios.backToList')}
        </Button>
      </Box>
    );
  }
  
  if (!scenario) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">{t('scenarios.notFound')}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard/scenarios')} sx={{ mt: 2 }}>
          {t('scenarios.backToList')}
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 4 }}>
      {/* Archived banner */}
      {isArchived && (
        <Alert severity="warning" sx={{ mb: 2 }} action={
          <Button color="inherit" size="small" onClick={handleRestore} disabled={actionLoading}>
            {t('scenarios.actions.restore')}
          </Button>
        }>
          {t('scenarios.archiveDialog.message', { name: scenario.name })}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => navigate('/dashboard/scenarios')} size="small">
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {scenario.name}
            </Typography>
            {scenario.status && (
              <Chip 
                label={t(`scenarios.status.${scenario.status}`)}
                color={
                  scenario.status === 'active' ? 'primary' :
                  scenario.status === 'paused' ? 'warning' :
                  scenario.status === 'completed' ? 'info' : 'default'
                }
                size="small"
                sx={{ ml: 2 }}
              />
            )}
            {isArchived && <Chip label={t('scenarios.actions.archive')} color="warning" size="small" variant="outlined" />}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title={t('scenarios.actions.launch')}>
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
          </Box>
        </Box>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          {scenario.description}
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">{t('scenarios.detail.startTime')}:</Typography>
            <Typography variant="body1">{scenario.startTime ? new Date(scenario.startTime).toLocaleString('fa-IR') : '-'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">{t('scenarios.detail.endTime')}:</Typography>
            <Typography variant="body1">{scenario.endTime ? new Date(scenario.endTime).toLocaleString('fa-IR') : '-'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">{t('scenarios.detail.created')}:</Typography>
            <Typography variant="body1">{scenario.createdAt ? new Date(scenario.createdAt).toLocaleDateString('fa-IR') : '-'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">{t('scenarios.detail.lastModified')}:</Typography>
            <Typography variant="body1">{scenario.updatedAt ? new Date(scenario.updatedAt).toLocaleDateString('fa-IR') : '-'}</Typography>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">{t('scenarios.detail.objectives')}:</Typography>
          <Box sx={{ mt: 0.5, mb: 2 }}>
            {scenario.objectives && scenario.objectives.length > 0 ? (
              scenario.objectives.map((obj, i) => <Chip key={i} label={obj} size="small" sx={{ mr: 1, mb: 1 }} />)
            ) : (
              <Typography variant="body2" color="text.secondary">{t('scenarios.detail.noObjectives')}</Typography>
            )}
          </Box>
        </Box>
      </Box>
      
      {/* Admin actions toolbar */}
      <Paper sx={{ mb: 3 }}>
        <Toolbar variant="dense" sx={{ gap: 1, flexWrap: 'wrap' }}>
          {/* Execution */}
          <Tooltip title={getExecutionControlText()}>
            <Button
              startIcon={getExecutionControlIcon()}
              onClick={handleExecutionControl}
              variant="contained"
              color={simulationStatus === ExecutionStatus.RUNNING ? 'secondary' : 'primary'}
              disabled={simulationStatus === ExecutionStatus.TERMINATED}
              size="small"
            >
              {getExecutionControlText()}
            </Button>
          </Tooltip>
          
          {(simulationStatus === ExecutionStatus.RUNNING || simulationStatus === ExecutionStatus.PAUSED) && (
            <Tooltip title={t('scenarios.execution.stop')}>
              <Button startIcon={<Stop />} onClick={handleStopExecution} variant="outlined" color="error" size="small">
                {t('scenarios.execution.stop')}
              </Button>
            </Tooltip>
          )}
          
          <Box sx={{ flexGrow: 1 }} />

          <Tooltip title={t('scenarios.actions.duplicate')}>
            <Button startIcon={<ContentCopy />} onClick={handleDuplicate} variant="outlined" size="small" disabled={actionLoading}>
              {t('scenarios.actions.duplicate')}
            </Button>
          </Tooltip>

          <Tooltip title={t('scenarios.actions.export')}>
            <Button startIcon={<CloudDownload />} onClick={handleExport} variant="outlined" size="small" disabled={actionLoading}>
              {t('scenarios.actions.export')}
            </Button>
          </Tooltip>

          {isArchived ? (
            <Tooltip title={t('scenarios.actions.restore')}>
              <Button startIcon={<Unarchive />} onClick={handleRestore} variant="outlined" color="info" size="small" disabled={actionLoading}>
                {t('scenarios.actions.restore')}
              </Button>
            </Tooltip>
          ) : (
            <Tooltip title={t('scenarios.actions.archive')}>
              <Button startIcon={<Archive />} onClick={() => setArchiveConfirmOpen(true)} variant="outlined" color="warning" size="small" disabled={actionLoading}>
                {t('scenarios.actions.archive')}
              </Button>
            </Tooltip>
          )}

          <Tooltip title={t('common.edit')}>
            <IconButton onClick={() => setEditDialogOpen(true)} size="small">
              <Edit />
            </IconButton>
          </Tooltip>

          <Tooltip title={t('common.delete')}>
            <IconButton onClick={() => setDeleteConfirmOpen(true)} color="error" size="small">
              <Delete />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </Paper>
      
      {/* Tabs */}
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab icon={<Schedule />} iconPosition="start" label={t('scenarios.tabs.phases')} />
            <Tab icon={<Terrain />} iconPosition="start" label={t('scenarios.tabs.environment')} />
            <Tab icon={<BarChart />} iconPosition="start" label={t('scenarios.tabs.analysis')} />
            <Tab icon={<Movie />} iconPosition="start" label={t('scenarios.tabs.intro')} />
            <Tab icon={<History />} iconPosition="start" label={t('scenarios.tabs.history')} />
            <Tab icon={<Timeline />} iconPosition="start" label={t('scenarios.tabs.timeline')} />
            <Tab icon={<MapIcon />} iconPosition="start" label={t('scenarios.tabs.map')} />
            <Tab icon={<Groups />} iconPosition="start" label={t('scenarios.tabs.units')} />
          </Tabs>
        </Box>
        
        {/* Phases */}
        <TabPanel value={tabValue} index={0}>
          <ScenarioPhasesManager scenario={scenario} />
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
          <ScenarioIntroSettingsPanel scenario={scenario} />
        </TabPanel>
        
        {/* History */}
        <TabPanel value={tabValue} index={4}>
          <ScenarioHistoryTab scenarioId={scenario.id} />
        </TabPanel>

        {/* Timeline */}
        <TabPanel value={tabValue} index={5}>
          <EnvironmentalConditionsManager scenario={scenario} />
          <Divider sx={{ my: 4 }} />
          <ManagedInKalkNegar scenarioId={scenario.id} />
        </TabPanel>

        {/* Map – managed in KalkNegar */}
        <TabPanel value={tabValue} index={6}>
          <ManagedInKalkNegar scenarioId={scenario.id} />
        </TabPanel>

        {/* Units – managed in KalkNegar */}
        <TabPanel value={tabValue} index={7}>
          <ManagedInKalkNegar scenarioId={scenario.id} />
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
      <Dialog open={deleteConfirmOpen} onClose={() => { setDeleteConfirmOpen(false); setDeleteConfirmText(''); }}>
        <DialogTitle>{t('scenarios.deleteDialog.title')}</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            {t('scenarios.deleteDialog.message', { name: scenario.name })}
          </Typography>
          <Alert severity="error" sx={{ mb: 2 }}>{t('scenarios.deleteDialog.warning')}</Alert>
          <TextField
            fullWidth
            label={t('scenarios.deleteDialog.typeToConfirm')}
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            size="small"
            placeholder={scenario.name}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteConfirmOpen(false); setDeleteConfirmText(''); }}>
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
      <Dialog open={archiveConfirmOpen} onClose={() => setArchiveConfirmOpen(false)}>
        <DialogTitle>{t('scenarios.archiveDialog.title')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('scenarios.archiveDialog.message', { name: scenario.name })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchiveConfirmOpen(false)}>{t('scenarios.deleteDialog.cancelButton')}</Button>
          <Button onClick={handleArchive} color="warning" variant="contained" disabled={actionLoading}>
            {t('scenarios.archiveDialog.confirmButton')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScenarioDetailPage;
