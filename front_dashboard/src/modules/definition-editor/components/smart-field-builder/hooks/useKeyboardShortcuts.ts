/**
 * Keyboard Shortcuts Hook for Smart Field Builder
 * Provides accessible keyboard navigation and shortcuts
 */

import { useEffect, useCallback, useRef } from 'react';

interface KeyboardShortcut {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
  disabled?: boolean;
}

interface KeyboardShortcutsConfig {
  shortcuts: KeyboardShortcut[];
  enableGlobalShortcuts?: boolean;
  enableModalShortcuts?: boolean;
  scope?: HTMLElement | null;
}

export const useKeyboardShortcuts = (config: KeyboardShortcutsConfig) => {
  const {
    shortcuts,
    enableGlobalShortcuts = true,
    enableModalShortcuts = true,
    scope
  } = config;

  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip if user is typing in input fields
    const activeElement = document.activeElement;
    const isTyping = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.getAttribute('contenteditable') === 'true'
    );

    if (isTyping && !event.metaKey && !event.ctrlKey) {
      return;
    }

    // Find matching shortcut
    const matchingShortcut = shortcutsRef.current.find(shortcut => {
      if (shortcut.disabled) return false;

      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const metaMatch = !!shortcut.metaKey === event.metaKey;
      const ctrlMatch = !!shortcut.ctrlKey === event.ctrlKey;
      const altMatch = !!shortcut.altKey === event.altKey;
      const shiftMatch = !!shortcut.shiftKey === event.shiftKey;

      return keyMatch && metaMatch && ctrlMatch && altMatch && shiftMatch;
    });

    if (matchingShortcut) {
      event.preventDefault();
      event.stopPropagation();
      matchingShortcut.action();
    }
  }, []);

  useEffect(() => {
    if (!enableGlobalShortcuts && !enableModalShortcuts) return;

    const targetElement = scope || document;
    targetElement.addEventListener('keydown', handleKeyDown);

    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, scope, enableGlobalShortcuts, enableModalShortcuts]);

  return {
    shortcuts: shortcutsRef.current,
    addShortcut: (shortcut: KeyboardShortcut) => {
      shortcutsRef.current = [...shortcutsRef.current, shortcut];
    },
    removeShortcut: (key: string) => {
      shortcutsRef.current = shortcutsRef.current.filter(s => s.key !== key);
    }
  };
};

// Smart Field Builder specific shortcuts
export const useSmartFieldShortcuts = (callbacks: {
  onSave?: () => void;
  onClose?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onModeSwitch?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onHelp?: () => void;
  onSearch?: () => void;
}) => {
  const shortcuts: KeyboardShortcut[] = [
    // Save shortcuts
    {
      key: 's',
      ctrlKey: true,
      action: callbacks.onSave || (() => {}),
      description: 'ذخیره فیلد (Ctrl+S)',
      disabled: !callbacks.onSave
    },
    {
      key: 's',
      metaKey: true,
      action: callbacks.onSave || (() => {}),
      description: 'ذخیره فیلد (Cmd+S)',
      disabled: !callbacks.onSave
    },

    // Navigation shortcuts
    {
      key: 'ArrowRight',
      action: callbacks.onNext || (() => {}),
      description: 'مرحله بعدی (→)',
      disabled: !callbacks.onNext
    },
    {
      key: 'ArrowLeft',
      action: callbacks.onPrevious || (() => {}),
      description: 'مرحله قبلی (←)',
      disabled: !callbacks.onPrevious
    },
    {
      key: 'Tab',
      ctrlKey: true,
      action: callbacks.onModeSwitch || (() => {}),
      description: 'تغییر حالت (Ctrl+Tab)',
      disabled: !callbacks.onModeSwitch
    },

    // Undo/Redo shortcuts
    {
      key: 'z',
      ctrlKey: true,
      action: callbacks.onUndo || (() => {}),
      description: 'برگرداندن (Ctrl+Z)',
      disabled: !callbacks.onUndo
    },
    {
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
      action: callbacks.onRedo || (() => {}),
      description: 'تکرار (Ctrl+Shift+Z)',
      disabled: !callbacks.onRedo
    },
    {
      key: 'y',
      ctrlKey: true,
      action: callbacks.onRedo || (() => {}),
      description: 'تکرار (Ctrl+Y)',
      disabled: !callbacks.onRedo
    },

    // Copy/Paste shortcuts
    {
      key: 'c',
      ctrlKey: true,
      action: callbacks.onCopy || (() => {}),
      description: 'کپی (Ctrl+C)',
      disabled: !callbacks.onCopy
    },
    {
      key: 'v',
      ctrlKey: true,
      action: callbacks.onPaste || (() => {}),
      description: 'چسباندن (Ctrl+V)',
      disabled: !callbacks.onPaste
    },

    // Utility shortcuts
    {
      key: 'Escape',
      action: callbacks.onClose || (() => {}),
      description: 'بستن (Esc)',
      disabled: !callbacks.onClose
    },
    {
      key: 'F1',
      action: callbacks.onHelp || (() => {}),
      description: 'راهنما (F1)',
      disabled: !callbacks.onHelp
    },
    {
      key: 'f',
      ctrlKey: true,
      action: callbacks.onSearch || (() => {}),
      description: 'جستجو (Ctrl+F)',
      disabled: !callbacks.onSearch
    },

    // Quick access shortcuts
    {
      key: '1',
      altKey: true,
      action: () => console.log('Switch to guided mode'),
      description: 'حالت راهنما (Alt+1)'
    },
    {
      key: '2',
      altKey: true,
      action: () => console.log('Switch to template mode'),
      description: 'حالت قالب (Alt+2)'
    },

    // Enter key for primary actions
    {
      key: 'Enter',
      ctrlKey: true,
      action: callbacks.onSave || (() => {}),
      description: 'ذخیره سریع (Ctrl+Enter)',
      disabled: !callbacks.onSave
    }
  ];

  return useKeyboardShortcuts({
    shortcuts,
    enableModalShortcuts: true,
    enableGlobalShortcuts: false
  });
};

// Focus management hook for accessibility
export const useFocusManagement = (containerRef: React.RefObject<HTMLElement>) => {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(',');

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(containerRef.current.querySelectorAll(focusableSelectors));
  }, [containerRef, focusableSelectors]);

  const focusFirst = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      (elements[0] as HTMLElement).focus();
    }
  }, [getFocusableElements]);

  const focusLast = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      (elements[elements.length - 1] as HTMLElement).focus();
    }
  }, [getFocusableElements]);

  const focusNext = useCallback(() => {
    const elements = getFocusableElements();
    const currentIndex = elements.indexOf(document.activeElement as Element);
    const nextIndex = (currentIndex + 1) % elements.length;
    (elements[nextIndex] as HTMLElement)?.focus();
  }, [getFocusableElements]);

  const focusPrevious = useCallback(() => {
    const elements = getFocusableElements();
    const currentIndex = elements.indexOf(document.activeElement as Element);
    const prevIndex = currentIndex <= 0 ? elements.length - 1 : currentIndex - 1;
    (elements[prevIndex] as HTMLElement)?.focus();
  }, [getFocusableElements]);

  const trapFocus = useCallback((event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    const elements = getFocusableElements();
    if (elements.length === 0) return;

    const firstElement = elements[0] as HTMLElement;
    const lastElement = elements[elements.length - 1] as HTMLElement;

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, [getFocusableElements]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', trapFocus);
    return () => container.removeEventListener('keydown', trapFocus);
  }, [containerRef, trapFocus]);

  return {
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    getFocusableElements
  };
};