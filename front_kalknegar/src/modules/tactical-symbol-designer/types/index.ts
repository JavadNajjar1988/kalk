// Types for Tactical Symbol Designer Module

export interface Point {
  id: string;
  x: number;
  y: number;
}

export interface Line {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface TacticalSymbol {
  id: string;
  name: string;
  description?: string;
  points: Point[];
  lines: Line[];
  createdAt: Date;
  updatedAt: Date;
}