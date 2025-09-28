// Jest Test Configuration for Field Constructor
// پیکربندی تست Jest برای Field Constructor

module.exports = {
  displayName: 'Field Constructor Tests',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    '<rootDir>/src/modules/definition-editor/tests/setup.ts'
  ],
  testMatch: [
    '<rootDir>/src/modules/definition-editor/tests/**/*.test.{ts,tsx}',
    '<rootDir>/src/modules/definition-editor/tests/**/*.spec.{ts,tsx}'
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1'
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/modules/definition-editor/**/*.{ts,tsx}',
    '!src/modules/definition-editor/**/*.d.ts',
    '!src/modules/definition-editor/tests/**/*',
    '!src/modules/definition-editor/**/index.{ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/modules/definition-editor/utils/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/modules/definition-editor/components/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  testTimeout: 10000,
  verbose: true,
  bail: false,
  errorOnDeprecated: true,
  notify: true,
  notifyMode: 'failure-change',
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage/field-constructor',
  coverageReporters: ['text', 'html', 'lcov', 'json-summary'],
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx'
      }
    }
  }
};