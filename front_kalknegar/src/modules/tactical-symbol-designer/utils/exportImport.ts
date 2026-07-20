// Export/Import utilities for Tactical Symbol Designer Module

import type { TacticalSymbol } from '../types';

/**
 * Export a tactical symbol to JSON format
 * @param symbol The tactical symbol to export
 * @returns JSON string representation of the symbol
 */
export const exportSymbolToJson = (symbol: TacticalSymbol): string => {
  try {
    // Create a copy of the symbol without functions
    const symbolCopy = {
      id: symbol.id,
      name: symbol.name,
      description: symbol.description,
      points: symbol.points,
      lines: symbol.lines,
      createdAt: symbol.createdAt.toISOString(),
      updatedAt: symbol.updatedAt.toISOString()
    };
    
    return JSON.stringify(symbolCopy, null, 2);
  } catch (error) {
    throw new Error('Failed to export symbol to JSON: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

/**
 * Import a tactical symbol from JSON format
 * @param json JSON string representation of the symbol
 * @returns The imported tactical symbol
 */
export const importSymbolFromJson = (json: string): TacticalSymbol => {
  try {
    const parsed = JSON.parse(json);
    
    // Validate required fields
    if (!parsed.id || !parsed.name) {
      throw new Error('Invalid symbol data: missing required fields');
    }
    
    // Convert date strings back to Date objects
    const symbol: TacticalSymbol = {
      id: parsed.id,
      name: parsed.name,
      description: parsed.description,
      points: parsed.points || [],
      lines: parsed.lines || [],
      createdAt: new Date(parsed.createdAt),
      updatedAt: new Date(parsed.updatedAt)
    };
    
    // Validate points
    for (const point of symbol.points) {
      if (typeof point.x !== 'number' || typeof point.y !== 'number') {
        throw new Error('Invalid point coordinates');
      }
    }
    
    // Validate lines
    for (const line of symbol.lines) {
      if (typeof line.startX !== 'number' || typeof line.startY !== 'number' ||
          typeof line.endX !== 'number' || typeof line.endY !== 'number') {
        throw new Error('Invalid line coordinates');
      }
    }
    
    return symbol;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format: ' + error.message);
    }
    throw new Error('Failed to import symbol from JSON: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

/**
 * Export multiple tactical symbols to JSON format
 * @param symbols Array of tactical symbols to export
 * @returns JSON string representation of the symbols
 */
export const exportSymbolsToJson = (symbols: TacticalSymbol[]): string => {
  try {
    const symbolsCopy = symbols.map(symbol => ({
      id: symbol.id,
      name: symbol.name,
      description: symbol.description,
      points: symbol.points,
      lines: symbol.lines,
      createdAt: symbol.createdAt.toISOString(),
      updatedAt: symbol.updatedAt.toISOString()
    }));
    
    return JSON.stringify(symbolsCopy, null, 2);
  } catch (error) {
    throw new Error('Failed to export symbols to JSON: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

/**
 * Import multiple tactical symbols from JSON format
 * @param json JSON string representation of the symbols
 * @returns Array of imported tactical symbols
 */
export const importSymbolsFromJson = (json: string): TacticalSymbol[] => {
  try {
    const parsed = JSON.parse(json);
    
    // Ensure it's an array
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid data format: expected an array of symbols');
    }
    
    return parsed.map(item => {
      // Validate required fields
      if (!item.id || !item.name) {
        throw new Error('Invalid symbol data: missing required fields');
      }
      
      // Convert date strings back to Date objects
      const symbol: TacticalSymbol = {
        id: item.id,
        name: item.name,
        description: item.description,
        points: item.points || [],
        lines: item.lines || [],
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
      };
      
      // Validate points
      for (const point of symbol.points) {
        if (typeof point.x !== 'number' || typeof point.y !== 'number') {
          throw new Error('Invalid point coordinates');
        }
      }
      
      // Validate lines
      for (const line of symbol.lines) {
        if (typeof line.startX !== 'number' || typeof line.startY !== 'number' ||
            typeof line.endX !== 'number' || typeof line.endY !== 'number') {
          throw new Error('Invalid line coordinates');
        }
      }
      
      return symbol;
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format: ' + error.message);
    }
    throw new Error('Failed to import symbols from JSON: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};