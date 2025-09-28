import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Stack,
  Breadcrumbs,
  Link,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ArrowLeft as ArrowLeftIcon,
  AccountTree as TreeIcon,
  CheckCircle as CheckIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useHierarchicalData } from '@/hooks/useHierarchicalData';
import type { HierarchicalPath, HierarchicalNode } from '@/hooks/useHierarchicalData';

interface HierarchicalSelectorProps {
  categoryType: 'users' | 'resources';
  value?: string[]; // مسیر انتخاب شده به صورت array از ID ها
  onChange: (path: string[], finalNodeId?: string) => void;
  onFieldsChange: (fields: any[]) => void; // برای ارسال فیلدهای نهایی
  disabled?: boolean;
  error?: string;
}

const HierarchicalSelector: React.FC<HierarchicalSelectorProps> = ({
  categoryType,
  value = [],
  onChange,
  onFieldsChange,
  disabled = false,
  error
}) => {
  const prevValueRef = useRef<string[]>();
  const prevSelectedPathRef = useRef<HierarchicalPath[]>();

  const {
    rootNode,
    loading,
    error: hierarchicalError,
    selectedPath,
    getCurrentSelection,
    addToPath,
    clearPathFromLevel,
    resetPath,
    getOptionsForLevel,
    refresh,
    updateSelectedPath
  } = useHierarchicalData(categoryType);

  // تابع کمکی برای یافتن گره در فرزندان
  const findNodeInChildren = useCallback((parentNode: HierarchicalNode, nodeId: string): HierarchicalNode | null => {
    if (parentNode.id === nodeId) return parentNode;
    
    for (const child of parentNode.children) {
      const found = findNodeInChildren(child, nodeId);
      if (found) return found;
    }
    return null;
  }, []);

  // همگام‌سازی با مقدار خارجی - بدون ایجاد loop
  useEffect(() => {
    if (!rootNode) return;
    
    if (value && value.length > 0) {
      try {
        // بررسی اینکه آیا مسیر فعلی با value مطابقت دارد
        const currentPathIds = selectedPath.map(p => p.nodeId);
        const isPathMatching = value.length === currentPathIds.length && 
                              value.every((id, index) => id === currentPathIds[index]);
        
        if (!isPathMatching) {
          // بازسازی مسیر بر اساس value
          const path: HierarchicalPath[] = [];
          let currentNode = rootNode;
          
          for (const nodeId of value) {
            const foundNode = findNodeInChildren(currentNode, nodeId);
            if (foundNode) {
              path.push({
                nodeId: foundNode.id,
                nodeName: foundNode.name,
                level: foundNode.level
              });
              currentNode = foundNode;
            } else {
              console.warn(`Node with ID ${nodeId} not found in hierarchical structure`);
              break;
            }
          }
          
          // تنظیم مسیر بدون trigger کردن useEffect دوباره
          updateSelectedPath(path);
        }
      } catch (error) {
        console.error('Error synchronizing hierarchical path:', error);
      }
    } else if (selectedPath.length > 0) {
      // اگر مقدار خارجی خالی است، مسیر را پاک کن
      updateSelectedPath([]);
    }
  }, [value, rootNode, findNodeInChildren]); // حذف selectedPath از dependencies

  // ارسال تغییرات به component والد - فقط زمانی که selectedPath تغییر کند
  useEffect(() => {
    try {
      const selection = getCurrentSelection;
      const pathIds = selectedPath.map(p => p.nodeId);
      
      // بررسی اینکه آیا مسیر واقعاً تغییر کرده
      const prevSelectedPath = prevSelectedPathRef.current || [];
      const hasPathChanged = selectedPath.length !== prevSelectedPath.length ||
                            selectedPath.some((p, i) => p.nodeId !== prevSelectedPath[i]?.nodeId);
      
      if (hasPathChanged) {
        onChange(pathIds, selection.finalNode?.id);
        onFieldsChange(selection.fields);
        prevSelectedPathRef.current = [...selectedPath];
      }
    } catch (error) {
      console.error('Error sending selection changes to parent:', error);
    }
  }, [selectedPath]); // حذف onChange و onFieldsChange از dependencies



  const handleLevelSelection = useCallback((level: number, nodeId: string) => {
    try {
      const options = getOptionsForLevel(level);
      const selectedNode = options.find(node => node.id === nodeId);
      
      if (selectedNode) {
        console.log(`Selected node at level ${level}:`, selectedNode);
        
        // پاک کردن انتخاب‌های سطوح بالاتر
        clearPathFromLevel(level);
        
        // اضافه کردن انتخاب جدید
        addToPath(selectedNode.id, selectedNode.name, selectedNode.level);
      } else {
        console.error(`Selected node not found at level ${level} with ID: ${nodeId}`);
      }
    } catch (error) {
      console.error('Error handling level selection:', error);
    }
  }, [getOptionsForLevel, clearPathFromLevel, addToPath]);

  const handleBreadcrumbClick = useCallback((level: number) => {
    try {
      clearPathFromLevel(level + 1);
    } catch (error) {
      console.error('Error handling breadcrumb click:', error);
    }
  }, [clearPathFromLevel]);

  const getCurrentLevelValue = useCallback((level: number): string => {
    const pathItem = selectedPath.find(p => p.level === level);
    return pathItem?.nodeId || '';
  }, [selectedPath]);

  const renderLevelSelector = useCallback((level: number) => {
    try {
      const options = getOptionsForLevel(level);
      const currentValue = getCurrentLevelValue(level);
      const hasOptions = options.length > 0;

      if (!hasOptions) return null;

      // تشخیص اینکه آیا این سطح اول است یا سطوح بعدی
      const isFirstLevel = level === (rootNode?.level || 0) + 1;
      const levelName = isFirstLevel ? 'دسته اصلی' : 'انتخاب زیرگروه';

      // اگر سطح اول نیست، همه گزینه‌های موجود در تمام سطوح را نمایش دهیم
      let allOptions = options;
      if (!isFirstLevel) {
        // جمع‌آوری همه زیرگره‌ها از تمام سطوح
        const collectAllSubOptions = (nodes: any[]): any[] => {
          let allSubs: any[] = [];
          for (const node of nodes) {
            allSubs.push(node);
            if (node.children && node.children.length > 0) {
              allSubs = allSubs.concat(collectAllSubOptions(node.children));
            }
          }
          return allSubs;
        };
        
        allOptions = collectAllSubOptions(options);
      }

      return (
        <FormControl 
          key={`level-${level}`}
          fullWidth 
          disabled={disabled} 
          size="small"
          sx={{ minWidth: 200 }}
          error={!!error}
        >
          <InputLabel>{levelName}</InputLabel>
          <Select
            value={currentValue}
            onChange={(e) => {
              const selectedId = e.target.value as string;
              // پیدا کردن گره انتخاب شده در همه سطوح
              const findSelectedNode = (nodes: any[], targetId: string): any => {
                for (const node of nodes) {
                  if (node.id === targetId) return node;
                  if (node.children && node.children.length > 0) {
                    const found = findSelectedNode(node.children, targetId);
                    if (found) return found;
                  }
                }
                return null;
              };
              
              const selectedNode = findSelectedNode(allOptions, selectedId);
              if (selectedNode) {
                // پاک کردن مسیر قبلی و تنظیم مسیر جدید
                resetPath();
                
                // ساختن مسیر کامل تا گره انتخاب شده
                const buildPathToNode = (targetId: string): any[] => {
                  const path: any[] = [];
                  let currentNode = rootNode;
                  
                  const findPath = (node: any, target: string): boolean => {
                    if (node.id === target) {
                      path.push({
                        nodeId: node.id,
                        nodeName: node.name,
                        level: node.level
                      });
                      return true;
                    }
                    
                    for (const child of node.children || []) {
                      if (findPath(child, target)) {
                        path.unshift({
                          nodeId: node.id,
                          nodeName: node.name,
                          level: node.level
                        });
                        return true;
                      }
                    }
                    return false;
                  };
                  
                  findPath(currentNode, targetId);
                  return path.slice(1); // حذف rootNode از مسیر
                };
                
                const fullPath = buildPathToNode(selectedId);
                fullPath.forEach(pathItem => {
                  addToPath(pathItem.nodeId, pathItem.nodeName, pathItem.level);
                });
              }
            }}
            label={levelName}
            displayEmpty
          >
            <MenuItem value="">
              <em>انتخاب کنید</em>
            </MenuItem>
            {allOptions.map((option) => {
              // نمایش مسیر کامل برای زیرگره‌ها
              const getFullPath = (nodeId: string): string => {
                if (isFirstLevel || !rootNode) return option.name;
                
                const findNodePath = (node: any, targetId: string, currentPath: string[] = []): string[] | null => {
                  if (node.id === targetId) {
                    return [...currentPath, node.name];
                  }
                  
                  for (const child of node.children || []) {
                    const result = findNodePath(child, targetId, [...currentPath, node.name]);
                    if (result) return result;
                  }
                  return null;
                };
                
                const path = findNodePath(rootNode, nodeId);
                return path ? path.slice(1).join(' ← ') : option.name; // حذف rootNode از مسیر
              };
              
              const displayName = isFirstLevel ? option.name : getFullPath(option.id);
              
              return (
                <MenuItem key={option.id} value={option.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {displayName}
                    </Typography>
                    {option.hasChildren && isFirstLevel && (
                      <TreeIcon fontSize="small" color="action" />
                    )}
                    {!option.hasChildren && option.customFields.length > 0 && (
                      <Chip 
                        label={`${option.customFields.length} فیلد`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                        sx={{ fontSize: '0.6rem', height: '16px' }}
                      />
                    )}
                  </Box>
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      );
    } catch (error) {
      console.error('Error rendering level selector:', error);
      return (
        <Alert severity="error" sx={{ mt: 1 }}>
          خطا در نمایش انتخابگر سطح {level}
        </Alert>
      );
    }
  }, [getOptionsForLevel, getCurrentLevelValue, rootNode, disabled, error, handleLevelSelection]);

  const renderSelectors = () => {
    if (!rootNode) return null;

    const selectors = [];
    const startLevel = rootNode.level + 1;
    
    // فیلد اول: انتخاب دسته اصلی
    const firstLevelSelector = renderLevelSelector(startLevel);
    if (firstLevelSelector) {
      selectors.push(firstLevelSelector);
    }
    
    // فیلد دوم: انتخاب زیرگره (فقط اگر دسته اصلی انتخاب شده باشد)
    if (selectedPath.length > 0) {
      const secondLevelSelector = renderLevelSelector(startLevel + 1);
      if (secondLevelSelector) {
        selectors.push(secondLevelSelector);
      }
    }

    return selectors;
  };

  const renderBreadcrumbs = () => {
    if (selectedPath.length === 0) return null;

    return (
      <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            مسیر انتخاب شده:
          </Typography>
          <Tooltip title="بروزرسانی ساختار">
            <IconButton size="small" onClick={refresh} disabled={loading}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Breadcrumbs
          separator={<ArrowLeftIcon fontSize="small" />}
          sx={{ direction: 'ltr' }}
        >
          <Link
            component="button"
            variant="body2"
            onClick={() => resetPath()}
            sx={{ 
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            <HomeIcon fontSize="small" />
            ریشه
          </Link>
          {selectedPath.map((pathItem, index) => (
            <Link
              key={pathItem.nodeId}
              component="button"
              variant="body2"
              onClick={() => handleBreadcrumbClick(pathItem.level)}
              sx={{
                textDecoration: 'none',
                fontWeight: index === selectedPath.length - 1 ? 600 : 400,
                color: index === selectedPath.length - 1 ? 'primary.main' : 'text.primary'
              }}
            >
              {pathItem.nodeName}
            </Link>
          ))}
        </Breadcrumbs>
      </Paper>
    );
  };

  // ... existing code ...

  // Memoized selectors for performance - MUST be before any conditional returns
  const memoizedSelectors = useMemo(() => {
    if (!rootNode) return [];
    return renderSelectors();
  }, [rootNode, selectedPath, disabled, error]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          در حال بارگذاری ساختار گره‌ها...
        </Typography>
      </Box>
    );
  }

  if (hierarchicalError || error) {
    return (
      <Alert severity="error" sx={{ borderRadius: 1 }}>
        {hierarchicalError || error}
      </Alert>
    );
  }

  if (!rootNode) {
    return (
      <Alert 
        severity="warning" 
        sx={{ borderRadius: 1 }}
        action={
          <IconButton size="small" onClick={refresh} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        }
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon fontSize="small" />
          ساختار گره‌های اطلاعات حقوقی یافت نشد
        </Box>
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          لطفاً مسیر مناسب را از ساختار درختی انتخاب کنید:
        </Typography>
        {hierarchicalError && (
          <Chip 
            label="خطا در بارگذاری" 
            color="error" 
            size="small" 
            icon={<WarningIcon />}
          />
        )}
      </Box>
      
      {renderBreadcrumbs()}
      
      <Stack spacing={2} sx={{ mb: 2 }}>
        {memoizedSelectors}
      </Stack>

      {selectedPath.length > 0 && (
        <Divider sx={{ my: 2 }} />
      )}
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default React.memo(HierarchicalSelector);