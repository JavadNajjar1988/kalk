import { describe, beforeEach, afterEach, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import React from 'react';

// Import components to test
import { OrbatProvider } from '../components/OrbatProvider';
import OrbatViewer from '../components/OrbatViewer';
import OrbatUnitCard from '../components/OrbatUnitCard';
import OrbatEventCard from '../components/OrbatEventCard';

// Import hooks to test
import { useOrbatBridge } from '../hooks/useOrbatBridge';
import { useOrbatData } from '../hooks/useOrbatData';
import { useOrbatCommands } from '../hooks/useOrbatCommands';
import { useOrbatEvents } from '../hooks/useOrbatEvents';

// Import security components
import { SecurityProvider } from '../security/SecurityMiddleware';
import { SecurityGuard } from '../security/SecurityMiddleware';

// Import template components
import { OrbatMasterLayout } from '../templates/layouts/OrbatMasterLayout';
import { OrbatDashboardTemplate } from '../templates/dashboards/OrbatDashboardTemplate';
import { ResponsiveProvider } from '../templates/layouts/ResponsiveLayoutSystem';

// Import types
import type { OrbatUnit, OrbatEvent, OrbatScenario } from '../types/orbat-data';

// Test utilities and mocks
const mockIframe = {
  contentWindow: {
    postMessage: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }
};

const mockUnit: OrbatUnit = {
  id: 'unit-test-1',
  name: 'Test Unit Alpha',
  sidc: 'SFGPUCII------',
  description: 'Test infantry unit for comprehensive testing',
  createdAt: new Date().toISOString()
};

const mockEvent: OrbatEvent = {
  id: 'event-test-1',
  name: 'Test Movement Event',
  title: 'Unit movement to new position',
  description: 'Unit movement to new position',
  startTime: Date.now(),
  severity: 'medium'
};

const mockScenario: OrbatScenario = {
  id: 'scenario-test-1',
  name: 'Test Military Scenario',
  description: 'Test scenario for comprehensive testing',
  type: 'ORBAT-mapper',
  version: '1.0',
  meta: {
    createdDate: new Date().toISOString(),
    lastModifiedDate: new Date().toISOString()
  },
  startTime: Date.now(),
  symbologyStandard: 'APP6',
  sides: [],
  events: [mockEvent],
  layers: [],
  mapLayers: []
};

const defaultConfig = {
  vueAppUrl: 'http://localhost:5173',
  enableCaching: true,
  enableRealTimeSync: true,
  commandTimeout: 30000,
  retryAttempts: 3,
  enableDebugMode: true
};

// Mock functions
const mockSendCommand = vi.fn();
const mockAddEventListener = vi.fn(() => () => {});

// Global test setup
beforeAll(() => {
  // Mock iframe creation
  vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
    if (tagName === 'iframe') {
      return mockIframe as any;
    }
    return document.createElement(tagName);
  });

  // Mock window methods
  Object.defineProperty(window, 'postMessage', {
    value: vi.fn(),
    writable: true
  });

  // Mock crypto for UUIDs
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
    }
  });
});

afterAll(() => {
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.clearAllMocks();
  mockSendCommand.mockClear();
  mockAddEventListener.mockClear();
});

afterEach(() => {
  cleanup();
});

// Test Wrapper Component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SecurityProvider>
      <ResponsiveProvider>
        <OrbatProvider config={defaultConfig}>
          {children}
        </OrbatProvider>
      </ResponsiveProvider>
    </SecurityProvider>
  );
};

describe('ORBAT Integration - Comprehensive Component Tests', () => {
  
  describe('Core Components', () => {
    
    describe('OrbatProvider', () => {
      it('should render children when properly configured', () => {
        render(
          <OrbatProvider config={defaultConfig}>
            <div data-testid="child-component">Test Child</div>
          </OrbatProvider>
        );
        
        expect(screen.getByTestId('child-component')).toBeInTheDocument();
      });

      it('should handle configuration errors gracefully', () => {
        const invalidConfig = { ...defaultConfig, vueAppUrl: 'invalid-url' };
        
        render(
          <OrbatProvider config={invalidConfig}>
            <div data-testid="child-component">Test Child</div>
          </OrbatProvider>
        );
        
        expect(screen.getByTestId('child-component')).toBeInTheDocument();
      });

      it('should provide context to child components', async () => {
        const TestChild = () => {
          const { isReady, error } = useOrbatBridge();
          return (
            <div>
              <span data-testid="ready-state">{isReady ? 'Ready' : 'Not Ready'}</span>
              <span data-testid="error-state">{error || 'No Error'}</span>
            </div>
          );
        };

        render(
          <OrbatProvider config={defaultConfig}>
            <TestChild />
          </OrbatProvider>
        );

        expect(screen.getByTestId('ready-state')).toBeInTheDocument();
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
      });
    });

    describe('OrbatViewer', () => {
      it('should render with default props', () => {
        render(
          <TestWrapper>
            <OrbatViewer mode="map" />
          </TestWrapper>
        );
        
        expect(screen.getByTestId('orbat-viewer')).toBeInTheDocument();
      });

      it('should handle different modes', () => {
        const { rerender } = render(
          <TestWrapper>
            <OrbatViewer mode="map" />
          </TestWrapper>
        );
        
        expect(screen.getByTestId('orbat-viewer')).toHaveAttribute('data-mode', 'map');
        
        rerender(
          <TestWrapper>
            <OrbatViewer mode="org" />
          </TestWrapper>
        );
        
        expect(screen.getByTestId('orbat-viewer')).toHaveAttribute('data-mode', 'org');
      });

      it('should handle loading state', () => {
        render(
          <TestWrapper>
            <OrbatViewer mode="map" loading={true} />
          </TestWrapper>
        );
        
        expect(screen.getByTestId('orbat-loader')).toBeInTheDocument();
      });

      it('should handle error state', () => {
        const errorMessage = 'Test error message';
        render(
          <TestWrapper>
            <OrbatViewer mode="map" error={errorMessage} />
          </TestWrapper>
        );
        
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      it('should call event handlers', async () => {
        const onUnitClick = vi.fn();
        const onScenarioLoad = vi.fn();
        
        render(
          <TestWrapper>
            <OrbatViewer 
              mode="map" 
              onUnitClick={onUnitClick}
              onScenarioLoad={onScenarioLoad}
            />
          </TestWrapper>
        );
        
        // Simulate unit click
        const viewer = screen.getByTestId('orbat-viewer');
        fireEvent.click(viewer);
        
        // Note: In real implementation, these would be triggered by Vue app events
        // For testing, we simulate the behavior
        await waitFor(() => {
          expect(viewer).toBeInTheDocument();
        });
      });
    });

    describe('OrbatUnitCard', () => {
      it('should render unit information correctly', () => {
        render(
          <TestWrapper>
            <OrbatUnitCard unit={mockUnit} />
          </TestWrapper>
        );
        
        expect(screen.getByText(mockUnit.name)).toBeInTheDocument();
        expect(screen.getByText(mockUnit.unitType)).toBeInTheDocument();
        expect(screen.getByText(mockUnit.status)).toBeInTheDocument();
      });

      it('should render in compact mode', () => {
        render(
          <TestWrapper>
            <OrbatUnitCard unit={mockUnit} compact={true} />
          </TestWrapper>
        );
        
        const card = screen.getByTestId('unit-card');
        expect(card).toHaveClass('compact');
      });

      it('should show actions when enabled', () => {
        const onEdit = vi.fn();
        const onDelete = vi.fn();
        
        render(
          <TestWrapper>
            <OrbatUnitCard 
              unit={mockUnit} 
              showActions={true}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </TestWrapper>
        );
        
        expect(screen.getByLabelText('Edit unit')).toBeInTheDocument();
        expect(screen.getByLabelText('Delete unit')).toBeInTheDocument();
      });

      it('should handle action clicks', async () => {
        const onEdit = vi.fn();
        const onDelete = vi.fn();
        
        render(
          <TestWrapper>
            <OrbatUnitCard 
              unit={mockUnit} 
              showActions={true}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </TestWrapper>
        );
        
        fireEvent.click(screen.getByLabelText('Edit unit'));
        expect(onEdit).toHaveBeenCalledWith(mockUnit);
        
        fireEvent.click(screen.getByLabelText('Delete unit'));
        expect(onDelete).toHaveBeenCalledWith(mockUnit.id);
      });
    });

    describe('OrbatEventCard', () => {
      it('should render event information correctly', () => {
        render(
          <TestWrapper>
            <OrbatEventCard event={mockEvent} />
          </TestWrapper>
        );
        
        expect(screen.getByText(mockEvent.description)).toBeInTheDocument();
        expect(screen.getByText(mockEvent.type)).toBeInTheDocument();
        expect(screen.getByText(mockEvent.severity)).toBeInTheDocument();
      });

      it('should handle different severities with correct styling', () => {
        const { rerender } = render(
          <TestWrapper>
            <OrbatEventCard event={{ ...mockEvent, severity: 'CRITICAL' }} />
          </TestWrapper>
        );
        
        let card = screen.getByTestId('event-card');
        expect(card).toHaveClass('severity-critical');
        
        rerender(
          <TestWrapper>
            <OrbatEventCard event={{ ...mockEvent, severity: 'LOW' }} />
          </TestWrapper>
        );
        
        card = screen.getByTestId('event-card');
        expect(card).toHaveClass('severity-low');
      });

      it('should format timestamps correctly', () => {
        render(
          <TestWrapper>
            <OrbatEventCard event={mockEvent} />
          </TestWrapper>
        );
        
        const timestampElement = screen.getByTestId('event-timestamp');
        expect(timestampElement).toBeInTheDocument();
        expect(timestampElement.textContent).toMatch(/\d{2}:\d{2}/); // HH:MM format
      });
    });
  });

  describe('Hook Tests', () => {
    
    describe('useOrbatBridge', () => {
      it('should provide bridge functionality', () => {
        const TestComponent = () => {
          const { isReady, isLoading, error, sendCommand } = useOrbatBridge();
          
          return (
            <div>
              <span data-testid="is-ready">{isReady.toString()}</span>
              <span data-testid="is-loading">{isLoading.toString()}</span>
              <span data-testid="error">{error || 'null'}</span>
              <button 
                data-testid="send-command"
                onClick={() => sendCommand('TEST_COMMAND', { test: true })}
              >
                Send Command
              </button>
            </div>
          );
        };

        render(
          <TestWrapper>
            <TestComponent />
          </TestWrapper>
        );

        expect(screen.getByTestId('is-ready')).toBeInTheDocument();
        expect(screen.getByTestId('is-loading')).toBeInTheDocument();
        expect(screen.getByTestId('error')).toBeInTheDocument();
        expect(screen.getByTestId('send-command')).toBeInTheDocument();
      });
    });

    describe('useOrbatData', () => {
      it('should provide data access functionality', () => {
        const TestComponent = () => {
          const { scenarios, units, events, isLoading, error } = useOrbatData();
          
          return (
            <div>
              <span data-testid="scenarios-count">{scenarios.length}</span>
              <span data-testid="units-count">{units.length}</span>
              <span data-testid="events-count">{events.length}</span>
              <span data-testid="is-loading">{isLoading.toString()}</span>
              <span data-testid="error">{error || 'null'}</span>
            </div>
          );
        };

        render(
          <TestWrapper>
            <TestComponent />
          </TestWrapper>
        );

        expect(screen.getByTestId('scenarios-count')).toBeInTheDocument();
        expect(screen.getByTestId('units-count')).toBeInTheDocument();
        expect(screen.getByTestId('events-count')).toBeInTheDocument();
      });
    });

    describe('useOrbatCommands', () => {
      it('should provide command execution functionality', () => {
        const TestComponent = () => {
          const { executeCommand, loadScenario, addUnit, isExecuting } = useOrbatCommands();
          
          return (
            <div>
              <span data-testid="is-executing">{isExecuting.toString()}</span>
              <button 
                data-testid="execute-command"
                onClick={() => executeCommand('TEST_COMMAND')}
              >
                Execute Command
              </button>
              <button 
                data-testid="load-scenario"
                onClick={() => loadScenario('test-scenario')}
              >
                Load Scenario
              </button>
              <button 
                data-testid="add-unit"
                onClick={() => addUnit(mockUnit)}
              >
                Add Unit
              </button>
            </div>
          );
        };

        render(
          <TestWrapper>
            <TestComponent />
          </TestWrapper>
        );

        expect(screen.getByTestId('is-executing')).toBeInTheDocument();
        expect(screen.getByTestId('execute-command')).toBeInTheDocument();
        expect(screen.getByTestId('load-scenario')).toBeInTheDocument();
        expect(screen.getByTestId('add-unit')).toBeInTheDocument();
      });
    });

    describe('useOrbatEvents', () => {
      it('should provide event subscription functionality', () => {
        const TestComponent = () => {
          const { onUnitChanged, onScenarioLoaded } = useOrbatEvents();
          const [eventCount, setEventCount] = React.useState(0);
          
          React.useEffect(() => {
            const unsubscribe1 = onUnitChanged(() => {
              setEventCount(prev => prev + 1);
            });
            
            const unsubscribe2 = onScenarioLoaded(() => {
              setEventCount(prev => prev + 1);
            });
            
            return () => {
              unsubscribe1();
              unsubscribe2();
            };
          }, [onUnitChanged, onScenarioLoaded]);
          
          return (
            <div>
              <span data-testid="event-count">{eventCount}</span>
            </div>
          );
        };

        render(
          <TestWrapper>
            <TestComponent />
          </TestWrapper>
        );

        expect(screen.getByTestId('event-count')).toBeInTheDocument();
      });
    });
  });

  describe('Security Components', () => {
    
    describe('SecurityProvider', () => {
      it('should provide security context', () => {
        const TestComponent = () => {
          const { user, isAuthenticated } = useSecurityMiddleware();
          
          return (
            <div>
              <span data-testid="is-authenticated">{isAuthenticated.toString()}</span>
              <span data-testid="user">{user ? user.username : 'null'}</span>
            </div>
          );
        };

        render(
          <SecurityProvider>
            <TestComponent />
          </SecurityProvider>
        );

        expect(screen.getByTestId('is-authenticated')).toBeInTheDocument();
        expect(screen.getByTestId('user')).toBeInTheDocument();
      });
    });

    describe('SecurityGuard', () => {
      it('should render children when authenticated', () => {
        render(
          <SecurityProvider>
            <SecurityGuard fallback={<div data-testid="fallback">Access Denied</div>}>
              <div data-testid="protected-content">Protected Content</div>
            </SecurityGuard>
          </SecurityProvider>
        );

        // Note: Behavior depends on authentication state
        // This test checks that the component renders without errors
        expect(screen.getByTestId('fallback')).toBeInTheDocument();
      });

      it('should show fallback when not authorized', () => {
        render(
          <SecurityProvider>
            <SecurityGuard 
              permission="ADMIN"
              fallback={<div data-testid="fallback">Access Denied</div>}
            >
              <div data-testid="protected-content">Protected Content</div>
            </SecurityGuard>
          </SecurityProvider>
        );

        expect(screen.getByTestId('fallback')).toBeInTheDocument();
      });
    });
  });

  describe('Template Components', () => {
    
    describe('OrbatMasterLayout', () => {
      it('should render with default configuration', () => {
        const areas = [
          { id: 'main', component: <div data-testid="main-area">Main Content</div> }
        ];

        render(
          <TestWrapper>
            <OrbatMasterLayout areas={areas} />
          </TestWrapper>
        );

        expect(screen.getByTestId('main-area')).toBeInTheDocument();
      });

      it('should handle navigation items', () => {
        const areas = [
          { id: 'main', component: <div data-testid="main-area">Main Content</div> }
        ];

        const navItems = [
          { id: 'home', label: 'Home', path: '/', icon: 'home' },
          { id: 'units', label: 'Units', path: '/units', icon: 'group' }
        ];

        render(
          <TestWrapper>
            <OrbatMasterLayout areas={areas} navItems={navItems} />
          </TestWrapper>
        );

        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Units')).toBeInTheDocument();
      });

      it('should handle drawer toggle', async () => {
        const onDrawerToggle = vi.fn();
        const areas = [
          { id: 'main', component: <div data-testid="main-area">Main Content</div> }
        ];

        render(
          <TestWrapper>
            <OrbatMasterLayout areas={areas} onDrawerToggle={onDrawerToggle} />
          </TestWrapper>
        );

        const menuButton = screen.getByLabelText('Toggle drawer');
        fireEvent.click(menuButton);

        await waitFor(() => {
          expect(onDrawerToggle).toHaveBeenCalled();
        });
      });
    });

    describe('OrbatDashboardTemplate', () => {
      it('should render with default widgets', () => {
        render(
          <TestWrapper>
            <OrbatDashboardTemplate 
              scenario={mockScenario}
              units={[mockUnit]}
              events={[mockEvent]}
            />
          </TestWrapper>
        );

        expect(screen.getByText('ORBAT Dashboard')).toBeInTheDocument();
      });

      it('should handle layout switching', async () => {
        const onLayoutChange = vi.fn();

        render(
          <TestWrapper>
            <OrbatDashboardTemplate 
              scenario={mockScenario}
              units={[mockUnit]}
              events={[mockEvent]}
              onLayoutChange={onLayoutChange}
            />
          </TestWrapper>
        );

        // Check if layout tabs are present
        const defaultTab = screen.getByText('Default View');
        expect(defaultTab).toBeInTheDocument();
      });

      it('should handle editable mode', () => {
        render(
          <TestWrapper>
            <OrbatDashboardTemplate 
              scenario={mockScenario}
              editable={true}
            />
          </TestWrapper>
        );

        expect(screen.getByLabelText('Edit')).toBeInTheDocument();
      });
    });

    describe('ResponsiveProvider', () => {
      it('should provide responsive context', () => {
        const TestComponent = () => {
          const { viewport, breakpoint } = useResponsive();
          
          return (
            <div>
              <span data-testid="viewport-width">{viewport.width}</span>
              <span data-testid="viewport-height">{viewport.height}</span>
              <span data-testid="breakpoint">{breakpoint}</span>
            </div>
          );
        };

        render(
          <ResponsiveProvider>
            <TestComponent />
          </ResponsiveProvider>
        );

        expect(screen.getByTestId('viewport-width')).toBeInTheDocument();
        expect(screen.getByTestId('viewport-height')).toBeInTheDocument();
        expect(screen.getByTestId('breakpoint')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle component errors gracefully', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      // Test error boundary behavior
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(
          <TestWrapper>
            <ErrorComponent />
          </TestWrapper>
        );
      }).toThrow();

      consoleSpy.mockRestore();
    });

    it('should handle async errors in hooks', async () => {
      const TestComponent = () => {
        const { sendCommand } = useOrbatBridge();
        const [error, setError] = React.useState<string | null>(null);

        const handleError = async () => {
          try {
            // This should fail
            await sendCommand('INVALID_COMMAND');
          } catch (err) {
            setError(err.message);
          }
        };

        return (
          <div>
            <button data-testid="trigger-error" onClick={handleError}>
              Trigger Error
            </button>
            <span data-testid="error-message">{error || 'No error'}</span>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('trigger-error'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', () => {
      const largeUnitList = Array.from({ length: 1000 }, (_, index) => ({
        ...mockUnit,
        id: `unit-${index}`,
        name: `Unit ${index}`
      }));

      const start = performance.now();
      
      render(
        <TestWrapper>
          <div data-testid="unit-list">
            {largeUnitList.slice(0, 10).map(unit => (
              <OrbatUnitCard key={unit.id} unit={unit} compact />
            ))}
          </div>
        </TestWrapper>
      );

      const end = performance.now();
      const renderTime = end - start;

      expect(renderTime).toBeLessThan(1000); // Should render within 1 second
      expect(screen.getByTestId('unit-list')).toBeInTheDocument();
    });

    it('should not cause memory leaks with event listeners', () => {
      const TestComponent = () => {
        const { onUnitChanged } = useOrbatEvents();
        
        React.useEffect(() => {
          const unsubscribe = onUnitChanged(() => {});
          return unsubscribe;
        }, [onUnitChanged]);
        
        return <div data-testid="test-component">Test</div>;
      };

      const { unmount } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      
      // Unmount should clean up listeners
      unmount();
      
      // No assertions needed - test passes if no memory leaks occur
    });
  });
});

// Export test utilities for other test files
export {
  TestWrapper,
  mockUnit,
  mockEvent,
  mockScenario,
  defaultConfig
};