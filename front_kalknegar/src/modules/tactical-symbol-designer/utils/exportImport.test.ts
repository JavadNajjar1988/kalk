import { describe, expect, it } from "vitest";
import { exportSymbolToJson, importSymbolFromJson, exportSymbolsToJson, importSymbolsFromJson } from './exportImport';
import type { TacticalSymbol } from '../types';

describe('exportImport utilities', () => {
  const mockSymbol: TacticalSymbol = {
    id: '1',
    name: 'Test Symbol',
    description: 'A test symbol',
    points: [
      { id: 'p1', x: 10, y: 20 },
      { id: 'p2', x: 30, y: 40 }
    ],
    lines: [
      { id: 'l1', startX: 10, startY: 20, endX: 30, endY: 40 }
    ],
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  };

  const mockSymbols: TacticalSymbol[] = [
    mockSymbol,
    {
      id: '2',
      name: 'Test Symbol 2',
      points: [
        { id: 'p3', x: 50, y: 60 },
        { id: 'p4', x: 70, y: 80 }
      ],
      lines: [
        { id: 'l2', startX: 50, startY: 60, endX: 70, endY: 80 }
      ],
      createdAt: new Date('2023-01-02T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z')
    }
  ];

  it('should export a single symbol to JSON', () => {
    const json = exportSymbolToJson(mockSymbol);
    expect(typeof json).toBe('string');
    expect(json).toContain('Test Symbol');
    expect(json).toContain('A test symbol');
  });

  it('should import a single symbol from JSON', () => {
    const json = exportSymbolToJson(mockSymbol);
    const importedSymbol = importSymbolFromJson(json);
    
    expect(importedSymbol.id).toBe(mockSymbol.id);
    expect(importedSymbol.name).toBe(mockSymbol.name);
    expect(importedSymbol.description).toBe(mockSymbol.description);
    expect(importedSymbol.points).toEqual(mockSymbol.points);
    expect(importedSymbol.lines).toEqual(mockSymbol.lines);
    expect(importedSymbol.createdAt).toEqual(mockSymbol.createdAt);
    expect(importedSymbol.updatedAt).toEqual(mockSymbol.updatedAt);
  });

  it('should export multiple symbols to JSON', () => {
    const json = exportSymbolsToJson(mockSymbols);
    expect(typeof json).toBe('string');
    expect(json).toContain('Test Symbol');
    expect(json).toContain('Test Symbol 2');
  });

  it('should import multiple symbols from JSON', () => {
    const json = exportSymbolsToJson(mockSymbols);
    const importedSymbols = importSymbolsFromJson(json);
    
    expect(importedSymbols).toHaveLength(2);
    expect(importedSymbols[0].id).toBe(mockSymbols[0].id);
    expect(importedSymbols[1].id).toBe(mockSymbols[1].id);
  });

  it('should handle invalid JSON gracefully', () => {
    expect(() => importSymbolFromJson('invalid json')).toThrow('Invalid JSON format');
    expect(() => importSymbolsFromJson('invalid json')).toThrow('Invalid JSON format');
  });

  it('should handle missing required fields', () => {
    const invalidJson = JSON.stringify({ id: '1' }); // Missing name
    expect(() => importSymbolFromJson(invalidJson)).toThrow('missing required fields');
  });
});