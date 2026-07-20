/* eslint-disable no-undef */
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  extends: [
    'eslint:recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: [
    'dist',
    '.eslintrc.cjs',
    'src/**/__tests__/**',
    'src/**/*.test.*',
    'src/**/*Test.*',
    'src/test-*',
    'src/test/**',
    'src/components/test/**',
    'src/modules/definition-editor/**',
    'src/modules/orbat-integration/**',
    'src/modules/scenario-management/**',
  ],
  plugins: ['@typescript-eslint', 'react-refresh'],
  rules: {
    'react-refresh/only-export-components': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'no-undef': 'off',
    'no-empty': 'off',
    'no-useless-escape': 'off',
    'react-hooks/exhaustive-deps': 'warn',
  },
}; 
