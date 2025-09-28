/**
 * Professional Template Category Manager
 * Provides organized categorization with advanced filtering and smart recommendations
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Badge,
  useTheme,
  alpha,
  Tooltip,
  IconButton,
  Button,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Star as StarIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';

import { TEMPLATE_CATEGORIES, FieldTemplate } from './CriticalFieldTemplates';

interface TemplateCategoryManagerProps {
  templates: FieldTemplate[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  onSubcategoryChange?: (subcategoryId: string) => void;
  showStatistics?: boolean;
}

interface CategoryStats {
  total: number;
  critical: number;
  popular: number;
  recent: number;
  complexity: {
    simple: number;
    intermediate: number;
    advanced: number;
  };
}

const TemplateCategoryManager: React.FC<TemplateCategoryManagerProps> = ({
  templates,
  selectedCategory,
  onCategoryChange,
  onSubcategoryChange,
  showStatistics = true
}) => {
  const theme = useTheme();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['personal', 'contact']);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Calculate category statistics
  const categoryStats = useMemo(() => {
    const stats: Record<string, CategoryStats> = {};
    
    TEMPLATE_CATEGORIES.forEach(category => {
      const categoryTemplates = templates.filter(t => t.category === category.id);
      
      stats[category.id] = {
        total: categoryTemplates.length,
        critical: categoryTemplates.filter(t => t.isCritical).length,
        popular: categoryTemplates.filter(t => (t.usageCount || 0) > 200).length,
        recent: categoryTemplates.filter(t => t.usageCount && t.usageCount > 100).length,
        complexity: {
          simple: categoryTemplates.filter(t => t.complexity === 'simple').length,
          intermediate: categoryTemplates.filter(t => t.complexity === 'intermediate').length,
          advanced: categoryTemplates.filter(t => t.complexity === 'advanced').length
        }
      };
    });
    
    return stats;
  }, [templates]);

  // Get recommended categories based on usage
  const recommendedCategories = useMemo(() => {
    return TEMPLATE_CATEGORIES
      .map(cat => ({
        ...cat,
        score: (categoryStats[cat.id]?.critical || 0) * 3 + (categoryStats[cat.id]?.popular || 0) * 2 + (categoryStats[cat.id]?.total || 0)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [categoryStats]);

  const handleCategoryToggle = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const renderCategoryHeader = (category: any, stats: CategoryStats) => (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
      <Box
        sx={{
          width: 28,
          height: 28,
          backgroundColor: alpha(category.color, 0.1),
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem'
        }}
      >
        {category.icon}
      </Box>
      
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          {category.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {category.description}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
        {stats.critical > 0 && (
          <Tooltip title={`${stats.critical} قالب حیاتی`}>
            <Chip
              size="small"
              icon={<SecurityIcon sx={{ fontSize: '12px !important' }} />}
              label={stats.critical}
              sx={{
                height: 20,
                fontSize: '0.65rem',
                backgroundColor: '#FF5722',
                color: 'white',
                '& .MuiChip-icon': {
                  color: 'white'
                }
              }}
            />
          </Tooltip>
        )}
        
        {stats.popular > 0 && (
          <Tooltip title={`${stats.popular} قالب پرکاربرد`}>
            <Chip
              size="small"
              icon={<TrendingIcon sx={{ fontSize: '12px !important' }} />}
              label={stats.popular}
              sx={{
                height: 20,
                fontSize: '0.65rem',
                backgroundColor: '#4CAF50',
                color: 'white',
                '& .MuiChip-icon': {
                  color: 'white'
                }
              }}
            />
          </Tooltip>
        )}

        <Chip
          size="small"
          label={stats.total}
          sx={{
            height: 20,
            fontSize: '0.65rem',
            backgroundColor: alpha(category.color, 0.2),
            color: category.color,
            fontWeight: 600
          }}
        />
      </Box>
    </Box>
  );

  const renderSubcategories = (category: any, stats: CategoryStats) => {
    if (!category.subcategories) return null;

    return (
      <Box sx={{ mt: 1 }}>
        {category.subcategories.map((subcategory: any) => {
          const subcategoryTemplates = templates.filter(t => 
            t.category === category.id && t.subcategory === subcategory.id
          );
          
          return (
            <ListItemButton
              key={subcategory.id}
              onClick={() => onSubcategoryChange?.(subcategory.id)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                '&:hover': {
                  backgroundColor: alpha(category.color, 0.1)
                }
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2" fontWeight={500}>
                      {subcategory.name}
                    </Typography>
                    <Chip
                      size="small"
                      label={subcategoryTemplates.length}
                      sx={{
                        height: 18,
                        fontSize: '0.65rem',
                        backgroundColor: alpha(category.color, 0.1),
                        color: category.color
                      }}
                    />
                  </Box>
                }
                secondary={subcategory.description}
              />
            </ListItemButton>
          );
        })}
      </Box>
    );
  };

  const renderComplexityIndicator = (stats: CategoryStats) => (
    <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
      {stats.complexity.simple > 0 && (
        <Tooltip title={`${stats.complexity.simple} قالب ساده`}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#4CAF50'
            }}
          />
        </Tooltip>
      )}
      {stats.complexity.intermediate > 0 && (
        <Tooltip title={`${stats.complexity.intermediate} قالب متوسط`}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#FF9800'
            }}
          />
        </Tooltip>
      )}
      {stats.complexity.advanced > 0 && (
        <Tooltip title={`${stats.complexity.advanced} قالب پیشرفته`}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#F44336'
            }}
          />
        </Tooltip>
      )}
    </Box>
  );

  return (
    <Box>
      {/* Quick Access - Recommended Categories */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={600} color="primary.main">
            دسته‌های پیشنهادی
          </Typography>
          <IconButton
            size="small"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            sx={{
              color: showAdvancedFilters ? 'primary.main' : 'text.secondary'
            }}
          >
            <FilterIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="همه قالب‌ها"
            variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
            onClick={() => onCategoryChange('all')}
            color="primary"
            sx={{ fontWeight: selectedCategory === 'all' ? 600 : 400 }}
          />
          
          {recommendedCategories.map(category => (
            <Chip
              key={category.id}
              icon={
                <Box sx={{ fontSize: '0.9rem', lineHeight: 1 }}>
                  {category.icon}
                </Box>
              }
              label={category.name}
              variant={selectedCategory === category.id ? 'filled' : 'outlined'}
              onClick={() => onCategoryChange(category.id)}
              sx={{
                fontWeight: selectedCategory === category.id ? 600 : 400,
                '&:hover': {
                  backgroundColor: alpha(category.color, 0.1)
                }
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Advanced Filters */}
      <Collapse in={showAdvancedFilters}>
        <Box sx={{ 
          mb: 3, 
          p: 2, 
          backgroundColor: alpha(theme.palette.grey[100], 0.5),
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            فیلترهای پیشرفته
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              startIcon={<SecurityIcon />}
              variant="outlined"
              sx={{ textTransform: 'none', fontSize: '0.75rem' }}
            >
              فقط قالب‌های حیاتی
            </Button>
            <Button
              size="small"
              startIcon={<TrendingIcon />}
              variant="outlined"
              sx={{ textTransform: 'none', fontSize: '0.75rem' }}
            >
              پرکاربردترین‌ها
            </Button>
            <Button
              size="small"
              startIcon={<SpeedIcon />}
              variant="outlined"
              sx={{ textTransform: 'none', fontSize: '0.75rem' }}
            >
              قالب‌های ساده
            </Button>
          </Box>
        </Box>
      </Collapse>

      {/* Category List */}
      <Box>
        <Typography variant="subtitle2" fontWeight={600} color="primary.main" gutterBottom>
          تمام دسته‌بندی‌ها
        </Typography>
        
        {TEMPLATE_CATEGORIES.map(category => {
          const stats = categoryStats[category.id] || {
            total: 0,
            critical: 0,
            popular: 0,
            recent: 0,
            complexity: { simple: 0, intermediate: 0, advanced: 0 }
          };
          
          const isExpanded = expandedCategories.includes(category.id);
          const isSelected = selectedCategory === category.id;
          
          return (
            <Accordion
              key={category.id}
              expanded={isExpanded}
              onChange={() => handleCategoryToggle(category.id)}
              sx={{
                mb: 1,
                boxShadow: 'none',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                borderRadius: '8px !important',
                backgroundColor: isSelected ? alpha(category.color, 0.05) : 'background.paper',
                '&:before': {
                  display: 'none'
                },
                '&.Mui-expanded': {
                  margin: '0 0 8px 0'
                }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  onCategoryChange(category.id);
                }}
                sx={{
                  minHeight: 56,
                  '&.Mui-expanded': {
                    minHeight: 56
                  },
                  '& .MuiAccordionSummary-content': {
                    margin: '12px 0',
                    '&.Mui-expanded': {
                      margin: '12px 0'
                    }
                  }
                }}
              >
                {renderCategoryHeader(category, stats)}
              </AccordionSummary>
              
              <AccordionDetails sx={{ pt: 0 }}>
                {renderSubcategories(category, stats)}
                {showStatistics && renderComplexityIndicator(stats)}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>

      {/* Summary Statistics */}
      {showStatistics && (
        <Box sx={{ 
          mt: 3, 
          p: 2, 
          backgroundColor: alpha(theme.palette.info.main, 0.05),
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
        }}>
          <Typography variant="body2" fontWeight={600} color="info.main" gutterBottom>
            آمار کلی قالب‌ها
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary">
              کل: {templates.length} قالب
            </Typography>
            <Typography variant="caption" color="text.secondary">
              حیاتی: {templates.filter(t => t.isCritical).length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              پرکاربرد: {templates.filter(t => (t.usageCount || 0) > 200).length}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TemplateCategoryManager;