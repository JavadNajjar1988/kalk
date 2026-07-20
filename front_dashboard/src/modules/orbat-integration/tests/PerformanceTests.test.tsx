import { describe, beforeAll, afterAll, beforeEach, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';

// Import test utilities and components
import { TestWrapper, mockUnit, mockEvent, mockScenario } from './ComponentTests.test';
import { OrbatViewer } from '../components/OrbatViewer';
import { OrbatUnitCard } from '../components/OrbatUnitCard';
import { OrbatDashboardTemplate } from '../templates/dashboards/OrbatDashboardTemplate';
import { ResponsiveGrid } from '../templates/layouts/ResponsiveLayoutSystem';
import { useOrbatData, useOrbatCommands } from '../hooks';

// Performance measurement utilities
class PerformanceBenchmark {
  private static measurements: Map<string, number[]> = new Map();

  static startMeasurement(name: string): string {
    const measurementId = `${name}-${Date.now()}-${Math.random()}`;
    performance.mark(`${measurementId}-start`);
    return measurementId;
  }

  static endMeasurement(measurementId: string): number {
    const endMark = `${measurementId}-end`;
    performance.mark(endMark);
    
    const startMark = `${measurementId}-start`;
    performance.measure(measurementId, startMark, endMark);
    
    const entries = performance.getEntriesByName(measurementId);
    const duration = entries[entries.length - 1]?.duration || 0;
    
    // Store measurement
    const baseName = measurementId.split('-')[0];
    if (!this.measurements.has(baseName)) {
      this.measurements.set(baseName, []);
    }
    this.measurements.get(baseName)!.push(duration);
    
    // Clean up marks and measures
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measurementId);
    
    return duration;
  }

  static getStatistics(name: string) {
    const durations = this.measurements.get(name) || [];
    if (durations.length === 0) {
      return { min: 0, max: 0, avg: 0, count: 0, p95: 0, p99: 0 };
    }

    const sorted = [...durations].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const avg = durations.reduce((sum, val) => sum + val, 0) / durations.length;
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return { min, max, avg, count: durations.length, p95, p99 };
  }

  static clearMeasurements(): void {
    this.measurements.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }
}

// Memory usage monitoring
class MemoryMonitor {
  private static initialMemory: number = 0;

  static startMonitoring(): void {
    if ('memory' in performance) {
      this.initialMemory = (performance as any).memory.usedJSHeapSize;
    }
  }

  static getMemoryUsage(): number {
    if ('memory' in performance) {
      const currentMemory = (performance as any).memory.usedJSHeapSize;
      return currentMemory - this.initialMemory;
    }
    return 0;
  }

  static getMemoryInfo() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };
    }
    return { used: 0, total: 0, limit: 0 };
  }
}

// Generate test data
const generateUnits = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockUnit,
    id: `unit-${index}`,
    name: `Unit ${index}`,
    position: {
      lat: 40 + (index % 10) * 0.1,
      lon: -74 + (index % 10) * 0.1
    }
  }));
};

const generateEvents = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockEvent,
    id: `event-${index}`,
    description: `Event ${index} description`,
    unitId: `unit-${index % 10}`
  }));
};

// Performance test components
const PerformanceTestComponent: React.FC<{
  unitCount: number;
  onRenderComplete?: (duration: number) => void;
}> = ({ unitCount, onRenderComplete }) => {
  const [renderTime, setRenderTime] = React.useState<number>(0);
  const units = React.useMemo(() => generateUnits(unitCount), [unitCount]);

  React.useEffect(() => {
    const measurementId = PerformanceBenchmark.startMeasurement('component-render');
    
    // Use setTimeout to measure after render is complete
    setTimeout(() => {
      const duration = PerformanceBenchmark.endMeasurement(measurementId);
      setRenderTime(duration);
      onRenderComplete?.(duration);
    }, 0);
  }, [units, onRenderComplete]);

  return (
    <div data-testid="performance-test-component">
      <div data-testid="render-time">{renderTime}</div>
      <div data-testid="unit-count">{units.length}</div>
      <div data-testid="unit-list">
        {units.map(unit => (
          <OrbatUnitCard key={unit.id} unit={unit} compact />
        ))}
      </div>
    </div>
  );
};

const VirtualizedPerformanceTest: React.FC<{
  itemCount: number;
  onRenderComplete?: (duration: number) => void;
}> = ({ itemCount, onRenderComplete }) => {
  const units = React.useMemo(() => generateUnits(itemCount), [itemCount]);
  const [renderTime, setRenderTime] = React.useState<number>(0);

  React.useEffect(() => {
    const measurementId = PerformanceBenchmark.startMeasurement('virtualized-render');
    
    setTimeout(() => {
      const duration = PerformanceBenchmark.endMeasurement(measurementId);
      setRenderTime(duration);
      onRenderComplete?.(duration);
    }, 0);
  }, [units, onRenderComplete]);

  return (
    <div data-testid="virtualized-performance-test">
      <div data-testid="render-time">{renderTime}</div>
      <ResponsiveGrid
        config={{
          columns: { xs: 1, sm: 2, md: 3, lg: 4 },
          spacing: { xs: 1, sm: 1, md: 2, lg: 2 }
        }}
        virtualization={{ enabled: true, itemHeight: 150 }}
      >
        {units.map(unit => (
          <OrbatUnitCard key={unit.id} unit={unit} compact />
        ))}
      </ResponsiveGrid>
    </div>
  );
};

const CommandPerformanceTest: React.FC = () => {
  const { executeCommand } = useOrbatCommands();
  const [results, setResults] = React.useState<{
    totalTime: number;
    commandCount: number;
    avgTime: number;
  }>({ totalTime: 0, commandCount: 0, avgTime: 0 });

  const runCommandBenchmark = async (commandCount: number = 100) => {
    const measurementId = PerformanceBenchmark.startMeasurement('command-batch');
    
    const commands = Array.from({ length: commandCount }, (_, i) => 
      executeCommand('ADD_UNIT', {
        name: `Benchmark Unit ${i}`,
        unitType: 'INFANTRY',
        position: { lat: 40 + i * 0.001, lon: -74 + i * 0.001 }
      })
    );

    try {
      await Promise.all(commands);
      const totalTime = PerformanceBenchmark.endMeasurement(measurementId);
      setResults({
        totalTime,
        commandCount,
        avgTime: totalTime / commandCount
      });
    } catch (error) {
      console.error('Command benchmark failed:', error);
    }
  };

  React.useEffect(() => {
    runCommandBenchmark(10); // Start with smaller number for testing
  }, []);

  return (
    <div data-testid="command-performance-test">
      <div data-testid="total-time">{results.totalTime}</div>
      <div data-testid="command-count">{results.commandCount}</div>
      <div data-testid="avg-time">{results.avgTime}</div>
    </div>
  );
};

describe('ORBAT Integration - Performance Testing and Benchmarks', () => {
  beforeAll(() => {
    MemoryMonitor.startMonitoring();
    PerformanceBenchmark.clearMeasurements();
  });

  afterAll(() => {
    PerformanceBenchmark.clearMeasurements();
  });

  beforeEach(() => {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  describe('Component Rendering Performance', () => {
    it('should render small unit lists efficiently (< 100ms)', async () => {
      const onRenderComplete = vi.fn();
      
      render(
        <TestWrapper>
          <PerformanceTestComponent 
            unitCount={10}
            onRenderComplete={onRenderComplete}
          />
        </TestWrapper>
      );

      await vi.waitFor(() => {
        expect(onRenderComplete).toHaveBeenCalled();
      }, { timeout: 5000 });

      const renderTime = onRenderComplete.mock.calls[0][0];
      expect(renderTime).toBeLessThan(100); // Should render within 100ms
      
      const stats = PerformanceBenchmark.getStatistics('component-render');
      expect(stats.avg).toBeLessThan(100);
    });

    it('should handle medium unit lists reasonably (< 500ms)', async () => {
      const onRenderComplete = vi.fn();
      
      render(
        <TestWrapper>
          <PerformanceTestComponent 
            unitCount={100}
            onRenderComplete={onRenderComplete}
          />
        </TestWrapper>
      );

      await vi.waitFor(() => {
        expect(onRenderComplete).toHaveBeenCalled();
      }, { timeout: 10000 });

      const renderTime = onRenderComplete.mock.calls[0][0];
      expect(renderTime).toBeLessThan(500); // Should render within 500ms
    });

    it('should show performance improvement with virtualization', async () => {
      const regularOnComplete = vi.fn();
      const virtualizedOnComplete = vi.fn();

      // Regular rendering
      const { unmount: unmountRegular } = render(
        <TestWrapper>
          <PerformanceTestComponent 
            unitCount={200}
            onRenderComplete={regularOnComplete}
          />
        </TestWrapper>
      );

      await vi.waitFor(() => {
        expect(regularOnComplete).toHaveBeenCalled();
      }, { timeout: 10000 });

      const regularTime = regularOnComplete.mock.calls[0][0];
      unmountRegular();

      // Virtualized rendering
      render(
        <TestWrapper>
          <VirtualizedPerformanceTest 
            itemCount={200}
            onRenderComplete={virtualizedOnComplete}
          />
        </TestWrapper>
      );

      await vi.waitFor(() => {
        expect(virtualizedOnComplete).toHaveBeenCalled();
      }, { timeout: 10000 });

      const virtualizedTime = virtualizedOnComplete.mock.calls[0][0];

      // Virtualized should be significantly faster for large lists
      expect(virtualizedTime).toBeLessThan(regularTime * 0.8); // At least 20% improvement
    });

    it('should measure dashboard rendering performance', async () => {
      const units = generateUnits(50);
      const events = generateEvents(20);

      const measurementId = PerformanceBenchmark.startMeasurement('dashboard-render');

      render(
        <TestWrapper>
          <OrbatDashboardTemplate
            scenario={mockScenario}
            units={units}
            events={events}
          />
        </TestWrapper>
      );

      await vi.waitFor(() => {
        expect(screen.getByText('ORBAT Dashboard')).toBeInTheDocument();
      });

      const renderTime = PerformanceBenchmark.endMeasurement(measurementId);
      expect(renderTime).toBeLessThan(1000); // Dashboard should render within 1 second
    });
  });

  describe('Memory Usage Benchmarks', () => {
    it('should not cause significant memory leaks', async () => {
      const initialMemory = MemoryMonitor.getMemoryUsage();
      const iterations = 10;

      for (let i = 0; i < iterations; i++) {
        const { unmount } = render(
          <TestWrapper>
            <PerformanceTestComponent unitCount={50} />
          </TestWrapper>
        );

        await vi.waitFor(() => {
          expect(screen.getByTestId('unit-count')).toHaveTextContent('50');
        });

        unmount();
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = MemoryMonitor.getMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB for this test)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should track memory usage during large operations', () => {
      const initialInfo = MemoryMonitor.getMemoryInfo();
      
      // Create large dataset
      const largeUnits = generateUnits(1000);
      
      render(
        <TestWrapper>
          <div data-testid="large-dataset">
            {largeUnits.slice(0, 100).map(unit => (
              <OrbatUnitCard key={unit.id} unit={unit} />
            ))}
          </div>
        </TestWrapper>
      );

      const finalInfo = MemoryMonitor.getMemoryInfo();
      const memoryUsed = finalInfo.used - initialInfo.used;

      // Should use memory but not exceed reasonable limits
      expect(memoryUsed).toBeGreaterThan(0);
      expect(memoryUsed).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
    });
  });

  describe('Bridge Communication Performance', () => {
    it('should handle rapid command execution efficiently', async () => {
      render(
        <TestWrapper>
          <CommandPerformanceTest />
        </TestWrapper>
      );

      await vi.waitFor(() => {
        const totalTime = parseFloat(screen.getByTestId('total-time').textContent || '0');
        const commandCount = parseInt(screen.getByTestId('command-count').textContent || '0');
        const avgTime = parseFloat(screen.getByTestId('avg-time').textContent || '0');

        expect(commandCount).toBeGreaterThan(0);
        expect(totalTime).toBeGreaterThan(0);
        expect(avgTime).toBeLessThan(100); // Average command should take less than 100ms
      }, { timeout: 15000 });
    });

    it('should measure event handling latency', async () => {
      const EventLatencyTest = () => {
        const { onUnitChanged } = useOrbatEvents();
        const [latencies, setLatencies] = React.useState<number[]>([]);

        React.useEffect(() => {
          const unsubscribe = onUnitChanged((unit) => {
            const eventTime = Date.now();
            const eventLatency = eventTime - (unit.timestamp || eventTime);
            setLatencies(prev => [...prev, eventLatency]);
          });

          return unsubscribe;
        }, [onUnitChanged]);

        const triggerEvents = () => {
          // Simulate multiple events
          for (let i = 0; i < 10; i++) {
            setTimeout(() => {
              // Simulate event from Vue
              window.dispatchEvent(new CustomEvent('unit-changed', {
                detail: { ...mockUnit, timestamp: Date.now() }
              }));
            }, i * 10);
          }
        };

        React.useEffect(() => {
          triggerEvents();
        }, []);

        const avgLatency = latencies.length > 0 
          ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length 
          : 0;

        return (
          <div data-testid="event-latency-test">
            <div data-testid="event-count">{latencies.length}</div>
            <div data-testid="avg-latency">{avgLatency}</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <EventLatencyTest />
        </TestWrapper>
      );

      await vi.waitFor(() => {
        const eventCount = parseInt(screen.getByTestId('event-count').textContent || '0');
        expect(eventCount).toBeGreaterThan(0);
      }, { timeout: 5000 });

      const avgLatency = parseFloat(screen.getByTestId('avg-latency').textContent || '0');
      expect(avgLatency).toBeLessThan(50); // Events should be handled within 50ms
    });
  });

  describe('Data Processing Benchmarks', () => {
    it('should efficiently process large datasets', () => {
      const DataProcessingTest = () => {
        const [processingTime, setProcessingTime] = React.useState<number>(0);
        const [processedCount, setProcessedCount] = React.useState<number>(0);

        React.useEffect(() => {
          const measurementId = PerformanceBenchmark.startMeasurement('data-processing');
          
          // Simulate data processing
          const largeDataset = generateUnits(5000);
          
          // Process data (filter, sort, transform)
          const processedData = largeDataset
            .filter(unit => unit.status === 'ACTIVE')
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(unit => ({
              ...unit,
              processed: true,
              processedAt: Date.now()
            }));

          const duration = PerformanceBenchmark.endMeasurement(measurementId);
          setProcessingTime(duration);
          setProcessedCount(processedData.length);
        }, []);

        return (
          <div data-testid="data-processing-test">
            <div data-testid="processing-time">{processingTime}</div>
            <div data-testid="processed-count">{processedCount}</div>
          </div>
        );
      };

      render(<DataProcessingTest />);

      const processingTime = parseFloat(screen.getByTestId('processing-time').textContent || '0');
      const processedCount = parseInt(screen.getByTestId('processed-count').textContent || '0');

      expect(processedCount).toBeGreaterThan(0);
      expect(processingTime).toBeLessThan(1000); // Should process within 1 second
    });

    it('should handle validation performance', () => {
      const ValidationPerformanceTest = () => {
        const [validationTime, setValidationTime] = React.useState<number>(0);
        const [validatedCount, setValidatedCount] = React.useState<number>(0);

        React.useEffect(() => {
          const measurementId = PerformanceBenchmark.startMeasurement('validation');
          
          const unitsToValidate = generateUnits(1000);
          let validCount = 0;

          unitsToValidate.forEach(unit => {
            // Simulate validation logic
            if (unit.name && unit.sidc && unit.position && unit.status) {
              validCount++;
            }
          });

          const duration = PerformanceBenchmark.endMeasurement(measurementId);
          setValidationTime(duration);
          setValidatedCount(validCount);
        }, []);

        return (
          <div data-testid="validation-performance-test">
            <div data-testid="validation-time">{validationTime}</div>
            <div data-testid="validated-count">{validatedCount}</div>
          </div>
        );
      };

      render(<ValidationPerformanceTest />);

      const validationTime = parseFloat(screen.getByTestId('validation-time').textContent || '0');
      const validatedCount = parseInt(screen.getByTestId('validated-count').textContent || '0');

      expect(validatedCount).toBe(1000); // All should be valid
      expect(validationTime).toBeLessThan(100); // Should validate quickly
    });
  });

  describe('Responsive Layout Performance', () => {
    it('should handle viewport changes efficiently', async () => {
      const ViewportChangeTest = () => {
        const [resizeCount, setResizeCount] = React.useState<number>(0);
        const [lastResizeTime, setLastResizeTime] = React.useState<number>(0);

        React.useEffect(() => {
          const handleResize = () => {
            const measurementId = PerformanceBenchmark.startMeasurement('viewport-change');
            
            setTimeout(() => {
              const duration = PerformanceBenchmark.endMeasurement(measurementId);
              setLastResizeTime(duration);
              setResizeCount(prev => prev + 1);
            }, 0);
          };

          window.addEventListener('resize', handleResize);
          
          // Simulate viewport changes
          setTimeout(() => {
            Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
            window.dispatchEvent(new Event('resize'));
          }, 100);

          setTimeout(() => {
            Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
            window.dispatchEvent(new Event('resize'));
          }, 200);

          return () => window.removeEventListener('resize', handleResize);
        }, []);

        return (
          <div data-testid="viewport-change-test">
            <div data-testid="resize-count">{resizeCount}</div>
            <div data-testid="last-resize-time">{lastResizeTime}</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <ViewportChangeTest />
        </TestWrapper>
      );

      await vi.waitFor(() => {
        const resizeCount = parseInt(screen.getByTestId('resize-count').textContent || '0');
        expect(resizeCount).toBeGreaterThan(0);
      }, { timeout: 5000 });

      const lastResizeTime = parseFloat(screen.getByTestId('last-resize-time').textContent || '0');
      expect(lastResizeTime).toBeLessThan(50); // Viewport changes should be handled quickly
    });
  });

  describe('Performance Summary', () => {
    it('should generate performance report', () => {
      const stats = {
        componentRender: PerformanceBenchmark.getStatistics('component-render'),
        dashboardRender: PerformanceBenchmark.getStatistics('dashboard-render'),
        dataProcessing: PerformanceBenchmark.getStatistics('data-processing'),
        validation: PerformanceBenchmark.getStatistics('validation'),
        viewportChange: PerformanceBenchmark.getStatistics('viewport-change')
      };

      // Generate performance report
      const report = {
        timestamp: new Date().toISOString(),
        memoryInfo: MemoryMonitor.getMemoryInfo(),
        performanceStats: stats,
        summary: {
          totalTests: Object.values(stats).reduce((sum, stat) => sum + stat.count, 0),
          avgPerformance: Object.values(stats)
            .filter(stat => stat.count > 0)
            .reduce((sum, stat) => sum + stat.avg, 0) / Object.keys(stats).length
        }
      };

      expect(report.summary.totalTests).toBeGreaterThan(0);
      expect(report.summary.avgPerformance).toBeGreaterThan(0);
      expect(report.memoryInfo.used).toBeGreaterThan(0);

      // Log performance report for analysis
      console.log('Performance Test Report:', JSON.stringify(report, null, 2));
    });
  });
});

// Export utilities for other performance tests
export { 
  PerformanceBenchmark, 
  MemoryMonitor, 
  generateUnits, 
  generateEvents,
  PerformanceTestComponent,
  VirtualizedPerformanceTest
};