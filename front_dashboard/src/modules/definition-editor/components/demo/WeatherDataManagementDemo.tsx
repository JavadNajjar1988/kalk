import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Alert,
  Divider,
  Paper,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CloudQueue as CloudIcon,
  AcUnit as SnowIcon,
  Thermostat as TempIcon,
  Air as WindIcon,
  Warning as WarningIcon,
  Visibility as VisibilityIcon,
  WbSunny as SunIcon,
  Thunderstorm as StormIcon,
} from '@mui/icons-material';
import { CategoryType } from '../../types';
import { loadWeatherData } from '../../data/loader';

interface WeatherStat {
  category: string;
  total: number;
  levels: { [key: number]: number };
  operationalImpact: string;
  criticalFactors: string[];
}

const WeatherDataManagementDemo: React.FC = () => {
  const [weatherStats, setWeatherStats] = useState<WeatherStat[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const data = await loadWeatherData('weather');
        
        // Calculate comprehensive statistics
        const stats: WeatherStat[] = [
          {
            category: 'شرایط جوی عمومی',
            total: data.filter(n => n.id.startsWith('WC')).length,
            levels: calculateLevelDistribution(data.filter(n => n.id.startsWith('WC'))),
            operationalImpact: 'تأثیر مستقیم بر دید و حرکت',
            criticalFactors: ['پوشش ابری', 'دید افقی', 'فشار جو']
          },
          {
            category: 'بارش و بارندگی',
            total: data.filter(n => n.id.startsWith('WP')).length,
            levels: calculateLevelDistribution(data.filter(n => n.id.startsWith('WP'))),
            operationalImpact: 'محدودیت در عملیات زمینی و هوایی',
            criticalFactors: ['شدت بارش', 'نوع بارش', 'مدت زمان']
          },
          {
            category: 'دما و حرارت',
            total: data.filter(n => n.id.startsWith('WT')).length,
            levels: calculateLevelDistribution(data.filter(n => n.id.startsWith('WT'))),
            operationalImpact: 'تأثیر بر عملکرد پرسنل و تجهیزات',
            criticalFactors: ['محدوده دمایی', 'تغییرات ناگهانی', 'تأثیر بر باتری']
          },
          {
            category: 'باد و جریانات هوایی',
            total: data.filter(n => n.id.startsWith('WW')).length,
            levels: calculateLevelDistribution(data.filter(n => n.id.startsWith('WW'))),
            operationalImpact: 'تأثیر بر دقت تیراندازی و پرواز',
            criticalFactors: ['سرعت باد', 'جهت باد', 'تلاطم']
          },
          {
            category: 'حوادث جوی ویژه',
            total: data.filter(n => n.id.startsWith('WS')).length,
            levels: calculateLevelDistribution(data.filter(n => n.id.startsWith('WS'))),
            operationalImpact: 'خطر بالا - نیاز به پروتکل اضطراری',
            criticalFactors: ['شدت رویداد', 'مدت زمان', 'پیش‌بینی']
          },
          {
            category: 'تأثیرات عملیاتی',
            total: data.filter(n => n.id.startsWith('WE')).length,
            levels: calculateLevelDistribution(data.filter(n => n.id.startsWith('WE'))),
            operationalImpact: 'راهنمای تصمیم‌گیری عملیاتی',
            criticalFactors: ['سطح محدودیت', 'نوع عملیات', 'منابع مورد نیاز']
          }
        ];
        
        setWeatherStats(stats);
      } catch (error) {
        console.error('Error loading weather stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const calculateLevelDistribution = (nodes: any[]) => {
    const distribution: { [key: number]: number } = {};
    const countNodes = (nodeList: any[]) => {
      nodeList.forEach(node => {
        distribution[node.level] = (distribution[node.level] || 0) + 1;
        if (node.children) {
          countNodes(node.children);
        }
      });
    };
    countNodes(nodes);
    return distribution;
  };

  const getCategoryIcon = (category: string) => {
    if (category.includes('عمومی')) return <CloudIcon color="primary" />;
    if (category.includes('بارش')) return <SnowIcon color="info" />;
    if (category.includes('دما')) return <TempIcon color="error" />;
    if (category.includes('باد')) return <WindIcon color="secondary" />;
    if (category.includes('حوادث')) return <StormIcon color="warning" />;
    if (category.includes('تأثیرات')) return <VisibilityIcon color="success" />;
    return <SunIcon />;
  };

  const getImpactColor = (impact: string) => {
    if (impact.includes('خطر بالا')) return 'error';
    if (impact.includes('محدودیت')) return 'warning';
    if (impact.includes('تأثیر مستقیم')) return 'info';
    return 'success';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>در حال بارگذاری داده‌های جامع آب و هوا...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color: 'white' }}>
        <Typography variant="h4" gutterBottom>
          🌤️ سیستم مدیریت جامع داده‌های آب و هوا
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          سیستم پیشرفته 6 سطحه برای مدیریت، تحلیل و پیش‌بینی تأثیرات آب و هوایی بر عملیات نظامی
        </Typography>
      </Paper>

      {/* Statistics Overview */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="h6">📊 آمار کلی سیستم</Typography>
        <Typography variant="body2">
          مجموع {weatherStats.reduce((sum, stat) => sum + stat.total, 0)} نود داده در 6 دسته‌بندی اصلی با پوشش کامل 6 سطح سلسله‌مراتبی
        </Typography>
      </Alert>

      {/* Category Cards */}
      <Grid container spacing={3}>
        {weatherStats.map((stat, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card elevation={3} sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  {getCategoryIcon(stat.category)}
                  <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold' }}>
                    {stat.category}
                  </Typography>
                </Box>
                
                <Box mb={2}>
                  <Chip 
                    label={`${stat.total} داده`} 
                    color="primary" 
                    size="small" 
                    sx={{ mr: 1 }}
                  />
                  <Chip 
                    label={`${Object.keys(stat.levels).length} سطح`} 
                    color="secondary" 
                    size="small" 
                  />
                </Box>

                <Alert 
                  severity={getImpactColor(stat.operationalImpact)} 
                  sx={{ mb: 2 }}
                >
                  <Typography variant="body2" fontWeight="bold">
                    تأثیر عملیاتی: {stat.operationalImpact}
                  </Typography>
                </Alert>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">جزئیات و عوامل کلیدی</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      توزیع سطح‌بندی:
                    </Typography>
                    {Object.entries(stat.levels).map(([level, count]) => (
                      <Chip 
                        key={level}
                        label={`سطح ${level}: ${count}`} 
                        variant="outlined" 
                        size="small" 
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      عوامل کلیدی:
                    </Typography>
                    <List dense>
                      {stat.criticalFactors.map((factor, idx) => (
                        <ListItem key={idx} sx={{ py: 0 }}>
                          <ListItemIcon sx={{ minWidth: 20 }}>
                            <WarningIcon fontSize="small" color="warning" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={factor} 
                            primaryTypographyProps={{ fontSize: '0.875rem' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Operational Guidelines */}
      <Paper elevation={2} sx={{ p: 3, mt: 4, bgcolor: 'grey.50' }}>
        <Typography variant="h5" gutterBottom color="primary.main" fontWeight="bold">
          🎯 راهنمای عملیاتی سیستم
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="success.main" gutterBottom>
                  ✅ مزایای سیستم 6 سطحه
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="پوشش جامع از کلی تا جزئی" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="تصمیم‌گیری دقیق‌تر عملیاتی" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="قابلیت پیش‌بینی پیشرفته" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="سازگاری با استانداردهای NATO" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="info.main" gutterBottom>
                  📋 نحوه استفاده
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="انتخاب دسته‌بندی اصلی (سطح 1)" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="بررسی زیرشاخه‌ها (سطوح 2-3)" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="تحلیل پارامترها (سطوح 4-5)" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="اعمال پروتکل‌ها (سطح 6)" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" color="warning.main" gutterBottom>
                  ⚠️ نکات مهم
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="بروزرسانی مداوم داده‌ها" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="هماهنگی با سیستم‌های رادار" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="آموزش پرسنل عملیاتی" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="پشتیبان‌گیری از تنظیمات" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Action Buttons */}
      <Box display="flex" justifyContent="center" gap={2} mt={4}>
        <Button 
          variant="contained" 
          color="primary" 
          size="large"
          onClick={() => window.location.reload()}
        >
          🔄 بروزرسانی داده‌ها
        </Button>
        <Button 
          variant="outlined" 
          color="secondary" 
          size="large"
        >
          📊 گزارش تفصیلی
        </Button>
        <Button 
          variant="outlined" 
          color="info" 
          size="large"
        >
          ⚙️ تنظیمات پیشرفته
        </Button>
      </Box>
    </Box>
  );
};

export default WeatherDataManagementDemo;