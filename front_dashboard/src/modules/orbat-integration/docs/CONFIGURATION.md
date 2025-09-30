# ORBAT Integration Configuration Guide

## Table of Contents

1. [Overview](#overview)
2. [Core Configuration](#core-configuration)
3. [Security Configuration](#security-configuration)
4. [Template and UI Configuration](#template-and-ui-configuration)
5. [Performance Configuration](#performance-configuration)
6. [Environment-Specific Configuration](#environment-specific-configuration)
7. [Advanced Configuration](#advanced-configuration)
8. [Configuration Validation](#configuration-validation)
9. [Migration Guide](#migration-guide)

## Overview

The ORBAT Integration module provides extensive configuration options to customize behavior, security, performance, and UI appearance. Configuration can be provided through environment variables, configuration objects, or programmatically through the API.

### Configuration Priority

Configuration is applied in the following order (highest priority first):

1. **Programmatic Configuration** - Passed directly to components
2. **Environment Variables** - Set in `.env` files
3. **Default Configuration** - Built-in defaults

## Core Configuration

### OrbatConfig Interface

```typescript
interface OrbatConfig {
  // Connection settings
  vueAppUrl: string;
  enableCaching: boolean;
  cacheExpiration: number; // minutes
  
  // Synchronization settings
  enableRealTimeSync: boolean;
  syncInterval: number; // seconds
  
  // Communication settings
  commandTimeout: number; // milliseconds
  retryAttempts: number;
  
  // Development settings
  enableDebugMode: boolean;
  enablePerformanceMonitoring: boolean;
  enableErrorRecovery: boolean;
  
  // UI settings
  defaultTheme: 'light' | 'dark' | 'auto';
  language: 'en' | 'fa' | 'ar';
  enableAnimations: boolean;
}
```

### Default Configuration

```typescript
const DEFAULT_ORBAT_CONFIG: OrbatConfig = {
  vueAppUrl: 'http://localhost:5173',
  enableCaching: true,
  cacheExpiration: 30,
  enableRealTimeSync: true,
  syncInterval: 5,
  commandTimeout: 30000,
  retryAttempts: 3,
  enableDebugMode: false,
  enablePerformanceMonitoring: true,
  enableErrorRecovery: true,
  defaultTheme: 'light',
  language: 'en',
  enableAnimations: true
};
```

### Environment Variables

```bash
# Connection Settings
REACT_APP_ORBAT_VUE_URL=http://localhost:5173
REACT_APP_ORBAT_ENABLE_CACHE=true
REACT_APP_ORBAT_CACHE_EXPIRATION=30

# Synchronization Settings
REACT_APP_ORBAT_ENABLE_REAL_TIME_SYNC=true
REACT_APP_ORBAT_SYNC_INTERVAL=5

# Communication Settings
REACT_APP_ORBAT_COMMAND_TIMEOUT=30000
REACT_APP_ORBAT_RETRY_ATTEMPTS=3

# Development Settings
REACT_APP_ORBAT_ENABLE_DEBUG=false
REACT_APP_ORBAT_ENABLE_PERFORMANCE_MONITORING=true
REACT_APP_ORBAT_ENABLE_ERROR_RECOVERY=true

# UI Settings
REACT_APP_ORBAT_DEFAULT_THEME=light
REACT_APP_ORBAT_LANGUAGE=en
REACT_APP_ORBAT_ENABLE_ANIMATIONS=true
```

### Usage Examples

#### Basic Configuration

```tsx
import { OrbatProvider } from './modules/orbat-integration';

function App() {
  const config = {
    vueAppUrl: process.env.REACT_APP_ORBAT_VUE_URL || 'http://localhost:5173',
    enableCaching: true,
    enableRealTimeSync: true
  };

  return (
    <OrbatProvider config={config}>
      <YourApp />
    </OrbatProvider>
  );
}
```

#### Dynamic Configuration

```tsx
import React, { useState, useEffect } from 'react';
import { OrbatProvider } from './modules/orbat-integration';

function App() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    // Load configuration from API or local storage
    loadConfiguration().then(setConfig);
  }, []);

  if (!config) return <div>Loading configuration...</div>;

  return (
    <OrbatProvider config={config}>
      <YourApp />
    </OrbatProvider>
  );
}

async function loadConfiguration() {
  try {
    const response = await fetch('/api/orbat-config');
    return await response.json();
  } catch (error) {
    console.error('Failed to load configuration:', error);
    return DEFAULT_ORBAT_CONFIG;
  }
}
```

## Security Configuration

### SecurityConfig Interface

```typescript
interface SecurityConfig {
  // Authentication settings
  sessionTimeout: number; // minutes
  maxSessions: number;
  requireAuthentication: boolean;
  enableAuditLogging: boolean;
  restrictedMode: boolean;
  
  // Authorization settings
  allowedOrigins: string[];
  minClearanceLevel: 'PUBLIC' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  
  // Security policies
  enableStrictValidation: boolean;
  enableDataEncryption: boolean;
  enableSecureCommunication: boolean;
}
```

### Default Security Configuration

```typescript
const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  sessionTimeout: 60,
  maxSessions: 5,
  requireAuthentication: true,
  enableAuditLogging: true,
  restrictedMode: false,
  allowedOrigins: ['http://localhost:5173'],
  minClearanceLevel: 'PUBLIC',
  enableStrictValidation: true,
  enableDataEncryption: true,
  enableSecureCommunication: true
};
```

### Security Environment Variables

```bash
# Authentication Settings
REACT_APP_SECURITY_SESSION_TIMEOUT=60
REACT_APP_SECURITY_MAX_SESSIONS=5
REACT_APP_SECURITY_REQUIRE_AUTH=true
REACT_APP_SECURITY_ENABLE_AUDIT=true
REACT_APP_SECURITY_RESTRICTED_MODE=false

# Authorization Settings
REACT_APP_SECURITY_ALLOWED_ORIGINS=http://localhost:5173,https://production-vue.com
REACT_APP_SECURITY_MIN_CLEARANCE_LEVEL=PUBLIC

# Security Policies
REACT_APP_SECURITY_STRICT_VALIDATION=true
REACT_APP_SECURITY_DATA_ENCRYPTION=true
REACT_APP_SECURITY_SECURE_COMMUNICATION=true
```

### Security Configuration Usage

```tsx
import { SecuritySuiteProvider } from './modules/orbat-integration/security';

function App() {
  const securityConfig = {
    sessionTimeout: 60,
    requireAuthentication: process.env.NODE_ENV === 'production',
    enableAuditLogging: true,
    allowedOrigins: [
      process.env.REACT_APP_ORBAT_VUE_URL || 'http://localhost:5173'
    ],
    minClearanceLevel: 'CONFIDENTIAL'
  };

  return (
    <SecuritySuiteProvider securityConfig={securityConfig}>
      <OrbatProvider>
        <YourApp />
      </OrbatProvider>
    </SecuritySuiteProvider>
  );
}
```

### Security Policy Configuration

```typescript
// Custom security policies
const customSecurityPolicies = [
  {
    id: 'data-access-policy',
    name: 'Data Access Control',
    description: 'Controls access to sensitive ORBAT data',
    version: '1.0.0',
    isActive: true,
    enforcement: 'STRICT',
    scope: 'GLOBAL',
    rules: [
      {
        id: 'classified-data-rule',
        name: 'Classified Data Access',
        type: 'ACCESS_CONTROL',
        condition: 'data.classification === "CLASSIFIED"',
        action: 'REQUIRE_APPROVAL',
        parameters: { approverRole: 'ADMIN' },
        priority: 1,
        isEnabled: true
      }
    ]
  }
];

// Apply custom policies
function App() {
  return (
    <SecurityPolicyProvider policies={customSecurityPolicies}>
      <YourApp />
    </SecurityPolicyProvider>
  );
}
```

## Template and UI Configuration

### Theme Configuration

```typescript
interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto';
  primaryColor: string;
  secondaryColor: string;
  militaryColors: {
    friendly: string;
    hostile: string;
    neutral: string;
    unknown: string;
  };
  rtlSupport: boolean;
  customFonts: string[];
}
```

### Default Theme Configuration

```typescript
const DEFAULT_THEME_CONFIG: ThemeConfig = {
  mode: 'light',
  primaryColor: '#1976d2',
  secondaryColor: '#dc004e',
  militaryColors: {
    friendly: '#0066cc',
    hostile: '#cc0000',
    neutral: '#ffcc00',
    unknown: '#cc00cc'
  },
  rtlSupport: true,
  customFonts: ['Roboto', 'Arial', 'sans-serif']
};
```

### Theme Configuration Usage

```tsx
import { OrbatThemeProvider } from './modules/orbat-integration/templates/themes';

function App() {
  const themeConfig = {
    mode: 'dark',
    primaryColor: '#2196f3',
    militaryColors: {
      friendly: '#4caf50',
      hostile: '#f44336',
      neutral: '#ff9800',
      unknown: '#9c27b0'
    },
    rtlSupport: true
  };

  return (
    <OrbatThemeProvider config={themeConfig}>
      <YourApp />
    </OrbatThemeProvider>
  );
}
```

### Layout Configuration

```typescript
interface LayoutConfig {
  defaultLayout: 'master' | 'dashboard' | 'minimal';
  enableDrawer: boolean;
  drawerWidth: number;
  enableBreadcrumbs: boolean;
  enableTabs: boolean;
  responsiveBreakpoints: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}
```

### Layout Configuration Usage

```tsx
import { OrbatMasterLayout } from './modules/orbat-integration/templates';

function App() {
  const layoutConfig = {
    enableDrawer: true,
    drawerWidth: 280,
    enableBreadcrumbs: true,
    responsiveBreakpoints: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920
    }
  };

  return (
    <OrbatMasterLayout config={layoutConfig}>
      <YourContent />
    </OrbatMasterLayout>
  );
}
```

### Dashboard Configuration

```typescript
interface DashboardConfig {
  defaultWidgets: string[];
  enableWidgetReordering: boolean;
  enableWidgetResizing: boolean;
  gridColumns: number;
  gridSpacing: number;
  enableFullscreen: boolean;
  autoRefreshInterval: number; // seconds
}
```

## Performance Configuration

### Performance Options

```typescript
interface PerformanceConfig {
  // Rendering optimization
  enableVirtualization: boolean;
  enableLazyLoading: boolean;
  enableMemoization: boolean;
  
  // Caching configuration
  enableServiceWorker: boolean;
  cacheStrategy: 'aggressive' | 'conservative' | 'disabled';
  maxCacheSize: number; // MB
  
  // Network optimization
  enableRequestBatching: boolean;
  enableCompression: boolean;
  requestDelay: number; // milliseconds
  
  // Monitoring
  enablePerformanceTracking: boolean;
  enableErrorBoundaries: boolean;
  enableProfiler: boolean;
}
```

### Performance Configuration Usage

```tsx
import { OrbatProvider } from './modules/orbat-integration';

function App() {
  const performanceConfig = {
    enableVirtualization: true,
    enableLazyLoading: true,
    enableMemoization: true,
    cacheStrategy: 'aggressive',
    maxCacheSize: 100,
    enableRequestBatching: true,
    enablePerformanceTracking: process.env.NODE_ENV === 'development'
  };

  return (
    <OrbatProvider performanceConfig={performanceConfig}>
      <YourApp />
    </OrbatProvider>
  );
}
```

## Environment-Specific Configuration

### Development Configuration

```typescript
// config/development.ts
export const developmentConfig = {
  orbat: {
    vueAppUrl: 'http://localhost:5173',
    enableDebugMode: true,
    enablePerformanceMonitoring: true,
    commandTimeout: 60000, // Longer timeout for debugging
    retryAttempts: 1 // Less retries for faster feedback
  },
  security: {
    requireAuthentication: false,
    enableAuditLogging: true,
    restrictedMode: false,
    sessionTimeout: 480 // 8 hours for development
  },
  theme: {
    mode: 'light',
    enableAnimations: true
  },
  performance: {
    enableVirtualization: false, // Easier debugging
    enableLazyLoading: false,
    enablePerformanceTracking: true
  }
};
```

### Staging Configuration

```typescript
// config/staging.ts
export const stagingConfig = {
  orbat: {
    vueAppUrl: process.env.REACT_APP_ORBAT_VUE_URL,
    enableDebugMode: false,
    enablePerformanceMonitoring: true,
    commandTimeout: 30000,
    retryAttempts: 3
  },
  security: {
    requireAuthentication: true,
    enableAuditLogging: true,
    restrictedMode: false,
    sessionTimeout: 120 // 2 hours
  },
  theme: {
    mode: 'light',
    enableAnimations: true
  },
  performance: {
    enableVirtualization: true,
    enableLazyLoading: true,
    enablePerformanceTracking: true
  }
};
```

### Production Configuration

```typescript
// config/production.ts
export const productionConfig = {
  orbat: {
    vueAppUrl: process.env.REACT_APP_ORBAT_VUE_URL,
    enableDebugMode: false,
    enablePerformanceMonitoring: false,
    commandTimeout: 30000,
    retryAttempts: 5 // More retries in production
  },
  security: {
    requireAuthentication: true,
    enableAuditLogging: true,
    restrictedMode: true,
    sessionTimeout: 60 // 1 hour
  },
  theme: {
    mode: 'auto',
    enableAnimations: false // Better performance
  },
  performance: {
    enableVirtualization: true,
    enableLazyLoading: true,
    enablePerformanceTracking: false,
    cacheStrategy: 'aggressive',
    enableCompression: true
  }
};
```

### Environment Configuration Loader

```typescript
// config/index.ts
import { developmentConfig } from './development';
import { stagingConfig } from './staging';
import { productionConfig } from './production';

export function loadConfiguration() {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'development':
      return developmentConfig;
    case 'staging':
      return stagingConfig;
    case 'production':
      return productionConfig;
    default:
      return developmentConfig;
  }
}

// Usage in App.tsx
import { loadConfiguration } from './config';

function App() {
  const config = loadConfiguration();
  
  return (
    <OrbatProvider config={config.orbat}>
      <SecuritySuiteProvider securityConfig={config.security}>
        <OrbatThemeProvider config={config.theme}>
          <YourApp />
        </OrbatThemeProvider>
      </SecuritySuiteProvider>
    </OrbatProvider>
  );
}
```

## Advanced Configuration

### Configuration Schemas and Validation

```typescript
import { z } from 'zod';

// Configuration validation schemas
const OrbatConfigSchema = z.object({
  vueAppUrl: z.string().url(),
  enableCaching: z.boolean(),
  cacheExpiration: z.number().min(1).max(1440),
  enableRealTimeSync: z.boolean(),
  syncInterval: z.number().min(1).max(60),
  commandTimeout: z.number().min(1000).max(300000),
  retryAttempts: z.number().min(0).max(10),
  enableDebugMode: z.boolean(),
  enablePerformanceMonitoring: z.boolean(),
  enableErrorRecovery: z.boolean(),
  defaultTheme: z.enum(['light', 'dark', 'auto']),
  language: z.enum(['en', 'fa', 'ar']),
  enableAnimations: z.boolean()
});

const SecurityConfigSchema = z.object({
  sessionTimeout: z.number().min(5).max(1440),
  maxSessions: z.number().min(1).max(20),
  requireAuthentication: z.boolean(),
  enableAuditLogging: z.boolean(),
  restrictedMode: z.boolean(),
  allowedOrigins: z.array(z.string().url()),
  minClearanceLevel: z.enum(['PUBLIC', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'])
});

// Configuration validation function
export function validateConfiguration(config: any) {
  try {
    const validatedOrbatConfig = OrbatConfigSchema.parse(config.orbat);
    const validatedSecurityConfig = SecurityConfigSchema.parse(config.security);
    
    return {
      isValid: true,
      config: {
        orbat: validatedOrbatConfig,
        security: validatedSecurityConfig
      },
      errors: []
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        config: null,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return {
      isValid: false,
      config: null,
      errors: ['Unknown validation error']
    };
  }
}

// Usage
function App() {
  const rawConfig = loadConfiguration();
  const validation = validateConfiguration(rawConfig);
  
  if (!validation.isValid) {
    console.error('Configuration validation failed:', validation.errors);
    return <div>Configuration Error</div>;
  }
  
  return (
    <OrbatProvider config={validation.config.orbat}>
      <YourApp />
    </OrbatProvider>
  );
}
```

### Runtime Configuration Updates

```typescript
// Configuration context for runtime updates
import React, { createContext, useContext, useState } from 'react';

interface ConfigurationContextType {
  config: any;
  updateConfig: (updates: any) => void;
  resetConfig: () => void;
}

const ConfigurationContext = createContext<ConfigurationContextType | null>(null);

export function ConfigurationProvider({ children, initialConfig }) {
  const [config, setConfig] = useState(initialConfig);
  
  const updateConfig = useCallback((updates: any) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);
  
  const resetConfig = useCallback(() => {
    setConfig(initialConfig);
  }, [initialConfig]);
  
  return (
    <ConfigurationContext.Provider value={{ config, updateConfig, resetConfig }}>
      {children}
    </ConfigurationContext.Provider>
  );
}

export function useConfiguration() {
  const context = useContext(ConfigurationContext);
  if (!context) {
    throw new Error('useConfiguration must be used within ConfigurationProvider');
  }
  return context;
}

// Usage in components
function SettingsPanel() {
  const { config, updateConfig } = useConfiguration();
  
  const handleThemeChange = (newTheme: string) => {
    updateConfig({
      theme: { ...config.theme, mode: newTheme }
    });
  };
  
  return (
    <div>
      <select 
        value={config.theme.mode} 
        onChange={(e) => handleThemeChange(e.target.value)}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="auto">Auto</option>
      </select>
    </div>
  );
}
```

### Configuration Persistence

```typescript
// Configuration persistence utilities
export class ConfigurationManager {
  private storageKey = 'orbat_configuration';
  
  saveConfiguration(config: any): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  }
  
  loadConfiguration(): any | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load configuration:', error);
      return null;
    }
  }
  
  clearConfiguration(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear configuration:', error);
    }
  }
  
  exportConfiguration(): string {
    const config = this.loadConfiguration();
    return JSON.stringify(config, null, 2);
  }
  
  importConfiguration(configString: string): boolean {
    try {
      const config = JSON.parse(configString);
      const validation = validateConfiguration(config);
      
      if (validation.isValid) {
        this.saveConfiguration(validation.config);
        return true;
      } else {
        console.error('Invalid configuration:', validation.errors);
        return false;
      }
    } catch (error) {
      console.error('Failed to import configuration:', error);
      return false;
    }
  }
}

// Usage
const configManager = new ConfigurationManager();

function App() {
  const [config, setConfig] = useState(() => {
    const saved = configManager.loadConfiguration();
    return saved || loadConfiguration();
  });
  
  useEffect(() => {
    configManager.saveConfiguration(config);
  }, [config]);
  
  return (
    <ConfigurationProvider initialConfig={config}>
      <OrbatProvider config={config.orbat}>
        <YourApp />
      </OrbatProvider>
    </ConfigurationProvider>
  );
}
```

## Configuration Validation

### Built-in Validation

```typescript
import { validateConfiguration } from './modules/orbat-integration/utils';

function App() {
  const config = loadConfiguration();
  const validation = validateConfiguration(config);
  
  if (!validation.isValid) {
    return (
      <div>
        <h2>Configuration Error</h2>
        <ul>
          {validation.errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </div>
    );
  }
  
  return (
    <OrbatProvider config={validation.config}>
      <YourApp />
    </OrbatProvider>
  );
}
```

### Custom Validation Rules

```typescript
// Custom validation rules
const customValidationRules = {
  validateVueUrl: (url: string) => {
    if (!url.startsWith('http')) {
      return 'Vue URL must start with http or https';
    }
    if (url.includes('localhost') && process.env.NODE_ENV === 'production') {
      return 'Cannot use localhost URL in production';
    }
    return null;
  },
  
  validateSecurityLevel: (config: any) => {
    if (config.security.requireAuthentication && !config.security.enableAuditLogging) {
      return 'Audit logging must be enabled when authentication is required';
    }
    return null;
  }
};

function validateWithCustomRules(config: any) {
  const errors: string[] = [];
  
  // Apply custom validation rules
  const vueUrlError = customValidationRules.validateVueUrl(config.orbat.vueAppUrl);
  if (vueUrlError) errors.push(vueUrlError);
  
  const securityError = customValidationRules.validateSecurityLevel(config);
  if (securityError) errors.push(securityError);
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

## Migration Guide

### Migrating from Version 1.0 to 1.1

```typescript
// Old configuration format (v1.0)
const oldConfig = {
  apiUrl: 'http://localhost:5173', // Changed to vueAppUrl
  timeout: 30000, // Changed to commandTimeout
  debug: true, // Changed to enableDebugMode
  cache: true // Changed to enableCaching
};

// New configuration format (v1.1)
const newConfig = {
  vueAppUrl: oldConfig.apiUrl,
  commandTimeout: oldConfig.timeout,
  enableDebugMode: oldConfig.debug,
  enableCaching: oldConfig.cache,
  // New options
  enableRealTimeSync: true,
  syncInterval: 5,
  retryAttempts: 3
};

// Migration helper function
function migrateConfiguration(oldConfig: any) {
  return {
    vueAppUrl: oldConfig.apiUrl || oldConfig.vueAppUrl,
    commandTimeout: oldConfig.timeout || oldConfig.commandTimeout,
    enableDebugMode: oldConfig.debug || oldConfig.enableDebugMode,
    enableCaching: oldConfig.cache || oldConfig.enableCaching,
    enableRealTimeSync: oldConfig.enableRealTimeSync ?? true,
    syncInterval: oldConfig.syncInterval ?? 5,
    retryAttempts: oldConfig.retryAttempts ?? 3
  };
}
```

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**License:** Proprietary