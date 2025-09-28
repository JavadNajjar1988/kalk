// Vitest Configuration for Field Constructor
// پیکربندی Vitest برای Field Constructor

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'Field Constructor Tests',
    environment: 'jsdom',
    setupFiles: ['./src/modules/definition-editor/tests/setup.ts'],
    include: [
      './src/modules/definition-editor/tests/**/*.test.{ts,tsx}',
      './src/modules/definition-editor/tests/**/*.spec.{ts,tsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      './src/modules/definition-editor/tests/e2e/**/*'
    ],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage/field-constructor',
      include: [
        'src/modules/definition-editor/**/*.{ts,tsx}'
      ],
      exclude: [
        'src/modules/definition-editor/**/*.d.ts',
        'src/modules/definition-editor/tests/**/*',
        'src/modules/definition-editor/**/index.{ts,tsx}'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    testTimeout: 10000,
    bail: 1
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@modules': resolve(__dirname, 'src/modules')
    }
  }
});