import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FieldAnalyticsEngine 
} from './FieldAnalyticsEngine';
import { 
  FieldAnalytics, 
  GlobalAnalytics, 
  FieldUsageEvent, 
  FieldEventType,
  AnalyticsQuery,
  FieldHealthScore
} from './types';

interface UseFieldAnalyticsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  defaultFieldIds?: string[];
}

interface UseFieldAnalyticsReturn {
  // Data
  globalAnalytics: GlobalAnalytics | null;
  fieldAnalytics: FieldAnalytics[];
  isLoading: boolean;
  lastUpdated: Date | null;
  
  // Methods
  refresh: () => Promise<void>;
  trackEvent: (event: Omit<FieldUsageEvent, 'id' | 'timestamp'>) => void;
  getFieldAnalytics: (fieldId: string) => FieldAnalytics | null;
  getFieldHealth: (fieldId: string) => FieldHealthScore | null;
  queryEvents: (query: AnalyticsQuery) => FieldUsageEvent[];
  exportData: (format: 'json' | 'csv', query?: AnalyticsQuery) => string;
  
  // State management
  setFieldIds: (fieldIds: string[]) => void;
  fieldIds: string[];
}

export const useFieldAnalytics = (
  options: UseFieldAnalyticsOptions = {}
): UseFieldAnalyticsReturn => {
  const {
    autoRefresh = true,
    refreshInterval = 30000,
    defaultFieldIds = []
  } = options;

  const analyticsEngine = useMemo(() => FieldAnalyticsEngine.getInstance(), []);
  
  const [globalAnalytics, setGlobalAnalytics] = useState<GlobalAnalytics | null>(null);
  const [fieldAnalytics, setFieldAnalytics] = useState<FieldAnalytics[]>([]);
  const [fieldIds, setFieldIds] = useState<string[]>(defaultFieldIds);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load global analytics
      const global = analyticsEngine.getGlobalAnalytics();
      setGlobalAnalytics(global);

      // Load field-specific analytics
      const fieldData = fieldIds.map(fieldId => 
        analyticsEngine.getFieldAnalytics(fieldId)
      );
      setFieldAnalytics(fieldData);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [analyticsEngine, fieldIds]);

  // Initial load and auto-refresh
  useEffect(() => {
    loadAnalytics();
    
    if (autoRefresh) {
      const interval = setInterval(loadAnalytics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [loadAnalytics, autoRefresh, refreshInterval]);

  // Track a field usage event
  const trackEvent = useCallback((event: Omit<FieldUsageEvent, 'id' | 'timestamp'>) => {
    analyticsEngine.trackEvent(event);
  }, [analyticsEngine]);

  // Get analytics for a specific field
  const getFieldAnalytics = useCallback((fieldId: string): FieldAnalytics | null => {
    return fieldAnalytics.find(fa => fa.fieldId === fieldId) || null;
  }, [fieldAnalytics]);

  // Calculate field health score
  const getFieldHealth = useCallback((fieldId: string): FieldHealthScore | null => {
    try {
      return analyticsEngine.calculateFieldHealth(fieldId);
    } catch (error) {
      console.error('Failed to calculate field health:', error);
      return null;
    }
  }, [analyticsEngine]);

  // Query events with filters
  const queryEvents = useCallback((query: AnalyticsQuery): FieldUsageEvent[] => {
    return analyticsEngine.queryEvents(query);
  }, [analyticsEngine]);

  // Export analytics data
  const exportData = useCallback((format: 'json' | 'csv', query?: AnalyticsQuery): string => {
    return analyticsEngine.exportData(format, query);
  }, [analyticsEngine]);

  // Manual refresh
  const refresh = useCallback(async () => {
    await loadAnalytics();
  }, [loadAnalytics]);

  return {
    // Data
    globalAnalytics,
    fieldAnalytics,
    isLoading,
    lastUpdated,
    
    // Methods
    refresh,
    trackEvent,
    getFieldAnalytics,
    getFieldHealth,
    queryEvents,
    exportData,
    
    // State management
    setFieldIds,
    fieldIds
  };
};

// Custom hook for tracking field interactions
export const useFieldTracking = (fieldId: string, userId?: string, sessionId?: string) => {
  const analyticsEngine = useMemo(() => FieldAnalyticsEngine.getInstance(), []);
  
  const trackFocus = useCallback(() => {
    analyticsEngine.trackEvent({
      fieldId,
      eventType: FieldEventType.FOCUS,
      userId,
      sessionId
    });
  }, [analyticsEngine, fieldId, userId, sessionId]);

  const trackBlur = useCallback(() => {
    analyticsEngine.trackEvent({
      fieldId,
      eventType: FieldEventType.BLUR,
      userId,
      sessionId
    });
  }, [analyticsEngine, fieldId, userId, sessionId]);

  const trackChange = useCallback((value?: any) => {
    analyticsEngine.trackEvent({
      fieldId,
      eventType: FieldEventType.CHANGE,
      userId,
      sessionId,
      value
    });
  }, [analyticsEngine, fieldId, userId, sessionId]);

  const trackError = useCallback((error: string) => {
    analyticsEngine.trackEvent({
      fieldId,
      eventType: FieldEventType.ERROR,
      userId,
      sessionId,
      metadata: { error }
    });
  }, [analyticsEngine, fieldId, userId, sessionId]);

  return {
    trackFocus,
    trackBlur,
    trackChange,
    trackError
  };
};

export default useFieldAnalytics;