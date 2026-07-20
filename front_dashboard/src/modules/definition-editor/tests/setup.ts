// Test Setup for Field Constructor Tests
// راه‌اندازی تست‌ها برای Field Constructor

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { vi, beforeAll, afterAll, afterEach, expect } from 'vitest';
import { TextEncoder, TextDecoder } from 'util';
import React from 'react';

// Configure testing library
configure({ testIdAttribute: 'data-testid' });

// Mock global objects
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => [])
  }
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverMock;

// Mock IntersectionObserver
class IntersectionObserverMock {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = IntersectionObserverMock;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
  })
) as any;

// Mock react-window
vi.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount, itemSize, ...props }: any) => {
    const items = Array.from({ length: itemCount }, (_, index) => 
      children({ index, style: { height: itemSize } })
    );
    return React.createElement('div', props, items);
  },
  VariableSizeList: ({ children, itemCount, ...props }: any) => {
    const items = Array.from({ length: itemCount }, (_, index) => 
      children({ index, style: { height: 50 } })
    );
    return React.createElement('div', props, items);
  }
}));

// Mock file reader
global.FileReader = class FileReader {
  result: any = null;
  error: any = null;
  readyState: number = 0;
  onload: any = null;
  onerror: any = null;
  onabort: any = null;
  
  readAsText(file: Blob) {
    setTimeout(() => {
      this.result = 'mocked file content';
      this.readyState = 2;
      if (this.onload) this.onload({ target: this });
    }, 0);
  }
  
  readAsDataURL(file: Blob) {
    setTimeout(() => {
      this.result = 'data:text/plain;base64,bW9ja2VkIGZpbGUgY29udGVudA==';
      this.readyState = 2;
      if (this.onload) this.onload({ target: this });
    }, 0);
  }
  
  abort() {}
};

// Mock console methods for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' && 
      (args[0].includes('Warning: ReactDOM.render is deprecated') ||
       args[0].includes('Warning: componentWillReceiveProps') ||
       args[0].includes('act'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  
  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' && 
      args[0].includes('deprecated')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});

// Custom matchers
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeValidFieldConstructorConfig(): T
    toRenderWithoutErrors(): T
  }
}

// Custom matchers
expect.extend({
  toBeValidFieldConstructorConfig(received) {
    const required = ['id', 'name', 'inputType', 'isRequired', 'order'];
    const missing = required.filter(prop => !(prop in received));
    
    if (missing.length > 0) {
      return {
        message: () => `Expected valid Field Constructor config, missing: ${missing.join(', ')}`,
        pass: false,
      };
    }
    
    return {
      message: () => 'Expected invalid Field Constructor config',
      pass: true,
    };
  },
  
  toRenderWithoutErrors(received) {
    const hasErrors = received.props?.children?.props?.error || 
                     received.props?.error ||
                     received.type?.displayName?.includes('Error');
    
    return {
      message: () => hasErrors ? 'Expected component to render without errors' : 'Expected component to have errors',
      pass: !hasErrors,
    };
  }
});

// Test data factories
export const createMockFieldConfig = (overrides = {}) => ({
  id: 'test-field',
  name: 'Test Field',
  inputType: 'text' as const,
  isRequired: false,
  order: 1,
  ...overrides
});

export const createMockLegacyField = (overrides = {}) => ({
  id: 'legacy-field',
  name: 'Legacy Field',
  type: 'text' as const,
  isRequired: false,
  order: 1,
  ...overrides
});

export const createMockHierarchicalData = () => [
  {
    id: 'iran',
    name: 'ایران',
    englishName: 'Iran',
    level: 1,
    parentId: null,
    children: [
      {
        id: 'tehran-province',
        name: 'تهران',
        englishName: 'Tehran Province',
        level: 2,
        parentId: 'iran',
        children: [
          {
            id: 'tehran-city',
            name: 'تهران',
            englishName: 'Tehran City',
            level: 3,
            parentId: 'tehran-province',
            children: []
          }
        ]
      }
    ]
  }
];

// Mock data loading
vi.mock('../data/loader', () => ({
  loadGeographicalData: vi.fn().mockResolvedValue(createMockHierarchicalData()),
  loadCategoryLevels: vi.fn().mockResolvedValue([
    { id: 1, name: 'کشور' },
    { id: 2, name: 'استان' },
    { id: 3, name: 'شهر' }
  ])
}));

console.log('Field Constructor test setup completed ✅');