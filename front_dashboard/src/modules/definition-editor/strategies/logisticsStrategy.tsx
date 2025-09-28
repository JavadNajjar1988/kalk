import React from 'react';
import { BaseStrategy } from './baseStrategy';
import { CategoryType, DefinitionNode, SearchFilters, FormErrors, GraphConfig } from '../types';
import { loadLogisticsData } from '../data/loader';

interface LogisticsNode extends DefinitionNode {
  specialty?: string;
  status?: string;
}

const LogisticsNodeRenderer: React.FC<{ node: LogisticsNode }> = ({ node }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <strong>{node.name}</strong>
      {node.specialty && <span style={{ color: '#6c757d', fontSize: 12 }}>تخصص: {node.specialty}</span>}
      {node.description && <span style={{ color: '#6c757d', fontSize: 12 }}>{node.description}</span>}
    </div>
  );
};

export class LogisticsStrategy extends BaseStrategy {
  constructor() {
    super(CategoryType.LOGISTICS_STATUS);
  }

  getGraphConfig(): GraphConfig {
    const base = super.getGraphConfig();
    return { ...base, nodeColor: '#10B981', layout: 'hierarchical' };
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
    return loadLogisticsData(categoryId) as unknown as DefinitionNode[];
  }

  getNodeRenderer() {
    return (node: DefinitionNode) => <LogisticsNodeRenderer node={node as LogisticsNode} />;
  }
}

export default LogisticsStrategy;


