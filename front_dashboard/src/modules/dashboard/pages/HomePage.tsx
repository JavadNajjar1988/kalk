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

  const stats: StatItem[] = [
    {
      title: t('dashboard.stats.activeScenarios'),
      value: scenarios.length || 8,
      icon: <AssignmentIcon />,
      color: 'warning', // تغییر از primary به warning (زرد)
      gradient: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
      subtitle: (() => {
        const activeCount = Math.floor((scenarios.length || 8) * 0.75);
        const inactiveCount = (scenarios.length || 8) - activeCount;
        const activePercent = scenarios.length > 0 ? Math.round((activeCount / (scenarios.length || 8)) * 100) : 75;
        return t('dashboard.stats.activeScenariosSubtitle', { activePercent: activePercent.toLocaleString('fa-IR'), inactiveCount: inactiveCount.toLocaleString('fa-IR') });
      })(),
    },
    {
      title: t('dashboard.stats.availableForces'),
      value: 245,
      icon: <PeopleIcon />,
      color: 'success',
      gradient: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
      subtitle: (() => {
        const iranianCount = Math.floor(245 * 0.75);
        const foreignCount = 245 - iranianCount;
        const iranianPercent = Math.round((iranianCount / 245) * 100);
        const foreignPercent = Math.round((foreignCount / 245) * 100);
        return t('dashboard.stats.availableForcesSubtitle', { iranianPercent: iranianPercent.toLocaleString('fa-IR'), foreignPercent: foreignPercent.toLocaleString('fa-IR') });
      })(),
    },
    {
      title: t('dashboard.stats.ongoingOperations'),
      value: 8,
      icon: <MapIcon />,
      color: 'error',
      gradient: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
      subtitle: (() => {
        const commanderCount = 3;
        const operatorCount = 4;
        const viewerCount = 1;
        return t('dashboard.stats.ongoingOperationsSubtitle', { commanderCount: commanderCount.toLocaleString('fa-IR'), operatorCount: operatorCount.toLocaleString('fa-IR'), viewerCount: viewerCount.toLocaleString('fa-IR') });
      })(),
    },
    {
      title: t('dashboard.stats.securityAlerts'),
      value: 2,
      icon: <Security />,
      color: 'info',
      gradient: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
      subtitle: (() => {
        const todayCount = 5;
        const weekCount = 12;
        const todayPercent = Math.round((todayCount / 32) * 100);
        return t('dashboard.stats.securityAlertsSubtitle', { todayPercent: todayPercent.toLocaleString('fa-IR'), weekCount: weekCount.toLocaleString('fa-IR') });
      })(),
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
                          width: '75%',
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
                          color: '#ff9800', // رنگ متن زرد ثابت
                        }}
                      >
                        ۷۵% فعال
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          color: 'text.secondary',
                        }}
                      >
                        ۲۵% غیرفعال
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
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                  {(scenarios.length || 8).toLocaleString('fa-IR')}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                  کل سناریوها
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                                  {Math.floor((scenarios.length || 8) * 0.75).toLocaleString('fa-IR')}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                  فعال
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>
                                  {Math.ceil((scenarios.length || 8) * 0.25).toLocaleString('fa-IR')}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                  غیرفعال
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
                          width: '75%',
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
                        ۷۵% ایرانی
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          color: 'text.secondary',
                        }}
                      >
                        ۲۵% خارجی
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
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                                  {(184).toLocaleString('fa-IR')}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                  ایران
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                                  {(61).toLocaleString('fa-IR')}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                  سایر کشورها
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
                        { role: 'commander', color: theme.palette.success.main, gradient: `linear-gradient(180deg, ${theme.palette.success.light}, ${theme.palette.success.main})`, label: 'فرمانده', count: 3 },
                        { role: 'operator', color: '#2196f3', gradient: `linear-gradient(180deg, #64b5f6, #2196f3)`, label: 'اپراتور', count: 4 },
                        { role: 'viewer', color: theme.palette.warning.main, gradient: `linear-gradient(180deg, ${theme.palette.warning.light}, ${theme.palette.warning.main})`, label: 'بیننده', count: 1 },
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
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                                  ۳
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                  فرمانده
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#2196f3' }}>
                                  ۴
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                  اپراتور
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>
                                  ۱
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                  بیننده
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
                        هشدار فعال امروز
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                          ۲
                        </span>
                        مورد
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
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>
                                  ۲
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                  امروز
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>
                                  ۷
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                  این هفته
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>
                                  ۱۵
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                  این ماه
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

  const handleRefreshActivities = () => {
    setActivitiesLoading(true);
    setTimeout(() => setActivitiesLoading(false), 1000);
  };
  const handleSettingsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };
  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  const handleToggleStar = (id: number) => {
    setStarredActivities(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const handleToggleArchive = (id: number) => {
    setArchivedActivities(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
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
    const allActivities = [
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

    // فیلتر فعالیت‌ها بر اساس نقش کاربر
    return allActivities.filter(activity => user && activity.roles.includes(user.role));
  }, [user, t]);

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
        title: t('dashboard.quickActions.reporting'),
        icon: <TrendingUp />,
        color: '#ed6c02',
        onClick: () => {},
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
                      <Refresh sx={activitiesLoading ? { animation: 'spin 1s linear infinite' } : {}} />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title={t('dashboard.tooltips.settings')}>
                  <IconButton size="small" onClick={handleSettingsOpen}>
                    <MoreVert />
                  </IconButton>
                </Tooltip>
                <Menu anchorEl={settingsAnchorEl} open={Boolean(settingsAnchorEl)} onClose={handleSettingsClose}>
                  <MenuItem onClick={handleSettingsClose}>{t('dashboard.menu.archiveAll')}</MenuItem>
                  <MenuItem onClick={handleSettingsClose}>{t('dashboard.menu.starAll')}</MenuItem>
                  <MenuItem onClick={handleSettingsClose}>{t('dashboard.viewAllActivities')}</MenuItem>
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
                    <Tooltip title={t('dashboard.tooltips.star')}>
                      <IconButton size="small" onClick={() => handleToggleStar(activity.id)}>
                        {starredActivities.includes(activity.id) ? (
                          <Star sx={{ fontSize: 18, color: 'warning.main' }} />
                        ) : (
                          <Star sx={{ fontSize: 18, color: 'grey.400' }} />
                        )}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('dashboard.tooltips.archive')}>
                      <IconButton size="small" onClick={() => handleToggleArchive(activity.id)}>
                        {archivedActivities.includes(activity.id) ? (
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
              <Button variant="text" color="primary">
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