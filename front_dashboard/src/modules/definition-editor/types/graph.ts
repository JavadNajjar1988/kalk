// Types برای کامپوننت‌های گراف در ماژول definition-editor

// نوع داده برای نودهای گراف (همان GeoNode)
export interface GeoNode {
  id: string;
  name: string;
  level: number;
  parentId?: string;
  coordinates?: { lat: number; lng: number };
  description?: string;
  children?: GeoNode[];
}

// نوع داده برای دسته‌بندی تعاریف
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
  type?: string;
}

// نوع داده برای تعاریف اصلی
export interface MasterDefinition {
  id: string;
  name: string;
  englishName: string;
  description?: string;
  category: DefinitionCategory;
  parentId?: string;
  level: number;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  specialty?: string;
  customFields?: Record<string, any>;
  metadata?: {
    tags?: string[];
    priority?: number;
    isTemplate?: boolean;
  };
  children?: MasterDefinition[];
}

// نوع داده برای سطوح سلسله‌مراتبی پویا
export interface DynamicHierarchyLevel {
  id: string;
  categoryId: string;
  name: string;
  englishName: string;
  order: number;
  isRequired: boolean;
  isActive: boolean;
  customFields?: Record<string, any>;
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    required?: boolean;
  };
}

// Props برای GraphToolbar
export interface GraphToolbarProps {
  // Layout controls
  onLayoutChange: (direction: 'TB' | 'LR') => void;
  
  // Resize controls
  isResizeEnabled: boolean;
  onResizeToggle: () => void;
  
  // Selection controls
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onDeleteSelected?: () => void;
  onCopySelected?: () => void;
  onPasteClipboard?: () => void;
  
  // Appearance controls
  onToggleConnections?: () => void;
  onChangeColor?: () => void;
  edgeType?: 'smoothstep' | 'straight' | 'step';
  onChangeEdgeType?: () => void;
  
  // Filter controls
  onToggleFilter?: () => void;
  onSearch?: () => void;
  
  // View controls
  isFocusedView?: boolean;
  onToggleView?: () => void;
  
  // Settings
  onSettings?: () => void;
  onGroupSelected?: () => void;
  onToggleLock?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  
  // Test controls
  onTestCopyPaste?: () => void;
}

// Props برای Breadcrumb
export interface BreadcrumbProps {
  selectedNode: GeoNode | null;
  data: GeoNode[];
  onNodeSelect: (node: GeoNode | null) => void;
}

// Props برای ZoomControls
export interface ZoomControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
}

// Props برای SimpleGraphViewer
export interface SimpleGraphViewerProps {
  data: GeoNode[];
  selectedNode?: GeoNode | null;
  onNodeSelect?: (node: GeoNode | null) => void;
  onNodeEdit?: (node: GeoNode) => void;
  getLevelName?: (level: number) => string;
  onGraphChange?: (newGeoData: GeoNode[]) => void;
}
