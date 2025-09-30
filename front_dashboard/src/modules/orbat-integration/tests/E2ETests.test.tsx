import { describe, beforeAll, afterAll, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Import test utilities
import { TestWrapper, mockUnit, mockEvent, mockScenario } from './ComponentTests.test';

// Import components for E2E testing
import { OrbatProvider } from '../components/OrbatProvider';
import { OrbatViewer } from '../components/OrbatViewer';
import { OrbatDashboardTemplate } from '../templates/dashboards/OrbatDashboardTemplate';
import { SecurityProvider } from '../security/SecurityMiddleware';
import { useOrbatCommands, useOrbatData, useOrbatEvents } from '../hooks';

// Test scenarios configuration
const E2E_CONFIG = {
  vueAppUrl: 'http://localhost:5173',
  enableCaching: true,
  enableRealTimeSync: true,
  enableDebugMode: true,
  commandTimeout: 60000,
  retryAttempts: 3
};

// Mock Vue ORBAT responses
const mockVueResponses = {
  'GET_SCENARIOS': [
    mockScenario,
    {
      id: 'scenario-2',
      name: 'Defensive Operations',
      description: 'Defensive military scenario',
      startTime: new Date().toISOString(),
      units: [],
      events: []
    }
  ],
  'LOAD_SCENARIO': mockScenario,
  'GET_UNITS': [mockUnit],
  'ADD_UNIT': (data: any) => ({
    id: `unit-${Date.now()}`,
    ...data,
    createdAt: new Date().toISOString()
  }),
  'UPDATE_UNIT': (data: any) => ({
    ...data.updates,
    id: data.id,
    updatedAt: new Date().toISOString()
  }),
  'DELETE_UNIT': { success: true },
  'ZOOM_TO_UNIT': { success: true }
};

// E2E Test Application Component
const E2ETestApp: React.FC = () => {
  const [currentScenario, setCurrentScenario] = React.useState<string | null>(null);
  const [testResults, setTestResults] = React.useState<string[]>([]);
  
  const { scenarios, units, events, isLoading } = useOrbatData();
  const { loadScenario, addUnit, updateUnit, deleteUnit } = useOrbatCommands();
  const { onUnitChanged, onScenarioLoaded } = useOrbatEvents();

  // Subscribe to events
  React.useEffect(() => {
    const unsubscribe1 = onUnitChanged((unit) => {
      setTestResults(prev => [...prev, `Event: Unit ${unit.name} changed`]);
    });

    const unsubscribe2 = onScenarioLoaded((data) => {
      setTestResults(prev => [...prev, `Event: Scenario ${data.scenarioId} loaded`]);
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [onUnitChanged, onScenarioLoaded]);

  const runE2ETest = async () => {
    setTestResults(['Starting E2E test...']);
    try {
      // Step 1: Load scenario
      const scenario = await loadScenario('scenario-1');
      setCurrentScenario(scenario.id);
      setTestResults(prev => [...prev, `✓ Loaded scenario: ${scenario.name}`]);

      // Step 2: Add new unit
      const newUnit = await addUnit({
        name: 'E2E Test Unit',
        unitType: 'ARMOR',
        sidc: 'SFGPUCA-------',
        position: { lat: 41.0, lon: -74.5 },
        status: 'ACTIVE'
      });
      setTestResults(prev => [...prev, `✓ Added unit: ${newUnit.name}`]);

      // Step 3: Update unit
      const updatedUnit = await updateUnit(newUnit.id, {
        name: 'Updated E2E Test Unit',
        status: 'MAINTENANCE'
      });
      setTestResults(prev => [...prev, `✓ Updated unit: ${updatedUnit.name}`]);

      // Step 4: Delete unit
      await deleteUnit(newUnit.id);
      setTestResults(prev => [...prev, `✓ Deleted unit: ${newUnit.id}`]);

      setTestResults(prev => [...prev, '🎉 E2E test completed successfully!']);
    } catch (error) {
      setTestResults(prev => [...prev, `❌ E2E test failed: ${error.message}`]);
    }
  };

  return (
    <div data-testid="e2e-test-app">
      <div data-testid="loading-state">
        {isLoading ? 'Loading...' : 'Ready'}
      </div>
      
      <div data-testid="data-counts">
        <span data-testid="scenarios-count">{scenarios.length}</span>
        <span data-testid="units-count">{units.length}</span>
        <span data-testid="events-count">{events.length}</span>
      </div>

      <button
        data-testid="run-e2e-test"
        onClick={runE2ETest}
        disabled={isLoading}
      >
        Run E2E Test
      </button>

      <div data-testid="current-scenario">
        {currentScenario || 'No scenario loaded'}
      </div>

      <div data-testid="test-results">
        {testResults.map((result, index) => (
          <div key={index} data-testid={`result-${index}`}>
            {result}
          </div>
        ))}
      </div>
    </div>
  );
};

// Dashboard E2E Test Component
const DashboardE2ETest: React.FC = () => {
  const [layoutChanged, setLayoutChanged] = React.useState(false);
  const [widgetUpdated, setWidgetUpdated] = React.useState(false);

  return (
    <div data-testid="dashboard-e2e">
      <OrbatDashboardTemplate
        scenario={mockScenario}
        units={[mockUnit]}
        events={[mockEvent]}
        editable={true}
        onLayoutChange={() => setLayoutChanged(true)}
        onWidgetUpdate={() => setWidgetUpdated(true)}
      />
      
      <div data-testid="dashboard-interactions">
        <span data-testid="layout-changed">{layoutChanged.toString()}</span>
        <span data-testid="widget-updated">{widgetUpdated.toString()}</span>
      </div>
    </div>
  );
};

// Mock message handler for Vue communication
const createMockMessageHandler = () => {
  let messageHandlers: ((event: MessageEvent) => void)[] = [];
  
  const mockWindow = {
    addEventListener: vi.fn((type: string, handler: (event: MessageEvent) => void) => {
      if (type === 'message') {
        messageHandlers.push(handler);
      }
    }),
    removeEventListener: vi.fn((type: string, handler: (event: MessageEvent) => void) => {
      messageHandlers = messageHandlers.filter(h => h !== handler);
    }),
    postMessage: vi.fn()
  };

  const simulateVueResponse = (command: string, data?: any) => {
    const response = {
      id: `response-${Date.now()}`,
      type: 'RESPONSE',
      success: true,
      data: typeof mockVueResponses[command] === 'function' 
        ? mockVueResponses[command](data)
        : mockVueResponses[command],
      timestamp: new Date()
    };

    const messageEvent = {
      data: response,
      origin: 'http://localhost:5173',
      source: null,
      ports: []
    } as MessageEvent;

    messageHandlers.forEach(handler => handler(messageEvent));
  };

  return { mockWindow, simulateVueResponse };
};

describe('ORBAT Integration - End-to-End Testing Scenarios', () => {
  let mockMessageHandler: ReturnType<typeof createMockMessageHandler>;

  beforeAll(() => {
    mockMessageHandler = createMockMessageHandler();
    Object.defineProperty(global, 'window', {
      value: mockMessageHandler.mockWindow,
      writable: true
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Application Workflow', () => {
    it('should complete full ORBAT workflow from start to finish', async () => {
      const user = userEvent.setup();

      render(
        <SecurityProvider>
          <OrbatProvider config={E2E_CONFIG}>
            <E2ETestApp />
          </OrbatProvider>
        </SecurityProvider>
      );

      // Wait for app to be ready
      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('Ready');
      });

      // Simulate Vue responses for all commands
      setTimeout(() => {
        mockMessageHandler.simulateVueResponse('GET_SCENARIOS');
        mockMessageHandler.simulateVueResponse('GET_UNITS');
      }, 100);

      // Run the E2E test
      const runButton = screen.getByTestId('run-e2e-test');
      await user.click(runButton);

      // Simulate Vue responses for test commands
      setTimeout(() => {
        mockMessageHandler.simulateVueResponse('LOAD_SCENARIO');
        mockMessageHandler.simulateVueResponse('ADD_UNIT', {
          name: 'E2E Test Unit',
          unitType: 'ARMOR'
        });
        mockMessageHandler.simulateVueResponse('UPDATE_UNIT', {
          id: 'unit-123',
          updates: { name: 'Updated E2E Test Unit' }
        });
        mockMessageHandler.simulateVueResponse('DELETE_UNIT');
      }, 200);

      // Wait for test completion
      await waitFor(() => {
        const results = screen.getByTestId('test-results');
        expect(results).toHaveTextContent('🎉 E2E test completed successfully!');
      }, { timeout: 10000 });

      // Verify all test steps completed
      expect(screen.getByTestId('result-1')).toHaveTextContent('✓ Loaded scenario:');
      expect(screen.getByTestId('result-2')).toHaveTextContent('✓ Added unit:');
      expect(screen.getByTestId('result-3')).toHaveTextContent('✓ Updated unit:');
      expect(screen.getByTestId('result-4')).toHaveTextContent('✓ Deleted unit:');
    });

    it('should handle error scenarios gracefully', async () => {
      const user = userEvent.setup();

      render(
        <SecurityProvider>
          <OrbatProvider config={E2E_CONFIG}>
            <E2ETestApp />
          </OrbatProvider>
        </SecurityProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('Ready');
      });

      // Run test but simulate error response
      const runButton = screen.getByTestId('run-e2e-test');
      await user.click(runButton);

      // Simulate error response
      setTimeout(() => {
        const errorResponse = {
          id: `error-${Date.now()}`,
          type: 'RESPONSE',
          success: false,
          error: 'Simulated Vue error',
          timestamp: new Date()
        };

        const messageEvent = {
          data: errorResponse,
          origin: 'http://localhost:5173'
        } as MessageEvent;

        mockMessageHandler.mockWindow.addEventListener.mock.calls
          .filter(call => call[0] === 'message')
          .forEach(call => call[1](messageEvent));
      }, 200);

      // Wait for error handling
      await waitFor(() => {
        const results = screen.getByTestId('test-results');
        expect(results).toHaveTextContent('❌ E2E test failed:');
      }, { timeout: 5000 });
    });
  });

  describe('User Interaction Scenarios', () => {
    it('should handle complete map interaction workflow', async () => {
      const user = userEvent.setup();
      const onUnitClick = vi.fn();
      const onScenarioLoad = vi.fn();

      render(
        <TestWrapper>
          <div data-testid="map-interaction-test">
            <OrbatViewer
              mode="map"
              scenarioId="scenario-1"
              height="400px"
              onUnitClick={onUnitClick}
              onScenarioLoad={onScenarioLoad}
            />
          </div>
        </TestWrapper>
      );

      const viewer = screen.getByTestId('orbat-viewer');
      expect(viewer).toBeInTheDocument();

      // Simulate map interactions
      await user.click(viewer);
      
      // Wait for interactions to process
      await waitFor(() => {
        expect(viewer).toBeInTheDocument();
      });
    });

    it('should handle dashboard customization workflow', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <DashboardE2ETest />
        </TestWrapper>
      );

      const dashboard = screen.getByTestId('dashboard-e2e');
      expect(dashboard).toBeInTheDocument();

      // Find and interact with dashboard elements
      const editSwitch = screen.getByLabelText('Edit');
      if (editSwitch) {
        await user.click(editSwitch);
      }

      // Look for layout tabs
      const layoutTabs = screen.queryAllByRole('tab');
      if (layoutTabs.length > 1) {
        await user.click(layoutTabs[1]);
        
        await waitFor(() => {
          expect(screen.getByTestId('layout-changed')).toHaveTextContent('true');
        });
      }
    });

    it('should handle authentication workflow', async () => {
      const user = userEvent.setup();

      const AuthTestComponent = () => {
        const { login, logout, isAuthenticated, user: currentUser } = useSecurityMiddleware();
        const [loginResult, setLoginResult] = React.useState<string>('');

        const handleLogin = async () => {
          try {
            const success = await login({ username: 'admin', password: 'admin123' });
            setLoginResult(success ? 'Login successful' : 'Login failed');
          } catch (error) {
            setLoginResult(`Login error: ${error.message}`);
          }
        };

        return (
          <div data-testid="auth-test">
            <div data-testid="auth-status">
              {isAuthenticated ? `Authenticated as ${currentUser?.username}` : 'Not authenticated'}
            </div>
            <button data-testid="login-btn" onClick={handleLogin}>
              Login
            </button>
            <button data-testid="logout-btn" onClick={logout}>
              Logout
            </button>
            <div data-testid="login-result">{loginResult}</div>
          </div>
        );
      };

      render(
        <SecurityProvider>
          <AuthTestComponent />
        </SecurityProvider>
      );

      // Initial state
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');

      // Attempt login
      const loginBtn = screen.getByTestId('login-btn');
      await user.click(loginBtn);

      // Wait for login result
      await waitFor(() => {
        const result = screen.getByTestId('login-result');
        expect(result).toHaveTextContent('Login successful');
      });

      // Check authenticated state
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated as admin');
      });

      // Test logout
      const logoutBtn = screen.getByTestId('logout-btn');
      await user.click(logoutBtn);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
      });
    });
  });

  describe('Data Flow Scenarios', () => {
    it('should handle real-time data synchronization', async () => {
      const EventTestComponent = () => {
        const { onUnitChanged, onScenarioLoaded } = useOrbatEvents();
        const [events, setEvents] = React.useState<string[]>([]);

        React.useEffect(() => {
          const unsubscribe1 = onUnitChanged((unit) => {
            setEvents(prev => [...prev, `Unit changed: ${unit.name}`]);
          });

          const unsubscribe2 = onScenarioLoaded((data) => {
            setEvents(prev => [...prev, `Scenario loaded: ${data.scenarioId}`]);
          });

          return () => {
            unsubscribe1();
            unsubscribe2();
          };
        }, [onUnitChanged, onScenarioLoaded]);

        return (
          <div data-testid="event-test">
            <div data-testid="events-list">
              {events.map((event, index) => (
                <div key={index} data-testid={`event-${index}`}>
                  {event}
                </div>
              ))}
            </div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <EventTestComponent />
        </TestWrapper>
      );

      // Simulate real-time events from Vue
      setTimeout(() => {
        const unitChangedEvent = {
          type: 'EVENT',
          eventType: 'UNIT_CHANGED',
          data: { name: 'Test Unit Alpha', id: 'unit-1' }
        };

        const scenarioLoadedEvent = {
          type: 'EVENT',
          eventType: 'SCENARIO_LOADED',
          data: { scenarioId: 'scenario-1' }
        };

        const messageHandler = mockMessageHandler.mockWindow.addEventListener.mock.calls
          .find(call => call[0] === 'message')?.[1];

        if (messageHandler) {
          messageHandler({
            data: unitChangedEvent,
            origin: 'http://localhost:5173'
          } as MessageEvent);

          setTimeout(() => {
            messageHandler({
              data: scenarioLoadedEvent,
              origin: 'http://localhost:5173'
            } as MessageEvent);
          }, 100);
        }
      }, 500);

      // Wait for events to be processed
      await waitFor(() => {
        expect(screen.getByTestId('event-0')).toHaveTextContent('Unit changed: Test Unit Alpha');
      }, { timeout: 3000 });

      await waitFor(() => {
        expect(screen.getByTestId('event-1')).toHaveTextContent('Scenario loaded: scenario-1');
      }, { timeout: 3000 });
    });

    it('should handle data caching and invalidation', async () => {
      const CacheTestComponent = () => {
        const { scenarios, units, refreshData } = useOrbatData();
        const [refreshCount, setRefreshCount] = React.useState(0);

        const handleRefresh = async () => {
          await refreshData();
          setRefreshCount(prev => prev + 1);
        };

        return (
          <div data-testid="cache-test">
            <div data-testid="scenarios-count">{scenarios.length}</div>
            <div data-testid="units-count">{units.length}</div>
            <div data-testid="refresh-count">{refreshCount}</div>
            <button data-testid="refresh-btn" onClick={handleRefresh}>
              Refresh Data
            </button>
          </div>
        );
      };

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CacheTestComponent />
        </TestWrapper>
      );

      // Initial state
      await waitFor(() => {
        expect(screen.getByTestId('scenarios-count')).toBeInTheDocument();
      });

      // Trigger refresh
      const refreshBtn = screen.getByTestId('refresh-btn');
      await user.click(refreshBtn);

      // Simulate new data response
      setTimeout(() => {
        mockMessageHandler.simulateVueResponse('GET_SCENARIOS');
        mockMessageHandler.simulateVueResponse('GET_UNITS');
      }, 100);

      await waitFor(() => {
        expect(screen.getByTestId('refresh-count')).toHaveTextContent('1');
      });
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should recover from connection failures', async () => {
      const ConnectionTestComponent = () => {
        const { isReady, error, sendCommand } = useOrbatBridge();
        const [testResult, setTestResult] = React.useState<string>('');

        const testConnection = async () => {
          try {
            await sendCommand('PING');
            setTestResult('Connection successful');
          } catch (err) {
            setTestResult(`Connection failed: ${err.message}`);
          }
        };

        return (
          <div data-testid="connection-test">
            <div data-testid="ready-state">{isReady ? 'Ready' : 'Not Ready'}</div>
            <div data-testid="error-state">{error || 'No error'}</div>
            <div data-testid="test-result">{testResult}</div>
            <button data-testid="test-connection" onClick={testConnection}>
              Test Connection
            </button>
          </div>
        );
      };

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ConnectionTestComponent />
        </TestWrapper>
      );

      const testBtn = screen.getByTestId('test-connection');
      await user.click(testBtn);

      // Simulate connection error then recovery
      setTimeout(() => {
        const errorResponse = {
          id: 'error-response',
          type: 'RESPONSE',
          success: false,
          error: 'Connection timeout'
        };

        const messageHandler = mockMessageHandler.mockWindow.addEventListener.mock.calls
          .find(call => call[0] === 'message')?.[1];

        if (messageHandler) {
          messageHandler({
            data: errorResponse,
            origin: 'http://localhost:5173'
          } as MessageEvent);
        }
      }, 100);

      await waitFor(() => {
        expect(screen.getByTestId('test-result')).toHaveTextContent('Connection failed:');
      });
    });
  });

  describe('Performance Scenarios', () => {
    it('should handle large dataset operations efficiently', async () => {
      const PerformanceTestComponent = () => {
        const { executeCommand } = useOrbatCommands();
        const [operationTime, setOperationTime] = React.useState<number>(0);
        const [operationCount, setOperationCount] = React.useState<number>(0);

        const runPerformanceTest = async () => {
          const startTime = performance.now();
          const operations = [];

          // Create multiple operations
          for (let i = 0; i < 10; i++) {
            operations.push(
              executeCommand('ADD_UNIT', {
                name: `Performance Test Unit ${i}`,
                unitType: 'INFANTRY',
                position: { lat: 40 + i * 0.1, lon: -74 + i * 0.1 }
              })
            );
          }

          try {
            await Promise.all(operations);
            const endTime = performance.now();
            setOperationTime(endTime - startTime);
            setOperationCount(operations.length);
          } catch (error) {
            console.error('Performance test failed:', error);
          }
        };

        return (
          <div data-testid="performance-test">
            <div data-testid="operation-time">{operationTime}</div>
            <div data-testid="operation-count">{operationCount}</div>
            <button data-testid="run-performance-test" onClick={runPerformanceTest}>
              Run Performance Test
            </button>
          </div>
        );
      };

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PerformanceTestComponent />
        </TestWrapper>
      );

      // Mock rapid responses
      const rapidResponses = () => {
        for (let i = 0; i < 10; i++) {
          setTimeout(() => {
            mockMessageHandler.simulateVueResponse('ADD_UNIT', {
              name: `Performance Test Unit ${i}`
            });
          }, i * 10); // 10ms apart
        }
      };

      const runBtn = screen.getByTestId('run-performance-test');
      await user.click(runBtn);

      rapidResponses();

      await waitFor(() => {
        expect(screen.getByTestId('operation-count')).toHaveTextContent('10');
      }, { timeout: 5000 });

      // Check that operations completed within reasonable time
      const operationTime = parseFloat(screen.getByTestId('operation-time').textContent || '0');
      expect(operationTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });
});

export { E2ETestApp, DashboardE2ETest };