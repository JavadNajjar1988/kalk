// Global Setup for E2E Tests
// راه‌اندازی سراسری برای تست‌های E2E

import { chromium, FullConfig } from '@playwright/test';
import { FeatureFlagManager } from '../../utils/featureFlags';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up E2E test environment...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Initialize base URL
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
    console.log(`📍 Base URL: ${baseURL}`);
    
    // Wait for application to be ready
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Initialize feature flags for testing
    await page.evaluate(() => {
      const manager = (window as any).FeatureFlagManager?.getInstance();
      if (manager) {
        manager.resetToDefaults();
        manager.updateFlags({
          'field-constructor-enabled': false,
          'hybrid-field-rendering': false,
          'migration-logging': true,
          'development-mode': true
        });
        manager.setMigrationPhase('legacy');
      }
    });
    
    // Create test user if needed
    const response = await page.request.post(`${baseURL}/api/test/setup`, {
      data: {
        createTestUser: true,
        resetDatabase: false,
        seedTestData: true
      }
    });
    
    if (response.ok()) {
      console.log('✅ Test environment setup completed');
    } else {
      console.warn('⚠️ Test setup API not available, continuing with existing data');
    }
    
    // Store authentication token for tests
    await page.context().storageState({
      path: 'test-results/auth-state.json'
    });
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;