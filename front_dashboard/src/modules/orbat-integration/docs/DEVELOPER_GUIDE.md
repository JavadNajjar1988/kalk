# ORBAT Integration Developer Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Core Concepts](#core-concepts)
3. [Basic Examples](#basic-examples)
4. [Advanced Examples](#advanced-examples)
5. [Security Implementation](#security-implementation)
6. [Testing Strategies](#testing-strategies)
7. [Performance Optimization](#performance-optimization)
8. [Common Patterns](#common-patterns)

## Getting Started

### Quick Start Example

```tsx
// App.tsx - Minimal setup
import React from 'react';
import { OrbatProvider, OrbatViewer } from './modules/orbat-integration';

function App() {
  return (
    <OrbatProvider config={{ vueAppUrl: 'http://localhost:5173' }}>
      <div>
        <h1>ORBAT Integration Demo</h1>
        <OrbatViewer mode="map" height="400px" />
      </div>
    </OrbatProvider>
  );
}

export default App;
```

### Complete Setup Example

```tsx
// App.tsx - Full featured setup
import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  OrbatProvider, 
  SecuritySuiteProvider,
  ResponsiveProvider 
} from './modules/orbat-integration';

const theme = createTheme({
  palette: { mode: 'light', primary: { main: '#1976d2' } }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <SecuritySuiteProvider>
        <ResponsiveProvider>
          <OrbatProvider
            config={{
              vueAppUrl: 'http://localhost:5173',
              enableCaching: true,
              enableRealTimeSync: true
            }}
          >
            <MainApplication />
          </OrbatProvider>
        </ResponsiveProvider>
      </SecuritySuiteProvider>
    </ThemeProvider>
  );
}
```

## Basic Examples

### 1. Map Viewer Component

```tsx
import React, { useState } from 'react';
import { OrbatViewer, useOrbatData } from './modules/orbat-integration';
import { Button, Box } from '@mui/material';

function MapViewer() {
  const { scenarios, isLoading } = useOrbatData();
  const [currentScenario, setCurrentScenario] = useState(null);

  if (isLoading) return <div>Loading...</div>;

  return (
    <Box>
      <Box mb={2}>
        {scenarios.map(scenario => (
          <Button
            key={scenario.id}
            variant={currentScenario?.id === scenario.id ? 'contained' : 'outlined'}
            onClick={() => setCurrentScenario(scenario)}
            sx={{ mr: 1 }}
          >
            {scenario.name}
          </Button>
        ))}
      </Box>
      
      <OrbatViewer
        mode="map"
        scenarioId={currentScenario?.id}
        height="500px"
        onUnitClick={(unit) => console.log('Unit clicked:', unit)}
        onScenarioLoad={(data) => console.log('Scenario loaded:', data)}
      />
    </Box>
  );
}
```

### 2. Unit Management Component

```tsx
import React, { useState } from 'react';
import { useOrbatCommands, useOrbatData } from './modules/orbat-integration';
import { 
  List, ListItem, ListItemText, Button, 
  Dialog, TextField, Box 
} from '@mui/material';

function UnitManager() {
  const { units, isLoading } = useOrbatData();
  const { addUnit, updateUnit, deleteUnit } = useOrbatCommands();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUnit, setNewUnit] = useState({
    name: '',
    unitType: 'INFANTRY',
    position: { lat: 40.7128, lon: -74.0060 }
  });

  const handleAddUnit = async () => {
    try {
      await addUnit({
        ...newUnit,
        sidc: 'SFGPUCII------',
        status: 'ACTIVE'
      });
      setDialogOpen(false);
      setNewUnit({ name: '', unitType: 'INFANTRY', position: { lat: 0, lon: 0 } });
    } catch (error) {
      console.error('Failed to add unit:', error);
    }
  };

  return (
    <Box>
      <Button variant="contained" onClick={() => setDialogOpen(true)}>
        Add Unit
      </Button>
      
      <List>
        {units.map(unit => (
          <ListItem key={unit.id}>
            <ListItemText 
              primary={unit.name}
              secondary={`${unit.unitType} - ${unit.status}`}
            />
            <Button onClick={() => deleteUnit(unit.id)}>Delete</Button>
          </ListItem>
        ))}
      </List>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <Box p={3}>
          <TextField
            fullWidth
            label="Unit Name"
            value={newUnit.name}
            onChange={(e) => setNewUnit({...newUnit, name: e.target.value})}
            margin="normal"
          />
          <Box mt={2}>
            <Button onClick={handleAddUnit} variant="contained">Add</Button>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}
```

### 3. Event Listener Example

```tsx
import React, { useState, useEffect } from 'react';
import { useOrbatEvents } from './modules/orbat-integration';
import { Alert, Box } from '@mui/material';

function EventMonitor() {
  const [events, setEvents] = useState([]);
  const { onUnitChanged, onScenarioLoaded, onError } = useOrbatEvents();

  useEffect(() => {
    const unsubscribes = [
      onUnitChanged((unit) => {
        setEvents(prev => [...prev, { type: 'UNIT_CHANGED', data: unit }]);
      }),
      
      onScenarioLoaded((data) => {
        setEvents(prev => [...prev, { type: 'SCENARIO_LOADED', data }]);
      }),
      
      onError((error) => {
        setEvents(prev => [...prev, { type: 'ERROR', data: error }]);
      })
    ];

    return () => unsubscribes.forEach(fn => fn());
  }, [onUnitChanged, onScenarioLoaded, onError]);

  return (
    <Box>
      <h3>Event Monitor</h3>
      {events.slice(-5).map((event, index) => (
        <Alert key={index} severity="info" sx={{ mb: 1 }}>
          {event.type}: {JSON.stringify(event.data, null, 2)}
        </Alert>
      ))}
    </Box>
  );
}
```

## Advanced Examples

### 1. Custom Dashboard

```tsx
import React from 'react';
import { 
  OrbatDashboardTemplate, 
  useOrbatData 
} from './modules/orbat-integration';

function CustomDashboard() {
  const { scenarios, units, events } = useOrbatData();
  
  const customLayouts = [
    {
      id: 'tactical',
      name: 'Tactical View',
      widgets: [
        { id: 'map', type: 'map', size: { xs: 12, md: 8 } },
        { id: 'units', type: 'units', size: { xs: 12, md: 4 } }
      ]
    }
  ];

  return (
    <OrbatDashboardTemplate
      scenario={scenarios[0]}
      units={units}
      events={events}
      layouts={customLayouts}
      editable={true}
      onLayoutChange={(layout) => console.log('Layout changed:', layout)}
    />
  );
}
```

### 2. Secure Component with Authentication

```tsx
import React from 'react';
import { 
  SecurityGuard, 
  useSecurityMiddleware 
} from './modules/orbat-integration/security';
import { Button, Box } from '@mui/material';

function SecureOperations() {
  const { user, logout, isAuthenticated } = useSecurityMiddleware();

  if (!isAuthenticated) {
    return <div>Please log in to access this content.</div>;
  }

  return (
    <Box>
      <Box mb={2}>
        Welcome, {user?.username}! 
        <Button onClick={logout} sx={{ ml: 2 }}>Logout</Button>
      </Box>

      <SecurityGuard permission="READ" fallback={<div>No read access</div>}>
        <div>You can read data</div>
      </SecurityGuard>

      <SecurityGuard role="ADMIN" fallback={<div>Admin only</div>}>
        <Button variant="contained" color="error">
          Delete All Data
        </Button>
      </SecurityGuard>

      <SecurityGuard clearance="SECRET" fallback={<div>Insufficient clearance</div>}>
        <div>Classified information visible</div>
      </SecurityGuard>
    </Box>
  );
}
```

## Security Implementation

### Authentication Setup

```tsx
import React, { useState } from 'react';
import { 
  SecurityProvider, 
  useSecurityMiddleware 
} from './modules/orbat-integration/security';
import { TextField, Button, Box } from '@mui/material';

function LoginForm() {
  const { login } = useSecurityMiddleware();
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  const handleLogin = async () => {
    const success = await login(credentials);
    if (!success) alert('Login failed');
  };

  return (
    <Box>
      <TextField
        label="Username"
        value={credentials.username}
        onChange={(e) => setCredentials({...credentials, username: e.target.value})}
      />
      <TextField
        label="Password"
        type="password"
        value={credentials.password}
        onChange={(e) => setCredentials({...credentials, password: e.target.value})}
      />
      <Button onClick={handleLogin}>Login</Button>
    </Box>
  );
}

function App() {
  return (
    <SecurityProvider config={{ requireAuthentication: true }}>
      <LoginForm />
    </SecurityProvider>
  );
}
```

## Testing Strategies

### Unit Testing Example

```tsx
// UnitManager.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import UnitManager from './UnitManager';
import { OrbatProvider } from './modules/orbat-integration';

const mockConfig = {
  vueAppUrl: 'http://localhost:5173',
  enableCaching: false
};

describe('UnitManager', () => {
  it('should add a new unit', async () => {
    render(
      <OrbatProvider config={mockConfig}>
        <UnitManager />
      </OrbatProvider>
    );

    fireEvent.click(screen.getByText('Add Unit'));
    fireEvent.change(screen.getByLabelText('Unit Name'), {
      target: { value: 'Test Unit' }
    });
    fireEvent.click(screen.getByText('Add'));

    await waitFor(() => {
      expect(screen.getByText('Test Unit')).toBeInTheDocument();
    });
  });
});
```

## Performance Optimization

### Memoization Example

```tsx
import React, { useMemo, useCallback } from 'react';
import { useOrbatData } from './modules/orbat-integration';

const UnitList = React.memo(({ units, onUnitClick }) => {
  return (
    <div>
      {units.map(unit => (
        <UnitCard 
          key={unit.id} 
          unit={unit} 
          onClick={() => onUnitClick(unit)}
        />
      ))}
    </div>
  );
});

function OptimizedComponent() {
  const { units } = useOrbatData();
  
  const activeUnits = useMemo(() => 
    units.filter(unit => unit.status === 'ACTIVE'), 
    [units]
  );
  
  const handleUnitClick = useCallback((unit) => {
    console.log('Unit clicked:', unit);
  }, []);

  return (
    <UnitList units={activeUnits} onUnitClick={handleUnitClick} />
  );
}
```

## Common Patterns

### Error Boundary Pattern

```tsx
import React from 'react';

class OrbatErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ORBAT Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Something went wrong with ORBAT integration.</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
function App() {
  return (
    <OrbatErrorBoundary>
      <OrbatProvider>
        <YourApp />
      </OrbatProvider>
    </OrbatErrorBoundary>
  );
}
```

### Loading State Pattern

```tsx
import React from 'react';
import { useOrbatBridge } from './modules/orbat-integration';
import { CircularProgress, Box } from '@mui/material';

function LoadingWrapper({ children }) {
  const { isLoading, error } = useOrbatBridge();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" p={3}>
        <div>Error: {error}</div>
        <button onClick={() => window.location.reload()}>
          Reload
        </button>
      </Box>
    );
  }

  return children;
}
```

---

**Version:** 1.0.0  
**Last Updated:** 2024