import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Drawer,
  AppBar,
  Toolbar,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  FormControlLabel,
  Switch,
  Divider,
  Badge,
  alpha,
  Tabs,
  Tab
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Link as LinkIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

// Components
import NodeSearchComponent from '../search/NodeSearchComponent';

// Types
import type { CustomField } from '../../types/equipment';
import type { NodeSearchResult } from '../../types/fieldConstructor';
import { CategoryType } from '../../types';

// Hooks
import { useReferenceData, type ReferenceDataItem, type ReferenceSections } from '@/hooks/useReferenceData';

interface EnhancedReferenceFieldRendererProps {
  field: CustomField;
  value?: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  
  // Enhanced features
  enableSearch?: boolean;
  enableFilters?: boolean;
  enableMultiSelect?: boolean;
  showPath?: boolean;
  showCoordinates?: boolean;
  enableFavorites?: boolean;
  enableRecent?: boolean;
  maxResults?: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ width: '100%' }}>
    {value === index && children}
  </div>
);

const EnhancedReferenceFieldRenderer: React.FC<EnhancedReferenceFieldRendererProps> = ({
  field,
  value,
  onChange,
  error,
  disabled = false,
  fullWidth = true,
  enableSearch = true,
  enableFilters = true,
  enableMultiSelect = false,
  showPath = true,
  showCoordinates = true,
  enableFavorites = false,
  enableRecent = false,
  maxResults = 50
}) => {
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedNodes, setSelectedNodes] = useState<NodeSearchResult[]>([]);
  
  // Get category type from reference category
  const getCategoryType = (refCategory?: string): CategoryType => {
    switch (refCategory) {
      case 'geographical':
        return CategoryType.GEOGRAPHICAL;
      case 'military_ranks':
        return CategoryType.MILITARY_RANKS;
      case 'equipment':
        return CategoryType.EQUIPMENT;
      // Add more mappings as needed
      default:
        return CategoryType.GEOGRAPHICAL;
    }
  };
  
  const categoryType = getCategoryType(field.referenceCategory);
  
  // Load reference data using existing hook
  const {
    data: referenceData,
    loading,
    error: referenceError,
    refresh,
    searchItems,
    getItemById,
    isReady
  } = useReferenceData(field.referenceCategory, field.referenceSections as ReferenceSections);
  
  // Convert reference data to search results
  const referenceAsSearchResults = useMemo((): NodeSearchResult[] => {
    if (!referenceData?.items) return [];
    
    return referenceData.items.map((item: ReferenceDataItem): NodeSearchResult => ({
      id: item.id,
      name: item.name,
      description: item.description,
      level: item.level || 1,
      parentId: item.parentId,
      categoryType: categoryType.toString(),
      path: item.path || [item.name],
      coordinates: item.coordinates,
      metadata: {
        englishName: item.englishName,
        natoEquivalent: item.natoEquivalent,
        icon: item.icon,
        specialty: item.specialty
      }
    }));
  }, [referenceData, categoryType]);
  
  // Handle node selection from search
  const handleNodeSelection = (nodes: NodeSearchResult[]) => {
    setSelectedNodes(nodes);
    
    if (enableMultiSelect) {
      const values = nodes.map(node => node.id);
      onChange(values);
    } else {
      const singleValue = nodes.length > 0 ? nodes[0].id : null;
      onChange(singleValue);
    }
  };
  
  // Handle node click
  const handleNodeClick = (node: NodeSearchResult) => {
    if (!enableMultiSelect) {
      setSearchDrawerOpen(false);
    }
  };
  
  // Get selected nodes based on current value
  useEffect(() => {
    if (!referenceAsSearchResults.length) return;
    
    if (enableMultiSelect && Array.isArray(value)) {
      const selected = referenceAsSearchResults.filter(node => value.includes(node.id));
      setSelectedNodes(selected);
    } else if (value && !Array.isArray(value)) {
      const selected = referenceAsSearchResults.find(node => node.id === value);
      setSelectedNodes(selected ? [selected] : []);
    } else {
      setSelectedNodes([]);
    }
  }, [value, referenceAsSearchResults, enableMultiSelect]);
  
  // Remove selected node
  const removeSelectedNode = (nodeId: string) => {
    if (enableMultiSelect) {
      const newValues = Array.isArray(value) ? value.filter(id => id !== nodeId) : [];
      onChange(newValues);
    } else {
      onChange(null);
    }
  };
  
  // Clear all selections
  const clearAllSelections = () => {
    onChange(enableMultiSelect ? [] : null);
  };
  
  // Render loading state
  if (loading) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          در حال بارگذاری {field.name}...
        </Typography>
      </Box>
    );
  }
  
  // Render error state
  if (referenceError || !field.referenceCategory) {
    return (
      <Alert severity="error" sx={{ borderRadius: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <WarningIcon fontSize="small" />
          <Typography variant="body2" fontWeight={600}>
            خطا در بارگذاری {field.name}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {referenceError || 'دسته‌بندی مرجع مشخص نشده است'}
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Tooltip title="تلاش مجدد">
            <IconButton size="small" onClick={refresh}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Alert>
    );
  }
  
  // Render empty state
  if (isReady && (!referenceData?.items || referenceData.items.length === 0)) {
    return (
      <Alert severity="info" sx={{ borderRadius: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <LinkIcon fontSize="small" />
          <Typography variant="body2" fontWeight={600}>
            {field.name}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          هیچ داده‌ای در دسته‌بندی "{referenceData?.name}" یافت نشد
        </Typography>
      </Alert>
    );
  }
  
  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
      {/* Field Info Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LinkIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              مرجع: {referenceData?.name}
            </Typography>
          </Box>
          
          {field.referenceSections && (
            <Chip
              size="small"
              label={
                field.referenceSections === 'hierarchy' ? 'سطوح' :
                field.referenceSections === 'data' ? 'داده‌ها' :
                'کامل'
              }
              color="primary"
              variant="outlined"
            />
          )}
          
          {referenceData && (
            <Chip
              size="small"
              label={`${referenceData.items.length} مورد`}
              variant="outlined"
            />
          )}
          
          {enableMultiSelect && (
            <Chip
              size="small"
              label="انتخاب چندگانه"
              color="secondary"
              variant="outlined"
            />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="جستجوی پیشرفته">
            <IconButton 
              size="small" 
              onClick={() => setSearchDrawerOpen(true)}
              disabled={disabled}
            >
              <Badge 
                badgeContent={selectedNodes.length || undefined}
                color="primary"
              >
                <SearchIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Tooltip title="بروزرسانی">
            <IconButton size="small" onClick={refresh} disabled={loading || disabled}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Selected Items Display */}
      {selectedNodes.length > 0 && (
        <Paper variant="outlined" sx={{ p: 1, mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              انتخاب شده ({selectedNodes.length})
            </Typography>
            
            <Button
              size="small"
              onClick={clearAllSelections}
              disabled={disabled}
            >
              پاک کردن همه
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selectedNodes.map((node) => (
              <Chip
                key={node.id}
                label={node.name}
                size="small"
                onDelete={disabled ? undefined : () => removeSelectedNode(node.id)}
                color="primary"
                variant="outlined"
                sx={{ maxWidth: 200 }}
              />
            ))}
          </Box>
        </Paper>
      )}
      
      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
      
      {/* Search Drawer */}
      <Drawer
        anchor="right"
        open={searchDrawerOpen}
        onClose={() => setSearchDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 500, md: 600 },
            maxWidth: '90vw'
          }
        }}
      >
        <AppBar position="static" elevation={0}>
          <Toolbar variant="dense">
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              جستجو در {referenceData?.name}
            </Typography>
            
            <IconButton
              color="inherit"
              onClick={() => setSearchDrawerOpen(false)}
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        
        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Search Tabs */}
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="جستجوی هوشمند" />
            <Tab label="فهرست کامل" />
            {(enableRecent || enableFavorites) && <Tab label="سابقه و علاقه‌مندی‌ها" />}
          </Tabs>
          
          {/* Tab Content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            <TabPanel value={selectedTab} index={0}>
              {/* Smart Search Tab */}
              <NodeSearchComponent
                categoryTypes={[categoryType]}
                placeholder={`جستجو در ${referenceData?.name}...`}
                maxResults={maxResults}
                multiSelect={enableMultiSelect}
                selectedNodes={selectedNodes}
                onSelectionChange={handleNodeSelection}
                onNodeClick={handleNodeClick}
                enableFilters={enableFilters}
                showPath={showPath}
                showCoordinates={showCoordinates}
                enableFavorites={enableFavorites}
                enableRecent={enableRecent}
                groupByCategory={false}
              />
            </TabPanel>
            
            <TabPanel value={selectedTab} index={1}>
              {/* Complete List Tab */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2">
                    فهرست کامل ({referenceAsSearchResults.length} مورد)
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => setViewMode('list')}
                      color={viewMode === 'list' ? 'primary' : 'default'}
                    >
                      <ViewListIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setViewMode('grid')}
                      color={viewMode === 'grid' ? 'primary' : 'default'}
                    >
                      <ViewModuleIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                
                <List dense>
                  {referenceAsSearchResults.map((node) => {
                    const isSelected = selectedNodes.some(n => n.id === node.id);
                    
                    return (
                      <ListItem key={node.id} disablePadding>
                        <ListItemButton
                          selected={isSelected}
                          onClick={() => {
                            const newSelection = isSelected
                              ? selectedNodes.filter(n => n.id !== node.id)
                              : enableMultiSelect 
                                ? [...selectedNodes, node]
                                : [node];
                            handleNodeSelection(newSelection);
                          }}
                          sx={{
                            borderRadius: 1,
                            mb: 0.5,
                            '&.Mui-selected': {
                              backgroundColor: alpha('rgb(25, 118, 210)', 0.12),
                            }
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {isSelected ? (
                              <CheckCircleIcon fontSize="small" color="primary" />
                            ) : (
                              <LinkIcon fontSize="small" color="action" />
                            )}
                          </ListItemIcon>
                          
                          <ListItemText
                            primary={node.name}
                            secondary={
                              <Box>
                                {node.description && (
                                  <Typography variant="caption" display="block">
                                    {node.description}
                                  </Typography>
                                )}
                                {showPath && node.path && node.path.length > 1 && (
                                  <Typography variant="caption" color="text.secondary">
                                    {node.path.slice(0, -1).join(' ← ')}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            </TabPanel>
            
            {(enableRecent || enableFavorites) && (
              <TabPanel value={selectedTab} index={2}>
                {/* Recent and Favorites Tab */}
                <Typography variant="body2" color="text.secondary">
                  قابلیت سابقه و علاقه‌مندی‌ها در NodeSearchComponent پیاده‌سازی شده است
                </Typography>
              </TabPanel>
            )}
          </Box>
        </Box>
        
        {/* Footer Actions */}
        <Paper elevation={3} sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {selectedNodes.length} مورد انتخاب شده
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={() => setSearchDrawerOpen(false)}
              >
                انصراف
              </Button>
              <Button
                variant="contained"
                onClick={() => setSearchDrawerOpen(false)}
                disabled={selectedNodes.length === 0}
              >
                تأیید انتخاب
              </Button>
            </Box>
          </Box>
        </Paper>
      </Drawer>
    </Box>
  );
};

export default EnhancedReferenceFieldRenderer;