// Test setup file for ORBAT integration tests

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock global objects
beforeAll(() => {
  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock PerformanceObserver
  global.PerformanceObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
  }));
  
  // Mock supportedEntryTypes
  Object.defineProperty(global.PerformanceObserver, 'supportedEntryTypes', {
    value: ['navigation', 'resource', 'measure', 'mark'],
    writable: false
  });

  // Mock window.performance.memory
  Object.defineProperty(window.performance, 'memory', {
    value: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 10000000,
      jsHeapSizeLimit: 100000000
    },
    writable: false
  });

  // Mock iframe element
  const mockIframeElement = {
    contentWindow: {
      postMessage: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    style: {},
    src: '',
    onload: null
  };

  // Mock document.createElement for iframe
  const originalCreateElement = document.createElement;
  document.createElement = vi.fn().mockImplementation((tagName) => {
    if (tagName === 'iframe') {
      return mockIframeElement;
    }
    return originalCreateElement.call(document, tagName);
  });

  // Mock console methods to reduce noise in tests
  global.console.warn = vi.fn();
  global.console.error = vi.fn();
});

// Global test utilities
global.createMockMessageEvent = (data: any, origin = 'http://localhost:5173') => {
  return new MessageEvent('message', { data, origin });
};

global.createMockIframe = () => ({
  contentWindow: {
    postMessage: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  style: {},
  src: '',
  onload: null
});

// Mock window methods
Object.defineProperty(window, 'postMessage', {
  value: vi.fn(),
  writable: true
});

Object.defineProperty(window, 'addEventListener', {
  value: vi.fn(),
  writable: true
});

Object.defineProperty(window, 'removeEventListener', {
  value: vi.fn(),
  writable: true
});

// Add custom matchers if needed
declare global {
  function createMockMessageEvent(data: any, origin?: string): MessageEvent;
  function createMockIframe(): any;
}