import { useState, useCallback, useRef } from 'react';

export interface DragDropItem {
  id: string;
  type: string;
  data: any;
  index: number;
}

export interface DropZone {
  id: string;
  type: string;
  accepts: string[];
  data?: any;
}

export interface DragDropState {
  isDragging: boolean;
  dragItem: DragDropItem | null;
  dropZone: DropZone | null;
  dragOffset: { x: number; y: number } | null;
}

export interface UseDragDropOptions {
  onDragStart?: (item: DragDropItem) => void;
  onDragEnd?: (item: DragDropItem | null) => void;
  onDrop?: (item: DragDropItem, zone: DropZone) => boolean;
  enableKeyboard?: boolean;
  enableTouch?: boolean;
}

export interface UseDragDropReturn {
  // State
  dragState: DragDropState;
  
  // Drag methods
  startDrag: (item: DragDropItem, offset?: { x: number; y: number }) => void;
  endDrag: () => void;
  updateDragPosition: (x: number, y: number) => void;
  
  // Drop methods
  enterDropZone: (zone: DropZone) => void;
  leaveDropZone: () => void;
  drop: () => boolean;
  
  // Utility methods
  canDrop: (item: DragDropItem, zone: DropZone) => boolean;
  isValidDropTarget: (zoneId: string) => boolean;
  getDragPreview: () => React.ReactNode | null;
  
  // Keyboard support
  handleKeyDown: (e: React.KeyboardEvent) => void;
  setFocusedItem: (itemId: string | null) => void;
  focusedItem: string | null;
}

export const useDragDrop = (options: UseDragDropOptions = {}): UseDragDropReturn => {
  const {
    onDragStart,
    onDragEnd,
    onDrop,
    enableKeyboard = true,
    enableTouch = false
  } = options;

  const [dragState, setDragState] = useState<DragDropState>({
    isDragging: false,
    dragItem: null,
    dropZone: null,
    dragOffset: null
  });

  const [focusedItem, setFocusedItem] = useState<string | null>(null);
  const dragPreviewRef = useRef<React.ReactNode | null>(null);

  const startDrag = useCallback((item: DragDropItem, offset?: { x: number; y: number }) => {
    setDragState({
      isDragging: true,
      dragItem: item,
      dropZone: null,
      dragOffset: offset || null
    });
    onDragStart?.(item);
  }, [onDragStart]);

  const endDrag = useCallback(() => {
    const currentItem = dragState.dragItem;
    setDragState({
      isDragging: false,
      dragItem: null,
      dropZone: null,
      dragOffset: null
    });
    dragPreviewRef.current = null;
    onDragEnd?.(currentItem);
  }, [dragState.dragItem, onDragEnd]);

  const updateDragPosition = useCallback((x: number, y: number) => {
    setDragState(prev => ({
      ...prev,
      dragOffset: { x, y }
    }));
  }, []);

  const enterDropZone = useCallback((zone: DropZone) => {
    if (dragState.isDragging && dragState.dragItem) {
      const canDropHere = canDrop(dragState.dragItem, zone);
      if (canDropHere) {
        setDragState(prev => ({
          ...prev,
          dropZone: zone
        }));
      }
    }
  }, [dragState.isDragging, dragState.dragItem]);

  const leaveDropZone = useCallback(() => {
    setDragState(prev => ({
      ...prev,
      dropZone: null
    }));
  }, []);

  const drop = useCallback((): boolean => {
    if (dragState.isDragging && dragState.dragItem && dragState.dropZone) {
      const success = onDrop?.(dragState.dragItem, dragState.dropZone) ?? true;
      endDrag();
      return success;
    }
    endDrag();
    return false;
  }, [dragState.isDragging, dragState.dragItem, dragState.dropZone, onDrop, endDrag]);

  const canDrop = useCallback((item: DragDropItem, zone: DropZone): boolean => {
    // Check if the zone accepts this item type
    if (!zone.accepts.includes(item.type)) {
      return false;
    }

    // Don't allow dropping on self
    if (item.id === zone.id) {
      return false;
    }

    return true;
  }, []);

  const isValidDropTarget = useCallback((zoneId: string): boolean => {
    if (!dragState.isDragging || !dragState.dragItem) {
      return false;
    }

    return dragState.dropZone?.id === zoneId;
  }, [dragState.isDragging, dragState.dragItem, dragState.dropZone]);

  const getDragPreview = useCallback((): React.ReactNode | null => {
    return dragPreviewRef.current;
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!enableKeyboard || !focusedItem) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        // Start keyboard drag mode
        if (!dragState.isDragging && focusedItem) {
          // Find the item to start dragging
          // This would need to be implemented based on your data structure
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        if (dragState.isDragging) {
          endDrag();
        }
        break;
      
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        if (dragState.isDragging) {
          e.preventDefault();
          // Handle keyboard navigation during drag
          // This would need to be implemented based on your layout
        }
        break;
    }
  }, [enableKeyboard, focusedItem, dragState.isDragging, endDrag]);

  return {
    dragState,
    startDrag,
    endDrag,
    updateDragPosition,
    enterDropZone,
    leaveDropZone,
    drop,
    canDrop,
    isValidDropTarget,
    getDragPreview,
    handleKeyDown,
    setFocusedItem,
    focusedItem
  };
};

export default useDragDrop;