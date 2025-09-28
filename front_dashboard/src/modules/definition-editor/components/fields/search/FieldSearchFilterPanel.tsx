import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  FormControlLabel,
  Checkbox,
  Button,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  Tune as TuneIcon,
  Sort as SortIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon
} from '@mui/icons-material';

export interface FieldSearchFilter {
  searchTerm: string;
  fieldType: string[];
  category: string[];
  status: string[];
  hasValidation: boolean | null;
  hasDependencies: boolean | null;
  complexity: [number, number];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  tags: string[];
  favorite: boolean | null;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FieldSearchFilterProps {
  onFilterChange: (filter: FieldSearchFilter) => void;
  onSortChange: (sort: SortOption) => void;
  onViewModeChange: (mode: 'list' | 'grid') => void;
  fieldTypes: string[];
  categories: string[];
  availableTags: string[];
  totalFields: number;
  filteredFields: number;
  savedFilters?: Array<{ id: string; name: string; filter: FieldSearchFilter }>;
  onSaveFilter?: (name: string, filter: FieldSearchFilter) => void;
  onLoadFilter?: (filter: FieldSearchFilter) => void;
}

const initialFilter: FieldSearchFilter = {
  searchTerm: '',
  fieldType: [],
  category: [],
  status: [],
  hasValidation: null,
  hasDependencies: null,
  complexity: [1, 10],
  dateRange: {
    start: null,
    end: null
  },
  tags: [],
  favorite: null
};

const FieldSearchFilterPanel: React.FC<FieldSearchFilterProps> = ({
  onFilterChange,
  onSortChange,
  onViewModeChange,
  fieldTypes,
  categories,
  availableTags,
  totalFields,
  filteredFields,
  savedFilters = [],
  onSaveFilter,
  onLoadFilter
}) => {
  const [filter, setFilter] = useState<FieldSearchFilter>(initialFilter);
  const [sort, setSort] = useState<SortOption>({ field: 'name', direction: 'asc' });
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [filterName, setFilterName] = useState('');

  // Update filter and notify parent
  const updateFilter = useCallback((newFilter: Partial<FieldSearchFilter>) => {
    const updatedFilter = { ...filter, ...newFilter };
    setFilter(updatedFilter);
    onFilterChange(updatedFilter);
  }, [filter, onFilterChange]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilter(initialFilter);
    onFilterChange(initialFilter);
  }, [onFilterChange]);

  // Handle sort change
  const handleSortChange = useCallback((field: string) => {
    const newSort: SortOption = {
      field,
      direction: sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc'
    };
    setSort(newSort);
    onSortChange(newSort);
  }, [sort, onSortChange]);

  // Handle view mode change
  const handleViewModeChange = useCallback((mode: 'list' | 'grid') => {
    setViewMode(mode);
    onViewModeChange(mode);
  }, [onViewModeChange]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filter.searchTerm) count++;
    if (filter.fieldType.length > 0) count++;
    if (filter.category.length > 0) count++;
    if (filter.status.length > 0) count++;
    if (filter.hasValidation !== null) count++;
    if (filter.hasDependencies !== null) count++;
    if (filter.complexity[0] !== 1 || filter.complexity[1] !== 10) count++;
    if (filter.dateRange.start || filter.dateRange.end) count++;
    if (filter.tags.length > 0) count++;
    if (filter.favorite !== null) count++;
    return count;
  }, [filter]);

  // Save current filter
  const handleSaveFilter = useCallback(() => {
    if (filterName.trim() && onSaveFilter) {
      onSaveFilter(filterName.trim(), filter);
      setFilterName('');
    }
  }, [filterName, filter, onSaveFilter]);

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mb: 3,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 2
      }}
    >
      {/* Search and Quick Filters */}
      <Box display="flex" gap={2} alignItems="center" mb={2}>
        {/* Search Input */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search fields by name, description, or properties..."
          value={filter.searchTerm}
          onChange={(e) => updateFilter({ searchTerm: e.target.value })}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: filter.searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => updateFilter({ searchTerm: '' })}
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              background: 'rgba(255, 255, 255, 0.8)',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.9)'
              }
            }
          }}
        />

        {/* Field Type Filter */}
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Field Type</InputLabel>
          <Select
            multiple
            value={filter.fieldType}
            onChange={(e) => updateFilter({ fieldType: e.target.value as string[] })}
            label="Field Type"
            renderValue={(selected) => (
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {(selected as string[]).map((value) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Box>
            )}
          >
            {fieldTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* View Mode Toggle */}
        <Box display="flex" border="1px solid rgba(0, 0, 0, 0.1)" borderRadius={1}>
          <IconButton
            size="small"
            onClick={() => handleViewModeChange('list')}
            sx={{
              backgroundColor: viewMode === 'list' ? 'primary.main' : 'transparent',
              color: viewMode === 'list' ? 'white' : 'text.secondary',
              borderRadius: '4px 0 0 4px'
            }}
          >
            <ViewListIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleViewModeChange('grid')}
            sx={{
              backgroundColor: viewMode === 'grid' ? 'primary.main' : 'transparent',
              color: viewMode === 'grid' ? 'white' : 'text.secondary',
              borderRadius: '0 4px 4px 0'
            }}
          >
            <ViewModuleIcon />
          </IconButton>
        </Box>

        {/* Advanced Filters Toggle */}
        <Badge badgeContent={activeFilterCount} color="primary">
          <IconButton
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            sx={{
              backgroundColor: isAdvancedOpen ? 'primary.main' : 'transparent',
              color: isAdvancedOpen ? 'white' : 'text.secondary'
            }}
          >
            <TuneIcon />
          </IconButton>
        </Badge>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <Button
            variant="outlined"
            size="small"
            onClick={clearFilters}
            startIcon={<ClearIcon />}
          >
            Clear
          </Button>
        )}
      </Box>

      {/* Results Summary */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="body2" color="text.secondary">
          Showing {filteredFields} of {totalFields} fields
          {activeFilterCount > 0 && ` (${activeFilterCount} filters applied)`}
        </Typography>

        {/* Sort Options */}
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" color="text.secondary">Sort by:</Typography>
          <Button
            size="small"
            onClick={() => handleSortChange('name')}
            sx={{ minWidth: 'auto' }}
            endIcon={sort.field === 'name' ? (sort.direction === 'asc' ? '↑' : '↓') : null}
          >
            Name
          </Button>
          <Button
            size="small"
            onClick={() => handleSortChange('type')}
            sx={{ minWidth: 'auto' }}
            endIcon={sort.field === 'type' ? (sort.direction === 'asc' ? '↑' : '↓') : null}
          >
            Type
          </Button>
          <Button
            size="small"
            onClick={() => handleSortChange('created')}
            sx={{ minWidth: 'auto' }}
            endIcon={sort.field === 'created' ? (sort.direction === 'asc' ? '↑' : '↓') : null}
          >
            Created
          </Button>
          <Button
            size="small"
            onClick={() => handleSortChange('modified')}
            sx={{ minWidth: 'auto' }}
            endIcon={sort.field === 'modified' ? (sort.direction === 'asc' ? '↑' : '↓') : null}
          >
            Modified
          </Button>
        </Box>
      </Box>

      {/* Advanced Filters */}
      <Accordion expanded={isAdvancedOpen} onChange={() => setIsAdvancedOpen(!isAdvancedOpen)}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">Advanced Filters</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box display="flex" flexDirection="column" gap={3}>
            {/* Row 1: Category, Status, Quick Toggles */}
            <Box display="flex" gap={3} flexWrap="wrap">
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  multiple
                  value={filter.category}
                  onChange={(e) => updateFilter({ category: e.target.value as string[] })}
                  label="Category"
                  renderValue={(selected) => (
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {(selected as string[]).map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  multiple
                  value={filter.status}
                  onChange={(e) => updateFilter({ status: e.target.value as string[] })}
                  label="Status"
                  renderValue={(selected) => (
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {(selected as string[]).map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>

              <Box display="flex" flexDirection="column" gap={1}>
                <Typography variant="caption" color="text.secondary">Quick Filters</Typography>
                <Box display="flex" gap={1}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={filter.hasValidation === true}
                        indeterminate={filter.hasValidation === null}
                        onChange={(e) => updateFilter({ 
                          hasValidation: e.target.checked ? true : (filter.hasValidation === true ? null : true)
                        })}
                      />
                    }
                    label="Has Validation"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={filter.hasDependencies === true}
                        indeterminate={filter.hasDependencies === null}
                        onChange={(e) => updateFilter({ 
                          hasDependencies: e.target.checked ? true : (filter.hasDependencies === true ? null : true)
                        })}
                      />
                    }
                    label="Has Dependencies"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={filter.favorite === true}
                        indeterminate={filter.favorite === null}
                        onChange={(e) => updateFilter({ 
                          favorite: e.target.checked ? true : (filter.favorite === true ? null : true)
                        })}
                      />
                    }
                    label="Favorites"
                  />
                </Box>
              </Box>
            </Box>

            {/* Row 2: Complexity Slider */}
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Complexity Level: {filter.complexity[0]} - {filter.complexity[1]}
              </Typography>
              <Slider
                value={filter.complexity}
                onChange={(_, value) => updateFilter({ complexity: value as [number, number] })}
                valueLabelDisplay="auto"
                min={1}
                max={10}
                step={1}
                marks={[
                  { value: 1, label: 'Simple' },
                  { value: 5, label: 'Medium' },
                  { value: 10, label: 'Complex' }
                ]}
                sx={{ width: '100%', maxWidth: 400 }}
              />
            </Box>

            {/* Row 3: Tags */}
            <FormControl sx={{ minWidth: 300 }}>
              <InputLabel>Tags</InputLabel>
              <Select
                multiple
                value={filter.tags}
                onChange={(e) => updateFilter({ tags: e.target.value as string[] })}
                label="Tags"
                renderValue={(selected) => (
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {availableTags.map((tag) => (
                  <MenuItem key={tag} value={tag}>
                    {tag}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Save Filter */}
            <Box display="flex" gap={2} alignItems="center" pt={2} borderTop="1px solid rgba(0, 0, 0, 0.1)">
              <TextField
                size="small"
                placeholder="Filter name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                sx={{ width: 200 }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleSaveFilter}
                disabled={!filterName.trim() || !onSaveFilter}
              >
                Save Filter
              </Button>
              
              {savedFilters.length > 0 && (
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Saved Filters</InputLabel>
                  <Select
                    value=""
                    onChange={(e) => {
                      const savedFilter = savedFilters.find(f => f.id === e.target.value);
                      if (savedFilter && onLoadFilter) {
                        setFilter(savedFilter.filter);
                        onLoadFilter(savedFilter.filter);
                      }
                    }}
                    label="Saved Filters"
                  >
                    {savedFilters.map((savedFilter) => (
                      <MenuItem key={savedFilter.id} value={savedFilter.id}>
                        {savedFilter.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default FieldSearchFilterPanel;