// Types اصلی برای ماژول Definition Editor

// نوع داده برای نودهای تعاریف (جایگزین GeoNode)
export interface DefinitionNode {
  id: string;
  name: string;
  level: number;
  parentId?: string;
  description?: string;
  coordinates?: { lat: number; lng: number };
  country?: string;
  natoEquivalent?: string;
  icon?: string;
  specialty?: string;
  children?: DefinitionNode[];
  customFields?: Record<string, any>;
  metadata?: {
    tags?: string[];
    priority?: number;
    isTemplate?: boolean;
  };
}

// نوع داده برای سطوح سلسله‌مراتبی (گسترش یافته)
export interface ExtendedHierarchyLevel {
  id: string;
  name: string;
  englishName: string;
  order: number;
  isRequired: boolean;
  isActive: boolean;
  icon?: string;
  natoRank?: string;
  standardCode?: string;
  personnelRange?: string;
  specialty?: string;
  customFields?: Record<string, any>;
}

// نوع داده برای فیلترهای جستجو
export interface SearchFilters {
  query: string;
  searchIn: 'name' | 'description' | 'both';
  levelRange: [number, number];
  hasChildren: 'all' | 'with' | 'without';
  hasCoordinates: 'all' | 'with' | 'without';
  country: string;
  hasNatoEquivalent: 'all' | 'with' | 'without';
  nodeType: 'all' | 'countries' | 'ranks';
  specialty: string;
  icon: string;
}

// نوع داده برای validation
export interface FormErrors {
  name?: string;
  level?: string;
  coordinates?: string;
  description?: string;
  country?: string;
  natoEquivalent?: string;
  icon?: string;
  specialty?: string;
}

// نوع داده برای validation سطوح
export interface LevelFormErrors {
  name?: string;
  englishName?: string;
  order?: string;
  icon?: string;
  natoRank?: string;
  standardCode?: string;
  personnelRange?: string;
}

// نوع داده برای فرم نود
export interface NodeFormData {
  name: string;
  level: number;
  parentId?: string;
  description?: string;
  coordinates?: { lat: number; lng: number };
  country?: string;
  natoEquivalent?: string;
  icon?: string;
  specialty?: string;
}

// نوع داده برای فرم سطح
export interface LevelFormData {
  name: string;
  englishName: string;
  order: number;
  isRequired: boolean;
  isActive: boolean;
  icon?: string;
  natoRank?: string;
  standardCode?: string;
  personnelRange?: string;
  specialty?: string;
}

// نوع داده برای فرم ورود
export interface ImportFormData {
  file: File | null;
  categoryId: string;
  overwrite: boolean;
  validateOnly: boolean;
}

// Enums
export enum CategoryType {
  GEOGRAPHICAL = 'geographical',
  MILITARY_RANKS = 'military_ranks',
  MILITARY_UNITS = 'unit_structures',
  EQUIPMENT = 'equipment',
  MISSION_TYPE = 'mission_type',
  OPERATIONAL_STATUS = 'operational_status',
  OPERATIONAL_ENVIRONMENT = 'operational_environment',
  TIME_DEFINITIONS = 'time_definitions',
  CODING_CLASSIFICATION = 'coding_classification',
  FORCE_TYPE = 'force_type',
  ORGANIZATIONAL_AFFILIATION = 'organizational_affiliation',
  THREAT_TYPE = 'threat_type',
  INFO_CLASSIFICATION = 'info_classification',
  LOGISTICS_STATUS = 'logistics_status',
  LOGISTICS = 'logistics',
  AMMUNITION = 'ammunition',
  WEATHER = 'weather',
  PERSONS = 'persons'
}

export enum ViewMode {
  TREE = 'tree',
  GRAPH = 'graph'
}

export enum TreeDisplayMode {
  HIERARCHY = 'hierarchy',
  LEVEL = 'level'
}

// نوع داده برای دسته‌بندی
export interface DefinitionCategory {
  id: string;
  name: string;
  englishName: string;
  description?: string;
  icon?: string;
  color?: string;
  maxLevels: number;
  isActive: boolean;
  order: number;
  type: CategoryType;
}

// نوع داده برای تنظیمات گراف
export interface GraphConfig {
  nodeShape: 'circle' | 'square' | 'star' | 'triangle';
  nodeColor: string;
  edgeStyle: 'solid' | 'dashed' | 'dotted';
  layout: 'hierarchical' | 'tree' | 'force' | 'circular';
  showLabels: boolean;
  showTooltips: boolean;
  nodeSize: number;
  edgeWidth: number;
}

// نوع داده برای نود گراف
export interface GraphNode {
  id: string;
  label: string;
  data: DefinitionNode;
  position?: { x: number; y: number };
  style?: Record<string, any>;
}

// نوع داده برای لبه گراف
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  style?: Record<string, any>;
}

// نوع داده برای رندر نود
export type NodeRenderer = (node: DefinitionNode) => React.ReactElement;

// نوع داده برای استراتژی دسته‌بندی
export interface CategoryStrategy {
  getGraphConfig(): GraphConfig;
  getNodeData(categoryId: string): DefinitionNode[];
  getNodeRenderer(): NodeRenderer;
  getDefaultFilters(): SearchFilters;
  validateNode(node: Partial<DefinitionNode>): FormErrors;
  validateLevel(level: Partial<ExtendedHierarchyLevel>): LevelFormErrors;
  filterNode(node: DefinitionNode, filters: SearchFilters): boolean;
  handleNodeClick(node: DefinitionNode): void;
  handleNodeEdit(node: DefinitionNode): void;
  handleNodeDelete(node: DefinitionNode): void;
  normalizeNode(node: DefinitionNode): DefinitionNode;
}

// نوع داده برای state اصلی
export interface DefinitionEditorState {
  nodesByCategory: Record<string, DefinitionNode[]>;
  levelsByCategory: Record<string, ExtendedHierarchyLevel[]>;
  filters: SearchFilters;
  viewMode: ViewMode;
  treeDisplayMode: TreeDisplayMode;
  selectedNode: DefinitionNode | null;
  expandedNodes: string[];
  highlightedNodes: string[];
  loadingStatus: 'idle' | 'fetching' | 'mutating' | 'error';
  error: string | null;
  currentCategory: DefinitionCategory | null;
  // اضافه کردن state های جدید برای UI
  showCategories: boolean;
  showDefinitions: boolean;
  searchTerm: string;
  selectedStatus: string;
  selectedCategoryFilter: string;
  selectedItems: string[];
  sortOption: string;
}

// نوع داده برای API responses
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Export types گراف
export * from './graph';
