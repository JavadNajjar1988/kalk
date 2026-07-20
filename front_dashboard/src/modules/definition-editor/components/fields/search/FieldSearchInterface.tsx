import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Badge,
  Skeleton
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';

import FieldSearchFilterPanel, { FieldSearchFilter, SortOption } from './FieldSearchFilterPanel';
import { useFieldSearch } from './useFieldSearch';
import { SearchableField } from './FieldSearchEngine';

interface FieldSearchInterfaceProps {
  fields: SearchableField[];
  onFieldEdit?: (field: SearchableField) => void;
  onFieldDelete?: (fieldId: string) => void;
  onFieldToggleVisibility?: (fieldId: string, visible: boolean) => void;
  onFieldToggleFavorite?: (fieldId: string, favorite: boolean) => void;
  isLoading?: boolean;
  error?: string | null;
}

const FieldSearchInterface: React.FC<FieldSearchInterfaceProps> = ({
  fields,
  onFieldEdit,
  onFieldDelete,
  onFieldToggleVisibility,
  onFieldToggleFavorite,
  isLoading = false,
  error = null
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const {
    searchResult,
    isSearching,
    currentFilter,
    currentSort,
    updateFilter,
    updateSort,
    resetSearch,
    exportResults,
    savedFilters,
    saveFilter,
    loadFilter,
    deleteFilter,
    searchStats
  } = useFieldSearch(fields, {
    debounceDelay: 300,
    enablePersistence: true,
    storageKey: 'field-management-search'
  });

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const types = new Set<string>();
    const categories = new Set<string>();
    const tags = new Set<string>();

    fields.forEach(field => {
      types.add(field.type);
      categories.add(field.category);
      field.tags.forEach(tag => tags.add(tag));
    });

    return {
      fieldTypes: Array.from(types).sort(),
      categories: Array.from(categories).sort(),
      availableTags: Array.from(tags).sort()
    };
  }, [fields]);

  // Handle export
  const handleExport = (format: 'csv' | 'json') => {
    const content = exportResults(format);
    const blob = new Blob([content], { 
      type: format === 'csv' ? 'text/csv' : 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fields-export.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Render field in list mode
  const renderFieldListItem = (field: SearchableField) => (
    <ListItem
      key={field.id}
      sx={{
        mb: 1,
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: 1,
        background: 'rgba(255, 255, 255, 0.8)',
        '&:hover': {
          background: 'rgba(255, 255, 255, 0.9)',
          transform: 'translateY(-1px)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        },
        transition: 'all 0.2s ease'
      }}
    >
      <ListItemText
        primary={
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="subtitle1" fontWeight={600}>
              {field.name}
            </Typography>
            <Chip 
              label={field.type} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
            <Chip 
              label={field.category} 
              size="small" 
              color="secondary" 
              variant="outlined"
            />
            {field.favorite && (
              <StarIcon sx={{ color: 'gold', fontSize: 16 }} />
            )}
            {field.status !== 'active' && (
              <Chip 
                label={field.status} 
                size="small" 
                color={field.status === 'draft' ? 'warning' : 'error'}
                variant="filled"
              />
            )}
          </Box>
        }
        secondary={
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {field.description || 'No description available'}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Typography variant="caption" color="text.secondary">
                Complexity: {field.complexity}/10
              </Typography>
              {field.hasValidation && (
                <Chip label="Validation" size="small" color="success" variant="outlined" />
              )}
              {field.hasDependencies && (
                <Chip label="Dependencies" size="small" color="info" variant="outlined" />
              )}
              {field.tags.length > 0 && (
                <Box display="flex" gap={0.5}>
                  {field.tags.slice(0, 3).map(tag => (
                    <Chip 
                      key={tag} 
                      label={tag} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  ))}
                  {field.tags.length > 3 && (
                    <Chip 
                      label={`+${field.tags.length - 3}`} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  )}
                </Box>
              )}
            </Box>
          </Box>
        }
      />
      <ListItemSecondaryAction>
        <Box display="flex" gap={1}>
          <Tooltip title={field.favorite ? "Remove from favorites" : "Add to favorites"}>
            <IconButton
              size="small"
              onClick={() => onFieldToggleFavorite?.(field.id, !field.favorite)}
            >
              {field.favorite ? <StarIcon sx={{ color: 'gold' }} /> : <StarBorderIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit field">
            <IconButton
              size="small"
              onClick={() => onFieldEdit?.(field)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete field">
            <IconButton
              size="small"
              color="error"
              onClick={() => onFieldDelete?.(field.id)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </ListItemSecondaryAction>
    </ListItem>
  );

  // Render field in grid mode
  const renderFieldCard = (field: SearchableField) => (
    <Grid item xs={12} sm={6} md={4} lg={3} key={field.id}>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
          },
          transition: 'all 0.2s ease'
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="h6" component="h3" noWrap>
              {field.name}
            </Typography>
            {field.favorite && (
              <StarIcon sx={{ color: 'gold', fontSize: 20 }} />
            )}
          </Box>
          
          <Box display="flex" gap={1} mb={1}>
            <Chip label={field.type} size="small" color="primary" />
            <Chip label={field.category} size="small" color="secondary" />
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {field.description || 'No description'}
          </Typography>

          <Box display="flex" gap={1} mb={1} flexWrap="wrap">
            {field.hasValidation && (
              <Chip label="Validation" size="small" color="success" variant="outlined" />
            )}
            {field.hasDependencies && (
              <Chip label="Dependencies" size="small" color="info" variant="outlined" />
            )}
          </Box>

          <Typography variant="caption" color="text.secondary">
            Complexity: {field.complexity}/10
          </Typography>
        </CardContent>
        
        <CardActions>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={() => onFieldEdit?.(field)}
          >
            Edit
          </Button>
          <IconButton
            size="small"
            onClick={() => onFieldToggleFavorite?.(field.id, !field.favorite)}
          >
            {field.favorite ? <StarIcon sx={{ color: 'gold' }} /> : <StarBorderIcon />}
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => onFieldDelete?.(field.id)}
          >
            <DeleteIcon />
          </IconButton>
        </CardActions>
      </Card>
    </Grid>
  );

  // Loading state
  if (isLoading) {
    return (
      <Box>
        <FieldSearchFilterPanel
          onFilterChange={() => {}}
          onSortChange={() => {}}
          onViewModeChange={() => {}}
          fieldTypes={[]}
          categories={[]}
          availableTags={[]}
          totalFields={0}
          filteredFields={0}
        />
        <Box display="flex" flexDirection="column" gap={2}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} variant="rectangular" height={100} />
          ))}
        </Box>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Search and Filter Panel */}
      <FieldSearchFilterPanel
        onFilterChange={updateFilter}
        onSortChange={updateSort}
        onViewModeChange={setViewMode}
        fieldTypes={filterOptions.fieldTypes}
        categories={filterOptions.categories}
        availableTags={filterOptions.availableTags}
        totalFields={searchStats.totalFields}
        filteredFields={searchStats.filteredFields}
        savedFilters={savedFilters}
        onSaveFilter={saveFilter}
        onLoadFilter={(filter) => updateFilter(filter)}
      />

      {/* Results and Actions */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={2}>
          {isSearching && <CircularProgress size={20} />}
          <Typography variant="body1">
            {searchResult ? `${searchResult.filteredCount} fields` : 'No results'}
            {searchResult && searchResult.searchTime && (
              <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                ({searchResult.searchTime}ms)
              </Typography>
            )}
          </Typography>
        </Box>

        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('csv')}
            disabled={!searchResult?.fields.length}
          >
            CSV
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('json')}
            disabled={!searchResult?.fields.length}
          >
            JSON
          </Button>
        </Box>
      </Box>

      {/* Results */}
      {searchResult?.fields.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <FilterListIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No fields match your criteria
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Try adjusting your search terms or filters
          </Typography>
          <Button variant="outlined" onClick={resetSearch}>
            Clear All Filters
          </Button>
        </Paper>
      ) : (
        <Paper
          sx={{
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 2
          }}
        >
          {viewMode === 'list' ? (
            <List sx={{ p: 2 }}>
              {searchResult?.fields.map(renderFieldListItem)}
            </List>
          ) : (
            <Box p={2}>
              <Grid container spacing={2}>
                {searchResult?.fields.map(renderFieldCard)}
              </Grid>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default FieldSearchInterface;