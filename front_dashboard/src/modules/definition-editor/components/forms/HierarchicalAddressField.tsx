// Hierarchical Address Field Component
// کامپوننت آدرس سلسله‌مراتبی با قابلیت انتخاب از درخت جغرافیایی

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Button,
  Typography,
  Paper,
  Chip,
  FormHelperText,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  Cake as CakeIcon,
  Schedule as ScheduleIcon,
  Place as PlaceIcon
} from '@mui/icons-material';
import { ADDRESS_LABELS } from '../../utils/validationUtils';
import type { HierarchicalAddress } from '../../types/enhancedFields';
import { loadGeographicalData, loadCategoryLevels } from '../../data/loader';
import { CategoryType, DefinitionNode, ExtendedHierarchyLevel } from '../../types';

interface HierarchicalAddressFieldProps {
  value: HierarchicalAddress[];
  onChange: (addresses: HierarchicalAddress[]) => void;
  label: string;
  required?: boolean;
  error?: string;
  minItems?: number;
  maxItems?: number;
  rootCategory?: string;
  levels?: string[];
  allowFreeText?: boolean;
}

// Interface for geographical tree node
interface GeographicalTreeNode {
  id: string;
  name: string;
  level: number;
  parentId: string | null;
  description?: string;
  coordinates?: { lat: number; lng: number };
  children?: GeographicalTreeNode[];
}

const HierarchicalAddressComponent: React.FC<HierarchicalAddressFieldProps> = ({
  value = [],
  onChange,
  label,
  required = false,
  error,
  minItems = 0,
  maxItems = 3,
  rootCategory = 'geographical',
  levels = ['استان', 'شهر', 'منطقه'],
  allowFreeText = true
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [geographicalData, setGeographicalData] = useState<GeographicalTreeNode[]>([]);
  const [hierarchyLevels, setHierarchyLevels] = useState<ExtendedHierarchyLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string>('');

  // Load geographical data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setDataError('');
        
        // Load geographical nodes and levels
        const [nodes, levels] = await Promise.all([
          loadGeographicalData('geographical'),
          loadCategoryLevels(CategoryType.GEOGRAPHICAL)
        ]);
        
        // Convert flat nodes to hierarchical tree
        const treeNodes = buildHierarchicalTree(nodes);
        setGeographicalData(treeNodes);
        setHierarchyLevels(levels);
        
        console.log('Loaded geographical data:', { nodes: nodes.length, levels: levels.length, tree: treeNodes.length });
      } catch (err) {
        console.error('Error loading geographical data:', err);
        setDataError('خطا در بارگذاری داده‌های جغرافیایی');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [rootCategory]);

  // Build hierarchical tree from flat nodes
  const buildHierarchicalTree = (nodes: DefinitionNode[]): GeographicalTreeNode[] => {
    const nodeMap = new Map<string, GeographicalTreeNode>();
    const rootNodes: GeographicalTreeNode[] = [];
    
    // First pass: create all nodes
    nodes.forEach(node => {
      const treeNode: GeographicalTreeNode = {
        id: node.id,
        name: node.name,
        level: node.level,
        parentId: node.parentId || null,
        description: node.description,
        coordinates: node.coordinates,
        children: []
      };
      nodeMap.set(node.id, treeNode);
    });
    
    // Second pass: build parent-child relationships
    nodes.forEach(node => {
      const treeNode = nodeMap.get(node.id)!;
      if (node.parentId && nodeMap.has(node.parentId)) {
        const parent = nodeMap.get(node.parentId)!;
        parent.children = parent.children || [];
        parent.children.push(treeNode);
      } else {
        rootNodes.push(treeNode);
      }
    });
    
    return rootNodes;
  };

  // ایجاد آدرس جدید
  const createNewAddress = (): HierarchicalAddress => ({
    id: `address-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    label: 'home',
    selectedPath: {},
    detailedAddress: '',
    postalCode: '',
    isPrimary: value.length === 0,
    verified: false
  });

  // افزودن آدرس جدید
  const handleAddAddress = () => {
    if (value.length >= maxItems) return;
    
    const newAddress = createNewAddress();
    onChange([...value, newAddress]);
  };

  // حذف آدرس
  const handleRemoveAddress = (addressId: string) => {
    const updatedAddresses = value.filter(address => address.id !== addressId);
    
    // اگر آدرس اصلی حذف شد، آدرس بعدی را اصلی کن
    if (updatedAddresses.length > 0 && !updatedAddresses.some(a => a.isPrimary)) {
      updatedAddresses[0].isPrimary = true;
    }
    
    onChange(updatedAddresses);
    
    // حذف خطای مربوط به این آدرس
    const newErrors = { ...errors };
    delete newErrors[addressId];
    setErrors(newErrors);
  };

  // به‌روزرسانی آدرس
  const handleUpdateAddress = (addressId: string, field: keyof HierarchicalAddress, fieldValue: any) => {
    const updatedAddresses = value.map(address => {
      if (address.id === addressId) {
        const updatedAddress = { ...address, [field]: fieldValue };
        return updatedAddress;
      }
      return address;
    });

    // اگر این آدرس اصلی شد، بقیه را غیراصلی کن
    if (field === 'isPrimary' && fieldValue === true) {
      updatedAddresses.forEach(address => {
        if (address.id !== addressId) {
          address.isPrimary = false;
        }
      });
    }

    onChange(updatedAddresses);
  };

  // به‌روزرسانی مسیر انتخاب شده
  const handlePathUpdate = (addressId: string, levelNumber: number, selectedValue: string) => {
    const address = value.find(a => a.id === addressId);
    if (!address) return;

    const newSelectedPath = { ...address.selectedPath };
    const levelKey = `level${levelNumber}`;
    
    // تنظیم مقدار انتخاب شده برای این سطح
    newSelectedPath[levelKey] = selectedValue;
    
    // ریست کردن سطوح بعدی
    for (let i = levelNumber + 1; i <= maxSelectableLevel; i++) {
      const nextLevelKey = `level${i}`;
      if (newSelectedPath[nextLevelKey]) {
        delete newSelectedPath[nextLevelKey];
      }
    }

    handleUpdateAddress(addressId, 'selectedPath', newSelectedPath);
  };

  // پیدا کردن اطلاعات برچسب
  const getLabelInfo = (labelValue: string) => {
    return ADDRESS_LABELS.find(label => label.value === labelValue) || ADDRESS_LABELS[0];
  };

  // Get options for a specific level based on parent selection
  const getOptionsForLevel = (level: number, parentPath: Record<string, string>): GeographicalTreeNode[] => {
    if (!geographicalData.length) return [];
    
    // For level 1 (continents), return root nodes
    if (level === 1) {
      return geographicalData.filter(node => node.level === 1);
    }
    
    // For other levels, find parent and return its children
    const parentLevelKey = `level${level - 1}`;
    const parentId = parentPath[parentLevelKey];
    
    if (!parentId) return [];
    
    // Find parent node and return its children at the target level
    const findNodeChildren = (nodes: GeographicalTreeNode[], targetParentId: string, targetLevel: number): GeographicalTreeNode[] => {
      for (const node of nodes) {
        if (node.id === targetParentId) {
          return (node.children || []).filter(child => child.level === targetLevel);
        }
        
        if (node.children) {
          const found = findNodeChildren(node.children, targetParentId, targetLevel);
          if (found.length > 0) return found;
        }
      }
      return [];
    };
    
    return findNodeChildren(geographicalData, parentId, level);
  };

  // Get level name from hierarchy levels
  const getLevelName = (levelNumber: number): string => {
    const level = hierarchyLevels.find(l => l.order === levelNumber);
    return level ? level.name : `سطح ${levelNumber}`;
  };

  // Get maximum selectable level (up to city level - level 7)
  const maxSelectableLevel = Math.min(7, hierarchyLevels.length);

  // بررسی وجود آدرس اصلی
  const hasPrimaryAddress = value.some(address => address.isPrimary);

  // Show loading state
  if (loading) {
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          {label} {required && <span style={{ color: 'red' }}>*</span>}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2">بارگذاری داده‌های جغرافیایی...</Typography>
        </Box>
      </Box>
    );
  }

  // Show error state
  if (dataError) {
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          {label} {required && <span style={{ color: 'red' }}>*</span>}
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          {dataError}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        {label} {required && <span style={{ color: 'red' }}>*</span>}
      </Typography>
      
      {error && (
        <FormHelperText error sx={{ mb: 1 }}>
          {error}
        </FormHelperText>
      )}

      {/* Info about geographical data */}
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="caption">
          انتخاب موقعیت از درخت جغرافیایی سیستم - از {getLevelName(1)} تا {getLevelName(maxSelectableLevel)}
        </Typography>
      </Alert>

      {/* لیست آدرس‌ها */}
      {value.map((address, index) => {
        const labelInfo = getLabelInfo(address.label);
        const addressError = errors[address.id];
        
        return (
          <Paper 
            key={address.id} 
            elevation={2} 
            sx={{ 
              p: 2, 
              mb: 2, 
              border: address.isPrimary ? '2px solid' : '1px solid',
              borderColor: address.isPrimary ? 'primary.main' : 'divider'
            }}
          >
            {/* هدر آدرس */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={labelInfo.icon}
                  size="small"
                  variant="outlined"
                />
                <Typography variant="h6">
                  آدرس {index + 1}
                </Typography>
                {address.isPrimary && (
                  <Chip label="اصلی" color="primary" size="small" />
                )}
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={address.isPrimary}
                      onChange={(e) => handleUpdateAddress(address.id, 'isPrimary', e.target.checked)}
                      size="small"
                    />
                  }
                  label="اصلی"
                />
                <Tooltip title="حذف آدرس">
                  <IconButton
                    onClick={() => handleRemoveAddress(address.id)}
                    color="error"
                    size="small"
                    disabled={value.length <= minItems}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Grid container spacing={2}>
              {/* نوع آدرس */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>نوع آدرس</InputLabel>
                  <Select
                    value={address.label}
                    onChange={(e) => handleUpdateAddress(address.id, 'label', e.target.value)}
                    label="نوع آدرس"
                  >
                    {ADDRESS_LABELS.map((label) => (
                      <MenuItem key={label.value} value={label.value}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <span>{label.icon}</span>
                          <span>{label.label}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* کد پستی */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="کد پستی"
                  value={address.postalCode || ''}
                  onChange={(e) => handleUpdateAddress(address.id, 'postalCode', e.target.value)}
                  placeholder="1234567890"
                  inputProps={{
                    maxLength: 10,
                    pattern: '[0-9]*',
                    inputMode: 'numeric'
                  }}
                />
              </Grid>

              {/* انتخاب سلسله‌مراتبی */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  انتخاب موقعیت جغرافیایی
                </Typography>
                
                <Grid container spacing={2}>
                  {/* Dynamic level selectors */}
                  {Array.from({ length: maxSelectableLevel }, (_, index) => {
                    const level = index + 1;
                    const levelKey = `level${level}`;
                    const selectedValue = address.selectedPath[levelKey] || '';
                    const options = getOptionsForLevel(level, address.selectedPath);
                    const isDisabled = level > 1 && !address.selectedPath[`level${level - 1}`];
                    const levelName = getLevelName(level);
                    
                    return (
                      <Grid item xs={12} sm={level <= 3 ? 4 : 6} md={level <= 3 ? 4 : 3} key={level}>
                        <FormControl fullWidth size="small" disabled={isDisabled}>
                          <InputLabel>{levelName}</InputLabel>
                          <Select
                            value={selectedValue}
                            onChange={(e) => handlePathUpdate(address.id, level, e.target.value)}
                            label={levelName}
                          >
                            {options.map((option) => (
                              <MenuItem key={option.id} value={option.id}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2">
                                    {option.name}
                                  </Typography>
                                  {option.coordinates && (
                                    <Chip 
                                      size="small" 
                                      label="📍" 
                                      variant="outlined" 
                                      sx={{ height: 20, fontSize: '0.7rem' }}
                                    />
                                  )}
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    );
                  })}
                </Grid>
                
                {/* Display selected path */}
                {Object.keys(address.selectedPath).length > 0 && (
                  <Box sx={{ mt: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      مسیر انتخاب شده:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                      {Object.entries(address.selectedPath)
                        .sort(([a], [b]) => parseInt(a.replace('level', '')) - parseInt(b.replace('level', '')))
                        .map(([levelKey, nodeId], idx) => {
                          const levelNumber = parseInt(levelKey.replace('level', ''));
                          const foundNode = findNodeById(geographicalData, nodeId);
                          
                          return (
                            <React.Fragment key={levelKey}>
                              {idx > 0 && (
                                <ChevronRightIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              )}
                              <Chip 
                                size="small" 
                                label={foundNode?.name || nodeId}
                                color="primary"
                                variant="outlined"
                              />
                            </React.Fragment>
                          );
                        })
                      }
                    </Box>
                  </Box>
                )}
              </Grid>

              {/* آدرس دقیق */}
              {allowFreeText && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="آدرس دقیق"
                    value={address.detailedAddress || ''}
                    onChange={(e) => handleUpdateAddress(address.id, 'detailedAddress', e.target.value)}
                    placeholder="خیابان، کوچه، پلاک، واحد..."
                    multiline
                    rows={2}
                  />
                </Grid>
              )}
            </Grid>

            {addressError && (
              <FormHelperText error sx={{ mt: 1 }}>
                {addressError}
              </FormHelperText>
            )}
          </Paper>
        );
      })}

      {/* دکمه افزودن */}
      {value.length < maxItems && (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddAddress}
          fullWidth
          sx={{ mt: 1 }}
        >
          افزودن آدرس
        </Button>
      )}

      {/* راهنما */}
      <Box mt={2}>
        <Typography variant="caption" color="textSecondary">
          • حداقل {minItems} و حداکثر {maxItems} آدرس
        </Typography>
        <br />
        <Typography variant="caption" color="textSecondary">
          • انتخاب موقعیت از درخت جغرافیایی سیستم ({geographicalData.length} گره جغرافیایی)
        </Typography>
        <br />
        <Typography variant="caption" color="textSecondary">
          • سطوح قابل انتخاب: {hierarchyLevels.slice(0, maxSelectableLevel).map(l => l.name).join(' ← ')}
        </Typography>
        {!hasPrimaryAddress && value.length > 0 && (
          <Typography variant="caption" color="error" display="block">
            ⚠️ لطفاً یکی از آدرس‌ها را به عنوان اصلی انتخاب کنید
          </Typography>
        )}
      </Box>
    </Box>
  );

  // Helper function to find node by ID in the tree
  function findNodeById(nodes: GeographicalTreeNode[], targetId: string): GeographicalTreeNode | null {
    for (const node of nodes) {
      if (node.id === targetId) {
        return node;
      }
      if (node.children) {
        const found = findNodeById(node.children, targetId);
        if (found) return found;
      }
    }
    return null;
  }
};

export default HierarchicalAddressComponent;