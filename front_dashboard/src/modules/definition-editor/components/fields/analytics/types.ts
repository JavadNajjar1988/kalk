// Field Analytics System - Core Types and Interfaces

export interface FieldUsageEvent {
  id: string;
  fieldId: string;
  eventType: FieldEventType;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  formId?: string;
  value?: any;
  metadata?: Record<string, any>;
}

export enum FieldEventType {
  // Basic interactions
  FOCUS = 'focus',
  BLUR = 'blur',
  CHANGE = 'change',
  INPUT = 'input',
  
  // Form events
  SUBMIT = 'submit',
  RESET = 'reset',
  VALIDATE = 'validate',
  
  // Management events
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  COPY = 'copy',
  MOVE = 'move',
  
  // User interactions
  VIEW = 'view',
  EDIT = 'edit',
  SEARCH = 'search',
  FILTER = 'filter',
  
  // Performance events
  RENDER = 'render',
  ERROR = 'error',
  WARNING = 'warning'
}

export interface FieldAnalytics {
  fieldId: string;
  fieldName: string;
  fieldType: string;
  
  // Usage statistics
  totalEvents: number;
  uniqueUsers: number;
  totalSessions: number;
  
  // Time-based metrics
  firstUsed: Date;
  lastUsed: Date;
  averageSessionDuration: number;
  
  // Interaction metrics
  focusCount: number;
  changeCount: number;
  validationErrors: number;
  completionRate: number;
  
  // Performance metrics
  averageRenderTime: number;
  errorRate: number;
  
  // Trend data
  dailyUsage: Array<{ date: Date; count: number }>;
  popularValues: Array<{ value: string; count: number }>;
  
  // User behavior
  dropOffRate: number;
  timeToComplete: number;
  mostCommonErrors: Array<{ error: string; count: number }>;
}

export interface GlobalAnalytics {
  totalFields: number;
  activeFields: number;
  totalEvents: number;
  uniqueUsers: number;
  
  // Time ranges
  timeRange: {
    start: Date;
    end: Date;
  };
  
  // Field type distribution
  fieldTypeDistribution: Array<{ type: string; count: number; percentage: number }>;
  
  // Usage trends
  usageTrends: Array<{ date: Date; events: number; users: number }>;
  
  // Top performing fields
  topFields: Array<{
    fieldId: string;
    name: string;
    type: string;
    score: number;
    totalEvents: number;
  }>;
  
  // Problem areas
  problemFields: Array<{
    fieldId: string;
    name: string;
    type: string;
    issues: string[];
    severity: 'low' | 'medium' | 'high';
  }>;
  
  // Performance metrics
  performance: {
    averageRenderTime: number;
    averageResponseTime: number;
    errorRate: number;
    crashRate: number;
  };
}

export interface AnalyticsQuery {
  fieldIds?: string[];
  eventTypes?: FieldEventType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  userIds?: string[];
  formIds?: string[];
  limit?: number;
  offset?: number;
  groupBy?: 'hour' | 'day' | 'week' | 'month';
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max';
}

export interface AnalyticsFilters {
  timeRange: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  customRange?: {
    start: Date;
    end: Date;
  };
  fieldTypes: string[];
  categories: string[];
  userSegments: string[];
  includeInactive: boolean;
}

export interface AnalyticsDashboardConfig {
  widgets: AnalyticsWidget[];
  layout: 'grid' | 'masonry' | 'flow';
  refreshInterval: number;
  exportFormats: ('pdf' | 'excel' | 'csv' | 'json')[];
  notifications: {
    enabled: boolean;
    thresholds: Record<string, number>;
    channels: string[];
  };
}

export interface AnalyticsWidget {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  size: 'small' | 'medium' | 'large' | 'xlarge';
  position: { x: number; y: number };
  config: WidgetConfig;
  dataSource: AnalyticsQuery;
  refreshRate: number;
  visible: boolean;
}

export enum WidgetType {
  // Chart widgets
  LINE_CHART = 'line_chart',
  BAR_CHART = 'bar_chart',
  PIE_CHART = 'pie_chart',
  AREA_CHART = 'area_chart',
  SCATTER_PLOT = 'scatter_plot',
  HEATMAP = 'heatmap',
  
  // Data widgets
  KPI_CARD = 'kpi_card',
  DATA_TABLE = 'data_table',
  METRIC_GRID = 'metric_grid',
  PROGRESS_BAR = 'progress_bar',
  
  // Specialized widgets
  FIELD_HEALTH = 'field_health',
  USER_JOURNEY = 'user_journey',
  ERROR_TRACKER = 'error_tracker',
  PERFORMANCE_MONITOR = 'performance_monitor',
  TREND_INDICATOR = 'trend_indicator'
}

export interface WidgetConfig {
  // Chart configuration
  chartType?: string;
  xAxis?: string;
  yAxis?: string;
  colorScheme?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  
  // Data configuration
  metrics?: string[];
  dimensions?: string[];
  filters?: Record<string, any>;
  sorting?: { field: string; direction: 'asc' | 'desc' };
  
  // Display configuration
  showTitle?: boolean;
  showDescription?: boolean;
  showExport?: boolean;
  showRefresh?: boolean;
  
  // Threshold configuration
  thresholds?: Array<{
    value: number;
    color: string;
    label: string;
  }>;
}

export interface FieldHealthScore {
  fieldId: string;
  overall: number; // 0-100
  usability: number;
  performance: number;
  reliability: number;
  adoption: number;
  
  factors: Array<{
    name: string;
    score: number;
    weight: number;
    description: string;
  }>;
  
  recommendations: Array<{
    type: 'improvement' | 'warning' | 'optimization';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    actionItems: string[];
  }>;
}

export interface UserJourney {
  sessionId: string;
  userId?: string;
  startTime: Date;
  endTime: Date;
  steps: Array<{
    fieldId: string;
    action: FieldEventType;
    timestamp: Date;
    duration: number;
    success: boolean;
    errors?: string[];
  }>;
  
  metrics: {
    totalTime: number;
    fieldsCompleted: number;
    fieldsAbandoned: number;
    errorCount: number;
    completionRate: number;
  };
  
  pathAnalysis: {
    commonPath: boolean;
    deviations: string[];
    bottlenecks: string[];
  };
}