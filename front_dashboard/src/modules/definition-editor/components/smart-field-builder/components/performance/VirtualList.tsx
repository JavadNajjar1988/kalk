import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Skeleton,
  useTheme,
  alpha
} from '@mui/material';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  itemsPerRow?: number;
  gap?: number;
  overscan?: number;
}

const VirtualList = <T,>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  itemsPerRow = 1,
  gap = 16,
  overscan = 5
}: VirtualListProps<T>) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  
  // Calculate visible range
  const visibleRange = useMemo(() => {
    const rowHeight = itemHeight + gap;
    const totalRows = Math.ceil(items.length / itemsPerRow);
    
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endRow = Math.min(
      totalRows - 1,
      Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
    );
    
    const startIndex = startRow * itemsPerRow;
    const endIndex = Math.min(items.length - 1, (endRow + 1) * itemsPerRow - 1);
    
    return { startIndex, endIndex, startRow, endRow, totalRows };
  }, [scrollTop, containerHeight, itemHeight, gap, overscan, items.length, itemsPerRow]);
  
  // Handle scroll
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);
  
  // Calculate total height
  const totalHeight = Math.ceil(items.length / itemsPerRow) * (itemHeight + gap) - gap;
  
  // Get visible items
  const visibleItems = items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  
  // Calculate offset for visible items
  const offsetY = visibleRange.startRow * (itemHeight + gap);
  
  return (
    <Box
      ref={containerRef}
      onScroll={handleScroll}
      sx={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative'
      }}
    >
      {/* Total height placeholder */}
      <Box sx={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <Box
          sx={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0
          }}
        >
          <Grid container spacing={gap / 8}>
            {visibleItems.map((item, index) => {
              const actualIndex = visibleRange.startIndex + index;
              const row = Math.floor(actualIndex / itemsPerRow);
              const col = actualIndex % itemsPerRow;
              
              return (
                <Grid item xs={12 / itemsPerRow} key={actualIndex}>
                  <Box sx={{ height: itemHeight }}>
                    {renderItem(item, actualIndex)}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

// Virtual template list specifically for Smart Field Builder
interface VirtualTemplateListProps {
  templates: any[];
  onTemplateSelect: (template: any) => void;
  loading?: boolean;
  containerHeight?: number;
}

const VirtualTemplateList: React.FC<VirtualTemplateListProps> = ({
  templates,
  onTemplateSelect,
  loading = false,
  containerHeight = 400
}) => {
  const theme = useTheme();
  
  const renderTemplate = useCallback((template: any, index: number) => {
    if (loading) {
      return (
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ p: 2 }}>
            <Skeleton variant="text" width="80%" height={24} />
            <Skeleton variant="text" width="60%" height={20} sx={{ mt: 1 }} />
            <Skeleton variant="rectangular" width="100%" height={60} sx={{ mt: 2 }} />
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card
        sx={{
          height: '100%',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[8],
            borderColor: theme.palette.primary.main
          }
        }}
        onClick={() => onTemplateSelect(template)}
      >
        <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Template Icon */}
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              backgroundColor: alpha(template.color || theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              fontSize: '1.5rem'
            }}
          >
            {template.icon || '📄'}
          </Box>
          
          {/* Template Info */}
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            {template.name}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {template.description}
          </Typography>
          
          {/* Template Meta */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {template.fields?.length || 0} فیلد
            </Typography>
            {template.complexity && (
              <Typography 
                variant="caption" 
                sx={{ 
                  px: 1, 
                  py: 0.5, 
                  backgroundColor: alpha(theme.palette.info.main, 0.1),
                  borderRadius: 1,
                  color: 'info.main'
                }}
              >
                {template.complexity === 'simple' ? 'ساده' : 
                 template.complexity === 'intermediate' ? 'متوسط' : 'پیشرفته'}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }, [loading, onTemplateSelect, theme]);
  
  if (loading) {
    // Show skeleton loading for performance
    const skeletonItems = Array.from({ length: 12 }, (_, index) => ({
      id: `skeleton-${index}`,
      name: '',
      description: ''
    }));
    
    return (
      <VirtualList
        items={skeletonItems}
        itemHeight={180}
        containerHeight={containerHeight}
        renderItem={renderTemplate}
        itemsPerRow={3}
        gap={16}
      />
    );
  }
  
  return (
    <VirtualList
      items={templates}
      itemHeight={180}
      containerHeight={containerHeight}
      renderItem={renderTemplate}
      itemsPerRow={3}
      gap={16}
      overscan={3}
    />
  );
};

export default VirtualList;
export { VirtualTemplateList };