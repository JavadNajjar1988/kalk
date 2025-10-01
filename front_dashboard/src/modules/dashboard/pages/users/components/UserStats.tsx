import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Group,
  Public,
  AdminPanelSettings,
  Schedule,
  ExpandMore,
} from '@mui/icons-material';

import { UserProfile, StatItem } from '../types';
import { convertToFarsiNumbers } from '../utils/formatters';
import { COUNTRY_CODES } from '../utils/geo-data';

export const UserStats: React.FC<{ users: UserProfile[] }> = ({ users }) => {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const theme = useTheme();

  const handleCardExpand = (cardTitle: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardTitle]: !prev[cardTitle]
    }));
  };

  const stats: StatItem[] = [
    {
      title: 'کل کاربران',
      value: users.length,
      icon: <Group />,
      color: 'warning', // تغییر از primary به warning (زرد)
      gradient: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
      subtitle: (() => {
        const activeCount = users.filter(u => u.isActive).length;
        const inactiveCount = users.length - activeCount;
        const activePercent = users.length > 0 ? Math.round((activeCount / users.length) * 100) : 0;
        return `${convertToFarsiNumbers(activePercent)}% فعال | ${convertToFarsiNumbers(inactiveCount)} غیرفعال`;
      })(),
    },
    {
      title: 'توزیع جغرافیایی',
      value: users.filter(u => u.nationality === 'iranian').length,
      icon: <Public />,
      color: 'success',
      gradient: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
      subtitle: (() => {
        const iranianCount = users.filter(u => u.nationality === 'iranian').length;
        const foreignCount = users.filter(u => u.nationality === 'non-iranian').length;
        const iranianPercent = users.length > 0 ? Math.round((iranianCount / users.length) * 100) : 0;
        const foreignPercent = users.length > 0 ? Math.round((foreignCount / users.length) * 100) : 0;
        return `${convertToFarsiNumbers(iranianPercent)}% ایرانی | ${convertToFarsiNumbers(foreignPercent)}% خارجی`;
      })(),
    },
    {
      title: 'توزیع نقش‌ها',
      value: users.filter(u => u.role === 'admin').length,
      icon: <AdminPanelSettings />,
      color: 'error',
      gradient: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
      subtitle: (() => {
        const adminCount = users.filter(u => u.role === 'admin').length;
        const commanderCount = users.filter(u => u.role === 'commander').length;
        const operatorCount = users.filter(u => u.role === 'operator').length;
        const viewerCount = users.filter(u => u.role === 'viewer').length;
        return `${convertToFarsiNumbers(commanderCount)} فرمانده | ${convertToFarsiNumbers(operatorCount)} اپراتور | ${convertToFarsiNumbers(viewerCount)} بیننده`;
      })(),
    },
    {
      title: 'فعالیت کاربران',
      value: users.filter(u => 
        u.lastLogin && 
        new Date(u.lastLogin).toDateString() === new Date().toDateString()
      ).length,
      icon: <Schedule />,
      color: 'info',
      gradient: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
      subtitle: (() => {
        const todayCount = users.filter(u => 
          u.lastLogin && 
          new Date(u.lastLogin).toDateString() === new Date().toDateString()
        ).length;
        const weekCount = users.filter(u => 
          u.lastLogin && 
          new Date(u.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length;
        const todayPercent = users.length > 0 ? Math.round((todayCount / users.length) * 100) : 0;
        return `${convertToFarsiNumbers(todayPercent)}% امروز | ${convertToFarsiNumbers(weekCount)} این هفته`;
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
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7))',
              backdropFilter: 'blur(10px)',
              borderRadius: 4,
              boxShadow: theme.palette.mode === 'dark' 
                ? `0 8px 32px ${alpha(theme.palette.common.black, 0.3)}`
                : '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: theme.palette.mode === 'dark' 
                ? `1px solid ${alpha(theme.palette.divider, 0.2)}`
                : '1px solid rgba(255, 255, 255, 0.2)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.palette.mode === 'dark' 
                  ? `0 12px 40px ${alpha(theme.palette.common.black, 0.4)}`
                  : '0 12px 40px rgba(0, 0, 0, 0.15)',
              },
              transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              position: 'relative',
              overflow: 'hidden',
              height: (stat.title === 'کل کاربران' || stat.title === 'توزیع جغرافیایی' || stat.title === 'توزیع نقش‌ها' || stat.title === 'فعالیت کاربران') && expandedCards[stat.title] ? 200 : 120,
            }}
          >
            <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {/* Header with icon and title */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    sx={{
                      bgcolor: stat.color === 'warning' && stat.title === 'کل کاربران' 
                        ? '#ff9800' // رنگ زرد ثابت
                        : `${stat.color}.main`,
                      width: 36,
                      height: 36,
                      boxShadow: stat.color === 'warning' && stat.title === 'کل کاربران'
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
                    {stat.title !== 'کل کاربران' && stat.title !== 'توزیع جغرافیایی' && stat.title !== 'توزیع نقش‌ها' && stat.title !== 'فعالیت کاربران' && (
                      <Typography 
                        variant="h4" 
                        component="div" 
                        sx={{ 
                          fontWeight: 800,
                          color: 'text.primary',
                          lineHeight: 1,
                          fontSize: '1.5rem',
                          mt: 0.2,
                        }}
                      >
                        {convertToFarsiNumbers(stat.value)}
                  </Typography>
                    )}
                </Box>
                </Box>
                
                {/* Percentage or status indicator */}
                <Box sx={{ textAlign: 'right' }}>
                  {stat.title !== 'کل کاربران' && stat.title !== 'توزیع جغرافیایی' && stat.title !== 'توزیع نقش‌ها' && stat.title !== 'فعالیت کاربران' && (
                    <Typography 
                      variant="caption" 
                  sx={{
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        color: `${stat.color}.main`,
                        backgroundColor: `${stat.color}.50`,
                        padding: '2px 8px',
                        borderRadius: 2,
                        display: 'inline-block',
                      }}
                    >
                      {stat.title === 'فعالیت روزانه' && `${users.filter(u => u.lastLogin && new Date(u.lastLogin).toDateString() === new Date().toDateString()).length.toLocaleString('fa-IR')} امروز`}
                    </Typography>
                  )}
                  
                  {/* مثلث کشویی برای کل کاربران و توزیع جغرافیایی و توزیع نقش‌ها و فعالیت کاربران */}
                  {(stat.title === 'کل کاربران' || stat.title === 'توزیع جغرافیایی' || stat.title === 'توزیع نقش‌ها' || stat.title === 'فعالیت کاربران') && (
                    <IconButton
                      size="small"
                      onClick={() => handleCardExpand(stat.title)}
                      sx={{
                        color: 'text.secondary',
                        transform: expandedCards[stat.title] ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.action.hover, 0.04),
                        },
                      }}
                    >
                      <ExpandMore />
                    </IconButton>
                  )}
                </Box>
              </Box>

              {/* Chart section */}
              <Box sx={{ width: '100%', mt: 'auto' }}>
                {/* نمودار کل کاربران */}
                {stat.title === 'کل کاربران' && (
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
                          width: `${users.length > 0 ? (users.filter(u => u.isActive).length / users.length) * 100 : 0}%`,
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
                    
                    {/* درصدها زیر نوار */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          color: '#ff9800', // رنگ متن زرد ثابت
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        {(users.length > 0 ? Math.round((users.filter(u => u.isActive).length / users.length) * 100) : 0).toLocaleString('fa-IR')}% فعال
                      </Typography>
                      
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          color: 'text.secondary',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        {(users.length > 0 ? Math.round(((users.length - users.filter(u => u.isActive).length) / users.length) * 100) : 0).toLocaleString('fa-IR')}% غیرفعال
                      </Typography>
                    </Box>
                    
                    {/* محتوای کشویی */}
                    {expandedCards[stat.title] && (
                      <Box sx={{ 
                        mt: 2, 
                        pt: 2, 
                        borderTop: `1px solid ${theme.palette.divider}`,
                        animation: 'fadeInUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        '@keyframes fadeInUp': {
                          from: { 
                            opacity: 0, 
                            transform: 'translateY(-15px)',
                            visibility: 'hidden' 
                          },
                          to: { 
                            opacity: 1, 
                            transform: 'translateY(0)',
                            visibility: 'visible' 
                          },
                        },
                      }}>
                        <Grid container spacing={2}>
                          <Grid item xs={4}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                {convertToFarsiNumbers(users.length)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                کل کاربران
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={4}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                                {convertToFarsiNumbers(users.filter(u => u.isActive).length)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                فعال
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={4}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>
                                {convertToFarsiNumbers(users.length - users.filter(u => u.isActive).length)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                غیرفعال
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </Box>
                )}

                {/* نمودار توزیع جغرافیایی */}
                {stat.title === 'توزیع جغرافیایی' && (
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
                          width: `${users.length > 0 ? (users.filter(u => u.nationality === 'iranian').length / users.length) * 100 : 0}%`,
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
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        {(users.length > 0 ? Math.round((users.filter(u => u.nationality === 'iranian').length / users.length) * 100) : 0).toLocaleString('fa-IR')}% ایرانی
                      </Typography>
                      
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          color: 'text.secondary',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        {(users.length > 0 ? Math.round((users.filter(u => u.nationality === 'non-iranian').length / users.length) * 100) : 0).toLocaleString('fa-IR')}% خارجی
                      </Typography>
                    </Box>
                    
                    {/* محتوای کشویی */}
                    {expandedCards[stat.title] && (
                      <Box sx={{ 
                        mt: 2, 
                        pt: 2, 
                        borderTop: `1px solid ${theme.palette.divider}`,
                        animation: 'fadeInUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        '@keyframes fadeInUp': {
                          from: { opacity: 0, transform: 'translateY(-15px)', visibility: 'hidden' },
                          to: { opacity: 1, transform: 'translateY(0)', visibility: 'visible' },
                        },
                      }}>
                        <Grid container spacing={2}>
                          {(() => {
                            // گروه‌بندی کاربران بر اساس کشور
                            const activeUsers = users.filter(u => u.isActive);
                            const countryGroups = activeUsers.reduce((acc, user) => {
                              // پیدا کردن کشور بر اساس nationality
                              let countryName = 'نامشخص';
                              if (user.nationality === 'iranian') {
                                countryName = 'ایران';
                              } else if (user.birthPlace?.country) {
                                const country = COUNTRY_CODES.find(c => c.code === user.birthPlace?.country);
                                countryName = country?.nameFa || 'نامشخص';
                              }
                              
                              if (!acc[countryName]) {
                                acc[countryName] = 0;
                              }
                              acc[countryName]++;
                              return acc;
                            }, {} as Record<string, number>);
                            
                            // فقط کشورهایی که حداقل یک کاربر دارند
                            const countriesWithUsers = Object.entries(countryGroups).filter(([_, count]) => count > 0);
                            
                            return countriesWithUsers.map(([country, count], index) => (
                              <Grid item xs={6} key={index}>
                                <Box sx={{ textAlign: 'center' }}>
                                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                                    {count.toLocaleString('fa-IR')}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                    {country}
                                  </Typography>
                                </Box>
                              </Grid>
                            ));
                          })()}
                        </Grid>
                      </Box>
                    )}
                  </Box>
                )}

                {/* نمودار توزیع نقش‌ها */}
                {stat.title === 'توزیع نقش‌ها' && (
                  <Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'end', height: 40, mb: 1 }}>
                      {[
                        { role: 'commander', color: theme.palette.success.main, gradient: `linear-gradient(180deg, ${theme.palette.success.light}, ${theme.palette.success.main})`, label: 'فرمانده' },
                        { role: 'operator', color: theme.palette.primary.main, gradient: `linear-gradient(180deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`, label: 'اپراتور' },
                        { role: 'viewer', color: theme.palette.warning.main, gradient: `linear-gradient(180deg, ${theme.palette.warning.light}, ${theme.palette.warning.main})`, label: 'بیننده' },
                      ].map((item) => {
                        const count = users.filter(u => u.role === item.role).length;
                        const maxCount = Math.max(...[
                          users.filter(u => u.role === 'commander').length,
                          users.filter(u => u.role === 'operator').length,
                          users.filter(u => u.role === 'viewer').length,
                        ], 1);
                        const heightPercent = (count / maxCount) * 100;
                        const actualHeight = count > 0 ? Math.min(count * 2, 25) : 2;
                        
                        return (
                          <Box key={item.role} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: '100%',
                                height: `${actualHeight}px`,
                                background: item.gradient,
                                borderRadius: '4px 4px 0 0',
                                position: 'relative',
                                '&::after': count > 0 ? {
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
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontSize: '0.65rem',
                                color: 'text.secondary',
                                mt: 0.05,
                                textAlign: 'center',
                              }}
                            >
                              {item.label}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                    
                    {/* محتوای کشویی */}
                    {expandedCards[stat.title] && (
                      <Box sx={{ 
                        mt: 2, 
                        pt: 2, 
                        borderTop: `1px solid ${theme.palette.divider}`,
                        animation: 'fadeInUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        '@keyframes fadeInUp': {
                          from: { opacity: 0, transform: 'translateY(-15px)', visibility: 'hidden' },
                          to: { opacity: 1, transform: 'translateY(0)', visibility: 'visible' },
                        },
                      }}>
                        <Grid container spacing={2}>
                          <Grid item xs={4}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                                {convertToFarsiNumbers(users.filter(u => u.role === 'commander').length)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                فرمانده
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={4}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                {convertToFarsiNumbers(users.filter(u => u.role === 'operator').length)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                اپراتور
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={4}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>
                                {convertToFarsiNumbers(users.filter(u => u.role === 'viewer').length)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                بیننده
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </Box>
                )}

                {/* متن کاربر واردشده امروز */}
                {stat.title === 'فعالیت کاربران' && (
                  <Box>
                    {/* متن ساده */}
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
                        کاربر واردشده امروز
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                          {convertToFarsiNumbers(users.filter(u => u.lastLogin && new Date(u.lastLogin).toDateString() === new Date().toDateString()).length)}
                        </span>
                        نفر
                      </Typography>
                    </Box>
                    
                    {/* محتوای کشویی */}
                    {expandedCards[stat.title] && (
                      <Box sx={{ 
                        mt: 2, 
                        pt: 2, 
                        borderTop: `1px solid ${theme.palette.divider}`,
                        animation: 'fadeInUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        '@keyframes fadeInUp': {
                          from: { opacity: 0, transform: 'translateY(-15px)', visibility: 'hidden' },
                          to: { opacity: 1, transform: 'translateY(0)', visibility: 'visible' },
                        },
                      }}>
                        <Grid container spacing={2}>
                          <Grid item xs={4}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>
                                {convertToFarsiNumbers(users.filter(u => u.lastLogin && new Date(u.lastLogin).toDateString() === new Date().toDateString()).length)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                امروز
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={4}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>
                                {convertToFarsiNumbers(users.filter(u => u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                این هفته
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={4}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>
                                {convertToFarsiNumbers(users.filter(u => u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                                این ماه
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
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