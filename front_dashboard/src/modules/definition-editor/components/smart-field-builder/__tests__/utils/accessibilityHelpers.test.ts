/**
 * Unit Tests for Accessibility Helpers
 */

import {
  FocusManager,
  KeyboardEventHandler,
  ScreenReaderUtils,
  AriaHelper,
  ARIA_LABELS,
  KEYBOARD_SHORTCUTS
} from '../../utils/accessibilityHelpers';

// Mock DOM methods
Object.defineProperty(window, 'getComputedStyle', {
  value: (element: HTMLElement) => ({
    display: element.style.display || 'block',
    visibility: element.style.visibility || 'visible'
  })
});

describe('FocusManager', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('getFocusableElements', () => {
    test('finds focusable elements', () => {
      container.innerHTML = `
        <button>Button 1</button>
        <input type="text" />
        <select><option>Option</option></select>
        <textarea></textarea>
        <a href="#test">Link</a>
        <div tabindex="0">Focusable div</div>
        <button disabled>Disabled button</button>
        <div>Non-focusable div</div>
      `;

      const focusableElements = FocusManager.getFocusableElements(container);

      expect(focusableElements).toHaveLength(6);
      expect(focusableElements[0].tagName).toBe('BUTTON');
      expect(focusableElements[1].tagName).toBe('INPUT');
      expect(focusableElements[2].tagName).toBe('SELECT');
      expect(focusableElements[3].tagName).toBe('TEXTAREA');
      expect(focusableElements[4].tagName).toBe('A');
      expect(focusableElements[5].tagName).toBe('DIV');
    });

    test('excludes disabled elements', () => {
      container.innerHTML = `
        <button disabled>Disabled button</button>
        <input type="text" disabled />
        <button>Enabled button</button>
      `;

      const focusableElements = FocusManager.getFocusableElements(container);

      expect(focusableElements).toHaveLength(1);
      expect(focusableElements[0].textContent).toBe('Enabled button');
    });

    test('excludes elements with tabindex -1', () => {
      container.innerHTML = `
        <button tabindex="-1">Excluded button</button>
        <button tabindex="0">Included button</button>
        <button>Normal button</button>
      `;

      const focusableElements = FocusManager.getFocusableElements(container);

      expect(focusableElements).toHaveLength(2);
      expect(focusableElements.every(el => el.tabIndex !== -1)).toBe(true);
    });
  });

  describe('isElementVisible', () => {
    test('detects visible elements', () => {
      const element = document.createElement('div');
      element.style.width = '100px';
      element.style.height = '100px';
      container.appendChild(element);

      expect(FocusManager.isElementVisible(element)).toBe(true);
    });

    test('detects hidden elements', () => {
      const element = document.createElement('div');
      element.style.display = 'none';
      container.appendChild(element);

      expect(FocusManager.isElementVisible(element)).toBe(false);
    });

    test('detects invisible elements', () => {
      const element = document.createElement('div');
      element.style.visibility = 'hidden';
      container.appendChild(element);

      expect(FocusManager.isElementVisible(element)).toBe(false);
    });
  });

  describe('createFocusTrap', () => {
    test('creates focus trap and returns cleanup function', () => {
      container.innerHTML = `
        <button>First</button>
        <input type="text" />
        <button>Last</button>
      `;

      const cleanup = FocusManager.createFocusTrap(container);

      expect(typeof cleanup).toBe('function');

      // Test that first element receives focus
      expect(document.activeElement?.textContent).toBe('First');

      cleanup();
    });

    test('handles Tab key navigation', () => {
      container.innerHTML = `
        <button>First</button>
        <input type="text" />
        <button>Last</button>
      `;

      const cleanup = FocusManager.createFocusTrap(container);
      const lastButton = container.querySelector('button:last-child') as HTMLElement;
      
      // Simulate focusing last element
      lastButton.focus();

      // Simulate Tab key
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true
      });

      container.dispatchEvent(tabEvent);

      cleanup();
    });
  });

  describe('focusFirstInvalidField', () => {
    test('focuses first invalid field', () => {
      container.innerHTML = `
        <input type="text" />
        <input type="text" aria-invalid="true" />
        <input type="text" aria-invalid="true" />
      `;

      const focused = FocusManager.focusFirstInvalidField(container);
      const secondInput = container.children[1] as HTMLElement;

      expect(focused).toBe(true);
      expect(document.activeElement).toBe(secondInput);
    });

    test('returns false when no invalid fields found', () => {
      container.innerHTML = `
        <input type="text" />
        <input type="text" />
      `;

      const focused = FocusManager.focusFirstInvalidField(container);

      expect(focused).toBe(false);
    });
  });

  describe('announceToScreenReader', () => {
    test('creates announcement element', () => {
      FocusManager.announceToScreenReader('Test message');

      const announcement = document.querySelector('[aria-live]');
      expect(announcement).toBeInTheDocument();
      expect(announcement?.textContent).toBe('Test message');
      expect(announcement?.getAttribute('aria-live')).toBe('polite');
    });

    test('handles assertive priority', () => {
      FocusManager.announceToScreenReader('Urgent message', 'assertive');

      const announcement = document.querySelector('[aria-live="assertive"]');
      expect(announcement).toBeInTheDocument();
      expect(announcement?.textContent).toBe('Urgent message');
    });

    test('removes announcement after timeout', (done) => {
      FocusManager.announceToScreenReader('Temporary message');

      setTimeout(() => {
        const announcement = document.querySelector('[aria-live]');
        expect(announcement).not.toBeInTheDocument();
        done();
      }, 1100);
    });
  });
});

describe('KeyboardEventHandler', () => {
  let handler: KeyboardEventHandler;

  beforeEach(() => {
    handler = new KeyboardEventHandler();
  });

  describe('registerShortcut', () => {
    test('registers single shortcut', () => {
      const mockAction = jest.fn();
      
      handler.registerShortcut({
        key: 's',
        ctrlKey: true,
        action: mockAction,
        description: 'Save'
      });

      const shortcuts = handler.getShortcuts();
      expect(shortcuts).toHaveLength(1);
      expect(shortcuts[0].description).toBe('Save');
    });

    test('registers multiple shortcuts', () => {
      const shortcuts = [
        { key: 's', ctrlKey: true, action: jest.fn(), description: 'Save' },
        { key: 'Escape', action: jest.fn(), description: 'Close' }
      ];

      handler.registerShortcuts(shortcuts);

      expect(handler.getShortcuts()).toHaveLength(2);
    });
  });

  describe('handleKeyDown', () => {
    test('executes shortcut action', () => {
      const mockAction = jest.fn();
      
      handler.registerShortcut({
        key: 's',
        ctrlKey: true,
        action: mockAction,
        description: 'Save'
      });

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true
      });

      handler.handleKeyDown(event);

      expect(mockAction).toHaveBeenCalled();
    });

    test('ignores non-matching shortcuts', () => {
      const mockAction = jest.fn();
      
      handler.registerShortcut({
        key: 's',
        ctrlKey: true,
        action: mockAction,
        description: 'Save'
      });

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true
      });

      handler.handleKeyDown(event);

      expect(mockAction).not.toHaveBeenCalled();
    });

    test('handles complex key combinations', () => {
      const mockAction = jest.fn();
      
      handler.registerShortcut({
        key: 'r',
        ctrlKey: true,
        shiftKey: true,
        altKey: true,
        action: mockAction,
        description: 'Complex shortcut'
      });

      const event = new KeyboardEvent('keydown', {
        key: 'r',
        ctrlKey: true,
        shiftKey: true,
        altKey: true
      });

      handler.handleKeyDown(event);

      expect(mockAction).toHaveBeenCalled();
    });
  });

  describe('clearShortcuts', () => {
    test('clears all registered shortcuts', () => {
      handler.registerShortcut({
        key: 's',
        ctrlKey: true,
        action: jest.fn(),
        description: 'Save'
      });

      expect(handler.getShortcuts()).toHaveLength(1);

      handler.clearShortcuts();

      expect(handler.getShortcuts()).toHaveLength(0);
    });
  });
});

describe('ScreenReaderUtils', () => {
  beforeEach(() => {
    // Mock FocusManager.announceToScreenReader
    jest.spyOn(FocusManager, 'announceToScreenReader').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('announceValidationErrors', () => {
    test('announces validation errors', () => {
      const errors = {
        name: 'نام الزامی است',
        email: 'ایمیل نامعتبر است'
      };

      ScreenReaderUtils.announceValidationErrors(errors);

      expect(FocusManager.announceToScreenReader).toHaveBeenCalledWith(
        expect.stringContaining('2 خطای اعتبارسنجی یافت شد'),
        'assertive'
      );
    });

    test('does not announce when no errors', () => {
      ScreenReaderUtils.announceValidationErrors({});

      expect(FocusManager.announceToScreenReader).not.toHaveBeenCalled();
    });
  });

  describe('announceSuccess', () => {
    test('announces success message', () => {
      ScreenReaderUtils.announceSuccess('عملیات موفق بود');

      expect(FocusManager.announceToScreenReader).toHaveBeenCalledWith(
        'عملیات موفق بود',
        'polite'
      );
    });
  });

  describe('announceLoading', () => {
    test('announces loading with default message', () => {
      ScreenReaderUtils.announceLoading();

      expect(FocusManager.announceToScreenReader).toHaveBeenCalledWith(
        'در حال بارگذاری',
        'polite'
      );
    });

    test('announces loading with custom message', () => {
      ScreenReaderUtils.announceLoading('در حال بارگذاری قالب‌ها');

      expect(FocusManager.announceToScreenReader).toHaveBeenCalledWith(
        'در حال بارگذاری قالب‌ها',
        'polite'
      );
    });
  });

  describe('announceStepChange', () => {
    test('announces step change', () => {
      ScreenReaderUtils.announceStepChange('انتخاب نوع پایه', 1, 4);

      expect(FocusManager.announceToScreenReader).toHaveBeenCalledWith(
        'انتقال به مرحله 1 از 4: انتخاب نوع پایه',
        'polite'
      );
    });
  });
});

describe('AriaHelper', () => {
  describe('getFieldProps', () => {
    test('returns basic field props', () => {
      const props = AriaHelper.getFieldProps('نام کاربر');

      expect(props).toEqual({
        role: 'textbox',
        ariaLabel: 'نام کاربر',
        ariaDescribedBy: undefined,
        tabIndex: 0
      });
    });

    test('includes required indicator', () => {
      const props = AriaHelper.getFieldProps('نام کاربر', true);

      expect(props.ariaLabel).toBe('نام کاربر (اجباری)');
    });

    test('includes error message reference', () => {
      const props = AriaHelper.getFieldProps('نام کاربر', false, 'خطای اعتبارسنجی');

      expect(props.ariaDescribedBy).toBe('نام کاربر-error');
    });
  });

  describe('getButtonProps', () => {
    test('returns button props', () => {
      const props = AriaHelper.getButtonProps('ذخیره');

      expect(props).toEqual({
        role: 'button',
        ariaLabel: 'ذخیره',
        ariaDescribedBy: undefined,
        tabIndex: 0
      });
    });

    test('includes description reference', () => {
      const props = AriaHelper.getButtonProps('ذخیره', 'ذخیره تغییرات');

      expect(props.ariaDescribedBy).toBe('ذخیره-description');
    });
  });

  describe('getListItemProps', () => {
    test('returns list item props', () => {
      const props = AriaHelper.getListItemProps('گزینه اول', 0, 5);

      expect(props).toEqual({
        role: 'option',
        ariaLabel: 'گزینه اول (1 از 5)',
        tabIndex: 0
      });
    });
  });

  describe('getStepProps', () => {
    test('returns step props for active step', () => {
      const props = AriaHelper.getStepProps('انتخاب نوع', 1, 4, true);

      expect(props).toEqual({
        role: 'tab',
        ariaLabel: 'مرحله 1: انتخاب نوع',
        ariaDescribedBy: 'step-1-description',
        tabIndex: 0
      });
    });

    test('returns step props for inactive step', () => {
      const props = AriaHelper.getStepProps('انتخاب نوع', 1, 4, false);

      expect(props.tabIndex).toBe(-1);
    });
  });

  describe('getEnhancementToggleProps', () => {
    test('returns toggle props for enabled enhancement', () => {
      const props = AriaHelper.getEnhancementToggleProps('چندخطی', true);

      expect(props).toEqual({
        role: 'switch',
        ariaLabel: 'چندخطی (فعال)',
        tabIndex: 0
      });
    });

    test('returns toggle props for disabled enhancement', () => {
      const props = AriaHelper.getEnhancementToggleProps('چندخطی', false);

      expect(props.ariaLabel).toBe('چندخطی (غیرفعال)');
    });
  });
});

describe('ARIA_LABELS', () => {
  test('contains required labels', () => {
    expect(ARIA_LABELS).toHaveProperty('modal');
    expect(ARIA_LABELS).toHaveProperty('closeModal');
    expect(ARIA_LABELS).toHaveProperty('templateSection');
    expect(ARIA_LABELS).toHaveProperty('wizardSection');
    expect(ARIA_LABELS).toHaveProperty('save');
    expect(ARIA_LABELS).toHaveProperty('cancel');
  });

  test('labels are in Persian', () => {
    expect(ARIA_LABELS.modal).toMatch(/مودال/);
    expect(ARIA_LABELS.save).toMatch(/ذخیره/);
    expect(ARIA_LABELS.cancel).toMatch(/انصراف/);
  });
});

describe('KEYBOARD_SHORTCUTS', () => {
  test('contains required shortcuts', () => {
    expect(KEYBOARD_SHORTCUTS).toHaveProperty('CLOSE_MODAL');
    expect(KEYBOARD_SHORTCUTS).toHaveProperty('SAVE_FIELD');
    expect(KEYBOARD_SHORTCUTS).toHaveProperty('NEXT_STEP');
    expect(KEYBOARD_SHORTCUTS).toHaveProperty('PREVIOUS_STEP');
  });

  test('shortcuts have proper structure', () => {
    const shortcut = KEYBOARD_SHORTCUTS.CLOSE_MODAL;
    
    expect(shortcut).toHaveProperty('key');
    expect(shortcut).toHaveProperty('description');
    expect(typeof shortcut.key).toBe('string');
    expect(typeof shortcut.description).toBe('string');
  });

  test('descriptions are in Persian', () => {
    const shortcuts = Object.values(KEYBOARD_SHORTCUTS);
    
    shortcuts.forEach(shortcut => {
      expect(shortcut.description).toMatch(/[\u0600-\u06FF]/); // Persian character range
    });
  });
});

describe('Integration Tests', () => {
  test('focus trap works with keyboard navigation', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <button>First</button>
      <input type="text" />
      <button>Last</button>
    `;
    document.body.appendChild(container);

    const cleanup = FocusManager.createFocusTrap(container);
    const handler = new KeyboardEventHandler();

    // Register Tab navigation
    handler.registerShortcut({
      key: 'Tab',
      action: () => {
        // Test that Tab handling works
      },
      description: 'Next element'
    });

    // Test keyboard event handling
    const event = new KeyboardEvent('keydown', { key: 'Tab' });
    handler.handleKeyDown(event);

    cleanup();
    document.body.removeChild(container);
  });

  test('screen reader announcements work with validation', () => {
    const errors = {
      name: 'نام الزامی است'
    };

    ScreenReaderUtils.announceValidationErrors(errors);

    // Verify announcement was made
    expect(FocusManager.announceToScreenReader).toHaveBeenCalledWith(
      expect.stringContaining('خطای اعتبارسنجی'),
      'assertive'
    );
  });
});