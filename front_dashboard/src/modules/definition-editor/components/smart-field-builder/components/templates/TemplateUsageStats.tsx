/**
 * Template Usage Statistics and Smart Recommendations Engine
 * Provides intelligent recommendations based on usage patterns and context
 */

import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Divider,
  Grid,
  Paper
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  Star as StarIcon,
  Visibility as ViewIcon,
  ThumbUp as LikeIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Schedule as RecentIcon,
  Lightbulb as SuggestionIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';

import { FieldTemplate } from './CriticalFieldTemplates';

interface TemplateStatsProps {
  templates: FieldTemplate[];
  currentCategory?: string;
  existingFields?: any[];
  onTemplateSelect?: (template: FieldTemplate) => void;
}

interface TemplateAnalytics {
  template: FieldTemplate;
  score: number;
  reasons: string[];
  trend: 'rising' | 'stable' | 'falling';
  efficiency: number;
  compatibility: number;
}

interface UsageStats {
  totalUsage: number;
  averageUsage: number;
  topPerformers: FieldTemplate[];
  recentlyPopular: FieldTemplate[];
  categoryStats: Record<string, number>;
  recommendations: TemplateAnalytics[];
}

const TemplateUsageStats: React.FC<TemplateStatsProps> = ({
  templates,
  currentCategory,
  existingFields = [],
  onTemplateSelect
}) => {
  const theme = useTheme();

  // Calculate comprehensive usage statistics
  const usageStats: UsageStats = useMemo(() => {
    const totalUsage = templates.reduce((sum, t) => sum + (t.usageCount || 0), 0);
    const averageUsage = totalUsage / templates.length;

    // Top performers (high usage)
    const topPerformers = templates
      .filter(t => (t.usageCount || 0) > averageUsage * 1.5)
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 5);

    // Recently popular (above average usage with critical status)
    const recentlyPopular = templates
      .filter(t => t.isCritical || (t.usageCount || 0) > averageUsage)
      .sort((a, b) => {
        const scoreA = (a.isCritical ? 1000 : 0) + (a.usageCount || 0);
        const scoreB = (b.isCritical ? 1000 : 0) + (b.usageCount || 0);
        return scoreB - scoreA;
      })
      .slice(0, 6);

    // Category usage statistics
    const categoryStats: Record<string, number> = {};
    templates.forEach(template => {
      const category = template.category;
      categoryStats[category] = (categoryStats[category] || 0) + (template.usageCount || 0);
    });

    // Smart recommendations
    const recommendations = generateRecommendations(templates, existingFields, currentCategory);

    return {
      totalUsage,
      averageUsage,
      topPerformers,
      recentlyPopular,
      categoryStats,
      recommendations
    };
  }, [templates, existingFields, currentCategory]);

  // Generate intelligent recommendations
  function generateRecommendations(
    templateList: FieldTemplate[],
    existingFieldList: any[],
    category?: string
  ): TemplateAnalytics[] {
    return templateList.map(template => {
      let score = 0;
      const reasons: string[] = [];

      // Base score from usage
      score += (template.usageCount || 0) * 0.1;

      // Critical templates get high priority
      if (template.isCritical) {
        score += 500;
        reasons.push('قالب حیاتی و ضروری');
      }

      // Category relevance
      if (category && template.category === category) {
        score += 200;
        reasons.push('مرتبط با دسته‌بندی انتخابی');
      }

      // Complexity preference (simple gets bonus)
      if (template.complexity === 'simple') {
        score += 100;
        reasons.push('راحت و سریع برای پیاده‌سازی');
      }

      // Multi-field bonus for comprehensive forms
      if (template.isMultiField) {
        score += 150;
        reasons.push('قالب کامل و جامع');
      }

      // Check for field compatibility
      const hasCompatibleFields = existingFieldList.some(field => 
        template.fields.some(tf => tf.baseType === field.baseType)
      );
      if (hasCompatibleFields) {
        score += 100;
        reasons.push('سازگار با فیلدهای موجود');
      }

      // Calculate trend based on usage patterns
      const trend: 'rising' | 'stable' | 'falling' = 
        (template.usageCount || 0) > usageStats.averageUsage * 1.2 ? 'rising' :
        (template.usageCount || 0) < usageStats.averageUsage * 0.8 ? 'falling' : 'stable';

      // Efficiency score (inverse of complexity)
      const efficiency = template.complexity === 'simple' ? 90 : 
                        template.complexity === 'intermediate' ? 70 : 50;

      // Compatibility score
      const compatibility = template.isCritical ? 95 : 
                           template.fields.length <= 2 ? 85 : 75;

      return {
        template,
        score,
        reasons: reasons.slice(0, 3), // Top 3 reasons
        trend,
        efficiency,
        compatibility
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8); // Top 8 recommendations
  }

  const renderTrendIcon = (trend: 'rising' | 'stable' | 'falling') => {
    switch (trend) {
      case 'rising':
        return <TrendingIcon sx={{ color: '#4CAF50', fontSize: '1rem' }} />;
      case 'falling':
        return <TrendingIcon sx={{ color: '#F44336', fontSize: '1rem', transform: 'rotate(180deg)' }} />;
      default:
        return <TrendingIcon sx={{ color: '#FF9800', fontSize: '1rem', transform: 'rotate(90deg)' }} />;
    }
  };

  const renderProgressBar = (value: number, max: number, color: string) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <LinearProgress
        variant="determinate"
        value={(value / max) * 100}
        sx={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          backgroundColor: alpha(color, 0.1),
          '& .MuiLinearProgress-bar': {
            backgroundColor: color,
            borderRadius: 3
          }
        }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 30 }}>
        {Math.round((value / max) * 100)}%
      </Typography>
    </Box>
  );

  return (
    <Box>
      {/* Overview Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              textAlign: 'center',
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            }}
          >
            <AnalyticsIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6" fontWeight={600}>
              {usageStats.totalUsage.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              کل استفاده‌ها
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              textAlign: 'center',
              backgroundColor: alpha(theme.palette.success.main, 0.05),
              border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
            }}
          >
            <StarIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
            <Typography variant="h6" fontWeight={600}>
              {usageStats.topPerformers.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              قالب‌های برتر
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              textAlign: 'center',
              backgroundColor: alpha(theme.palette.warning.main, 0.05),
              border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`
            }}
          >
            <SuggestionIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
            <Typography variant="h6" fontWeight={600}>
              {usageStats.recommendations.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              پیشنهاد هوشمند
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Smart Recommendations */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SuggestionIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  پیشنهادات هوشمند
                </Typography>
              </Box>
              
              <List sx={{ p: 0 }}>
                {usageStats.recommendations.slice(0, 6).map((rec, index) => (
                  <React.Fragment key={rec.template.id}>
                    <ListItem
                      sx={{
                        cursor: 'pointer',
                        borderRadius: 1,
                        '&:hover': {
                          backgroundColor: alpha(rec.template.color, 0.05)
                        }
                      }}
                      onClick={() => onTemplateSelect?.(rec.template)}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            backgroundColor: alpha(rec.template.color, 0.1),
                            color: rec.template.color,
                            width: 32,
                            height: 32
                          }}
                        >
                          {rec.template.icon}
                        </Avatar>
                      </ListItemAvatar>
                      
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {rec.template.name}
                            </Typography>
                            {rec.template.isCritical && (
                              <Chip
                                size="small"
                                label="حیاتی"
                                sx={{
                                  backgroundColor: '#FF5722',
                                  color: 'white',
                                  height: 16,
                                  fontSize: '0.6rem'
                                }}
                              />
                            )}
                            {renderTrendIcon(rec.trend)}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {rec.template.description}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {rec.reasons.map((reason, i) => (
                                <Chip
                                  key={i}
                                  size="small"
                                  label={reason}
                                  variant="outlined"
                                  sx={{ fontSize: '0.65rem', height: 18 }}
                                />
                              ))}
                            </Box>
                            
                            {/* Performance Metrics */}
                            <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  کارایی
                                </Typography>
                                {renderProgressBar(rec.efficiency, 100, '#4CAF50')}
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  سازگاری
                                </Typography>
                                {renderProgressBar(rec.compatibility, 100, '#2196F3')}
                              </Box>
                            </Box>
                          </Box>
                        }
                      />
                      
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            امتیاز
                          </Typography>
                          <Typography variant="h6" fontWeight={600} color="primary.main">
                            {Math.round(rec.score)}
                          </Typography>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < usageStats.recommendations.slice(0, 6).length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Performers & Recent */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Top Performers */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TrendingIcon color="success" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    پرکاربردترین‌ها
                  </Typography>
                </Box>
                
                <List sx={{ p: 0 }}>
                  {usageStats.topPerformers.slice(0, 4).map((template, index) => (
                    <ListItem
                      key={template.id}
                      sx={{
                        cursor: 'pointer',
                        borderRadius: 1,
                        '&:hover': {
                          backgroundColor: alpha(template.color, 0.05)
                        }
                      }}
                      onClick={() => onTemplateSelect?.(template)}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            backgroundColor: alpha(template.color, 0.1),
                            color: template.color,
                            width: 28,
                            height: 28,
                            fontSize: '0.9rem'
                          }}
                        >
                          {template.icon}
                        </Avatar>
                      </ListItemAvatar>
                      
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={600}>
                            {template.name}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {template.usageCount} استفاده
                          </Typography>
                        }
                      />
                      
                      <ListItemSecondaryAction>
                        <Chip
                          size="small"
                          label={`#${index + 1}`}
                          color="success"
                          sx={{ fontSize: '0.65rem', height: 18 }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* Recently Popular */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <RecentIcon color="warning" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    پیشنهادات ویژه
                  </Typography>
                </Box>
                
                <List sx={{ p: 0 }}>
                  {usageStats.recentlyPopular.slice(0, 4).map((template) => (
                    <ListItem
                      key={template.id}
                      sx={{
                        cursor: 'pointer',
                        borderRadius: 1,
                        '&:hover': {
                          backgroundColor: alpha(template.color, 0.05)
                        }
                      }}
                      onClick={() => onTemplateSelect?.(template)}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            backgroundColor: alpha(template.color, 0.1),
                            color: template.color,
                            width: 28,
                            height: 28,
                            fontSize: '0.9rem'
                          }}
                        >
                          {template.icon}
                        </Avatar>
                      </ListItemAvatar>
                      
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {template.name}
                            </Typography>
                            {template.isCritical && (
                              <SecurityIcon sx={{ fontSize: '12px', color: '#FF5722' }} />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {template.complexity === 'simple' ? 'ساده' : 
                             template.complexity === 'intermediate' ? 'متوسط' : 'پیشرفته'}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TemplateUsageStats;