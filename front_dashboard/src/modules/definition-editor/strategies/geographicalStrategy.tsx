// Strategy جغرافیایی برای ماژول Definition Editor

import React from 'react';
import { BaseStrategy } from './baseStrategy';
import { CategoryType, DefinitionNode, SearchFilters, FormErrors, GraphConfig } from '../types';
import { loadGeographicalData } from '../data/loader';

// نود جغرافیایی
interface GeographicalNode extends DefinitionNode {
  coordinates?: { lat: number; lng: number };
  country?: string;
  region?: string;
  population?: number;
  area?: number;
}

export class GeographicalStrategy extends BaseStrategy {
  constructor() {
    super(CategoryType.GEOGRAPHICAL);
  }

  // تنظیمات گراف مخصوص جغرافیا
  getGraphConfig(): GraphConfig {
    return {
      ...super.getGraphConfig(),
      nodeShape: 'circle',
      nodeColor: '#3B82F6',
      edgeStyle: 'solid',
      layout: 'hierarchical',
      showLabels: true,
      showTooltips: true,
      nodeSize: 50,
      edgeWidth: 2
    };
  }

  // فیلترهای مخصوص جغرافیا
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

  // اعتبارسنجی مخصوص جغرافیا
  validateNode(node: Partial<GeographicalNode>): FormErrors {
    const errors = super.validateNode(node);

    // اعتبارسنجی مختصات جغرافیایی
    if (node.coordinates) {
      const { lat, lng } = node.coordinates;
      if (lat < -90 || lat > 90) {
        errors.coordinates = 'عرض جغرافیایی باید بین -90 تا 90 باشد';
      }
      if (lng < -180 || lng > 180) {
        errors.coordinates = 'طول جغرافیایی باید بین -180 تا 180 باشد';
      }
    }

    // اعتبارسنجی کشور برای سطح 1
    if (node.level === 1) {
      if (!node.country?.trim()) {
        errors.country = 'نام کشور الزامی است';
      }
    }

    // اعتبارسنجی توضیحات برای سطح 1
    if (node.level === 1) {
      if (!node.description?.trim()) {
        errors.description = 'توضیحات الزامی است';
      }
    }

    return errors;
  }

  // فیلتر مخصوص جغرافیا
  filterNode(node: GeographicalNode, filters: SearchFilters): boolean {
    if (!super.filterNode(node, filters)) {
      return false;
    }

    // فیلتر بر اساس مختصات جغرافیایی
    if (filters.hasCoordinates !== 'all') {
      const hasCoordinates = node.coordinates && 
        (node.coordinates.lat !== 0 || node.coordinates.lng !== 0);
      
      if (filters.hasCoordinates === 'with' && !hasCoordinates) return false;
      if (filters.hasCoordinates === 'without' && hasCoordinates) return false;
    }

    // فیلتر بر اساس کشور
    if (filters.country && node.country) {
      if (!node.country.toLowerCase().includes(filters.country.toLowerCase())) {
        return false;
      }
    }

    return true;
  }

  // لود داده‌های جغرافیایی
  getNodeData(categoryId: string): DefinitionNode[] {
    // loader برمی‌گرداند Promise؛ برای سادگی در این نسخه سنکرون فرض می‌کنیم داده‌های cache شده داریم
    // در نسخه فعلی، داده‌های JSON به‌صورت sync import شده‌اند؛ اگر async بود باید امضای types تغییر کند
    // @ts-ignore
    return loadGeographicalData(categoryId) as unknown as DefinitionNode[];
  }

  // رندر نود جغرافیایی
  getNodeRenderer(): (node: DefinitionNode) => React.ReactElement {
    return (node: DefinitionNode) => {
      const geographicalNode = node as GeographicalNode;
      return React.createElement(GeographicalNodeRenderer, { node: geographicalNode });
    };
  }

  // عملیات مخصوص جغرافیا
  handleNodeClick(node: DefinitionNode): void {
    console.log('Geographical node clicked:', node.name);
    // می‌تواند شامل نمایش نقشه، اطلاعات جغرافیایی و غیره باشد
  }

  handleNodeEdit(node: DefinitionNode): void {
    console.log('Edit geographical node:', node.name);
    // باز کردن فرم ویرایش مخصوص جغرافیا
  }

  handleNodeDelete(node: DefinitionNode): void {
    console.log('Delete geographical node:', node.name);
    // حذف نود جغرافیایی با تایید
  }

  // نرمال‌سازی مخصوص جغرافیا
  normalizeNode(node: DefinitionNode): DefinitionNode {
    const normalized = super.normalizeNode(node);
    
    // نرمال‌سازی مختصات
    if (normalized.coordinates) {
      normalized.coordinates = {
        lat: Math.round(normalized.coordinates.lat * 1000000) / 1000000,
        lng: Math.round(normalized.coordinates.lng * 1000000) / 1000000
      };
    }

    return normalized;
  }
}

// کامپوننت رندر نود جغرافیایی
const GeographicalNodeRenderer: React.FC<{ node: GeographicalNode }> = ({ node }) => {
  return (
    <div className="geographical-node">
      <div className="node-header">
        <span className="node-name">{node.name}</span>
        {node.country && <span className="node-country">({node.country})</span>}
      </div>
      {node.description && (
        <div className="node-description">{node.description}</div>
      )}
      {node.coordinates && (
        <div className="node-coordinates">
          {node.coordinates.lat.toFixed(4)}, {node.coordinates.lng.toFixed(4)}
        </div>
      )}
      {node.children && node.children.length > 0 && (
        <div className="node-children-count">
          {node.children.length} زیرمجموعه
        </div>
      )}
    </div>
  );
};
