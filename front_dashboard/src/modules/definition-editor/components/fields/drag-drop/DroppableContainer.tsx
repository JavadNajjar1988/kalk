import React, { useCallback, useState } from 'react';
import { Box, Typography, Fade } from '@mui/material';
import { useDragDrop, DropTarget } from './DragDropContext';

interface DroppableContainerProps {
  id: string;
  type?: 'container' | 'section' | 'group';
  accepts?: string[];
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  onDrop?: (sourceId: string, targetId: string, position?: string) => void;
  disabled?: boolean;
  className?: string;
}

export const DroppableContainer: React.FC<DroppableContainerProps> = ({
  id,
  type = 'container',
  accepts = ['field'],
  children,
  placeholder,
  onDrop,
  disabled = false,
  className
}) => {
  const { state, setDropTarget, onDrop: contextOnDrop } = useDragDrop();
  const [isOver, setIsOver] = useState(false);
  const [dropPosition, setDropPosition] = useState<'top' | 'bottom' | 'center'>('center');

  const isValidDrop = useCallback(() => {
    if (!state.dragItem || disabled) return false;
    return accepts.includes(state.dragItem.type);
  }, [state.dragItem, disabled, accepts]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isValidDrop()) {
      setIsOver(true);
      const dropTarget: DropTarget = {
        id,
        type,
        accepts,
        position: 'inside'
      };
      setDropTarget(dropTarget);
    }
  }, [isValidDrop, id, type, accepts, setDropTarget]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isValidDrop()) {
      // Determine drop position based on mouse position
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const y = e.clientY - rect.top;
      const height = rect.height;
      
      let position: 'top' | 'bottom' | 'center' = 'center';
      if (y < height * 0.25) {
        position = 'top';
      } else if (y > height * 0.75) {
        position = 'bottom';
      }
      
      setDropPosition(position);
    }
  }, [isValidDrop]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only hide drop indicator if we're leaving the container entirely
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsOver(false);
      setDropTarget(null);
    }
  }, [setDropTarget]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isValidDrop() && state.dragItem) {
      const dropTarget: DropTarget = {
        id,
        type,
        accepts,
        position: dropPosition === 'center' ? 'inside' : dropPosition === 'top' ? 'before' : 'after'
      };
      
      contextOnDrop(state.dragItem, dropTarget);
      onDrop?.(state.dragItem.id, id, dropTarget.position);
    }
    
    setIsOver(false);
    setDropTarget(null);
  }, [isValidDrop, state.dragItem, id, type, accepts, dropPosition, contextOnDrop, onDrop, setDropTarget]);

  const isDragging = state.isDragging && isValidDrop();
  const hasChildren = React.Children.count(children) > 0;

  return (
    <Box
      className={className}
      sx={{
        position: 'relative',
        minHeight: hasChildren ? 'auto' : 120,
        transition: 'all 0.3s ease',
        borderRadius: 2,
        ...(isDragging && {
          background: isOver 
            ? 'rgba(25, 118, 210, 0.08)' 
            : 'rgba(25, 118, 210, 0.04)',
          border: isOver 
            ? '2px solid rgba(25, 118, 210, 0.3)' 
            : '2px dashed rgba(25, 118, 210, 0.2)'
        })
      }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop Position Indicators */}
      {isDragging && isOver && (
        <>
          {/* Top drop line */}
          <Fade in={dropPosition === 'top'}>
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
                borderRadius: '2px 2px 0 0',
                zIndex: 1000,
                boxShadow: '0 0 10px rgba(25, 118, 210, 0.5)'
              }}
            />
          </Fade>
          
          {/* Bottom drop line */}
          <Fade in={dropPosition === 'bottom'}>
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 3,
                background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
                borderRadius: '0 0 2px 2px',
                zIndex: 1000,
                boxShadow: '0 0 10px rgba(25, 118, 210, 0.5)'
              }}
            />
          </Fade>
          
          {/* Center drop overlay */}
          <Fade in={dropPosition === 'center'}>
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                right: 8,
                bottom: 8,
                border: '2px dashed rgba(25, 118, 210, 0.6)',
                borderRadius: 2,
                background: 'rgba(25, 118, 210, 0.05)',
                zIndex: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: 'primary.main',
                  fontWeight: 600,
                  textAlign: 'center',
                  px: 2,
                  py: 1,
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: 1
                }}
              >
                Drop here to add field
              </Typography>
            </Box>
          </Fade>
        </>
      )}

      {/* Empty state placeholder */}
      {!hasChildren && !isDragging && placeholder && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: 120,
            color: 'text.secondary',
            textAlign: 'center'
          }}
        >
          {placeholder}
        </Box>
      )}

      {/* Content */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {children}
      </Box>

      {/* Drop feedback overlay */}
      {isDragging && isOver && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(25, 118, 210, 0.1)',
            borderRadius: 2,
            zIndex: 998,
            pointerEvents: 'none'
          }}
        />
      )}
    </Box>
  );
};