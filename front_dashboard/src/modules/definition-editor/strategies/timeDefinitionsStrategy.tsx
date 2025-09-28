import React from 'react';
import { BaseStrategy } from './baseStrategy';
import { CategoryType, DefinitionNode, SearchFilters, FormErrors, GraphConfig } from '../types';
import { loadTimeDefinitionsData } from '../data/loader';

interface TimeNode extends DefinitionNode {
  metadata?: {
    tags?: string[];
    priority?: number;
    isTemplate?: boolean;
    unit?: string;
    value?: number;
  };
}

const TimeNodeRenderer: React.FC<{ node: TimeNode }> = ({ node }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <strong>{node.name}</strong>
      {node.description && <span style={{ color: '#6c757d', fontSize: 12 }}>{node.description}</span>}
    </div>
  );
};

export class TimeDefinitionsStrategy extends BaseStrategy {
  constructor() {
    super(CategoryType.TIME_DEFINITIONS);
  }

  getGraphConfig(): GraphConfig {
    const base = super.getGraphConfig();
    return { ...base, nodeColor: '#F59E0B', layout: 'circular' };
  }

  getDefaultFilters(): SearchFilters {
    return {
      ...super.getDefaultFilters(),
      nodeType: 'all'
    };
  }

  validateNode(node: Partial<DefinitionNode>): FormErrors {
    const errors = super.validateNode(node);
    return errors;
  }

  filterNode(node: DefinitionNode, filters: SearchFilters): boolean {
    if (!super.filterNode(node, filters)) return false;
    return true;
  }

  getNodeData(categoryId: string): DefinitionNode[] {
    // @ts-ignore loader returns Promise; we cast for interface compatibility
    return loadTimeDefinitionsData(categoryId) as unknown as DefinitionNode[];
  }

  getNodeRenderer() {
    return (node: DefinitionNode) => <TimeNodeRenderer node={node as TimeNode} />;
  }
}

export default TimeDefinitionsStrategy;


