import type {
  FilterCriteria,
  FilterGroup,
  AdvancedFilterConfig,
  FilterOperator,
  NodeSearchResult
} from '../types/fieldConstructor';

/**
 * Utility functions for advanced filtering system
 * توابع کمکی برای سیستم فیلتر پیشرفته
 */

// Filter validation functions
export const validateFilterCriteria = (criteria: FilterCriteria): string[] => {
  const errors: string[] = [];
  
  if (!criteria.field) {
    errors.push('Field is required');
  }
  
  if (!criteria.operator) {
    errors.push('Operator is required');
  }
  
  if (criteria.value === null || criteria.value === undefined || criteria.value === '') {
    if (!['exists', 'not_exists'].includes(criteria.operator)) {
      errors.push('Value is required for this operator');
    }
  }
  
  return errors;
};

export const validateFilterGroup = (group: FilterGroup): string[] => {
  const errors: string[] = [];
  
  if (!group.name.trim()) {
    errors.push('Group name is required');
  }
  
  if (group.criteria.length === 0) {
    errors.push('At least one criteria is required');
  }
  
  group.criteria.forEach((criteria, index) => {
    const criteriaErrors = validateFilterCriteria(criteria);
    criteriaErrors.forEach(error => {
      errors.push(`Criteria ${index + 1}: ${error}`);
    });
  });
  
  return errors;
};

// Filter optimization functions
export const optimizeFilterConfig = (config: AdvancedFilterConfig): AdvancedFilterConfig => {
  return {
    ...config,
    groups: config.groups
      .filter(group => group.isActive && group.criteria.length > 0)
      .map(group => ({
        ...group,
        criteria: group.criteria.filter(criteria => 
          criteria.field && criteria.operator
        )
      }))
  };
};

// Filter execution engine
export class FilterEngine {
  /**
   * Apply a single filter criteria to a value
   */
  static applyCriteria(value: any, criteria: FilterCriteria): boolean {
    const { operator, value: criteriaValue } = criteria;
    
    switch (operator) {
      case '=':
        return this.isEqual(value, criteriaValue);
      case '!=':
        return !this.isEqual(value, criteriaValue);
      case '>':
        return this.isGreater(value, criteriaValue);
      case '<':
        return this.isLess(value, criteriaValue);
      case '>=':
        return this.isGreaterOrEqual(value, criteriaValue);
      case '<=':
        return this.isLessOrEqual(value, criteriaValue);
      case 'contains':
        return this.contains(value, criteriaValue);
      case 'not_contains':
        return !this.contains(value, criteriaValue);
      case 'starts_with':
        return this.startsWith(value, criteriaValue);
      case 'ends_with':
        return this.endsWith(value, criteriaValue);
      case 'in':
        return this.isIn(value, criteriaValue);
      case 'not_in':
        return !this.isIn(value, criteriaValue);
      case 'between':
        return this.isBetween(value, criteriaValue);
      case 'exists':
        return this.exists(value);
      case 'not_exists':
        return !this.exists(value);
      default:
        return false;
    }
  }
  
  /**
   * Apply a filter group to a data item
   */
  static applyGroup(item: NodeSearchResult, group: FilterGroup): boolean {
    if (!group.isActive || group.criteria.length === 0) {
      return true;
    }
    
    const results = group.criteria.map(criteria => {
      const fieldValue = this.getFieldValue(item, criteria.field);
      return this.applyCriteria(fieldValue, criteria);
    });
    
    if (group.logicalOperator === 'AND') {
      return results.every(result => result);
    } else {
      return results.some(result => result);
    }
  }
  
  /**
   * Apply complete filter configuration to data
   */
  static applyFilter(data: NodeSearchResult[], config: AdvancedFilterConfig): NodeSearchResult[] {
    const optimizedConfig = optimizeFilterConfig(config);
    
    if (optimizedConfig.groups.length === 0) {
      return data;
    }
    
    return data.filter(item => {
      const groupResults = optimizedConfig.groups.map(group => 
        this.applyGroup(item, group)
      );
      
      if (optimizedConfig.globalLogicalOperator === 'AND') {
        return groupResults.every(result => result);
      } else {
        return groupResults.some(result => result);
      }
    });
  }
  
  // Helper methods for different operations
  private static isEqual(value: any, criteriaValue: any): boolean {
    if (typeof value === 'string' && typeof criteriaValue === 'string') {
      return value.toLowerCase() === criteriaValue.toLowerCase();
    }
    return value === criteriaValue;
  }
  
  private static isGreater(value: any, criteriaValue: any): boolean {
    const numValue = Number(value);
    const numCriteria = Number(criteriaValue);
    return !isNaN(numValue) && !isNaN(numCriteria) && numValue > numCriteria;
  }
  
  private static isLess(value: any, criteriaValue: any): boolean {
    const numValue = Number(value);
    const numCriteria = Number(criteriaValue);
    return !isNaN(numValue) && !isNaN(numCriteria) && numValue < numCriteria;
  }
  
  private static isGreaterOrEqual(value: any, criteriaValue: any): boolean {
    const numValue = Number(value);
    const numCriteria = Number(criteriaValue);
    return !isNaN(numValue) && !isNaN(numCriteria) && numValue >= numCriteria;
  }
  
  private static isLessOrEqual(value: any, criteriaValue: any): boolean {
    const numValue = Number(value);
    const numCriteria = Number(criteriaValue);
    return !isNaN(numValue) && !isNaN(numCriteria) && numValue <= numCriteria;
  }
  
  private static contains(value: any, criteriaValue: any): boolean {
    if (typeof value !== 'string') return false;
    if (typeof criteriaValue !== 'string') return false;
    return value.toLowerCase().includes(criteriaValue.toLowerCase());
  }
  
  private static startsWith(value: any, criteriaValue: any): boolean {
    if (typeof value !== 'string') return false;
    if (typeof criteriaValue !== 'string') return false;
    return value.toLowerCase().startsWith(criteriaValue.toLowerCase());
  }
  
  private static endsWith(value: any, criteriaValue: any): boolean {
    if (typeof value !== 'string') return false;
    if (typeof criteriaValue !== 'string') return false;
    return value.toLowerCase().endsWith(criteriaValue.toLowerCase());
  }
  
  private static isIn(value: any, criteriaValue: any): boolean {
    if (!Array.isArray(criteriaValue)) return false;
    return criteriaValue.includes(value);
  }
  
  private static isBetween(value: any, criteriaValue: any): boolean {
    if (!Array.isArray(criteriaValue) || criteriaValue.length !== 2) return false;
    const numValue = Number(value);
    const [min, max] = criteriaValue.map(Number);
    return !isNaN(numValue) && !isNaN(min) && !isNaN(max) && numValue >= min && numValue <= max;
  }
  
  private static exists(value: any): boolean {
    return value !== null && value !== undefined && value !== '';
  }
  
  private static getFieldValue(item: NodeSearchResult, fieldPath: string): any {
    // Support nested field access with dot notation
    const fields = fieldPath.split('.');
    let currentValue: any = item;
    
    for (const field of fields) {
      if (currentValue === null || currentValue === undefined) {
        return null;
      }
      
      switch (field) {
        case 'name':
          currentValue = currentValue.name;
          break;
        case 'description':
          currentValue = currentValue.description;
          break;
        case 'level':
          currentValue = currentValue.level;
          break;
        case 'categoryType':
          currentValue = currentValue.categoryType;
          break;
        case 'parentId':
          currentValue = currentValue.parentId;
          break;
        case 'coordinates':
          currentValue = currentValue.coordinates;
          break;
        case 'coordinates.lat':
          currentValue = currentValue.coordinates?.lat;
          break;
        case 'coordinates.lng':
          currentValue = currentValue.coordinates?.lng;
          break;
        case 'hasCoordinates':
          currentValue = !!(currentValue.coordinates?.lat && currentValue.coordinates?.lng);
          break;
        case 'path':
          currentValue = currentValue.path?.join(' > ');
          break;
        case 'pathLength':
          currentValue = currentValue.path?.length || 0;
          break;
        case 'score':
          currentValue = currentValue.score;
          break;
        default:
          // Check metadata
          if (currentValue.metadata && field in currentValue.metadata) {
            currentValue = currentValue.metadata[field];
          } else {
            currentValue = currentValue[field];
          }
      }
    }
    
    return currentValue;
  }
}

// Filter preset templates
export const filterPresets = {
  // جغرافیایی
  geographicalWithCoordinates: (): AdvancedFilterConfig => ({
    groups: [{
      id: 'geo_coords',
      name: 'اماکن با مختصات',
      criteria: [{
        id: 'has_coords',
        field: 'hasCoordinates',
        operator: '=',
        value: true
      }],
      logicalOperator: 'AND',
      isActive: true
    }],
    globalLogicalOperator: 'AND',
    savedFilters: []
  }),
  
  // درجات نظامی سطح بالا
  highRankMilitary: (): AdvancedFilterConfig => ({
    groups: [{
      id: 'high_ranks',
      name: 'درجات بالا',
      criteria: [{
        id: 'high_level',
        field: 'level',
        operator: '<=',
        value: 3
      }],
      logicalOperator: 'AND',
      isActive: true
    }],
    globalLogicalOperator: 'AND',
    savedFilters: []
  }),
  
  // تجهیزات عملیاتی
  operationalEquipment: (): AdvancedFilterConfig => ({
    groups: [{
      id: 'operational',
      name: 'تجهیزات عملیاتی',
      criteria: [
        {
          id: 'category_check',
          field: 'categoryType',
          operator: '=',
          value: 'equipment'
        },
        {
          id: 'operational_desc',
          field: 'description',
          operator: 'contains',
          value: 'عملیاتی',
          logicalOperator: 'AND'
        }
      ],
      logicalOperator: 'AND',
      isActive: true
    }],
    globalLogicalOperator: 'AND',
    savedFilters: []
  })
};

// Filter performance monitoring
export class FilterPerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();
  
  static startTimer(filterId: string): number {
    const startTime = performance.now();
    return startTime;
  }
  
  static endTimer(filterId: string, startTime: number): number {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (!this.metrics.has(filterId)) {
      this.metrics.set(filterId, []);
    }
    
    this.metrics.get(filterId)!.push(duration);
    return duration;
  }
  
  static getMetrics(filterId: string) {
    const times = this.metrics.get(filterId) || [];
    if (times.length === 0) return null;
    
    const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    return {
      count: times.length,
      average: Math.round(avg * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      total: Math.round(times.reduce((sum, time) => sum + time, 0) * 100) / 100
    };
  }
  
  static clearMetrics(filterId?: string): void {
    if (filterId) {
      this.metrics.delete(filterId);
    } else {
      this.metrics.clear();
    }
  }
  
  static getAllMetrics() {
    const result: Record<string, any> = {};
    this.metrics.forEach((times, filterId) => {
      result[filterId] = this.getMetrics(filterId);
    });
    return result;
  }
}

// Filter state management utilities
export const filterStateUtils = {
  /**
   * Create a new empty filter group
   */
  createEmptyGroup(): FilterGroup {
    return {
      id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: 'New Filter Group',
      criteria: [],
      logicalOperator: 'AND',
      isActive: true
    };
  },
  
  /**
   * Create a new empty criteria
   */
  createEmptyCriteria(): FilterCriteria {
    return {
      id: `criteria_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      field: '',
      operator: '=',
      value: '',
      logicalOperator: 'AND'
    };
  },
  
  /**
   * Clone a filter configuration
   */
  cloneConfig(config: AdvancedFilterConfig): AdvancedFilterConfig {
    return JSON.parse(JSON.stringify(config));
  },
  
  /**
   * Merge multiple filter configurations
   */
  mergeConfigs(configs: AdvancedFilterConfig[], operator: 'AND' | 'OR' = 'AND'): AdvancedFilterConfig {
    const allGroups: FilterGroup[] = [];
    
    configs.forEach((config, index) => {
      config.groups.forEach(group => {
        allGroups.push({
          ...group,
          id: `${group.id}_merged_${index}`,
          name: `${group.name} (Merged ${index + 1})`
        });
      });
    });
    
    return {
      groups: allGroups,
      globalLogicalOperator: operator,
      savedFilters: []
    };
  },
  
  /**
   * Get filter summary
   */
  getSummary(config: AdvancedFilterConfig) {
    const activeGroups = config.groups.filter(g => g.isActive);
    const totalCriteria = activeGroups.reduce((sum, group) => sum + group.criteria.length, 0);
    const uniqueFields = new Set<string>();
    
    activeGroups.forEach(group => {
      group.criteria.forEach(criteria => {
        uniqueFields.add(criteria.field);
      });
    });
    
    return {
      totalGroups: config.groups.length,
      activeGroups: activeGroups.length,
      totalCriteria,
      uniqueFields: uniqueFields.size,
      globalOperator: config.globalLogicalOperator
    };
  }
};

// Search optimization utilities
export const searchOptimizationUtils = {
  /**
   * Calculate search relevance score
   */
  calculateRelevanceScore(node: NodeSearchResult, searchTerm: string): number {
    let score = 0;
    const term = searchTerm.toLowerCase();
    
    // Exact name match (highest priority)
    if (node.name.toLowerCase() === term) {
      score += 100;
    } else if (node.name.toLowerCase().includes(term)) {
      // Partial name match
      const position = node.name.toLowerCase().indexOf(term);
      score += 50 - (position * 2); // Earlier matches get higher scores
    }
    
    // Description match
    if (node.description?.toLowerCase().includes(term)) {
      score += 25;
    }
    
    // Metadata matches
    if (node.metadata) {
      Object.values(node.metadata).forEach(value => {
        if (typeof value === 'string' && value.toLowerCase().includes(term)) {
          score += 15;
        }
      });
    }
    
    // Path match (breadcrumb search)
    if (node.path?.some(pathItem => pathItem.toLowerCase().includes(term))) {
      score += 20;
    }
    
    // Level boost (prefer higher level items)
    if (node.level && node.level <= 3) {
      score += (4 - node.level) * 5;
    }
    
    return score;
  },
  
  /**
   * Optimize search query
   */
  optimizeSearchQuery(query: string): string {
    return query
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .toLowerCase();
  },
  
  /**
   * Group search results by category
   */
  groupResultsByCategory(results: NodeSearchResult[]): Record<string, NodeSearchResult[]> {
    const groups: Record<string, NodeSearchResult[]> = {};
    
    results.forEach(result => {
      if (!groups[result.categoryType]) {
        groups[result.categoryType] = [];
      }
      groups[result.categoryType].push(result);
    });
    
    return groups;
  },
  
  /**
   * Sort results by relevance and category
   */
  sortResults(results: NodeSearchResult[], prioritizeCategories?: string[]): NodeSearchResult[] {
    return results.sort((a, b) => {
      // First sort by category priority if specified
      if (prioritizeCategories) {
        const aPriority = prioritizeCategories.indexOf(a.categoryType);
        const bPriority = prioritizeCategories.indexOf(b.categoryType);
        
        if (aPriority !== bPriority) {
          if (aPriority === -1) return 1;
          if (bPriority === -1) return -1;
          return aPriority - bPriority;
        }
      }
      
      // Then sort by score
      const aScore = a.score || 0;
      const bScore = b.score || 0;
      
      if (aScore !== bScore) {
        return bScore - aScore;
      }
      
      // Finally sort by name
      return a.name.localeCompare(b.name, 'fa');
    });
  }
};

// Export all utilities
export { FilterEngine as default };