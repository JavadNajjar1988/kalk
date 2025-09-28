/**
 * ORBAT Configuration Service
 * سرویس مدیریت تنظیمات و پیکربندی ORBAT
 */

export interface OrbatConfig {
  bridge: {
    targetOrigin: string;
    timeout: number;
    retryAttempts: number;
    enableLogging: boolean;
  };
  iframe: {
    baseUrl: string;
    defaultMode: 'chart' | 'map' | 'grid' | 'story';
    allowedModes: ('chart' | 'map' | 'grid' | 'story')[];
    enableDevTools: boolean;
  };
  data: {
    cacheEnabled: boolean;
    cacheTTL: number;
    maxCacheSize: number;
    autoRefresh: boolean;
    refreshInterval: number;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: 'en' | 'fa' | 'ar';
    rtl: boolean;
    animations: boolean;
    showLoadingStates: boolean;
  };
  features: {
    timeline: boolean;
    contextMenu: boolean;
    keyboardShortcuts: boolean;
    undoRedo: boolean;
    export: boolean;
    import: boolean;
  };
  security: {
    allowedOrigins: string[];
    enableCSP: boolean;
    sanitizeData: boolean;
  };
  performance: {
    lazyLoading: boolean;
    virtualScrolling: boolean;
    debounceTime: number;
    maxRenderItems: number;
  };
  debugging: {
    enableLogs: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    enablePerformanceMetrics: boolean;
    enableErrorReporting: boolean;
  };
}

export type ConfigPath = string;
export type ConfigValue = any;

export class OrbatConfigService {
  private config: OrbatConfig;
  private listeners = new Map<ConfigPath, Set<(value: ConfigValue) => void>>();
  private readonly storageKey = 'orbat_integration_config';

  constructor(initialConfig?: Partial<OrbatConfig>) {
    this.config = this.createDefaultConfig();
    
    // Load saved config
    this.loadFromStorage();
    
    // Apply initial config override
    if (initialConfig) {
      this.updateConfig(initialConfig);
    }
  }

  private createDefaultConfig(): OrbatConfig {
    return {
      bridge: {
        targetOrigin: 'http://localhost:5173',
        timeout: 10000,
        retryAttempts: 3,
        enableLogging: process.env.NODE_ENV === 'development'
      },
      iframe: {
        baseUrl: 'http://localhost:5173',
        defaultMode: 'chart',
        allowedModes: ['chart', 'map', 'grid', 'story'],
        enableDevTools: process.env.NODE_ENV === 'development'
      },
      data: {
        cacheEnabled: true,
        cacheTTL: 5 * 60 * 1000, // 5 minutes
        maxCacheSize: 100,
        autoRefresh: false,
        refreshInterval: 30000 // 30 seconds
      },
      ui: {
        theme: 'auto',
        language: 'fa',
        rtl: true,
        animations: true,
        showLoadingStates: true
      },
      features: {
        timeline: true,
        contextMenu: true,
        keyboardShortcuts: true,
        undoRedo: true,
        export: true,
        import: true
      },
      security: {
        allowedOrigins: ['http://localhost:5173', 'http://localhost:3000'],
        enableCSP: true,
        sanitizeData: true
      },
      performance: {
        lazyLoading: true,
        virtualScrolling: true,
        debounceTime: 300,
        maxRenderItems: 1000
      },
      debugging: {
        enableLogs: process.env.NODE_ENV === 'development',
        logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
        enablePerformanceMetrics: process.env.NODE_ENV === 'development',
        enableErrorReporting: true
      }
    };
  }

  // Get configuration value
  public get<T = ConfigValue>(path: ConfigPath): T {
    return this.getNestedValue(this.config, path) as T;
  }

  // Set configuration value
  public set(path: ConfigPath, value: ConfigValue): void {
    this.setNestedValue(this.config, path, value);
    this.saveToStorage();
    this.notifyListeners(path, value);
  }

  // Update multiple configuration values
  public updateConfig(updates: Partial<OrbatConfig>): void {
    this.config = this.deepMerge(this.config, updates);
    this.saveToStorage();
    
    // Notify all affected paths
    this.notifyAllPaths(updates);
  }

  // Get entire configuration
  public getConfig(): OrbatConfig {
    return { ...this.config };
  }

  // Reset to default configuration
  public reset(): void {
    this.config = this.createDefaultConfig();
    this.saveToStorage();
    this.notifyAllListeners();
  }

  // Subscribe to configuration changes
  public subscribe(path: ConfigPath, listener: (value: ConfigValue) => void): () => void {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set());
    }
    
    this.listeners.get(path)!.add(listener);
    
    // Call listener with current value
    listener(this.get(path));
    
    // Return unsubscribe function
    return () => {
      const pathListeners = this.listeners.get(path);
      if (pathListeners) {
        pathListeners.delete(listener);
        if (pathListeners.size === 0) {
          this.listeners.delete(path);
        }
      }
    };
  }

  // Convenience getters for common configurations
  public getBridgeConfig() {
    return this.get<OrbatConfig['bridge']>('bridge');
  }

  public getIframeConfig() {
    return this.get<OrbatConfig['iframe']>('iframe');
  }

  public getDataConfig() {
    return this.get<OrbatConfig['data']>('data');
  }

  public getUIConfig() {
    return this.get<OrbatConfig['ui']>('ui');
  }

  public getFeaturesConfig() {
    return this.get<OrbatConfig['features']>('features');
  }

  public getSecurityConfig() {
    return this.get<OrbatConfig['security']>('security');
  }

  public getPerformanceConfig() {
    return this.get<OrbatConfig['performance']>('performance');
  }

  public getDebuggingConfig() {
    return this.get<OrbatConfig['debugging']>('debugging');
  }

  // Convenience setters
  public setTheme(theme: 'light' | 'dark' | 'auto'): void {
    this.set('ui.theme', theme);
  }

  public setLanguage(language: 'en' | 'fa' | 'ar'): void {
    this.set('ui.language', language);
    this.set('ui.rtl', language === 'fa' || language === 'ar');
  }

  public setIframeUrl(url: string): void {
    this.set('iframe.baseUrl', url);
    this.set('bridge.targetOrigin', new URL(url).origin);
  }

  public enableFeature(feature: keyof OrbatConfig['features'], enabled: boolean): void {
    this.set(`features.${feature}`, enabled);
  }

  public setLogLevel(level: 'error' | 'warn' | 'info' | 'debug'): void {
    this.set('debugging.logLevel', level);
  }

  // Validation
  public validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate URLs
    try {
      new URL(this.get('iframe.baseUrl'));
    } catch {
      errors.push('Invalid iframe base URL');
    }

    try {
      new URL(this.get('bridge.targetOrigin'));
    } catch {
      errors.push('Invalid bridge target origin');
    }

    // Validate numeric values
    if (this.get('bridge.timeout') < 1000) {
      errors.push('Bridge timeout must be at least 1000ms');
    }

    if (this.get('data.cacheTTL') < 1000) {
      errors.push('Cache TTL must be at least 1000ms');
    }

    if (this.get('performance.debounceTime') < 0) {
      errors.push('Debounce time cannot be negative');
    }

    // Validate arrays
    const allowedModes = this.get<string[]>('iframe.allowedModes');
    const validModes = ['chart', 'map', 'grid', 'story'];
    for (const mode of allowedModes) {
      if (!validModes.includes(mode)) {
        errors.push(`Invalid iframe mode: ${mode}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Environment-specific configurations
  public applyEnvironmentConfig(env: 'development' | 'production' | 'test'): void {
    const envConfigs = {
      development: {
        bridge: { enableLogging: true },
        iframe: { enableDevTools: true },
        debugging: {
          enableLogs: true,
          logLevel: 'debug' as const,
          enablePerformanceMetrics: true
        }
      },
      production: {
        bridge: { enableLogging: false },
        iframe: { enableDevTools: false },
        debugging: {
          enableLogs: false,
          logLevel: 'error' as const,
          enablePerformanceMetrics: false
        },
        performance: {
          debounceTime: 500,
          maxRenderItems: 500
        }
      },
      test: {
        bridge: { 
          timeout: 5000,
          enableLogging: false 
        },
        data: {
          cacheEnabled: false,
          autoRefresh: false
        },
        ui: {
          animations: false,
          showLoadingStates: false
        }
      }
    };

    this.updateConfig(envConfigs[env]);
  }

  // Helper methods
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!(key in current)) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    
    target[lastKey] = value;
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  private notifyListeners(path: ConfigPath, value: ConfigValue): void {
    const listeners = this.listeners.get(path);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(value);
        } catch (error) {
          console.error('Error in config listener:', error);
        }
      });
    }
  }

  private notifyAllPaths(updates: any, basePath = ''): void {
    for (const [key, value] of Object.entries(updates)) {
      const fullPath = basePath ? `${basePath}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        this.notifyAllPaths(value, fullPath);
      } else {
        this.notifyListeners(fullPath, value);
      }
    }
  }

  private notifyAllListeners(): void {
    this.listeners.forEach((listeners, path) => {
      const value = this.get(path);
      listeners.forEach(listener => {
        try {
          listener(value);
        } catch (error) {
          console.error('Error in config listener:', error);
        }
      });
    });
  }

  // Storage management
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save config to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.config = this.deepMerge(this.config, parsed);
      }
    } catch (error) {
      console.warn('Failed to load config from storage:', error);
    }
  }

  // Export/Import configuration
  public exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  public importConfig(configJson: string): void {
    try {
      const imported = JSON.parse(configJson);
      const validation = this.validateImportedConfig(imported);
      
      if (!validation.valid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }
      
      this.updateConfig(imported);
    } catch (error) {
      throw new Error(`Failed to import configuration: ${error}`);
    }
  }

  private validateImportedConfig(config: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config || typeof config !== 'object') {
      errors.push('Configuration must be an object');
      return { valid: false, errors };
    }

    // Basic structure validation
    const requiredSections = ['bridge', 'iframe', 'data', 'ui', 'features'];
    for (const section of requiredSections) {
      if (!(section in config)) {
        errors.push(`Missing required section: ${section}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }
}