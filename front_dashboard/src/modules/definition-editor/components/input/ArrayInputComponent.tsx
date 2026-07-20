// Array Input Component for Smart Field Builder System
// کامپوننت ورودی آرایه‌ای برای سیستم سازنده فیلد هوشمند

import React, { useState, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  IconButton,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Grid,
  Paper,
  Divider,
  Tooltip,
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Share as SocialIcon,
  Person as PersonIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';

import type { ArrayFieldConfig } from '../enhancement/ArrayFieldManager';
import { SmartFieldConfig } from '../../smart-field-builder/types';

interface ArrayInputComponentProps {
  config: SmartFieldConfig;
  value: any[];
  onChange: (value: any[]) => void;
  error?: string;
  disabled?: boolean;
  variant?: 'outlined' | 'filled' | 'standard';
  size?: 'small' | 'medium' | 'large';
}

const ArrayInputComponent: React.FC<ArrayInputComponentProps> = ({
  config,
  value = [],
  onChange,
  error,
  disabled = false,
  variant = 'outlined',
  size = 'medium'
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Get array configuration from field enhancements
  const arrayConfig = config.enhancements.find(e => e.type === 'multiple')?.config as ArrayFieldConfig;
  
  // Default configuration if not provided
  const finalConfig: ArrayFieldConfig = {
    minItems: arrayConfig?.minItems || 0,
    maxItems: arrayConfig?.maxItems || 10,
    allowDuplicates: arrayConfig?.allowDuplicates || false,
    itemLabels: arrayConfig?.itemLabels || [],
    showItemNumbers: arrayConfig?.showItemNumbers || false,
    sortable: arrayConfig?.sortable || false,
    validation: arrayConfig?.validation || { itemValidation: [], uniqueValidation: false },
    ui: {
      addButtonText: arrayConfig?.ui?.addButtonText || 'افزودن آیتم',
      removeButtonText: arrayConfig?.ui?.removeButtonText || 'حذف',
      emptyStateText: arrayConfig?.ui?.emptyStateText || 'هیچ آیتمی اضافه نشده است',
      layout: arrayConfig?.ui?.layout || 'vertical',
      compactMode: arrayConfig?.ui?.compactMode || false,
      ...arrayConfig?.ui
    }
  };

  // Add new item
  const handleAddItem = useCallback(() => {
    if (value.length >= finalConfig.maxItems) return;
    
    const newValue = [...value, ''];
    onChange(newValue);
  }, [value, finalConfig.maxItems, onChange]);

  // Remove item
  const handleRemoveItem = useCallback((index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  }, [value, onChange]);

  // Update item value
  const handleItemChange = useCallback((index: number, itemValue: any) => {
    const newValue = [...value];
    newValue[index] = itemValue;
    onChange(newValue);
  }, [value, onChange]);

  // Move item (drag and drop)
  const handleMoveItem = useCallback((fromIndex: number, toIndex: number) => {
    if (!finalConfig.sortable) return;
    
    const newValue = [...value];
    const [movedItem] = newValue.splice(fromIndex, 1);
    newValue.splice(toIndex, 0, movedItem);
    onChange(newValue);
  }, [value, finalConfig.sortable, onChange]);

  // Get item label
  const getItemLabel = useCallback((index: number) => {
    if (finalConfig.itemLabels && finalConfig.itemLabels[index]) {
      return finalConfig.itemLabels[index];
    }
    return `آیتم ${index + 1}`;
  }, [finalConfig.itemLabels]);

  // Get field icon based on type
  const getFieldIcon = () => {
    const fieldType = config.baseType;
    if (fieldType === 'phone') return <PhoneIcon />;
    if (fieldType === 'address') return <LocationIcon />;
    if (fieldType === 'social') return <SocialIcon />;
    if (fieldType === 'file') return <FileIcon />;
    return <PersonIcon />;
  };

  // Validate item value
  const validateItem = (itemValue: any, index: number): string | undefined => {
    if (!itemValue && finalConfig.minItems > 0 && index < finalConfig.minItems) {
      return 'این فیلد الزامی است';
    }
    
    // Check for duplicates if not allowed
    if (!finalConfig.allowDuplicates && itemValue) {
      const duplicateIndex = value.findIndex((v, i) => i !== index && v === itemValue);
      if (duplicateIndex !== -1) {
        return 'مقدار تکراری است';
      }
    }
    
    return undefined;
  };

  // Render item input based on field type
  const renderItemInput = (itemValue: any, index: number) => {
    const itemError = validateItem(itemValue, index);
    const label = getItemLabel(index);
    
    return (
      <TextField
        fullWidth
        label={label}
        value={itemValue || ''}
        onChange={(e) => handleItemChange(index, e.target.value)}
        error={!!itemError}
        helperText={itemError}
        disabled={disabled}
        variant={variant}
        size={size}
        placeholder={`${label} را وارد کنید`}
      />
    );
  };

  // Render single item
  const renderItem = (itemValue: any, index: number) => {
    const canRemove = value.length > finalConfig.minItems;
    const showNumber = finalConfig.showItemNumbers;
    
    return (
      <Box
        key={index}
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
          mb: finalConfig.ui.compactMode ? 1 : 2,
          p: finalConfig.ui.compactMode ? 1 : 2,
          backgroundColor: finalConfig.ui.compactMode ? 'transparent' : alpha('rgb(255, 255, 255)', 0.5),
          borderRadius: finalConfig.ui.compactMode ? 0 : 1,
          border: finalConfig.ui.compactMode ? 'none' : '1px solid',
          borderColor: finalConfig.ui.compactMode ? 'transparent' : 'divider'
        }}
      >
        {/* Drag handle */}
        {finalConfig.sortable && (
          <IconButton
            size="small"
            sx={{ mt: 1, cursor: 'grab' }}
            onMouseDown={() => setDraggedIndex(index)}
          >
            <DragIcon />
          </IconButton>
        )}
        
        {/* Item number */}
        {showNumber && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              mt: 1,
              flexShrink: 0
            }}
          >
            {index + 1}
          </Box>
        )}
        
        {/* Item input */}
        <Box sx={{ flex: 1 }}>
          {renderItemInput(itemValue, index)}
        </Box>
        
        {/* Remove button */}
        {canRemove && (
          <Tooltip title={finalConfig.ui.removeButtonText}>
            <IconButton
              color="error"
              size="small"
              onClick={() => handleRemoveItem(index)}
              disabled={disabled}
              sx={{ mt: 1 }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  };

  // Render based on layout
  const renderItems = () => {
    if (value.length === 0) {
      return (
        <Paper
          sx={{
            p: 3,
            textAlign: 'center',
            backgroundColor: alpha('rgb(158, 158, 158)', 0.04),
            border: '2px dashed',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ mb: 2 }}>
            {getFieldIcon()}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {finalConfig.ui.emptyStateText}
          </Typography>
        </Paper>
      );
    }

    switch (finalConfig.ui.layout) {
      case 'horizontal':
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {value.map((itemValue, index) => (
              <Box key={index} sx={{ minWidth: 200, flex: 1 }}>
                {renderItem(itemValue, index)}
              </Box>
            ))}
          </Box>
        );
        
      case 'grid':
        return (
          <Grid container spacing={2}>
            {value.map((itemValue, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                {renderItem(itemValue, index)}
              </Grid>
            ))}
          </Grid>
        );
        
      default: // vertical
        return (
          <Box>
            {value.map((itemValue, index) => renderItem(itemValue, index))}
          </Box>
        );
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">
          {config.name}
          {config.isRequired && (
            <Typography component="span" color="error" sx={{ ml: 0.5 }}>
              *
            </Typography>
          )}
        </Typography>
        
        {/* Add button */}
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddItem}
          disabled={disabled || value.length >= finalConfig.maxItems}
        >
          {finalConfig.ui.addButtonText}
        </Button>
      </Box>

      {/* Items */}
      {renderItems()}

      {/* Status info */}
      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          size="small"
          label={`${value.length} از ${finalConfig.maxItems} آیتم`}
          color={value.length >= finalConfig.minItems ? 'success' : 'warning'}
        />
        
        {finalConfig.minItems > 0 && value.length < finalConfig.minItems && (
          <Chip
            size="small"
            label={`حداقل ${finalConfig.minItems} آیتم مورد نیاز است`}
            color="warning"
            variant="outlined"
          />
        )}
        
        {value.length >= finalConfig.maxItems && (
          <Chip
            size="small"
            label="حداکثر ظرفیت"
            color="info"
            variant="outlined"
          />
        )}
      </Box>

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

export default ArrayInputComponent;