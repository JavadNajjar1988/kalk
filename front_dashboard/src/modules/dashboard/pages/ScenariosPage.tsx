import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
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
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/store';
import { 
  fetchScenarios, 
  createScenario, 
  updateScenario, 
  deleteScenario,
  selectScenarios, 
  selectScenariosLoading,
  selectScenariosError 
} from '@/store/slices/scenariosSlice';
import { selectUser } from '@/store/slices/authSlice';
import { showSuccessNotification, showErrorNotification } from '@/store/slices/uiSlice';
import type { Scenario, ScenarioStatus } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { useNavigate } from 'react-router-dom';

// انواع وضعیت سناریو
const getStatusOptions = (t: (key: string) => string): { value: ScenarioStatus; label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }[] => [
  { value: 'draft', label: t('scenarios.status.draft'), color: 'default' },
  { value: 'active', label: t('scenarios.status.active'), color: 'success' },
  { value: 'paused', label: t('scenarios.status.paused'), color: 'warning' },
  { value: 'completed', label: t('scenarios.status.completed'), color: 'info' },
];

// کامپوننت آمار سناریوها
const ScenarioStats: React.FC<{ scenarios: Scenario[] }> = ({ scenarios }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const stats = {
    total: scenarios.length,
    active: scenarios.filter(s => s.status === 'active').length,
    completed: scenarios.filter(s => s.status === 'completed').length,
    draft: scenarios.filter(s => s.status === 'draft').length,
  };

  const statCards = [
    { title: t('scenarios.stats.total'), value: stats.total, icon: <Assignment />, color: 'primary' },
    { title: t('scenarios.stats.active'), value: stats.active, icon: <PlayArrow />, color: 'success' },
    { title: t('scenarios.stats.completed'), value: stats.completed, icon: <CheckCircle />, color: 'info' },
    { title: t('scenarios.stats.draft'), value: stats.draft, icon: <Schedule />, color: 'warning' },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {statCards.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                    {stat.value}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: `${stat.color}.main`, width: 48, height: 48 }}>
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
  onSave 
}) => {
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
        startTime: scenario.startTime ? new Date(scenario.startTime).toISOString().slice(0, 16) : '',
        endTime: scenario.endTime ? new Date(scenario.endTime).toISOString().slice(0, 16) : '',
        objectives: scenario.objectives?.join('\n') || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'draft',
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
      startTime: formData.startTime ? new Date(formData.startTime).toISOString() : undefined,
      endTime: formData.endTime ? new Date(formData.endTime).toISOString() : undefined,
      objectives: formData.objectives.split('\n').filter(obj => obj.trim()),
    };

    if (scenario) {
      scenarioData.id = scenario.id;
    }

    onSave(scenarioData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {scenario ? t('scenarios.dialog.editTitle') : t('scenarios.dialog.createTitle')}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label={t('scenarios.dialog.nameLabel')}
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                  setFormData(prev => ({ ...prev, status: e.target.value as ScenarioStatus }))
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
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('scenarios.dialog.startTimeLabel')}
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('scenarios.dialog.endTimeLabel')}
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('scenarios.dialog.objectivesLabel')}
              multiline
              rows={4}
              value={formData.objectives}
              onChange={(e) => setFormData(prev => ({ ...prev, objectives: e.target.value }))}
              placeholder={t('scenarios.dialog.objectivesPlaceholder')}
              helperText={t('scenarios.dialog.objectivesHelper')}
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>{t('scenarios.dialog.cancelButton')}</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={!formData.name.trim()}
        >
          {scenario ? t('scenarios.dialog.saveButton') : t('scenarios.dialog.createButton')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// کامپوننت اصلی صفحه سناریوها
const ScenariosPage: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const statusOptions = getStatusOptions(t);
  const user = useAppSelector(selectUser);
  const scenarios = useAppSelector(selectScenarios);
  const loading = useAppSelector(selectScenariosLoading);
  const error = useAppSelector(selectScenariosError);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ScenarioStatus | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | undefined>();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuScenario, setMenuScenario] = useState<Scenario | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // بارگذاری اولیه
  useEffect(() => {
    dispatch(fetchScenarios());
  }, [dispatch]);

  // فیلتر کردن سناریوها
  const filteredScenarios = scenarios.filter(scenario => {
    const matchesSearch = scenario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scenario.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || scenario.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // عملیات CRUD
  const handleCreateScenario = (scenarioData: Partial<Scenario>) => {
    dispatch(createScenario(scenarioData))
      .unwrap()
      .then(() => {
        setDialogOpen(false);
        dispatch(showSuccessNotification(t('scenarios.notifications.createSuccess')));
      })
      .catch(() => {
        dispatch(showErrorNotification(t('scenarios.notifications.createError')));
      });
  };

  const handleUpdateScenario = (scenarioData: Partial<Scenario>) => {
    if (scenarioData.id) {
      dispatch(updateScenario({ id: scenarioData.id, updates: scenarioData }))
        .unwrap()
        .then(() => {
          setDialogOpen(false);
          setSelectedScenario(undefined);
          dispatch(showSuccessNotification(t('scenarios.notifications.updateSuccess')));
        })
        .catch(() => {
          dispatch(showErrorNotification(t('scenarios.notifications.updateError')));
        });
    }
  };

  const handleDeleteScenario = () => {
    if (menuScenario) {
      dispatch(deleteScenario(menuScenario.id))
        .unwrap()
        .then(() => {
          setDeleteConfirmOpen(false);
          setMenuScenario(null);
          dispatch(showSuccessNotification(t('scenarios.notifications.deleteSuccess')));
        })
        .catch(() => {
          dispatch(showErrorNotification(t('scenarios.notifications.deleteError')));
        });
    }
  };

  // مدیریت منو
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, scenario: Scenario) => {
    setMenuAnchor(event.currentTarget);
    setMenuScenario(scenario);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuScenario(null);
  };

  // دریافت رنگ وضعیت
  const getStatusChip = (status: ScenarioStatus) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return (
      <Chip
        label={statusOption?.label || status}
        color={statusOption?.color || 'default'}
        size="small"
      />
    );
  };

  // مشاهده جزئیات سناریو
  const handleViewScenarioDetails = (scenarioId: string) => {
    navigate(`/dashboard/scenarios/${scenarioId}`);
  };

  const canEdit = user?.role === 'admin' || user?.role === 'commander';

  return (
    <Box sx={{ p: 4 }}>
      {/* هدر صفحه */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
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
      <ScenarioStats scenarios={scenarios} />

      {/* نوار ابزار */}
      <Card sx={{ mb: 3 }}>
        <Toolbar>
          <TextField
            size="small"
            placeholder={t('scenarios.toolbar.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
              onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value as ScenarioStatus | 'all')}
            >
              <MenuItem value="all">{t('scenarios.toolbar.allStatuses')}</MenuItem>
              {statusOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ flexGrow: 1 }} />

          {canEdit && (
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
          )}
        </Toolbar>
      </Card>

      {/* جدول سناریوها */}
      <Card>
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
                <TableCell align="center">{t('scenarios.table.actions')}</TableCell>
              </TableRow>
            </TableHead>
            
            <TableBody>
              {filteredScenarios.map((scenario) => (
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
                            color: 'primary.main'
                          }
                        }}
                        onClick={() => handleViewScenarioDetails(scenario.id)}
                      >
                        {scenario.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {scenario.description}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    {getStatusChip(scenario.status)}
                  </TableCell>
                  
                  <TableCell>
                    {scenario.startTime ? 
                      new Date(scenario.startTime).toLocaleDateString('fa-IR') : 
                      '---'
                    }
                  </TableCell>
                  
                  <TableCell>
                    {scenario.endTime ? 
                      new Date(scenario.endTime).toLocaleDateString('fa-IR') : 
                      '---'
                    }
                  </TableCell>
                  
                  <TableCell>
                    {scenario.objectives?.length || 0}
                  </TableCell>
                  
                  <TableCell align="center">
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, scenario)}
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
                    <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                      <Assignment sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                      <Typography variant="body1">
                        {searchTerm || statusFilter !== 'all' ? 
                          t('scenarios.table.noMatch') : 
                          t('scenarios.table.noScenarios')
                        }
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* منوی عملیات */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (menuScenario) {
            handleViewScenarioDetails(menuScenario.id);
          }
          handleMenuClose();
        }}>
          <Visibility sx={{ mr: 1 }} />
          {t('scenarios.menu.viewDetails')}
        </MenuItem>
        
        <MenuItem onClick={() => {
          if (menuScenario) {
            // Handle execute action
            console.log('Execute scenario', menuScenario.id);
          }
          handleMenuClose();
        }}>
          <PlayArrow sx={{ mr: 1 }} />
          اجرا
        </MenuItem>
        
        <MenuItem onClick={() => {
          if (menuScenario) {
            // Handle copy action
            console.log('Copy scenario', menuScenario.id);
          }
          handleMenuClose();
        }}>
          <ContentCopy sx={{ mr: 1 }} />
          کپی
        </MenuItem>
        
        <MenuItem 
          onClick={() => {
            setDeleteConfirmOpen(true);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Delete sx={{ mr: 1 }} />
          حذف
        </MenuItem>
        
        {canEdit && (
          <MenuItem onClick={() => {
            setSelectedScenario(menuScenario || undefined);
            setDialogOpen(true);
            handleMenuClose();
          }}>
            <Edit sx={{ mr: 1 }} />
            {t('scenarios.menu.edit')}
          </MenuItem>
        )}

      </Menu>

      {/* دیالوگ ایجاد/ویرایش */}
      <ScenarioDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedScenario(undefined);
        }}
        scenario={selectedScenario}
        onSave={selectedScenario ? handleUpdateScenario : handleCreateScenario}
      />

      {/* دیالوگ تأیید حذف */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>{t('scenarios.deleteDialog.title')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('scenarios.deleteDialog.message', { name: menuScenario?.name })}
            <br />
            {t('scenarios.deleteDialog.warning')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>{t('scenarios.deleteDialog.cancelButton')}</Button>
          <Button onClick={handleDeleteScenario} color="error" variant="contained">
            {t('scenarios.deleteDialog.confirmButton')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScenariosPage; 