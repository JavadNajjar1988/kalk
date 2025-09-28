import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Chip,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useReferenceFieldOptions } from '@/hooks/useDefinitionData';
import type { FieldDefinition } from '@/hooks/useDefinitionData';

interface ReferenceFieldRendererProps {
  field: FieldDefinition;
  value: any;
  onChange: (fieldId: string, value: any) => void;
  error?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}

const ReferenceFieldRenderer: React.FC<ReferenceFieldRendererProps> = ({
  field,
  value,
  onChange,
  error,
  disabled = false,
  fullWidth = true,
}) => {
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { options, loading } = useReferenceFieldOptions(
    field.referenceCategory,
    field.referencePath
  );

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    setLastUpdated(new Date());
  }, [options]);

  const handleChange = (event: any) => {
    onChange(field.id, event.target.value);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const selectedOption = options.find(opt => opt.value === value);

  if (!field.referenceCategory) {
    return (
      <Alert severity="error" sx={{ borderRadius: 1 }}>
        تنظیمات فیلد مرجع ناقص است: دسته‌بندی مرجع مشخص نشده
      </Alert>
    );
  }

  return (
    <Box>
      <FormControl 
        fullWidth={fullWidth} 
        error={!!error} 
        required={field.isRequired}
        disabled={disabled || loading}
      >
        <InputLabel>{field.name}</InputLabel>
        <Select
          value={value || ''}
          onChange={handleChange}
          label={field.name}
          startAdornment={
            <Tooltip title="فیلد مرجع">
              <LinkIcon 
                sx={{ 
                  mr: 1, 
                  color: 'primary.main', 
                  fontSize: '1rem' 
                }} 
              />
            </Tooltip>
          }
          endAdornment={
            <Tooltip title="بروزرسانی داده‌های مرجع">
              <IconButton
                size="small"
                onClick={handleRefresh}
                disabled={loading}
                sx={{ mr: 1 }}
              >
                {loading ? (
                  <CircularProgress size={16} />
                ) : (
                  <RefreshIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          }
          renderValue={(selected) => {
            if (!selected) return '';
            const option = options.find(opt => opt.value === selected);
            return option ? option.label : selected;
          }}
        >
          <MenuItem value="">
            <em>بدون والد</em>
          </MenuItem>
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        
        {error && (
          <Typography 
            variant="caption" 
            color="error"
            sx={{ mt: 0.5, mx: 1.75 }}
          >
            {error}
          </Typography>
        )}
      </FormControl>

      {/* Reference Info */}
      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip 
          label={field.referenceCategory} 
          size="small" 
          variant="outlined"
          icon={<LinkIcon />}
        />
        
        {selectedOption && (
          <Chip 
            label={`انتخاب شده: ${selectedOption.label}`} 
            size="small" 
            color="primary"
            variant="filled"
          />
        )}
        
        <Typography variant="caption" color="text.secondary">
          آخرین بروزرسانی: {lastUpdated.toLocaleTimeString('fa-IR')}
        </Typography>
      </Box>

      {loading && (
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={16} />
          <Typography variant="caption" color="text.secondary">
            در حال بارگذاری داده‌های مرجع...
          </Typography>
        </Box>
      )}

      {options.length === 0 && !loading && (
        <Alert severity="warning" sx={{ mt: 1, borderRadius: 1 }}>
          هیچ داده‌ای در دسته‌بندی مرجع "{field.referenceCategory}" یافت نشد
        </Alert>
      )}
    </Box>
  );
};

export default ReferenceFieldRenderer;