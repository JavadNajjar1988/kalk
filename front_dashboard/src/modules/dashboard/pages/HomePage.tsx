import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Paper,
  IconButton,
  Fab,
  Tooltip,
  alpha,
  useTheme,
  Divider,
  Alert,
  LinearProgress,
  Collapse,
  Fade,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Map as MapIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  TrendingUp,
  Notifications,
  Add,
  MoreVert,
  Refresh,
  Settings,
  DeleteOutline,
  Archive,
  Star,
  Schedule,
  LocationOn,
  Group,
  Security,
  FormatQuote,
  CalendarToday,
  Work,
  CheckCircle,
  Warning,
  AdminPanelSettings,
  Engineering,
  Visibility,
  Public,
  ExpandMore,
  Radar as RadarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store';
import { selectUser } from '@/store/slices/authSlice';
import { selectScenarios, fetchScenarios } from '@/store/slices/scenariosSlice';
import { addNotification } from '@/store/slices/uiSlice';
import { getRandomQuote } from '@/config/quotes';
import { getRandomMartyr } from '@/config/martyrs';
import { convertToFarsiNumber } from '@/utils/numberUtils';
import FarsiTypography from '@/components/common/FarsiTypography';
import FarsiNumber from '@/components/common/FarsiNumber';
import { useTranslation } from '@/hooks/useTranslation';

// تایپ‌های مورد نیاز برای کارت‌های آماری
interface StatItem {
  title: string;
  value: number;
  icon: React.ReactElement;
  color: string;
  gradient: string;
  subtitle?: string;
}

// کامپوننت کارت‌های آماری
const DashboardStats: React.FC = () => {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const user = useAppSelector(selectUser);
  const scenarios = useAppSelector(selectScenarios);
  const theme = useTheme();
  const { t } = useTranslation();

  const handleCardExpand = (cardTitle: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardTitle]: !prev[cardTitle]
    }));
  };

  // داده‌های نمونه برای کارت‌های آماری
  const mockUsers = [
    { isActive: true, nationality: 'iranian', role: 'admin', lastLogin: new Date() },
    { isActive: true, nationality: 'iranian', role: 'commander', lastLogin: new Date() },
    { isActive: false, nationality: 'non-iranian', role: 'operator', lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { isActive: true, nationality: 'iranian', role: 'viewer', lastLogin: new Date() },
    { isActive: true, nationality: 'iranian', role: 'operator', lastLogin: new Date() },
    { isActive: false, nationality: 'iranian', role: 'viewer', lastLogin: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    { isActive: true, nationality: 'non-iranian', role: 'commander', lastLogin: new Date() },
    { isActive: true, nationality: 'iranian', role: 'operator', lastLogin: new Date() },
  ];

  // محاسبه آمار سناریوها
  const scenarioStats = useMemo(() => {
    const total = scenarios.length;
    const activeCount = scenarios.filter(s => s.status === 'active').length;
    const inactiveCount = total - activeCount;
    const activePercent = total > 0 ? Math.round((activeCount / total) * 100) : 0;
    const inactivePercent = total > 0 ? 100 - activePercent : 0;
    
    return {
      total,
      activeCount,
      inactiveCount,
      activePercent,
      inactivePercent
    };
  }, [scenarios]);

  // محاسبه آمار نیروها
  const forceStats = useMemo(() => {
    const total = mockUsers.length;
    const iranianCount = mockUsers.filter(u => u.nationality === 'iranian').length;
    const foreignCount = total - iranianCount;
    const iranianPercent = total > 0 ? Math.round((iranianCount / total) * 100) : 0;
    const foreignPercent = total > 0 ? 100 - iranianPercent : 0;
    
    return {
      total,
      iranianCount,
      foreignCount,
      iranianPercent,
      foreignPercent
    };
  }, [mockUsers]);

  // تعریف داده‌های نمونه برای عملیات‌ها
  const mockOperations = [
    { role: 'commander', count: 3 },
    { role: 'operator', count: 4 },
    { role: 'viewer', count: 1 },
  ];
  
  // محاسبه آمار عملیات‌ها
  const operationStats = useMemo(() => {
    const total = mockOperations.reduce((sum, op) => sum + op.count, 0);
    const commanderCount = mockOperations.find(op => op.role === 'commander')?.count || 0;
    const operatorCount = mockOperations.find(op => op.role === 'operator')?.count || 0;
    const viewerCount = mockOperations.find(op => op.role === 'viewer')?.count || 0;
    
    return {
      total,
      commanderCount,
      operatorCount,
      viewerCount
    };
  }, [mockOperations]);
  
  // تعریف داده‌های نمونه برای هشدارهای امنیتی
  const mockAlerts = [
    { id: '1', severity: 'critical', timestamp: '2024-07-29T10:30:00Z', acknowledged: false },
    { id: '2', severity: 'high', timestamp: '2024-07-29T09:15:00Z', acknowledged: false },
    { id: '3', severity: 'high', timestamp: '2024-07-28T14:00:00Z', acknowledged: true },
    { id: '4', severity: 'medium', timestamp: '2024-07-28T22:05:00Z', acknowledged: true },
    { id: '5', severity: 'low', timestamp: '2024-07-29T11:00:00Z', acknowledged: false },
  ];
  
  // محاسبه آمار هشدارهای امنیتی
  const alertStats = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const todayCount = mockAlerts.filter(alert => 
      new Date(alert.timestamp) >= startOfDay
    ).length;
    
    const weekCount = mockAlerts.filter(alert => 
      new Date(alert.timestamp) >= startOfWeek
    ).length;
    
    const monthCount = mockAlerts.filter(alert => 
      new Date(alert.timestamp) >= startOfMonth
    ).length;
    
    const total = mockAlerts.length;
    const todayPercent = total > 0 ? Math.round((todayCount / total) * 100) : 0;
    
    return {
      total,
      todayCount,
      weekCount,
      monthCount,
      todayPercent
    };
  }, [mockAlerts]);

  const stats: StatItem[] = [
    {
      title: t('dashboard.stats.activeScenarios'),
      value: scenarioStats.total,
      icon: <AssignmentIcon />,
      color: 'warning',
      gradient: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
      subtitle: t('dashboard.stats.activeScenariosSubtitle', { 
        activePercent: scenarioStats.activePercent.toLocaleString('fa-IR'), 
        inactiveCount: scenarioStats.inactiveCount.toLocaleString('fa-IR') 
      }),
    },
    {
      title: t('dashboard.stats.availableForces'),
      value: forceStats.total,
      icon: <PeopleIcon />,
      color: 'success',
      gradient: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
      subtitle: t('dashboard.stats.availableForcesSubtitle', { 
        iranianPercent: forceStats.iranianPercent.toLocaleString('fa-IR'), 
        foreignPercent: forceStats.foreignPercent.toLocaleString('fa-IR') 
      }),
    },
    {
      title: t('dashboard.stats.ongoingOperations'),
      value: operationStats.total,
      icon: <MapIcon />,
      color: 'error',
      gradient: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
      subtitle: t('dashboard.stats.ongoingOperationsSubtitle', { 
        commanderCount: operationStats.commanderCount.toLocaleString('fa-IR'), 
        operatorCount: operationStats.operatorCount.toLocaleString('fa-IR'), 
        viewerCount: operationStats.viewerCount.toLocaleString('fa-IR') 
      }),
    },
    {
      title: t('dashboard.stats.securityAlerts'),
      value: alertStats.total,
      icon: <Security />,
      color: 'info',
      gradient: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
      subtitle: t('dashboard.stats.securityAlertsSubtitle', { 
        todayPercent: alertStats.todayPercent.toLocaleString('fa-IR'), 
        weekCount: alertStats.weekCount.toLocaleString('fa-IR') 
      }),
    },
  ];

  return (
    <Grid container spacing={1.5} sx={{ mb: 2 }}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card
            sx={{
              background: theme.palette.mode === 'dark' 
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.93)}, ${alpha(theme.palette.background.paper, 0.8)})`
                : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              backdropFilter: 'blur(10px)',
              borderRadius: `${theme.shape.borderRadius * 1.2}px`,
              boxShadow: theme.palette.mode === 'dark' 
                ? `0 2px 10px 0 ${alpha(theme.palette.common.black, 0.18)}, 0 1px 4px 0 ${alpha(theme.palette.primary.dark, 0.06)}`
                : '0 2px 10px 0 rgba(0,0,0,0.07), 0 1px 4px 0 rgba(25,118,210,0.04)',
              border: theme.palette.mode === 'dark' 
                ? `1px solid ${alpha(theme.palette.divider, 0.18)}`
                : '1px solid #e3e8ef',
              '&:hover': {
                transform: 'translateY(-2px) scale(1.01)',
                boxShadow: theme.palette.mode === 'dark' 
                  ? `0 4px 18px 0 ${alpha(theme.palette.common.black, 0.22)}, 0 2px 8px 0 ${alpha(theme.palette.primary.dark, 0.09)}`
                  : '0 4px 18px 0 rgba(0,0,0,0.10), 0 2px 8px 0 rgba(25,118,210,0.07)',
                transition: 'all 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              },
              transition: 'all 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'stretch',
            }}
          >
            <CardContent sx={{ 
              p: 2.5, 
              minHeight: 110, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              ...(stat.title === t('dashboard.stats.ongoingOperations') && {
                '& .MuiTypography-h6': { fontSize: '0.95rem', mb: 0.1 },
                '& .MuiTypography-caption': { fontSize: '0.58rem', mt: 0.1 },
                '& .MuiBox-root': { mt: 0.2, mb: 0.2 },
                '& .bar-chart': { height: 25, minHeight: 25, maxHeight: 25, overflow: 'hidden', mb: 0.5 },
                '& .bar-label': { fontSize: '0.62rem', mt: 0.1 },
              })
            }}>
              {/* Header with icon and title */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    sx={{
                      bgcolor: stat.color === 'warning' && stat.title === t('dashboard.stats.activeScenarios') 
                        ? '#ff9800' // رنگ زرد ثابت
                        : `${stat.color}.main`,
                      width: 36,
                      height: 36,
                      boxShadow: stat.color === 'warning' && stat.title === t('dashboard.stats.activeScenarios')
                        ? '0 4px 12px #ff980040' // سایه زرد ثابت
                        : `0 4px 12px ${stat.color === 'primary' ? theme.palette.primary.main : stat.color === 'success' ? theme.palette.success.main : stat.color === 'error' ? theme.palette.error.main : theme.palette.info.main}40`,
                      '& svg': {
                        fontSize: '1.1rem',
                      },
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography 
                      color="text.primary" 
                      variant="body2"
                      sx={{ 
                        fontWeight: 700, 
                        fontSize: '0.9rem', 
                        display: 'block',
                        lineHeight: 1.2,
                        mb: 0.5
                      }}
                    >
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
                
                {/* مثلث کشویی */}
                <Box sx={{ textAlign: 'right' }}>
                  <IconButton
                    size="small"
                    onClick={() => handleCardExpand(stat.title)}
                    sx={{
                      color: 'text.secondary',
                      transform: expandedCards[stat.title] ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.action.hover, 0.04),
                      },
                    }}
                  >
                    <ExpandMore />
                  </IconButton>
                </Box>
              </Box>

              {/* Chart section */}
              <Box sx={{ width: '100%', mt: 'auto' }}>
                {/* نمودار سناریوهای فعال */}
                {stat.title === t('dashboard.stats.activeScenarios') && (
                  <Box>
                    <Box sx={{ 
                      height: 8, 
                      borderRadius: 4, 
                      backgroundColor: 'rgba(255, 152, 0, 0.1)', // پس‌زمینه زرد ثابت
                      overflow: 'hidden',
                      position: 'relative',
                      mb: 1,
                    }}>
                      <Box
                        sx={{
                          height: '100%',
                          width: `${scenarioStats.activePercent}%`,
                          background: 'linear-gradient(90deg, #ffb74d, #ff9800, #f57c00)', // گرادیان زرد ثابت
                          borderRadius: 4,
                          position: 'relative',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '50%',
                            background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.2))',
                            borderRadius: '4px 4px 0 0',
                          },
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          color: '#ff9800',
                        }}
                      >
                        <FarsiNumber>{scenarioStats.activePercent}</FarsiNumber>% {t('dashboard.stats.active')}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          color: 'text.secondary',
                        }}
                      >
                        <FarsiNumber>{scenarioStats.inactivePercent}</FarsiNumber>% {t('dashboard.stats.inactive')}
                      </Typography>
                    </Box>
                    
                    {/* محتوای کشویی */}
                    <Collapse in={expandedCards[stat.title]} timeout={400} unmountOnExit appear>
                      <Fade in={expandedCards[stat.title]} timeout={400} appear>
                        <Box sx={{ 
                          mt: 2, 
                          pt: 2, 
                          borderTop: `1px solid ${theme.palette.divider}`,
                          animation: expandedCards[stat.title] ? 'fadeInUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
                          '@keyframes fadeInUp': {
                            from: { opacity: 0, transform: 'translateY(-15px)', visibility: 'hidden' },
                            to: { opacity: 1, transform: 'translateY(0)', visibility: 'visible' },
                          },
                        }}>
                          <Grid container spacing={2}>
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center' }}>
                                <FarsiNumber variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                  {scenarioStats.total}
                                </FarsiNumber>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                  {t('dashboard.stats.totalScenarios')}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center' }}>
                                <FarsiNumber variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                                  {scenarioStats.activeCount}
                                </FarsiNumber>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                  {t('dashboard.stats.active')}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center' }}>
                                <FarsiNumber variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>
                                  {scenarioStats.inactiveCount}
                                </FarsiNumber>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                  {t('dashboard.stats.inactive')}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      </Fade>
                    </Collapse>
                  </Box>
                )}

                {/* نمودار نیروهای موجود */}
                {stat.title === t('dashboard.stats.availableForces') && (
                  <Box>
                    <Box sx={{ 
                      height: 8, 
                      borderRadius: 4, 
                      backgroundColor: alpha(theme.palette.success.main, 0.1),
                      overflow: 'hidden',
                      position: 'relative',
                      mb: 1,
                    }}>
                      <Box
                        sx={{
                          height: '100%',
                          width: `${forceStats.iranianPercent}%`,
                          background: `linear-gradient(90deg, ${alpha(theme.palette.success.main, 0.8)}, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                          borderRadius: 4,
                          position: 'relative',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '50%',
                            background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.2))',
                            borderRadius: '4px 4px 0 0',
                          },
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          color: 'success.main',
                        }}
                      >
                        <FarsiNumber>{forceStats.iranianPercent}</FarsiNumber>% {t('dashboard.stats.iranian')}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          color: 'text.secondary',
                        }}
                      >
                        <FarsiNumber>{forceStats.foreignPercent}</FarsiNumber>% {t('dashboard.stats.foreign')}
                      </Typography>
                    </Box>
                    
                    {/* محتوای کشویی */}
                    <Collapse in={expandedCards[stat.title]} timeout={400} unmountOnExit appear>
                      <Fade in={expandedCards[stat.title]} timeout={400} appear>
                        <Box sx={{ 
                          mt: 2, 
                          pt: 2, 
                          borderTop: `1px solid ${theme.palette.divider}`,
                          animation: expandedCards[stat.title] ? 'fadeInUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
                          '@keyframes fadeInUp': {
                            from: { opacity: 0, transform: 'translateY(-15px)', visibility: 'hidden' },
                            to: { opacity: 1, transform: 'translateY(0)', visibility: 'visible' },
                          },
                        }}>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Box sx={{ textAlign: 'center' }}>
                                <FarsiNumber variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                                  {forceStats.iranianCount}
                                </FarsiNumber>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                  {t('dashboard.stats.iran')}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ textAlign: 'center' }}>
                                <FarsiNumber variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                                  {forceStats.foreignCount}
                                </FarsiNumber>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                  {t('dashboard.stats.otherCountries')}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      </Fade>
                    </Collapse>
                  </Box>
                )}

                {/* نمودار عملیات در حال اجرا */}
                {stat.title === t('dashboard.stats.ongoingOperations') && (
                  <Box>
                    <Box className="bar-chart" sx={{ display: 'flex', gap: 1, alignItems: 'end', height: 25, mb: 0.5, overflow: 'hidden' }}>
                      {[
                        { role: 'commander', color: theme.palette.success.main, gradient: `linear-gradient(180deg, ${theme.palette.success.light}, ${theme.palette.success.main})`, label: t('dashboard.stats.commander'), count: operationStats.commanderCount },
                        { role: 'operator', color: '#2196f3', gradient: `linear-gradient(180deg, #64b5f6, #2196f3)`, label: t('dashboard.stats.operator'), count: operationStats.operatorCount },
                        { role: 'viewer', color: theme.palette.warning.main, gradient: `linear-gradient(180deg, ${theme.palette.warning.light}, ${theme.palette.warning.main})`, label: t('dashboard.stats.viewer'), count: operationStats.viewerCount },
                      ].map(item => {
                        const actualHeight = item.count > 0 ? Math.min(item.count * 6, 18) : 2;
                        return (
                          <Box key={item.role} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: '100%',
                                height: `${actualHeight}px`,
                                background: item.gradient,
                                borderRadius: '4px 4px 0 0',
                                position: 'relative',
                                '&::after': item.count > 0 ? {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  height: '50%',
                                  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.1))',
                                  borderRadius: '4px 4px 0 0',
                                } : {},
                              }}
                            />
                            <Typography className="bar-label" variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                              {item.label}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                    
                    {/* محتوای کشویی */}
                    <Collapse in={expandedCards[stat.title]} timeout={400} unmountOnExit appear>
                      <Fade in={expandedCards[stat.title]} timeout={400} appear>
                        <Box sx={{ 
                          mt: 2, 
                          pt: 2, 
                          borderTop: `1px solid ${theme.palette.divider}`,
                          animation: expandedCards[stat.title] ? 'fadeInUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
                          '@keyframes fadeInUp': {
                            from: { opacity: 0, transform: 'translateY(-15px)', visibility: 'hidden' },
                            to: { opacity: 1, transform: 'translateY(0)', visibility: 'visible' },
                          },
                        }}>
                          <Grid container spacing={2}>
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center' }}>
                                <FarsiNumber variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                                  {operationStats.commanderCount}
                                </FarsiNumber>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                  {t('dashboard.stats.commander')}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center' }}>
                                <FarsiNumber variant="h6" sx={{ fontWeight: 700, color: '#2196f3' }}>
                                  {operationStats.operatorCount}
                                </FarsiNumber>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                  {t('dashboard.stats.operator')}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center' }}>
                                <FarsiNumber variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>
                                  {operationStats.viewerCount}
                                </FarsiNumber>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                  {t('dashboard.stats.viewer')}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      </Fade>
                    </Collapse>
                  </Box>
                )}

                {/* نمودار هشدارهای امنیتی */}
                {stat.title === t('dashboard.stats.securityAlerts') && (
                  <Box>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      height: 25,
                      mt: 0.5
                    }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600,
                          color: 'warning.main',
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        {t('dashboard.stats.todayAlerts')}
                        <FarsiNumber sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                          {alertStats.todayCount}
                        </FarsiNumber>
                        {t('dashboard.stats.alertItems')}
                      </Typography>
                    </Box>
                    
                    {/* محتوای کشویی */}
                    <Collapse in={expandedCards[stat.title]} timeout={400} unmountOnExit appear>
                      <Fade in={expandedCards[stat.title]} timeout={400} appear>
                        <Box sx={{ 
                          mt: 2, 
                          pt: 2, 
                          borderTop: `1px solid ${theme.palette.divider}`,
                          animation: expandedCards[stat.title] ? 'fadeInUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
                          '@keyframes fadeInUp': {
                            from: { opacity: 0, transform: 'translateY(-15px)', visibility: 'hidden' },
                            to: { opacity: 1, transform: 'translateY(0)', visibility: 'visible' },
                          },
                        }}>
                          <Grid container spacing={2}>
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center' }}>
                                <FarsiNumber variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>
                                  {alertStats.todayCount}
                                </FarsiNumber>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                  {t('dashboard.stats.today')}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center' }}>
                                <FarsiNumber variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>
                                  {alertStats.weekCount}
                                </FarsiNumber>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                  {t('dashboard.stats.thisWeek')}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center' }}>
                                <FarsiNumber variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>
                                  {alertStats.monthCount}
                                </FarsiNumber>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                  {t('dashboard.stats.thisMonth')}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      </Fade>
                    </Collapse>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

const HomePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const scenarios = useAppSelector(selectScenarios);
  const [quote, setQuote] = useState(getRandomQuote('wisdom'));
  const [martyr, setMartyr] = useState(getRandomMartyr());
  const { t } = useTranslation();
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const [starredActivities, setStarredActivities] = useState<number[]>([]);
  const [archivedActivities, setArchivedActivities] = useState<number[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<number[]>([]); // State جدید برای فعالیت‌های انتخاب شده

  // تعریف انیمیشن spin
  const spinKeyframes = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  const handleRefreshActivities = () => {
    setActivitiesLoading(true);
    // فرض می‌کنیم که یک تابع fetchRecentActivities وجود داره که داده‌های جدید رو می‌گیره
    // این تابع باید از یک API یا store واقعی داده بگیره
    setTimeout(() => {
      // اینجا باید داده‌های جدید رو از API یا store بگیریم
      // برای مثال:
      // dispatch(fetchRecentActivities());
      setActivitiesLoading(false);
    }, 1000);
  };
  const handleSettingsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };
  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  // تابع‌های جدید برای گزینه‌های منو
  const handleArchiveAll = () => {
    // آرشیو کردن فعالیت‌ها بر اساس انتخاب کاربر
    if (selectedActivities.length > 0) {
      // اگر فعالیتی انتخاب شده بود، فقط اون‌ها آرشیو بشن
      setArchivedActivities(prev => {
        const newArchived = [...prev];
        selectedActivities.forEach(id => {
          if (!newArchived.includes(id)) {
            newArchived.push(id);
          }
        });
        return newArchived;
      });
      
      // پاک کردن لیست انتخاب‌ها
      setSelectedActivities([]);
    } else {
      // اگر فعالیتی انتخاب نشده بود، همه فعالیت‌ها آرشیو بشن
      const allActivityIds = recentActivities.map(activity => activity.id);
      setArchivedActivities(prev => {
        const newArchived = [...prev];
        allActivityIds.forEach(id => {
          if (!newArchived.includes(id)) {
            newArchived.push(id);
          }
        });
        return newArchived;
      });
    }
    
    setShowArchived(false);
    handleSettingsClose();
    
    // نمایش پیام موفقیت
    dispatch(addNotification({
      type: 'success',
      title: 'عملیات موفق',
      message: selectedActivities.length > 0 
        ? 'فعالیت‌های انتخاب شده آرشیو شدند' 
        : 'همه فعالیت‌ها آرشیو شدند',
      read: false,
      priority: 'medium',
      autoHide: true
    }));
  };

  const handleUnarchiveAll = () => {
    // لغو آرشیو کردن همه فعالیت‌ها
    // تعریف نوع Activity
    type Activity = {
      id: number;
      title: string;
      description: string;
      time: string;
      avatar: React.ReactNode;
      color: string;
      roles: string[];
    };
    
    // داده‌های نمونه برای allActivities
    const allActivities: Activity[] = [
      {
        id: 1,
        title: t('dashboard.activities.newScenario'),
        description: t('dashboard.activities.newScenarioDesc'),
        time: t('dashboard.activities.time.minutes', { count: 5 }),
        avatar: <AssignmentIcon />,
        color: '#1976d2',
        roles: ['admin', 'commander', 'operator', 'viewer'],
      },
      {
        id: 2,
        title: t('dashboard.activities.forceMoved'),
        description: t('dashboard.activities.forceMovedDesc'),
        time: t('dashboard.activities.time.minutes', { count: 15 }),
        avatar: <PeopleIcon />,
        color: '#2e7d32',
        roles: ['admin', 'commander', 'operator'],
      },
      {
        id: 3,
        title: t('dashboard.activities.mapUpdated'),
        description: t('dashboard.activities.mapUpdatedDesc'),
        time: t('dashboard.activities.time.minutes', { count: 30 }),
        avatar: <MapIcon />,
        color: '#ed6c02',
        roles: ['admin', 'commander', 'operator', 'viewer'],
      },
      {
        id: 4,
        title: t('dashboard.activities.securityReport'),
        description: t('dashboard.activities.securityReportDesc'),
        time: t('dashboard.activities.time.hours', { count: 1 }),
        avatar: <Security />,
        color: '#d32f2f',
        roles: ['admin', 'commander'],
      },
      {
        id: 5,
        title: t('dashboard.activities.newUser'),
        description: t('dashboard.activities.newUserDesc'),
        time: t('dashboard.activities.time.hours', { count: 2 }),
        avatar: <Group />,
        color: '#9c27b0',
        roles: ['admin'],
      },
      {
        id: 6,
        title: t('dashboard.activities.readinessReport'),
        description: t('dashboard.activities.readinessReportDesc'),
        time: t('dashboard.activities.time.hours', { count: 3 }),
        avatar: <CheckCircle />,
        color: '#009688',
        roles: ['admin', 'commander'],
      },
    ];
    
    const allActivityIds = allActivities.map(activity => activity.id);
    setArchivedActivities(prev => prev.filter(id => !allActivityIds.includes(id)));
    setShowArchived(true);
    handleSettingsClose();
    
    // نمایش پیام موفقیت
    dispatch(addNotification({
      type: 'success',
      title: 'عملیات موفق',
      message: 'آرشیو همه فعالیت‌ها لغو شد',
      read: false,
      priority: 'medium',
      autoHide: true
    }));
  };

  const handleStarAll = () => {
    // ستاره‌دار کردن همه فعالیت‌ها (جلوگیری از ستاره‌دار کردن دوباره فعالیت‌های ستاره‌دار شده)
    const allActivityIds = recentActivities.map(activity => activity.id);
    setStarredActivities(prev => {
      const newStarred = [...prev];
      allActivityIds.forEach(id => {
        if (!newStarred.includes(id)) {
          newStarred.push(id);
        }
      });
      return newStarred;
    });
    handleSettingsClose();
    
    // نمایش پیام موفقیت
    dispatch(addNotification({
      type: 'success',
      title: 'عملیات موفق',
      message: 'همه فعالیت‌ها ستاره‌دار شدند',
      read: false,
      priority: 'medium',
      autoHide: true
    }));
  };

  const handleUnstarAll = () => {
    // لغو ستاره‌دار کردن همه فعالیت‌ها
    const allActivityIds = recentActivities.map(activity => activity.id);
    setStarredActivities(prev => prev.filter(id => !allActivityIds.includes(id)));
    handleSettingsClose();
    
    // نمایش پیام موفقیت
    dispatch(addNotification({
      type: 'success',
      title: 'عملیات موفق',
      message: 'ستاره‌دار کردن همه فعالیت‌ها لغو شد',
      read: false,
      priority: 'medium',
      autoHide: true
    }));
  };

  const handleViewAllActivities = () => {
    navigate('/dashboard/notifications');
  };

  const handleToggleStar = (id: number) => {
    setStarredActivities(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  
  // تغییر تابع handleToggleArchive برای انتخاب فعالیت‌ها
  const handleToggleArchive = (id: number) => {
    setSelectedActivities(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // تابع جدید برای لغو انتخاب همه فعالیت‌ها
  const handleDeselectAll = () => {
    setSelectedActivities([]);
    handleSettingsClose();
    
    // نمایش پیام موفقیت
    dispatch(addNotification({
      type: 'success',
      title: 'عملیات موفق',
      message: 'انتخاب همه فعالیت‌ها لغو شد',
      read: false,
      priority: 'medium',
      autoHide: true
    }));
  };

  useEffect(() => {
    // دریافت سناریوها
    dispatch(fetchScenarios());
    
    // نمایش پیام خوش‌آمدگویی (فقط اگر کاربر موجود باشه)
    if (user) {
      dispatch(addNotification({
        type: 'success',
        title: t('dashboard.welcome.title'),
        message: t('dashboard.welcome.message', { name: user?.name || user?.username }),
        read: false,
        priority: 'medium',
        autoHide: true
      }));
    }
    
    // انتخاب یک سخن تصادفی و یک شهید تصادفی
    setQuote(getRandomQuote());
    setMartyr(getRandomMartyr());
  }, [dispatch, user]);

  // فعالیت‌های اخیر بر اساس نقش کاربر
  const recentActivities = useMemo(() => {
    // فرض می‌کنیم که allActivities از یک API یا store واقعی گرفته میشه
    // const allActivities = useAppSelector(selectAllActivities);
    
    // برای رفع خطای TypeScript، یک تایپ برای activity تعریف می‌کنیم
    type Activity = {
      id: number;
      title: string;
      description: string;
      time: string;
      avatar: React.ReactNode;
      color: string;
      roles: string[];
    };
    
    // داده‌های نمونه برای allActivities
    const allActivities: Activity[] = [
      {
        id: 1,
        title: t('dashboard.activities.newScenario'),
        description: t('dashboard.activities.newScenarioDesc'),
        time: t('dashboard.activities.time.minutes', { count: 5 }),
        avatar: <AssignmentIcon />,
        color: '#1976d2',
        roles: ['admin', 'commander', 'operator', 'viewer'],
      },
      {
        id: 2,
        title: t('dashboard.activities.forceMoved'),
        description: t('dashboard.activities.forceMovedDesc'),
        time: t('dashboard.activities.time.minutes', { count: 15 }),
        avatar: <PeopleIcon />,
        color: '#2e7d32',
        roles: ['admin', 'commander', 'operator'],
      },
      {
        id: 3,
        title: t('dashboard.activities.mapUpdated'),
        description: t('dashboard.activities.mapUpdatedDesc'),
        time: t('dashboard.activities.time.minutes', { count: 30 }),
        avatar: <MapIcon />,
        color: '#ed6c02',
        roles: ['admin', 'commander', 'operator', 'viewer'],
      },
      {
        id: 4,
        title: t('dashboard.activities.securityReport'),
        description: t('dashboard.activities.securityReportDesc'),
        time: t('dashboard.activities.time.hours', { count: 1 }),
        avatar: <Security />,
        color: '#d32f2f',
        roles: ['admin', 'commander'],
      },
      {
        id: 5,
        title: t('dashboard.activities.newUser'),
        description: t('dashboard.activities.newUserDesc'),
        time: t('dashboard.activities.time.hours', { count: 2 }),
        avatar: <Group />,
        color: '#9c27b0',
        roles: ['admin'],
      },
      {
        id: 6,
        title: t('dashboard.activities.readinessReport'),
        description: t('dashboard.activities.readinessReportDesc'),
        time: t('dashboard.activities.time.hours', { count: 3 }),
        avatar: <CheckCircle />,
        color: '#009688',
        roles: ['admin', 'commander'],
      },
    ];
    
    // اگر showArchived true باشد، همه فعالیت‌ها نمایش داده می‌شوند
    // در غیر این صورت، فقط فعالیت‌های آرشیو نشده نمایش داده می‌شوند
    const filteredActivities = showArchived 
      ? allActivities 
      : allActivities.filter(activity => !archivedActivities.includes(activity.id));
    
    // فیلتر فعالیت‌ها بر اساس نقش کاربر
    return filteredActivities.filter(activity => user && activity.roles.includes(user.role));
  }, [user, archivedActivities, showArchived, t]);

  // دسترسی سریع بر اساس نقش کاربر
  const quickActions = useMemo(() => {
    const allActions = [
      {
        title: t('dashboard.quickActions.newScenario'),
        icon: <Add />,
        color: '#1976d2',
        onClick: () => navigate('/dashboard/scenarios'),
        roles: ['admin', 'commander'],
      },
      {
        title: t('dashboard.quickActions.viewMap'),
        icon: <MapIcon />,
        color: '#2e7d32',
        onClick: () => navigate('/dashboard/map'),
        roles: ['admin', 'commander', 'operator', 'viewer'],
      },
      {
        title: t('dashboard.quickActions.orbatMapper'),
        icon: <RadarIcon />,
        color: '#d32f2f',
        onClick: () => navigate('/dashboard/orbat-mapper'),
        roles: ['admin', 'commander', 'operator'],
      },
      {
        title: t('dashboard.quickActions.reporting'),
        icon: <TrendingUp />,
        color: '#ed6c02',
        onClick: () => navigate('/dashboard/reports'),
        roles: ['admin', 'commander', 'operator'],
      },
      {
        title: t('dashboard.quickActions.settings'),
        icon: <Settings />,
        color: '#757575',
        onClick: () => navigate('/dashboard/settings'),
        roles: ['admin', 'commander', 'operator', 'viewer'],
      },
      {
        title: t('dashboard.quickActions.userManagement'),
        icon: <Group />,
        color: '#9c27b0',
        onClick: () => navigate('/dashboard/users'),
        roles: ['admin'],
      },
      {
        title: t('dashboard.quickActions.securityAlerts'),
        icon: <Warning />,
        color: '#d32f2f',
        onClick: () => navigate('/dashboard/alerts'),
        roles: ['admin', 'commander'],
      },
    ];

    // فیلتر اقدامات سریع بر اساس نقش کاربر
    return allActions.filter(action => user && action.roles.includes(user.role));
  }, [navigate, user, t]);

  // اطلاعات وضعیت سیستم (فقط برای مدیر)
  const systemStatus = [
    { name: 'CPU', value: 35, color: 'success' },
    { name: 'RAM', value: 65, color: 'warning' },
    { name: t('dashboard.systemStatus.disk'), value: 42, color: 'info' },
    { name: t('dashboard.systemStatus.network'), value: 28, color: 'success' },
  ];

  return (
    <Box sx={{ p: 4, minHeight: '100%' }}>
      
      {/* Header */}
      <Card 
        component={Paper}
        elevation={0}
        sx={{ 
          mb: 4, 
          p: 3,
          background: theme.palette.background.paper,
          border: 'none',
          boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10) !important',
          borderRadius: 2,
          position: 'relative',
          overflow: 'visible',
          transition: 'none',
          pointerEvents: 'none',
        }}
      >
        <Grid container spacing={2}>
          {/* بخش سمت چپ - سخن */}
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              height: '100%',
              justifyContent: 'center',
              position: 'relative',
              px: 2
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                width: '100%',
                mb: 1,
                justifyContent: 'space-between'
              }}>
                  <Box sx={{ 
    width: 80, 
    height: 80, 
    borderRadius: 1,
    overflow: 'hidden',
    ml: -2
  }}>
    <img 
      src="header.png" 
      alt="تصویر سربرگ" 
      style={{ 
        width: '100%', 
        height: '100%', 
        objectFit: 'contain'
      }} 
    />
  </Box>
                <Box sx={{ flex: 1, position: 'relative', px: 2 }}>
                  <FormatQuote 
                    sx={{ 
                      fontSize: 60, 
                      color: alpha(theme.palette.primary.main, 0.2),
                      position: 'absolute',
                      top: -15,
                      left: -15,
                      transform: 'rotate(180deg)'
                    }}
                  />
                  <FarsiTypography variant="body1" sx={{ 
                    fontWeight: 500, 
                    mb: 1, 
                    textAlign: 'left',
                    fontStyle: 'italic',
                    color: theme.palette.text.primary,
                    zIndex: 1,
                    position: 'relative'
                  }}>
                    "{quote.text}"
                  </FarsiTypography>
                  <FarsiTypography variant="caption" color="text.secondary" sx={{ 
                    display: 'block',
                    textAlign: 'right',
                    fontWeight: 300,
                    mt: 1
                  }}>
                    {quote.author}
                  </FarsiTypography>
                </Box>
              </Box>
            </Box>
          </Grid>
          
          {/* بخش وسط - بسم الله */}
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '20%',
              px: 2
            }}>
              <img 
                src={theme.palette.mode === 'dark' ? 'besmellah2.png' : 'besmellah1.png'}
                alt="بسم الله الرحمن الرحیم" 
                style={{ 
                  height: '30px', 
                  objectFit: 'contain',
                  margin: '0 auto'
                }} 
              />
            </Box>
          </Grid>
          
          {/* بخش سمت راست - شهید */}
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              height: '100%',
              px: 2
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                width: '100%',
                mb: 2
              }}>
                <Box sx={{ flex: 1, ml: 8, textAlign: 'left' }}>
                  <FarsiTypography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {martyr.name}
                  </FarsiTypography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', mb: 0.5 }}>
                    <Work sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                    <FarsiTypography variant="caption" color="text.secondary">
                      {martyr.position}
                    </FarsiTypography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                    <CalendarToday sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                    <FarsiTypography variant="caption" color="text.secondary">
                      تاریخ شهادت: {martyr.martyrdomDate}
                    </FarsiTypography>
                  </Box>
                </Box>
                <Box sx={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: 1,
                  overflow: 'hidden',
                  mr: -2
                }}>
                  <img 
                    src="shahid.jpg" 
                    alt={martyr.name}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover'
                    }} 
                  />
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* آمار */}
      <DashboardStats />

      <Grid container spacing={3}>
        {/* فعالیت‌های اخیر */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
              background: alpha(theme.palette.background.paper, 0.6),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Box
              sx={{
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <FarsiTypography variant="h6" sx={{ fontWeight: 600 }}>
                {t('dashboard.recentActivities')}
              </FarsiTypography>
              <Box>
                <Tooltip title={t('dashboard.tooltips.update')}>
                  <span>
                    <IconButton size="small" onClick={handleRefreshActivities} disabled={activitiesLoading}>
                      <Refresh sx={activitiesLoading ? { 
                        animation: 'spin 1s linear infinite',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' }
                        }
                      } : {}} />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title={t('dashboard.tooltips.settings')}>
                  <IconButton size="small" onClick={handleSettingsOpen}>
                    <MoreVert />
                  </IconButton>
                </Tooltip>
                <Menu anchorEl={settingsAnchorEl} open={Boolean(settingsAnchorEl)} onClose={handleSettingsClose}>
                  <MenuItem onClick={handleArchiveAll}>{t('dashboard.menu.archiveAll')}</MenuItem>
                  <MenuItem onClick={handleUnarchiveAll}>{t('dashboard.menu.unarchiveAll')}</MenuItem>
                  <MenuItem onClick={handleStarAll}>{t('dashboard.menu.starAll')}</MenuItem>
                  <MenuItem onClick={handleUnstarAll}>{t('dashboard.menu.unstarAll')}</MenuItem>
                  <MenuItem onClick={handleDeselectAll}>{t('dashboard.menu.deselectAll')}</MenuItem>
                  <MenuItem onClick={handleViewAllActivities}>{t('dashboard.viewAllActivities')}</MenuItem>
                </Menu>
              </Box>
            </Box>
            <List sx={{ p: 0 }}>
              {recentActivities.map((activity, index) => (
                <ListItem
                  key={activity.id}
                  sx={{
                    borderBottom: index < recentActivities.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.action.hover, 0.04),
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: alpha(activity.color, 0.1),
                        color: activity.color,
                        width: 40,
                        height: 40,
                      }}
                    >
                      {activity.avatar}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <FarsiTypography variant="body1" sx={{ fontWeight: 500 }}>
                        {activity.title}
                      </FarsiTypography>
                    }
                    secondary={
                      <React.Fragment>
                        <FarsiTypography variant="body2" component="span" color="text.secondary">
                          {activity.description}
                        </FarsiTypography>
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                          <Schedule sx={{ fontSize: 14, mr: 0.5, color: 'text.disabled' }} />
                          <FarsiTypography variant="caption" component="span" color="text.disabled">
                            {activity.time}
                          </FarsiTypography>
                        </Box>
                      </React.Fragment>
                    }
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Tooltip title={t('dashboard.tooltips.star')} placement="right">
                      <IconButton size="small" onClick={() => handleToggleStar(activity.id)}>
                        {starredActivities.includes(activity.id) ? (
                          <Star sx={{ fontSize: 18, color: 'warning.main' }} />
                        ) : (
                          <Star sx={{ fontSize: 18, color: 'grey.400' }} />
                        )}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('dashboard.tooltips.archive')} placement="right">
                      <IconButton size="small" onClick={() => handleToggleArchive(activity.id)}>
                        {selectedActivities.includes(activity.id) ? (
                          <Archive sx={{ fontSize: 18, color: 'primary.main' }} />
                        ) : archivedActivities.includes(activity.id) ? (
                          <Archive sx={{ fontSize: 18, color: 'info.main' }} />
                        ) : (
                          <Archive sx={{ fontSize: 18, color: 'grey.400' }} />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItem>
              ))}
            </List>
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Button variant="text" color="primary" onClick={handleViewAllActivities}>
                {t('dashboard.viewAllActivities')}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* دسترسی سریع و وضعیت سیستم */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
              background: alpha(theme.palette.background.paper, 0.6),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              mb: 3,
            }}
          >
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <FarsiTypography variant="h6" sx={{ fontWeight: 600 }}>
                {t('dashboard.quickAccess')}
              </FarsiTypography>
            </Box>
            <Box sx={{ p: 2 }}>
              <Grid container spacing={1}>
                {quickActions.map((action, index) => (
                  <Grid item xs={6} key={index}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        textAlign: 'center',
                        p: 2,
                        transition: 'all 0.2s',
                        border: `1px solid ${alpha(action.color, 0.12)}`,
                        '&:hover': {
                          bgcolor: alpha(action.color, 0.04),
                          transform: 'scale(1.02)',
                        },
                      }}
                      onClick={action.onClick}
                    >
                      <Avatar
                        sx={{
                          bgcolor: alpha(action.color, 0.1),
                          color: action.color,
                          mx: 'auto',
                          mb: 1,
                        }}
                      >
                        {action.icon}
                      </Avatar>
                      <FarsiTypography variant="caption" display="block">
                        {action.title}
                      </FarsiTypography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Paper>

          {/* وضعیت سیستم - فقط برای مدیر */}
          {user?.role === 'admin' && (
            <Paper
              sx={{
                borderRadius: 2,
                overflow: 'hidden',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <FarsiTypography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('dashboard.systemStatus.title')}
                </FarsiTypography>
              </Box>
              <Box sx={{ p: 2 }}>
                {systemStatus.map((status, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <FarsiTypography variant="body2">{status.name}</FarsiTypography>
                      <FarsiTypography variant="body2">{status.value}%</FarsiTypography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={status.value}
                      color={status.color as any}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {/* اطلاعیه‌های مهم - فقط برای فرمانده و مدیر */}
          {(user?.role === 'admin' || user?.role === 'commander') && (
            <Paper
              sx={{
                borderRadius: 2,
                overflow: 'hidden',
                border: `1px solid ${theme.palette.divider}`,
                mt: 3,
              }}
            >
              <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <FarsiTypography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('dashboard.importantNotices')}
                </FarsiTypography>
              </Box>
              <Box sx={{ p: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <FarsiTypography variant="body2">{t('dashboard.alerts.securityThreat')}</FarsiTypography>
                </Alert>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <FarsiTypography variant="body2">{t('dashboard.alerts.systemUpdate')}</FarsiTypography>
                </Alert>
                <Alert severity="success">
                  <FarsiTypography variant="body2">{t('dashboard.alerts.trainingSuccess')}</FarsiTypography>
                </Alert>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

const spin = `@keyframes spin { 100% { transform: rotate(360deg); } }`;

export default HomePage;