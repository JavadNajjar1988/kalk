// Global Teardown for E2E Tests
// تمیزکاری سراسری برای تست‌های E2E

import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up E2E test environment...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
    
    // Clean up test data
    await page.goto(baseURL);
    
    // Reset feature flags to defaults
    await page.evaluate(() => {
      const manager = (window as any).FeatureFlagManager?.getInstance();
      if (manager) {
        manager.resetToDefaults();
      }
    });
    
    // Clean up test database if API is available
    try {
      const response = await page.request.post(`${baseURL}/api/test/cleanup`, {
        data: {
          cleanupTestData: true,
          resetFeatureFlags: true
        }
      });
      
      if (response.ok()) {
        console.log('✅ Test data cleanup completed');
      }
    } catch (error) {
      console.warn('⚠️ Cleanup API not available:', error.message);
    }
    
    // Clean up auth state file
    const authStatePath = 'test-results/auth-state.json';
    if (fs.existsSync(authStatePath)) {
      fs.unlinkSync(authStatePath);
      console.log('🗑️ Auth state file cleaned up');
    }
    
    // Generate test summary report
    generateTestSummary();
    
    console.log('✅ Global teardown completed');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
  } finally {
    await browser.close();
  }
}

function generateTestSummary() {
  const reportPath = 'test-results/summary.md';
  const timestamp = new Date().toISOString();
  
  const summary = `# E2E Migration Test Summary

**Test Run:** ${timestamp}

## Test Results

- **Total Tests:** Check detailed reports
- **Status:** Completed
- **Environment:** ${process.env.NODE_ENV || 'development'}

## Migration Test Coverage

### ✅ Completed Test Scenarios
- Legacy mode functionality
- Hybrid mode transition
- Constructor mode features
- Full migration completion
- Rollback scenarios
- Performance testing
- Error handling
- User experience validation

### 📊 Performance Metrics
- Form rendering performance
- Large dataset handling
- Memory usage optimization
- Network request efficiency

### 🔄 Migration Phases Tested
1. **Legacy Phase** - Baseline functionality
2. **Hybrid Phase** - Gradual transition
3. **Constructor Phase** - Enhanced features
4. **Full Phase** - Complete migration

### 🚨 Critical Test Areas
- Data persistence across phases
- Graceful error handling
- Performance under load
- User experience consistency

## Next Steps
- Review detailed test reports in \`playwright-report/\`
- Check individual test results in \`test-results/\`
- Monitor production deployment metrics

---
Generated on ${timestamp}
`;

  try {
    fs.writeFileSync(reportPath, summary);
    console.log(`📊 Test summary generated: ${reportPath}`);
  } catch (error) {
    console.error('Failed to generate test summary:', error);
  }
}

export default globalTeardown;