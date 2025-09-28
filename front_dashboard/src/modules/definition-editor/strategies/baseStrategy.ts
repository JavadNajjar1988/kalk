// Strategy پایه برای ماژول Definition Editor

import {
  CategoryStrategy,
  DefinitionNode,
  ExtendedHierarchyLevel,
  SearchFilters,
  FormErrors,
  LevelFormErrors,
  GraphConfig,
  CategoryType
} from '../types';

// Strategy پایه که سایر Strategy ها از آن ارث‌بری می‌کنند
export abstract class BaseStrategy implements CategoryStrategy {
  protected categoryType: CategoryType;

  constructor(categoryType: CategoryType) {
    this.categoryType = categoryType;
  }

  // تنظیمات پیش‌فرض گراف
  getGraphConfig(): GraphConfig {
    return {
      nodeShape: 'circle',
      nodeColor: '#3B82F6',
      edgeStyle: 'solid',
      layout: 'hierarchical',
      showLabels: true,
      showTooltips: true,
      nodeSize: 40,
      edgeWidth: 2
    };
  }

  // فیلترهای پیش‌فرض
  getDefaultFilters(): SearchFilters {
    return {
      query: '',
      searchIn: 'both',
      levelRange: [1, 10],
      hasChildren: 'all',
      hasCoordinates: 'all',
      country: '',
      hasNatoEquivalent: 'all',
      nodeType: 'all',
      specialty: '',
      icon: ''
    };
  }

  // اعتبارسنجی پیش‌فرض نود
  validateNode(node: Partial<DefinitionNode>): FormErrors {
    const errors: FormErrors = {};

    if (!node.name?.trim()) {
      errors.name = 'نام الزامی است';
    }

    if (!node.level || node.level < 1) {
      errors.level = 'سطح الزامی است';
    }

    return errors;
  }

  // اعتبارسنجی پیش‌فرض سطح
  validateLevel(level: Partial<ExtendedHierarchyLevel>): LevelFormErrors {
    const errors: LevelFormErrors = {};

    if (!level.name?.trim()) {
      errors.name = 'نام سطح الزامی است';
    }

    if (!level.englishName?.trim()) {
      errors.englishName = 'نام انگلیسی سطح الزامی است';
    }

    if (!level.order || level.order < 1) {
      errors.order = 'ترتیب سطح الزامی است';
    }

    return errors;
  }

  // فیلتر پیش‌فرض نود
  filterNode(node: DefinitionNode, filters: SearchFilters): boolean {
    // فیلتر بر اساس جستجو
    if (filters.query) {
      const query = filters.query.toLowerCase();
      const nameMatch = node.name.toLowerCase().includes(query);
      const descriptionMatch = node.description?.toLowerCase().includes(query) || false;
      
      if (filters.searchIn === 'name' && !nameMatch) return false;
      if (filters.searchIn === 'description' && !descriptionMatch) return false;
      if (filters.searchIn === 'both' && !nameMatch && !descriptionMatch) return false;
    }

    // فیلتر بر اساس سطح
    if (node.level < filters.levelRange[0] || node.level > filters.levelRange[1]) {
      return false;
    }

    // فیلتر بر اساس زیرمجموعه‌ها
    const hasChildren = node.children && node.children.length > 0;
    if (filters.hasChildren === 'with' && !hasChildren) return false;
    if (filters.hasChildren === 'without' && hasChildren) return false;

    return true;
  }

  // عملیات پیش‌فرض نود
  handleNodeClick(node: DefinitionNode): void {
    console.log('Node clicked:', node.name);
  }

  handleNodeEdit(node: DefinitionNode): void {
    console.log('Edit node:', node.name);
  }

  handleNodeDelete(node: DefinitionNode): void {
    console.log('Delete node:', node.name);
  }

  // نرمال‌سازی پیش‌فرض نود
  normalizeNode(node: DefinitionNode): DefinitionNode {
    return {
      ...node,
      name: node.name.trim(),
      description: node.description?.trim(),
      children: node.children || []
    };
  }

  // متدهای abstract که باید در کلاس‌های فرزند پیاده‌سازی شوند
  abstract getNodeData(categoryId: string): DefinitionNode[];
  abstract getNodeRenderer(): (node: DefinitionNode) => React.ReactElement;
}
