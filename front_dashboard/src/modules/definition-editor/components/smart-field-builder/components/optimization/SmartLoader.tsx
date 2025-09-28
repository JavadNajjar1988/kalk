/**
 * Intelligent Component Loader for Smart Field Builder
 * Provides dynamic loading with priority-based bundling
 */

import React, { Suspense, lazy, ComponentType, useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, alpha, useTheme } from '@mui/material';
import { templateCache, useCache } from '../../utils/intelligentCache';
import { useAdvancedMemo, useSmartCallback } from '../../hooks/useAdvancedMemoization';

interface LoaderConfig {
  priority: 'immediate' | 'high' | 'medium' | 'low';
  preload?: boolean;
  fallback?: React.ComponentType;
  retryAttempts?: number;
  cacheKey?: string;
}

interface ComponentBundle {
  name: string;
  loader: () => Promise<{ default: ComponentType<any> }>;
  config: LoaderConfig;
  loaded?: boolean;
  loading?: boolean;
  error?: Error;
}

// Component registry with intelligent loading strategies
class ComponentLoader {
  private bundles: Map<string, ComponentBundle> = new Map();
  private loadPromises: Map<string, Promise<any>> = new Map();
  private preloadQueue: string[] = [];
  private isPreloading = false;

  // Register a component for lazy loading
  register(name: string, loader: () => Promise<{ default: ComponentType<any> }>, config: LoaderConfig) {
    this.bundles.set(name, {
      name,
      loader,
      config,
      loaded: false,
      loading: false
    });

    // Immediate loading for high priority components
    if (config.priority === 'immediate') {
      this.load(name);
    } else if (config.preload && config.priority === 'high') {
      this.schedulePreload(name);
    }
  }

  // Load component with caching
  async load(name: string): Promise<ComponentType<any> | null> {
    const bundle = this.bundles.get(name);
    if (!bundle) {
      console.warn(`Component ${name} not registered`);
      return null;
    }

    // Return from cache if available
    const cacheKey = bundle.config.cacheKey || `component_${name}`;
    const cached = templateCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Return existing promise if already loading
    if (this.loadPromises.has(name)) {
      return this.loadPromises.get(name)!;
    }

    // Start loading
    bundle.loading = true;
    const loadPromise = this.loadWithRetry(bundle);
    this.loadPromises.set(name, loadPromise);

    try {
      const component = await loadPromise;
      bundle.loaded = true;
      bundle.loading = false;
      
      // Cache the loaded component
      templateCache.set(cacheKey, component, {
        ttl: 30 * 60 * 1000, // 30 minutes
        dependencies: [name, 'components']
      });

      this.loadPromises.delete(name);
      return component;
    } catch (error) {
      bundle.error = error as Error;
      bundle.loading = false;
      this.loadPromises.delete(name);
      console.error(`Failed to load component ${name}:`, error);
      return null;
    }
  }

  // Load with retry logic
  private async loadWithRetry(bundle: ComponentBundle): Promise<ComponentType<any>> {
    const maxRetries = bundle.config.retryAttempts || 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const module = await bundle.loader();
        return module.default;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError!;
  }

  // Schedule component for preloading
  private schedulePreload(name: string) {
    if (!this.preloadQueue.includes(name)) {
      this.preloadQueue.push(name);
    }

    if (!this.isPreloading) {
      this.startPreloading();
    }
  }

  // Start preloading process
  private async startPreloading() {
    this.isPreloading = true;

    while (this.preloadQueue.length > 0) {
      const name = this.preloadQueue.shift()!;
      const bundle = this.bundles.get(name);

      if (bundle && !bundle.loaded && !bundle.loading) {
        try {
          await this.load(name);
          
          // Small delay to avoid blocking the main thread
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.warn(`Preload failed for ${name}:`, error);
        }
      }
    }

    this.isPreloading = false;
  }

  // Get loading status
  getStatus(name: string) {
    const bundle = this.bundles.get(name);
    if (!bundle) return { exists: false };

    return {
      exists: true,
      loaded: bundle.loaded,
      loading: bundle.loading,
      error: bundle.error
    };
  }

  // Preload all high priority components
  preloadCritical() {
    const criticalComponents = Array.from(this.bundles.entries())
      .filter(([_, bundle]) => bundle.config.priority === 'high')
      .map(([name]) => name);

    return Promise.allSettled(criticalComponents.map(name => this.load(name)));
  }
}

// Singleton loader instance
export const componentLoader = new ComponentLoader();

// React component for lazy loading with intelligent fallbacks
interface SmartLoaderProps {
  componentName: string;
  fallback?: React.ReactNode;
  children?: React.ReactNode;
  onError?: (error: Error) => void;
}

export const SmartLoader: React.FC<SmartLoaderProps> = ({
  componentName,
  fallback,
  children,
  onError
}) => {
  const theme = useTheme();
  const [Component, setComponent] = useState<ComponentType<any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load component with caching
  const loadComponent = useSmartCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const loadedComponent = await componentLoader.load(componentName);
      if (loadedComponent) {
        setComponent(() => loadedComponent);
      } else {
        throw new Error(`Component ${componentName} not found`);
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [componentName, onError]);

  useEffect(() => {
    loadComponent();
  }, [loadComponent]);

  // Smart fallback based on loading state
  const renderFallback = useAdvancedMemo(() => {
    if (error) {
      return (
        <Box
          sx={{
            p: 3,
            textAlign: 'center',
            backgroundColor: alpha(theme.palette.error.main, 0.05),
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
          }}
        >
          <Typography variant="h6" color="error" gutterBottom>
            خطا در بارگذاری کامپوننت
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {error.message}
          </Typography>
          <button
            onClick={loadComponent}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: theme.palette.error.main,
              color: 'white',
              cursor: 'pointer'
            }}
          >
            تلاش مجدد
          </button>
        </Box>
      );
    }

    if (fallback) {
      return fallback;
    }

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          backgroundColor: alpha(theme.palette.primary.main, 0.02),
          borderRadius: 2
        }}
      >
        <CircularProgress size={40} thickness={4} sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          در حال بارگذاری {componentName}...
        </Typography>
      </Box>
    );
  }, [error, fallback, loading, componentName, theme, loadComponent]);

  if (loading || !Component) {
    return <>{renderFallback}</>;
  }

  return (
    <Suspense fallback={renderFallback}>
      <Component>{children}</Component>
    </Suspense>
  );
};

// Hook for component loading
export const useComponentLoader = (componentName: string) => {
  const [status, setStatus] = useState(() => componentLoader.getStatus(componentName));

  useEffect(() => {
    const checkStatus = () => {
      setStatus(componentLoader.getStatus(componentName));
    };

    const interval = setInterval(checkStatus, 100);
    return () => clearInterval(interval);
  }, [componentName]);

  const load = useSmartCallback(() => {
    return componentLoader.load(componentName);
  }, [componentName]);

  return { status, load };
};

// Register Smart Field Builder components
export const registerSmartFieldComponents = () => {
  // High priority components
  componentLoader.register(
    'BuilderModeSelector',
    () => import('../../BuilderModeSelector'),
    { priority: 'immediate', preload: true, cacheKey: 'mode_selector' }
  );

  componentLoader.register(
    'GuidedWizard',
    () => import('../../GuidedWizard'),
    { priority: 'high', preload: true, cacheKey: 'guided_wizard' }
  );

  // Medium priority components
  componentLoader.register(
    'TemplateSelector',
    () => import('../templates/OptimizedTemplateSelector'),
    { priority: 'medium', preload: false, cacheKey: 'optimized_template_selector' }
  );

  // Low priority components - load on demand
  componentLoader.register(
    'BaseTypeStep',
    () => import('../wizard/steps/BaseTypeStep'),
    { priority: 'low', preload: false, cacheKey: 'base_type_step' }
  );

  componentLoader.register(
    'EnhancementsStep',
    () => import('../wizard/steps/EnhancementsStep'),
    { priority: 'low', preload: false, cacheKey: 'enhancements_step' }
  );

  componentLoader.register(
    'PreviewStep',
    () => import('../wizard/steps/PreviewStep'),
    { priority: 'low', preload: false, cacheKey: 'preview_step' }
  );
};

export default SmartLoader;