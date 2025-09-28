// Feature Flags System for Gradual Migration
// سیستم پرچم‌های ویژگی برای مهاجرت تدریجی

interface FeatureFlags {
  // Field Constructor System flags
  fieldConstructorEnabled: boolean;
  fieldConstructorComponents: {
    arrayInput: boolean;
    compositeInput: boolean;
    hierarchicalInput: boolean;
    virtualizedList: boolean;
    performanceMonitor: boolean;
  };
  fieldConstructorMigration: {
    autoConvertLegacy: boolean;
    showMigrationWizard: boolean;
    allowHybridMode: boolean;
    enableTemplateImportExport: boolean;
  };
  
  // Performance flags
  enableVirtualization: boolean;
  enableLazyLoading: boolean;
  enableMemoization: boolean;
  
  // UI flags
  showAdvancedOptions: boolean;
  enableBetaFeatures: boolean;
  debugMode: boolean;
}

type FeatureFlagKey = keyof FeatureFlags | string;

class FeatureFlagManager {
  private flags: FeatureFlags;
  private listeners: Map<string, ((value: boolean) => void)[]> = new Map();
  
  constructor() {
    // Default feature flags
    this.flags = {
      fieldConstructorEnabled: this.getStoredFlag('fieldConstructorEnabled', true),
      fieldConstructorComponents: {
        arrayInput: this.getStoredFlag('fieldConstructorComponents.arrayInput', true),
        compositeInput: this.getStoredFlag('fieldConstructorComponents.compositeInput', true),
        hierarchicalInput: this.getStoredFlag('fieldConstructorComponents.hierarchicalInput', true),
        virtualizedList: this.getStoredFlag('fieldConstructorComponents.virtualizedList', false),
        performanceMonitor: this.getStoredFlag('fieldConstructorComponents.performanceMonitor', false)
      },
      fieldConstructorMigration: {
        autoConvertLegacy: this.getStoredFlag('fieldConstructorMigration.autoConvertLegacy', false),
        showMigrationWizard: this.getStoredFlag('fieldConstructorMigration.showMigrationWizard', true),
        allowHybridMode: this.getStoredFlag('fieldConstructorMigration.allowHybridMode', true),
        enableTemplateImportExport: this.getStoredFlag('fieldConstructorMigration.enableTemplateImportExport', true)
      },
      enableVirtualization: this.getStoredFlag('enableVirtualization', false),
      enableLazyLoading: this.getStoredFlag('enableLazyLoading', false),
      enableMemoization: this.getStoredFlag('enableMemoization', true),
      showAdvancedOptions: this.getStoredFlag('showAdvancedOptions', false),
      enableBetaFeatures: this.getStoredFlag('enableBetaFeatures', false),
      debugMode: this.getStoredFlag('debugMode', process.env.NODE_ENV === 'development')
    };
    
    // Load environment-specific overrides
    this.loadEnvironmentOverrides();
  }
  
  private getStoredFlag(key: string, defaultValue: boolean): boolean {
    try {
      const stored = localStorage.getItem(`featureFlag_${key}`);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }
  
  private setStoredFlag(key: string, value: boolean): void {
    try {
      localStorage.setItem(`featureFlag_${key}`, JSON.stringify(value));
    } catch {
      // Ignore storage errors
    }
  }
  
  private loadEnvironmentOverrides(): void {
    // Development environment overrides
    if (process.env.NODE_ENV === 'development') {
      this.flags.debugMode = true;
      this.flags.fieldConstructorComponents.performanceMonitor = true;
    }
    
    // Production environment overrides
    if (process.env.NODE_ENV === 'production') {
      this.flags.debugMode = false;
      this.flags.enableBetaFeatures = false;
    }
    
    // Environment variable overrides
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      
      // Allow URL parameter overrides for testing
      if (urlParams.get('fieldConstructor') === 'false') {
        this.flags.fieldConstructorEnabled = false;
      }
      if (urlParams.get('virtualization') === 'true') {
        this.flags.enableVirtualization = true;
      }
      if (urlParams.get('debug') === 'true') {
        this.flags.debugMode = true;
      }
    }
  }
  
  /**
   * Get feature flag value
   */
  isEnabled(key: FeatureFlagKey): boolean {
    return this.getNestedValue(this.flags, key) ?? false;
  }
  
  /**
   * Set feature flag value
   */
  setFlag(key: FeatureFlagKey, value: boolean): void {
    this.setNestedValue(this.flags, key, value);
    this.setStoredFlag(key, value);
    this.notifyListeners(key, value);
  }
  
  /**
   * Toggle feature flag
   */
  toggle(key: FeatureFlagKey): boolean {
    const currentValue = this.isEnabled(key);
    const newValue = !currentValue;
    this.setFlag(key, newValue);
    return newValue;
  }
  
  /**
   * Get all flags
   */
  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }
  
  /**
   * Reset all flags to defaults
   */
  resetToDefaults(): void {
    Object.keys(this.flags).forEach(key => {
      localStorage.removeItem(`featureFlag_${key}`);
    });
    
    // Reload the page to apply defaults
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }
  
  /**
   * Subscribe to flag changes
   */
  subscribe(key: FeatureFlagKey, callback: (value: boolean) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    
    this.listeners.get(key)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(key);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }
  
  /**
   * Get migration phase based on flags
   */
  getMigrationPhase(): 'legacy' | 'hybrid' | 'constructor' | 'full' {
    if (!this.flags.fieldConstructorEnabled) {
      return 'legacy';
    }
    
    if (this.flags.fieldConstructorMigration.allowHybridMode) {
      return 'hybrid';
    }
    
    const allConstructorComponentsEnabled = Object.values(this.flags.fieldConstructorComponents)
      .every(flag => flag);
    
    if (allConstructorComponentsEnabled) {
      return 'full';
    }
    
    return 'constructor';
  }
  
  /**
   * Check if feature should be gradually rolled out
   */
  shouldEnableForUser(key: FeatureFlagKey, userId?: string, rolloutPercentage: number = 100): boolean {
    if (!this.isEnabled(key)) {
      return false;
    }
    
    if (rolloutPercentage >= 100) {
      return true;
    }
    
    if (!userId) {
      return Math.random() * 100 < rolloutPercentage;
    }
    
    // Consistent hash-based rollout
    const hash = this.hashCode(userId + key);
    return (hash % 100) < rolloutPercentage;
  }
  
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }
  
  private notifyListeners(key: string, value: boolean): void {
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.forEach(callback => callback(value));
    }
  }
  
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

// Global feature flag manager instance
export const featureFlags = new FeatureFlagManager();

// React hooks for feature flags
import { useState, useEffect } from 'react';

export function useFeatureFlag(key: FeatureFlagKey): boolean {
  const [isEnabled, setIsEnabled] = useState(() => featureFlags.isEnabled(key));
  
  useEffect(() => {
    const unsubscribe = featureFlags.subscribe(key, setIsEnabled);
    return unsubscribe;
  }, [key]);
  
  return isEnabled;
}

export function useFeatureFlags(): FeatureFlags {
  const [flags, setFlags] = useState(() => featureFlags.getAllFlags());
  
  useEffect(() => {
    // Subscribe to all flag changes
    const unsubscribers: (() => void)[] = [];
    
    const updateFlags = () => setFlags(featureFlags.getAllFlags());
    
    // Subscribe to major flag groups
    const majorFlags = [
      'fieldConstructorEnabled',
      'enableVirtualization',
      'enableLazyLoading',
      'debugMode'
    ];
    
    majorFlags.forEach(key => {
      const unsubscribe = featureFlags.subscribe(key, updateFlags);
      unsubscribers.push(unsubscribe);
    });
    
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, []);
  
  return flags;
}

export function useMigrationPhase(): 'legacy' | 'hybrid' | 'constructor' | 'full' {
  const fieldConstructorEnabled = useFeatureFlag('fieldConstructorEnabled');
  const allowHybridMode = useFeatureFlag('fieldConstructorMigration.allowHybridMode');
  
  const [phase, setPhase] = useState(() => featureFlags.getMigrationPhase());
  
  useEffect(() => {
    setPhase(featureFlags.getMigrationPhase());
  }, [fieldConstructorEnabled, allowHybridMode]);
  
  return phase;
}

// Development tools
export const FeatureFlagDevTools = {
  /**
   * Enable all Field Constructor features
   */
  enableAllFieldConstructor: () => {
    featureFlags.setFlag('fieldConstructorEnabled', true);
    featureFlags.setFlag('fieldConstructorComponents.arrayInput', true);
    featureFlags.setFlag('fieldConstructorComponents.compositeInput', true);
    featureFlags.setFlag('fieldConstructorComponents.hierarchicalInput', true);
    featureFlags.setFlag('fieldConstructorComponents.virtualizedList', true);
    featureFlags.setFlag('fieldConstructorComponents.performanceMonitor', true);
    featureFlags.setFlag('fieldConstructorMigration.enableTemplateImportExport', true);
  },
  
  /**
   * Enable performance features
   */
  enablePerformanceFeatures: () => {
    featureFlags.setFlag('enableVirtualization', true);
    featureFlags.setFlag('enableLazyLoading', true);
    featureFlags.setFlag('enableMemoization', true);
  },
  
  /**
   * Reset to safe defaults
   */
  resetToSafeDefaults: () => {
    featureFlags.setFlag('fieldConstructorEnabled', true);
    featureFlags.setFlag('fieldConstructorMigration.allowHybridMode', true);
    featureFlags.setFlag('enableVirtualization', false);
    featureFlags.setFlag('enableLazyLoading', false);
    featureFlags.setFlag('enableBetaFeatures', false);
  },
  
  /**
   * Get current migration status
   */
  getMigrationStatus: () => ({
    phase: featureFlags.getMigrationPhase(),
    flags: featureFlags.getAllFlags(),
    recommendations: [
      featureFlags.isEnabled('fieldConstructorEnabled') 
        ? '✅ Field Constructor is enabled' 
        : '❌ Field Constructor is disabled',
      featureFlags.isEnabled('fieldConstructorMigration.allowHybridMode')
        ? '✅ Hybrid mode allows gradual migration'
        : '⚠️ Hybrid mode disabled - ensure full compatibility',
      featureFlags.isEnabled('enableVirtualization')
        ? '✅ Virtualization enabled for large forms'
        : 'ℹ️ Virtualization disabled - may impact performance with large forms'
    ]
  })
};

// Make dev tools available globally in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).FeatureFlagDevTools = FeatureFlagDevTools;
  (window as any).featureFlags = featureFlags;
}

export default featureFlags;