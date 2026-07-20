import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Point, Line } from '../types';

export const useTacticalSymbolDesignerStore = defineStore('tacticalSymbolDesigner', () => {
  // State
  const points = ref<Point[]>([]);
  const lines = ref<Line[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Actions
  const setPoints = (newPoints: Point[]) => {
    try {
      // Validate points
      for (const point of newPoints) {
        if (typeof point.x !== 'number' || typeof point.y !== 'number') {
          throw new Error('Invalid point coordinates');
        }
        if (point.x < 0 || point.y < 0) {
          throw new Error('Point coordinates must be positive');
        }
      }
      
      points.value = newPoints;
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred while setting points';
      throw err;
    }
  };

  const setLines = (newLines: Line[]) => {
    try {
      // Validate lines
      for (const line of newLines) {
        if (typeof line.startX !== 'number' || typeof line.startY !== 'number' ||
            typeof line.endX !== 'number' || typeof line.endY !== 'number') {
          throw new Error('Invalid line coordinates');
        }
        if (line.startX < 0 || line.startY < 0 || line.endX < 0 || line.endY < 0) {
          throw new Error('Line coordinates must be positive');
        }
      }
      
      lines.value = newLines;
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred while setting lines';
      throw err;
    }
  };

  const addPoint = (point: Point) => {
    try {
      // Validate point
      if (typeof point.x !== 'number' || typeof point.y !== 'number') {
        throw new Error('Invalid point coordinates');
      }
      if (point.x < 0 || point.y < 0) {
        throw new Error('Point coordinates must be positive');
      }
      
      points.value.push(point);
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred while adding point';
      throw err;
    }
  };

  const updatePoint = (id: string, updates: Partial<Point>) => {
    try {
      const index = points.value.findIndex(p => p.id === id);
      if (index === -1) {
        throw new Error('Point not found');
      }
      
      // Validate updates
      if (updates.x !== undefined && typeof updates.x !== 'number') {
        throw new Error('Invalid x coordinate');
      }
      if (updates.y !== undefined && typeof updates.y !== 'number') {
        throw new Error('Invalid y coordinate');
      }
      if (updates.x !== undefined && updates.x < 0) {
        throw new Error('X coordinate must be positive');
      }
      if (updates.y !== undefined && updates.y < 0) {
        throw new Error('Y coordinate must be positive');
      }
      
      points.value[index] = { ...points.value[index], ...updates };
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred while updating point';
      throw err;
    }
  };

  const deletePoint = (id: string) => {
    try {
      // Remove the point
      const pointIndex = points.value.findIndex(p => p.id === id);
      if (pointIndex === -1) {
        throw new Error('Point not found');
      }
      
      const pointToDelete = points.value[pointIndex];
      points.value.splice(pointIndex, 1);
      
      // Remove any lines connected to this point
      lines.value = lines.value.filter(
        line => !(line.startX === pointToDelete.x && 
                 line.startY === pointToDelete.y) &&
                !(line.endX === pointToDelete.x && 
                 line.endY === pointToDelete.y)
      );
      
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred while deleting point';
      throw err;
    }
  };

  const addLine = (line: Line) => {
    try {
      // Validate line
      if (typeof line.startX !== 'number' || typeof line.startY !== 'number' ||
          typeof line.endX !== 'number' || typeof line.endY !== 'number') {
        throw new Error('Invalid line coordinates');
      }
      if (line.startX < 0 || line.startY < 0 || line.endX < 0 || line.endY < 0) {
        throw new Error('Line coordinates must be positive');
      }
      
      lines.value.push(line);
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred while adding line';
      throw err;
    }
  };

  const deleteLine = (id: string) => {
    try {
      const index = lines.value.findIndex(l => l.id === id);
      if (index === -1) {
        throw new Error('Line not found');
      }
      
      lines.value.splice(index, 1);
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred while deleting line';
      throw err;
    }
  };

  const clearCanvas = () => {
    points.value = [];
    lines.value = [];
    error.value = null;
  };

  const loadSymbol = (symbolData: { points: Point[]; lines: Line[] }) => {
    try {
      setPoints(symbolData.points);
      setLines(symbolData.lines);
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred while loading symbol';
      throw err;
    }
  };

  const exportSymbol = () => {
    return {
      points: points.value,
      lines: lines.value
    };
  };

  // Polyline specific actions
  const createPolylineFromPoints = (pointIds: string[]) => {
    try {
      // Clear existing lines
      lines.value = [];
      
      // Validate point IDs
      if (pointIds.length < 2) {
        throw new Error('At least two points are required to create a polyline');
      }
      
      // Create lines between consecutive points
      for (let i = 0; i < pointIds.length - 1; i++) {
        const startPoint = points.value.find(p => p.id === pointIds[i]);
        const endPoint = points.value.find(p => p.id === pointIds[i + 1]);
        
        if (!startPoint || !endPoint) {
          throw new Error('Point not found');
        }
        
        const newLine: Line = {
          id: Date.now().toString() + i,
          startX: startPoint.x,
          startY: startPoint.y,
          endX: endPoint.x,
          endY: endPoint.y
        };
        lines.value.push(newLine);
      }
      
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred while creating polyline';
      throw err;
    }
  };

  return {
    // State
    points,
    lines,
    isLoading,
    error,
    
    // Actions
    setPoints,
    setLines,
    addPoint,
    updatePoint,
    deletePoint,
    addLine,
    deleteLine,
    clearCanvas,
    loadSymbol,
    exportSymbol,
    createPolylineFromPoints
  };
});