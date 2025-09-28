import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Grid, Paper, Typography, Chip, IconButton } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';
import { getFieldTypeLabel } from '../utils/fieldTypeUtils';

interface VirtualizedFieldListProps {
  fields: ExtendedCustomFieldDefinition[];
  onEditField: (field: ExtendedCustomFieldDefinition) => void;
  onDeleteField: (fieldId: string) => void;
  itemHeight?: number;
  windowHeight?: number;
}

const VirtualizedFieldList: React.FC<VirtualizedFieldListProps> = ({
  fields,
  onEditField,
  onDeleteField,
  itemHeight = 120,
  windowHeight = 600,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
  const [containerHeight, setContainerHeight] = useState(windowHeight);

  // Calculate visible items based on scroll position
  const calculateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;
    
    const scrollTop = containerRef.current.scrollTop;
    const containerHeight = containerRef.current.clientHeight;
    
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      fields.length,
      start + Math.ceil(containerHeight / itemHeight) + 5 // Add buffer
    );
    
    setVisibleRange({ start, end });
  }, [fields.length, itemHeight]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    calculateVisibleRange();
  }, [calculateVisibleRange]);

  // Update container height on resize
  useEffect(() => {
    const updateContainerHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    
    updateContainerHeight();
    window.addEventListener('resize', updateContainerHeight);
    
    return () => {
      window.removeEventListener('resize', updateContainerHeight);
    };
  }, []);

  // Recalculate visible range when fields or container changes
  useEffect(() => {
    calculateVisibleRange();
  }, [fields, calculateVisibleRange]);

  // Calculate total height for scrollbar
  const totalHeight = fields.length * itemHeight;
  
  // Get visible fields
  const visibleFields = fields.slice(visibleRange.start, visibleRange.end);
  
  // Calculate padding for invisible items
  const topPadding = visibleRange.start * itemHeight;
  const bottomPadding = (fields.length - visibleRange.end) * itemHeight;

  if (fields.length === 0) {
    return null;
  }

  return (
    <Box
      ref={containerRef}
      onScroll={handleScroll}
      sx={{
        height: containerHeight,
        overflowY: 'auto',
        position: 'relative',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(0, 0, 0, 0.05)',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(74, 144, 226, 0.3)',
          borderRadius: '4px',
          '&:hover': {
            background: 'rgba(74, 144, 226, 0.5)',
          },
        },
      }}
    >
      <Box sx={{ height: totalHeight, position: 'relative' }}>
        <Box sx={{ position: 'absolute', top: topPadding, width: '100%' }}>
          <Grid container spacing={2}>
            {visibleFields.map((field) => (
              <Grid item xs={12} key={field.id}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: 1,
                    },
                    // Performance optimization: Use transform instead of changing layout properties
                    transform: 'translateZ(0)',
                    willChange: 'transform',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6">
                          {field.name}
                        </Typography>
                        <Chip
                          size="small"
                          label={getFieldTypeLabel(field.type)}
                          color="primary"
                          variant="outlined"
                        />
                        {field.isRequired && (
                          <Chip
                            size="small"
                            label="اجباری"
                            color="error"
                            variant="outlined"
                          />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        نام انگلیسی: {field.englishName}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => onEditField(field)}
                        color="primary"
                        aria-label={`ویرایش فیلد ${field.name}`}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => onDeleteField(field.id)}
                        color="error"
                        aria-label={`حذف فیلد ${field.name}`}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default VirtualizedFieldList;