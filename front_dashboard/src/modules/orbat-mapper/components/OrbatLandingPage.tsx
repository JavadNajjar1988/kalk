import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Chip,
  Badge,
  Menu,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  CircularProgress,
  Alert,
  Avatar,
  Tooltip,
  useTheme,
  alpha,
  Fade,
} from '@mui/material';
import { 
  CheckCircle as CheckIcon,
  Add as AddIcon,
  Upload as UploadIcon,
  Link as LinkIcon,
  Sort as SortIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  FileCopy as CopyIcon,
  OpenInNew as OpenIcon,
  PlayArrow as PlayIcon,
  MilitaryTech as MilitaryTechIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { 
  fetchScenarios, 
  deleteScenario,
  createScenario
} from '@/store/slices/scenariosSlice';
import { RootState } from '@/store';
import { showSuccessNotification, showErrorNotification } from '@/store/slices/uiSlice';
import NewScenarioModal, { type ScenarioFormData } from './NewScenarioModal';
import FarsiTypography from '@/components/common/FarsiTypography';

// Demo scenarios data
const DEMO_SCENARIOS = [
  {
    name: "جنگ فالکلند ۱۹۸۲",
    id: "falkland82",
    summary: "جنگ فالکلند یک درگیری نظامی بود که در سال ۱۹۸۲ بین آرژانتین و بریتانیا رخ داد. آرژانتین در ۲ آوریل ۱۹۸۲ به جزایر فالکلند حمله کرد و بریتانیا با اعزام نیروی ویژه برای بازپس‌گیری جزایر پاسخ داد.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8b/HMS_Broadsword_and_Hermes%2C_1982_%28IWM%29.jpg",
  },
  {
    name: "نبردهای نارویک ۱۹۴۰",
    id: "narvik40",
    summary: "مجموعه‌ای از درگیری‌های دریایی و زمینی بین نیروهای آلمان و متفقین از آوریل تا ژوئن ۱۹۴۰. این نبردها اولین پیروزی متفقین علیه آلمان در جنگ بود.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Norwegian_Army_Colt_heavy_machine_gun_at_the_Narvik_front.jpg",
  },
];

const OrbatLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  
  // Redux state
  const scenarios = useAppSelector((state: RootState) => state.scenarios.scenarios);
  const loading = useAppSelector((state: RootState) => state.scenarios.isLoading);
  const error = useAppSelector((state: RootState) => state.scenarios.error);
  
  // Local state
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
  const [scenarioMenuAnchor, setScenarioMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [sortBy, setSortBy] = useState('lastModified');
  const [loadUrlDialog, setLoadUrlDialog] = useState(false);
  const [scenarioUrl, setScenarioUrl] = useState('');
  const [newScenarioModalOpen, setNewScenarioModalOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load scenarios on component mount
  useEffect(() => {
    dispatch(fetchScenarios());
  }, [dispatch]);
  
  const handleCreateScenario = async (formData: ScenarioFormData) => {
    try {
      // Transform form data to match API service expectations
      const scenarioData = {
        ...formData,
        startTime: formData.startTime instanceof Date 
          ? formData.startTime.toISOString() 
          : formData.startTime
      };
      
      const result = await dispatch(createScenario(scenarioData)).unwrap();
      setNewScenarioModalOpen(false); // Close the modal
      dispatch(showSuccessNotification(`سناریو "${result.name}" با موفقیت ایجاد شد`));
      navigate(`/dashboard/orbat-mapper/scenario/${result.id}`);
    } catch (error) {
      dispatch(showErrorNotification('خطا در ایجاد سناریو'));
    }
  };
  
  const handleDeleteScenario = async (scenarioId: string) => {
    try {
      await dispatch(deleteScenario(scenarioId)).unwrap();
      dispatch(showSuccessNotification('سناریو با موفقیت حذف شد'));
    } catch (error) {
      dispatch(showErrorNotification('خطا در حذف سناریو'));
    }
  };
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setUploadLoading(true);
    
    try {
      const fileText = await file.text();
      let scenarioData;
      
      // Parse JSON or GeoJSON files
      try {
        scenarioData = JSON.parse(fileText);
      } catch (parseError) {
        throw new Error('فایل باید در فرمت JSON یا GeoJSON باشد');
      }
      
      // Validate basic scenario structure
      if (!scenarioData.name) {
        scenarioData.name = file.name.replace(/\.[^/.]+$/, '') || 'سناریوی وارد شده';
      }
      
      if (!scenarioData.description) {
        scenarioData.description = `سناریوی وارد شده از فایل ${file.name}`;
      }
      
      // Convert to API format
      const formattedScenario = {
        name: scenarioData.name,
        description: scenarioData.description,
        startTime: scenarioData.startTime || new Date().toISOString(),
        units: scenarioData.units || [],
        sides: scenarioData.sides || [],
        events: scenarioData.events || [],
        objectives: scenarioData.objectives || []
      };
      
      const result = await dispatch(createScenario(formattedScenario)).unwrap();
      dispatch(showSuccessNotification(`سناریو "${result.name}" با موفقیت از فایل بارگذاری شد`));
      navigate(`/dashboard/orbat-mapper/scenario/${result.id}`);
      
    } catch (error: any) {
      dispatch(showErrorNotification(error.message || 'خطا در بارگذاری فایل'));
    } finally {
      setUploadLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleUrlLoad = async () => {
    if (!scenarioUrl.trim()) {
      dispatch(showErrorNotification('لطفاً آدرس URL را وارد کنید'));
      return;
    }
    
    setUploadLoading(true);
    
    try {
      const response = await fetch(scenarioUrl);
      
      if (!response.ok) {
        throw new Error(`خطا در دریافت فایل: ${response.status} ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('فایل باید در فرمت JSON باشد');
      }
      
      const scenarioData = await response.json();
      
      // Validate and format scenario data
      if (!scenarioData.name) {
        const urlPath = new URL(scenarioUrl).pathname;
        const filename = urlPath.split('/').pop() || 'سناریوی دانلود شده';
        scenarioData.name = filename.replace(/\.[^/.]+$/, '');
      }
      
      if (!scenarioData.description) {
        scenarioData.description = `سناریوی دانلود شده از ${scenarioUrl}`;
      }
      
      const formattedScenario = {
        name: scenarioData.name,
        description: scenarioData.description,
        startTime: scenarioData.startTime || new Date().toISOString(),
        units: scenarioData.units || [],
        sides: scenarioData.sides || [],
        events: scenarioData.events || [],
        objectives: scenarioData.objectives || []
      };
      
      const result = await dispatch(createScenario(formattedScenario)).unwrap();
      dispatch(showSuccessNotification(`سناریو "${result.name}" با موفقیت دانلود شد`));
      setScenarioUrl('');
      setLoadUrlDialog(false);
      navigate(`/dashboard/orbat-mapper/scenario/${result.id}`);
      
    } catch (error: any) {
      dispatch(showErrorNotification(error.message || 'خطا در دانلود سناریو از URL'));
    } finally {
      setUploadLoading(false);
    }
  };
  
  const handleDownloadScenario = async (scenario: any) => {
    try {
      const dataStr = JSON.stringify(scenario, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${scenario.name}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      dispatch(showSuccessNotification(`سناریو "${scenario.name}" دانلود شد`));
    } catch (error) {
      dispatch(showErrorNotification('خطا در دانلود سناریو'));
    }
  };
  
  const handleCopyScenario = async (scenario: any) => {
    try {
      const copiedScenario = {
        ...scenario,
        name: `${scenario.name} (کپی)`,
        id: undefined // Remove ID so a new one gets generated
      };
      
      const result = await dispatch(createScenario(copiedScenario)).unwrap();
      dispatch(showSuccessNotification(`کپی سناریو "${result.name}" ایجاد شد`));
    } catch (error) {
      dispatch(showErrorNotification('خطا در کپی‌برداری سناریو'));
    }
  };
  
  const sortedScenarios = [...scenarios].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'lastModified':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {/* Stats Section */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          {
            title: 'سناریوهای فعال',
            value: scenarios.length || 0,
            icon: <AssignmentIcon />,
            color: 'primary',
            subtitle: `${scenarios.filter(s => s.status === 'active').length} در حال اجرا`
          },
          {
            title: 'نبردهای تاریخی',
            value: DEMO_SCENARIOS.length,
            icon: <HistoryIcon />,
            color: 'secondary',
            subtitle: 'آماده بررسی'
          },
          {
            title: 'نیروها',
            value: 245,
            icon: <MilitaryTechIcon />,
            color: 'success',
            subtitle: 'واحد در دسترس'
          },
          {
            title: 'عملیات',
            value: 8,
            icon: <TrendingUpIcon />,
            color: 'warning',
            subtitle: 'در حال انجام'
          }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{
              background: theme.palette.mode === 'dark' 
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.93)}, ${alpha(theme.palette.background.paper, 0.8)})`
                : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              backdropFilter: 'blur(10px)',
              borderRadius: `${theme.shape.borderRadius * 1.2}px`,
              boxShadow: theme.palette.mode === 'dark' 
                ? `0 2px 10px 0 ${alpha(theme.palette.common.black, 0.18)}`
                : '0 2px 10px 0 rgba(0,0,0,0.07)',
              border: theme.palette.mode === 'dark' 
                ? `1px solid ${alpha(theme.palette.divider, 0.18)}`
                : '1px solid #e3e8ef',
              '&:hover': {
                transform: 'translateY(-2px) scale(1.01)',
                boxShadow: theme.palette.mode === 'dark' 
                  ? `0 4px 18px 0 ${alpha(theme.palette.common.black, 0.22)}`
                  : '0 4px 18px 0 rgba(0,0,0,0.10)',
                transition: 'all 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              },
              transition: 'all 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary" variant="body2" sx={{ fontSize: '0.85rem' }}>
                    {stat.title}
                  </Typography>
                  <Avatar sx={{ 
                    bgcolor: `${stat.color}.main`, 
                    width: 36, 
                    height: 36,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                  }}>
                    {React.cloneElement(stat.icon, { sx: { fontSize: '1.2rem' } })}
                  </Avatar>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {stat.value.toLocaleString('fa-IR')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stat.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Hero Section */}
      <Paper sx={{
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.85)})`
          : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: `${theme.shape.borderRadius * 1.5}px`,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        p: 6,
        mb: 4,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
          borderRadius: 'inherit',
        }
      }}>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography 
            variant="h2" 
            component="h1" 
            sx={{ 
              fontWeight: 'bold',
              mb: 3,
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            کالک نگار
          </Typography>
          
          <Typography 
            variant="h5" 
            color="text.secondary"
            sx={{ 
              maxWidth: '600px',
              mx: 'auto',
              mb: 4,
              fontSize: { xs: '1.1rem', sm: '1.3rem' },
              lineHeight: 1.6
            }}
          >
            ابزار پیشرفته تحلیل و شبیه‌سازی عملیات نظامی
          </Typography>

          <Button 
            variant="contained" 
            size="large"
            onClick={() => setNewScenarioModalOpen(true)}
            startIcon={<PlayIcon />}
            sx={{ 
              px: 4, 
              py: 1.5,
              borderRadius: `${theme.shape.borderRadius}px`,
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`,
              '&:hover': {
                boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.45)}`,
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease'
            }}
          >
            شروع سناریوی جدید
          </Button>
        </Box>
      </Paper>

      {/* Recent Scenarios Section */}
      {sortedScenarios.length > 0 && (
        <Paper sx={{
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.85)})`
            : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: `${theme.shape.borderRadius * 1.5}px`,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          p: 3,
          mb: 4,
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 3
          }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              سناریوهای اخیر
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton 
                onClick={(e) => setSortMenuAnchor(e.currentTarget)}
                size="small"
              >
                <SortIcon />
              </IconButton>
              <Button 
                variant="contained" 
                size="small"
                onClick={() => setNewScenarioModalOpen(true)}
              >
                ایجاد سناریوی جدید
              </Button>
            </Box>
          </Box>
          
          <Grid container spacing={2}>
            {sortedScenarios.map((scenario) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={scenario.id}>
                <Card sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  background: theme.palette.mode === 'dark'
                    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.6)})`
                    : 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
                  '&:hover': { 
                    boxShadow: 4,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease'
                  }
                }}>
                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {scenario.name}
                      </Typography>
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          setSelectedScenario(scenario);
                          setScenarioMenuAnchor(e.currentTarget);
                        }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {scenario.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      آخرین تغییر: {new Date(scenario.updatedAt).toLocaleDateString('fa-IR')}
                    </Typography>
                  </CardContent>
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      size="small"
                      onClick={() => navigate(`/dashboard/orbat-mapper/scenario/${scenario.id}`)}
                    >
                      باز کردن
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Demo Scenarios and Action Cards */}
      <Paper sx={{
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.85)})`
          : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: `${theme.shape.borderRadius * 1.5}px`,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        p: 3,
      }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
          سناریوهای نمونه و ابزارها
        </Typography>
        
        <Grid container spacing={3}>
          {/* Demo Scenarios */}
          {DEMO_SCENARIOS.map((scenario) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={scenario.id}>
              <Card sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                background: theme.palette.mode === 'dark'
                  ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.6)})`
                  : 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
                '&:hover': { 
                  boxShadow: 6,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s'
                }
              }}
              onClick={() => navigate(`/dashboard/orbat-mapper/scenario/${scenario.id}`)}
              >
                <Box
                  component="img"
                  src={scenario.imageUrl}
                  alt={scenario.name}
                  sx={{
                    height: 200,
                    objectFit: 'cover',
                    bgcolor: 'grey.900'
                  }}
                />
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
                    {scenario.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {scenario.summary}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
          
          {/* Create New Scenario Card */}
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Card sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              border: '2px dashed',
              borderColor: 'grey.300',
              bgcolor: 'transparent',
              cursor: 'pointer',
              '&:hover': { 
                borderColor: 'grey.400',
                bgcolor: alpha(theme.palette.action.hover, 0.05)
              }
            }}
            onClick={() => setNewScenarioModalOpen(true)}
            >
              <CardContent sx={{ 
                flexGrow: 1, 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 6
              }}>
                <AddIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ textAlign: 'center' }}>
                  ایجاد سناریوی جدید
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Load from File Card */}
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Card sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              opacity: uploadLoading ? 0.7 : 1,
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.6)})`
                : 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
              '&:hover': { boxShadow: 4 }
            }}>
              <CardContent sx={{ 
                flexGrow: 1, 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 4
              }}>
                {uploadLoading ? (
                  <CircularProgress sx={{ mb: 2 }} />
                ) : (
                  <UploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                )}
                <Typography variant="h6" sx={{ textAlign: 'center', mb: 2 }}>
                  بارگذاری از فایل
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
                  فایل سناریو را از کامپیوتر خود انتخاب کنید
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={() => fileInputRef.current?.click()}
                  startIcon={uploadLoading ? null : <UploadIcon />}
                  disabled={uploadLoading}
                >
                  {uploadLoading ? 'در حال بارگذاری...' : 'انتخاب فایل'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.geojson"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </CardContent>
            </Card>
          </Grid>
          
          {/* Load from URL Card */}
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Card sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              opacity: uploadLoading ? 0.7 : 1,
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.6)})`
                : 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
              '&:hover': { boxShadow: 4 }
            }}>
              <CardContent sx={{ 
                flexGrow: 1, 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 4
              }}>
                {uploadLoading ? (
                  <CircularProgress sx={{ mb: 2 }} />
                ) : (
                  <LinkIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 2 }} />
                )}
                <Typography variant="h6" sx={{ textAlign: 'center', mb: 2 }}>
                  بارگذاری از URL
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
                  سناریو را از یک آدرس اینترنتی بارگذاری کنید
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={() => setLoadUrlDialog(true)}
                  startIcon={uploadLoading ? null : <LinkIcon />}
                  disabled={uploadLoading}
                >
                  {uploadLoading ? 'در حال بارگذاری...' : 'وارد کردن URL'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={() => setSortMenuAnchor(null)}
      >
        <MenuItem 
          onClick={() => {
            setSortBy('name');
            setSortMenuAnchor(null);
          }}
          selected={sortBy === 'name'}
        >
          نام
        </MenuItem>
        <MenuItem 
          onClick={() => {
            setSortBy('lastModified');
            setSortMenuAnchor(null);
          }}
          selected={sortBy === 'lastModified'}
        >
          آخرین تغییر
        </MenuItem>
        <MenuItem 
          onClick={() => {
            setSortBy('created');
            setSortMenuAnchor(null);
          }}
          selected={sortBy === 'created'}
        >
          ایجاد شده
        </MenuItem>
      </Menu>
      
      {/* Scenario Actions Menu */}
      <Menu
        anchorEl={scenarioMenuAnchor}
        open={Boolean(scenarioMenuAnchor)}
        onClose={() => setScenarioMenuAnchor(null)}
      >
        <MenuItem 
          onClick={() => {
            navigate(`/dashboard/orbat-mapper/scenario/${selectedScenario?.id}`);
            setScenarioMenuAnchor(null);
          }}
        >
          <ListItemIcon><OpenIcon fontSize="small" /></ListItemIcon>
          <ListItemText>باز کردن</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => {
            handleDownloadScenario(selectedScenario);
            setScenarioMenuAnchor(null);
          }}
        >
          <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
          <ListItemText>دانلود</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => {
            handleCopyScenario(selectedScenario);
            setScenarioMenuAnchor(null);
          }}
        >
          <ListItemIcon><CopyIcon fontSize="small" /></ListItemIcon>
          <ListItemText>کپی‌برداری</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => {
            if (confirm(`آیا مطمئن هستید که می‌خواهید سناریوی “${selectedScenario?.name}” را برای همیشه حذف کنید؟`)) {
              handleDeleteScenario(selectedScenario?.id);
            }
            setScenarioMenuAnchor(null);
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>حذف</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Load URL Dialog */}
      <Dialog open={loadUrlDialog} onClose={() => setLoadUrlDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>بارگذاری سناریو از URL</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="آدرس URL سناریو"
            type="url"
            fullWidth
            variant="outlined"
            value={scenarioUrl}
            onChange={(e) => setScenarioUrl(e.target.value)}
            placeholder="https://example.com/scenario.json"
            disabled={uploadLoading}
          />
          {uploadLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                در حال دانلود...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoadUrlDialog(false)} disabled={uploadLoading}>انصراف</Button>
          <Button 
            onClick={handleUrlLoad}
            variant="contained"
            disabled={uploadLoading || !scenarioUrl.trim()}
          >
            {uploadLoading ? 'در حال بارگذاری...' : 'بارگذاری'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* New Scenario Modal */}
      <NewScenarioModal
        open={newScenarioModalOpen}
        onClose={() => setNewScenarioModalOpen(false)}
        onCreateScenario={handleCreateScenario}
      />
    </Box>
  );
};

export default OrbatLandingPage;