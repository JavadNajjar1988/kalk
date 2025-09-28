import React, { useState, useCallback } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
  FormHelperText,
  InputAdornment,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Add as AddIcon
} from '@mui/icons-material';

// Components
import NodeSearchComponent from '../search/NodeSearchComponent';
import { CategoryType } from '../../types';
import type { 
  BuiltField, 
  BaseFieldType,
  NodeSearchResult 
} from '../../types/fieldConstructor';

interface BaseFieldRendererProps {
  field: BuiltField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  readonly?: boolean;
}

const BaseFieldRenderer: React.FC<BaseFieldRendererProps> = ({
  field,
  value,
  onChange,
  error,
  disabled = false,
  readonly = false
}) => {
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  
  // Handle different base field types
  const renderBaseField = () => {
    switch (field.baseType) {
      case 'text':
        return renderTextField();
      case 'number':
        return renderNumberField();
      case 'selection':
        return renderSelectionField();
      case 'reference':
        return renderReferenceField();
      default:
        return renderTextField();
    }
  };

  // Text field renderer
  const renderTextField = () => {
    const isEnglishOnly = field.validationRules?.customRules?.includes('englishOnly');
    const isNumericOnly = field.validationRules?.customRules?.includes('numericOnly');
    
    return (
      <TextField
        fullWidth
        label={field.name}
        value={value || ''}
        onChange={(e) => {
          let newValue = e.target.value;
          
          // Apply input restrictions
          if (isEnglishOnly) {
            newValue = newValue.replace(/[^a-zA-Z0-9\s]/g, '');
          }
          if (isNumericOnly) {
            newValue = newValue.replace(/[^0-9]/g, '');
          }
          
          onChange(newValue);
        }}
        error={!!error}
        helperText={error || field.description}
        disabled={disabled}
        InputProps={{
          readOnly: readonly,
          ...(field.fieldConfig.inputEnhancement?.type === 'autocomplete' && {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setSearchDialogOpen(true)}
                  edge="end"
                  size="small"
                >
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            )
          })
        }}
        inputProps={{
          maxLength: field.validationRules?.maxLength,
          minLength: field.validationRules?.minLength,
          pattern: field.validationRules?.pattern
        }}
      />
    );
  };

  // Number field renderer
  const renderNumberField = () => {
    return (
      <TextField
        fullWidth
        type="number"
        label={field.name}
        value={value || ''}
        onChange={(e) => {
          const numValue = e.target.value ? Number(e.target.value) : null;
          onChange(numValue);
        }}
        error={!!error}
        helperText={error || field.description}
        disabled={disabled}
        InputProps={{
          readOnly: readonly,
          endAdornment: field.unit && (
            <InputAdornment position="end">
              <Typography variant="caption">{field.unit}</Typography>
            </InputAdornment>
          )
        }}
        inputProps={{
          min: field.validationRules?.minValue,
          max: field.validationRules?.maxValue,
          step: 1
        }}
      />
    );
  };

  // Selection field renderer
  const renderSelectionField = () => {
    const isMultiSelect = field.fieldConfig.inputEnhancement?.type === 'multiSelect';
    
    if (isMultiSelect) {
      return (
        <FormControl fullWidth error={!!error}>
          <InputLabel>{field.name}</InputLabel>
          <Select
            multiple
            value={value || []}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            readOnly={readonly}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(selected as string[]).map((val) => (
                  <Chip key={val} label={val} size="small" />
                ))}
              </Box>
            )}
          >
            {field.options?.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
          {(error || field.description) && (
            <FormHelperText>{error || field.description}</FormHelperText>
          )}
        </FormControl>
      );
    }
    
    return (
      <FormControl fullWidth error={!!error}>
        <InputLabel>{field.name}</InputLabel>
        <Select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          readOnly={readonly}
        >
          {field.options?.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
        {(error || field.description) && (
          <FormHelperText>{error || field.description}</FormHelperText>
        )}
      </FormControl>
    );
  };

  // Reference field renderer
  const renderReferenceField = () => {
    const isHierarchical = field.fieldConfig.inputEnhancement?.type === 'hierarchical';
    const isMultiSelect = field.fieldConfig.inputEnhancement?.type === 'multiSelect';
    
    // Get category type from field configuration
    const getCategoryType = (): CategoryType => {
      const categoryType = field.fieldConfig.dataSource?.configuration.categoryType;
      switch (categoryType) {
        case 'military_ranks':
          return CategoryType.MILITARY_RANKS;
        case 'equipment':
          return CategoryType.EQUIPMENT;
        case 'persons':
          return CategoryType.PERSONS;
        case 'geographical':
          return CategoryType.GEOGRAPHICAL;
        default:
          return CategoryType.GEOGRAPHICAL;
      }
    };

    const selectedNodes: NodeSearchResult[] = value ? 
      (Array.isArray(value) ? value : [value]) : [];

    return (
      <Box>
        <FormControl fullWidth error={!!error}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              fullWidth
              label={field.name}
              value={selectedNodes.map(node => node.name).join(', ')}
              disabled={disabled}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setSearchDialogOpen(true)}
                      disabled={disabled || readonly}
                      size="small"
                    >
                      <SearchIcon />
                    </IconButton>
                    {selectedNodes.length > 0 && (
                      <IconButton
                        onClick={() => onChange(isMultiSelect ? [] : null)}
                        disabled={disabled || readonly}
                        size="small"
                      >
                        <ClearIcon />
                      </IconButton>
                    )}
                  </InputAdornment>
                )
              }}
            />
          </Box>
          
          {selectedNodes.length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selectedNodes.map((node, index) => (
                <Chip
                  key={`${node.id}_${index}`}
                  label={node.name}
                  size="small"
                  onDelete={
                    disabled || readonly ? undefined : () => {
                      if (isMultiSelect) {
                        const newValue = selectedNodes.filter((_, i) => i !== index);
                        onChange(newValue.length > 0 ? newValue : []);
                      } else {
                        onChange(null);
                      }
                    }
                  }
                  color={node.categoryType === 'geographical' ? 'primary' : 'default'}
                />
              ))}
            </Box>
          )}
          
          {(error || field.description) && (
            <FormHelperText>{error || field.description}</FormHelperText>
          )}
        </FormControl>

        {/* Search Dialog */}
        <Dialog 
          open={searchDialogOpen} 
          onClose={() => setSearchDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            انتخاب {field.name}
          </DialogTitle>
          <DialogContent>
            <NodeSearchComponent
              categoryTypes={[getCategoryType()]}
              placeholder={`جستجو در ${field.name}...`}
              multiSelect={isMultiSelect}
              selectedNodes={selectedNodes}
              onSelectionChange={(nodes) => {
                if (isMultiSelect) {
                  onChange(nodes);
                } else {
                  onChange(nodes[0] || null);
                }
              }}
              enableFilters={true}
              enableAdvancedFilters={field.fieldConfig.dataSource?.configuration.filterable}
              showPath={isHierarchical}
              showCoordinates={getCategoryType() === CategoryType.GEOGRAPHICAL}
              showLevel={true}
              enableFavorites={true}
              enableRecent={true}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSearchDialogOpen(false)}>
              لغو
            </Button>
            <Button 
              onClick={() => setSearchDialogOpen(false)} 
              variant="contained"
              disabled={!isMultiSelect && selectedNodes.length === 0}
            >
              تأیید
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };

  return (
    <Box sx={{ mb: 2 }}>
      {renderBaseField()}
    </Box>
  );
};

export default BaseFieldRenderer;