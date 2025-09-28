import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { DragIndicator as DragIcon } from '@mui/icons-material';
import { useDragDrop, DragItem } from './DragDropContext';

interface DraggableFieldProps {
  id: string;
  index: number;
  data: any;
  children: React.ReactNode;
  disabled?: boolean;
  onDragStart?: (item: DragItem) => void;
  onDragEnd?: () => void;
}

export const DraggableField: React.FC<DraggableFieldProps> = ({
  id,
  index,
  data,
  children,
  disabled = false,
  onDragStart,
  onDragEnd
}) => {
  const { state, startDrag, endDrag } = useDragDrop();
  const dragRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;

    const startX = e.clientX;
    const startY = e.clientY;
    let hasMoved = false;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = Math.abs(e.clientX - startX);
      const deltaY = Math.abs(e.clientY - startY);
      
      if (deltaX > 5 || deltaY > 5) {
        hasMoved = true;
        
        if (!state.isDragging) {
          const dragItem: DragItem = {
            id,
            type: 'field',
            index,
            data
          };

          // Create drag preview
          const preview = (
            <Paper
              elevation={8}
              sx={{
                p: 2,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(25, 118, 210, 0.5)',
                borderRadius: 2,
                transform: 'rotate(2deg)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                minWidth: 200,
                maxWidth: 300
              }}
            >
              <Typography variant="subtitle2" noWrap>
                {data.name || `Field ${id}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {data.type || 'Unknown Type'}
              </Typography>
            </Paper>
          );

          startDrag(dragItem, preview);
          onDragStart?.(dragItem);
        }

        setDragPosition({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      if (state.isDragging) {
        endDrag();
        onDragEnd?.();
      }
      setDragPosition(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [disabled, state.isDragging, startDrag, endDrag, id, index, data, onDragStart, onDragEnd]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    // Drop handling is managed by the context
  }, []);

  const isDragging = state.isDragging && state.dragItem?.id === id;
  const isValidDropTarget = state.isDragging && state.dragItem?.id !== id;

  return (
    <Box
      ref={dragRef}
      sx={{
        position: 'relative',
        transition: 'all 0.2s ease',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'scale(0.95)' : 'scale(1)',
        cursor: disabled ? 'default' : 'grab',
        '&:active': {
          cursor: disabled ? 'default' : 'grabbing'
        }
      }}
      onMouseDown={handleMouseDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Handle */}
      {!disabled && (
        <Box
          sx={{
            position: 'absolute',
            left: -8,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            color: 'text.secondary',
            opacity: 0.6,
            '&:hover': {
              opacity: 1,
              color: 'primary.main'
            },
            transition: 'all 0.2s ease'
          }}
        >
          <DragIcon />
        </Box>
      )}

      {/* Drop Zone Indicator */}
      {isValidDropTarget && (
        <>
          {/* Top drop zone */}
          <Box
            sx={{
              position: 'absolute',
              top: -2,
              left: 0,
              right: 0,
              height: 4,
              background: isDragOver ? 'primary.main' : 'transparent',
              borderRadius: 2,
              transition: 'all 0.2s ease',
              zIndex: 20
            }}
          />
          
          {/* Bottom drop zone */}
          <Box
            sx={{
              position: 'absolute',
              bottom: -2,
              left: 0,
              right: 0,
              height: 4,
              background: isDragOver ? 'primary.main' : 'transparent',
              borderRadius: 2,
              transition: 'all 0.2s ease',
              zIndex: 20
            }}
          />
        </>
      )}

      {/* Content */}
      <Box
        sx={{
          border: isDragOver && isValidDropTarget ? '2px dashed rgba(25, 118, 210, 0.5)' : 'none',
          borderRadius: 1,
          transition: 'all 0.2s ease'
        }}
      >
        {children}
      </Box>

      {/* Drag Preview Portal */}
      {isDragging && dragPosition && state.dragPreview && (
        <Box
          sx={{
            position: 'fixed',
            left: dragPosition.x + 10,
            top: dragPosition.y + 10,
            zIndex: 9999,
            pointerEvents: 'none'
          }}
        >
          {state.dragPreview}
        </Box>
      )}
    </Box>
  );
};