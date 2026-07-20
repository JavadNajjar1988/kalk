import React from 'react';
import { BaseStrategy } from './baseStrategy';
import { CategoryType, DefinitionNode, SearchFilters, FormErrors, GraphConfig } from '../types';
import { loadEquipmentData } from '../data/loader';

interface EquipmentNode extends DefinitionNode {
  icon?: string;
  specialty?: string;
  customFields?: {
    type?: 'equipment' | 'vehicle' | 'weapon' | 'logistics' | string;
  } & Record<string, any>;
}

const EquipmentNodeRenderer: React.FC<{ node: EquipmentNode }> = ({ node }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {node.icon && <span aria-hidden style={{ fontSize: 12 }}>{node.icon}</span>}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <strong>{node.name}</strong>
        {node.description && (
          <span style={{ color: '#6c757d', fontSize: 12 }}>{node.description}</span>
        )}
      </div>
    </div>
  );
};

export class EquipmentStrategy extends BaseStrategy {
  constructor() {
    super(CategoryType.EQUIPMENT);
  }

  getGraphConfig(): GraphConfig {
    const base = super.getGraphConfig();
    return { ...base, nodeColor: '#8B5CF6', layout: 'tree' };
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
    // در صورت نیاز می‌توان بر اساس customFields.type فیلتر کرد
    return true;
  }

  // لود داده‌های تجهیزات
  getNodeData(categoryId: string): DefinitionNode[] {
    // @ts-ignore loader returns Promise; we cast for compatibility with current interface
    return loadEquipmentData(categoryId) as unknown as DefinitionNode[];
  }

  getNodeRenderer() {
    return (node: DefinitionNode) => <EquipmentNodeRenderer node={node as EquipmentNode} />;
  }
}

export default EquipmentStrategy;


