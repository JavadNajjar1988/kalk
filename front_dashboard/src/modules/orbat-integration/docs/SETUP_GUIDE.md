# ORBAT Integration Setup and Installation Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Installation](#detailed-installation)
4. [Development Setup](#development-setup)
5. [Production Deployment](#production-deployment)
6. [Docker Setup](#docker-setup)
7. [Environment Configuration](#environment-configuration)
8. [Verification](#verification)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (or yarn 1.22.0+)
- **React**: Version 18.0.0 or higher
- **TypeScript**: Version 4.9.0 or higher
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Dependencies

The ORBAT Integration module requires the following peer dependencies:

```json
{
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "@mui/material": "^5.14.0",
  "@mui/icons-material": "^5.14.0",
  "@emotion/react": "^11.11.0",
  "@emotion/styled": "^11.11.0",
  "zod": "^3.22.0",
  "dompurify": "^3.0.0"
}
```

## Quick Start

### 1. Copy the Module

Copy the entire `orbat-integration` module to your React project:

```bash
# Copy the module to your project
cp -r path/to/orbat-integration src/modules/
```

### 2. Install Dependencies

```bash
# Install required dependencies
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled zod dompurify

# Or with yarn
yarn add @mui/material @mui/icons-material @emotion/react @emotion/styled zod dompurify
```

### 3. Basic Setup

```tsx
// src/App.tsx
import React from 'react';
import { OrbatProvider } from './modules/orbat-integration';

function App() {
  return (
    <OrbatProvider
      config={{
        vueAppUrl: 'http://localhost:5173',
        enableCaching: true,
        enableRealTimeSync: true
      }}
    >
      <YourApplication />
    </OrbatProvider>
  );
}

export default App;
```

### 4. Use Components

```tsx
// src/components/MapView.tsx
import React from 'react';
import { OrbatViewer } from '../modules/orbat-integration';

function MapView() {
  return (
    <OrbatViewer
      mode="map"
      height="500px"
      onUnitClick={(unit) => console.log('Unit clicked:', unit)}
    />
  );
}

export default MapView;
```

## Detailed Installation

### Step 1: Project Structure Setup

Create the following directory structure in your React project:

```
src/
├── modules/
│   └── orbat-integration/
│       ├── components/
│       ├── hooks/
│       ├── security/
│       ├── templates/
│       ├── tests/
│       ├── types/
│       ├── utils/
│       └── docs/
├── components/
├── pages/
└── App.tsx
```

### Step 2: Install Dependencies

#### Core Dependencies
```bash
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
```

#### Validation and Security
```bash
npm install zod dompurify
```

#### Development Dependencies (Optional)
```bash
npm install --save-dev @types/dompurify vitest @testing-library/react @testing-library/jest-dom
```

### Step 3: TypeScript Configuration

Update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"],
      "@/modules/*": ["modules/*"]
    }
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

### Step 4: Environment Variables

Create a `.env` file in your project root:

```env
# ORBAT Integration Configuration
REACT_APP_ORBAT_VUE_URL=http://localhost:5173
REACT_APP_ORBAT_ENABLE_CACHE=true
REACT_APP_ORBAT_ENABLE_DEBUG=false
REACT_APP_ORBAT_SESSION_TIMEOUT=3600
REACT_APP_ORBAT_ENABLE_SECURITY=true

# Development Settings
REACT_APP_ORBAT_DEV_MODE=true
REACT_APP_ORBAT_LOG_LEVEL=info

# Production Settings (uncomment for production)
# REACT_APP_ORBAT_VUE_URL=https://your-vue-orbat-domain.com
# REACT_APP_ORBAT_DEV_MODE=false
# REACT_APP_ORBAT_LOG_LEVEL=error
```

### Step 5: App Configuration

#### Basic Configuration

```tsx
// src/App.tsx
import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { OrbatProvider } from './modules/orbat-integration';
import { SecuritySuiteProvider } from './modules/orbat-integration/security';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const orbatConfig = {
  vueAppUrl: process.env.REACT_APP_ORBAT_VUE_URL || 'http://localhost:5173',
  enableCaching: process.env.REACT_APP_ORBAT_ENABLE_CACHE === 'true',
  enableRealTimeSync: true,
  commandTimeout: 30000,
  retryAttempts: 3,
  enableDebugMode: process.env.REACT_APP_ORBAT_DEV_MODE === 'true'
};

const securityConfig = {
  sessionTimeout: parseInt(process.env.REACT_APP_ORBAT_SESSION_TIMEOUT || '3600'),
  requireAuthentication: process.env.REACT_APP_ORBAT_ENABLE_SECURITY === 'true',
  enableAuditLogging: true,
  allowedOrigins: [
    process.env.REACT_APP_ORBAT_VUE_URL || 'http://localhost:5173'
  ]
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SecuritySuiteProvider securityConfig={securityConfig}>
        <OrbatProvider
          config={orbatConfig}
          onReady={() => console.log('ORBAT Integration ready')}
          onError={(error) => console.error('ORBAT Integration error:', error)}
        >
          <YourMainApplication />
        </OrbatProvider>
      </SecuritySuiteProvider>
    </ThemeProvider>
  );
}

export default App;
```

#### Advanced Configuration with All Features

```tsx
// src/App.tsx (Advanced)
import React from 'react';
import { 
  OrbatProvider,
  SecuritySuiteProvider,
  MonitoringProvider,
  ResponsiveProvider
} from './modules/orbat-integration';

function App() {
  return (
    <SecuritySuiteProvider
      securityConfig={{
        sessionTimeout: 60,
        requireAuthentication: true,
        enableAuditLogging: true,
        restrictedMode: false,
        minClearanceLevel: 'CONFIDENTIAL'
      }}
      monitoringConfig={{
        enableAuditLogging: true,
        enableRealTimeMonitoring: true,
        logRetentionDays: 90,
        alertThresholds: {
          failedLoginAttempts: 5,
          unauthorizedAccess: 3,
          dataViolations: 1,
          systemErrors: 10
        }
      }}
    >
      <ResponsiveProvider
        gridConfig={{
          columns: { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 },
          spacing: { xs: 1, sm: 2, md: 2, lg: 3, xl: 3 }
        }}
      >
        <OrbatProvider
          config={{
            vueAppUrl: 'http://localhost:5173',
            enableCaching: true,
            cacheExpiration: 30,
            enableRealTimeSync: true,
            syncInterval: 5,
            commandTimeout: 30,
            retryAttempts: 3,
            enableDebugMode: true,
            enablePerformanceMonitoring: true
          }}
        >
          <YourApplication />
        </OrbatProvider>
      </ResponsiveProvider>
    </SecuritySuiteProvider>
  );
}
```

## Development Setup

### 1. Development Server

Start your React development server:

```bash
npm start
# or
yarn start
```

### 2. Vue ORBAT Mapper Setup

Ensure your Vue ORBAT Mapper is running on the configured port:

```bash
# In your Vue ORBAT project
npm run dev
# Should be running on http://localhost:5173
```

### 3. Development Tools

#### Enable Debug Mode

```tsx
const orbatConfig = {
  // ... other config
  enableDebugMode: true,
  enablePerformanceMonitoring: true
};
```

#### Add Development Helpers

```tsx
// src/components/DevTools.tsx
import React from 'react';
import { useOrbatBridge } from '../modules/orbat-integration';

function DevTools() {
  const { isReady, error } = useOrbatBridge();
  
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      right: 0, 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px',
      fontSize: '12px',
      zIndex: 9999 
    }}>
      <div>ORBAT Status: {isReady ? '✅ Ready' : '⏳ Loading'}</div>
      {error && <div>Error: {error}</div>}
    </div>
  );
}

export default DevTools;
```

### 4. Testing Setup

#### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
```

#### Test Setup File

```typescript
// src/test-setup.ts
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

// Mock ORBAT bridge for tests
global.mockOrbatBridge = {
  isReady: true,
  sendCommand: vi.fn(),
  addEventListener: vi.fn(() => () => {}),
};
```

## Production Deployment

### 1. Build Configuration

#### Environment Variables for Production

```env
# .env.production
REACT_APP_ORBAT_VUE_URL=https://your-production-vue-orbat.com
REACT_APP_ORBAT_ENABLE_CACHE=true
REACT_APP_ORBAT_ENABLE_DEBUG=false
REACT_APP_ORBAT_SESSION_TIMEOUT=3600
REACT_APP_ORBAT_ENABLE_SECURITY=true
REACT_APP_ORBAT_DEV_MODE=false
REACT_APP_ORBAT_LOG_LEVEL=error
```

#### Build Command

```bash
npm run build
# or
yarn build
```

### 2. Security Configuration for Production

```tsx
const productionSecurityConfig = {
  sessionTimeout: 60, // 1 hour
  maxSessions: 3,
  requireAuthentication: true,
  enableAuditLogging: true,
  restrictedMode: true,
  allowedOrigins: [
    'https://your-production-domain.com',
    'https://vue-orbat-production.com'
  ],
  minClearanceLevel: 'CONFIDENTIAL'
};
```

### 3. Performance Optimization

```tsx
// Lazy load components for better performance
const OrbatViewer = React.lazy(() => 
  import('./modules/orbat-integration').then(module => ({
    default: module.OrbatViewer
  }))
);

const OrbatDashboard = React.lazy(() =>
  import('./modules/orbat-integration/templates').then(module => ({
    default: module.OrbatDashboardTemplate
  }))
);

function App() {
  return (
    <Suspense fallback={<div>Loading ORBAT...</div>}>
      <OrbatProvider config={productionConfig}>
        <Routes>
          <Route path="/map" element={<OrbatViewer mode="map" />} />
          <Route path="/dashboard" element={<OrbatDashboard />} />
        </Routes>
      </OrbatProvider>
    </Suspense>
  );
}
```

## Docker Setup

### 1. Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  react-orbat:
    build: .
    ports:
      - "3000:80"
    environment:
      - REACT_APP_ORBAT_VUE_URL=http://vue-orbat:5173
    depends_on:
      - vue-orbat
    networks:
      - orbat-network

  vue-orbat:
    image: your-vue-orbat-image:latest
    ports:
      - "5173:5173"
    networks:
      - orbat-network

networks:
  orbat-network:
    driver: bridge
```

### 3. Nginx Configuration

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Handle React Router
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## Environment Configuration

### Development Environment

```bash
# .env.development
REACT_APP_ORBAT_VUE_URL=http://localhost:5173
REACT_APP_ORBAT_ENABLE_CACHE=true
REACT_APP_ORBAT_ENABLE_DEBUG=true
REACT_APP_ORBAT_SESSION_TIMEOUT=7200
REACT_APP_ORBAT_ENABLE_SECURITY=false
REACT_APP_ORBAT_DEV_MODE=true
REACT_APP_ORBAT_LOG_LEVEL=debug
```

### Staging Environment

```bash
# .env.staging
REACT_APP_ORBAT_VUE_URL=https://staging-vue-orbat.com
REACT_APP_ORBAT_ENABLE_CACHE=true
REACT_APP_ORBAT_ENABLE_DEBUG=false
REACT_APP_ORBAT_SESSION_TIMEOUT=3600
REACT_APP_ORBAT_ENABLE_SECURITY=true
REACT_APP_ORBAT_DEV_MODE=false
REACT_APP_ORBAT_LOG_LEVEL=warn
```

### Production Environment

```bash
# .env.production
REACT_APP_ORBAT_VUE_URL=https://production-vue-orbat.com
REACT_APP_ORBAT_ENABLE_CACHE=true
REACT_APP_ORBAT_ENABLE_DEBUG=false
REACT_APP_ORBAT_SESSION_TIMEOUT=3600
REACT_APP_ORBAT_ENABLE_SECURITY=true
REACT_APP_ORBAT_DEV_MODE=false
REACT_APP_ORBAT_LOG_LEVEL=error
```

## Verification

### 1. Installation Verification

Create a test component to verify the installation:

```tsx
// src/components/VerificationTest.tsx
import React, { useEffect, useState } from 'react';
import { useOrbatBridge } from '../modules/orbat-integration';

function VerificationTest() {
  const { isReady, isLoading, error, sendCommand } = useOrbatBridge();
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    if (isReady) {
      runTests();
    }
  }, [isReady]);

  const runTests = async () => {
    const results: string[] = [];
    
    try {
      // Test 1: Bridge connection
      if (isReady) {
        results.push('✅ Bridge connection established');
      } else {
        results.push('❌ Bridge connection failed');
      }

      // Test 2: Command execution
      try {
        await sendCommand('GET_SCENARIOS');
        results.push('✅ Command execution works');
      } catch (err) {
        results.push('❌ Command execution failed');
      }

      // Test 3: Security system
      try {
        const { SecurityProvider } = await import('../modules/orbat-integration/security');
        results.push('✅ Security system loaded');
      } catch (err) {
        results.push('❌ Security system failed to load');
      }

      setTestResults(results);
    } catch (error) {
      results.push('❌ General test failure');
      setTestResults(results);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h3>ORBAT Integration Verification</h3>
      <div>Status: {isLoading ? 'Loading...' : isReady ? 'Ready' : 'Not Ready'}</div>
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      
      <h4>Test Results:</h4>
      {testResults.map((result, index) => (
        <div key={index}>{result}</div>
      ))}
      
      {isReady && testResults.length === 0 && (
        <button onClick={runTests}>Run Tests</button>
      )}
    </div>
  );
}

export default VerificationTest;
```

### 2. Health Check Endpoint

```tsx
// src/utils/healthCheck.ts
export async function performHealthCheck() {
  const checks = {
    bridge: false,
    security: false,
    templates: false,
    performance: 0
  };

  try {
    // Check bridge
    const { useOrbatBridge } = await import('../modules/orbat-integration');
    checks.bridge = true;

    // Check security
    const { SecurityProvider } = await import('../modules/orbat-integration/security');
    checks.security = true;

    // Check templates
    const { OrbatMasterLayout } = await import('../modules/orbat-integration/templates');
    checks.templates = true;

    // Performance check
    const start = performance.now();
    await new Promise(resolve => setTimeout(resolve, 10));
    checks.performance = performance.now() - start;

  } catch (error) {
    console.error('Health check failed:', error);
  }

  return checks;
}
```

## Troubleshooting

### Common Issues

#### 1. Module Not Found Errors

```bash
# Solution: Ensure all dependencies are installed
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled zod dompurify

# Check TypeScript paths in tsconfig.json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"]
    }
  }
}
```

#### 2. Vue ORBAT Connection Issues

```tsx
// Debug connection issues
const orbatConfig = {
  vueAppUrl: 'http://localhost:5173',
  commandTimeout: 30000, // Increase timeout
  retryAttempts: 5, // Increase retry attempts
  enableDebugMode: true // Enable debug logging
};
```

#### 3. Security Context Errors

```tsx
// Ensure SecurityProvider wraps your components
function App() {
  return (
    <SecurityProvider>
      <YourComponent /> {/* This will have access to security context */}
    </SecurityProvider>
  );
}
```

#### 4. TypeScript Errors

```bash
# Install type definitions
npm install --save-dev @types/dompurify

# Update tsconfig.json with proper paths
```

### Support

For additional support:

1. Check the [API Documentation](./API_DOCUMENTATION.md)
2. Review the [Configuration Guide](./CONFIGURATION.md)
3. See [Troubleshooting FAQ](./TROUBLESHOOTING.md)
4. Contact the development team

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**License:** Proprietary