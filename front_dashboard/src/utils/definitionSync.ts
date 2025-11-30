/**
 * Real-time synchronization system for definition-editor changes
 * This system enables automatic updates when person nodes are modified in definition-editor
 */

export type DefinitionChangeType = 'add' | 'update' | 'delete' | 'rename' | 'field_add' | 'field_update' | 'field_delete' | 'tab_add' | 'tab_update' | 'tab_delete' | 'reference_category_update';

export interface DefinitionChangeEvent {
  type: DefinitionChangeType;
  category: string; // 'persons', 'users', 'resources', etc.
  nodeId: string;
  oldData?: any;
  newData?: any;
  timestamp: number;
  // اطلاعات اضافی برای تغییرات فیلد و تب
  fieldId?: string; // برای تغییرات فیلد
  tabId?: string; // برای تغییرات تب
  changeDescription?: string; // توضیح تغییر
}

export interface SyncListener {
  id: string;
  callback: (event: DefinitionChangeEvent) => void;
  categoryFilters?: string[]; // Only listen to specific categories
  nodeFilters?: string[]; // Only listen to specific nodes
}

class DefinitionSyncManager {
  private listeners: Map<string, SyncListener> = new Map();
  private eventHistory: DefinitionChangeEvent[] = [];
  private maxHistorySize = 100;
  private watcherInterval: NodeJS.Timeout | null = null;
  private lastCheckTime: number = Date.now();

  constructor() {
    this.startWatcher();
  }

  /**
   * Register a listener for definition changes
   */
  addListener(listener: SyncListener): void {
    if (import.meta.env.DEV) console.debug(`Registering definition sync listener: ${listener.id}`);
    this.listeners.set(listener.id, listener);
  }

  /**
   * Remove a listener
   */
  removeListener(listenerId: string): void {
    if (import.meta.env.DEV) console.debug(`Removing definition sync listener: ${listenerId}`);
    this.listeners.delete(listenerId);
  }

  /**
   * Notify all relevant listeners about a definition change
   */
  notifyChange(event: DefinitionChangeEvent): void {
    if (import.meta.env.DEV) console.debug('Definition change detected:', event);
    
    // Add to history
    this.addToHistory(event);
    
    // Notify all matching listeners
    this.listeners.forEach((listener, id) => {
      if (this.shouldNotifyListener(listener, event)) {
        try {
          listener.callback(event);
        } catch (error) {
          console.error(`Error in listener ${id}:`, error);
        }
      }
    });
  }

  /**
   * Manually trigger a sync event (useful for testing or manual refreshes)
   */
  triggerSync(category: string, nodeId?: string): void {
    const event: DefinitionChangeEvent = {
      type: 'update',
      category,
      nodeId: nodeId || '*',
      timestamp: Date.now(),
      changeDescription: 'بروزرسانی دستی'
    };
    this.notifyChange(event);
  }

  /**
   * Trigger a field-specific sync event
   */
  triggerFieldSync(category: string, nodeId: string, fieldId: string, changeType: 'field_add' | 'field_update' | 'field_delete', fieldData?: any): void {
    const event: DefinitionChangeEvent = {
      type: changeType,
      category,
      nodeId,
      fieldId,
      newData: fieldData,
      timestamp: Date.now(),
      changeDescription: `تغییر فیلد ${fieldId} در ${nodeId}`
    };
    this.notifyChange(event);
  }

  /**
   * Trigger a reference category sync event
   */
  triggerReferenceCategorySync(categoryId: string, changeType: 'reference_category_update', categoryData?: any): void {
    const event: DefinitionChangeEvent = {
      type: changeType,
      category: 'reference_categories',
      nodeId: categoryId,
      newData: categoryData,
      timestamp: Date.now(),
      changeDescription: `تغییر دسته‌بندی مرجع ${categoryId}`
    };
    this.notifyChange(event);
  }

  /**
   * Trigger a tab-specific sync event
   */
  triggerTabSync(category: string, nodeId: string, tabId: string, changeType: 'tab_add' | 'tab_update' | 'tab_delete', tabData?: any): void {
    const event: DefinitionChangeEvent = {
      type: changeType,
      category,
      nodeId,
      tabId,
      newData: tabData,
      timestamp: Date.now(),
      changeDescription: `تغییر تب ${tabId} در ${nodeId}`
    };
    this.notifyChange(event);
  }

  /**
   * Get event history
   */
  getHistory(): DefinitionChangeEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  private shouldNotifyListener(listener: SyncListener, event: DefinitionChangeEvent): boolean {
    // Check category filters
    if (listener.categoryFilters && listener.categoryFilters.length > 0) {
      if (!listener.categoryFilters.includes(event.category)) {
        return false;
      }
    }

    // Check node filters
    if (listener.nodeFilters && listener.nodeFilters.length > 0) {
      if (event.nodeId !== '*' && !listener.nodeFilters.includes(event.nodeId)) {
        return false;
      }
    }

    return true;
  }

  private addToHistory(event: DefinitionChangeEvent): void {
    this.eventHistory.push(event);
    
    // Maintain history size limit
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Start watching for definition file changes
   * In a real implementation, this would use file watchers or WebSockets
   */
  private startWatcher(): void {
    if (import.meta.env.DEV) console.debug('Starting definition sync watcher...');
    
    // Simulate file watching with interval checks
    this.watcherInterval = setInterval(() => {
      this.checkForChanges();
    }, 2000); // Check every 2 seconds
  }

  /**
   * Check for changes in definition files
   * This is a simplified implementation - in production, you'd use proper file watchers
   */
  private checkForChanges(): void {
    // In a real implementation, this would:
    // 1. Check file modification timestamps
    // 2. Compare file hashes
    // 3. Use file system watchers
    // 4. Listen to WebSocket events from the definition-editor
    
    // For now, we'll implement a simple timestamp-based check
    const currentTime = Date.now();
    if (currentTime - this.lastCheckTime > 30000) { // 30 seconds
      // Simulate a periodic check
      this.lastCheckTime = currentTime;
    }
  }

  /**
   * Stop the watcher (cleanup)
   */
  destroy(): void {
    if (this.watcherInterval) {
      clearInterval(this.watcherInterval);
      this.watcherInterval = null;
    }
    this.listeners.clear();
    if (import.meta.env.DEV) console.debug('Definition sync watcher stopped');
  }
}

// Singleton instance
const definitionSyncManager = new DefinitionSyncManager();

export default definitionSyncManager;

/**
 * Hook-friendly wrapper for adding sync listeners
 */
export const useDefinitionSync = (
  listenerId: string,
  callback: (event: DefinitionChangeEvent) => void,
  categoryFilters?: string[],
  nodeFilters?: string[]
) => {
  const addListener = () => {
    definitionSyncManager.addListener({
      id: listenerId,
      callback,
      categoryFilters,
      nodeFilters
    });
  };

  const removeListener = () => {
    definitionSyncManager.removeListener(listenerId);
  };

  const triggerSync = (category: string, nodeId?: string) => {
    definitionSyncManager.triggerSync(category, nodeId);
  };

  return {
    addListener,
    removeListener,
    triggerSync,
    getHistory: () => definitionSyncManager.getHistory(),
    clearHistory: () => definitionSyncManager.clearHistory()
  };
};

/**
 * Utility function to simulate definition-editor changes (for testing)
 * بهبود یافته برای پشتیبانی از انواع مختلف تغییرات
 */
export const simulateDefinitionChange = (
  type: DefinitionChangeType,
  category: string,
  nodeId: string,
  oldData?: any,
  newData?: any,
  fieldId?: string,
  tabId?: string
) => {
  const event: DefinitionChangeEvent = {
    type,
    category,
    nodeId,
    oldData,
    newData,
    timestamp: Date.now(),
    fieldId,
    tabId,
    changeDescription: generateChangeDescription(type, nodeId, fieldId, tabId)
  };
  
  definitionSyncManager.notifyChange(event);
};

/**
 * Helper function to generate descriptive change messages
 */
function generateChangeDescription(
  type: DefinitionChangeType, 
  nodeId: string, 
  fieldId?: string, 
  tabId?: string
): string {
  const nodeDesc = nodeId === '*' ? 'همه گره‌ها' : `گره ${nodeId}`;
  
  switch (type) {
    case 'add':
      return `اضافه ${nodeDesc}`;
    case 'update':
      return `بروزرسانی ${nodeDesc}`;
    case 'delete':
      return `حذف ${nodeDesc}`;
    case 'rename':
      return `تغییر نام ${nodeDesc}`;
    case 'field_add':
      return `اضافه فیلد ${fieldId || ''} به ${nodeDesc}`;
    case 'field_update':
      return `بروزرسانی فیلد ${fieldId || ''} در ${nodeDesc}`;
    case 'field_delete':
      return `حذف فیلد ${fieldId || ''} از ${nodeDesc}`;
    case 'tab_add':
      return `اضافه تب ${tabId || ''} به ${nodeDesc}`;
    case 'tab_update':
      return `بروزرسانی تب ${tabId || ''} در ${nodeDesc}`;
    case 'tab_delete':
      return `حذف تب ${tabId || ''} از ${nodeDesc}`;
    case 'reference_category_update':
      return `بروزرسانی دسته‌بندی مرجع ${nodeId}`;
    default:
      return `تغییر ${nodeDesc}`;
  }
}

/**
 * Simulate field changes specifically
 */
export const simulateFieldChange = (
  nodeId: string,
  fieldId: string,
  changeType: 'field_add' | 'field_update' | 'field_delete',
  fieldData?: any
) => {
  simulateDefinitionChange(
    changeType,
    'persons',
    nodeId,
    null,
    fieldData,
    fieldId
  );
};

/**
 * Simulate tab changes specifically
 */
export const simulateTabChange = (
  nodeId: string,
  tabId: string,
  changeType: 'tab_add' | 'tab_update' | 'tab_delete',
  tabData?: any
) => {
  simulateDefinitionChange(
    changeType,
    'persons',
    nodeId,
    null,
    tabData,
    undefined,
    tabId
  );
};

/**
 * Simulate reference category changes
 */
export const simulateReferenceCategoryChange = (
  categoryId: string,
  categoryData?: any
) => {
  simulateDefinitionChange(
    'reference_category_update',
    'reference_categories',
    categoryId,
    null,
    categoryData
  );
};