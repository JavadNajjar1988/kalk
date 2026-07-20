/**
 * Browser Compatibility Test Utility for Smart Field Builder Modal
 * Provides testing functions to verify modal behavior across different browsers
 */

import { getBrowserInfo, supportsCSS, supportsFlexbox, supportsGrid, supportsCalc } from './browserCompatibility';

interface CompatibilityTestResult {
  browser: string;
  version: string;
  platform: string;
  tests: {
    viewportHeight: boolean;
    flexbox: boolean;
    grid: boolean;
    calc: boolean;
    modalPosition: boolean;
    cssCustomProperties: boolean;
  };
  recommendations: string[];
  warnings: string[];
}

// Test viewport height behavior
export const testViewportHeight = (): boolean => {
  try {
    const testElement = document.createElement('div');
    testElement.style.height = '100vh';
    testElement.style.position = 'fixed';
    testElement.style.top = '0';
    testElement.style.visibility = 'hidden';
    document.body.appendChild(testElement);
    
    const computedHeight = window.getComputedStyle(testElement).height;
    document.body.removeChild(testElement);
    
    return parseFloat(computedHeight) > 0;
  } catch (error) {
    console.warn('Viewport height test failed:', error);
    return false;
  }
};

// Test modal positioning
export const testModalPosition = (): boolean => {
  try {
    const testModal = document.createElement('div');
    testModal.style.position = 'fixed';
    testModal.style.top = '0';
    testModal.style.left = '0';
    testModal.style.width = '100vw';
    testModal.style.height = '100vh';
    testModal.style.zIndex = '9999';
    testModal.style.visibility = 'hidden';
    document.body.appendChild(testModal);
    
    const rect = testModal.getBoundingClientRect();
    document.body.removeChild(testModal);
    
    return rect.top === 0 && rect.left === 0 && rect.width > 0 && rect.height > 0;
  } catch (error) {
    console.warn('Modal position test failed:', error);
    return false;
  }
};

// Test CSS custom properties support
export const testCSSCustomProperties = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    return window.CSS && window.CSS.supports && window.CSS.supports('(--test: red)');
  } catch (error) {
    return false;
  }
};

// Get user agent information
const getUserAgentInfo = () => {
  const userAgent = navigator.userAgent;
  let browser = 'Unknown';
  let version = 'Unknown';
  
  // Chrome
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome';
    const match = userAgent.match(/Chrome\/([0-9.]+)/);
    version = match ? match[1] : 'Unknown';
  }
  // Firefox
  else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
    const match = userAgent.match(/Firefox\/([0-9.]+)/);
    version = match ? match[1] : 'Unknown';
  }
  // Safari
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
    const match = userAgent.match(/Version\/([0-9.]+)/);
    version = match ? match[1] : 'Unknown';
  }
  // Edge
  else if (userAgent.includes('Edg')) {
    browser = 'Edge';
    const match = userAgent.match(/Edg\/([0-9.]+)/);
    version = match ? match[1] : 'Unknown';
  }
  // Internet Explorer
  else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
    browser = 'Internet Explorer';
    const match = userAgent.match(/(?:MSIE |rv:)([0-9.]+)/);
    version = match ? match[1] : 'Unknown';
  }
  
  return { browser, version };
};

// Get platform information
const getPlatformInfo = (): string => {
  const platform = navigator.platform || 'Unknown';
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  
  return platform;
};

// Run comprehensive compatibility tests
export const runCompatibilityTests = (): CompatibilityTestResult => {
  const browserInfo = getBrowserInfo();
  const { browser, version } = getUserAgentInfo();
  const platform = getPlatformInfo();
  
  const tests = {
    viewportHeight: testViewportHeight(),
    flexbox: supportsFlexbox(),
    grid: supportsGrid(),
    calc: supportsCalc(),
    modalPosition: testModalPosition(),
    cssCustomProperties: testCSSCustomProperties()
  };
  
  const recommendations: string[] = [];
  const warnings: string[] = [];
  
  // Generate recommendations based on test results
  if (!tests.viewportHeight) {
    warnings.push('Viewport height (100vh) may not work correctly');
    recommendations.push('Consider using fixed pixel heights as fallback');
  }
  
  if (!tests.flexbox) {
    warnings.push('Flexbox layout not supported');
    recommendations.push('Add fallback layouts using floats or positioning');
  }
  
  if (!tests.calc) {
    warnings.push('CSS calc() function not supported');
    recommendations.push('Use fixed values instead of calc() expressions');
  }
  
  if (!tests.cssCustomProperties) {
    warnings.push('CSS custom properties (variables) not supported');
    recommendations.push('Use PostCSS or Sass variables compilation');
  }
  
  if (browserInfo.isIOS) {
    recommendations.push('Use CSS custom properties for viewport height on iOS');
    recommendations.push('Add touch-action: manipulation for better touch handling');
  }
  
  if (browserInfo.isOldIE) {
    warnings.push('Internet Explorer detected - limited CSS support');
    recommendations.push('Consider showing upgrade notice for IE users');
    recommendations.push('Use polyfills for modern CSS features');
  }
  
  return {
    browser,
    version,
    platform,
    tests,
    recommendations,
    warnings
  };
};

// Log test results to console
export const logCompatibilityReport = (): void => {
  const results = runCompatibilityTests();
  
  console.group('🔍 Browser Compatibility Report - Smart Field Builder Modal');
  console.log('Browser:', results.browser, results.version);
  console.log('Platform:', results.platform);
  
  console.group('✅ Test Results');
  Object.entries(results.tests).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}:`, passed);
  });
  console.groupEnd();
  
  if (results.warnings.length > 0) {
    console.group('⚠️ Warnings');
    results.warnings.forEach(warning => console.warn(warning));
    console.groupEnd();
  }
  
  if (results.recommendations.length > 0) {
    console.group('💡 Recommendations');
    results.recommendations.forEach(rec => console.log(rec));
    console.groupEnd();
  }
  
  console.groupEnd();
};

// Performance test for modal rendering
export const testModalPerformance = (): Promise<{ renderTime: number; layoutTime: number }> => {
  return new Promise((resolve) => {
    const startTime = performance.now();
    
    // Create test modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: calc(100vh - 80px);
      background: white;
      display: flex;
      flex-direction: column;
      visibility: hidden;
      z-index: -1;
    `;
    
    // Add content
    for (let i = 0; i < 50; i++) {
      const content = document.createElement('div');
      content.style.padding = '10px';
      content.textContent = `Test content ${i}`;
      modal.appendChild(content);
    }
    
    document.body.appendChild(modal);
    
    requestAnimationFrame(() => {
      const renderTime = performance.now() - startTime;
      
      // Force layout
      const layoutStart = performance.now();
      modal.style.visibility = 'visible';
      const rect = modal.getBoundingClientRect(); // Force layout
      modal.style.visibility = 'hidden';
      const layoutTime = performance.now() - layoutStart;
      
      document.body.removeChild(modal);
      
      resolve({ renderTime, layoutTime });
    });
  });
};

// Test responsiveness
export const testResponsiveness = (): { mobile: boolean; tablet: boolean; desktop: boolean } => {
  const width = window.innerWidth;
  
  return {
    mobile: width < 768,
    tablet: width >= 768 && width < 1024,
    desktop: width >= 1024
  };
};