// Hierarchical Input Component for Smart Field Builder System
// کامپوننت ورودی سلسله‌مراتبی برای سیستم سازنده فیلد هوشمند

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Paper,
  Breadcrumbs,
  LinearProgress,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Stack,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  alpha
} from '@mui/material';
import {
  AccountTree as HierarchicalIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  NavigateNext as NavigateNextIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import type { HierarchicalFieldConfig } from '../enhancement/HierarchicalFieldManager';
import { SmartFieldConfig } from '../../smart-field-builder/types';
import { loadGeographicalData, loadCategoryLevels } from '../../data/loader';
import { CategoryType } from '../../types';

interface HierarchicalNode {
  id: string;
  name: string;
  englishName: string;
  level: number;
  parentId: string | null;
  description?: string;
  coordinates?: { lat: number; lng: number };
  children: HierarchicalNode[];
  hasChildren: boolean;
}

interface HierarchicalSelection {
  path: Array<{
    nodeId: string;
    nodeName: string;
    level: number;
  }>;
  finalNode: HierarchicalNode | null;
}

interface HierarchicalInputComponentProps {
  config: SmartFieldConfig;
  value: HierarchicalSelection | null;
  onChange: (value: HierarchicalSelection | null) => void;
  error?: string;
  disabled?: boolean;
  variant?: 'outlined' | 'filled' | 'standard';
  size?: 'small' | 'medium' | 'large';
}

const HierarchicalInputComponent: React.FC<HierarchicalInputComponentProps> = ({
  config,
  value = null,
  onChange,
  error,
  disabled = false,
  variant = 'outlined',
  size = 'medium'
}) => {
  const [treeData, setTreeData] = useState<HierarchicalNode[]>([]);
  const [availableLevels, setAvailableLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([1]));
  const [dataError, setDataError] = useState<string>('');

  // Get hierarchical configuration from field enhancements
  const hierarchicalConfig = config.enhancements.find(e => e.type === 'hierarchical')?.config as HierarchicalFieldConfig;
  const dataSourceConfig = config.dataSource;
  
  const rootCategory = dataSourceConfig?.type === 'category' ? dataSourceConfig.config.categoryId : 
                      (hierarchicalConfig?.rootCategory || 'geographical');
  const maxDepth = hierarchicalConfig?.maxDepth || 5;
  const showPath = hierarchicalConfig?.showPath !== false;
  const allowSearch = hierarchicalConfig?.allowSearch !== false;

  // Load hierarchical data on component mount
  useEffect(() => {
    loadHierarchicalData();
  }, [rootCategory]);

  const loadHierarchicalData = async () => {
    try {
      setLoading(true);
      setDataError('');
      
      let categoryEnum: CategoryType;
      switch (rootCategory.toLowerCase()) {
        case 'geographical':
          categoryEnum = CategoryType.GEOGRAPHICAL;
          break;
        case 'equipment':
          categoryEnum = CategoryType.EQUIPMENT;
          break;
        case 'personnel':
          categoryEnum = CategoryType.PERSONS;
          break;
        case 'military_rank':
          categoryEnum = CategoryType.MILITARY_RANK;
          break;
        default:
          categoryEnum = CategoryType.GEOGRAPHICAL;
      }

      const [nodes, levels] = await Promise.all([
        loadGeographicalData(rootCategory),
        loadCategoryLevels(categoryEnum)
      ]);

      setTreeData(buildHierarchicalTree(nodes));
      setAvailableLevels(levels);
    } catch (error) {
      console.error('Failed to load hierarchical data:', error);
      setDataError('خطا در بارگذاری داده‌های سلسله‌مراتبی');
    } finally {
      setLoading(false);
    }
  };

  // Build hierarchical tree from flat nodes
  const buildHierarchicalTree = (nodes: any[]): HierarchicalNode[] => {
    const nodeMap = new Map<string, HierarchicalNode>();
    const rootNodes: HierarchicalNode[] = [];

    // First pass: create all nodes
    nodes.forEach(node => {
      const treeNode: HierarchicalNode = {
        id: node.id,
        name: node.name,
        englishName: node.englishName || node.name,
        level: node.level,
        parentId: node.parentId || null,
        description: node.description,
        coordinates: node.coordinates,
        children: [],
        hasChildren: false
      };
      nodeMap.set(node.id, treeNode);
    });

    // Second pass: build parent-child relationships
    nodes.forEach(node => {
      const treeNode = nodeMap.get(node.id)!;
      if (node.parentId && nodeMap.has(node.parentId)) {
        const parent = nodeMap.get(node.parentId)!;
        parent.children.push(treeNode);
        parent.hasChildren = true;
      } else {
        rootNodes.push(treeNode);
      }
    });

    return rootNodes;
  };

  // Get available options for a specific level
  const getOptionsForLevel = useCallback((level: number, currentPath: HierarchicalSelection['path']): HierarchicalNode[] => {
    if (level === 1) {
      return treeData;
    }

    if (level > currentPath.length + 1) {
      return [];
    }

    const parentNodeId = currentPath[level - 2]?.nodeId;
    if (!parentNodeId) {
      return [];
    }

    const findNodeById = (nodes: HierarchicalNode[], id: string): HierarchicalNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
      return null;
    };

    const parentNode = findNodeById(treeData, parentNodeId);
    return parentNode?.children || [];
  }, [treeData]);

  // Handle level selection
  const handleLevelSelection = useCallback((level: number, nodeId: string) => {
    const findNodeById = (nodes: HierarchicalNode[], id: string): HierarchicalNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
      return null;
    };

    const selectedNode = findNodeById(treeData, nodeId);
    if (!selectedNode) return;

    // Build new path up to selected level
    const newPath = (value?.path || []).slice(0, level - 1);
    newPath.push({
      nodeId: selectedNode.id,
      nodeName: selectedNode.name,
      level: selectedNode.level
    });

    const newSelection: HierarchicalSelection = {
      path: newPath,
      finalNode: selectedNode.hasChildren ? null : selectedNode
    };

    onChange(newSelection);

    // Auto-expand next level if node has children
    if (selectedNode.hasChildren && level < maxDepth) {
      setExpandedLevels(prev => new Set([...prev, level + 1]));
    }
  }, [treeData, value, maxDepth, onChange]);

  // Clear selection
  const handleClear = useCallback(() => {
    onChange(null);
    setExpandedLevels(new Set([1]));
  }, [onChange]);

  // Search functionality
  const filteredOptionsForLevel = useCallback((level: number, options: HierarchicalNode[]): HierarchicalNode[] => {
    if (!allowSearch || !searchTerm.trim()) return options;
    
    return options.filter(option => 
      option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.englishName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allowSearch, searchTerm]);

  // Get level name
  const getLevelName = useCallback((level: number): string => {
    if (availableLevels[level - 1]) {
      return availableLevels[level - 1].name;
    }
    return `سطح ${level}`;
  }, [availableLevels]);

  // Get field icon based on category
  const getFieldIcon = () => {
    switch (rootCategory.toLowerCase()) {
      case 'geographical':
        return <LocationIcon color="primary" />;
      case 'equipment':
        return <BusinessIcon color="primary" />;
      case 'personnel':
      case 'military_rank':
        return <PersonIcon color="primary" />;
      default:
        return <HierarchicalIcon color="primary" />;
    }
  };

  // Calculate maximum selectable level
  const maxSelectableLevel = useMemo(() => {
    const pathLength = value?.path.length || 0;
    return Math.min(pathLength + 1, maxDepth, availableLevels.length);
  }, [value, maxDepth, availableLevels]);

  if (loading) {
    return (
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {config.name}
          {config.isRequired && (
            <Typography component="span" color="error" sx={{ ml: 0.5 }}>
              *
            </Typography>
          )}
        </Typography>
        <LinearProgress sx={{ mb: 1 }} />
        <Typography variant="caption" color="text.secondary">
          در حال بارگذاری داده‌های سلسله‌مراتبی...
        </Typography>
      </Box>
    );
  }

  if (dataError) {
    return (
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {config.name}
          {config.isRequired && (
            <Typography component="span" color="error" sx={{ ml: 0.5 }}>
              *
            </Typography>
          )}
        </Typography>
        <Alert severity="error">
          {dataError}
          <Button
            size="small"
            onClick={loadHierarchicalData}
            startIcon={<RefreshIcon />}
            sx={{ mt: 1 }}
          >
            تلاش مجدد
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {getFieldIcon()}
        <Typography variant="subtitle1" sx={{ ml: 1 }}>
          {config.name}
          {config.isRequired && (
            <Typography component="span" color="error" sx={{ ml: 0.5 }}>
              *
            </Typography>
          )}
        </Typography>
        {value && (
          <IconButton
            size="small"
            onClick={handleClear}
            sx={{ ml: 'auto' }}
            color="error"
          >
            <ClearIcon />
          </IconButton>
        )}
      </Box>

      {/* Search */}
      {allowSearch && (
        <TextField
          fullWidth
          size="small"
          placeholder="جستجو در گزینه‌ها..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            endAdornment: searchTerm && (
              <IconButton size="small" onClick={() => setSearchTerm('')}>
                <ClearIcon />
              </IconButton>
            )
          }}
          sx={{ mb: 2 }}
        />
      )}

      {/* Path Display */}
      {showPath && value?.path && value.path.length > 0 && (
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            mb: 2,
            backgroundColor: alpha('rgb(25, 118, 210)', 0.04)
          }}
        >
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            مسیر انتخاب شده:
          </Typography>
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            sx={{ fontSize: '0.875rem' }}
          >
            {value.path.map((pathItem, index) => (
              <Chip
                key={pathItem.nodeId}
                label={pathItem.nodeName}
                size="small"
                color="primary"
                variant={index === value.path.length - 1 ? 'filled' : 'outlined'}
              />
            ))}
          </Breadcrumbs>
        </Paper>
      )}

      {/* Level Selectors */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {Array.from({ length: maxSelectableLevel }, (_, index) => {
          const level = index + 1;
          const isExpanded = expandedLevels.has(level);
          const options = getOptionsForLevel(level, value?.path || []);
          const filteredOptions = filteredOptionsForLevel(level, options);
          const selectedValue = value?.path[level - 1]?.nodeId || '';
          const isDisabled = disabled || (level > 1 && !value?.path[level - 2]);
          const levelName = getLevelName(level);

          if (!isExpanded && level > 1) {
            return null;
          }

          return (
            <Accordion
              key={level}
              expanded={isExpanded}
              onChange={() => {
                setExpandedLevels(prev => {
                  const newSet = new Set(prev);
                  if (isExpanded) {
                    newSet.delete(level);
                  } else {
                    newSet.add(level);
                  }
                  return newSet;
                });
              }}
              disabled={isDisabled}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2">
                    {levelName}
                  </Typography>
                  {selectedValue && (
                    <Chip
                      label={value?.path[level - 1]?.nodeName}
                      size="small"
                      color="primary"
                    />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <FormControl fullWidth size={size} disabled={isDisabled}>
                  <InputLabel>{`انتخاب ${levelName}`}</InputLabel>
                  <Select
                    value={selectedValue}
                    onChange={(e) => handleLevelSelection(level, e.target.value)}
                    variant={variant}
                  >
                    <MenuItem value="">
                      <em>انتخاب کنید</em>
                    </MenuItem>
                    {filteredOptions.map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <Typography variant="body2">
                            {option.name}
                          </Typography>
                          {option.englishName && option.englishName !== option.name && (
                            <Typography variant="caption" color="text.secondary">
                              {option.englishName}
                            </Typography>
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {filteredOptions.length === 0 && searchTerm && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    هیچ گزینه‌ای با عبارت "{searchTerm}" یافت نشد
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>

      {/* Coordinates Display */}
      {value?.finalNode?.coordinates && hierarchicalConfig?.showCoordinates && (
        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            مختصات جغرافیایی
          </Typography>
          <Typography variant="body2" color="text.secondary">
            عرض جغرافیایی: {value.finalNode.coordinates.lat}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            طول جغرافیایی: {value.finalNode.coordinates.lng}
          </Typography>
        </Paper>
      )}

      {/* Selection Status */}
      {value?.finalNode && (
        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography variant="body2">
            ✓ {value.finalNode.name} انتخاب شده است
          </Typography>
          {value.finalNode.description && (
            <Typography variant="caption" color="text.secondary" display="block">
              {value.finalNode.description}
            </Typography>
          )}
        </Alert>
      )}

      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Description */}
      {config.description && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {config.description}
        </Typography>
      )}
    </Box>
  );
};

export default HierarchicalInputComponent;