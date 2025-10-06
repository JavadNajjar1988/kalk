import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Box, ToggleButton, ToggleButtonGroup, Typography, Paper, Button, TextField, InputAdornment, Collapse, Divider, FormControlLabel, RadioGroup, Radio, FormLabel, Slider, Accordion, AccordionSummary, AccordionDetails, alpha, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import SearchIcon from '@mui/icons-material/Search';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import HubIcon from '@mui/icons-material/Hub';
import ViewListIcon from '@mui/icons-material/ViewList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CategoryType, DefinitionNode, ViewMode, ExtendedHierarchyLevel } from '../../types';
import { SimpleGraphViewer } from '../graph';
import DefinitionTreeViewMinimal from '../tree/DefinitionTreeViewMinimal';
import LevelBasedTreeView from '../tree/LevelBasedTreeView';
import AddDataModal from '../modals/AddDataModal';
import { MasterDefinition, DefinitionCategory as MDDefinitionCategory } from '../../types';
import { saveCategoryNodes } from '../../data/loader';
import { useAppSelector } from '../../../../store';
import { selectDynamicLevelsByCategory } from '../../store';
import HierarchicalExcelImporter from '../import/HierarchicalExcelImporter';

interface BaseCategoryManagerProps {
  categoryType: CategoryType;
  categoryId: string;
  categoryName: string;
  categoryColor?: string;
  maxLevels?: number;
  loadNodes: (categoryId: string) => Promise<DefinitionNode[]>;
  loadLevels?: (categoryType: CategoryType) => Promise<ExtendedHierarchyLevel[]>;
}

// تابع برای تبدیل آرایه flat به ساختار درختی
function convertFlatToTree(flatArray: DefinitionNode[]): DefinitionNode[] {
  const nodeMap = new Map<string, DefinitionNode>();
  const rootNodes: DefinitionNode[] = [];

  // ایجاد نقشه از ID به node
  flatArray.forEach(node => {
    nodeMap.set(node.id, { ...node, children: [] });
  });

  // ساخت ساختار درختی
  flatArray.forEach(node => {
    const currentNode = nodeMap.get(node.id);
    if (!currentNode) return;

    if (node.parentId) {
      const parentNode = nodeMap.get(node.parentId);
      if (parentNode) {
        if (!parentNode.children) parentNode.children = [];
        parentNode.children.push(currentNode);
      } else {
        // اگر والد پیدا نشد، به root اضافه کن
        rootNodes.push(currentNode);
      }
    } else {
      // node ریشه است
      rootNodes.push(currentNode);
    }
  });

  return rootNodes;
}

// تبدیل DefinitionNode (tree structure) به MasterDefinition (tree structure)
function convertNodesToMasterDefinitions(
  nodes: DefinitionNode[],
  categoryMeta: MDDefinitionCategory
): MasterDefinition[] {
  // اگر nodes flat است، ابتدا آن را به tree تبدیل کن
  const treeNodes = nodes.some(n => n.children && n.children.length > 0) 
    ? nodes 
    : convertFlatToTree(nodes);

  const convert = (n: DefinitionNode): MasterDefinition => ({
    id: n.id,
    name: n.name,
    englishName: n.name,
    description: n.description,
    category: categoryMeta,
    parentId: n.parentId,
    level: n.level,
    order: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    children: (n.children || []).map(convert),
    customFields: n.customFields,
    metadata: n.metadata,
  });
  return (treeNodes || []).map(convert);
}

// 

const BaseCategoryManager: React.FC<BaseCategoryManagerProps> = ({
  categoryType,
  categoryId,
  categoryName,
  categoryColor = '#1976d2',
  maxLevels = 9,
  loadNodes,
  loadLevels
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.TREE);
  const [nodes, setNodes] = useState<DefinitionNode[]>([]);
  const [levels, setLevels] = useState<ExtendedHierarchyLevel[]>([]);
  const [search, setSearch] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [searchIn, setSearchIn] = useState<'both' | 'name' | 'description'>('both');
  const [childFilter, setChildFilter] = useState<'all' | 'with' | 'without'>('all');
  const [geoFilter, setGeoFilter] = useState<'all' | 'with' | 'without'>('all');
  const [levelRange, setLevelRange] = useState<number[]>([1, maxLevels || 9]);
  const [treeDisplayMode, setTreeDisplayMode] = useState<'hierarchy' | 'level'>('hierarchy');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<MasterDefinition | null>(null);
  const [editingItem, setEditingItem] = useState<MasterDefinition | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  // const [loading, setLoading] = useState<boolean>(false);

  // دریافت سطوح پویا از Redux store
  const dynamicLevels = useAppSelector((state: any) => selectDynamicLevelsByCategory(state, categoryId));

  useEffect(() => {
    let cancelled = false;
    // setLoading(true);
    Promise.all([
      loadNodes(categoryId),
      loadLevels ? loadLevels(categoryType) : Promise.resolve<ExtendedHierarchyLevel[]>([])
    ])
      .then(([n, lev]) => {
        if (cancelled) return;
        setNodes(Array.isArray(n) ? n : []);
        setLevels(Array.isArray(lev) ? lev : []);
      })
      .finally(() => { /* no-op loading */ });
    return () => {
      cancelled = true;
    };
  }, [categoryId, categoryType, loadNodes, loadLevels]);

  const definitionCategoryMeta: MDDefinitionCategory = useMemo(
    () => ({
      id: categoryId,
      name: categoryName,
      englishName: categoryName,
      description: '',
      icon: 'folder',
      color: categoryColor,
      maxLevels,
      isActive: true,
      order: 1,
      type: categoryType,
    }),
    [categoryId, categoryName, categoryColor, maxLevels, categoryType]
  );

  const masterDefinitions: MasterDefinition[] = useMemo(
    () => convertNodesToMasterDefinitions(nodes, definitionCategoryMeta),
    [nodes, definitionCategoryMeta]
  );

  const handleGraphChange = useCallback(async (newData: any[]) => {
    // SimpleGraphViewer خروجی را به ساختار DefinitionNode (تقریباً سازگار) می‌دهد
    const updatedNodes = newData as DefinitionNode[];
    setNodes(updatedNodes);
    
    // ذخیره تغییرات در JSON
    try {
      await saveCategoryNodes(categoryType, categoryId, updatedNodes);
    } catch (error) {
      console.error('Error saving graph changes:', error);
    }
  }, [categoryType, categoryId]);

  // تبدیل MasterDefinition به DefinitionNode برای ذخیره‌سازی
  const convertMasterDefinitionsToNodes = useCallback((definitions: MasterDefinition[]): DefinitionNode[] => {
    const convert = (def: MasterDefinition): DefinitionNode => ({
      id: def.id,
      name: def.name,
      description: def.description,
      level: def.level,
      parentId: def.parentId,
      children: (def.children || []).map(convert),
      customFields: def.customFields,
      metadata: def.metadata,
    });
    return definitions.map(convert);
  }, []);

  // تابع برای تبدیل tree به flat array برای ذخیره‌سازی
  const convertTreeToFlat = useCallback((treeNodes: DefinitionNode[]): DefinitionNode[] => {
    const result: DefinitionNode[] = [];
    
    const traverse = (nodes: DefinitionNode[]) => {
      nodes.forEach(node => {
        // اضافه کردن node فعلی به نتیجه (بدون children)
        result.push({
          ...node,
          children: [] // children حذف می‌شود چون در فرمت flat ذخیره می‌شود
        });
        
        // پردازش فرزندان
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      });
    };
    
    traverse(treeNodes);
    return result;
  }, []);

  // ذخیره تغییرات درخت
  const saveTreeChanges = useCallback(async (updatedDefinitions: MasterDefinition[]) => {
    const treeNodes = convertMasterDefinitionsToNodes(updatedDefinitions);
    const flatNodes = convertTreeToFlat(treeNodes);
    
    // به‌روزرسانی state با flat array
    setNodes(flatNodes);
    
    try {
      await saveCategoryNodes(categoryType, categoryId, flatNodes);
    } catch (error) {
      console.error('Error saving tree changes:', error);
    }
  }, [categoryType, categoryId, convertMasterDefinitionsToNodes, convertTreeToFlat]);

  const getLevelName = useMemo(() => {
    // استفاده از سطوح پویا اگر موجود باشد، در غیر این صورت از سطوح استاتیک
    const availableLevels = dynamicLevels.length > 0 ? dynamicLevels : levels;
    const map = new Map<number, string>();
    if (availableLevels) {
      availableLevels.forEach((l) => {
        const order = 'order' in l ? l.order : (l as any).order || 1;
        const name = 'name' in l ? l.name : (l as any).name || `سطح ${order}`;
        map.set(order, name);
      });
    }
    return (lvl: number) => map.get(lvl) || `سطح ${lvl}`;
  }, [dynamicLevels, levels]);

  // تابع برای تبدیل درخت nested به آرایه flat
  const flattenDefinitions = useCallback((definitions: MasterDefinition[]): MasterDefinition[] => {
    const result: MasterDefinition[] = [];
    
    const traverse = (defs: MasterDefinition[]) => {
      defs.forEach(def => {
        result.push({
          ...def,
          children: [] // حذف children برای جلوگیری از مشکلات circular reference
        });
        if (def.children && def.children.length > 0) {
          traverse(def.children);
        }
      });
    };
    
    traverse(definitions);
    return result;
  }, []);

  // گزینه‌های والد به صورت flat
  const parentOptions = useMemo(() => flattenDefinitions(masterDefinitions), [masterDefinitions, flattenDefinitions]);

  // تابع تأیید حذف
  const confirmDelete = () => {
    if (itemToDelete) {
      // حذف آیتم از ساختار درختی
      const removeFromTree = (definitions: MasterDefinition[], targetId: string): MasterDefinition[] => {
        return definitions
          .filter(d => d.id !== targetId) // حذف آیتم فعلی
          .map(d => ({
            ...d,
            children: d.children ? removeFromTree(d.children, targetId) : [] // حذف از فرزندان
          }));
      };
      
      const updatedDefinitions = removeFromTree(masterDefinitions, itemToDelete.id);
      saveTreeChanges(updatedDefinitions);
      
      setIsDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <>
      <Accordion
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: (t) => alpha(t.palette.primary.light, t.palette.mode === 'dark' ? 0.08 : 0.12),
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: (t) => `0 6px 24px ${alpha(t.palette.common.black, t.palette.mode === 'dark' ? 0.4 : 0.1)}`,
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="category-management-content"
          id="category-management-header"
          sx={{
            bgcolor: (t) => alpha(t.palette.background.paper, t.palette.mode === 'dark' ? 0.06 : 0.6),
            '&:hover': { bgcolor: (t) => alpha(t.palette.background.paper, t.palette.mode === 'dark' ? 0.1 : 0.7) },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 1, bgcolor: 'background.paper', boxShadow: (t) => `0 2px 8px ${alpha(t.palette.primary.main, 0.15)}` }}>
              <AccountTreeIcon sx={{ color: (t) => t.palette.primary.main }} />
            </Box>
            <Box>
              <Typography variant="h6">مدیریت داده‌های {categoryName}</Typography>
              <Typography variant="body2" color="text.secondary">مدیریت و سازماندهی زیرمجموعه‌های {categoryName}</Typography>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Paper
            sx={{
              p: 2,
              borderRadius: 2,
              boxShadow: (theme) => `0 4px 20px rgba(0,0,0,${theme.palette.mode === 'dark' ? 0.4 : 0.08})`,
              bgcolor: (theme) => theme.palette.background.paper,
            }}
          >
        {/* Top controls: view toggles and add button (small) */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h6" color="text.primary">{categoryName}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1">نمایش:</Typography>
              <ToggleButtonGroup
                size="small"
                exclusive
                color="primary"
                value={viewMode}
                onChange={(_, m) => m && setViewMode(m)}
              >
                <ToggleButton value={ViewMode.TREE} aria-label="درختی"><AccountTreeIcon sx={{ mr: 1 }} />درختی</ToggleButton>
                <ToggleButton value={ViewMode.GRAPH} aria-label="گرافی"><HubIcon sx={{ mr: 1 }} />گرافی</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            {viewMode === ViewMode.TREE && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1">نحوه نمایش:</Typography>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  color="primary"
                  value={treeDisplayMode}
                  onChange={(_, m) => m && setTreeDisplayMode(m)}
                  aria-label="tree display mode"
                >
                  <ToggleButton value="hierarchy" aria-label="سلسله‌مراتبی"><AccountTreeIcon sx={{ mr: 1 }} />سلسله‌مراتبی</ToggleButton>
                  <ToggleButton value="level" aria-label="بر اساس سطح"><ViewListIcon sx={{ mr: 1 }} />بر اساس سطح</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            )}
            <Button variant="contained" size="small" onClick={() => {
              setSelectedParentId(undefined);
              setIsAddModalOpen(true);
            }}>افزودن داده جدید</Button>
            <HierarchicalExcelImporter
              levels={(dynamicLevels.length > 0 ? dynamicLevels : levels) as any}
              categoryId={categoryId}
              categoryType={categoryType}
              onImported={async (importedNodes) => {
                setNodes(importedNodes);
                try {
                  await saveCategoryNodes(categoryType, categoryId, importedNodes);
                } catch (e) {
                  console.error('Error saving imported nodes:', e);
                }
              }}
              title={`ورود داده‌های ${categoryName} از اکسل`}
            />
          </Box>
        </Box>

        {/* Search and advanced filters */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="جستجو در نام یا توضیحات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 260, flex: 1 }}
            />
            <Button variant="outlined" size="small" color="primary" onClick={() => setShowAdvancedFilters((v) => !v)} startIcon={<SearchIcon />}>فیلترهای پیشرفته</Button>
          </Box>
          <Collapse in={showAdvancedFilters}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <Box>
                <FormLabel>جستجو در:</FormLabel>
                <RadioGroup row value={searchIn} onChange={(e) => setSearchIn(e.target.value as any)}>
                  <FormControlLabel value="both" control={<Radio size="small" />} label="هر دو" />
                  <FormControlLabel value="name" control={<Radio size="small" />} label="فقط نام" />
                  <FormControlLabel value="description" control={<Radio size="small" />} label="فقط توضیحات" />
                </RadioGroup>
              </Box>
              <Box>
                <FormLabel>{`محدوده سطح: ${levelRange[0]} تا ${levelRange[1]}`}</FormLabel>
                <Slider
                  size="small"
                  value={levelRange}
                  onChange={(_, v) => setLevelRange(v as number[])}
                  min={1}
                  max={maxLevels || 9}
                  step={1}
                  valueLabelDisplay="auto"
                  marks
                />
              </Box>
              <Box>
                <FormLabel>فرزندان:</FormLabel>
                <RadioGroup row value={childFilter} onChange={(e) => setChildFilter(e.target.value as any)}>
                  <FormControlLabel value="all" control={<Radio size="small" />} label="همه" />
                  <FormControlLabel value="with" control={<Radio size="small" />} label="با فرزند" />
                  <FormControlLabel value="without" control={<Radio size="small" />} label="بدون فرزند" />
                </RadioGroup>
              </Box>
              <Box>
                <FormLabel>مختصات جغرافیایی:</FormLabel>
                <RadioGroup row value={geoFilter} onChange={(e) => setGeoFilter(e.target.value as any)}>
                  <FormControlLabel value="all" control={<Radio size="small" />} label="همه" />
                  <FormControlLabel value="with" control={<Radio size="small" />} label="با مختصات جغرافیایی" />
                  <FormControlLabel value="without" control={<Radio size="small" />} label="بدون مختصات جغرافیایی" />
                </RadioGroup>
              </Box>
            </Box>
          </Collapse>
        </Box>

        {viewMode === ViewMode.TREE ? (
          treeDisplayMode === 'hierarchy' ? (
            <DefinitionTreeViewMinimal
            definitions={masterDefinitions}
            onCreate={(data) => {
              // ایجاد آیتم جدید
              const newDefinition: MasterDefinition = {
                id: Date.now().toString(),
                name: data.name || 'آیتم جدید',
                englishName: data.name || 'New Item',
                description: data.description || '',
                category: definitionCategoryMeta,
                parentId: data.parentId ?? undefined,
                level: data.level || 1,
                order: 0,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                children: [],
                customFields: data.customFields,
                metadata: data.metadata,
              };
              
              // افزودن آیتم به ساختار درختی
              const addToTree = (definitions: MasterDefinition[], newItem: MasterDefinition): MasterDefinition[] => {
                if (!newItem.parentId) {
                  // آیتم ریشه است
                  return [...definitions, newItem];
                }
                
                // پیدا کردن والد و افزودن فرزند
                return definitions.map(def => {
                  if (def.id === newItem.parentId) {
                    return {
                      ...def,
                      children: [...(def.children || []), newItem]
                    };
                  }
                  if (def.children && def.children.length > 0) {
                    return {
                      ...def,
                      children: addToTree(def.children, newItem)
                    };
                  }
                  return def;
                });
              };
              
              const updatedDefinitions = addToTree(masterDefinitions, newDefinition);
              saveTreeChanges(updatedDefinitions);
            }}
            onAddChild={(parentId) => {
              setSelectedParentId(parentId);
              setIsAddModalOpen(true);
            }}
            onUpdate={(id, _data) => {
              // پیدا کردن آیتم برای ویرایش
              const findItem = (definitions: MasterDefinition[], targetId: string): MasterDefinition | null => {
                for (const def of definitions) {
                  if (def.id === targetId) {
                    return def;
                  }
                  if (def.children && def.children.length > 0) {
                    const found = findItem(def.children, targetId);
                    if (found) return found;
                  }
                }
                return null;
              };

              const itemToEdit = findItem(masterDefinitions, id);
              if (itemToEdit) {
                // تنظیم حالت ویرایش
                setEditingItem(itemToEdit);
                setIsEditing(true);
                setSelectedParentId(itemToEdit.parentId || undefined);
                setIsAddModalOpen(true);
              }
            }}
            onDelete={(def) => {
              // نمایش مودال تأیید حذف
              setItemToDelete(def);
              setIsDeleteConfirmOpen(true);
            }}
            onReorder={(items) => {
              // تغییر ترتیب
              saveTreeChanges(items);
            }}
            getLevelName={getLevelName}
            />
          ) : (
            <LevelBasedTreeView
              definitions={masterDefinitions}
              onCreate={(data) => {
                // ایجاد آیتم جدید
                const newDefinition: MasterDefinition = {
                  id: Date.now().toString(),
                  name: data.name || 'آیتم جدید',
                  englishName: data.name || 'New Item',
                  description: data.description || '',
                  category: definitionCategoryMeta,
                  parentId: data.parentId ?? undefined,
                  level: data.level || 1,
                  order: 0,
                  isActive: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  children: [],
                  customFields: data.customFields,
                  metadata: data.metadata,
                };
                
                // افزودن آیتم به ساختار درختی
                const addToTree = (definitions: MasterDefinition[], newItem: MasterDefinition): MasterDefinition[] => {
                  if (!newItem.parentId) {
                    // آیتم ریشه است
                    return [...definitions, newItem];
                  }
                  
                  // پیدا کردن والد و افزودن فرزند
                  return definitions.map(def => {
                    if (def.id === newItem.parentId) {
                      return {
                        ...def,
                        children: [...(def.children || []), newItem]
                      };
                    }
                    if (def.children && def.children.length > 0) {
                      return {
                        ...def,
                        children: addToTree(def.children, newItem)
                      };
                    }
                    return def;
                  });
                };
                
                const updatedDefinitions = addToTree(masterDefinitions, newDefinition);
                saveTreeChanges(updatedDefinitions);
              }}
              onAddChild={(parentId) => {
                setSelectedParentId(parentId);
                setIsAddModalOpen(true);
              }}
              onUpdate={(id, _data) => {
                // پیدا کردن آیتم برای ویرایش
                const findItem = (definitions: MasterDefinition[], targetId: string): MasterDefinition | null => {
                  for (const def of definitions) {
                    if (def.id === targetId) {
                      return def;
                    }
                    if (def.children && def.children.length > 0) {
                      const found = findItem(def.children, targetId);
                      if (found) return found;
                    }
                  }
                  return null;
                };

                const itemToEdit = findItem(masterDefinitions, id);
                if (itemToEdit) {
                  // تنظیم حالت ویرایش
                  setEditingItem(itemToEdit);
                  setIsEditing(true);
                  setSelectedParentId(itemToEdit.parentId || undefined);
                  setIsAddModalOpen(true);
                }
              }}
              onDelete={(def) => {
                // نمایش مودال تأیید حذف
                setItemToDelete(def);
                setIsDeleteConfirmOpen(true);
              }}
              getLevelName={getLevelName}
            />
          )
        ) : (
          <SimpleGraphViewer
            data={nodes as any}
            getLevelName={getLevelName}
            onGraphChange={handleGraphChange}
          />
        )}
          </Paper>
        </AccordionDetails>
      </Accordion>

      {/* مودال افزودن داده جدید */}
      <AddDataModal
        open={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditing(false);
          setEditingItem(null);
        }}
        onSubmit={(data) => {
          if (isEditing && editingItem) {
            // ویرایش آیتم موجود
            const updateInTree = (definitions: MasterDefinition[], targetId: string, updates: any): MasterDefinition[] => {
              return definitions.map(def => {
                if (def.id === targetId) {
                  return { 
                    ...def, 
                    ...updates, 
                    updatedAt: new Date().toISOString() 
                  };
                }
                if (def.children && def.children.length > 0) {
                  return {
                    ...def,
                    children: updateInTree(def.children, targetId, updates)
                  };
                }
                return def;
              });
            };
            
            const updatedDefinitions = updateInTree(masterDefinitions, editingItem.id, {
              name: data.name,
              englishName: data.englishName,
              description: data.description,
              level: data.level,
              parentId: data.parentId || undefined,
              metadata: data.metadata,
            });
            saveTreeChanges(updatedDefinitions);
          } else {
            // افزودن آیتم جدید
            const newDefinition: MasterDefinition = {
              id: Date.now().toString(),
              name: data.name,
              englishName: data.englishName,
              description: data.description,
              category: definitionCategoryMeta,
              parentId: data.parentId || undefined,
              level: data.level,
              order: 0,
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              children: [],
              customFields: data.customFields,
              metadata: data.metadata,
            };
            
            // افزودن آیتم به ساختار درختی
            const addToTree = (definitions: MasterDefinition[], newItem: MasterDefinition): MasterDefinition[] => {
              if (!newItem.parentId) {
                // آیتم ریشه است
                return [...definitions, newItem];
              }
              
              // پیدا کردن والد و افزودن فرزند
              return definitions.map(def => {
                if (def.id === newItem.parentId) {
                  return {
                    ...def,
                    children: [...(def.children || []), newItem]
                  };
                }
                if (def.children && def.children.length > 0) {
                  return {
                    ...def,
                    children: addToTree(def.children, newItem)
                  };
                }
                return def;
              });
            };
            
            const updatedDefinitions = addToTree(masterDefinitions, newDefinition);
            saveTreeChanges(updatedDefinitions);
          }
          
          // پاک کردن حالت ویرایش
          setIsEditing(false);
          setEditingItem(null);
        }}
        category={definitionCategoryMeta}
        categoryType={categoryType}
        levels={dynamicLevels.length > 0 ? dynamicLevels : levels}
        parentOptions={parentOptions}
        parentId={selectedParentId}
        editingItem={editingItem}
        isEditing={isEditing}
      />

      {/* مودال تأیید حذف */}
      <Dialog
        open={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        PaperProps={{
          sx: { direction: 'rtl' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          تأیید حذف
        </DialogTitle>
        <DialogContent>
          <Typography>
            آیا از حذف "{itemToDelete?.name}" اطمینان دارید؟
            {itemToDelete?.children && itemToDelete.children.length > 0 && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                ⚠️ این آیتم دارای {itemToDelete.children.length} زیرمجموعه است که همگی حذف خواهند شد.
              </Typography>
            )}
            این عمل قابل بازگشت نیست.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteConfirmOpen(false)} color="primary">
            انصراف
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BaseCategoryManager;


