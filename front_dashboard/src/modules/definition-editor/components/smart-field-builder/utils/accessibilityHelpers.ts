/**
 * Accessibility Helpers for Smart Field Builder
 * Provides ARIA labels, keyboard shortcuts, and focus management utilities
 */

export interface AccessibilityConfig {
  role: string;
  ariaLabel: string;
  ariaDescribedBy?: string;
  ariaLabelledBy?: string;
  tabIndex?: number;
  keyboardShortcuts?: KeyboardShortcut[];
}

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

// ARIA Labels for Persian UI
export const ARIA_LABELS = {
  // Modal and Navigation
  modal: 'مودال ساخت فیلد هوشمند',
  closeModal: 'بستن مودال',
  previousStep: 'مرحله قبل',
  nextStep: 'مرحله بعد',
  stepNavigation: 'ناوبری مراحل ساخت فیلد',
  
  // Template Section
  templateSection: 'بخش انتخاب قالب آماده',
  templateCard: 'کارت قالب',
  templateSelect: 'انتخاب قالب',
  templatePreview: 'پیش‌نمایش قالب',
  templateSearch: 'جستجو در قالب‌ها',
  templateFilter: 'فیلتر قالب‌ها',
  templateCategory: 'دسته‌بندی قالب',
  
  // Wizard Section
  wizardSection: 'بخش راهنمای گام به گام',
  baseTypeStep: 'انتخاب نوع پایه فیلد',
  enhancementsStep: 'پیکربندی ویژگی‌ها',
  dataSourceStep: 'تعریف منبع داده',
  previewStep: 'پیش‌نمایش و تأیید',
  
  // Field Types
  textField: 'فیلد متنی',
  numberField: 'فیلد عددی',
  choiceField: 'فیلد انتخابی',
  referenceField: 'فیلد مرجع',
  
  // Enhancements
  enhancement: 'ویژگی فیلد',
  enhancementToggle: 'فعال/غیرفعال کردن ویژگی',
  enhancementConfig: 'پیکربندی ویژگی',
  
  // Form Controls
  fieldName: 'نام فیلد',
  fieldEnglishName: 'نام انگلیسی فیلد',
  fieldDescription: 'توضیحات فیلد',
  isRequired: 'اجباری بودن فیلد',
  placeholder: 'متن راهنما',
  helpText: 'متن کمکی',
  
  // Actions
  save: 'ذخیره فیلد',
  cancel: 'انصراف',
  reset: 'بازنشانی',
  preview: 'پیش‌نمایش',
  apply: 'اعمال',
  
  // Status and Feedback
  loading: 'در حال بارگذاری',
  error: 'خطا',
  success: 'موفقیت‌آمیز',
  warning: 'هشدار',
  validationError: 'خطای اعتبارسنجی',
  
  // Specific Features
  virtualList: 'لیست مجازی',
  searchResults: 'نتایج جستجو',
  filterResults: 'نتایج فیلتر',
  sortOptions: 'گزینه‌های مرتب‌سازی'
};

// Keyboard Shortcuts Configuration
export const KEYBOARD_SHORTCUTS = {
  // Global shortcuts
  CLOSE_MODAL: { key: 'Escape', description: 'بستن مودال' },
  SAVE_FIELD: { key: 's', ctrlKey: true, description: 'ذخیره فیلد' },
  RESET_FORM: { key: 'r', ctrlKey: true, shiftKey: true, description: 'بازنشانی فرم' },
  
  // Navigation shortcuts
  NEXT_STEP: { key: 'ArrowRight', ctrlKey: true, description: 'مرحله بعد' },
  PREVIOUS_STEP: { key: 'ArrowLeft', ctrlKey: true, description: 'مرحله قبل' },
  JUMP_TO_PREVIEW: { key: 'p', ctrlKey: true, description: 'رفتن به پیش‌نمایش' },
  
  // Template shortcuts
  SEARCH_TEMPLATES: { key: 'f', ctrlKey: true, description: 'جستجو در قالب‌ها' },
  TOGGLE_VIEW: { key: 'v', ctrlKey: true, description: 'تغییر نما' },
  SELECT_FIRST_TEMPLATE: { key: '1', altKey: true, description: 'انتخاب اولین قالب' },
  
  // Wizard shortcuts
  TOGGLE_ENHANCEMENT: { key: 'e', ctrlKey: true, description: 'فعال/غیرفعال کردن ویژگی' },
  ADD_VALIDATION: { key: 'v', ctrlKey: true, shiftKey: true, description: 'افزودن قانون اعتبارسنجی' },
  
  // Accessibility shortcuts
  FOCUS_NEXT: { key: 'Tab', description: 'فوکوس روی عنصر بعدی' },
  FOCUS_PREVIOUS: { key: 'Tab', shiftKey: true, description: 'فوکوس روی عنصر قبلی' },
  ACTIVATE_ELEMENT: { key: 'Enter', description: 'فعال‌سازی عنصر' },
  ACTIVATE_ALTERNATIVE: { key: ' ', description: 'فعال‌سازی جایگزین' }
};

// Focus Management Utilities
export class FocusManager {
  private static focusableElements = [
    'button',
    'input',
    'select',
    'textarea',
    'a[href]',
    '[tabindex]',
    '[contenteditable]'
  ].join(',');

  /**
   * Get all focusable elements within a container
   */
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(
      container.querySelectorAll(this.focusableElements)
    ).filter((element: HTMLElement) => {
      return !element.hasAttribute('disabled') && 
             element.tabIndex !== -1 &&
             this.isElementVisible(element);
    }) as HTMLElement[];
  }

  /**
   * Check if element is visible
   */
  static isElementVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           element.offsetWidth > 0 && 
           element.offsetHeight > 0;
  }

  /**
   * Create focus trap for modal
   */
  static createFocusTrap(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    // Focus first element initially
    firstElement?.focus();

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  /**
   * Auto-focus on first invalid field
   */
  static focusFirstInvalidField(container: HTMLElement): boolean {
    const invalidFields = container.querySelectorAll('[aria-invalid="true"]');
    if (invalidFields.length > 0) {
      (invalidFields[0] as HTMLElement).focus();
      return true;
    }
    return false;
  }

  /**
   * Announce changes to screen readers
   */
  static announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.setAttribute('class', 'sr-only');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    
    document.body.appendChild(announcement);
    announcement.textContent = message;
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
}

// Keyboard Event Handler
export class KeyboardEventHandler {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();

  /**
   * Register keyboard shortcut
   */
  registerShortcut(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  /**
   * Register multiple shortcuts
   */
  registerShortcuts(shortcuts: KeyboardShortcut[]): void {
    shortcuts.forEach(shortcut => this.registerShortcut(shortcut));
  }

  /**
   * Handle keyboard event
   */
  handleKeyDown = (event: KeyboardEvent): void => {
    const key = this.getEventKey(event);
    const shortcut = this.shortcuts.get(key);
    
    if (shortcut) {
      event.preventDefault();
      shortcut.action();
    }
  };

  /**
   * Get shortcut key string
   */
  private getShortcutKey(shortcut: KeyboardShortcut): string {
    const parts = [];
    if (shortcut.ctrlKey) parts.push('ctrl');
    if (shortcut.shiftKey) parts.push('shift');
    if (shortcut.altKey) parts.push('alt');
    parts.push(shortcut.key.toLowerCase());
    return parts.join('+');
  }

  /**
   * Get event key string
   */
  private getEventKey(event: KeyboardEvent): string {
    const parts = [];
    if (event.ctrlKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');
    parts.push(event.key.toLowerCase());
    return parts.join('+');
  }

  /**
   * Get all registered shortcuts for help display
   */
  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Clear all shortcuts
   */
  clearShortcuts(): void {
    this.shortcuts.clear();
  }
}

// ARIA Helper Functions
export const AriaHelper = {
  /**
   * Generate accessibility props for field input
   */
  getFieldProps(fieldName: string, isRequired: boolean = false, errorMessage?: string): AccessibilityConfig {
    return {
      role: 'textbox',
      ariaLabel: `${fieldName}${isRequired ? ' (اجباری)' : ''}`,
      ariaDescribedBy: errorMessage ? `${fieldName}-error` : undefined,
      tabIndex: 0
    };
  },

  /**
   * Generate accessibility props for button
   */
  getButtonProps(label: string, description?: string): AccessibilityConfig {
    return {
      role: 'button',
      ariaLabel: label,
      ariaDescribedBy: description ? `${label}-description` : undefined,
      tabIndex: 0
    };
  },

  /**
   * Generate accessibility props for list item
   */
  getListItemProps(label: string, index: number, totalItems: number): AccessibilityConfig {
    return {
      role: 'option',
      ariaLabel: `${label} (${index + 1} از ${totalItems})`,
      tabIndex: 0
    };
  },

  /**
   * Generate accessibility props for step navigation
   */
  getStepProps(stepName: string, stepNumber: number, totalSteps: number, isActive: boolean): AccessibilityConfig {
    return {
      role: 'tab',
      ariaLabel: `مرحله ${stepNumber}: ${stepName}`,
      ariaDescribedBy: `step-${stepNumber}-description`,
      tabIndex: isActive ? 0 : -1
    };
  },

  /**
   * Generate accessibility props for enhancement toggle
   */
  getEnhancementToggleProps(enhancementName: string, isEnabled: boolean): AccessibilityConfig {
    return {
      role: 'switch',
      ariaLabel: `${enhancementName} (${isEnabled ? 'فعال' : 'غیرفعال'})`,
      tabIndex: 0
    };
  }
};

// Screen Reader Utilities
export const ScreenReaderUtils = {
  /**
   * Announce form validation errors
   */
  announceValidationErrors(errors: Record<string, string>): void {
    const errorCount = Object.keys(errors).length;
    if (errorCount > 0) {
      const message = `${errorCount} خطای اعتبارسنجی یافت شد. ${Object.values(errors).join('. ')}`;
      FocusManager.announceToScreenReader(message, 'assertive');
    }
  },

  /**
   * Announce successful action
   */
  announceSuccess(message: string): void {
    FocusManager.announceToScreenReader(message, 'polite');
  },

  /**
   * Announce loading state
   */
  announceLoading(message: string = 'در حال بارگذاری'): void {
    FocusManager.announceToScreenReader(message, 'polite');
  },

  /**
   * Announce step change
   */
  announceStepChange(stepName: string, stepNumber: number, totalSteps: number): void {
    const message = `انتقال به مرحله ${stepNumber} از ${totalSteps}: ${stepName}`;
    FocusManager.announceToScreenReader(message, 'polite');
  }
};