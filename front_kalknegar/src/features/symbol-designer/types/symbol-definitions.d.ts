export interface SymbolAnchorPoint {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface SymbolSegmentRule {
  id: string;
  from: string; // anchor id
  to: string;   // anchor id
  svgId?: string; // optional mapping to an SVG resource
}

export interface SymbolDefinition {
  id: string;
  name: string;
  category?: string;
  description?: string;
  svgPath?: string;
  anchors: SymbolAnchorPoint[];
  segments: SymbolSegmentRule[];
}


