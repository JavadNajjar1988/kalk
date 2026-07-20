import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { OrbatProvider, OrbatViewer } from '../components';
import { useOrbatCommands, useOrbatData, useOrbatEvents } from '../hooks';
import type { OrbatScenario, OrbatUnit } from '../types/orbat-data';

// Mock component to test hooks integration
const TestIntegrationComponent: React.FC = () => {
  const { loadScenario, addUnit, executeCommand } = useOrbatCommands();
  const { scenarios, units, isLoading, error } = useOrbatData();
  const { onUnitChanged, onScenarioLoaded } = useOrbatEvents();
  const [testResults, setTestResults] = React.useState<string[]>([]);

  React.useEffect(() => {
    // Subscribe to events
    const unsubscribeUnitChanged = onUnitChanged((unit) => {
      setTestResults(prev => [...prev, `Unit changed: ${unit.name}`]);
    });

    const unsubscribeScenarioLoaded = onScenarioLoaded((data) => {
      setTestResults(prev => [...prev, `Scenario loaded: ${data.scenarioId}`]);
    });

    return () => {
      unsubscribeUnitChanged();
      unsubscribeScenarioLoaded();
    };
  }, [onUnitChanged, onScenarioLoaded]);

  const runIntegrationTest = async () => {
    try {
      setTestResults(['Starting integration test...']);

      // Test 1: Load scenario
      const scenario = await loadScenario('test-scenario-1');
      setTestResults(prev => [...prev, `✓ Scenario loaded: ${scenario.name}`]);

      // Test 2: Add unit
      const newUnit = await addUnit({
        name: 'Test Unit Alpha',
        unitType: 'INFANTRY',
        sidc: 'SFGPUCII------',
        position: { lat: 40.7128, lon: -74.0060 },
        status: 'ACTIVE'
      });
      setTestResults(prev => [...prev, `✓ Unit added: ${newUnit.name}`]);

      // Test 3: Execute map command
      await executeCommand('ZOOM_TO_UNIT', { unitId: newUnit.id });
      setTestResults(prev => [...prev, `✓ Map zoomed to unit`]);

      // Test 4: Update unit
      const updatedUnit = await executeCommand('UPDATE_UNIT', {
        id: newUnit.id,
        updates: { name: 'Updated Test Unit Alpha' }
      });
      setTestResults(prev => [...prev, `✓ Unit updated: ${updatedUnit.name}`]);

      setTestResults(prev => [...prev, '✅ All integration tests passed!']);
    } catch (error) {
      setTestResults(prev => [...prev, `❌ Test failed: ${error.message}`]);
    }
  };

  return (
    <div data-testid="integration-test">
      <div data-testid="loading-state">{isLoading ? 'Loading' : 'Ready'}</div>
      <div data-testid="error-state">{error || 'No errors'}</div>
      <div data-testid="scenarios-count">{scenarios.length}</div>
      <div data-testid="units-count">{units.length}</div>
      
      <button 
        data-testid="run-test-button" 
        onClick={runIntegrationTest}
      >
        Run Integration Test
      </button>
      
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

// Mock iframe element for testing
const createMockIframe = () => {
  const iframe = document.createElement('iframe');
  iframe.src = 'http://localhost:5173';
  
  // Mock contentWindow
  Object.defineProperty(iframe, 'contentWindow', {
    value: {
      postMessage: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    },
    writable: true
  });

  return iframe;
};

// Mock message responses
const mockMessageResponses = {
  'LOAD_SCENARIO': {
    id: 'test-scenario-1',
    name: 'Test Military Scenario',
    description: 'A test scenario for integration testing',
    units: [],
    events: [],
    createdAt: new Date().toISOString()
  },
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
  'ZOOM_TO_UNIT': { success: true },
  'GET_SCENARIOS': [
    {
      id: 'scenario-1',
      name: 'Demo Scenario 1',
      description: 'First demo scenario'
    },
    {
      id: 'scenario-2', 
      name: 'Demo Scenario 2',
      description: 'Second demo scenario'
    }
  ],
  'GET_UNITS': [
    {
      id: 'unit-1',
      name: 'Alpha Company',
      unitType: 'INFANTRY',
      position: { lat: 40.7128, lon: -74.0060 }
    }
  ]
};

describe('Integration Tests - React-Vue Communication', () => {
  let mockIframe: HTMLIFrameElement;
  let originalCreateElement: typeof document.createElement;

  beforeEach(() => {
    // Mock iframe creation
    originalCreateElement = document.createElement;
    document.createElement = vi.fn().mockImplementation((tagName) => {
      if (tagName === 'iframe') {
        mockIframe = createMockIframe();
        return mockIframe;
      }
      return originalCreateElement.call(document, tagName);
    });

    // Mock window.postMessage
    global.window.postMessage = vi.fn();
    
    // Setup message event simulation
    global.window.addEventListener = vi.fn();
    global.window.removeEventListener = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.createElement = originalCreateElement;
  });

  describe('Full Integration Flow', () => {
    it('should complete end-to-end scenario workflow', async () => {
      const config = {
        vueAppUrl: 'http://localhost:5173',
        enableCaching: true,
        enableRealTimeSync: true
      };

      // Simulate message handling
      const simulateVueResponse = (command: string, data?: any) => {
        setTimeout(() => {
          const response = {
            id: `response-${Date.now()}`,
            type: 'RESPONSE',
            success: true,
            data: typeof mockMessageResponses[command] === 'function' 
              ? mockMessageResponses[command](data)
              : mockMessageResponses[command],
            timestamp: new Date()
          };

          // Find and call the message event handler
          const messageHandler = global.window.addEventListener.mock.calls
            .find(call => call[0] === 'message')?.[1];
          
          if (messageHandler) {
            messageHandler({
              data: response,
              origin: 'http://localhost:5173'
            });
          }
        }, 100);
      };

      // Mock iframe message handling
      if (mockIframe && mockIframe.contentWindow) {
        mockIframe.contentWindow.postMessage = vi.fn().mockImplementation((message) => {
          simulateVueResponse(message.command, message.data);
        });
      }

      const { getByTestId, findByTestId } = render(
        <OrbatProvider config={config}>
          <TestIntegrationComponent />
        </OrbatProvider>
      );

      // Wait for component to be ready
      await waitFor(() => {
        expect(getByTestId('loading-state')).toHaveTextContent('Ready');
      });

      // Run integration test
      const runButton = getByTestId('run-test-button');
      fireEvent.click(runButton);

      // Wait for test completion
      await waitFor(() => {
        const results = getByTestId('test-results');
        expect(results).toHaveTextContent('✅ All integration tests passed!');
      }, { timeout: 5000 });

      // Verify test results
      expect(getByTestId('result-0')).toHaveTextContent('Starting integration test...');
      expect(getByTestId('result-1')).toHaveTextContent('✓ Scenario loaded: Test Military Scenario');
      expect(getByTestId('result-2')).toHaveTextContent('✓ Unit added: Test Unit Alpha');
      expect(getByTestId('result-3')).toHaveTextContent('✓ Map zoomed to unit');
      expect(getByTestId('result-4')).toHaveTextContent('✓ Unit updated: Updated Test Unit Alpha');
      expect(getByTestId('result-5')).toHaveTextContent('✅ All integration tests passed!');
    });

    it('should handle Vue application loading states', async () => {
      const config = {
        vueAppUrl: 'http://localhost:5173',
        enableCaching: false
      };

      const { getByTestId } = render(
        <OrbatProvider config={config}>
          <OrbatViewer 
            mode="map" 
            scenarioId="test-scenario"
            height="400px"
          />
        </OrbatProvider>
      );

      // Should show loading initially
      expect(getByTestId('orbat-loader')).toBeInTheDocument();
      
      // Simulate Vue app ready
      setTimeout(() => {
        const readyEvent = {
          data: {
            type: 'EVENT',
            eventType: 'SYSTEM_READY',
            data: { version: '1.0.0' }
          },
          origin: 'http://localhost:5173'
        };

        const messageHandler = global.window.addEventListener.mock.calls
          .find(call => call[0] === 'message')?.[1];
        
        if (messageHandler) {
          messageHandler(readyEvent);
        }
      }, 200);

      // Wait for ready state
      await waitFor(() => {
        expect(screen.queryByTestId('orbat-loader')).not.toBeInTheDocument();
      });
    });

    it('should handle communication errors gracefully', async () => {
      const config = {
        vueAppUrl: 'http://localhost:5173',
        enableCaching: false
      };

      // Mock error response
      if (mockIframe && mockIframe.contentWindow) {
        mockIframe.contentWindow.postMessage = vi.fn().mockImplementation(() => {
          setTimeout(() => {
            const errorResponse = {
              id: `error-${Date.now()}`,
              type: 'RESPONSE',
              success: false,
              error: 'Vue application not ready',
              timestamp: new Date()
            };

            const messageHandler = global.window.addEventListener.mock.calls
              .find(call => call[0] === 'message')?.[1];
            
            if (messageHandler) {
              messageHandler({
                data: errorResponse,
                origin: 'http://localhost:5173'
              });
            }
          }, 100);
        });
      }

      const { getByTestId } = render(
        <OrbatProvider config={config}>
          <TestIntegrationComponent />
        </OrbatProvider>
      );

      // Click run test button
      const runButton = getByTestId('run-test-button');
      fireEvent.click(runButton);

      // Should show error
      await waitFor(() => {
        const results = getByTestId('test-results');
        expect(results).toHaveTextContent('❌ Test failed:');
      });
    });

    it('should handle real-time event synchronization', async () => {
      const config = {
        vueAppUrl: 'http://localhost:5173',
        enableRealTimeSync: true
      };

      const TestEventComponent: React.FC = () => {
        const { onUnitChanged, onScenarioLoaded } = useOrbatEvents();
        const [events, setEvents] = React.useState<string[]>([]);

        React.useEffect(() => {
          const unsubscribe1 = onUnitChanged((unit) => {
            setEvents(prev => [...prev, `Unit: ${unit.name}`]);
          });

          const unsubscribe2 = onScenarioLoaded((data) => {
            setEvents(prev => [...prev, `Scenario: ${data.scenarioId}`]);
          });

          return () => {
            unsubscribe1();
            unsubscribe2();
          };
        }, [onUnitChanged, onScenarioLoaded]);

        return (
          <div data-testid="event-component">
            {events.map((event, index) => (
              <div key={index} data-testid={`event-${index}`}>
                {event}
              </div>
            ))}
          </div>
        );
      };

      const { getByTestId } = render(
        <OrbatProvider config={config}>
          <TestEventComponent />
        </OrbatProvider>
      );

      // Simulate Vue events
      setTimeout(() => {
        const events = [
          {
            type: 'EVENT',
            eventType: 'UNIT_CHANGED',
            data: { name: 'Bravo Company', id: 'unit-2' }
          },
          {
            type: 'EVENT', 
            eventType: 'SCENARIO_LOADED',
            data: { scenarioId: 'scenario-123' }
          }
        ];

        const messageHandler = global.window.addEventListener.mock.calls
          .find(call => call[0] === 'message')?.[1];

        events.forEach((event, index) => {
          setTimeout(() => {
            if (messageHandler) {
              messageHandler({
                data: event,
                origin: 'http://localhost:5173'
              });
            }
          }, index * 100);
        });
      }, 200);

      // Wait for events
      await waitFor(() => {
        expect(getByTestId('event-0')).toHaveTextContent('Unit: Bravo Company');
        expect(getByTestId('event-1')).toHaveTextContent('Scenario: scenario-123');
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple rapid commands efficiently', async () => {
      const config = {
        vueAppUrl: 'http://localhost:5173',
        enableCaching: true
      };

      const PerformanceTestComponent: React.FC = () => {
        const { executeCommand } = useOrbatCommands();
        const [commandCount, setCommandCount] = React.useState(0);
        const [startTime, setStartTime] = React.useState<number>(0);
        const [endTime, setEndTime] = React.useState<number>(0);

        const runPerformanceTest = async () => {
          setStartTime(Date.now());
          setCommandCount(0);

          const commands = Array.from({ length: 10 }, (_, i) => 
            executeCommand('ZOOM_TO_UNIT', { unitId: `unit-${i}` })
          );

          try {
            await Promise.all(commands);
            setCommandCount(10);
            setEndTime(Date.now());
          } catch (error) {
            console.error('Performance test failed:', error);
          }
        };

        return (
          <div data-testid="performance-test">
            <button onClick={runPerformanceTest} data-testid="run-performance">
              Run Performance Test
            </button>
            <div data-testid="command-count">{commandCount}</div>
            <div data-testid="duration">{endTime - startTime}</div>
          </div>
        );
      };

      // Mock rapid responses
      if (mockIframe && mockIframe.contentWindow) {
        mockIframe.contentWindow.postMessage = vi.fn().mockImplementation(() => {
          setTimeout(() => {
            const response = {
              id: `response-${Date.now()}`,
              type: 'RESPONSE',
              success: true,
              data: { success: true },
              timestamp: new Date()
            };

            const messageHandler = global.window.addEventListener.mock.calls
              .find(call => call[0] === 'message')?.[1];
            
            if (messageHandler) {
              messageHandler({
                data: response,
                origin: 'http://localhost:5173'
              });
            }
          }, 10); // Very fast response
        });
      }

      const { getByTestId } = render(
        <OrbatProvider config={config}>
          <PerformanceTestComponent />
        </OrbatProvider>
      );

      const runButton = getByTestId('run-performance');
      fireEvent.click(runButton);

      await waitFor(() => {
        expect(getByTestId('command-count')).toHaveTextContent('10');
      });

      const duration = parseInt(getByTestId('duration').textContent || '0');
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});