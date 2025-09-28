// Test index file for ORBAT integration module

// Export test utilities
export * from './setup';

// Export individual test files
export * from './OrbatBridge.test';
export * from './Integration.test';

// Test categories for organization
export const testCategories = {
  unit: 'Unit Tests',
  integration: 'Integration Tests',
  e2e: 'End-to-End Tests',
  performance: 'Performance Tests'
};

// Test configuration
export const testConfig = {
  timeout: 10000,
  setupFiles: ['./setup.ts'],
  testEnvironment: 'jsdom'
};

// Common test data
export const mockData = {
  scenario: {
    id: 'test-scenario-1',
    name: 'Test Military Scenario',
    description: 'A test scenario for integration testing',
    units: [],
    events: [],
    createdAt: new Date().toISOString()
  },
  unit: {
    id: 'unit-1',
    name: 'Alpha Company',
    unitType: 'INFANTRY',
    sidc: 'SFGPUCII------',
    position: { lat: 40.7128, lon: -74.0060 },
    status: 'ACTIVE'
  },
  event: {
    id: 'event-1',
    name: 'Test Operation',
    eventType: 'ATTACK',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 3600000).toISOString(),
    priority: 'HIGH'
  }
};

// Test utilities
export const testUtils = {
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  createMockBridge: () => ({
    sendCommand: vi.fn(),
    requestData: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    waitForReady: vi.fn(),
    destroy: vi.fn()
  }),
  
  createMockResponse: (data: any, success = true) => ({
    id: `response-${Date.now()}`,
    type: 'RESPONSE',
    success,
    data,
    timestamp: new Date()
  }),
  
  simulateVueMessage: (eventType: string, data: any) => {
    const event = new MessageEvent('message', {
      data: {
        type: 'EVENT',
        eventType,
        data,
        timestamp: new Date()
      },
      origin: 'http://localhost:5173'
    });
    
    window.dispatchEvent(event);
  }
};