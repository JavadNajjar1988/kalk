/**
 * Test Setup for Smart Field Builder
 */

import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock performance.now for tests
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
  },
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Suppress console warnings in tests
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeEach(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
  jest.clearAllMocks();
});

// Global test utilities
export const createMockFieldConfig = (overrides = {}) => ({
  id: 'test-field',
  name: 'تست فیلد',
  englishName: 'testField',
  baseType: 'text',
  enhancements: [],
  validation: [],
  isRequired: false,
  order: 1,
  ...overrides
});

export const createMockTemplate = (overrides = {}) => ({
  id: 'test-template',
  name: 'قالب تست',
  description: 'توضیحات قالب تست',
  category: 'test',
  fields: [createMockFieldConfig()],
  icon: '📝',
  tags: ['test'],
  isMultiField: false,
  isCritical: false,
  ...overrides
});

export const waitForAsyncOperations = () => 
  new Promise(resolve => setTimeout(resolve, 0));

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;