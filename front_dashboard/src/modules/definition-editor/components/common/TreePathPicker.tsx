import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  IconButton, 
  Button,
  TextField,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  alpha,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip
} from '@mui/material';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';

// Types
import { TreeNode, CustomField } from '../../types/equipment';

interface TreePathPickerProps {
  treeData: TreeNode[];
  initialPath?: string[];
  onPathChange: (path: string[], selectedNode: TreeNode | null) => void;
  onTreeDataChange?: (newTreeData: TreeNode[]) => void;
  title?: string;
  description?: string;
  showBreadcrumbs?: boolean;
  allowEditing?: boolean;
}

interface TreeNodeFormData {
  name: string;
  englishName: string;
  order: number;
}

interface TreeNodeFormErrors {
  name?: string;
  englishName?: string;
}

const TreePathPicker: React.FC<TreePathPickerProps> = ({
  treeData,
  initialPath = [],
  onPathChange,
  onTreeDataChange,
  title = 'انتخاب مسیر',
  description = 'مسیر مورد نظر خود را انتخاب کنید',
  showBreadcrumbs = true,
  allowEditing = false
}) => {
  // حالت‌های کامپوننت
  const [currentPath, setCurrentPath] = useState<string[]>(initialPath);
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredNodes, setFilteredNodes] = useState<TreeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [editingNode, setEditingNode] = useState<TreeNode | null>(null);
  const [nodeFormData, setNodeFormData] = useState<TreeNodeFormData>({
    name: '',
    englishName: '',
    order: 1
  });
  const [formErrors, setFormErrors] = useState<TreeNodeFormErrors>({});
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [contextMenuNode, setContextMenuNode] = useState<TreeNode | null>(null);

  // به‌روزرسانی مسیر اولیه
  useEffect(() => {
    setCurrentPath(initialPath);
    setCurrentLevel(initialPath.length);
  }, [initialPath]);

  // فیلتر کردن گره‌ها بر اساس جستجو
  useEffect(() => {
    const filterNodes = (nodes: TreeNode[], term: string): TreeNode[] => {
      return nodes.filter(node => 
        node.name.toLowerCase().includes(term.toLowerCase()) ||
        node.englishName.toLowerCase().includes(term.toLowerCase())
      );
    };

    if (searchTerm.trim()) {
      const filtered = filterNodes(treeData, searchTerm);
      setFilteredNodes(filtered);
    } else {
      setFilteredNodes([]);
    }
  }, [searchTerm, treeData]);

  // دریافت گره‌های سطح فعلی
  const getCurrentLevelNodes = (): TreeNode[] => {
    if (currentLevel === 0) {
      return treeData;
    }

    let currentNodes = treeData;
    for (let i = 0; i < currentLevel; i++) {
      const nodeId = currentPath[i];
      const node = currentNodes.find(n => n.id === nodeId);
      if (node && node.children) {
        currentNodes = node.children;
      } else {
        return [];
      }
    }
    return currentNodes;
  };

  // حرکت به سطح بعدی
  const navigateToLevel = (level: number) => {
    setCurrentLevel(level);
    setCurrentPath(currentPath.slice(0, level));
    setSelectedNode(null);
  };

  // انتخاب گره
  const handleNodeSelect = (node: TreeNode) => {
    setSelectedNode(node);
    const newPath = [...currentPath.slice(0, currentLevel), node.id];
    setCurrentPath(newPath);
    onPathChange(newPath, node);
  };

  // حرکت به زیرمجموعه
  const handleNodeExpand = (node: TreeNode) => {
    const newPath = [...currentPath.slice(0, currentLevel), node.id];
    setCurrentPath(newPath);
    setCurrentLevel(currentLevel + 1);
    setSelectedNode(null);
  };

  // بازگشت به سطح قبلی
  const handleBack = () => {
    if (currentLevel > 0) {
      const newLevel = currentLevel - 1;
      setCurrentLevel(newLevel);
      setCurrentPath(currentPath.slice(0, newLevel));
      setSelectedNode(null);
    }
  };

  // بازگشت به ریشه
  const handleHome = () => {
    setCurrentLevel(0);
    setCurrentPath([]);
    setSelectedNode(null);
  };

  // پاک کردن جستجو
  const handleClearSearch = () => {
    setSearchTerm('');
    setFilteredNodes([]);
  };

  // باز کردن منوی عملیات
  const handleContextMenu = (event: React.MouseEvent, node: TreeNode) => {
    event.preventDefault();
    setAnchorEl(event.currentTarget);
    setContextMenuNode(node);
  };

  // بستن منوی عملیات
  const handleCloseContextMenu = () => {
    setAnchorEl(null);
    setContextMenuNode(null);
  };

  // باز کردن دیالوگ افزودن
  const handleAddNode = () => {
    setNodeFormData({
      name: '',
      englishName: '',
      order: getCurrentLevelNodes().length + 1
    });
    setFormErrors({});
    setIsAddDialogOpen(true);
  };

  // باز کردن دیالوگ ویرایش
  const handleEditNode = (node: TreeNode) => {
    setEditingNode(node);
    setNodeFormData({
      name: node.name,
      englishName: node.englishName,
      order: node.order
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
    handleCloseContextMenu();
  };

  // حذف گره
  const handleDeleteNode = (node: TreeNode) => {
    if (onTreeDataChange) {
      const deleteNodeFromTree = (nodes: TreeNode[], nodeId: string): TreeNode[] => {
        return nodes.filter(n => {
          if (n.id === nodeId) {
            return false;
          }
          if (n.children) {
            n.children = deleteNodeFromTree(n.children, nodeId);
          }
          return true;
        });
      };

      const newTreeData = deleteNodeFromTree([...treeData], node.id);
      onTreeDataChange(newTreeData);
    }
    handleCloseContextMenu();
  };

  // اعتبارسنجی فرم
  const validateForm = (): boolean => {
    const errors: TreeNodeFormErrors = {};

    if (!nodeFormData.name.trim()) {
      errors.name = 'نام گره الزامی است';
    }

    if (!nodeFormData.englishName.trim()) {
      errors.englishName = 'نام انگلیسی گره الزامی است';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ذخیره گره
  const handleSaveNode = () => {
    if (validateForm()) {
      if (isAddDialogOpen) {
        // افزودن گره جدید
        const newNode: TreeNode = {
          id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: nodeFormData.name,
          englishName: nodeFormData.englishName,
          order: nodeFormData.order,
          children: [],
          isActive: true
        };

        if (onTreeDataChange) {
          const addNodeToTree = (nodes: TreeNode[], path: string[], newNode: TreeNode): TreeNode[] => {
            if (path.length === 0) {
              return [...nodes, newNode].sort((a, b) => a.order - b.order);
            }

            return nodes.map(node => {
              if (node.id === path[0]) {
                return {
                  ...node,
                  children: addNodeToTree(node.children || [], path.slice(1), newNode)
                };
              }
              return node;
            });
          };

          const newTreeData = addNodeToTree([...treeData], currentPath, newNode);
          onTreeDataChange(newTreeData);
        }
      } else if (isEditDialogOpen && editingNode) {
        // ویرایش گره موجود
        const updateNodeInTree = (nodes: TreeNode[], nodeId: string, updates: Partial<TreeNode>): TreeNode[] => {
          return nodes.map(node => {
            if (node.id === nodeId) {
              return { ...node, ...updates };
            }
            if (node.children) {
              return {
                ...node,
                children: updateNodeInTree(node.children, nodeId, updates)
              };
            }
            return node;
          });
        };

        if (onTreeDataChange) {
          const newTreeData = updateNodeInTree([...treeData], editingNode.id, {
            name: nodeFormData.name,
            englishName: nodeFormData.englishName,
            order: nodeFormData.order
          });
          onTreeDataChange(newTreeData);
        }
      }

      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      setEditingNode(null);
    }
  };

  // نمایش گره‌های سطح فعلی
  const currentNodes = getCurrentLevelNodes();
  const displayNodes = searchTerm.trim() ? filteredNodes : currentNodes;

  return (
    <Paper 
      sx={{ 
        p: 2, 
        borderRadius: 2,
        boxShadow: (theme) => `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
        overflow: 'hidden'
      }}
    >
      {/* عنوان و توضیحات */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {description}
          </Typography>
        )}
      </Box>

      {/* نوار ابزار */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        mb: 2,
        flexWrap: 'wrap'
      }}>
        {/* دکمه‌های ناوبری */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton 
            onClick={handleHome}
            disabled={currentLevel === 0}
            size="small"
          >
            <HomeIcon />
          </IconButton>
          <IconButton 
            onClick={handleBack}
            disabled={currentLevel === 0}
            size="small"
          >
            <ArrowBackIcon />
          </IconButton>
        </Box>

        {/* جستجو */}
        <TextField
          size="small"
          placeholder="جستجو در گره‌ها..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{ minWidth: 200 }}
        />

        {/* دکمه افزودن */}
        {allowEditing && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddNode}
            size="small"
          >
            افزودن گره
          </Button>
        )}
      </Box>

      {/* Breadcrumbs */}
      {showBreadcrumbs && currentPath.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
            <Chip
              label="ریشه"
              size="small"
              onClick={handleHome}
              clickable
              variant="outlined"
            />
            {currentPath.map((nodeId, index) => {
              const node = findNodeById(treeData, nodeId);
              return (
                <Box key={nodeId} sx={{ display: 'flex', alignItems: 'center' }}>
                  <NavigateNextIcon fontSize="small" color="action" />
                  <Chip
                    label={node?.name || nodeId}
                    size="small"
                    onClick={() => navigateToLevel(index + 1)}
                    clickable
                    variant={index === currentPath.length - 1 ? "filled" : "outlined"}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* لیست گره‌ها */}
      <Paper 
        variant="outlined" 
        sx={{ 
          borderRadius: 1,
          overflow: 'hidden',
          maxHeight: 400,
          overflowY: 'auto'
        }}
      >
        <List dense>
          {displayNodes.length === 0 ? (
            <ListItem>
              <ListItemText 
                primary={searchTerm.trim() ? "نتیجه‌ای یافت نشد" : "هیچ گره‌ای وجود ندارد"}
                primaryTypographyProps={{ 
                  color: 'text.secondary',
                  align: 'center' 
                }}
              />
            </ListItem>
          ) : (
            displayNodes
              .slice().sort((a, b) => a.order - b.order)
              .map((node) => (
                <ListItem
                  key={node.id}
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': {
                      borderBottom: 'none'
                    },
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
                    },
                    cursor: 'pointer'
                  }}
                  onClick={() => handleNodeSelect(node)}
                  onContextMenu={(e) => allowEditing && handleContextMenu(e, node)}
                >
                  <ListItemIcon>
                    {node.children && node.children.length > 0 ? (
                      <FolderOpenIcon color="primary" />
                    ) : (
                      <FolderIcon color="action" />
                    )}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <React.Fragment>
                        <Typography variant="body1" component="span">
                          {node.name}
                        </Typography>
                        {selectedNode?.id === node.id && (
                          <CheckCircleIcon color="primary" fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                        )}
                      </React.Fragment>
                    }
                    secondary={
                      <React.Fragment>
                        <Typography variant="caption" color="text.secondary" component="span" display="block">
                          {node.englishName}
                        </Typography>
                        {node.children && node.children.length > 0 && (
                          <Typography variant="caption" color="info.main" component="span">
                            {node.children.length} زیرمجموعه
                          </Typography>
                        )}
                      </React.Fragment>
                    }
                  />
                  
                  {allowEditing && (
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                      <IconButton 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditNode(node);
                        }}
                        color="primary"
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNode(node);
                        }}
                        color="error"
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      {node.children && node.children.length > 0 && (
                        <IconButton 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNodeExpand(node);
                          }}
                          color="default"
                          size="small"
                        >
                          <ArrowForwardIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  )}
                </ListItem>
              ))
          )}
        </List>
      </Paper>

      {/* منوی عملیات */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseContextMenu}
      >
        {contextMenuNode && (
          <>
            <MenuItem onClick={() => handleEditNode(contextMenuNode)}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              ویرایش
            </MenuItem>
            <MenuItem onClick={() => handleDeleteNode(contextMenuNode)}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              حذف
            </MenuItem>
          </>
        )}
      </Menu>

      {/* دیالوگ افزودن/ویرایش گره */}
      <Dialog 
        open={isAddDialogOpen || isEditDialogOpen} 
        onClose={() => {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
          setEditingNode(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { direction: 'rtl' }
        }}
      >
        <DialogTitle>
          {isAddDialogOpen ? 'افزودن گره جدید' : 'ویرایش گره'}
        </DialogTitle>
        
        <Divider />
        
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="نام گره (فارسی)"
              value={nodeFormData.name}
              onChange={(e) => {
                setNodeFormData({ ...nodeFormData, name: e.target.value });
                if (formErrors.name) {
                  setFormErrors({ ...formErrors, name: undefined });
                }
              }}
              fullWidth
              required
              error={!!formErrors.name}
              helperText={formErrors.name}
              sx={{ direction: 'rtl' }}
            />
            
            <TextField
              label="نام گره (انگلیسی)"
              value={nodeFormData.englishName}
              onChange={(e) => {
                setNodeFormData({ ...nodeFormData, englishName: e.target.value });
                if (formErrors.englishName) {
                  setFormErrors({ ...formErrors, englishName: undefined });
                }
              }}
              fullWidth
              required
              error={!!formErrors.englishName}
              helperText={formErrors.englishName}
            />
            
            <TextField
              label="ترتیب نمایش"
              type="number"
              value={nodeFormData.order}
              onChange={(e) => {
                const order = parseInt(e.target.value);
                setNodeFormData({ ...nodeFormData, order: isNaN(order) ? 1 : order });
              }}
              fullWidth
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Box>
        </DialogContent>
        
        <Divider />
        
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => {
              setIsAddDialogOpen(false);
              setIsEditDialogOpen(false);
              setEditingNode(null);
            }}
            variant="outlined"
          >
            انصراف
          </Button>
          <Button 
            onClick={handleSaveNode} 
            variant="contained"
            color="primary"
          >
            {isAddDialogOpen ? 'افزودن گره' : 'ذخیره تغییرات'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

// تابع کمکی برای پیدا کردن گره بر اساس ID
const findNodeById = (nodes: TreeNode[], nodeId: string): TreeNode | null => {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return node;
    }
    if (node.children) {
      const found = findNodeById(node.children, nodeId);
      if (found) return found;
    }
  }
  return null;
};

export default TreePathPicker;
