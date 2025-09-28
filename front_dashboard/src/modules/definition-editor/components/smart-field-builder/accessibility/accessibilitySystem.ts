/**
 * Accessibility and Keyboard Navigation System for Smart Field Builder
 * Provides comprehensive accessibility features and keyboard shortcuts
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { useTheme } from '@mui/material';

// Keyboard event constants
export const KEYBOARD_KEYS = {
  TAB: 'Tab',
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
  F1: 'F1',
  ALT: 'Alt',
  CTRL: 'Control',
  SHIFT: 'Shift'
} as const;

// ARIA roles and properties
export const ARIA_ROLES = {
  DIALOG: 'dialog',
  TABPANEL: 'tabpanel',
  TAB: 'tab',
  TABLIST: 'tablist',
  BUTTON: 'button',
  LISTBOX: 'listbox',
  OPTION: 'option',
  PROGRESSBAR: 'progressbar',
  REGION: 'region',
  FORM: 'form',
  GROUP: 'group',
  RADIOGROUP: 'radiogroup',
  RADIO: 'radio'
} as const;

// Accessibility labels in Persian
export const ARIA_LABELS = {
  CLOSE_DIALOG: 'بستن دیالوگ',
  NEXT_STEP: 'مرحله بعدی',
  PREVIOUS_STEP: 'مرحله قبلی',
  SELECT_MODE: 'انتخاب حالت ساخت فیلد',
  WIZARD_STEP: 'مرحله ویزارد',
  TEMPLATE_CATEGORY: 'دسته‌بندی قالب',
  TEMPLATE_ITEM: 'آیتم قالب',
  PROGRESS_INDICATOR: 'نشانگر پیشرفت',
  FORM_VALIDATION_ERROR: 'خطای اعتبارسنجی فرم',
  REQUIRED_FIELD: 'فیلد اجباری',
  OPTIONAL_FIELD: 'فیلد اختیاری',
  SEARCH_TEMPLATES: 'جستجو در قالب‌ها',
  FILTER_CATEGORIES: 'فیلتر دسته‌بندی‌ها'
} as const;

// Keyboard shortcuts configuration
export const KEYBOARD_SHORTCUTS = {
  CLOSE_DIALOG: { key: KEYBOARD_KEYS.ESCAPE, description: 'بستن دیالوگ' },
  NEXT_STEP: { key: KEYBOARD_KEYS.ENTER, ctrl: true, description: 'مرحله بعدی' },
  PREVIOUS_STEP: { key: KEYBOARD_KEYS.TAB, shift: true, description: 'مرحله قبلی' },
  SAVE: { key: 's', ctrl: true, description: 'ذخیره' },
  HELP: { key: KEYBOARD_KEYS.F1, description: 'راهنما' },
  FOCUS_SEARCH: { key: 'f', ctrl: true, description: 'فوکوس روی جستجو' },
  SELECT_ALL_TEMPLATES: { key: 'a', ctrl: true, description: 'انتخاب همه قالب‌ها' }
} as const;

// Focus management interface
interface FocusManager {
  trapFocus: (container: HTMLElement) => () => void;
  restoreFocus: () => void;
  getFocusableElements: (container: HTMLElement) => HTMLElement[];
  focusFirst: (container: HTMLElement) => void;
  focusLast: (container: HTMLElement) => void;
}

// Create focus manager
export const createFocusManager = (): FocusManager => {
  let lastFocusedElement: HTMLElement | null = null;

  const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex=\"-1\"])',
      '[contenteditable=\"true\"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter((element) => {
        const el = element as HTMLElement;
        return el.offsetWidth > 0 && el.offsetHeight > 0 && !el.hidden;
      }) as HTMLElement[];
  };

  const trapFocus = (container: HTMLElement) => {
    lastFocusedElement = document.activeElement as HTMLElement;
    
    const focusableElements = getFocusableElements(container);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== KEYBOARD_KEYS.TAB) return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Focus first element
    if (firstFocusable) {
      firstFocusable.focus();
    }

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  };

  const restoreFocus = () => {
    if (lastFocusedElement) {
      lastFocusedElement.focus();
      lastFocusedElement = null;
    }
  };

  const focusFirst = (container: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    focusableElements[0]?.focus();
  };

  const focusLast = (container: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    focusableElements[focusableElements.length - 1]?.focus();
  };

  return {
    trapFocus,
    restoreFocus,
    getFocusableElements,
    focusFirst,
    focusLast
  };
};

// Keyboard navigation hook
export const useKeyboardNavigation = (options: {
  onClose?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onSave?: () => void;
  onHelp?: () => void;
  containerRef?: React.RefObject<HTMLElement>;
  disabled?: boolean;
}) => {
  const {
    onClose,
    onNext,
    onPrevious,
    onSave,
    onHelp,
    containerRef,
    disabled = false
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (disabled) return;

    const { key, ctrlKey, altKey, shiftKey } = event;

    // Close dialog with Escape
    if (key === KEYBOARD_KEYS.ESCAPE && onClose) {
      event.preventDefault();
      onClose();
      return;
    }

    // Save with Ctrl+S
    if (key === 's' && ctrlKey && onSave) {
      event.preventDefault();
      onSave();
      return;
    }

    // Help with F1
    if (key === KEYBOARD_KEYS.F1 && onHelp) {
      event.preventDefault();
      onHelp();
      return;
    }

    // Next step with Ctrl+Enter
    if (key === KEYBOARD_KEYS.ENTER && ctrlKey && onNext) {
      event.preventDefault();
      onNext();
      return;
    }

    // Arrow navigation for steps
    if (key === KEYBOARD_KEYS.ARROW_RIGHT && altKey && onNext) {
      event.preventDefault();
      onNext();
      return;
    }

    if (key === KEYBOARD_KEYS.ARROW_LEFT && altKey && onPrevious) {
      event.preventDefault();
      onPrevious();
      return;
    }
  }, [disabled, onClose, onNext, onPrevious, onSave, onHelp]);

  useEffect(() => {
    const container = containerRef?.current || document;
    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, containerRef]);
};

// Accessibility announcement hook
export const useAccessibilityAnnouncements = () => {
  const announceRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announceRef.current) return;

    // Clear previous message
    announceRef.current.textContent = '';
    
    // Set new message with small delay to ensure screen readers pick it up
    setTimeout(() => {
      if (announceRef.current) {
        announceRef.current.textContent = message;
        announceRef.current.setAttribute('aria-live', priority);
      }
    }, 100);
  }, []);

  const LiveRegion = useCallback(() => {
    const element = document.createElement('div');
    element.setAttribute('aria-live', 'polite');
    element.setAttribute('aria-atomic', 'true');
    element.style.position = 'absolute';
    element.style.left = '-10000px';
    element.style.width = '1px';
    element.style.height = '1px';
    element.style.overflow = 'hidden';
    return element;
  }, []);

  return { announce, LiveRegion };
};

// Screen reader utilities
export const screenReaderUtils = {
  // Generate unique IDs for ARIA relationships
  generateId: (prefix: string): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Get accessible name for elements
  getAccessibleName: (element: HTMLElement): string => {
    return element.getAttribute('aria-label') ||
           element.getAttribute('aria-labelledby') ||
           element.textContent ||
           '';
  },

  // Check if element is accessible
  isAccessible: (element: HTMLElement): boolean => {
    const hasAccessibleName = screenReaderUtils.getAccessibleName(element).trim() !== '';
    const hasRole = element.getAttribute('role') !== null;
    const hasTabIndex = element.hasAttribute('tabindex');
    const isInteractive = ['button', 'input', 'select', 'textarea', 'a'].includes(element.tagName.toLowerCase());

    return hasAccessibleName && (hasRole || hasTabIndex || isInteractive);
  }
};

// High contrast theme detection
export const useHighContrastMode = () => {
  const [isHighContrast, setIsHighContrast] = React.useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isHighContrast;
};

// Focus visible detection (for keyboard navigation styling)
export const useFocusVisible = () => {
  const [isFocusVisible, setIsFocusVisible] = React.useState(false);

  useEffect(() => {
    let hadKeyboardEvent = false;

    const handleKeyDown = () => {
      hadKeyboardEvent = true;
    };

    const handlePointerDown = () => {
      hadKeyboardEvent = false;
    };

    const handleFocus = () => {
      setIsFocusVisible(hadKeyboardEvent);
    };

    const handleBlur = () => {
      setIsFocusVisible(false);
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('mousedown', handlePointerDown, true);
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('mousedown', handlePointerDown, true);
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('blur', handleBlur, true);
    };
  }, []);

  return isFocusVisible;
};

// Accessibility styles
export const getAccessibilityStyles = (theme: any) => ({
  // Focus visible styles
  focusVisible: {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: '2px',
    boxShadow: `0 0 0 4px ${theme.palette.primary.main}20`
  },

  // Screen reader only content
  srOnly: {
    position: 'absolute' as const,
    left: '-10000px',
    width: '1px',
    height: '1px',
    overflow: 'hidden' as const
  },

  // High contrast mode styles
  highContrast: {
    border: '1px solid',
    backgroundColor: 'ButtonFace',
    color: 'ButtonText',
    '&:hover': {
      backgroundColor: 'Highlight',
      color: 'HighlightText'
    },
    '&:focus': {
      outline: '2px solid',
      outlineColor: 'Highlight'
    }
  },

  // Skip link styles
  skipLink: {
    position: 'absolute' as const,
    top: '-40px',
    left: '6px',
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    padding: '8px',
    textDecoration: 'none',
    borderRadius: '4px',
    zIndex: 1000,
    '&:focus': {
      top: '6px'
    }
  }
});