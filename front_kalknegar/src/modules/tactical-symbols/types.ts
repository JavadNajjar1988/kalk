// Types for Tactical Symbols System

export interface TacticalSymbolDefinition {
  id: string;
  name: string;
  description?: string;
  category: string;
  svgPath: string;
  anchorPoints: AnchorPoint[];
  pointLogic: PointLogic[];
  lineLogic: LineLogic[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AnchorPoint {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'start' | 'end' | 'control' | 'reference';
  description?: string;
}

export interface PointLogic {
  id: string;
  name: string;
  type: 'required' | 'optional';
  anchorPointId: string;
  description?: string;
}

export interface LineLogic {
  id: string;
  name: string;
  fromPointId: string;
  toPointId: string;
  style: LineStyle;
  description?: string;
}

export interface LineStyle {
  strokeColor: string;
  strokeWidth: number;
  strokeDashArray?: string;
  opacity?: number;
}

export interface TacticalSymbolCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}
