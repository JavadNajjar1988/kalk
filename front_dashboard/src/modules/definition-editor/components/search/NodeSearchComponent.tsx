import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Typography,
  Chip,
  Paper,
  Divider,
  IconButton,
  Badge,
  Tooltip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Slider,
  Grid,
  alpha
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Tune as TuneIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  AccountTree as HierarchyIcon,
  DataObject as DataIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';
import { useDebounce } from '../../../../hooks/useDebounce';
import { useAdvancedFilter } from '../../hooks/useAdvancedFilter';
import { loadGeographicalData, loadCategoryLevels, loadCategoryNodes } from '../../data/loader';
import { CategoryType, DefinitionNode, ExtendedHierarchyLevel } from '../../types';
import AdvancedFilterManager from '../filters/AdvancedFilterManager';
import type { NodeSearchResult, SearchFilterConfig, AdvancedFilterConfig, FilterFieldDefinition } from '../../types/fieldConstructor';

interface NodeSearchComponentProps {
  // Basic configuration
  categoryTypes?: CategoryType[];           // Which categories to search in
  placeholder?: string;
  maxResults?: number;
  
  // Search behavior
  minSearchLength?: number;
  searchDelay?: number;
  autoFocus?: boolean;
  
  // Selection handling
  multiSelect?: boolean;
  selectedNodes?: NodeSearchResult[];
  onSelectionChange?: (nodes: NodeSearchResult[]) => void;
  
  // Filtering
  enableFilters?: boolean;
  enableAdvancedFilters?: boolean;      // Enable advanced filter system
  filterConfig?: SearchFilterConfig;
  advancedFilterConfig?: AdvancedFilterConfig;
  onAdvancedFilterChange?: (config: AdvancedFilterConfig) => void;
  
  // Display options
  showPath?: boolean;                      // Show hierarchical path
  showCoordinates?: boolean;              // Show GPS coordinates if available
  showLevel?: boolean;                    // Show level information
  groupByCategory?: boolean;              // Group results by category
  
  // Advanced features
  enableFavorites?: boolean;              // Allow marking favorites
  enableRecent?: boolean;                 // Show recently selected
  
  // Callbacks
  onNodeClick?: (node: NodeSearchResult) => void;
  onSearchStart?: () => void;
  onSearchComplete?: (results: NodeSearchResult[]) => void;
}

const NodeSearchComponent: React.FC<NodeSearchComponentProps> = ({
  categoryTypes = [CategoryType.GEOGRAPHICAL],
  placeholder = 'جستجو در گره‌ها...',
  maxResults = 50,
  minSearchLength = 2,
  searchDelay = 300,
  autoFocus = false,
  multiSelect = false,
  selectedNodes = [],
  onSelectionChange,
  enableFilters = true,
  enableAdvancedFilters = false,
  filterConfig,
  advancedFilterConfig,
  onAdvancedFilterChange,
  showPath = true,
  showCoordinates = true,
  showLevel = true,
  groupByCategory = true,
  enableFavorites = false,
  enableRecent = false,
  onNodeClick,
  onSearchStart,
  onSearchComplete
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<NodeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Filter states
  const [levelFilter, setLevelFilter] = useState<number[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<CategoryType[]>(categoryTypes);
  const [hasCoordinatesFilter, setHasCoordinatesFilter] = useState<boolean | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    // Load favorites from localStorage
    const saved = localStorage.getItem('nodeSearch_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [recentNodes, setRecentNodes] = useState<NodeSearchResult[]>(() => {
    // Load recent from localStorage
    const saved = localStorage.getItem('nodeSearch_recent');
    return saved ? JSON.parse(saved) : [];
  });
  
  // All available nodes (cached)
  const [allNodes, setAllNodes] = useState<Record<CategoryType, DefinitionNode[]>>({} as Record<CategoryType, DefinitionNode[]>);
  const [categoryLevels, setCategoryLevels] = useState<Record<CategoryType, ExtendedHierarchyLevel[]>>({} as Record<CategoryType, ExtendedHierarchyLevel[]>);
  
  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, searchDelay);
  
  // Advanced filter hook
  const {
    filterConfig: advancedConfig,
    applyFilters,
    updateConfig: updateAdvancedConfig,
    saveFilter,
    loadFilter,
    deleteFilter,
    getFilterFieldDefinitions,
    hasActiveFilters,
    savedFilters
  } = useAdvancedFilter({
    initialConfig: advancedFilterConfig,
    availableFields: [],
    storageKey: 'node_search_filters'
  });
  
  // Load category data
  useEffect(() => {
    const loadAllCategoryData = async () => {
      try {
        setLoading(true);
        const nodePromises = categoryTypes.map(async (categoryType) => {
          const [nodes, levels] = await Promise.all([
            loadCategoryData(categoryType),
            loadCategoryLevels(categoryType)
          ]);
          return { categoryType, nodes, levels };
        });
        
        const results = await Promise.all(nodePromises);
        
        const nodesMap: Record<CategoryType, DefinitionNode[]> = {} as Record<CategoryType, DefinitionNode[]>;
        const levelsMap: Record<CategoryType, ExtendedHierarchyLevel[]> = {} as Record<CategoryType, ExtendedHierarchyLevel[]>;
        
        results.forEach(({ categoryType, nodes, levels }) => {
          nodesMap[categoryType] = nodes;
          levelsMap[categoryType] = levels;
        });
        
        setAllNodes(nodesMap);
        setCategoryLevels(levelsMap);
        setError('');
      } catch (err) {
        console.error('Error loading category data:', err);
        setError('خطا در بارگذاری داده‌های دسته‌بندی');
      } finally {
        setLoading(false);
      }
    };
    
    loadAllCategoryData();
  }, [categoryTypes]);
  
  // Helper function to load category data
  const loadCategoryData = useCallback(async (categoryType: CategoryType): Promise<DefinitionNode[]> => {
    // Use the categoryType enum value as the category ID
    const categoryId = categoryType.toString();
    return loadCategoryNodes(categoryType, categoryId);
  }, []);
  
  // Build hierarchical path for a node
  const buildNodePath = useCallback((node: DefinitionNode, categoryType: CategoryType): string[] => {
    const path: string[] = [];
    const allCategoryNodes = allNodes[categoryType] || [];
    
    const findPath = (nodeId: string): void => {
      const currentNode = allCategoryNodes.find(n => n.id === nodeId);
      if (currentNode) {
        path.unshift(currentNode.name);
        if (currentNode.parentId) {
          findPath(currentNode.parentId);
        }
      }
    };
    
    findPath(node.id);
    return path;
  }, [allNodes]);
  
  // Convert DefinitionNode to NodeSearchResult
  const convertToSearchResult = useCallback((node: DefinitionNode, categoryType: CategoryType): NodeSearchResult => {
    const path = buildNodePath(node, categoryType);
    
    return {
      id: node.id,
      name: node.name,
      description: node.description,
      level: node.level,
      parentId: node.parentId,
      categoryType: categoryType.toString(),
      path,
      coordinates: node.coordinates,
      metadata: {
        englishName: node.natoEquivalent,
        icon: node.icon,
        specialty: node.specialty,
        country: node.country
      }
    };
  }, [buildNodePath]);
  
  // Search function with scoring and advanced filtering
  const searchNodes = useCallback((term: string): NodeSearchResult[] => {
    if (!term || term.length < minSearchLength) {
      return [];
    }
    
    const results: NodeSearchResult[] = [];
    const searchLower = term.toLowerCase();
    
    categoryFilter.forEach(categoryType => {
      const nodes = allNodes[categoryType] || [];
      
      nodes.forEach(node => {
        let score = 0;
        
        // Name matching (highest priority)
        if (node.name.toLowerCase().includes(searchLower)) {
          score += node.name.toLowerCase() === searchLower ? 100 : 50;
        }
        
        // Description matching
        if (node.description?.toLowerCase().includes(searchLower)) {
          score += 25;
        }
        
        // NATO/English name matching
        if (node.natoEquivalent?.toLowerCase().includes(searchLower)) {
          score += 30;
        }
        
        // Specialty matching
        if (node.specialty?.toLowerCase().includes(searchLower)) {
          score += 20;
        }
        
        // Apply basic filters
        if (score > 0) {
          // Level filter
          if (levelFilter.length > 0 && !levelFilter.includes(node.level)) {
            return;
          }
          
          // Coordinates filter
          if (hasCoordinatesFilter !== null) {
            const hasCoords = !!(node.coordinates?.lat && node.coordinates?.lng);
            if (hasCoordinatesFilter !== hasCoords) {
              return;
            }
          }
          
          const searchResult = convertToSearchResult(node, categoryType);
          searchResult.score = score;
          results.push(searchResult);
        }
      });
    });
    
    // Apply advanced filters if enabled
    let filteredResults = results;
    if (enableAdvancedFilters && hasActiveFilters) {
      filteredResults = applyFilters(results, advancedConfig);
    }
    
    // Sort by score and limit results
    return filteredResults
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, maxResults);
  }, [allNodes, categoryFilter, levelFilter, hasCoordinatesFilter, minSearchLength, maxResults, convertToSearchResult, enableAdvancedFilters, hasActiveFilters, applyFilters, advancedConfig]);
  
  // Perform search when term changes
  useEffect(() => {
    if (debouncedSearchTerm.length >= minSearchLength) {
      onSearchStart?.();
      setLoading(true);
      
      setTimeout(() => {
        const results = searchNodes(debouncedSearchTerm);
        setSearchResults(results);
        setLoading(false);
        onSearchComplete?.(results);
      }, 50); // Small delay to prevent UI blocking
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm, searchNodes, minSearchLength, onSearchStart, onSearchComplete]);
  
  // Handle node selection
  const handleNodeSelection = (node: NodeSearchResult) => {
    if (multiSelect) {
      const isSelected = selectedNodes.some(n => n.id === node.id);
      const newSelection = isSelected
        ? selectedNodes.filter(n => n.id !== node.id)
        : [...selectedNodes, node];
      
      onSelectionChange?.(newSelection);
    } else {
      onSelectionChange?.([node]);
    }
    
    // Add to recent if enabled
    if (enableRecent) {
      const newRecent = [node, ...recentNodes.filter(n => n.id !== node.id)].slice(0, 10);
      setRecentNodes(newRecent);
      localStorage.setItem('nodeSearch_recent', JSON.stringify(newRecent));
    }
    
    onNodeClick?.(node);
  };
  
  // Toggle favorite
  const toggleFavorite = (nodeId: string) => {
    const newFavorites = favorites.includes(nodeId)
      ? favorites.filter(id => id !== nodeId)
      : [...favorites, nodeId];
    
    setFavorites(newFavorites);
    localStorage.setItem('nodeSearch_favorites', JSON.stringify(newFavorites));
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
  };
  
  // Available levels for filtering
  const availableLevels = useMemo(() => {
    const levels = new Set<number>();
    Object.values(allNodes).forEach(nodes => {
      nodes.forEach(node => levels.add(node.level));
    });
    return Array.from(levels).sort((a, b) => a - b);
  }, [allNodes]);
  
  // Group results by category
  const groupedResults = useMemo(() => {
    if (!groupByCategory) {
      return { all: searchResults };
    }
    
    const groups: Record<string, NodeSearchResult[]> = {};
    searchResults.forEach(result => {
      const category = result.categoryType;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(result);
    });
    
    return groups;
  }, [searchResults, groupByCategory]);
  
  // Render node item
  const renderNodeItem = (node: NodeSearchResult) => {
    const isSelected = selectedNodes.some(n => n.id === node.id);
    const isFavorite = favorites.includes(node.id);
    
    return (
      <ListItem key={node.id} disablePadding>
        <ListItemButton
          selected={isSelected}
          onClick={() => handleNodeSelection(node)}
          sx={{
            py: 1,
            borderRadius: 1,
            mx: 0.5,
            mb: 0.5,
            '&.Mui-selected': {
              backgroundColor: alpha('rgb(25, 118, 210)', 0.12),
              '&:hover': {
                backgroundColor: alpha('rgb(25, 118, 210)', 0.16),
              }
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            {node.categoryType === 'GEOGRAPHICAL' ? (
              <LocationIcon fontSize="small" color={isSelected ? 'primary' : 'action'} />
            ) : (
              <CategoryIcon fontSize="small" color={isSelected ? 'primary' : 'action'} />
            )}
          </ListItemIcon>
          
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" fontWeight={isSelected ? 600 : 400}>
                  {node.name}
                </Typography>
                
                {showLevel && (
                  <Chip label={`سطح ${node.level}`} size="small" variant="outlined" />
                )}
                
                {showCoordinates && node.coordinates && (
                  <Tooltip title={`${node.coordinates.lat}, ${node.coordinates.lng}`}>
                    <LocationIcon fontSize="small" color="info" />
                  </Tooltip>
                )}
                
                {node.score && node.score > 80 && (
                  <StarIcon fontSize="small" color="warning" />
                )}
              </Box>
            }
            secondary={
              <Box>
                {node.description && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {node.description}
                  </Typography>
                )}
                
                {showPath && node.path && node.path.length > 1 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    {node.path.slice(0, -1).map((pathItem, idx) => (
                      <React.Fragment key={idx}>
                        <Typography variant="caption" color="text.secondary">
                          {pathItem}
                        </Typography>
                        {idx < node.path!.length - 2 && (
                          <ChevronRightIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                        )}
                      </React.Fragment>
                    ))}
                  </Box>
                )}
              </Box>
            }
          />
          
          {enableFavorites && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(node.id);
              }}
              sx={{ ml: 1 }}
            >
              {isFavorite ? (
                <StarIcon fontSize="small" color="warning" />
              ) : (
                <StarBorderIcon fontSize="small" />
              )}
            </IconButton>
          )}
        </ListItemButton>
      </ListItem>
    );
  };
  
  return (
    <Box>
      {/* Search Input */}
      <TextField
        fullWidth
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {enableFilters && (
                  <Tooltip title="فیلترها">
                    <Badge
                      badgeContent={
                        levelFilter.length + 
                        (categoryFilter.length !== categoryTypes.length ? 1 : 0) +
                        (hasCoordinatesFilter !== null ? 1 : 0) +
                        (enableAdvancedFilters && hasActiveFilters ? 1 : 0)
                      }
                      color="primary"
                      variant="dot"
                    >
                      <IconButton
                        size="small"
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <FilterIcon fontSize="small" />
                      </IconButton>
                    </Badge>
                  </Tooltip>
                )}
                
                {searchTerm && (
                  <IconButton size="small" onClick={clearSearch}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
                
                {loading && <CircularProgress size={20} />}
              </Box>
            </InputAdornment>
          )
        }}
      />
      
      {/* Filters */}
      {enableFilters && showFilters && (
        <Paper sx={{ p: 2, mt: 1, mb: 1 }} variant="outlined">
          <Typography variant="subtitle2" gutterBottom>
            فیلترهای جستجو
          </Typography>
          
          <Grid container spacing={2}>
            {/* Category Filter */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>دسته‌بندی‌ها</InputLabel>
                <Select
                  multiple
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as CategoryType[])}
                  renderValue={(selected) => `${selected.length} دسته انتخاب شده`}
                >
                  {categoryTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      <FormControlLabel
                        control={<Checkbox checked={categoryFilter.includes(type)} />}
                        label={type}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Level Filter */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>سطوح</InputLabel>
                <Select
                  multiple
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value as number[])}
                  renderValue={(selected) => `${selected.length || 'همه'} سطح`}
                >
                  {availableLevels.map((level) => (
                    <MenuItem key={level} value={level}>
                      <FormControlLabel
                        control={<Checkbox checked={levelFilter.includes(level)} />}
                        label={`سطح ${level}`}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Coordinates Filter */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={hasCoordinatesFilter === true}
                    indeterminate={hasCoordinatesFilter === null}
                    onChange={(e) => {
                      if (hasCoordinatesFilter === null) {
                        setHasCoordinatesFilter(true);
                      } else if (hasCoordinatesFilter === true) {
                        setHasCoordinatesFilter(false);
                      } else {
                        setHasCoordinatesFilter(null);
                      }
                    }}
                  />
                }
                label="فقط گره‌های دارای مختصات جغرافیایی"
              />
            </Grid>
                          
            {/* Advanced Filters */}
            {enableAdvancedFilters && (
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2">
                    Advanced Filters
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    endIcon={showAdvancedFilters ? <ExpandMoreIcon sx={{ transform: 'rotate(180deg)' }} /> : <ExpandMoreIcon />}
                  >
                    {showAdvancedFilters ? 'Hide' : 'Show'}
                  </Button>
                </Box>
                              
                {showAdvancedFilters && (
                  <AdvancedFilterManager
                    availableFields={getFilterFieldDefinitions()}
                    currentFilter={advancedConfig}
                    onFilterChange={(config) => {
                      updateAdvancedConfig(config);
                      onAdvancedFilterChange?.(config);
                    }}
                    onApplyFilter={(config) => {
                      updateAdvancedConfig(config);
                      onAdvancedFilterChange?.(config);
                      // Trigger search with new filters
                      if (debouncedSearchTerm.length >= minSearchLength) {
                        const results = searchNodes(debouncedSearchTerm);
                        setSearchResults(results);
                      }
                    }}
                    savedFilters={savedFilters}
                    onSaveFilter={saveFilter}
                    onLoadFilter={loadFilter}
                    onDeleteFilter={deleteFilter}
                  />
                )}
              </Grid>
            )}
          </Grid>
        </Paper>
      )}
      
      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
      
      {/* Results */}
      {searchTerm.length >= minSearchLength && (
        <Paper sx={{ mt: 1, maxHeight: 400, overflow: 'auto' }} variant="outlined">
          {searchResults.length === 0 && !loading ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                هیچ نتیجه‌ای برای "{searchTerm}" یافت نشد
              </Typography>
            </Box>
          ) : (
            <List dense>
              {Object.entries(groupedResults).map(([category, nodes]) => (
                <Box key={category}>
                  {groupByCategory && Object.keys(groupedResults).length > 1 && (
                    <>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" color="primary">
                              {category} ({nodes.length})
                            </Typography>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </>
                  )}
                  
                  {nodes.map(renderNodeItem)}
                </Box>
              ))}
            </List>
          )}
        </Paper>
      )}
      
      {/* Recent and Favorites */}
      {(enableRecent || enableFavorites) && searchTerm.length < minSearchLength && (
        <Box sx={{ mt: 2 }}>
          {enableRecent && recentNodes.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">اخیراً انتخاب شده ({recentNodes.length})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {recentNodes.slice(0, 5).map(renderNodeItem)}
                </List>
              </AccordionDetails>
            </Accordion>
          )}
          
          {enableFavorites && favorites.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">مورد علاقه ({favorites.length})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {searchResults
                    .filter(node => favorites.includes(node.id))
                    .slice(0, 5)
                    .map(renderNodeItem)}
                </List>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      )}
    </Box>
  );
};

export default NodeSearchComponent;