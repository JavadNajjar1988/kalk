/**
 * Advanced Template Search and Filter System
 * Provides comprehensive search capabilities with smart filtering
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Typography,
  Collapse,
  IconButton,
  Button,
  Paper,
  Autocomplete,
  Switch,
  FormControlLabel,
  useTheme,
  alpha
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  Star as StarIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingIcon,
  Tune as TuneIcon
} from '@mui/icons-material';

import { FieldTemplate } from './CriticalFieldTemplates';

interface AdvancedSearchFilters {
  searchQuery: string;
  category: string;
  subcategory: string;
  complexity: string[];
  usageRange: [number, number];
  isCritical: boolean | null;
  isMultiField: boolean | null;
  fieldTypes: string[];
  tags: string[];
  hasEnhancements: boolean | null;
  sortBy: 'relevance' | 'name' | 'usage' | 'date' | 'complexity';
  sortOrder: 'asc' | 'desc';
}

interface TemplateSearchProps {
  templates: FieldTemplate[];
  onFiltersChange: (filteredTemplates: FieldTemplate[]) => void;
  onSearchChange?: (query: string) => void;
}

const defaultFilters: AdvancedSearchFilters = {
  searchQuery: '',
  category: 'all',
  subcategory: 'all',
  complexity: [],
  usageRange: [0, 1000],
  isCritical: null,
  isMultiField: null,
  fieldTypes: [],
  tags: [],
  hasEnhancements: null,
  sortBy: 'relevance',
  sortOrder: 'desc'
};

const TemplateSearch: React.FC<TemplateSearchProps> = ({
  templates,
  onFiltersChange,
  onSearchChange
}) => {
  const theme = useTheme();
  const [filters, setFilters] = useState<AdvancedSearchFilters>(defaultFilters);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const categories = [...new Set(templates.map(t => t.category))];
    const subcategories = [...new Set(templates.flatMap(t => t.subcategory || []))];
    const fieldTypes = [...new Set(templates.flatMap(t => t.fields.map(f => f.baseType)))];
    const allTags = [...new Set(templates.flatMap(t => t.tags || []))];
    const maxUsage = Math.max(...templates.map(t => t.usageCount || 0));

    return {
      categories,
      subcategories,
      fieldTypes,
      allTags,
      maxUsage
    };
  }, [templates]);

  // Smart search with fuzzy matching
  const performSearch = useCallback((query: string, templateList: FieldTemplate[]) => {
    if (!query.trim()) return templateList;

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return templateList.filter(template => {
      const searchableContent = [
        template.name,
        template.englishName || '',
        template.description,
        ...(template.tags || []),
        template.category,
        template.subcategory || '',
        ...template.fields.map(f => f.name),
        ...template.fields.map(f => f.englishName),
        ...(template.examples || []),
        ...(template.useCases || [])
      ].join(' ').toLowerCase();

      return searchTerms.every(term => 
        searchableContent.includes(term) ||
        // Fuzzy matching for Persian/English
        searchableContent.includes(term.replace(/[آأإ]/g, 'ا').replace(/[ي]/g, 'ی'))
      );
    });
  }, []);

  // Apply all filters
  const filteredTemplates = useMemo(() => {
    let result = [...templates];

    // Search filter
    result = performSearch(filters.searchQuery, result);

    // Category filter
    if (filters.category !== 'all') {
      result = result.filter(t => t.category === filters.category);
    }

    // Subcategory filter
    if (filters.subcategory !== 'all') {
      result = result.filter(t => t.subcategory === filters.subcategory);
    }

    // Complexity filter
    if (filters.complexity.length > 0) {
      result = result.filter(t => filters.complexity.includes(t.complexity));
    }

    // Usage range filter
    result = result.filter(t => {
      const usage = t.usageCount || 0;
      return usage >= filters.usageRange[0] && usage <= filters.usageRange[1];
    });

    // Critical filter
    if (filters.isCritical !== null) {
      result = result.filter(t => !!t.isCritical === filters.isCritical);
    }

    // Multi-field filter
    if (filters.isMultiField !== null) {
      result = result.filter(t => !!t.isMultiField === filters.isMultiField);
    }

    // Field types filter
    if (filters.fieldTypes.length > 0) {
      result = result.filter(t => 
        t.fields.some(f => filters.fieldTypes.includes(f.baseType))
      );
    }

    // Tags filter
    if (filters.tags.length > 0) {
      result = result.filter(t => 
        filters.tags.some(tag => (t.tags || []).includes(tag))
      );
    }

    // Enhancements filter
    if (filters.hasEnhancements !== null) {
      const hasEnhancements = (template: FieldTemplate) => 
        template.fields.some(f => f.enhancements && f.enhancements.length > 0);
      
      result = result.filter(t => hasEnhancements(t) === filters.hasEnhancements);
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'relevance':
          // Smart relevance scoring
          const scoreA = (a.isCritical ? 1000 : 0) + (a.usageCount || 0) + 
                        (filters.searchQuery ? (a.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ? 500 : 0) : 0);
          const scoreB = (b.isCritical ? 1000 : 0) + (b.usageCount || 0) + 
                        (filters.searchQuery ? (b.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ? 500 : 0) : 0);
          comparison = scoreB - scoreA;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'usage':
          comparison = (b.usageCount || 0) - (a.usageCount || 0);
          break;
        case 'complexity':
          const complexityOrder = { simple: 0, intermediate: 1, advanced: 2 };
          comparison = complexityOrder[a.complexity] - complexityOrder[b.complexity];
          break;
        default:
          comparison = 0;
      }

      return filters.sortOrder === 'desc' ? comparison : -comparison;
    });

    return result;
  }, [templates, filters, performSearch]);

  // Update parent component when filters change
  React.useEffect(() => {
    onFiltersChange(filteredTemplates);
    onSearchChange?.(filters.searchQuery);
  }, [filteredTemplates, onFiltersChange, onSearchChange, filters.searchQuery]);

  // Generate search suggestions
  React.useEffect(() => {
    if (filters.searchQuery.length >= 2) {
      const suggestions = filterOptions.allTags
        .filter(tag => tag.toLowerCase().includes(filters.searchQuery.toLowerCase()))
        .slice(0, 5);
      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
  }, [filters.searchQuery, filterOptions.allTags]);

  const updateFilter = (key: keyof AdvancedSearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters(defaultFilters);
  };

  const hasActiveFilters = useMemo(() => {
    return filters.searchQuery !== '' ||
           filters.category !== 'all' ||
           filters.complexity.length > 0 ||
           filters.isCritical !== null ||
           filters.isMultiField !== null ||
           filters.fieldTypes.length > 0 ||
           filters.tags.length > 0 ||
           filters.hasEnhancements !== null;
  }, [filters]);

  return (
    <Box>
      {/* Main Search Bar */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="جستجو در قالب‌ها... (نام، توضیحات، برچسب‌ها)"
          value={filters.searchQuery}
          onChange={(e) => updateFilter('searchQuery', e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    color={showAdvancedFilters ? 'primary' : 'default'}
                  >
                    <TuneIcon />
                  </IconButton>
                  {hasActiveFilters && (
                    <IconButton size="small" onClick={clearAllFilters}>
                      <ClearIcon />
                    </IconButton>
                  )}
                </Box>
              </InputAdornment>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2
            }
          }}
        />

        {/* Search Suggestions */}
        {searchSuggestions.length > 0 && (
          <Paper
            sx={{
              mt: 1,
              p: 1,
              backgroundColor: alpha(theme.palette.background.paper, 0.95),
              backdropFilter: 'blur(8px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
          >
            <Typography variant="caption" color="text.secondary" gutterBottom>
              پیشنهادات:
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {searchSuggestions.map(suggestion => (
                <Chip
                  key={suggestion}
                  size="small"
                  label={suggestion}
                  onClick={() => updateFilter('searchQuery', suggestion)}
                  sx={{ fontSize: '0.7rem' }}
                />
              ))}
            </Box>
          </Paper>
        )}
      </Box>

      {/* Quick Filters */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Button
          size="small"
          variant={filters.isCritical === true ? 'contained' : 'outlined'}
          startIcon={<SecurityIcon />}
          onClick={() => updateFilter('isCritical', filters.isCritical === true ? null : true)}
          sx={{ textTransform: 'none' }}
        >
          حیاتی
        </Button>
        <Button
          size="small"
          variant={filters.complexity.includes('simple') ? 'contained' : 'outlined'}
          startIcon={<SpeedIcon />}
          onClick={() => updateFilter('complexity', 
            filters.complexity.includes('simple') ? [] : ['simple']
          )}
          sx={{ textTransform: 'none' }}
        >
          ساده
        </Button>
        <Button
          size="small"
          variant={filters.sortBy === 'usage' ? 'contained' : 'outlined'}
          startIcon={<TrendingIcon />}
          onClick={() => updateFilter('sortBy', 'usage')}
          sx={{ textTransform: 'none' }}
        >
          پرکاربرد
        </Button>
      </Box>

      {/* Advanced Filters */}
      <Collapse in={showAdvancedFilters}>
        <Paper
          sx={{
            p: 2,
            mb: 2,
            backgroundColor: alpha(theme.palette.grey[50], 0.8),
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderRadius: 2
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            فیلترهای پیشرفته
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
            {/* Category Filter */}
            <FormControl size="small">
              <InputLabel>دسته‌بندی</InputLabel>
              <Select
                value={filters.category}
                label="دسته‌بندی"
                onChange={(e) => updateFilter('category', e.target.value)}
              >
                <MenuItem value="all">همه دسته‌ها</MenuItem>
                {filterOptions.categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Complexity Filter */}
            <Autocomplete
              multiple
              size="small"
              options={['simple', 'intermediate', 'advanced']}
              value={filters.complexity}
              onChange={(_, value) => updateFilter('complexity', value)}
              getOptionLabel={(option) => 
                option === 'simple' ? 'ساده' : 
                option === 'intermediate' ? 'متوسط' : 'پیشرفته'
              }
              renderInput={(params) => (
                <TextField {...params} label="سطح پیچیدگی" />
              )}
            />

            {/* Field Types Filter */}
            <Autocomplete
              multiple
              size="small"
              options={filterOptions.fieldTypes}
              value={filters.fieldTypes}
              onChange={(_, value) => updateFilter('fieldTypes', value)}
              getOptionLabel={(option) => option.toUpperCase()}
              renderInput={(params) => (
                <TextField {...params} label="نوع فیلد" />
              )}
            />

            {/* Tags Filter */}
            <Autocomplete
              multiple
              size="small"
              options={filterOptions.allTags}
              value={filters.tags}
              onChange={(_, value) => updateFilter('tags', value)}
              renderInput={(params) => (
                <TextField {...params} label="برچسب‌ها" />
              )}
            />
          </Box>

          {/* Usage Range Slider */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              محدوده استفاده: {filters.usageRange[0]} - {filters.usageRange[1]}
            </Typography>
            <Slider
              value={filters.usageRange}
              onChange={(_, value) => updateFilter('usageRange', value)}
              valueLabelDisplay="auto"
              min={0}
              max={filterOptions.maxUsage}
              sx={{ mt: 1 }}
            />
          </Box>

          {/* Boolean Filters */}
          <Box sx={{ mt: 2, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={filters.isMultiField === true}
                  onChange={(e) => updateFilter('isMultiField', 
                    e.target.checked ? true : null
                  )}
                />
              }
              label="قالب‌های چندتایی"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={filters.hasEnhancements === true}
                  onChange={(e) => updateFilter('hasEnhancements', 
                    e.target.checked ? true : null
                  )}
                />
              }
              label="دارای ویژگی‌های هوشمند"
            />
          </Box>

          {/* Sort Options */}
          <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2">مرتب‌سازی:</Typography>
            <Button
              size="small"
              variant={filters.sortBy === 'relevance' ? 'contained' : 'outlined'}
              onClick={() => updateFilter('sortBy', 'relevance')}
              sx={{ textTransform: 'none' }}
            >
              مرتبط
            </Button>
            <Button
              size="small"
              variant={filters.sortBy === 'usage' ? 'contained' : 'outlined'}
              onClick={() => updateFilter('sortBy', 'usage')}
              sx={{ textTransform: 'none' }}
            >
              پرکاربرد
            </Button>
            <Button
              size="small"
              variant={filters.sortBy === 'name' ? 'contained' : 'outlined'}
              onClick={() => updateFilter('sortBy', 'name')}
              sx={{ textTransform: 'none' }}
            >
              نام
            </Button>
          </Box>
        </Paper>
      </Collapse>

      {/* Results Summary */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          p: 1.5,
          backgroundColor: alpha(theme.palette.primary.main, 0.05),
          borderRadius: 1,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
        }}
      >
        <Typography variant="body2" color="primary.main" fontWeight={600}>
          {filteredTemplates.length} قالب یافت شد
          {templates.length !== filteredTemplates.length && 
            ` از ${templates.length} قالب`
          }
        </Typography>
        
        {hasActiveFilters && (
          <Button
            size="small"
            onClick={clearAllFilters}
            startIcon={<ClearIcon />}
            sx={{ textTransform: 'none' }}
          >
            پاک کردن فیلترها
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default TemplateSearch;