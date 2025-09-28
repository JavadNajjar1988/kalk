// E2E Migration Test Scenarios
// سناریوهای تست E2E برای مهاجرت

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_USER = {
  username: 'admin@lindu.test',
  password: 'admin123'
};

class MigrationTestHelper {
  constructor(private page: Page) {}

  async login() {
    await this.page.goto(`${BASE_URL}/login`);
    await this.page.fill('[data-testid="username"]', ADMIN_USER.username);
    await this.page.fill('[data-testid="password"]', ADMIN_USER.password);
    await this.page.click('[data-testid="login-button"]');
    await this.page.waitForURL('**/dashboard');
  }

  async navigateToFieldEditor() {
    await this.page.click('[data-testid="definition-editor-menu"]');
    await this.page.click('[data-testid="field-constructor-submenu"]');
    await this.page.waitForLoadState('networkidle');
  }

  async openMigrationConfig() {
    await this.page.click('[data-testid="migration-config-button"]');
    await this.page.waitForSelector('[data-testid="migration-config-dialog"]');
  }

  async setMigrationPhase(phase: 'legacy' | 'hybrid' | 'constructor' | 'full') {
    await this.openMigrationConfig();
    await this.page.selectOption('[data-testid="migration-phase-select"]', phase);
    await this.page.click('[data-testid="apply-config-button"]');
    await this.page.waitForTimeout(1000); // Wait for phase transition
  }

  async createTestForm() {
    await this.page.click('[data-testid="create-form-button"]');
    await this.page.fill('[data-testid="form-name"]', 'E2E Test Form');
    await this.page.fill('[data-testid="form-description"]', 'Form for E2E migration testing');
    await this.page.click('[data-testid="create-form-confirm"]');
    await this.page.waitForSelector('[data-testid="form-editor"]');
  }

  async addField(fieldType: string, fieldName: string) {
    await this.page.click('[data-testid="add-field-button"]');
    await this.page.selectOption('[data-testid="field-type-select"]', fieldType);
    await this.page.fill('[data-testid="field-name-input"]', fieldName);
    await this.page.click('[data-testid="add-field-confirm"]');
    await this.page.waitForSelector(`[data-testid="field-${fieldName.toLowerCase().replace(/\s+/g, '-')}"]`);
  }

  async fillFormField(fieldId: string, value: string) {
    await this.page.fill(`[data-testid="field-${fieldId}"] input`, value);
  }

  async submitForm() {
    await this.page.click('[data-testid="submit-form-button"]');
    await this.page.waitForSelector('[data-testid="form-success-message"]');
  }

  async verifyFieldExists(fieldName: string) {
    await expect(this.page.locator(`text=${fieldName}`)).toBeVisible();
  }

  async verifyMigrationIndicator(expectedPhase: string) {
    await expect(this.page.locator('[data-testid="migration-phase-indicator"]')).toContainText(expectedPhase);
  }

  async verifyPerformanceMetrics() {
    const renderTime = await this.page.locator('[data-testid="render-time-metric"]').textContent();
    const renderTimeMs = parseInt(renderTime?.match(/(\d+)ms/)?.[1] || '0');
    expect(renderTimeMs).toBeLessThan(500); // Should render within 500ms
  }
}

test.describe('Field Constructor Migration E2E Tests', () => {
  let helper: MigrationTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new MigrationTestHelper(page);
    await helper.login();
    await helper.navigateToFieldEditor();
  });

  test.describe('Phase 1: Legacy Mode', () => {
    test('should function normally in legacy mode', async ({ page }) => {
      await helper.setMigrationPhase('legacy');
      await helper.verifyMigrationIndicator('Legacy');

      // Create a form with legacy fields
      await helper.createTestForm();
      await helper.addField('text', 'Legacy Text Field');
      await helper.addField('select', 'Legacy Select Field');
      await helper.addField('date', 'Legacy Date Field');

      // Verify fields are created and functional
      await helper.verifyFieldExists('Legacy Text Field');
      await helper.verifyFieldExists('Legacy Select Field');
      await helper.verifyFieldExists('Legacy Date Field');

      // Fill and submit form
      await helper.fillFormField('legacy-text-field', 'Test legacy value');
      await helper.submitForm();

      // Verify form submission success
      await expect(page.locator('[data-testid="form-success-message"]')).toBeVisible();
    });

    test('should maintain data integrity in legacy mode', async ({ page }) => {
      await helper.setMigrationPhase('legacy');
      
      await helper.createTestForm();
      await helper.addField('text', 'Data Integrity Test');
      
      const testData = 'Legacy data integrity test value';
      await helper.fillFormField('data-integrity-test', testData);
      
      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify data persists
      const fieldValue = await page.inputValue('[data-testid="field-data-integrity-test"] input');
      expect(fieldValue).toBe(testData);
    });
  });

  test.describe('Phase 2: Hybrid Mode Transition', () => {
    test('should transition smoothly to hybrid mode', async ({ page }) => {
      // Start in legacy mode
      await helper.setMigrationPhase('legacy');
      await helper.createTestForm();
      await helper.addField('text', 'Transition Test Field');
      
      const testValue = 'Pre-transition value';
      await helper.fillFormField('transition-test-field', testValue);

      // Transition to hybrid mode
      await helper.setMigrationPhase('hybrid');
      await helper.verifyMigrationIndicator('Hybrid');

      // Verify data persists through transition
      const fieldValue = await page.inputValue('[data-testid="field-transition-test-field"] input');
      expect(fieldValue).toBe(testValue);

      // Verify both legacy and constructor indicators are present
      await expect(page.locator('[data-testid="legacy-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="constructor-indicator"]')).toBeVisible();
    });

    test('should handle mixed field types in hybrid mode', async ({ page }) => {
      await helper.setMigrationPhase('hybrid');
      await helper.createTestForm();

      // Add various field types
      await helper.addField('text', 'Basic Text');
      await helper.addField('hierarchical-address', 'Enhanced Address');
      await helper.addField('phone-array', 'Phone Numbers');

      // Verify all fields render correctly
      await helper.verifyFieldExists('Basic Text');
      await helper.verifyFieldExists('Enhanced Address');
      await helper.verifyFieldExists('Phone Numbers');

      // Verify rendering performance
      await helper.verifyPerformanceMetrics();
    });

    test('should show fallback warnings appropriately', async ({ page }) => {
      await helper.setMigrationPhase('hybrid');
      await helper.createTestForm();
      
      // Add field that might trigger fallback
      await helper.addField('custom-legacy-type', 'Legacy Custom Field');
      
      // Look for fallback warning
      await expect(page.locator('[data-testid="fallback-warning"]')).toBeVisible();
      await expect(page.locator('text=از نسخه پیشین استفاده شد')).toBeVisible();
    });
  });

  test.describe('Phase 3: Constructor Mode', () => {
    test('should utilize Field Constructor capabilities', async ({ page }) => {
      await helper.setMigrationPhase('constructor');
      await helper.verifyMigrationIndicator('Constructor');

      await helper.createTestForm();
      
      // Add enhanced fields
      await helper.addField('hierarchical-address', 'Address Selection');
      await helper.addField('phone-array', 'Contact Numbers');
      await helper.addField('enhanced-text', 'Validated Text');

      // Test hierarchical field
      await page.click('[data-testid="field-address-selection"] [data-testid="level-1-select"]');
      await page.click('text=ایران');
      await page.waitForTimeout(500);
      
      await page.click('[data-testid="field-address-selection"] [data-testid="level-2-select"]');
      await page.click('text=تهران');
      
      // Verify hierarchical path is shown
      await expect(page.locator('[data-testid="hierarchical-path"]')).toContainText('ایران');
      await expect(page.locator('[data-testid="hierarchical-path"]')).toContainText('تهران');

      // Test array field
      await page.click('[data-testid="field-contact-numbers"] [data-testid="add-item-button"]');
      await page.fill('[data-testid="phone-number-0"]', '+98-21-12345678');
      await page.selectOption('[data-testid="phone-type-0"]', 'home');

      await page.click('[data-testid="field-contact-numbers"] [data-testid="add-item-button"]');
      await page.fill('[data-testid="phone-number-1"]', '+98-912-1234567');
      await page.selectOption('[data-testid="phone-type-1"]', 'mobile');

      // Verify array items
      expect(await page.inputValue('[data-testid="phone-number-0"]')).toBe('+98-21-12345678');
      expect(await page.inputValue('[data-testid="phone-number-1"]')).toBe('+98-912-1234567');
    });

    test('should validate enhanced field constraints', async ({ page }) => {
      await helper.setMigrationPhase('constructor');
      await helper.createTestForm();
      await helper.addField('enhanced-text', 'Validated Field');

      // Test invalid input (assuming pattern validation)
      await helper.fillFormField('validated-field', '123invalid');
      await page.click('[data-testid="validate-button"]');

      // Should show validation error
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
      await expect(page.locator('text=مقدار وارد شده معتبر نیست')).toBeVisible();

      // Test valid input
      await helper.fillFormField('validated-field', 'ValidInput');
      await page.click('[data-testid="validate-button"]');

      // Error should disappear
      await expect(page.locator('[data-testid="validation-error"]')).not.toBeVisible();
    });
  });

  test.describe('Phase 4: Full Migration', () => {
    test('should complete full migration successfully', async ({ page }) => {
      await helper.setMigrationPhase('full');
      await helper.verifyMigrationIndicator('Full');

      // Verify no legacy indicators remain
      await expect(page.locator('[data-testid="legacy-indicator"]')).not.toBeVisible();
      
      // Verify all Field Constructor features are available
      await helper.createTestForm();
      await helper.addField('composite', 'Complex Composite Field');
      await helper.addField('conditional', 'Conditional Field');

      await helper.verifyFieldExists('Complex Composite Field');
      await helper.verifyFieldExists('Conditional Field');

      // Verify enhanced performance in full mode
      await helper.verifyPerformanceMetrics();
    });

    test('should handle full feature set without issues', async ({ page }) => {
      await helper.setMigrationPhase('full');
      await helper.createTestForm();

      // Add comprehensive field set
      const fields = [
        ['text', 'Basic Text'],
        ['enhanced-text', 'Enhanced Text'],
        ['select', 'Select Field'],
        ['multiselect', 'Multi Select'],
        ['date', 'Date Field'],
        ['hierarchical-address', 'Address'],
        ['phone-array', 'Phone Array'],
        ['composite', 'Composite Field']
      ];

      for (const [type, name] of fields) {
        await helper.addField(type, name);
      }

      // Fill complex form
      await helper.fillFormField('basic-text', 'Basic value');
      await helper.fillFormField('enhanced-text', 'Enhanced value');
      
      // Complex hierarchical selection
      await page.click('[data-testid="field-address"] [data-testid="country-select"]');
      await page.click('text=ایران');
      await page.click('[data-testid="field-address"] [data-testid="province-select"]');
      await page.click('text=تهران');

      // Add multiple phone numbers
      await page.click('[data-testid="field-phone-array"] [data-testid="add-item"]');
      await page.fill('[data-testid="phone-0"]', '+98-21-88888888');
      await page.click('[data-testid="field-phone-array"] [data-testid="add-item"]');
      await page.fill('[data-testid="phone-1"]', '+98-912-9999999');

      // Submit complex form
      await helper.submitForm();
      await expect(page.locator('[data-testid="form-success-message"]')).toBeVisible();
    });
  });

  test.describe('Rollback Scenarios', () => {
    test('should rollback gracefully from constructor to hybrid', async ({ page }) => {
      // Start in constructor mode with data
      await helper.setMigrationPhase('constructor');
      await helper.createTestForm();
      await helper.addField('enhanced-text', 'Constructor Field');
      
      const testValue = 'Constructor mode value';
      await helper.fillFormField('constructor-field', testValue);

      // Rollback to hybrid
      await helper.setMigrationPhase('hybrid');
      await helper.verifyMigrationIndicator('Hybrid');

      // Verify data preservation
      const fieldValue = await page.inputValue('[data-testid="field-constructor-field"] input');
      expect(fieldValue).toBe(testValue);

      // Verify fallback warning appears
      await expect(page.locator('[data-testid="fallback-info"]')).toBeVisible();
    });

    test('should emergency rollback to legacy', async ({ page }) => {
      // Simulate migration in progress
      await helper.setMigrationPhase('constructor');
      await helper.createTestForm();
      await helper.addField('text', 'Emergency Test');
      
      const criticalValue = 'Critical data must persist';
      await helper.fillFormField('emergency-test', criticalValue);

      // Emergency rollback to legacy
      await helper.setMigrationPhase('legacy');
      await helper.verifyMigrationIndicator('Legacy');

      // Critical: Data must be preserved
      const preservedValue = await page.inputValue('[data-testid="field-emergency-test"] input');
      expect(preservedValue).toBe(criticalValue);

      // System should be fully functional in legacy mode
      await page.click('[data-testid="legacy-mode-indicator"]');
      await expect(page.locator('text=سیستم در حالت legacy فعال است')).toBeVisible();
    });
  });

  test.describe('Performance and Reliability', () => {
    test('should handle large datasets efficiently', async ({ page }) => {
      await helper.setMigrationPhase('constructor');
      await helper.createTestForm();

      // Create large dataset scenario
      await helper.addField('select', 'Large Select');
      
      // Select field with many options
      await page.click('[data-testid="field-large-select"] select');
      const options = await page.locator('[data-testid="field-large-select"] option').count();
      expect(options).toBeGreaterThan(50); // Assuming large dataset

      // Performance should be acceptable
      const startTime = Date.now();
      await page.selectOption('[data-testid="field-large-select"] select', { index: 25 });
      const selectionTime = Date.now() - startTime;
      expect(selectionTime).toBeLessThan(1000); // Should select within 1 second
    });

    test('should maintain stability during rapid phase changes', async ({ page }) => {
      await helper.createTestForm();
      await helper.addField('text', 'Stability Test');
      
      const testValue = 'Stability test value';
      await helper.fillFormField('stability-test', testValue);

      // Rapid phase changes
      const phases: Array<'legacy' | 'hybrid' | 'constructor' | 'legacy'> = ['legacy', 'hybrid', 'constructor', 'legacy'];
      
      for (const phase of phases) {
        await helper.setMigrationPhase(phase);
        await page.waitForTimeout(100); // Brief pause
        
        // Verify system remains stable
        const fieldValue = await page.inputValue('[data-testid="field-stability-test"] input');
        expect(fieldValue).toBe(testValue);
      }

      // Final verification
      await expect(page.locator('[data-testid="error-boundary"]')).not.toBeVisible();
    });
  });

  test.describe('User Experience', () => {
    test('should provide clear migration feedback', async ({ page }) => {
      await helper.setMigrationPhase('hybrid');
      await helper.createTestForm();
      await helper.addField('text', 'UX Test Field');

      // Should show migration status clearly
      await expect(page.locator('[data-testid="migration-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="hybrid-mode-badge"]')).toBeVisible();

      // Should provide helpful information
      await page.hover('[data-testid="migration-info-icon"]');
      await expect(page.locator('[data-testid="migration-tooltip"]')).toBeVisible();
      await expect(page.locator('text=سیستم در حالت ترکیبی')).toBeVisible();
    });

    test('should handle errors gracefully', async ({ page }) => {
      await helper.setMigrationPhase('constructor');
      await helper.createTestForm();

      // Simulate error condition (e.g., network failure)
      await page.route('**/api/fields/**', route => {
        route.abort('failed');
      });

      await helper.addField('hierarchical-address', 'Error Test Field');

      // Should show graceful error handling
      await expect(page.locator('[data-testid="field-error-fallback"]')).toBeVisible();
      await expect(page.locator('text=خطا در بارگذاری فیلد')).toBeVisible();

      // Should provide retry option
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });
  });
});