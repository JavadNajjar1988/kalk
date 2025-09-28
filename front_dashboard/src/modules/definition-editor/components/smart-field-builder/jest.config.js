/**
 * Jest Configuration for Smart Field Builder Tests
 */

module.exports = {
  displayName: 'Smart Field Builder',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    '<rootDir>/__tests__/setup.ts'
  ],
  testMatch: [
    '<rootDir>/__tests__/**/*.test.{ts,tsx}'
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1'
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/coverage/**',
    '!jest.config.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],
  testTimeout: 10000,
  verbose: true,
  bail: false,
  errorOnDeprecated: true,
  
  // Performance settings
  maxWorkers: '50%',
  cache: true,
  
  // Test environment setup
  testEnvironmentOptions: {
    url: 'http://localhost'
  },
  
  // Mock settings
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Watch settings
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/'
  ],
  
  // Reporter settings
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/coverage',
        outputName: 'junit.xml'
      }
    ]
  ]
};