// Virtualized Field List for Performance Optimization
// لیست مجازی فیلد برای بهینه‌سازی عملکرد

import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  useTheme,
  alpha
} from '@mui/material';

import type { FieldConstructorConfig } from '../../types/fieldConstructor';
import type { CustomField } from '../../types/equipment';
import { UniversalFieldAdapter } from '../../utils/universalFieldAdapter';

interface VirtualizedFieldListProps {
  fields: (FieldConstructorConfig | CustomField)[];
  onFieldChange: (fieldId: string, value: any) => void;
  values: Record<string, any>;
  errors: Record<string, string>;
  itemHeight?: number;
  height?: number;
  overscanCount?: number;
  renderField?: (field: FieldConstructorConfig | CustomField, context: any) => React.ReactElement;
}

interface FieldItemProps extends ListChildComponentProps {
  data: {
    fields: (FieldConstructorConfig | CustomField)[];
    onFieldChange: (fieldId: string, value: any) => void;
    values: Record<string, any>;
    errors: Record<string, string>;
    renderField?: (field: FieldConstructorConfig | CustomField, context: any) => React.ReactElement;
  };
}

// Memoized field item component
const FieldItem: React.FC<FieldItemProps> = React.memo(({ index, style, data }) => {
  const { fields, onFieldChange, values, errors, renderField } = data;
  const field = fields[index];
  const theme = useTheme();

  const fieldValue = values[field.id];
  const fieldError = errors[field.id];

  const handleChange = useCallback((value: any) => {
    onFieldChange(field.id, value);
  }, [field.id, onFieldChange]);

  const renderFieldContent = useCallback(() => {
    if (renderField) {
      return renderField(field, {
        value: fieldValue,
        onChange: handleChange,
        error: fieldError,
        disabled: false
      });
    }

    // Use UniversalFieldAdapter for rendering
    try {
      const renderedField = UniversalFieldAdapter.renderField(field as any, {
        value: fieldValue,
        onChange: handleChange,
        error: fieldError,
        disabled: false,
        variant: 'outlined',
        size: 'medium',
        mode: 'edit'
      });

      if (renderedField) {
        return renderedField;
      }
    } catch (error) {
      console.warn(`Failed to render field ${field.id}:`, error);
    }

    // Fallback to simple display
    return (
      <Alert severity="warning" sx={{ m: 1 }}>
        Field "{field.name}" (type: {(field as any).type}) needs manual rendering
      </Alert>
    );
  }, [field, fieldValue, handleChange, fieldError, renderField]);

  return (
    <div style={style}>
      <Paper
        elevation={1}
        sx={{
          m: 1,
          p: 2,
          height: 'calc(100% - 16px)', // Account for margin
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: fieldError 
            ? alpha(theme.palette.error.main, 0.05)
            : 'background.paper',
          border: fieldError 
            ? `1px solid ${alpha(theme.palette.error.main, 0.3)}`
            : 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            elevation: 2,
            backgroundColor: alpha(theme.palette.primary.main, 0.02)
          }
        }}
      >
        <Box sx={{ mb: 1 }}>
          <Typography 
            variant="subtitle2" 
            color={fieldError ? 'error' : 'text.primary'}
            sx={{ fontWeight: 600 }}
          >
            {field.name}
            {(field as any).isRequired && (
              <Typography component="span" color="error" sx={{ ml: 0.5 }}>
                *
              </Typography>
            )}
          </Typography>
          {(field as any).description && (
            <Typography variant="caption" color="text.secondary" display="block">
              {(field as any).description}
            </Typography>
          )}
        </Box>
        
        <Box sx={{ flex: 1, minHeight: 0 }}>
          {renderFieldContent()}
        </Box>
        
        {fieldError && (
          <Typography variant="caption" color="error" sx={{ mt: 1 }}>
            {fieldError}
          </Typography>
        )}
      </Paper>
    </div>
  );
});

FieldItem.displayName = 'FieldItem';

const VirtualizedFieldList: React.FC<VirtualizedFieldListProps> = ({
  fields,
  onFieldChange,
  values,
  errors,
  itemHeight = 120,
  height = 600,
  overscanCount = 5,
  renderField
}) => {
  const listRef = useRef<List>(null);
  const theme = useTheme();

  // Memoize the data object to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    fields,
    onFieldChange,
    values,
    errors,
    renderField
  }), [fields, onFieldChange, values, errors, renderField]);

  // Scroll to field with error
  const scrollToError = useCallback(() => {
    const errorFieldIndex = fields.findIndex(field => errors[field.id]);
    if (errorFieldIndex >= 0 && listRef.current) {
      listRef.current.scrollToItem(errorFieldIndex, 'smart');
    }
  }, [fields, errors]);

  // Auto-scroll to first error when errors change
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const timer = setTimeout(scrollToError, 100);
      return () => clearTimeout(timer);
    }
  }, [errors, scrollToError]);

  if (fields.length === 0) {
    return (
      <Paper 
        sx={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: alpha(theme.palette.info.main, 0.05)
        }}
      >
        <Typography variant="h6" color="text.secondary">
          No fields to display
        </Typography>
      </Paper>
    );
  }

  return (
    <Box 
      sx={{ 
        height,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        overflow: 'hidden'
      }}
    >
      <List
        ref={listRef}
        height={height}
        itemCount={fields.length}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={overscanCount}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: `${alpha(theme.palette.primary.main, 0.3)} transparent`
        }}
      >
        {FieldItem}
      </List>
    </Box>
  );
};

export default VirtualizedFieldList;