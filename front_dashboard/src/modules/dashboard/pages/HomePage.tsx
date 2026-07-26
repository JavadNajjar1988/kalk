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
import { fetchScenarios } from '@/store/slices/scenariosSlice';
import {
  addNotification,
  selectDashboardModules,
  selectHeaderSettings,
  DashboardModulesSettings,
  HeaderSettings,
} from '@/store/slices/uiSlice';
import { getRandomQuote, quotes, Quote } from '@/config/quotes';
import { getRandomMartyr, martyrs } from '@/config/martyrs';
import type { Martyr } from '@/config/martyrs';
import { convertToFarsiNumber } from '@/utils/numberUtils';
import FarsiTypography from '@/components/common/FarsiTypography';
import FarsiNumber from '@/components/common/FarsiNumber';
import TransformFarsiNumbers from '@/components/common/TransformFarsiNumbers';
import { useTranslation } from '@/hooks/useTranslation';
import { dashboardApiService, DashboardSummary } from '@/services/api/dashboardApiService';

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
interface DashboardStatsProps {
  showStatArchivedScenarios: boolean;
  showStatAvailableForces: boolean;
  showStatOngoingOperations: boolean;
  showStatSecurityAlerts: boolean;
  summary: DashboardSummary;
}

const EMPTY_SUMMARY: DashboardSummary = {
  generatedAt: '',
  role: 'VIEWER',
  visibleCards: ['archived_scenarios', 'available_forces', 'recent_activities'],
  scenarioStats: { total: 0, active: 0, archived: 0, ready: 0, completed: 0 },
  forceStats: { total: 0, iranian: 0, foreign: 0 },
  operationStats: { total: 0, active: 0, ready: 0, completed: 0 },
  alertStats: { total: 0, failedLogins: 0, lockedAccounts: 0, inactiveAccounts: 0 },
  resourceStats: { total: 0, byType: {} },
  activities: [],
  systemStatus: [],
  notices: [],
};

const DashboardStats: React.FC<DashboardStatsProps> = ({
  showStatArchivedScenarios,
  showStatAvailableForces,
  showStatOngoingOperations,
  showStatSecurityAlerts,
  summary,
}) => {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const theme = useTheme();
  const { t } = useTranslation();
  const unifiedAccent = theme.palette.primary.main;
  const unifiedCardSurface = `linear-gradient(135deg, ${alpha(unifiedAccent, 0.07)}, ${alpha(unifiedAccent, 0.04)})`;

  const handleCardExpand = (cardTitle: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardTitle]: !prev[cardTitle]
    }));
  };

  const scenarioStats = {
    total: summary.scenarioStats.total,
    activeCount: summary.scenarioStats.active,
    inactiveCount: summary.scenarioStats.archived,
    activePercent: summary.scenarioStats.total
      ? Math.round(summary.scenarioStats.active / summary.scenarioStats.total * 100) : 0,
    inactivePercent: summary.scenarioStats.total
      ? Math.round(summary.scenarioStats.archived / summary.scenarioStats.total * 100) : 0,
  };
  const forceStats = {
    total: summary.forceStats.total,
    iranianCount: summary.forceStats.iranian,
    foreignCount: summary.forceStats.foreign,
    iranianPercent: summary.forceStats.total
      ? Math.round(summary.forceStats.iranian / summary.forceStats.total * 100) : 0,
    foreignPercent: summary.forceStats.total
      ? Math.round(summary.forceStats.foreign / summary.forceStats.total * 100) : 0,
  };
  const operationStats = {
    total: summary.operationStats.total,
    commanderCount: summary.operationStats.active,
    operatorCount: summary.operationStats.ready,
    viewerCount: summary.operationStats.completed,
  };
  const alertStats = {
    total: summary.alertStats.total,
    todayCount: summary.alertStats.failedLogins,
    weekCount: summary.alertStats.lockedAccounts,
    monthCount: summary.alertStats.inactiveAccounts,
    todayPercent: summary.alertStats.total
      ? Math.round(summary.alertStats.failedLogins / summary.alertStats.total * 100) : 0,
  };

  const stats: StatItem[] = [];

  if (showStatArchivedScenarios) {
    stats.push({
      title: t('dashboard.stats.activeScenarios'),
      value: scenarioStats.total,
      icon: <AssignmentIcon />,
      color: 'warning',
      gradient: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
      subtitle: t('dashboard.stats.activeScenariosSubtitle', {
        activePercent: scenarioStats.activePercent.toLocaleString('fa-IR'),
        inactiveCount: scenarioStats.inactiveCount.toLocaleString('fa-IR'),
      }),
    });
  }

  if (showStatAvailableForces) {
    stats.push({
      title: t('dashboard.stats.availableForces'),
      value: forceStats.total,
      icon: <PeopleIcon />,
      color: 'primary',
      gradient: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
      subtitle: t('dashboard.stats.availableForcesSubtitle', {
        iranianPercent: forceStats.iranianPercent.toLocaleString('fa-IR'),
        foreignPercent: forceStats.foreignPercent.toLocaleString('fa-IR'),
      }),
    });
  }

  if (showStatOngoingOperations) {
    stats.push({
      title: t('dashboard.stats.ongoingOperations'),
      value: operationStats.total,
      icon: <MapIcon />,
      color: 'error',
      gradient: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
      subtitle: t('dashboard.stats.ongoingOperationsSubtitle', {
        commanderCount: operationStats.commanderCount.toLocaleString('fa-IR'),
        operatorCount: operationStats.operatorCount.toLocaleString('fa-IR'),
        viewerCount: operationStats.viewerCount.toLocaleString('fa-IR'),
      }),
    });
  }

  if (showStatSecurityAlerts) {
    stats.push({
      title: t('dashboard.stats.securityAlerts'),
      value: alertStats.total,
      icon: <Security />,
      color: 'info',
      gradient: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
      subtitle: t('dashboard.stats.securityAlertsSubtitle', {
        todayPercent: alertStats.todayPercent.toLocaleString('fa-IR'),
        weekCount: alertStats.weekCount.toLocaleString('fa-IR'),
      }),
    });
  }

  if (stats.length === 0) {
    return null;
  }

  const statGridMd = stats.length === 1 ? 12 : stats.length === 2 ? 6 : stats.length === 3 ? 4 : 3;

  return (
    <Grid container spacing={1.5} sx={{ mb: 2 }}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={statGridMd} key={index}>
          <Card
            sx={{
              background: unifiedCardSurface,
              backdropFilter: 'blur(6px)',
              borderRadius: `${theme.shape.borderRadius * 1.2}px`,
              boxShadow: 'none',
              border: `1px solid ${alpha(unifiedAccent, 0.24)}`,
              '&:hover': {
                transform: 'translateY(-2px) scale(1.01)',
                boxShadow: theme.shadows[5],
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
              minHeight: expandedCards[stat.title] ? 180 : 108, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              {/* Header with icon and title */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    sx={{
                      bgcolor: alpha(unifiedAccent, 0.14),
                      color: unifiedAccent,
                      width: 36,
                      height: 36,
                      boxShadow: `0 4px 12px ${alpha(unifiedAccent, 0.28)}`,
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
                        fontSize: '1.1rem', 
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
                      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
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
              <Box sx={{ 
                width: '100%', 
                mt: 'auto'
              }}>
                {/* نمودار سناریوهای فعال */}
                {stat.title === t('dashboard.stats.activeScenarios') && (
                  <Box>
                    {/* نمودار پیشرفت */}
                    <Box sx={{ 
                      height: 8, 
                      borderRadius: 4, 
                      backgroundColor: 'rgba(255, 152, 0, 0.1)',
                      overflow: 'hidden',
                      position: 'relative',
                      mb: 1.5
                    }}>
                      <Box
                        sx={{
                          height: '100%',
                          width: `${scenarioStats.activePercent}%`,
                          background: 'linear-gradient(90deg, #ffb74d, #ff9800, #f57c00)',
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
                    
                    {/* نمایش آمار اصلی */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      minHeight: '28px',
                      mb: 3
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        flex: 1
                      }}>
                        <FarsiNumber sx={{ 
                          fontWeight: 700, 
                          fontSize: '1rem', 
                          color: '#ff9800',
                          minWidth: '20px',
                          textAlign: 'center'
                        }}>
                          {scenarioStats.activePercent}
                        </FarsiNumber>
                        <Typography variant="caption" sx={{ 
                          fontWeight: 600, 
                          fontSize: '0.85rem', 
                          color: '#ff9800',
                          lineHeight: 1.2
                        }}>
                          % {t('dashboard.stats.active')}
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        flex: 1,
                        justifyContent: 'flex-end'
                      }}>
                        <FarsiNumber sx={{ 
                          fontWeight: 700, 
                          fontSize: '1rem', 
                          color: 'text.secondary',
                          minWidth: '20px',
                          textAlign: 'center'
                        }}>
                          {scenarioStats.inactivePercent}
                        </FarsiNumber>
                        <Typography variant="caption" sx={{ 
                          fontWeight: 600, 
                          fontSize: '0.85rem', 
                          color: 'text.secondary',
                          lineHeight: 1.2
                        }}>
                          % {t('dashboard.stats.inactive')}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* محتوای کشویی */}
                    <Collapse in={expandedCards[stat.title]} timeout={300} unmountOnExit appear>
                      <Fade in={expandedCards[stat.title]} timeout={300} appear>
                        <Box sx={{ 
                          mt: 0, 
                          pt: 2, 
                          borderTop: `1px solid ${theme.palette.divider}`,
                          animation: expandedCards[stat.title] ? 'fadeInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                          '@keyframes fadeInUp': {
                            from: { opacity: 0, transform: 'translateY(-15px)', visibility: 'hidden' },
                            to: { opacity: 1, transform: 'translateY(0)', visibility: 'visible' },
                          },
                        }}>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            gap: 2
                          }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 0.5
                            }}>
                              <FarsiNumber sx={{ 
                                fontWeight: 700, 
                                fontSize: '1.1rem', 
                                color: 'primary.main',
                                minWidth: '20px',
                                textAlign: 'center'
                              }}>
                                {scenarioStats.total}
                              </FarsiNumber>
                              <Typography variant="caption" sx={{ 
                                color: 'text.secondary', 
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                lineHeight: 1.2
                              }}>
                                {t('dashboard.stats.totalScenarios')}
                              </Typography>
                            </Box>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 0.5
                            }}>
                              <FarsiNumber sx={{ 
                                fontWeight: 700, 
                                fontSize: '1.1rem', 
                                color: 'primary.main',
                                minWidth: '20px',
                                textAlign: 'center'
                              }}>
                                {scenarioStats.activeCount}
                              </FarsiNumber>
                              <Typography variant="caption" sx={{ 
                                color: 'text.secondary', 
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                lineHeight: 1.2
                              }}>
                                {t('dashboard.stats.active')}
                              </Typography>
                            </Box>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 0.5
                            }}>
                              <FarsiNumber sx={{ 
                                fontWeight: 700, 
                                fontSize: '1.1rem', 
                                color: 'error.main',
                                minWidth: '20px',
                                textAlign: 'center'
                              }}>
                                {scenarioStats.inactiveCount}
                              </FarsiNumber>
                              <Typography variant="caption" sx={{ 
                                color: 'text.secondary', 
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                lineHeight: 1.2
                              }}>
                                {t('dashboard.stats.inactive')}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Fade>
                    </Collapse>
                  </Box>
                )}

                {/* نمودار نیروهای موجود */}
                {stat.title === t('dashboard.stats.availableForces') && (
                  <Box>
                    {/* نمودار پیشرفت */}
                    <Box sx={{ 
                      height: 8, 
                      borderRadius: 4, 
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      overflow: 'hidden',
                      position: 'relative',
                      mb: 1.5
                    }}>
                      <Box
                        sx={{
                          height: '100%',
                          width: `${forceStats.iranianPercent}%`,
                          background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.8)}, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
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
                    
                    {/* نمایش آمار اصلی */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      minHeight: '28px',
                      mb: 3
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        flex: 1
                      }}>
                        <FarsiNumber sx={{ 
                          fontWeight: 700, 
                          fontSize: '1rem', 
                          color: 'primary.main',
                          minWidth: '20px',
                          textAlign: 'center'
                        }}>
                          {forceStats.iranianPercent}
                        </FarsiNumber>
                        <Typography variant="caption" sx={{ 
                          fontWeight: 600, 
                          fontSize: '0.85rem', 
                          color: 'primary.main',
                          lineHeight: 1.2
                        }}>
                          % {t('dashboard.stats.iranian')}
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        flex: 1,
                        justifyContent: 'flex-end'
                      }}>
                        <FarsiNumber sx={{ 
                          fontWeight: 700, 
                          fontSize: '1rem', 
                          color: 'text.secondary',
                          minWidth: '20px',
                          textAlign: 'center'
                        }}>
                          {forceStats.foreignPercent}
                        </FarsiNumber>
                        <Typography variant="caption" sx={{ 
                          fontWeight: 600, 
                          fontSize: '0.85rem', 
                          color: 'text.secondary',
                          lineHeight: 1.2
                        }}>
                          % {t('dashboard.stats.foreign')}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* محتوای کشویی */}
                    <Collapse in={expandedCards[stat.title]} timeout={300} unmountOnExit appear>
                      <Fade in={expandedCards[stat.title]} timeout={300} appear>
                        <Box sx={{ 
                          mt: 0, 
                          pt: 2, 
                          borderTop: `1px solid ${theme.palette.divider}`,
                          animation: expandedCards[stat.title] ? 'fadeInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                          '@keyframes fadeInUp': {
                            from: { opacity: 0, transform: 'translateY(-15px)', visibility: 'hidden' },
                            to: { opacity: 1, transform: 'translateY(0)', visibility: 'visible' },
                          },
                        }}>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            gap: 2
                          }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 0.5
                            }}>
                              <FarsiNumber sx={{ 
                                fontWeight: 700, 
                                fontSize: '1.1rem', 
                                color: 'primary.main',
                                minWidth: '20px',
                                textAlign: 'center'
                              }}>
                                {forceStats.iranianCount}
                              </FarsiNumber>
                              <Typography variant="caption" sx={{ 
                                color: 'text.secondary', 
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                lineHeight: 1.2
                              }}>
                                {t('dashboard.stats.iran')}
                              </Typography>
                            </Box>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 0.5
                            }}>
                              <FarsiNumber sx={{ 
                                fontWeight: 700, 
                                fontSize: '1.1rem', 
                                color: 'primary.main',
                                minWidth: '20px',
                                textAlign: 'center'
                              }}>
                                {forceStats.foreignCount}
                              </FarsiNumber>
                              <Typography variant="caption" sx={{ 
                                color: 'text.secondary', 
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                lineHeight: 1.2
                              }}>
                                {t('dashboard.stats.otherCountries')}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Fade>
                    </Collapse>
                  </Box>
                )}

                {/* نمودار عملیات در حال اجرا */}
                {stat.title === t('dashboard.stats.ongoingOperations') && (
                  <Box>
                    {/* نمودارهای خطی افقی */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 1
                    }}>
                      {[
                        { role: 'commander', color: theme.palette.primary.main, label: t('dashboard.stats.commander'), count: operationStats.commanderCount },
                        { role: 'operator', color: '#2196f3', label: t('dashboard.stats.operator'), count: operationStats.operatorCount },
                        { role: 'viewer', color: theme.palette.warning.main, label: t('dashboard.stats.viewer'), count: operationStats.viewerCount },
                      ].map(item => {
                        const maxCount = Math.max(operationStats.commanderCount, operationStats.operatorCount, operationStats.viewerCount);
                        const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                        return (
                          <Box key={item.role} sx={{ 
                            flex: 1,
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 0.5
                          }}>
                            <Box sx={{ 
                              width: '100%',
                              height: 8, 
                              borderRadius: 4, 
                              backgroundColor: alpha(item.color, 0.1),
                              overflow: 'hidden',
                              position: 'relative',
                              mb: 1.5
                            }}>
                              <Box
                                sx={{
                                  height: '100%',
                                  width: `${percentage}%`,
                                  background: `linear-gradient(90deg, ${alpha(item.color, 0.8)}, ${item.color}, ${item.color}dd)`,
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
                          </Box>
                        );
                      })}
                    </Box>
                    
                    {/* نمایش آمار اصلی */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      minHeight: '28px',
                      mb: 3
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        flex: 1
                      }}>
                        <FarsiNumber sx={{ 
                          fontWeight: 700, 
                          fontSize: '1rem', 
                          color: 'primary.main',
                          minWidth: '20px',
                          textAlign: 'center'
                        }}>
                          {operationStats.commanderCount}
                        </FarsiNumber>
                        <Typography variant="caption" sx={{ 
                          fontWeight: 600, 
                          fontSize: '0.85rem', 
                          color: 'primary.main',
                          lineHeight: 1.2
                        }}>
                          {t('dashboard.stats.commander')}
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        flex: 1,
                        justifyContent: 'center'
                      }}>
                        <FarsiNumber sx={{ 
                          fontWeight: 700, 
                          fontSize: '1rem', 
                          color: '#2196f3',
                          minWidth: '20px',
                          textAlign: 'center'
                        }}>
                          {operationStats.operatorCount}
                        </FarsiNumber>
                        <Typography variant="caption" sx={{ 
                          fontWeight: 600, 
                          fontSize: '0.85rem', 
                          color: '#2196f3',
                          lineHeight: 1.2
                        }}>
                          {t('dashboard.stats.operator')}
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        flex: 1,
                        justifyContent: 'flex-end'
                      }}>
                        <FarsiNumber sx={{ 
                          fontWeight: 700, 
                          fontSize: '1rem', 
                          color: 'warning.main',
                          minWidth: '20px',
                          textAlign: 'center'
                        }}>
                          {operationStats.viewerCount}
                        </FarsiNumber>
                        <Typography variant="caption" sx={{ 
                          fontWeight: 600, 
                          fontSize: '0.85rem', 
                          color: 'warning.main',
                          lineHeight: 1.2
                        }}>
                          {t('dashboard.stats.viewer')}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* محتوای کشویی */}
                    <Collapse in={expandedCards[stat.title]} timeout={300} unmountOnExit appear>
                      <Fade in={expandedCards[stat.title]} timeout={300} appear>
                        <Box sx={{ 
                          mt: 0, 
                          pt: 2, 
                          borderTop: `1px solid ${theme.palette.divider}`,
                          animation: expandedCards[stat.title] ? 'fadeInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                          '@keyframes fadeInUp': {
                            from: { opacity: 0, transform: 'translateY(-15px)', visibility: 'hidden' },
                            to: { opacity: 1, transform: 'translateY(0)', visibility: 'visible' },
                          },
                        }}>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            gap: 2
                          }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 0.5
                            }}>
                              <FarsiNumber sx={{ 
                                fontWeight: 700, 
                                fontSize: '1.1rem',
                                color: 'primary.main',
                                minWidth: '20px',
                                textAlign: 'center'
                              }}>
                                {operationStats.commanderCount}
                              </FarsiNumber>
                              <Typography variant="caption" sx={{ 
                                color: 'text.secondary', 
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                lineHeight: 1.2
                              }}>
                                {t('dashboard.stats.commander')}
                              </Typography>
                            </Box>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 0.5
                            }}>
                              <FarsiNumber sx={{ 
                                fontWeight: 700, 
                                fontSize: '1.1rem',
                                color: '#2196f3',
                                minWidth: '20px',
                                textAlign: 'center'
                              }}>
                                {operationStats.operatorCount}
                              </FarsiNumber>
                              <Typography variant="caption" sx={{ 
                                color: 'text.secondary', 
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                lineHeight: 1.2
                              }}>
                                {t('dashboard.stats.operator')}
                              </Typography>
                            </Box>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 0.5
                            }}>
                              <FarsiNumber sx={{ 
                                fontWeight: 700, 
                                fontSize: '1.1rem',
                                color: 'warning.main',
                                minWidth: '20px',
                                textAlign: 'center'
                              }}>
                                {operationStats.viewerCount}
                              </FarsiNumber>
                              <Typography variant="caption" sx={{ 
                                color: 'text.secondary', 
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                lineHeight: 1.2
                              }}>
                                {t('dashboard.stats.viewer')}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Fade>
                    </Collapse>
                  </Box>
                )}

                {/* نمودار هشدارهای امنیتی */}
                {stat.title === t('dashboard.stats.securityAlerts') && (
                  <Box>
                    {/* نمودار پیشرفت */}
                    <Box sx={{ 
                      height: 8, 
                      borderRadius: 4, 
                      backgroundColor: alpha(theme.palette.warning.main, 0.1),
                      overflow: 'hidden',
                      position: 'relative',
                      mb: 1.5
                    }}>
                      <Box
                        sx={{
                          height: '100%',
                          width: `${alertStats.todayCount > 0 ? Math.min(alertStats.todayCount * 20, 100) : 10}%`,
                          background: `linear-gradient(90deg, ${alpha(theme.palette.warning.main, 0.8)}, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
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
                    
                    {/* نمایش آمار اصلی */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      minHeight: '28px',
                      mb: 3
                    }}>
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flexWrap: 'nowrap'
                      }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            color: 'warning.main',
                            fontSize: '0.85rem',
                            lineHeight: 1.2
                          }}
                        >
                          {t('dashboard.stats.todayAlerts')}
                        </Typography>
                        <FarsiNumber sx={{ 
                          fontWeight: 700, 
                          fontSize: '1rem',
                          color: 'warning.main',
                          minWidth: '20px',
                          textAlign: 'center'
                        }}>
                          {alertStats.todayCount}
                        </FarsiNumber>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            color: 'warning.main',
                            fontSize: '0.85rem',
                            lineHeight: 1.2
                          }}
                        >
                          {t('dashboard.stats.alertItems')}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* محتوای کشویی */}
                    <Collapse in={expandedCards[stat.title]} timeout={300} unmountOnExit appear>
                      <Fade in={expandedCards[stat.title]} timeout={300} appear>
                        <Box sx={{ 
                          mt: 0, 
                          pt: 2, 
                          borderTop: `1px solid ${theme.palette.divider}`,
                          animation: expandedCards[stat.title] ? 'fadeInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                          '@keyframes fadeInUp': {
                            from: { opacity: 0, transform: 'translateY(-15px)', visibility: 'hidden' },
                            to: { opacity: 1, transform: 'translateY(0)', visibility: 'visible' },
                          },
                        }}>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            gap: 2
                          }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 0.5
                            }}>
                              <FarsiNumber sx={{ 
                                fontWeight: 700, 
                                fontSize: '1.1rem', 
                                color: 'warning.main',
                                minWidth: '20px',
                                textAlign: 'center'
                              }}>
                                {alertStats.todayCount}
                              </FarsiNumber>
                              <Typography variant="caption" sx={{ 
                                color: 'text.secondary', 
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                lineHeight: 1.2
                              }}>
                                {t('dashboard.stats.today')}
                              </Typography>
                            </Box>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 0.5
                            }}>
                              <FarsiNumber sx={{ 
                                fontWeight: 700, 
                                fontSize: '1.1rem', 
                                color: 'warning.main',
                                minWidth: '20px',
                                textAlign: 'center'
                              }}>
                                {alertStats.weekCount}
                              </FarsiNumber>
                              <Typography variant="caption" sx={{ 
                                color: 'text.secondary', 
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                lineHeight: 1.2
                              }}>
                                {t('dashboard.stats.thisWeek')}
                              </Typography>
                            </Box>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 0.5
                            }}>
                              <FarsiNumber sx={{ 
                                fontWeight: 700, 
                                fontSize: '1.1rem', 
                                color: 'warning.main',
                                minWidth: '20px',
                                textAlign: 'center'
                              }}>
                                {alertStats.monthCount}
                              </FarsiNumber>
                              <Typography variant="caption" sx={{ 
                                color: 'text.secondary', 
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                lineHeight: 1.2
                              }}>
                                {t('dashboard.stats.thisMonth')}
                              </Typography>
                            </Box>
                          </Box>
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
  const [summary, setSummary] = useState<DashboardSummary>(EMPTY_SUMMARY);
  const rawHeaderSettings = useAppSelector(selectHeaderSettings) as HeaderSettings | undefined;
  const rawDashboardModules = useAppSelector(selectDashboardModules) as DashboardModulesSettings | undefined;
  const headerSettings: HeaderSettings = rawHeaderSettings || {
    enabled: true,
    quoteMode: 'random',
    fixedQuoteIndex: null,
    martyrMode: 'random',
    fixedMartyrId: null,
    customQuoteText: null,
    customQuoteAuthor: null,
    customMartyrName: null,
    customMartyrPosition: null,
    customMartyrDate: null,
    customMartyrImage: null,
    entries: [],
    activeEntryId: null,
  };
  const dashboardModules: DashboardModulesSettings = rawDashboardModules || {
    showHeaderBanner: true,
    showStatArchivedScenarios: true,
    showStatAvailableForces: true,
    showStatOngoingOperations: true,
    showStatSecurityAlerts: true,
    showRecentActivities: true,
    showQuickAccess: true,
    showSystemStatus: true,
    showImportantNotices: true,
  };
  const [quote, setQuote] = useState<Quote>(getRandomQuote('wisdom'));
  const [martyr, setMartyr] = useState<Martyr>(getRandomMartyr());
  const { t } = useTranslation();
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const [starredActivities, setStarredActivities] = useState<number[]>([]);
  const [archivedActivities, setArchivedActivities] = useState<number[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<number[]>([]); // State جدید برای فعالیت‌های انتخاب شده

  // تعریف انیمیشن spin
  const resolveMartyrImageSrc = (image?: string) => {
    if (!image) return 'shahid.jpg';
    const trimmed = image.trim();
    if (!trimmed) return 'shahid.jpg';
    if (trimmed.startsWith('data:image/')) return trimmed;
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('blob:') ||
      trimmed.startsWith('/')
    ) {
      return trimmed;
    }
    return trimmed;
  };

  const spinKeyframes = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  const loadSummary = async () => {
    setActivitiesLoading(true);
    try {
      setSummary(await dashboardApiService.getSummary());
    } finally {
      setActivitiesLoading(false);
    }
  };
  const handleRefreshActivities = () => { void loadSummary(); };
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
    
    // تنظیم هدر زیارتی بر اساس تنظیمات کاربر
    const effectiveHeader: HeaderSettings = rawHeaderSettings || {
      enabled: true,
      quoteMode: 'random',
      fixedQuoteIndex: null,
      martyrMode: 'random',
      fixedMartyrId: null,
      customQuoteText: null,
      customQuoteAuthor: null,
      customMartyrName: null,
      customMartyrPosition: null,
      customMartyrDate: null,
      customMartyrImage: null,
      entries: [],
      activeEntryId: null,
    };

    if (effectiveHeader.enabled) {
      const activeEntry = (effectiveHeader.entries || []).find(
        entry => entry.id === effectiveHeader.activeEntryId
      );

      if (activeEntry) {
        setQuote({
          text: activeEntry.quoteText,
          author: activeEntry.personName,
        });

        setMartyr({
          id: activeEntry.id,
          name: activeEntry.personName,
          position: activeEntry.personPosition || '',
          martyrdomDate: '',
          image: activeEntry.personImage || 'shahid.jpg',
        });
        return;
      }

      // سخن
      if (
        effectiveHeader.quoteMode === 'fixed' &&
        effectiveHeader.fixedQuoteIndex !== null &&
        quotes[effectiveHeader.fixedQuoteIndex]
      ) {
        setQuote(quotes[effectiveHeader.fixedQuoteIndex]);
      } else if (
        effectiveHeader.quoteMode === 'custom' &&
        effectiveHeader.customQuoteText &&
        effectiveHeader.customQuoteAuthor
      ) {
        setQuote({
          text: effectiveHeader.customQuoteText,
          author: effectiveHeader.customQuoteAuthor,
        });
      } else {
        setQuote(getRandomQuote());
      }

      // شهید
      if (
        effectiveHeader.martyrMode === 'fixed' &&
        effectiveHeader.fixedMartyrId !== null
      ) {
        const fixedMartyr = martyrs.find(m => m.id === effectiveHeader.fixedMartyrId);
        setMartyr(fixedMartyr || getRandomMartyr());
      } else if (
        effectiveHeader.martyrMode === 'custom' &&
        effectiveHeader.customMartyrName
      ) {
        setMartyr({
          id: -1,
          name: effectiveHeader.customMartyrName,
          position: effectiveHeader.customMartyrPosition || '',
          martyrdomDate: effectiveHeader.customMartyrDate || '',
          image: effectiveHeader.customMartyrImage || 'shahid.jpg',
        });
      } else {
        setMartyr(getRandomMartyr());
      }
    }
  }, [dispatch, user, rawHeaderSettings, t]);

  useEffect(() => {
    void loadSummary();
    const timer = window.setInterval(() => void loadSummary(), 30_000);
    return () => window.clearInterval(timer);
  }, [user?.id]);

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
    const legacyActivities: Activity[] = [
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
    void legacyActivities;
    const allActivities: Activity[] = summary.activities.map((activity, index) => ({
      id: index + 1,
      title: activity.title,
      description: activity.description,
      time: new Date(activity.occurredAt).toLocaleString('fa-IR'),
      avatar: activity.kind === 'scenario' ? <AssignmentIcon /> :
        activity.kind === 'user' ? <Group /> : <PeopleIcon />,
      color: activity.kind === 'scenario' ? '#1976d2' :
        activity.kind === 'user' ? '#9c27b0' : '#2e7d32',
      roles: ['admin', 'commander', 'operator', 'viewer'],
    }));
    
    // اگر showArchived true باشد، همه فعالیت‌ها نمایش داده می‌شوند
    // در غیر این صورت، فقط فعالیت‌های آرشیو نشده نمایش داده می‌شوند
    const filteredActivities = showArchived 
      ? allActivities 
      : allActivities.filter(activity => !archivedActivities.includes(activity.id));
    
    // فیلتر فعالیت‌ها بر اساس نقش کاربر
    return filteredActivities.filter(activity => user && activity.roles.includes(user.role));
  }, [user, archivedActivities, showArchived, t, summary.activities]);

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

    // فیلتر اقدامات سریعع بر اساس نقش کاربر
    return allActions.filter(action => user && action.roles.includes(user.role));
  }, [navigate, user, t]);

  // اطلاعات وضعیت سیستم (فقط برای مدیر)
  const systemStatus = summary.systemStatus;

  const isVisible = (key: DashboardSummary['visibleCards'][number]) =>
    summary.visibleCards.includes(key);
  const showStatsSection =
    (dashboardModules.showStatArchivedScenarios && isVisible('archived_scenarios')) ||
    (dashboardModules.showStatAvailableForces && isVisible('available_forces')) ||
    (dashboardModules.showStatOngoingOperations && isVisible('ongoing_operations')) ||
    (dashboardModules.showStatSecurityAlerts && isVisible('security_alerts'));
  const showQuickAccessSection = dashboardModules.showQuickAccess && quickActions.length > 0;
  const showSystemStatusSection = dashboardModules.showSystemStatus && isVisible('system_status');
  const showImportantNoticesSection =
    dashboardModules.showImportantNotices && isVisible('important_notices');
  const showRightColumn = showQuickAccessSection || showSystemStatusSection || showImportantNoticesSection;
  const unifiedAccent = theme.palette.primary.main;
  const unifiedPanelSurface = `linear-gradient(135deg, ${alpha(unifiedAccent, 0.07)}, ${alpha(unifiedAccent, 0.04)})`;
  const unifiedPanelBorder = `1px solid ${alpha(unifiedAccent, 0.24)}`;
  const unifiedPanelSx = {
    borderRadius: 2,
    overflow: 'hidden',
    background: unifiedPanelSurface,
    border: unifiedPanelBorder,
    boxShadow: 'none',
  };

  return (
    <Box sx={{ p: 4, minHeight: '100%' }}>
      
      {/* Header */}
      {dashboardModules.showHeaderBanner && headerSettings.enabled && (
      <Card 
        component={Paper}
        elevation={0}
        sx={{ 
          ...unifiedPanelSx,
          mb: 4, 
          p: 3,
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
                    src={resolveMartyrImageSrc(martyr.image)}
                    alt={martyr.name}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src.endsWith('/shahid.jpg') || target.src.endsWith('\\shahid.jpg')) return;
                      target.src = 'shahid.jpg';
                    }}
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
      )}

      {/* آمار */}
      {showStatsSection && (
        <DashboardStats
          showStatArchivedScenarios={dashboardModules.showStatArchivedScenarios && isVisible('archived_scenarios')}
          showStatAvailableForces={dashboardModules.showStatAvailableForces && isVisible('available_forces')}
          showStatOngoingOperations={dashboardModules.showStatOngoingOperations && isVisible('ongoing_operations')}
          showStatSecurityAlerts={dashboardModules.showStatSecurityAlerts && isVisible('security_alerts')}
          summary={summary}
        />
      )}

      {((dashboardModules.showRecentActivities && isVisible('recent_activities')) || showRightColumn) && (
      <Grid container spacing={3}>
        {/* فعالیت‌های اخیر */}
        {dashboardModules.showRecentActivities && isVisible('recent_activities') && (
        <Grid item xs={12} md={showRightColumn ? 8 : 12}>
          <Paper
            sx={{
              ...unifiedPanelSx,
            }}
          >
            <Box
              sx={{
                p: 2,
                borderBottom: `1px solid ${alpha(unifiedAccent, 0.2)}`,
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
        )}

        {/* دسترسی سریع و وضعیت سیستم */}
        {showRightColumn && (
        <Grid item xs={12} md={dashboardModules.showRecentActivities && isVisible('recent_activities') ? 4 : 12}>
          {showQuickAccessSection && (
            <Paper
              sx={{
                ...unifiedPanelSx,
                mb: showSystemStatusSection || showImportantNoticesSection ? 3 : 0,
              }}
            >
              <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(unifiedAccent, 0.2)}` }}>
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
                          border: `1px solid ${alpha(unifiedAccent, 0.18)}`,
                          background: alpha(unifiedAccent, 0.03),
                          '&:hover': {
                            bgcolor: alpha(unifiedAccent, 0.07),
                            transform: 'scale(1.02)',
                          },
                        }}
                        onClick={action.onClick}
                      >
                        <Avatar
                          sx={{
                            bgcolor: alpha(unifiedAccent, 0.12),
                            color: unifiedAccent,
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
          )}

          {/* وضعیت سیستم - فقط برای مدیر */}
          {showSystemStatusSection && (
            <Paper
              sx={{
                ...unifiedPanelSx,
              }}
            >
              <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(unifiedAccent, 0.2)}` }}>
                <FarsiTypography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('dashboard.systemStatus.title')}
                </FarsiTypography>
              </Box>
              <Box sx={{ p: 2 }}>
                {systemStatus.map((status, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <FarsiTypography variant="body2">{status.name}</FarsiTypography>
                      <FarsiTypography variant="body2">
                        <TransformFarsiNumbers>{status.value}%</TransformFarsiNumbers>
                      </FarsiTypography>
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
          {showImportantNoticesSection && (
            <Paper
              sx={{
                ...unifiedPanelSx,
                mt: showQuickAccessSection || showSystemStatusSection ? 3 : 0,
              }}
            >
              <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(unifiedAccent, 0.2)}` }}>
                <FarsiTypography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('dashboard.importantNotices')}
                </FarsiTypography>
              </Box>
              <Box sx={{ p: 2 }}>
                {summary.notices.map((notice, index) => (
                  <Alert
                    key={`${notice.severity}-${index}`}
                    severity={notice.severity}
                    sx={{ mb: index < summary.notices.length - 1 ? 2 : 0 }}
                  >
                    <FarsiTypography variant="body2">{notice.message}</FarsiTypography>
                  </Alert>
                ))}
              </Box>
            </Paper>
          )}
        </Grid>
        )}
      </Grid>
      )}
    </Box>
  );
};

const spin = `@keyframes spin { 100% { transform: rotate(360deg); } }`;

export default HomePage;
