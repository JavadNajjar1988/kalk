# ORBAT Integration Troubleshooting & FAQ

## Table of Contents

1. [Common Issues](#common-issues)
2. [Installation Problems](#installation-problems)
3. [Runtime Errors](#runtime-errors)
4. [Performance Issues](#performance-issues)
5. [Security Problems](#security-problems)
6. [Configuration Issues](#configuration-issues)
7. [Frequently Asked Questions](#frequently-asked-questions)
8. [Debug Tools](#debug-tools)
9. [Getting Help](#getting-help)

## Common Issues

### Issue: "Module not found" errors

**Symptoms:**
```
Module not found: Can't resolve './modules/orbat-integration'
```

**Solutions:**
1. Verify the module is copied to the correct location:
   ```bash
   ls src/modules/orbat-integration
   ```

2. Check TypeScript path configuration in `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "baseUrl": "src",
       "paths": {
         "@/*": ["*"]
       }
     }
   }
   ```

3. Install required dependencies:
   ```bash
   npm install @mui/material @mui/icons-material @emotion/react @emotion/styled zod dompurify
   ```

### Issue: Vue ORBAT connection timeout

**Symptoms:**
```
Error: Connection timeout to Vue ORBAT application
```

**Solutions:**
1. Verify Vue ORBAT is running:
   ```bash
   curl http://localhost:5173
   ```

2. Check CORS configuration in Vue app
3. Increase timeout in configuration:
   ```tsx
   const config = {
     vueAppUrl: 'http://localhost:5173',
     commandTimeout: 60000, // Increase to 60 seconds
     retryAttempts: 5
   };
   ```

4. Enable debug mode to see detailed logs:
   ```tsx
   const config = {
     enableDebugMode: true,
     enablePerformanceMonitoring: true
   };
   ```

### Issue: Security context not available

**Symptoms:**
```
Error: useSecurityMiddleware must be used within SecurityProvider
```

**Solution:**
Ensure SecurityProvider wraps your components:
```tsx
function App() {
  return (
    <SecurityProvider>
      <OrbatProvider>
        <YourComponent />
      </OrbatProvider>
    </SecurityProvider>
  );
}
```

### Issue: Components not rendering

**Symptoms:**
- Blank screens
- Components not appearing

**Solutions:**
1. Check browser console for JavaScript errors
2. Verify all required providers are in place:
   ```tsx
   <ThemeProvider theme={theme}>
     <SecurityProvider>
       <OrbatProvider>
         <ResponsiveProvider>
           <YourApp />
         </ResponsiveProvider>
       </OrbatProvider>
     </SecurityProvider>
   </ThemeProvider>
   ```

3. Enable React DevTools and check component tree

## Installation Problems

### Problem: Dependency conflicts

**Error:**
```
npm ERR! peer dep missing: react@^18.0.0
```

**Solution:**
1. Check React version:
   ```bash
   npm list react
   ```

2. Update React if needed:
   ```bash
   npm update react react-dom
   ```

3. Install with force if necessary:
   ```bash
   npm install --force
   ```

### Problem: TypeScript compilation errors

**Error:**
```
TS2307: Cannot find module './modules/orbat-integration'
```

**Solution:**
1. Update `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "moduleResolution": "node",
       "allowSyntheticDefaultImports": true,
       "esModuleInterop": true
     }
   }
   ```

2. Add type declarations if needed:
   ```bash
   npm install --save-dev @types/dompurify
   ```

### Problem: Build failures

**Error:**
```
Failed to compile due to errors
```

**Solution:**
1. Clear cache and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Check for conflicting versions:
   ```bash
   npm ls
   ```

3. Use exact versions in package.json:
   ```json
   {
     "dependencies": {
       "react": "18.2.0",
       "@mui/material": "5.14.20"
     }
   }
   ```

## Runtime Errors

### Error: "Bridge communication failed"

**Debugging Steps:**
1. Check browser network tab for failed requests
2. Verify Vue ORBAT is accessible
3. Check CORS headers
4. Enable debug logging:
   ```tsx
   const config = {
     enableDebugMode: true,
     commandTimeout: 30000
   };
   ```

### Error: "Invalid SIDC format"

**Cause:** Military symbol identifier doesn't match MIL-STD-2525 format

**Solution:**
```tsx
// Correct SIDC format (15 characters)
const validSIDC = 'SFGPUCII------';

// Validate before using
import { SecurityValidator } from './modules/orbat-integration/security';
if (!SecurityValidator.validateSIDC(sidc)) {
  console.error('Invalid SIDC format');
}
```

### Error: "Session expired"

**Solutions:**
1. Increase session timeout:
   ```tsx
   const securityConfig = {
     sessionTimeout: 120 // 2 hours
   };
   ```

2. Implement auto-refresh:
   ```tsx
   const { refreshSession } = useSecurityMiddleware();
   useEffect(() => {
     const interval = setInterval(refreshSession, 5 * 60 * 1000); // Every 5 minutes
     return () => clearInterval(interval);
   }, [refreshSession]);
   ```

## Performance Issues

### Issue: Slow rendering with large datasets

**Solutions:**
1. Enable virtualization:
   ```tsx
   <ResponsiveGrid virtualization={{ enabled: true, itemHeight: 100 }}>
     {units.map(unit => <UnitCard key={unit.id} unit={unit} />)}
   </ResponsiveGrid>
   ```

2. Use React.memo for expensive components:
   ```tsx
   const UnitCard = React.memo(({ unit }) => {
     // Component implementation
   });
   ```

3. Implement pagination:
   ```tsx
   const { units } = useOrbatData();
   const [page, setPage] = useState(0);
   const pageSize = 50;
   const paginatedUnits = units.slice(page * pageSize, (page + 1) * pageSize);
   ```

### Issue: Memory leaks

**Solutions:**
1. Clean up event listeners:
   ```tsx
   useEffect(() => {
     const unsubscribe = addEventListener('UNIT_CHANGED', handler);
     return unsubscribe; // Important!
   }, []);
   ```

2. Clear intervals and timeouts:
   ```tsx
   useEffect(() => {
     const interval = setInterval(() => {}, 1000);
     return () => clearInterval(interval);
   }, []);
   ```

### Issue: High CPU usage

**Debugging:**
1. Use React DevTools Profiler
2. Check for unnecessary re-renders
3. Optimize with useMemo and useCallback:
   ```tsx
   const expensiveValue = useMemo(() => {
     return heavyCalculation(data);
   }, [data]);
   
   const memoizedHandler = useCallback((param) => {
     handleAction(param);
   }, []);
   ```

## Security Problems

### Issue: Authentication not working

**Debugging Steps:**
1. Check credentials format
2. Verify security configuration
3. Check browser console for errors
4. Test with debug credentials:
   ```tsx
   // Development only
   const success = await login({ username: 'admin', password: 'admin123' });
   ```

### Issue: Authorization failures

**Solutions:**
1. Check user roles and permissions:
   ```tsx
   const { user, hasRole, isAuthorized } = useSecurityMiddleware();
   console.log('User roles:', user?.roles);
   console.log('Has admin role:', hasRole('ADMIN'));
   console.log('Can read:', isAuthorized('READ'));
   ```

2. Verify security policies:
   ```tsx
   const { evaluatePolicies } = useSecurityPolicy();
   const result = evaluatePolicies({
     action: 'READ',
     resource: 'units',
     user: currentUser
   });
   console.log('Policy evaluation:', result);
   ```

### Issue: Data validation errors

**Solutions:**
1. Use validation schemas:
   ```tsx
   import { ValidationSchemas } from './modules/orbat-integration/security';
   
   const result = ValidationSchemas.Unit.safeParse(unitData);
   if (!result.success) {
     console.error('Validation errors:', result.error.errors);
   }
   ```

2. Sanitize input data:
   ```tsx
   import { SecurityValidator } from './modules/orbat-integration/security';
   
   const sanitizedText = SecurityValidator.sanitizeText(userInput);
   const sanitizedHtml = SecurityValidator.sanitizeHtml(htmlContent);
   ```

## Configuration Issues

### Issue: Environment variables not loading

**Solutions:**
1. Check .env file location (must be in project root)
2. Verify variable names start with `REACT_APP_`
3. Restart development server after changes
4. Use fallback values:
   ```tsx
   const config = {
     vueAppUrl: process.env.REACT_APP_ORBAT_VUE_URL || 'http://localhost:5173',
     enableDebug: process.env.REACT_APP_ORBAT_DEBUG === 'true'
   };
   ```

### Issue: Configuration validation failures

**Debugging:**
```tsx
import { validateConfiguration } from './modules/orbat-integration/utils';

const validation = validateConfiguration(config);
if (!validation.isValid) {
  console.error('Configuration errors:', validation.errors);
}
```

## Frequently Asked Questions

### Q: Can I use ORBAT Integration with Next.js?

**A:** Yes, but with considerations:
```tsx
// Use dynamic imports to avoid SSR issues
const OrbatViewer = dynamic(
  () => import('./modules/orbat-integration').then(mod => mod.OrbatViewer),
  { ssr: false }
);
```

### Q: How do I customize the military symbols?

**A:** Configure the theme system:
```tsx
const themeConfig = {
  militaryColors: {
    friendly: '#0066cc',
    hostile: '#cc0000',
    neutral: '#ffcc00',
    unknown: '#cc00cc'
  }
};
```

### Q: Can I use multiple Vue ORBAT instances?

**A:** Yes, configure different URLs:
```tsx
<OrbatProvider config={{ vueAppUrl: 'http://localhost:5173' }}>
  <MapView1 />
</OrbatProvider>

<OrbatProvider config={{ vueAppUrl: 'http://localhost:5174' }}>
  <MapView2 />
</OrbatProvider>
```

### Q: How do I handle offline scenarios?

**A:** Enable caching and error recovery:
```tsx
const config = {
  enableCaching: true,
  enableErrorRecovery: true,
  cacheExpiration: 60 // minutes
};
```

### Q: Can I extend the security system?

**A:** Yes, create custom policies:
```tsx
const customPolicy = {
  id: 'custom-policy',
  name: 'Custom Access Policy',
  rules: [
    {
      id: 'time-based-access',
      condition: 'new Date().getHours() < 18',
      action: 'ALLOW'
    }
  ]
};
```

### Q: How do I debug bridge communication?

**A:** Enable debug mode and check logs:
```tsx
const config = {
  enableDebugMode: true,
  enablePerformanceMonitoring: true
};

// Check browser console for detailed logs
```

### Q: Can I use custom validation rules?

**A:** Yes, extend the validation system:
```tsx
const customValidator = (data) => {
  if (data.customField && data.customField.length < 5) {
    return { isValid: false, error: 'Custom field too short' };
  }
  return { isValid: true };
};
```

## Debug Tools

### Enable Debug Mode

```tsx
// In development
const config = {
  enableDebugMode: process.env.NODE_ENV === 'development',
  enablePerformanceMonitoring: true
};
```

### Debug Component

```tsx
import React from 'react';
import { useOrbatBridge } from './modules/orbat-integration';

function DebugPanel() {
  const { isReady, error, performance } = useOrbatBridge();
  
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 0, 
      right: 0, 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px',
      fontSize: '12px',
      zIndex: 9999 
    }}>
      <div>Bridge: {isReady ? '✅' : '❌'}</div>
      <div>Error: {error || 'None'}</div>
      <div>Performance: {JSON.stringify(performance)}</div>
    </div>
  );
}
```

### Health Check Utility

```tsx
export async function runHealthCheck() {
  const results = {
    bridge: false,
    security: false,
    configuration: false,
    performance: 0
  };

  try {
    // Test bridge connection
    const bridge = await import('./modules/orbat-integration');
    results.bridge = true;

    // Test security system
    const security = await import('./modules/orbat-integration/security');
    results.security = true;

    // Test configuration
    const config = loadConfiguration();
    results.configuration = !!config;

    // Test performance
    const start = performance.now();
    await new Promise(resolve => setTimeout(resolve, 10));
    results.performance = performance.now() - start;

  } catch (error) {
    console.error('Health check failed:', error);
  }

  return results;
}
```

## Getting Help

### Before Asking for Help

1. **Check Console Errors**: Open browser DevTools and check for JavaScript errors
2. **Review Configuration**: Ensure all required providers and configurations are correct
3. **Test in Isolation**: Create a minimal reproduction case
4. **Check Documentation**: Review API docs and examples

### Information to Include

When reporting issues, include:

1. **Environment Details**:
   - React version
   - Node.js version
   - Browser version
   - Operating system

2. **Configuration**:
   - ORBAT integration config
   - Security settings
   - Environment variables

3. **Error Details**:
   - Complete error messages
   - Browser console logs
   - Network tab information

4. **Code Sample**:
   - Minimal reproduction case
   - Relevant component code
   - Configuration setup

### Example Issue Report

```
**Environment:**
- React: 18.2.0
- Node.js: 18.17.0
- Browser: Chrome 120.0.0
- OS: Windows 11

**Configuration:**
```tsx
const config = {
  vueAppUrl: 'http://localhost:5173',
  enableCaching: true,
  enableDebugMode: true
};
```

**Error:**
Connection timeout after 30 seconds

**Console Logs:**
[DEBUG] Bridge initialization started
[ERROR] Failed to connect to Vue ORBAT: timeout

**Expected Behavior:**
Should connect to Vue ORBAT application

**Actual Behavior:**
Connection times out and shows error message
```

### Support Channels

1. **Documentation**: Check all available docs first
2. **GitHub Issues**: For bug reports and feature requests
3. **Team Contact**: For urgent production issues
4. **Community**: For general questions and discussions

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**License:** Proprietary