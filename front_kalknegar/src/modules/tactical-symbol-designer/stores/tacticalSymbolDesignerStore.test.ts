import { describe, expect, it, beforeEach } from "vitest";
import { setActivePinia, createPinia } from 'pinia';
import { useTacticalSymbolDesignerStore } from './tacticalSymbolDesignerStore';
import type { Point, Line } from '../types';

describe('useTacticalSymbolDesignerStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with empty points and lines', () => {
    const store = useTacticalSymbolDesignerStore();
    expect(store.points).toEqual([]);
    expect(store.lines).toEqual([]);
    expect(store.isLoading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('should add a point', () => {
    const store = useTacticalSymbolDesignerStore();
    const point: Point = { id: '1', x: 10, y: 20 };
    
    store.addPoint(point);
    
    expect(store.points).toHaveLength(1);
    expect(store.points[0]).toEqual(point);
  });

  it('should validate point coordinates when adding', () => {
    const store = useTacticalSymbolDesignerStore();
    const invalidPoint: Point = { id: '1', x: -10, y: 20 };
    
    expect(() => store.addPoint(invalidPoint)).toThrow('Point coordinates must be positive');
  });

  it('should update a point', () => {
    const store = useTacticalSymbolDesignerStore();
    const point: Point = { id: '1', x: 10, y: 20 };
    
    store.addPoint(point);
    store.updatePoint('1', { x: 30 });
    
    expect(store.points[0].x).toBe(30);
    expect(store.points[0].y).toBe(20);
  });

  it('should delete a point', () => {
    const store = useTacticalSymbolDesignerStore();
    const point: Point = { id: '1', x: 10, y: 20 };
    
    store.addPoint(point);
    store.deletePoint('1');
    
    expect(store.points).toHaveLength(0);
  });

  it('should add a line', () => {
    const store = useTacticalSymbolDesignerStore();
    const line: Line = { id: '1', startX: 10, startY: 20, endX: 30, endY: 40 };
    
    store.addLine(line);
    
    expect(store.lines).toHaveLength(1);
    expect(store.lines[0]).toEqual(line);
  });

  it('should validate line coordinates when adding', () => {
    const store = useTacticalSymbolDesignerStore();
    const invalidLine: Line = { id: '1', startX: -10, startY: 20, endX: 30, endY: 40 };
    
    expect(() => store.addLine(invalidLine)).toThrow('Line coordinates must be positive');
  });

  it('should delete a line', () => {
    const store = useTacticalSymbolDesignerStore();
    const line: Line = { id: '1', startX: 10, startY: 20, endX: 30, endY: 40 };
    
    store.addLine(line);
    store.deleteLine('1');
    
    expect(store.lines).toHaveLength(0);
  });

  it('should clear the canvas', () => {
    const store = useTacticalSymbolDesignerStore();
    const point: Point = { id: '1', x: 10, y: 20 };
    const line: Line = { id: '1', startX: 10, startY: 20, endX: 30, endY: 40 };
    
    store.addPoint(point);
    store.addLine(line);
    store.clearCanvas();
    
    expect(store.points).toHaveLength(0);
    expect(store.lines).toHaveLength(0);
  });

  it('should create polyline from points', () => {
    const store = useTacticalSymbolDesignerStore();
    const points: Point[] = [
      { id: '1', x: 10, y: 20 },
      { id: '2', x: 30, y: 40 },
      { id: '3', x: 50, y: 60 }
    ];
    
    store.setPoints(points);
    store.createPolylineFromPoints(['1', '2', '3']);
    
    expect(store.lines).toHaveLength(2);
    expect(store.lines[0]).toEqual({ id: expect.any(String), startX: 10, startY: 20, endX: 30, endY: 40 });
    expect(store.lines[1]).toEqual({ id: expect.any(String), startX: 30, startY: 40, endX: 50, endY: 60 });
  });

  it('should handle errors gracefully', () => {
    const store = useTacticalSymbolDesignerStore();
    
    // Test error when setting invalid points
    expect(() => store.setPoints([{ id: '1', x: -10, y: 20 }])).toThrow();
    expect(store.error).not.toBeNull();
    
    // Test error when updating non-existent point
    expect(() => store.updatePoint('non-existent', { x: 30 })).toThrow('Point not found');
    expect(store.error).not.toBeNull();
  });
});