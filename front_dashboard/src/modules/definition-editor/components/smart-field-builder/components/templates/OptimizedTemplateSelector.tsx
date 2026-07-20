/**
 * Optimized Template Selector with Advanced Lazy Loading
 * Provides virtual scrolling, intelligent caching, and performance monitoring
 */

import React, { useState, useCallback, useMemo, useEffect, useRef, Suspense, lazy } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Alert,
  Chip,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Skeleton,
  alpha,
  useTheme,
  Grid,
  Stack,
  CircularProgress,
  Fade,
  Collapse
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Preview as PreviewIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  Sort as SortIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useIntersectionObserver } from '../../hooks/usePerformanceOptimization';
import { VirtualTemplateList } from '../optimization/VirtualList';
import { templateCache, performanceCache, validationCache } from '../../utils/intelligentCache';
import { validateTemplate, validateTemplateCollection, quickValidateTemplate, getValidationSummary } from '../../utils/templateValidation';
import { 
  Template, 
  TemplateCategory, 
  OptimizedTemplateSelectorProps,
  PerformanceMetrics,
  UsageAnalytics,
  SmartFieldConfig
} from '../../types/smartFieldTypes';

// Import critical field templates
import { CRITICAL_FIELD_TEMPLATES, TEMPLATE_CATEGORIES } from './CriticalFieldTemplates';

// OptimizedTemplateSelectorProps interface is now imported from smartFieldTypes.ts

interface TemplateFilter {
  category: string;
  tags: string[];
  complexity: 'simple' | 'intermediate' | 'advanced' | 'all';
  usageRange: [number, number];
}

interface ViewConfig {
  layout: 'grid' | 'list' | 'virtual';
  itemsPerPage: number;
  sortBy: 'name' | 'usage' | 'date' | 'relevance';
  sortOrder: 'asc' | 'desc';
}

// Enhanced template skeleton component with adaptive loading
const TemplateSkeleton: React.FC<{ count?: number; viewMode?: 'grid' | 'list' | 'virtual' }> = ({ 
  count = 6, 
  viewMode = 'grid' 
}) => {
  const theme = useTheme();
  
  if (viewMode === 'list' || viewMode === 'virtual') {
    return (
      <Stack spacing={1}>
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index} sx={{ height: 80 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
              <Skeleton variant="rectangular" width={40} height={40} sx={{ borderRadius: 1 }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton variant="text" width="80%" height={16} />
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Skeleton variant="rectangular" width={50} height={20} sx={{ borderRadius: 0.5 }} />
                <Skeleton variant="rectangular" width={40} height={20} sx={{ borderRadius: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    );
  }
  
  // Grid view
  return (
    <Grid container spacing={2}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card sx={{ height: 200 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Skeleton variant="circular" width={24} height={24} />
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton variant="rectangular" width={50} height={18} sx={{ borderRadius: 2, ml: 'auto' }} />
              </Box>
              <Skeleton variant="text" width="100%" height={16} />
              <Skeleton variant="text" width="80%" height={16} />
              <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                <Skeleton variant="rectangular" width={50} height={20} sx={{ borderRadius: 2 }} />
                <Skeleton variant="rectangular" width={40} height={20} sx={{ borderRadius: 2 }} />
                <Skeleton variant="rectangular" width={30} height={20} sx={{ borderRadius: 2 }} />
              </Box>
              <Box sx={{ mt: 1 }}>
                <Skeleton variant="text" width="50%" height={14} />
              </Box>
            </CardContent>
            <CardActions sx={{ pt: 0 }}>
              <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
              <Skeleton variant="circular" width={24} height={24} sx={{ ml: 'auto' }} />
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// Optimized template card with enhanced intersection observer
const TemplateCard: React.FC<{
  template: Template;
  onSelect: (template: Template) => void;
  isVisible?: boolean;
}> = React.memo(({ template, onSelect, isVisible = true }) => {
  const theme = useTheme();
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Use standardized intersection observer with proper options
  const { isIntersecting } = useIntersectionObserver(cardRef, {
    threshold: 0.1,
    rootMargin: '100px' // Increased for better preloading
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Enhanced loading logic with error handling
  useEffect(() => {
    if (isIntersecting && !isLoaded && !loadError) {
      try {
        // Simulate template validation and loading
        if (!template.fields || !Array.isArray(template.fields)) {
          throw new Error('Invalid template structure');
        }
        setIsLoaded(true);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Template loading failed');
      }
    }
  }, [isIntersecting, isLoaded, loadError, template]);

  if (!isVisible) {
    return (
      <div ref={cardRef} style={{ height: 200 }}>
        <TemplateSkeleton count={1} viewMode="grid" />
      </div>
    );
  }

  if (loadError) {
    return (
      <Card ref={cardRef} sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="error" variant="body2" align="center">
          خطا در بارگذاری قالب<br />
          <Typography variant="caption">{loadError}</Typography>
        </Typography>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <div ref={cardRef} style={{ height: 200 }}>
        <TemplateSkeleton count={1} viewMode="grid" />
      </div>
    );
  }

  // Handle icon - ensure it's a string (emoji) or component
  const iconElement = typeof template.icon === 'string' ? template.icon : '📋';

  return (
    <Card
      ref={cardRef}
      sx={{
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[8],
          '& .template-actions': {
            opacity: 1
          }
        }
      }}
      onClick={() => onSelect(template)}
    >
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box
            sx={{
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              color: template.color
            }}
          >
            {iconElement}
          </Box>
          <Typography variant="subtitle2" fontWeight={600} noWrap>
            {template.name}
          </Typography>
          {template.isMultiField && (
            <Chip label="چندتایی" size="small" color="secondary" />
          )}
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {template.description}
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
          {template.tags?.slice(0, 3).map((tag: string) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              variant="outlined"
              sx={{ 
                fontSize: '0.7rem', 
                height: 20,
                '& .MuiChip-label': {
                  px: 0.5
                }
              }}
            />
          ))}
          {template.tags?.length > 3 && (
            <Chip
              label={`+${template.tags.length - 3} بیشتر`}
              size="small"
              variant="filled"
              color="primary"
              sx={{ 
                fontSize: '0.7rem', 
                height: 20,
                opacity: 0.7,
                '& .MuiChip-label': {
                  px: 0.5
                }
              }}
            />
          )}
        </Box>

        {template.usageCount && (
          <Typography variant="caption" color="text.secondary">
            🔥 {template.usageCount} استفاده
          </Typography>
        )}
      </CardContent>

      <CardActions
        className="template-actions"
        sx={{
          pt: 0,
          justifyContent: 'space-between',
          opacity: 0,
          transition: 'opacity 0.2s ease'
        }}
      >
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(template);
          }}
        >
          انتخاب
        </Button>
        <IconButton size="small" color="primary">
          <PreviewIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
});

const OptimizedTemplateSelector: React.FC<OptimizedTemplateSelectorProps> = ({
  onTemplateSelect,
  existingFields = [],
  categoryContext,
  editingField
}) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  
  const [filter, setFilter] = useState<TemplateFilter>({
    category: 'all',
    tags: [],
    complexity: 'all',
    usageRange: [0, 1000]
  });

  const [viewConfig, setViewConfig] = useState<ViewConfig>({
    layout: 'virtual', // Use virtual scrolling by default
    itemsPerPage: 20,
    sortBy: 'usage',
    sortOrder: 'desc'
  });

  // Enhanced template loading with validation and error handling
  const loadTemplates = useCallback(async () => {
    const cacheKey = `templates_${filter.category}_${viewConfig.sortBy}_${viewConfig.sortOrder}`;
    
    setIsLoading(true);
    
    try {
      const startTime = Date.now();
      
      // Try to get from cache first with validation cache
      const cachedValidation = validationCache.get(`validation_${cacheKey}`);
      
      const loadedTemplates = await templateCache.getOrSet(
        cacheKey,
        async () => {
          try {
            // Use critical field templates
            const rawTemplates = CRITICAL_FIELD_TEMPLATES || [];
            
            // Comprehensive validation of template collection
            const collectionValidation = validateTemplateCollection(rawTemplates);
            
            if (!collectionValidation.isValid) {
              console.error('Template collection validation failed:', collectionValidation.errors);
              // Continue with valid templates only
            }
            
            if (collectionValidation.warnings.length > 0) {
              console.warn('Template collection warnings:', collectionValidation.warnings);
            }
            
            // Validate individual templates and filter out invalid ones
            const validatedTemplates = rawTemplates
              .map(template => {
                const validation = validateTemplate(template, {
                  strict: false,
                  requireDescription: true,
                  validateEnhancements: true
                });
                
                return {
                  ...template,
                  validation,
                  isValid: validation.isValid,
                  qualityScore: validation.score
                };
              })
              .filter(template => {
                if (!template.isValid) {
                  console.warn(`Invalid template filtered out: ${template.name}`, template.validation.errors);
                  return false;
                }
                return quickValidateTemplate(template);
              });
            
            if (validatedTemplates.length === 0) {
              throw new Error('No valid templates found after validation');
            }
            
            // Cache validation results
            validationCache.set(`validation_${cacheKey}`, {
              totalTemplates: rawTemplates.length,
              validTemplates: validatedTemplates.length,
              collectionValidation,
              timestamp: Date.now()
            });
            
            return validatedTemplates;
          } catch (error) {
            console.error('Template loading error:', error);
            throw error;
          }
        },
        {
          ttl: 10 * 60 * 1000, // 10 minutes
          version: '1.0.0',
          dependencies: ['CRITICAL_FIELD_TEMPLATES', 'validation']
        }
      );
      
      // Sort templates with enhanced logic including quality score
      const sortedTemplates = [...loadedTemplates].sort((a, b) => {
        // Prioritize critical templates
        if (a.isCritical && !b.isCritical) return -1;
        if (!a.isCritical && b.isCritical) return 1;
        
        switch (viewConfig.sortBy) {
          case 'usage':
            const usageA = a.usageCount || 0;
            const usageB = b.usageCount || 0;
            return viewConfig.sortOrder === 'desc' ? usageB - usageA : usageA - usageB;
          case 'name':
            return viewConfig.sortOrder === 'desc'
              ? b.name.localeCompare(a.name, 'fa')
              : a.name.localeCompare(b.name, 'fa');
          case 'relevance':
            // Enhanced relevance scoring including quality
            const scoreA = (a.isCritical ? 1000 : 0) + (a.usageCount || 0) + 
                          (a.rating || 0) * 100 + (a.qualityScore || 0);
            const scoreB = (b.isCritical ? 1000 : 0) + (b.usageCount || 0) + 
                          (b.rating || 0) * 100 + (b.qualityScore || 0);
            return viewConfig.sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
          case 'date':
            const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return viewConfig.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
          case 'quality':
            const qualityA = a.qualityScore || 0;
            const qualityB = b.qualityScore || 0;
            return viewConfig.sortOrder === 'desc' ? qualityB - qualityA : qualityA - qualityB;
          default:
            return 0;
        }
      });

      setTemplates(sortedTemplates);
      
      // Cache performance metrics
      performanceCache.set(`load_time_${cacheKey}`, {
        timestamp: Date.now(),
        templateCount: sortedTemplates.length,
        loadTime: Date.now() - startTime,
        validationResults: cachedValidation
      });
      
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
      
      // Show user-friendly error notification
      // This would typically integrate with a notification system
    } finally {
      setIsLoading(false);
    }
  }, [filter.category, viewConfig.sortBy, viewConfig.sortOrder]);

  // Load templates on mount and filter changes
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Enhanced template filtering with improved logic
  const filteredTemplates = useMemo(() => {
    if (!templates.length) return [];

    return templates.filter(template => {
      // Comprehensive category filter
      if (filter.category !== 'all') {
        // Handle both string categories and array of categories
        const templateCategories = Array.isArray(template.category) 
          ? template.category 
          : [template.category];
        
        if (!templateCategories.some(cat => cat === filter.category)) {
          return false;
        }
      }

      // Enhanced search filter with multiple fields
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const searchableFields = [
          template.name,
          template.description,
          template.englishName,
          ...(template.tags || []),
          ...(template.keywords || []),
          template.category,
          ...(Array.isArray(template.category) ? template.category : [template.category])
        ].filter(Boolean);
        
        const matches = searchableFields.some(field => 
          String(field).toLowerCase().includes(query)
        );
        
        if (!matches) {
          return false;
        }
      }

      // Complexity filter
      if (filter.complexity !== 'all') {
        const templateComplexity = template.complexity || 'intermediate';
        if (templateComplexity !== filter.complexity) {
          return false;
        }
      }

      // Usage range filter
      const usage = template.usageCount || 0;
      if (usage < filter.usageRange[0] || usage > filter.usageRange[1]) {
        return false;
      }

      // Tags filter
      if (filter.tags.length > 0) {
        const templateTags = template.tags || [];
        const hasMatchingTag = filter.tags.some(filterTag => 
          templateTags.some(tag => tag.toLowerCase().includes(filterTag.toLowerCase()))
        );
        
        if (!hasMatchingTag) {
          return false;
        }
      }

      // Context-based filtering for better relevance
      if (categoryContext) {
        const relevanceScore = calculateTemplateRelevance(template, categoryContext);
        if (relevanceScore < 0.3) { // Minimum relevance threshold
          return false;
        }
      }

      return true;
    });
  }, [templates, filter, searchQuery, categoryContext]);

  // Calculate template relevance based on context
  const calculateTemplateRelevance = useCallback((template: Template, context: string): number => {
    let score = 0.5; // Base score
    
    // Category match
    const templateCategories = Array.isArray(template.category) 
      ? template.category 
      : [template.category];
    
    if (templateCategories.includes(context)) {
      score += 0.3;
    }
    
    // Keywords match
    const contextKeywords = {
      'personnel': ['personal', 'employee', 'staff', 'person'],
      'equipment': ['device', 'tool', 'machine', 'equipment'],
      'location': ['address', 'place', 'location', 'geography'],
      'business': ['company', 'business', 'organization', 'corporate']
    };
    
    const keywords = contextKeywords[context as keyof typeof contextKeywords] || [];
    const templateKeywords = [
      ...(template.keywords || []),
      ...(template.tags || []),
      template.name,
      template.description
    ].join(' ').toLowerCase();
    
    const keywordMatches = keywords.filter(keyword => 
      templateKeywords.includes(keyword)
    ).length;
    
    score += (keywordMatches / keywords.length) * 0.2;
    
    // Usage popularity
    const maxUsage = Math.max(...templates.map(t => t.usageCount || 0));
    if (maxUsage > 0) {
      score += ((template.usageCount || 0) / maxUsage) * 0.1;
    }
    
    // Critical template bonus
    if (template.isCritical) {
      score += 0.1;
    }
    
    return Math.min(1, score);
  }, [templates]);

  // Enhanced template selection handler with comprehensive validation
  const handleTemplateSelect = useCallback((template: Template) => {
    try {
      // Pre-selection validation
      if (!quickValidateTemplate(template)) {
        console.error('Template failed quick validation:', template);
        // Show error to user
        return;
      }
      
      // Comprehensive validation before selection
      const validation = validateTemplate(template, {
        strict: true,
        requireDescription: false, // More lenient for selection
        validateEnhancements: true
      });
      
      if (!validation.isValid) {
        console.error('Template validation failed:', validation.errors);
        // Show validation errors to user
        return;
      }
      
      if (validation.warnings.length > 0) {
        console.warn('Template has warnings:', validation.warnings);
        // Could show warnings to user but still proceed
      }
      
      // Additional field-level validation
      const invalidFields = template.fields.filter((field: any) => {
        return !field.name || !field.englishName || !field.baseType;
      });
      
      if (invalidFields.length > 0) {
        console.error('Template contains invalid fields:', invalidFields);
        // Show specific field validation errors
        return;
      }
      
      // Check for field name conflicts with existing fields
      if (existingFields && existingFields.length > 0) {
        const conflictingFields = template.fields.filter((field: any) => 
          existingFields.some(existing => 
            existing.englishName === field.englishName
          )
        );
        
        if (conflictingFields.length > 0) {
          console.warn('Template contains fields with conflicting names:', conflictingFields);
          // Could show warning but allow user to proceed with modifications
        }
      }
      
      // Update usage analytics with validation info
      const updatedTemplate = {
        ...template,
        usageCount: (template.usageCount || 0) + 1,
        lastUsed: new Date().toISOString(),
        lastValidation: {
          timestamp: new Date().toISOString(),
          score: validation.score,
          summary: getValidationSummary(validation)
        }
      };
      
      // Update local templates array
      setTemplates(prev => 
        prev.map(t => t.id === template.id ? updatedTemplate : t)
      );
      
      // Cache the updated usage with validation data
      performanceCache.set(`usage_${template.id}`, {
        count: updatedTemplate.usageCount,
        lastUsed: updatedTemplate.lastUsed,
        context: categoryContext,
        validationScore: validation.score,
        hasWarnings: validation.warnings.length > 0
      }, {
        ttl: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      // Log comprehensive analytics for business intelligence
      if (process.env.NODE_ENV === 'development') {
        console.log('Template selected successfully:', {
          templateId: template.id,
          templateName: template.name,
          category: template.category,
          context: categoryContext,
          searchQuery: searchQuery || null,
          validationScore: validation.score,
          qualityLevel: validation.score >= 90 ? 'high' : validation.score >= 70 ? 'medium' : 'low',
          fieldCount: template.fields.length,
          hasEnhancements: template.fields.some((f: any) => f.enhancements?.length > 0),
          timestamp: new Date().toISOString()
        });
      }
      
      // Call the original handler with validated template
      if (template.isMultiField) {
        onTemplateSelect(template.fields);
      } else {
        onTemplateSelect(template.fields[0]);
      }
      
    } catch (error) {
      console.error('Error handling template selection:', error);
      
      // Show user-friendly error message
      // This would typically integrate with a notification system
      alert('خطا در انتخاب قالب. لطفاً دوباره تلاش کنید.');
    }
  }, [onTemplateSelect, categoryContext, searchQuery, existingFields]);

  // Calculate category relevance based on context
  const calculateCategoryRelevance = useCallback((categoryId: string, context: string): number => {
    const relevanceMap: Record<string, Record<string, number>> = {
      'personnel': {
        'personal': 1.0,
        'contact': 0.8,
        'address': 0.6,
        'business': 0.4,
        'medical': 0.7,
        'educational': 0.6
      },
      'equipment': {
        'technical': 1.0,
        'business': 0.7,
        'location': 0.5,
        'personal': 0.3
      },
      'location': {
        'address': 1.0,
        'geographical': 1.0,
        'business': 0.6,
        'personal': 0.4
      }
    };
    
    return relevanceMap[context]?.[categoryId] || 0.5;
  }, []);

  // Enhanced category management with accurate counts and context
  const categories = useMemo((): TemplateCategory[] => {
    const baseCategories = TEMPLATE_CATEGORIES.map(category => {
      // Calculate accurate count including templates with multiple categories
      const count = templates.filter(template => {
        const templateCategories = Array.isArray(template.category) 
          ? template.category 
          : [template.category];
        return templateCategories.includes(category.id);
      }).length;
      
      return {
        ...category,
        count,
        isRelevant: categoryContext ? 
          calculateCategoryRelevance(category.id, categoryContext) > 0.5 : true
      };
    });
    
    // Sort categories by relevance and count
    return baseCategories.sort((a, b) => {
      // Prioritize relevant categories
      if (a.isRelevant && !b.isRelevant) return -1;
      if (!a.isRelevant && b.isRelevant) return 1;
      
      // Then by count
      return b.count - a.count;
    });
  }, [templates, categoryContext, calculateCategoryRelevance]);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          انتخاب قالب آماده
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          قالب‌های بهینه‌شده با پشتیبانی از lazy loading و virtual scrolling
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="جستجو در قالب‌ها..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ mb: 2 }}
        />

        {/* Enhanced Category Filter with improved display */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Chip
            label={`همه (${templates.length})`}
            variant={filter.category === 'all' ? 'filled' : 'outlined'}
            onClick={() => setFilter(prev => ({ ...prev, category: 'all' }))}
            color="primary"
            sx={{
              fontWeight: filter.category === 'all' ? 600 : 400,
              '& .MuiChip-label': {
                px: 1.5
              }
            }}
          />
          {categories
            .filter(category => category.count > 0) // Only show categories with templates
            .map(category => (
              <Chip
                key={category.id}
                label={`${category.name} (${category.count})`}
                variant={filter.category === category.id ? 'filled' : 'outlined'}
                onClick={() => setFilter(prev => ({ ...prev, category: category.id }))}
                color={category.isRelevant ? 'primary' : 'default'}
                sx={{
                  fontWeight: filter.category === category.id ? 600 : 400,
                  opacity: category.isRelevant ? 1 : 0.7,
                  '& .MuiChip-label': {
                    px: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }
                }}
                icon={category.isRelevant ? <Typography sx={{ fontSize: '0.8rem' }}>⭐</Typography> : undefined}
              />
            ))}
        </Box>

        {/* Enhanced View Controls with better feedback */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 2,
          backgroundColor: alpha(theme.palette.grey[100], 0.5),
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 'max-content' }}>
                نمایش:
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                borderRadius: 1,
                overflow: 'hidden'
              }}>
                <IconButton
                  size="small"
                  sx={{
                    borderRadius: 0,
                    backgroundColor: viewConfig.layout === 'grid' 
                      ? theme.palette.primary.main 
                      : 'transparent',
                    color: viewConfig.layout === 'grid' 
                      ? theme.palette.primary.contrastText 
                      : theme.palette.text.secondary,
                    '&:hover': {
                      backgroundColor: viewConfig.layout === 'grid'
                        ? theme.palette.primary.dark
                        : alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                  onClick={() => setViewConfig(prev => ({ ...prev, layout: 'grid' }))}
                >
                  <ViewModuleIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{
                    borderRadius: 0,
                    backgroundColor: viewConfig.layout === 'list' 
                      ? theme.palette.primary.main 
                      : 'transparent',
                    color: viewConfig.layout === 'list' 
                      ? theme.palette.primary.contrastText 
                      : theme.palette.text.secondary,
                    '&:hover': {
                      backgroundColor: viewConfig.layout === 'list'
                        ? theme.palette.primary.dark
                        : alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                  onClick={() => setViewConfig(prev => ({ ...prev, layout: 'list' }))}
                >
                  <ViewListIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{
                    borderRadius: 0,
                    backgroundColor: viewConfig.layout === 'virtual' 
                      ? theme.palette.primary.main 
                      : 'transparent',
                    color: viewConfig.layout === 'virtual' 
                      ? theme.palette.primary.contrastText 
                      : theme.palette.text.secondary,
                    '&:hover': {
                      backgroundColor: viewConfig.layout === 'virtual'
                        ? theme.palette.primary.dark
                        : alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                  onClick={() => setViewConfig(prev => ({ ...prev, layout: 'virtual' }))}
                >
                  <FilterIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 'max-content' }}>
                مرتب‌سازی:
              </Typography>
              <IconButton
                size="small"
                onClick={() => setViewConfig(prev => ({
                  ...prev,
                  sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
                }))}
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  transform: viewConfig.sortOrder === 'desc' ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease'
                }}
              >
                <SortIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isLoading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.secondary">
                  بارگذاری...
                </Typography>
              </Box>
            )}
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 600,
                color: filteredTemplates.length > 0 ? 'primary.main' : 'text.secondary',
                minWidth: 'max-content'
              }}
            >
              {filteredTemplates.length} قالب
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Content with enhanced loading states and transitions */}
      <Fade in={!isLoading} timeout={300}>
        <Box>
          {isLoading ? (
            <Box sx={{ position: 'relative' }}>
              <TemplateSkeleton count={viewConfig.layout === 'virtual' ? 8 : 12} viewMode={viewConfig.layout} />
              <Box sx={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                backgroundColor: alpha(theme.palette.background.paper, 0.9),
                px: 2,
                py: 1,
                borderRadius: 2,
                boxShadow: theme.shadows[4]
              }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  در حال بارگذاری قالب‌ها...
                </Typography>
              </Box>
            </Box>
          ) : filteredTemplates.length === 0 ? (
            <Fade in timeout={500}>
              <Alert 
                severity="info" 
                sx={{ 
                  borderRadius: 2,
                  '& .MuiAlert-message': {
                    width: '100%',
                    textAlign: 'center'
                  }
                }}
                action={
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={() => {
                      setSearchQuery('');
                      setFilter(prev => ({ ...prev, category: 'all' }));
                    }}
                  >
                    پاک کردن فیلترها
                  </Button>
                }
              >
                <Typography variant="body1" gutterBottom>
                  قالبی با معیارهای جستجو پیدا نشد.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  لطفاً کلمات کلیدی دیگری امتحان کنید یا فیلترها را پاک کنید.
                </Typography>
              </Alert>
            </Fade>
          ) : (
            <Collapse in timeout={400}>
              <Box>
                {viewConfig.layout === 'virtual' ? (
                  <VirtualTemplateList
                    templates={filteredTemplates}
                    onTemplateSelect={handleTemplateSelect}
                    height={600}
                    searchQuery={searchQuery}
                  />
                ) : viewConfig.layout === 'list' ? (
                  <Stack spacing={1}>
                    {filteredTemplates.slice(0, viewConfig.itemsPerPage).map((template, index) => (
                      <Card
                        key={template.id}
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateX(4px)',
                            boxShadow: theme.shadows[4]
                          }
                        }}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 1,
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.2rem'
                            }}
                          >
                            {typeof template.icon === 'string' ? template.icon : '📋'}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" fontWeight={600} noWrap>
                              {template.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {template.description}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {template.tags?.slice(0, 2).map((tag: string) => (
                              <Chip key={tag} label={tag} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Grid container spacing={2}>
                    {filteredTemplates.slice(0, viewConfig.itemsPerPage).map((template, index) => (
                      <Grid item xs={12} sm={6} md={4} key={template.id}>
                        <TemplateCard
                          template={template}
                          onSelect={handleTemplateSelect}
                          isVisible={index < viewConfig.itemsPerPage}
                        />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            </Collapse>
          )}
        </Box>
      </Fade>
    </Box>
  );
};

export default React.memo(OptimizedTemplateSelector);