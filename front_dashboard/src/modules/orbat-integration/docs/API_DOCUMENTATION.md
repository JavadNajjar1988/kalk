# ORBAT Integration API Documentation

## Overview

The ORBAT Integration module provides a comprehensive React-based system for integrating Vue ORBAT Mapper into React applications. This documentation covers all APIs, components, hooks, and utilities available in the module.

## Table of Contents

1. [Core Components](#core-components)
2. [Hooks](#hooks)
3. [Security System](#security-system)
4. [Template System](#template-system)
5. [Bridge Communication](#bridge-communication)
6. [Type Definitions](#type-definitions)
7. [Error Handling](#error-handling)
8. [Performance Optimization](#performance-optimization)

## Core Components

### OrbatProvider

Main provider component that wraps your application to enable ORBAT functionality.

**Props:**
```typescript
interface OrbatProviderProps {
  config?: Partial<OrbatConfig>;
  children: React.ReactNode;
  onReady?: () => void;
  onError?: (error: Error) => void;
}
```

**Usage:**
```tsx
import { OrbatProvider } from '@/modules/orbat-integration';

function App() {
  return (
    <OrbatProvider
      config={{
        vueAppUrl: 'http://localhost:5173',
        enableCaching: true,
        enableRealTimeSync: true
      }}
      onReady={() => console.log('ORBAT ready')}
      onError={(error) => console.error('ORBAT error:', error)}
    >
      <YourApp />
    </OrbatProvider>
  );
}
```

### OrbatViewer

Component for displaying ORBAT map or organizational views.

**Props:**
```typescript
interface OrbatViewerProps {
  mode: 'map' | 'org' | 'hybrid';
  scenarioId?: string;
  width?: string | number;
  height?: string | number;
  onUnitClick?: (unit: OrbatUnit) => void;
  onScenarioLoad?: (scenario: OrbatScenario) => void;
  loading?: boolean;
  error?: string;
}
```

**Usage:**
```tsx
import { OrbatViewer } from '@/modules/orbat-integration';

function MapView() {
  return (
    <OrbatViewer
      mode="map"
      scenarioId="scenario-123"
      height="500px"
      onUnitClick={(unit) => console.log('Unit clicked:', unit)}
    />
  );
}
```

### OrbatUnitCard

Card component for displaying unit information.

**Props:**
```typescript
interface OrbatUnitCardProps {
  unit: OrbatUnit;
  compact?: boolean;
  showActions?: boolean;
  onEdit?: (unit: OrbatUnit) => void;
  onDelete?: (unitId: string) => void;
  onView?: (unit: OrbatUnit) => void;
}
```

**Usage:**
```tsx
import { OrbatUnitCard } from '@/modules/orbat-integration';

function UnitList({ units }: { units: OrbatUnit[] }) {
  return (
    <div>
      {units.map(unit => (
        <OrbatUnitCard
          key={unit.id}
          unit={unit}
          showActions={true}
          onEdit={(unit) => editUnit(unit)}
        />
      ))}
    </div>
  );
}
```

## Hooks

### useOrbatBridge

Main hook for communicating with the Vue ORBAT application.

**Returns:**
```typescript
interface UseOrbatBridgeResult {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  sendCommand: (command: string, data?: any) => Promise<any>;
  addEventListener: (event: string, handler: Function) => () => void;
  removeEventListener: (event: string, handler: Function) => void;
}
```

**Usage:**
```tsx
import { useOrbatBridge } from '@/modules/orbat-integration';

function MyComponent() {
  const { isReady, sendCommand, addEventListener } = useOrbatBridge();

  useEffect(() => {
    if (isReady) {
      const unsubscribe = addEventListener('UNIT_CHANGED', (unit) => {
        console.log('Unit changed:', unit);
      });
      return unsubscribe;
    }
  }, [isReady, addEventListener]);

  const loadScenario = async () => {
    try {
      const scenario = await sendCommand('LOAD_SCENARIO', { id: 'scenario-1' });
      console.log('Scenario loaded:', scenario);
    } catch (error) {
      console.error('Failed to load scenario:', error);
    }
  };

  return (
    <button onClick={loadScenario} disabled={!isReady}>
      Load Scenario
    </button>
  );
}
```

### useOrbatData

Hook for managing ORBAT data (scenarios, units, events).

**Returns:**
```typescript
interface UseOrbatDataResult {
  scenarios: OrbatScenario[];
  units: OrbatUnit[];
  events: OrbatEvent[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  getScenario: (id: string) => OrbatScenario | undefined;
  getUnit: (id: string) => OrbatUnit | undefined;
}
```

**Usage:**
```tsx
import { useOrbatData } from '@/modules/orbat-integration';

function DataView() {
  const { scenarios, units, isLoading, refreshData } = useOrbatData();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={refreshData}>Refresh Data</button>
      <div>Scenarios: {scenarios.length}</div>
      <div>Units: {units.length}</div>
    </div>
  );
}
```

### useOrbatCommands

Hook for executing ORBAT commands.

**Returns:**
```typescript
interface UseOrbatCommandsResult {
  executeCommand: (command: string, data?: any) => Promise<any>;
  loadScenario: (scenarioId: string) => Promise<OrbatScenario>;
  addUnit: (unit: Partial<OrbatUnit>) => Promise<OrbatUnit>;
  updateUnit: (unitId: string, updates: Partial<OrbatUnit>) => Promise<OrbatUnit>;
  deleteUnit: (unitId: string) => Promise<void>;
  addEvent: (event: Partial<OrbatEvent>) => Promise<OrbatEvent>;
  isExecuting: boolean;
  lastError: string | null;
}
```

**Usage:**
```tsx
import { useOrbatCommands } from '@/modules/orbat-integration';

function CommandPanel() {
  const { loadScenario, addUnit, isExecuting } = useOrbatCommands();

  const handleLoadScenario = async () => {
    try {
      const scenario = await loadScenario('scenario-123');
      console.log('Loaded:', scenario);
    } catch (error) {
      console.error('Load failed:', error);
    }
  };

  const handleAddUnit = async () => {
    try {
      const unit = await addUnit({
        name: 'Alpha Company',
        unitType: 'INFANTRY',
        sidc: 'SFGPUCII------',
        position: { lat: 40.7128, lon: -74.0060 }
      });
      console.log('Unit added:', unit);
    } catch (error) {
      console.error('Add failed:', error);
    }
  };

  return (
    <div>
      <button onClick={handleLoadScenario} disabled={isExecuting}>
        Load Scenario
      </button>
      <button onClick={handleAddUnit} disabled={isExecuting}>
        Add Unit
      </button>
    </div>
  );
}
```

### useOrbatEvents

Hook for subscribing to ORBAT events.

**Returns:**
```typescript
interface UseOrbatEventsResult {
  onUnitChanged: (handler: (unit: OrbatUnit) => void) => () => void;
  onUnitAdded: (handler: (unit: OrbatUnit) => void) => () => void;
  onUnitDeleted: (handler: (unitId: string) => void) => () => void;
  onScenarioLoaded: (handler: (data: any) => void) => () => void;
  onMapClicked: (handler: (coords: { lat: number; lon: number }) => void) => () => void;
  onError: (handler: (error: Error) => void) => () => void;
}
```

**Usage:**
```tsx
import { useOrbatEvents } from '@/modules/orbat-integration';

function EventListener() {
  const { onUnitChanged, onScenarioLoaded } = useOrbatEvents();

  useEffect(() => {
    const unsubscribe1 = onUnitChanged((unit) => {
      console.log('Unit changed:', unit);
    });

    const unsubscribe2 = onScenarioLoaded((data) => {
      console.log('Scenario loaded:', data);
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [onUnitChanged, onScenarioLoaded]);

  return <div>Listening for events...</div>;
}
```

## Security System

### SecurityProvider

Provider for security context and authentication.

**Props:**
```typescript
interface SecurityProviderProps {
  children: React.ReactNode;
  config?: Partial<SecurityConfig>;
}

interface SecurityConfig {
  sessionTimeout: number;
  maxSessions: number;
  requireAuthentication: boolean;
  enableAuditLogging: boolean;
  restrictedMode: boolean;
  allowedOrigins: string[];
  minClearanceLevel: 'PUBLIC' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
}
```

**Usage:**
```tsx
import { SecurityProvider } from '@/modules/orbat-integration/security';

function App() {
  return (
    <SecurityProvider
      config={{
        sessionTimeout: 60,
        requireAuthentication: true,
        enableAuditLogging: true,
        minClearanceLevel: 'CONFIDENTIAL'
      }}
    >
      <YourSecureApp />
    </SecurityProvider>
  );
}
```

### useSecurityMiddleware

Hook for accessing security context.

**Returns:**
```typescript
interface SecurityContextType {
  user: SecurityUser | null;
  session: SecuritySession | null;
  isAuthenticated: boolean;
  isAuthorized: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasClearance: (level: SecurityUser['clearanceLevel']) => boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  checkSession: () => boolean;
  refreshSession: () => void;
}
```

**Usage:**
```tsx
import { useSecurityMiddleware } from '@/modules/orbat-integration/security';

function SecureComponent() {
  const { isAuthenticated, user, login, logout } = useSecurityMiddleware();

  if (!isAuthenticated) {
    return (
      <LoginForm
        onLogin={async (credentials) => {
          const success = await login(credentials);
          if (!success) {
            alert('Login failed');
          }
        }}
      />
    );
  }

  return (
    <div>
      <div>Welcome, {user?.username}!</div>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### SecurityGuard

Component for protecting content based on permissions.

**Props:**
```typescript
interface SecurityGuardProps {
  children: React.ReactNode;
  permission?: string;
  role?: string;
  clearance?: SecurityUser['clearanceLevel'];
  fallback?: React.ReactNode;
}
```

**Usage:**
```tsx
import { SecurityGuard } from '@/modules/orbat-integration/security';

function AdminPanel() {
  return (
    <SecurityGuard
      role="ADMIN"
      fallback={<div>Access denied</div>}
    >
      <AdminContent />
    </SecurityGuard>
  );
}

function ClassifiedData() {
  return (
    <SecurityGuard
      clearance="SECRET"
      fallback={<div>Insufficient clearance</div>}
    >
      <SecretInformation />
    </SecurityGuard>
  );
}
```

## Template System

### OrbatMasterLayout

Master layout template for ORBAT applications.

**Props:**
```typescript
interface OrbatLayoutProps {
  config?: Partial<LayoutConfig>;
  areas: LayoutArea[];
  navItems?: NavigationItem[];
  title?: string;
  onNavigate?: (item: NavigationItem) => void;
  onDrawerToggle?: (open: boolean) => void;
  loading?: boolean;
  error?: string;
}
```

**Usage:**
```tsx
import { OrbatMasterLayout } from '@/modules/orbat-integration/templates';

function AppLayout() {
  const areas = [
    { id: 'main', component: <MainContent /> },
    { id: 'sidebar', component: <Sidebar /> }
  ];

  return (
    <OrbatMasterLayout
      title="ORBAT Command Center"
      areas={areas}
      onNavigate={(item) => navigate(item.path)}
    />
  );
}
```

### OrbatDashboardTemplate

Dashboard template with widget system.

**Props:**
```typescript
interface OrbatDashboardProps {
  scenario?: OrbatScenario;
  units?: OrbatUnit[];
  events?: OrbatEvent[];
  layouts?: DashboardLayout[];
  defaultLayout?: string;
  onLayoutChange?: (layout: DashboardLayout) => void;
  onWidgetUpdate?: (widget: DashboardWidget) => void;
  editable?: boolean;
}
```

**Usage:**
```tsx
import { OrbatDashboardTemplate } from '@/modules/orbat-integration/templates';

function Dashboard({ scenario, units, events }) {
  return (
    <OrbatDashboardTemplate
      scenario={scenario}
      units={units}
      events={events}
      editable={true}
      onLayoutChange={(layout) => saveLayout(layout)}
    />
  );
}
```

### ResponsiveProvider

Provider for responsive layout system.

**Props:**
```typescript
interface ResponsiveProviderProps {
  children: React.ReactNode;
  gridConfig?: Partial<GridConfig>;
  layoutBreakpoints?: Partial<LayoutBreakpoints>;
}
```

**Usage:**
```tsx
import { ResponsiveProvider, ResponsiveGrid } from '@/modules/orbat-integration/templates';

function ResponsiveApp() {
  return (
    <ResponsiveProvider
      gridConfig={{ columns: { xs: 1, sm: 2, md: 3, lg: 4 } }}
    >
      <ResponsiveGrid>
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </ResponsiveGrid>
    </ResponsiveProvider>
  );
}
```

## Bridge Communication

### Message Types

The bridge supports several message types for communication:

#### Commands
```typescript
// Load scenario
await sendCommand('LOAD_SCENARIO', { id: 'scenario-123' });

// Add unit
await sendCommand('ADD_UNIT', {
  name: 'Bravo Company',
  unitType: 'INFANTRY',
  sidc: 'SFGPUCII------',
  position: { lat: 40.7128, lon: -74.0060 }
});

// Update unit
await sendCommand('UPDATE_UNIT', {
  id: 'unit-123',
  updates: { name: 'Updated Name' }
});

// Delete unit
await sendCommand('DELETE_UNIT', { id: 'unit-123' });

// Zoom to unit
await sendCommand('ZOOM_TO_UNIT', { unitId: 'unit-123' });

// Get scenarios
const scenarios = await sendCommand('GET_SCENARIOS');

// Get units
const units = await sendCommand('GET_UNITS');
```

#### Events
```typescript
// Listen for events
addEventListener('UNIT_CHANGED', (unit) => {
  console.log('Unit changed:', unit);
});

addEventListener('SCENARIO_LOADED', (data) => {
  console.log('Scenario loaded:', data);
});

addEventListener('MAP_CLICKED', (coords) => {
  console.log('Map clicked at:', coords);
});

addEventListener('SYSTEM_READY', () => {
  console.log('Vue ORBAT system is ready');
});

addEventListener('ERROR', (error) => {
  console.error('ORBAT error:', error);
});
```

## Type Definitions

### Core Types

```typescript
interface OrbatUnit {
  id: string;
  name: string;
  unitType: UnitType;
  sidc: string;
  position: Coordinate;
  status: UnitStatus;
  parent?: string;
  children?: string[];
  properties?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

interface OrbatEvent {
  id: string;
  type: EventType;
  unitId: string;
  description: string;
  startTime: string;
  endTime?: string;
  location?: Coordinate;
  properties?: Record<string, any>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface OrbatScenario {
  id: string;
  name: string;
  description?: string;
  startTime: string;
  endTime?: string;
  bounds?: GeographicBounds;
  properties?: Record<string, any>;
  units?: OrbatUnit[];
  events?: OrbatEvent[];
}

interface Coordinate {
  lat: number;
  lon: number;
  alt?: number;
}

type UnitType = 'INFANTRY' | 'ARMOR' | 'ARTILLERY' | 'AVIATION' | 'NAVAL' | 
                'ENGINEER' | 'LOGISTICS' | 'MEDICAL' | 'COMMUNICATION' | 'OTHER';

type UnitStatus = 'ACTIVE' | 'INACTIVE' | 'DESTROYED' | 'DAMAGED' | 'MAINTENANCE';

type EventType = 'MOVEMENT' | 'ENGAGEMENT' | 'STATUS_CHANGE' | 'COMMUNICATION' | 'OTHER';
```

### Configuration Types

```typescript
interface OrbatConfig {
  vueAppUrl: string;
  enableCaching: boolean;
  cacheExpiration: number;
  enableRealTimeSync: boolean;
  syncInterval: number;
  commandTimeout: number;
  retryAttempts: number;
  enableDebugMode: boolean;
  enablePerformanceMonitoring: boolean;
}
```

## Error Handling

### Error Types

```typescript
class OrbatError extends Error {
  code: string;
  details?: any;
  constructor(message: string, code: string, details?: any);
}

class OrbatConnectionError extends OrbatError {
  // Connection-related errors
}

class OrbatValidationError extends OrbatError {
  // Data validation errors
}

class OrbatSecurityError extends OrbatError {
  // Security-related errors
}
```

### Error Handling Best Practices

```tsx
import { useOrbatCommands } from '@/modules/orbat-integration';

function SafeComponent() {
  const { executeCommand } = useOrbatCommands();

  const handleAction = async () => {
    try {
      await executeCommand('LOAD_SCENARIO', { id: 'scenario-1' });
    } catch (error) {
      if (error instanceof OrbatConnectionError) {
        // Handle connection issues
        console.error('Connection error:', error.message);
      } else if (error instanceof OrbatValidationError) {
        // Handle validation issues
        console.error('Validation error:', error.details);
      } else {
        // Handle generic errors
        console.error('Unknown error:', error);
      }
    }
  };

  return <button onClick={handleAction}>Execute Action</button>;
}
```

## Performance Optimization

### Best Practices

1. **Use React.memo for pure components:**
```tsx
const OrbatUnitCard = React.memo(({ unit }) => {
  // Component implementation
});
```

2. **Optimize re-renders with useCallback:**
```tsx
const handleUnitClick = useCallback((unit: OrbatUnit) => {
  // Handle click
}, []);
```

3. **Use useMemo for expensive calculations:**
```tsx
const filteredUnits = useMemo(() => {
  return units.filter(unit => unit.status === 'ACTIVE');
}, [units]);
```

4. **Implement virtual scrolling for large lists:**
```tsx
import { ResponsiveGrid } from '@/modules/orbat-integration/templates';

<ResponsiveGrid virtualization={{ enabled: true, itemHeight: 100 }}>
  {units.map(unit => <UnitCard key={unit.id} unit={unit} />)}
</ResponsiveGrid>
```

### Performance Monitoring

```tsx
import { useOrbatBridge } from '@/modules/orbat-integration';

function MonitoredComponent() {
  const { performance } = useOrbatBridge();
  
  useEffect(() => {
    console.log('Performance metrics:', performance);
  }, [performance]);
  
  return <div>Component content</div>;
}
```

## Advanced Usage

### Custom Hooks

```tsx
// Custom hook for unit management
function useUnitManager(scenarioId: string) {
  const { executeCommand } = useOrbatCommands();
  const { units } = useOrbatData();
  
  const addUnit = useCallback(async (unitData: Partial<OrbatUnit>) => {
    return executeCommand('ADD_UNIT', { ...unitData, scenarioId });
  }, [executeCommand, scenarioId]);
  
  const updateUnit = useCallback(async (unitId: string, updates: Partial<OrbatUnit>) => {
    return executeCommand('UPDATE_UNIT', { id: unitId, updates });
  }, [executeCommand]);
  
  const deleteUnit = useCallback(async (unitId: string) => {
    return executeCommand('DELETE_UNIT', { id: unitId });
  }, [executeCommand]);
  
  return {
    units: units.filter(unit => unit.scenarioId === scenarioId),
    addUnit,
    updateUnit,
    deleteUnit
  };
}
```

### Integration with State Management

```tsx
// Redux integration example
import { useDispatch, useSelector } from 'react-redux';
import { useOrbatEvents } from '@/modules/orbat-integration';

function ReduxIntegration() {
  const dispatch = useDispatch();
  const { onUnitChanged } = useOrbatEvents();
  
  useEffect(() => {
    return onUnitChanged((unit) => {
      dispatch({ type: 'UNIT_UPDATED', payload: unit });
    });
  }, [dispatch, onUnitChanged]);
  
  return <div>Redux integrated component</div>;
}
```

### Custom Security Policies

```tsx
import { useSecurityPolicy } from '@/modules/orbat-integration/security';

function CustomSecurityComponent() {
  const { manager, evaluatePolicies } = useSecurityPolicy();
  
  const checkAccess = useCallback((action: string, resource: string) => {
    const result = evaluatePolicies({
      action,
      resource,
      user: getCurrentUser(),
      timestamp: new Date()
    });
    
    return result.allowed;
  }, [evaluatePolicies]);
  
  return (
    <div>
      {checkAccess('READ', 'units') && <UnitsList />}
      {checkAccess('write', 'scenarios') && <ScenarioEditor />}
    </div>
  );
}
```

---

## Support and Contributing

For issues, questions, or contributions, please refer to the project repository and documentation.

**Version:** 1.0.0  
**Last Updated:** 2024  
**License:** Proprietary
