/**
 * Virtual List Component for Smart Field Builder
 * Optimizes rendering of large lists by only rendering visible items
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, Typography, alpha, useTheme } from '@mui/material';

// Cache for calculated ranges to improve performance
const rangeCache = new Map<string, { startIndex: number; endIndex: number; visibleItems: number }>();

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((index: number) => number);
  containerHeight: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  scrollToIndex?: number;
  estimatedItemSize?: number;
}

interface ListState {
  scrollTop: number;
  startIndex: number;
  endIndex: number;
  visibleItems: number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  keyExtractor,
  overscan = 3,
  className,
  onScroll,
  scrollToIndex,
  estimatedItemSize = 50
}: VirtualListProps<T>) {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [listState, setListState] = useState<ListState>({
    scrollTop: 0,
    startIndex: 0,
    endIndex: 0,
    visibleItems: 0
  });

  // Calculate item height for dynamic heights
  const getItemHeight = useCallback((index: number): number => {
    if (typeof itemHeight === 'function') {
      return itemHeight(index);
    }
    return itemHeight;
  }, [itemHeight]);

  // Calculate total height
  const totalHeight = useMemo(() => {
    if (typeof itemHeight === 'number') {
      return items.length * itemHeight;
    }
    
    // For dynamic heights, estimate total height
    return items.length * estimatedItemSize;
  }, [items.length, itemHeight, estimatedItemSize]);

  // Enhanced visible range calculation with better performance
  const calculateVisibleRange = useCallback(() => {
    const { scrollTop } = listState;
    
    if (typeof itemHeight === 'number') {
      // Fixed height calculation - optimized
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
      const endIndex = Math.min(items.length - 1, startIndex + visibleCount);
      
      return { startIndex, endIndex, visibleItems: endIndex - startIndex + 1 };
    } else {
      // Dynamic height calculation - cached for performance
      const cacheKey = `visible_range_${scrollTop}_${containerHeight}`;
      
      // Simple cache for calculated ranges
      if (rangeCache.has(cacheKey)) {
        return rangeCache.get(cacheKey)!;
      }
      
      let currentHeight = 0;
      let startIndex = 0;
      let endIndex = 0;
      
      // Find start index efficiently
      for (let i = 0; i < items.length; i++) {
        const height = getItemHeight(i);
        if (currentHeight + height > scrollTop) {
          startIndex = Math.max(0, i - overscan);
          break;
        }
        currentHeight += height;
      }
      
      // Find end index efficiently
      currentHeight = 0;
      const targetHeight = containerHeight + overscan * estimatedItemSize;
      for (let i = startIndex; i < items.length; i++) {
        currentHeight += getItemHeight(i);
        if (currentHeight > targetHeight) {
          endIndex = Math.min(items.length - 1, i + overscan);
          break;
        }
      }
      
      if (endIndex === 0) endIndex = items.length - 1;
      
      const result = { startIndex, endIndex, visibleItems: endIndex - startIndex + 1 };
      
      // Cache the result
      rangeCache.set(cacheKey, result);
      if (rangeCache.size > 100) {
        rangeCache.clear(); // Prevent memory leak
      }
      
      return result;
    }
  }, [listState.scrollTop, containerHeight, items.length, overscan, estimatedItemSize, getItemHeight, itemHeight]);

  // Optimized scroll handling with throttling
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    
    // Update state with new visible range
    setListState(prev => {
      if (Math.abs(prev.scrollTop - scrollTop) < 5) {
        return prev; // Skip minor scroll changes
      }
      
      const newRange = calculateVisibleRange();
      return {
        ...prev,
        scrollTop,
        ...newRange
      };
    });
    
    onScroll?.(scrollTop);
  }, [calculateVisibleRange, onScroll]);

  // Scroll to specific index
  useEffect(() => {
    if (scrollToIndex !== undefined && containerRef.current) {
      let targetScrollTop = 0;
      
      if (typeof itemHeight === 'number') {
        targetScrollTop = scrollToIndex * itemHeight;
      } else {
        for (let i = 0; i < scrollToIndex; i++) {
          targetScrollTop += getItemHeight(i);
        }
      }
      
      containerRef.current.scrollTop = targetScrollTop;
    }
  }, [scrollToIndex, getItemHeight, itemHeight]);

  // Calculate offset for visible items
  const getItemOffset = useCallback((index: number): number => {
    if (typeof itemHeight === 'number') {
      return index * itemHeight;
    }
    
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += getItemHeight(i);
    }
    return offset;
  }, [itemHeight, getItemHeight]);

  // Render visible items
  const visibleItems = useMemo(() => {
    const result: React.ReactNode[] = [];
    
    for (let i = calculateVisibleRange.startIndex; i <= calculateVisibleRange.endIndex; i++) {
      if (i >= items.length) break;
      
      const item = items[i];
      const key = keyExtractor(item, i);
      const offset = getItemOffset(i);
      const height = getItemHeight(i);
      
      const style: React.CSSProperties = {
        position: 'absolute',
        top: offset,
        left: 0,
        right: 0,
        height,
        display: 'flex',
        alignItems: 'center'
      };
      
      result.push(
        <div key={key} style={style}>
          {renderItem(item, i, style)}
        </div>
      );
    }
    
    return result;
  }, [
    calculateVisibleRange.startIndex,
    calculateVisibleRange.endIndex,
    items,
    keyExtractor,
    getItemOffset,
    getItemHeight,
    renderItem
  ]);

  // Memoize the current visible range
  const currentVisibleRange = useMemo(() => calculateVisibleRange(), [calculateVisibleRange]);

  // Update list state when visible range changes
  useEffect(() => {
    setListState(prev => ({
      ...prev,
      ...currentVisibleRange
    }));
  }, [currentVisibleRange]);

  return (
    <Box
      ref={containerRef}
      className={className}
      onScroll={handleScroll}
      sx={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        borderRadius: 1,
        
        // Custom scrollbar
        '&::-webkit-scrollbar': {
          width: 6
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: alpha(theme.palette.grey[300], 0.3),
          borderRadius: 3
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: alpha(theme.palette.grey[600], 0.6),
          borderRadius: 3,
          '&:hover': {
            backgroundColor: alpha(theme.palette.grey[600], 0.8)
          }
        }
      }}
    >
      {/* Total height spacer */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems}
      </div>
      
      {/* Loading indicator when scrolling fast */}
      {listState.visibleItems === 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1
          }}
        >
          <Typography variant="body2" color="text.secondary">
            در حال بارگذاری...
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// Specialized virtual list for templates
interface VirtualTemplateListProps {
  templates: any[];
  selectedTemplateId?: string;
  onTemplateSelect: (template: any) => void;
  height: number;
  searchQuery?: string;
}

export const VirtualTemplateList: React.FC<VirtualTemplateListProps> = ({
  templates,
  selectedTemplateId,
  onTemplateSelect,
  height,
  searchQuery = ''
}) => {
  const theme = useTheme();
  
  // Filter templates based on search - simplified
  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates;
    
    const query = searchQuery.toLowerCase();
    return templates.filter(template => 
      template.name?.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query) ||
      template.category?.toLowerCase().includes(query)
    );
  }, [templates, searchQuery]);
  
  const renderTemplateItem = useCallback((
    template: any,
    index: number,
    style: React.CSSProperties
  ) => {
    const isSelected = template.id === selectedTemplateId;
    
    return (
      <Box
        onClick={() => onTemplateSelect(template)}
        sx={{
          ...style,
          p: 2,
          cursor: 'pointer',
          backgroundColor: isSelected 
            ? alpha(theme.palette.primary.main, 0.08)
            : 'transparent',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          transition: 'all 0.2s ease',
          
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.04),
            transform: 'translateX(4px)'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem'
            }}
          >
            {typeof template.icon === 'string' ? template.icon : '📋'}
          </Box>
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: isSelected ? 600 : 500,
                color: isSelected ? theme.palette.primary.main : 'text.primary',
                mb: 0.5
              }}
            >
              {template.name}
            </Typography>
            
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {template.description}
            </Typography>
          </Box>
          
          {template.category && (
            <Box
              sx={{
                px: 1,
                py: 0.5,
                borderRadius: 0.5,
                backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                fontSize: '0.75rem',
                color: theme.palette.secondary.main
              }}
            >
              {template.category}
            </Box>
          )}
        </Box>
      </Box>
    );
  }, [selectedTemplateId, onTemplateSelect, theme]);
  
  return (
    <VirtualList
      items={filteredTemplates}
      itemHeight={80}
      containerHeight={height}
      renderItem={renderTemplateItem}
      keyExtractor={(template, index) => template.id || index}
      overscan={2}
    />
  );
};

export default VirtualList;