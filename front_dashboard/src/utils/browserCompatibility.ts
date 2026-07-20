/**
 * Browser Compatibility Utilities for Smart Field Builder Modal
 * Handles viewport height calculations and cross-browser CSS compatibility
 */

// Detect browser for specific fixes
export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
  const isFirefox = /Firefox/.test(userAgent);
  const isEdge = /Edg/.test(userAgent);
  const isOldIE = /MSIE/.test(userAgent);

  return {
    isIOS,
    isSafari,
    isChrome,
    isFirefox,
    isEdge,
    isOldIE,
    isMobile: /Mobi|Android/i.test(userAgent)
  };
};

// Safe viewport height calculation for different browsers
export const getSafeViewportHeight = (): string => {
  const browser = getBrowserInfo();
  
  // iOS Safari has viewport height issues with bottom bars
  if (browser.isIOS) {
    return 'calc(var(--vh, 1vh) * 100)';
  }
  
  // Standard browsers
  return '100vh';
};

// Calculate modal height with browser-specific adjustments
export const getModalHeight = (isMobile: boolean = false): Record<string, any> => {
  const browser = getBrowserInfo();
  
  if (isMobile || browser.isMobile) {
    if (browser.isIOS) {
      return {
        xs: 'calc(var(--vh, 1vh) * 100)',
        sm: 'calc(var(--vh, 1vh) * 100 - 80px)'
      };
    }
    return {
      xs: '100vh',
      sm: 'calc(100vh - 80px)'
    };
  }
  
  return {
    xs: '100vh',
    sm: 'calc(100vh - 80px)'
  };
};

// Initialize viewport height CSS custom property for iOS
export const initializeViewportHeight = () => {
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  // Set on load
  setVH();

  // Update on resize (throttled)
  let timeoutId: NodeJS.Timeout;
  window.addEventListener('resize', () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(setVH, 100);
  });

  // Update on orientation change for mobile
  window.addEventListener('orientationchange', () => {
    setTimeout(setVH, 500); // Wait for orientation change to complete
  });
};

// Polyfill for CSS.supports if needed
export const supportsCSS = (property: string, value: string): boolean => {
  if (typeof CSS !== 'undefined' && CSS.supports) {
    return CSS.supports(property, value);
  }
  
  // Fallback detection
  const element = document.createElement('div');
  element.style.setProperty(property, value);
  return element.style.getPropertyValue(property) === value;
};

// Check for flexbox support
export const supportsFlexbox = (): boolean => {
  return supportsCSS('display', 'flex');
};

// Check for CSS Grid support  
export const supportsGrid = (): boolean => {
  return supportsCSS('display', 'grid');
};

// Check for calc() support
export const supportsCalc = (): boolean => {
  return supportsCSS('width', 'calc(1px + 1px)');
};

// Generate fallback styles for older browsers
export const getFallbackStyles = () => {
  const browser = getBrowserInfo();
  
  if (browser.isOldIE) {
    return {
      height: '600px', // Fixed height fallback
      maxHeight: '90vh',
      overflow: 'auto'
    };
  }
  
  if (!supportsCalc()) {
    return {
      height: '90vh',
      maxHeight: '90vh'
    };
  }
  
  return {};
};

// CSS-in-JS safe style merger
export const mergeStyles = (...styles: Record<string, any>[]): Record<string, any> => {
  return styles.reduce((merged, style) => {
    Object.keys(style).forEach(key => {
      if (typeof style[key] === 'object' && !Array.isArray(style[key])) {
        merged[key] = mergeStyles(merged[key] || {}, style[key]);
      } else {
        merged[key] = style[key];
      }
    });
    return merged;
  }, {});
};