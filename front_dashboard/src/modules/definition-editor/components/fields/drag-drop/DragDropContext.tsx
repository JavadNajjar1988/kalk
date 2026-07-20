import React, { createContext, useContext, useState, useCallback } from 'react';

export interface DragItem {
  id: string;
  type: 'field' | 'group' | 'section';
  index: number;
  data: any;
}

export interface DropTarget {
  id: string;
  type: 'field' | 'group' | 'section' | 'container';
  accepts: string[];
  position?: 'before' | 'after' | 'inside';
}

export interface DragDropState {
  isDragging: boolean;
  dragItem: DragItem | null;
  dropTarget: DropTarget | null;
  dragPreview: React.ReactNode | null;
}

interface DragDropContextValue {
  state: DragDropState;
  startDrag: (item: DragItem, preview?: React.ReactNode) => void;
  endDrag: () => void;
  setDropTarget: (target: DropTarget | null) => void;
  onDrop: (sourceItem: DragItem, targetItem: DropTarget) => void;
  registerDropHandler: (handler: (source: DragItem, target: DropTarget) => boolean) => void;
}

const DragDropContext = createContext<DragDropContextValue | null>(null);

export const useDragDrop = () => {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
};

interface DragDropProviderProps {
  children: React.ReactNode;
  onFieldReorder?: (sourceIndex: number, targetIndex: number) => void;
  onFieldMove?: (fieldId: string, targetContainerId: string, position: number) => void;
}

export const DragDropProvider: React.FC<DragDropProviderProps> = ({
  children,
  onFieldReorder,
  onFieldMove
}) => {
  const [state, setState] = useState<DragDropState>({
    isDragging: false,
    dragItem: null,
    dropTarget: null,
    dragPreview: null
  });

  const [dropHandlers, setDropHandlers] = useState<Array<(source: DragItem, target: DropTarget) => boolean>>([]);

  const startDrag = useCallback((item: DragItem, preview?: React.ReactNode) => {
    setState({
      isDragging: true,
      dragItem: item,
      dropTarget: null,
      dragPreview: preview || null
    });
  }, []);

  const endDrag = useCallback(() => {
    setState({
      isDragging: false,
      dragItem: null,
      dropTarget: null,
      dragPreview: null
    });
  }, []);

  const setDropTarget = useCallback((target: DropTarget | null) => {
    setState(prev => ({
      ...prev,
      dropTarget: target
    }));
  }, []);

  const onDrop = useCallback((sourceItem: DragItem, targetItem: DropTarget) => {
    // Try custom handlers first
    for (const handler of dropHandlers) {
      if (handler(sourceItem, targetItem)) {
        return; // Handler processed the drop
      }
    }

    // Default handling for field reordering
    if (sourceItem.type === 'field' && targetItem.type === 'field') {
      if (onFieldReorder) {
        onFieldReorder(sourceItem.index, parseInt(targetItem.id));
      }
    }

    // Default handling for field moving
    if (sourceItem.type === 'field' && targetItem.type === 'container') {
      if (onFieldMove) {
        onFieldMove(sourceItem.id, targetItem.id, 0);
      }
    }
  }, [dropHandlers, onFieldReorder, onFieldMove]);

  const registerDropHandler = useCallback((handler: (source: DragItem, target: DropTarget) => boolean) => {
    setDropHandlers(prev => [...prev, handler]);
  }, []);

  const value: DragDropContextValue = {
    state,
    startDrag,
    endDrag,
    setDropTarget,
    onDrop,
    registerDropHandler
  };

  return (
    <DragDropContext.Provider value={value}>
      {children}
    </DragDropContext.Provider>
  );
};