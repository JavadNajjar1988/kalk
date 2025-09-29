import { FieldSearchFilter, SortOption } from './FieldSearchFilterPanel';

export interface SearchableField {
  id: string;
  name: string;
  type: string;
  category: string;
  description?: string;
  status: 'active' | 'inactive' | 'draft' | 'archived';
  hasValidation: boolean;
  hasDependencies: boolean;
  complexity: number; // 1-10 scale
  tags: string[];
  favorite: boolean;
  created: Date;
  modified: Date;
  properties: Record<string, any>;
  metadata: Record<string, any>;
}

export interface SearchResult {
  fields: SearchableField[];
  totalCount: number;
  filteredCount: number;
  searchTime: number;
  facets: {
    types: Array<{ value: string; count: number }>;
    categories: Array<{ value: string; count: number }>;
    tags: Array<{ value: string; count: number }>;
    status: Array<{ value: string; count: number }>;
  };
}

export class FieldSearchEngine {
  private static instance: FieldSearchEngine;
  private fields: SearchableField[] = [];
  private searchIndex: Map<string, Set<string>> = new Map();

  private constructor() {}

  public static getInstance(): FieldSearchEngine {
    if (!FieldSearchEngine.instance) {
      FieldSearchEngine.instance = new FieldSearchEngine();
    }
    return FieldSearchEngine.instance;
  }

  /**
   * Index fields for search
   */
  public indexFields(fields: SearchableField[]): void {
    this.fields = fields;
    this.buildSearchIndex();
  }

  /**
   * Build search index for fast text search
   */
  private buildSearchIndex(): void {
    this.searchIndex.clear();

    this.fields.forEach(field => {
      const tokens = new Set<string>();
      
      // Index basic properties
      this.tokenize(field.name).forEach(token => tokens.add(token));
      this.tokenize(field.type).forEach(token => tokens.add(token));
      this.tokenize(field.category).forEach(token => tokens.add(token));
      this.tokenize(field.description || '').forEach(token => tokens.add(token));
      
      // Index tags
      field.tags.forEach(tag => {
        this.tokenize(tag).forEach(token => tokens.add(token));
      });

      // Index properties
      Object.entries(field.properties).forEach(([key, value]) => {
        this.tokenize(key).forEach(token => tokens.add(token));
        this.tokenize(String(value)).forEach(token => tokens.add(token));
      });

      // Index metadata
      Object.entries(field.metadata).forEach(([key, value]) => {
        this.tokenize(key).forEach(token => tokens.add(token));
        this.tokenize(String(value)).forEach(token => tokens.add(token));
      });

      this.searchIndex.set(field.id, tokens);
    });
  }

  /**
   * Tokenize text for search
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  /**
   * Search and filter fields
   */
  public search(filter: FieldSearchFilter, sort: SortOption): SearchResult {
    const startTime = Date.now();
    
    let results = [...this.fields];

    // Apply text search
    if (filter.searchTerm.trim()) {
      results = this.applyTextSearch(results, filter.searchTerm);
    }

    // Apply filters
    results = this.applyFilters(results, filter);

    // Apply sorting
    results = this.applySorting(results, sort);

    // Calculate facets
    const facets = this.calculateFacets(results);

    const searchTime = Date.now() - startTime;

    return {
      fields: results,
      totalCount: this.fields.length,
      filteredCount: results.length,
      searchTime,
      facets
    };
  }

  /**
   * Apply text search using index
   */
  private applyTextSearch(fields: SearchableField[], searchTerm: string): SearchableField[] {
    const searchTokens = this.tokenize(searchTerm);
    
    if (searchTokens.length === 0) {
      return fields;
    }

    return fields.filter(field => {
      const fieldTokens = this.searchIndex.get(field.id) || new Set();
      
      // Check if all search tokens match at least one field token
      return searchTokens.every(searchToken => {
        return Array.from(fieldTokens).some(fieldToken => 
          fieldToken.includes(searchToken) || searchToken.includes(fieldToken)
        );
      });
    });
  }

  /**
   * Apply filters
   */
  private applyFilters(fields: SearchableField[], filter: FieldSearchFilter): SearchableField[] {
    return fields.filter(field => {
      // Field type filter
      if (filter.fieldType.length > 0 && !filter.fieldType.includes(field.type)) {
        return false;
      }

      // Category filter
      if (filter.category.length > 0 && !filter.category.includes(field.category)) {
        return false;
      }

      // Status filter
      if (filter.status.length > 0 && !filter.status.includes(field.status)) {
        return false;
      }

      // Validation filter
      if (filter.hasValidation !== null && field.hasValidation !== filter.hasValidation) {
        return false;
      }

      // Dependencies filter
      if (filter.hasDependencies !== null && field.hasDependencies !== filter.hasDependencies) {
        return false;
      }

      // Complexity filter
      if (field.complexity < filter.complexity[0] || field.complexity > filter.complexity[1]) {
        return false;
      }

      // Tags filter
      if (filter.tags.length > 0) {
        const hasMatchingTag = filter.tags.some(tag => field.tags.includes(tag));
        if (!hasMatchingTag) {
          return false;
        }
      }

      // Favorite filter
      if (filter.favorite !== null && field.favorite !== filter.favorite) {
        return false;
      }

      // Date range filter
      if (filter.dateRange.start && field.created < filter.dateRange.start) {
        return false;
      }
      if (filter.dateRange.end && field.created > filter.dateRange.end) {
        return false;
      }

      return true;
    });
  }

  /**
   * Apply sorting
   */
  private applySorting(fields: SearchableField[], sort: SortOption): SearchableField[] {
    return fields.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sort.field) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'type':
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'created':
          aValue = a.created.getTime();
          bValue = b.created.getTime();
          break;
        case 'modified':
          aValue = a.modified.getTime();
          bValue = b.modified.getTime();
          break;
        case 'complexity':
          aValue = a.complexity;
          bValue = b.complexity;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) {
        return sort.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sort.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  /**
   * Calculate facets for filtered results
   */
  private calculateFacets(fields: SearchableField[]) {
    const types = new Map<string, number>();
    const categories = new Map<string, number>();
    const tags = new Map<string, number>();
    const status = new Map<string, number>();

    fields.forEach(field => {
      // Count types
      types.set(field.type, (types.get(field.type) || 0) + 1);

      // Count categories
      categories.set(field.category, (categories.get(field.category) || 0) + 1);

      // Count status
      status.set(field.status, (status.get(field.status) || 0) + 1);

      // Count tags
      field.tags.forEach(tag => {
        tags.set(tag, (tags.get(tag) || 0) + 1);
      });
    });

    return {
      types: Array.from(types.entries()).map(([value, count]) => ({ value, count })),
      categories: Array.from(categories.entries()).map(([value, count]) => ({ value, count })),
      tags: Array.from(tags.entries()).map(([value, count]) => ({ value, count })),
      status: Array.from(status.entries()).map(([value, count]) => ({ value, count }))
    };
  }

  /**
   * Get search suggestions
   */
  public getSuggestions(query: string, limit: number = 10): string[] {
    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) {
      return [];
    }

    const suggestions = new Set<string>();
    const lastToken = queryTokens[queryTokens.length - 1];

    // Find matching tokens from index
    this.searchIndex.forEach(tokens => {
      tokens.forEach(token => {
        if (token.startsWith(lastToken) && token !== lastToken) {
          // Reconstruct suggestion
          const suggestionTokens = [...queryTokens.slice(0, -1), token];
          suggestions.add(suggestionTokens.join(' '));
        }
      });
    });

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Get popular tags
   */
  public getPopularTags(limit: number = 20): Array<{ tag: string; count: number }> {
    const tagCounts = new Map<string, number>();

    this.fields.forEach(field => {
      field.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get field statistics
   */
  public getStatistics() {
    const stats = {
      totalFields: this.fields.length,
      fieldsByType: new Map<string, number>(),
      fieldsByCategory: new Map<string, number>(),
      fieldsByStatus: new Map<string, number>(),
      averageComplexity: 0,
      mostUsedTags: this.getPopularTags(10)
    };

    let totalComplexity = 0;

    this.fields.forEach(field => {
      // Count by type
      stats.fieldsByType.set(field.type, (stats.fieldsByType.get(field.type) || 0) + 1);

      // Count by category
      stats.fieldsByCategory.set(field.category, (stats.fieldsByCategory.get(field.category) || 0) + 1);

      // Count by status
      stats.fieldsByStatus.set(field.status, (stats.fieldsByStatus.get(field.status) || 0) + 1);

      // Sum complexity
      totalComplexity += field.complexity;
    });

    stats.averageComplexity = this.fields.length > 0 ? totalComplexity / this.fields.length : 0;

    return stats;
  }

  /**
   * Export search results
   */
  public exportResults(fields: SearchableField[], format: 'csv' | 'json' = 'json'): string {
    if (format === 'csv') {
      const headers = ['ID', 'Name', 'Type', 'Category', 'Status', 'Complexity', 'Tags', 'Created', 'Modified'];
      const rows = fields.map(field => [
        field.id,
        field.name,
        field.type,
        field.category,
        field.status,
        field.complexity.toString(),
        field.tags.join(';'),
        field.created.toISOString(),
        field.modified.toISOString()
      ]);

      return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    } else {
      return JSON.stringify(fields, null, 2);
    }
  }

  /**
   * Clear search index
   */
  public clearIndex(): void {
    this.fields = [];
    this.searchIndex.clear();
  }
}

export default FieldSearchEngine;