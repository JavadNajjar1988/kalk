// Strategy درجات نظامی برای ماژول Definition Editor

import React from 'react';
import { BaseStrategy } from './baseStrategy';
import { CategoryType, DefinitionNode, SearchFilters, FormErrors, GraphConfig } from '../types';
import { loadMilitaryRanksData } from '../data/loader';

// نود درجات نظامی
interface MilitaryRankNode extends DefinitionNode {
  country?: string;
  natoEquivalent?: string;
  icon?: string;
  rankLevel?: number;
  branch?: string; // نیرو (ارتش، هوایی، دریایی)
  insignia?: string;
}

export class MilitaryRanksStrategy extends BaseStrategy {
  constructor() {
    super(CategoryType.MILITARY_RANKS);
  }

  // تنظیمات گراف مخصوص درجات نظامی
  getGraphConfig(): GraphConfig {
    return {
      ...super.getGraphConfig(),
      nodeShape: 'star',
      nodeColor: '#EF4444',
      edgeStyle: 'dashed',
      layout: 'tree',
      showLabels: true,
      showTooltips: true,
      nodeSize: 60,
      edgeWidth: 2
    };
  }

  // فیلترهای مخصوص درجات نظامی
  getDefaultFilters(): SearchFilters {
    return {
      ...super.getDefaultFilters(),
      levelRange: [1, 9],
      hasCoordinates: 'all',
      country: '',
      hasNatoEquivalent: 'all',
      nodeType: 'all'
    };
  }

  // اعتبارسنجی مخصوص درجات نظامی
  validateNode(node: Partial<MilitaryRankNode>): FormErrors {
    const errors = super.validateNode(node);

    // اعتبارسنجی کشور برای سطح 1 (کشورها)
    if (node.level === 1) {
      if (!node.country?.trim()) {
        errors.country = 'نام کشور الزامی است';
      }
      if (!node.description?.trim()) {
        errors.description = 'توضیحات الزامی است';
      }
    }

    // اعتبارسنجی سطوح مختلف درجات نظامی (سطوح 2 تا 9)
    if (node.level >= 2 && node.level <= 9) {
      if (!node.country?.trim()) {
        errors.country = 'کشور الزامی است';
      }
      
      // معادل ناتو اختیاری است اما اگر وارد شود باید معتبر باشد
      if (node.natoEquivalent && node.natoEquivalent.trim().length < 2) {
        errors.natoEquivalent = 'معادل ناتو باید حداقل ۲ کاراکتر باشد';
      }
    }

    return errors;
  }

  // فیلتر مخصوص درجات نظامی
  filterNode(node: MilitaryRankNode, filters: SearchFilters): boolean {
    if (!super.filterNode(node, filters)) {
      return false;
    }

    // فیلتر بر اساس نوع نود
    if (filters.nodeType === 'countries' && node.level !== 1) return false;
    if (filters.nodeType === 'ranks' && node.level < 2 || node.level > 9) return false;

    // فیلتر بر اساس کشور
    if (filters.country && node.country) {
      if (!node.country.toLowerCase().includes(filters.country.toLowerCase())) {
        return false;
      }
    }

    // فیلتر بر اساس معادل ناتو (برای سطوح 2 تا 9)
    if (node.level >= 2 && node.level <= 9) {
      const hasNatoEquivalent = node.natoEquivalent && node.natoEquivalent.trim().length > 0;
      if (filters.hasNatoEquivalent === 'with' && !hasNatoEquivalent) return false;
      if (filters.hasNatoEquivalent === 'without' && hasNatoEquivalent) return false;
    }

    return true;
  }

  // لود داده‌های درجات نظامی
  getNodeData(categoryId: string): DefinitionNode[] {
    // @ts-ignore توضیح: نگاه بالا
    return loadMilitaryRanksData(categoryId) as unknown as DefinitionNode[];
  }

  // رندر نود درجات نظامی
  getNodeRenderer(): (node: DefinitionNode) => React.ReactElement {
    return (node: DefinitionNode) => {
      const militaryRankNode = node as MilitaryRankNode;
      return React.createElement(MilitaryRankNodeRenderer, { node: militaryRankNode });
    };
  }

  // عملیات مخصوص درجات نظامی
  handleNodeClick(node: DefinitionNode): void {
    console.log('Military rank node clicked:', node.name);
    // می‌تواند شامل نمایش اطلاعات رتبه، مقایسه با ناتو و غیره باشد
  }

  handleNodeEdit(node: DefinitionNode): void {
    console.log('Edit military rank node:', node.name);
    // باز کردن فرم ویرایش مخصوص درجات نظامی
  }

  handleNodeDelete(node: DefinitionNode): void {
    console.log('Delete military rank node:', node.name);
    // حذف درجه نظامی با تایید
  }

  // نرمال‌سازی مخصوص درجات نظامی
  normalizeNode(node: DefinitionNode): DefinitionNode {
    const normalized = super.normalizeNode(node);
    
    // نرمال‌سازی معادل ناتو
    if (normalized.natoEquivalent) {
      normalized.natoEquivalent = normalized.natoEquivalent.trim().toUpperCase();
    }

    // نرمال‌سازی کشور
    if (normalized.country) {
      normalized.country = normalized.country.trim();
    }

    return normalized;
  }
}

// کامپوننت رندر نود درجات نظامی
const MilitaryRankNodeRenderer: React.FC<{ node: MilitaryRankNode }> = ({ node }) => {
  const isCountry = node.level === 1;
  const isRank = node.level >= 2 && node.level <= 9;

  // تعیین نوع درجه بر اساس سطح
  const getRankType = (level: number) => {
    switch (level) {
      case 2: return 'فرمانده کل قوا';
      case 3: return 'امیران (ژنرال‌ها)';
      case 4: return 'افسر عالی‌رتبه';
      case 5: return 'افسر ارشد';
      case 6: return 'افسر جزء';
      case 7: return 'درجه‌دار ارشد';
      case 8: return 'درجه‌دار جزء';
      case 9: return 'سرباز';
      default: return 'درجه نظامی';
    }
  };

  return (
    <div className={`military-rank-node ${isCountry ? 'country-node' : 'rank-node'}`}>
      <div className="node-header">
        {node.icon && <span className="node-icon">{node.icon}</span>}
        <span className="node-name">{node.name}</span>
        {node.country && <span className="node-country">({node.country})</span>}
      </div>
      
      {node.description && (
        <div className="node-description">{node.description}</div>
      )}
      
      {isRank && (
        <div className="node-rank-type">
          <span className="rank-type-label">نوع:</span>
          <span className="rank-type-value">{getRankType(node.level)}</span>
        </div>
      )}
      
      {isRank && node.natoEquivalent && (
        <div className="node-nato">
          <span className="nato-label">ناتو:</span>
          <span className="nato-value">{node.natoEquivalent}</span>
        </div>
      )}
      
      {node.branch && (
        <div className="node-branch">
          <span className="branch-label">نیرو:</span>
          <span className="branch-value">{node.branch}</span>
        </div>
      )}
      
      {node.children && node.children.length > 0 && (
        <div className="node-children-count">
          {isCountry ? `${node.children.length} درجه` : `${node.children.length} زیرمجموعه`}
        </div>
      )}
    </div>
  );
};
