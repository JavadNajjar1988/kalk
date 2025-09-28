import React, { useState, useMemo } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Paper,
  Divider,
  Chip,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  AccountTree as TreeIcon,
  Sync as SyncIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useEquipmentHierarchy, type EquipmentPath, type EquipmentFieldDefinition } from '@/hooks/useEquipmentHierarchy';

interface EquipmentHierarchicalSelectorProps {
  value?: EquipmentPath[];
  onChange?: (path: EquipmentPath[], finalNodeId?: string) => void;
  onFieldsChange?: (fields: EquipmentFieldDefinition[]) => void;
  error?: string;
  disabled?: boolean;
}

const EquipmentHierarchicalSelector: React.FC<EquipmentHierarchicalSelectorProps> = ({
  value = [],
  onChange,
  onFieldsChange,
  error,
  disabled = false
}) => {
  const {
    rootNodes,
    loading,
    error: hierarchicalError,
    selectedPath,
    getCurrentSelection,
    addToPath,
    clearPathFromLevel,
    resetPath,
    getOptionsForLevel,
    refresh,
    triggerManualSync,
    lastSyncTime
  } = useEquipmentHierarchy();

  // محاسبه حداکثر سطح برای نمایش
  const maxLevel = useMemo(() => {
    if (selectedPath.length === 0) return 1;
    
    const lastLevel = selectedPath[selectedPath.length - 1].level;
    const lastNode = getCurrentSelection.finalNode;
    
    // اگر گره آخر فرزند دارد، سطح بعدی را نمایش بده
    return lastNode && lastNode.hasChildren ? lastLevel + 1 : lastLevel;
  }, [selectedPath, getCurrentSelection]);

  // هنگامی که مسیر تغییر کرد، callback ها را فراخوانی کن
  React.useEffect(() => {
    const selection = getCurrentSelection;
    
    if (onChange) {
      onChange(selectedPath, selection.finalNode?.id);
    }
    
    // Only pass fields if we're at a leaf node (no children) AND there are fields defined
    if (onFieldsChange) {
      const isLeafNode = selection.finalNode && !selection.finalNode.hasChildren;
      const hasFields = selection.fields && selection.fields.length > 0;
      onFieldsChange(isLeafNode && hasFields ? selection.fields : []);
    }
  }, [selectedPath, onChange, onFieldsChange, getCurrentSelection]);

  const handleLevelChange = (level: number, nodeId: string) => {
    const options = getOptionsForLevel(level);
    const selectedNode = options.find(node => node.id === nodeId);
    
    if (selectedNode) {
      addToPath(selectedNode.id, selectedNode.name, level);
    }
  };

  const handleClearFromLevel = (level: number) => {
    clearPathFromLevel(level);
  };

  const getCurrentValueForLevel = (level: number): string => {
    const pathItem = selectedPath.find(item => item.level === level);
    return pathItem?.nodeId || '';
  };

  const renderSelector = (level: number) => {
    const options = getOptionsForLevel(level);
    const currentValue = getCurrentValueForLevel(level);
    const hasOptions = options.length > 0;

    if (!hasOptions && level > 1) {
      return null; // اگر گزینه‌ای نیست، selector را نمایش نده
    }

    const levelName = level === 1 ? 'دسته اصلی' : `سطح ${level}`;

    return (
      <Box key={level} sx={{ mb: 1.5 }}>
        <FormControl 
          fullWidth 
          disabled={disabled || !hasOptions}
          size="small"
        >
          <InputLabel sx={{ fontSize: '0.875rem' }}>{levelName}</InputLabel>
          <Select
            value={currentValue}
            onChange={(e) => handleLevelChange(level, e.target.value as string)}
            label={levelName}
            error={!!error}
            sx={{
              '& .MuiSelect-select': {
                py: 1,
                fontSize: '0.875rem'
              }
            }}
          >
            <MenuItem value="">
              <em>انتخاب کنید...</em>
            </MenuItem>
            {options.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {option.hasChildren && (
                    <TreeIcon fontSize="small" color="action" />
                  )}
                  <span>{option.name}</span>
                  {option.englishName && option.englishName !== option.name && (
                    <Typography variant="caption" color="text.secondary">
                      ({option.englishName})
                    </Typography>
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    );
  };

  const renderSelectors = () => {
    const selectors = [];
    for (let level = 1; level <= maxLevel; level++) {
      const selector = renderSelector(level);
      if (selector) {
        selectors.push(selector);
      }
    }
    return selectors;
  };

  const renderSelectedPath = () => {
    if (selectedPath.length === 0) return null;

    return (
      <Paper 
        elevation={0}
        sx={{ 
          p: 2, 
          mt: 2, 
          bgcolor: 'grey.50',
          border: 1,
          borderColor: 'grey.200',
          borderRadius: 1
        }}
      >
        <Typography variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 500 }}>
          مسیر انتخاب شده:
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {selectedPath.map((pathItem, index) => (
            <React.Fragment key={pathItem.nodeId}>
              {index > 0 && (
                <Box 
                  component="span"
                  sx={{ 
                    alignSelf: 'center',
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    mx: 0.5
                  }}
                >
                  {'>'}
                </Box>
              )}
              <Chip
                label={pathItem.nodeName}
                variant="outlined"
                size="small"
                color="primary"
                sx={{ fontSize: '0.75rem', height: 24 }}
              />
            </React.Fragment>
          ))}
        </Stack>
        
        {getCurrentSelection.finalNode && !getCurrentSelection.finalNode.hasChildren && getCurrentSelection.fields.length === 0 && (
          <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
            برای این گره فیلدی تعریف نشده است
          </Typography>
        )}
        
        {getCurrentSelection.fields.length > 0 && getCurrentSelection.finalNode && !getCurrentSelection.finalNode.hasChildren && (
          <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
            ✓ {getCurrentSelection.fields.length} فیلد برای این مسیر در دسترس است
          </Typography>
        )}
      </Paper>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          در حال بارگذاری ساختار تجهیزات...
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

  if (!rootNodes || rootNodes.length === 0) {
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
          ساختار تجهیزات یافت نشد
        </Box>
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TreeIcon color="primary" />
          انتخاب دسته‌بندی تجهیزات
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="همگام‌سازی با ویرایشگر تعاریف">
            <IconButton
              size="small"
              onClick={triggerManualSync}
              title="همگام‌سازی"
            >
              <SyncIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={`آخرین به‌روزرسانی: ${new Date(lastSyncTime).toLocaleTimeString('fa-IR')}`}>
            <IconButton
              size="small"
              onClick={() => {
                resetPath();
                refresh();
              }}
              title="بازنشانی و به‌روزرسانی"
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {renderSelectors()}
      
      {renderSelectedPath()}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default EquipmentHierarchicalSelector;