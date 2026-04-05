import React, { useState, useEffect } from 'react';
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
  CloudUpload,
  CloudDownload,
  Assessment,
  Schedule,
  ArrowBack,
  Add
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
  selectLastAnalysisResult
} from '@/store/slices/scenariosSlice';
import { EnhancedScenario, ExecutionStatus, PhaseStatus, EnvironmentalFactorType, AnalysisType } from '@/types';
import ScenarioDialog from '@/components/common/ScenarioDialog';
import { showSuccessNotification, showErrorNotification } from '@/store/slices/uiSlice';

// تب‌های صفحه سناریو
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
      {value === index && (
        <Box p={3}>
          {children}
        </Box>
      )}
    </div>
  );
}

// کامپوننت بخش تحلیل سناریو
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
    } catch (error) {
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
      
      <Grid container spacing={3}>
        {/* نوع تحلیل */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title={t('scenarios.analysis.typeTitle')} />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Object.values(AnalysisType).map(type => (
                  <Button
                    key={type}
                    variant={analysisType === type ? "contained" : "outlined"}
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
        
        {/* نتایج تحلیل */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader 
              title={t('scenarios.analysis.resultsTitle')} 
              subheader={lastResult ? new Date(lastResult.timestamp).toLocaleString('fa-IR') : ''}
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
                  {/* نمایش نتایج تحلیل */}
                  <Typography variant="subtitle1" gutterBottom>
                    {t('scenarios.analysis.chartTitle')}
                  </Typography>
                  
                  {/* اینجا می‌توان نمودار نتایج را نمایش داد */}
                  <Box sx={{ height: 200, bgcolor: 'background.default', mb: 2, p: 2 }}>
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
                        <TransformFarsiNumbers>{lastResult.data.statistics.effectiveness.toFixed(1)}%</TransformFarsiNumbers>
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        {t('scenarios.analysis.probability')}
                      </Typography>
                      <Typography variant="h6">
                        <TransformFarsiNumbers>{lastResult.data.statistics.probability.toFixed(1)}%</TransformFarsiNumbers>
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        {t('scenarios.analysis.risk')}
                      </Typography>
                      <Typography variant="h6">
                        <TransformFarsiNumbers>{lastResult.data.statistics.risk.toFixed(1)}%</TransformFarsiNumbers>
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  {/* نتیجه‌گیری‌ها */}
                  <Typography variant="subtitle1" gutterBottom>
                    {t('scenarios.analysis.conclusionsTitle')}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {lastResult.conclusions?.map((conclusion: string, index: number) => (
                      <Typography key={index} variant="body2" paragraph>
                        • {conclusion}
                      </Typography>
                    ))}
                  </Box>
                  
                  {/* پیشنهادات */}
                  <Typography variant="subtitle1" gutterBottom>
                    {t('scenarios.analysis.recommendationsTitle')}
                  </Typography>
                  <Box>
                    {lastResult.recommendations?.map((recommendation: string, index: number) => (
                      <Typography key={index} variant="body2" paragraph>
                        • {recommendation}
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

// کامپوننت بخش مدیریت فازهای سناریو
const ScenarioPhasesManager: React.FC<{ scenario: EnhancedScenario }> = ({ scenario }) => {
  const { t } = useTranslation();
  
  const getStatusColor = (status: PhaseStatus) => {
    switch (status) {
      case PhaseStatus.PLANNED:
        return 'default';
      case PhaseStatus.IN_PROGRESS:
        return 'primary';
      case PhaseStatus.COMPLETED:
        return 'primary';
      case PhaseStatus.FAILED:
        return 'error';
      case PhaseStatus.CANCELLED:
        return 'warning';
      default:
        return 'default';
    }
  };
  
  const getStatusText = (status: PhaseStatus) => {
    return t(`scenarios.phases.status.${status}`);
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">
          {t('scenarios.phases.title')}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Add />}
          size="small"
        >
          {t('scenarios.phases.addPhase')}
        </Button>
      </Box>
      
      {scenario.phases.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('scenarios.phases.noPhases')}
        </Alert>
      ) : (
        scenario.phases
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map(phase => (
            <Card key={phase.id} sx={{ mb: 2 }}>
              <CardHeader
                title={phase.name}
                subheader={`${new Date(phase.startTime).toLocaleString('fa-IR')} تا ${phase.endTime ? new Date(phase.endTime).toLocaleString('fa-IR') : t('scenarios.phases.noEndTime')}`}
                action={
                  <Box>
                    <Chip 
                      label={getStatusText(phase.status)}
                      color={getStatusColor(phase.status)}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <IconButton size="small">
                      <Edit fontSize="small" />
                    </IconButton>
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
                  {phase.objectives.map((objective, index) => (
                    <Typography key={index} variant="body2">• {objective}</Typography>
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
                    phase.tasks.map((task, index) => (
                      <Typography key={index} variant="body2">• {task.description}</Typography>
                    ))
                  )}
                </Box>
              </CardContent>
            </Card>
          ))
      )}
    </Box>
  );
};

// کامپوننت بخش مدیریت شرایط محیطی
const EnvironmentalConditionsManager: React.FC<{ scenario: EnhancedScenario }> = ({ scenario }) => {
  const { t } = useTranslation();
  
  const getEnvironmentalTypeText = (type: EnvironmentalFactorType) => {
    return t(`scenarios.environmental.types.${type}`);
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">
          {t('scenarios.environmental.title')}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Add />}
          size="small"
        >
          {t('scenarios.environmental.addCondition')}
        </Button>
      </Box>
      
      {scenario.environmentalConditions.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('scenarios.environmental.noConditions')}
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {scenario.environmentalConditions.map(condition => (
            <Grid item xs={12} sm={6} md={4} key={condition.id}>
              <Card>
                <CardHeader
                  title={getEnvironmentalTypeText(condition.type)}
                  subheader={`${new Date(condition.startTime).toLocaleString('fa-IR')} تا ${condition.endTime ? new Date(condition.endTime).toLocaleString('fa-IR') : t('scenarios.environmental.ongoing')}`}
                  action={
                    <IconButton size="small">
                      <Edit fontSize="small" />
                    </IconButton>
                  }
                />
                <CardContent>
                  <Typography variant="body2" paragraph>
                    {condition.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('scenarios.environmental.value')}: {condition.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

// کامپوننت اصلی صفحه جزئیات سناریو
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
  
  useEffect(() => {
    if (id) {
      dispatch(fetchScenarioById(id));
    }
  }, [dispatch, id]);
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
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
    } catch (error) {
      dispatch(showErrorNotification(t('scenarios.execution.error')));
    }
  };
  
  const handleStopExecution = async () => {
    if (!scenario) return;
    
    try {
      await dispatch(stopScenarioExecution(scenario.id)).unwrap();
      dispatch(showSuccessNotification(t('scenarios.execution.stopSuccess')));
    } catch (error) {
      dispatch(showErrorNotification(t('scenarios.execution.stopError')));
    }
  };
  
  const getExecutionControlIcon = () => {
    switch (simulationStatus) {
      case ExecutionStatus.RUNNING:
        return <Pause />;
      case ExecutionStatus.PAUSED:
        return <PlayArrow />;
      default:
        return <PlayArrow />;
    }
  };
  
  const getExecutionControlText = () => {
    switch (simulationStatus) {
      case ExecutionStatus.RUNNING:
        return t('scenarios.execution.pause');
      case ExecutionStatus.PAUSED:
        return t('scenarios.execution.resume');
      default:
        return t('scenarios.execution.start');
    }
  };
  
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
  
  return (
    <Box sx={{ p: 4 }}>
      {/* هدر صفحه */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => navigate('/dashboard/scenarios')} size="small">
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {scenario.name}
            </Typography>
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
          </Box>
          
          <Box>
            <IconButton onClick={() => setEditDialogOpen(true)} sx={{ mr: 1 }}>
              <Edit />
            </IconButton>
            <IconButton onClick={() => setDeleteConfirmOpen(true)} color="error">
              <Delete />
            </IconButton>
          </Box>
        </Box>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          {scenario.description}
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              {t('scenarios.detail.startTime')}:
            </Typography>
            <Typography variant="body1">
              {new Date(scenario.startTime).toLocaleString('fa-IR')}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              {t('scenarios.detail.endTime')}:
            </Typography>
            <Typography variant="body1">
              {scenario.endTime ? new Date(scenario.endTime).toLocaleString('fa-IR') : '-'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              {t('scenarios.detail.created')}:
            </Typography>
            <Typography variant="body1">
              {new Date(scenario.createdAt).toLocaleDateString('fa-IR')}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              {t('scenarios.detail.lastModified')}:
            </Typography>
            <Typography variant="body1">
              {new Date(scenario.updatedAt).toLocaleDateString('fa-IR')}
            </Typography>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {t('scenarios.detail.objectives')}:
          </Typography>
          <Box sx={{ mt: 0.5, mb: 2 }}>
            {scenario.objectives && scenario.objectives.length > 0 ? (
              scenario.objectives.map((objective, index) => (
                <Chip
                  key={index}
                  label={objective}
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t('scenarios.detail.noObjectives')}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
      
      {/* نوار ابزار اجرا */}
      <Paper sx={{ mb: 3 }}>
        <Toolbar variant="dense">
          <Tooltip title={getExecutionControlText()}>
            <Button
              startIcon={getExecutionControlIcon()}
              onClick={handleExecutionControl}
              variant="contained"
              color={simulationStatus === ExecutionStatus.RUNNING ? 'secondary' : 'primary'}
              disabled={simulationStatus === ExecutionStatus.TERMINATED}
            >
              {getExecutionControlText()}
            </Button>
          </Tooltip>
          
          {(simulationStatus === ExecutionStatus.RUNNING || simulationStatus === ExecutionStatus.PAUSED) && (
            <Tooltip title={t('scenarios.execution.stop')}>
              <Button
                startIcon={<Stop />}
                onClick={handleStopExecution}
                variant="outlined"
                color="error"
                sx={{ ml: 1 }}
              >
                {t('scenarios.execution.stop')}
              </Button>
            </Tooltip>
          )}
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Button startIcon={<Save />} variant="outlined" sx={{ mr: 1 }}>
            {t('scenarios.actions.save')}
          </Button>
          
          <Button startIcon={<CloudDownload />} variant="outlined">
            {t('scenarios.actions.export')}
          </Button>
        </Toolbar>
      </Paper>
      
      {/* تب‌های صفحه */}
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="scenario tabs" variant="scrollable" scrollButtons="auto">
            <Tab icon={<Timeline />} iconPosition="start" label={t('scenarios.tabs.timeline')} />
            <Tab icon={<MapIcon />} iconPosition="start" label={t('scenarios.tabs.map')} />
            <Tab icon={<Groups />} iconPosition="start" label={t('scenarios.tabs.units')} />
            <Tab icon={<Schedule />} iconPosition="start" label={t('scenarios.tabs.phases')} />
            <Tab icon={<Terrain />} iconPosition="start" label={t('scenarios.tabs.environment')} />
            <Tab icon={<BarChart />} iconPosition="start" label={t('scenarios.tabs.analysis')} />
            <Tab icon={<Settings />} iconPosition="start" label={t('scenarios.tabs.settings')} />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6">
            {t('scenarios.timeline.title')}
          </Typography>
          {/* بخش خط زمانی رویدادها */}
          <Box>
            {/* خط زمانی رویدادها اینجا قرار می‌گیرد */}
            <Typography variant="body1">
              {t('scenarios.timeline.description')}
            </Typography>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6">
            {t('scenarios.map.title')}
          </Typography>
          {/* بخش نقشه سناریو */}
          <Box>
            {/* نقشه اینجا قرار می‌گیرد */}
            <Typography variant="body1">
              {t('scenarios.map.description')}
            </Typography>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6">
            {t('scenarios.units.title')}
          </Typography>
          {/* بخش واحدهای سناریو */}
          <Box>
            {/* لیست واحدها اینجا قرار می‌گیرد */}
            <Typography variant="body1">
              {t('scenarios.units.description')}
            </Typography>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <ScenarioPhasesManager scenario={scenario} />
        </TabPanel>
        
        <TabPanel value={tabValue} index={4}>
          <EnvironmentalConditionsManager scenario={scenario} />
        </TabPanel>
        
        <TabPanel value={tabValue} index={5}>
          <ScenarioAnalysis scenario={scenario} />
        </TabPanel>
        
        <TabPanel value={tabValue} index={6}>
          <Typography variant="h6">
            {t('scenarios.settings.title')}
          </Typography>
          {/* بخش تنظیمات سناریو */}
          <Box>
            {/* تنظیمات اینجا قرار می‌گیرد */}
            <Typography variant="body1">
              {t('scenarios.settings.description')}
            </Typography>
          </Box>
        </TabPanel>
      </Box>
      
      {/* دیالوگ ویرایش سناریو */}
      <ScenarioDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        scenario={scenario}
        onSave={(updatedScenario) => {
          // ویرایش سناریو
          setEditDialogOpen(false);
        }}
      />
      
      {/* دیالوگ تأیید حذف */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>{t('scenarios.deleteDialog.title')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('scenarios.deleteDialog.message', { name: scenario.name })}
            <br />
            {t('scenarios.deleteDialog.warning')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>{t('scenarios.deleteDialog.cancelButton')}</Button>
          <Button 
            onClick={() => {
              setDeleteConfirmOpen(false);
              // حذف سناریو و بازگشت به لیست
            }} 
            color="error" 
            variant="contained"
          >
            {t('scenarios.deleteDialog.confirmButton')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScenarioDetailPage; 