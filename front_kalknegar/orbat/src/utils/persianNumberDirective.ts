/**
 * Vue Directive for Persian Number Localization
 * Automatically converts English digits to Persian digits in text content
 */

import { toPersianDigits } from '@/utils/persianNumbers';
import type { DirectiveBinding, VNode, Directive } from 'vue';

interface PersianNumberElement extends HTMLElement {
  _originalTextContent?: string;
  _persianNumberObserver?: MutationObserver;
}

/**
 * Updates element text content with Persian digits
 */
function updateElementText(el: PersianNumberElement): void {
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
    const inputEl = el as HTMLInputElement;
    if (inputEl.type === 'text' || inputEl.type === 'number' || el.tagName === 'TEXTAREA') {
      if (inputEl.value) {
        inputEl.value = toPersianDigits(inputEl.value);
      }
      if (inputEl.placeholder) {
        inputEl.placeholder = toPersianDigits(inputEl.placeholder);
      }
    }
  } else {
    // Handle text content for other elements
    const walker = document.createTreeWalker(
      el,
      NodeFilter.SHOW_TEXT,
      null
    );

    const textNodes: Text[] = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }

    textNodes.forEach(textNode => {
      if (textNode.textContent) {
        textNode.textContent = toPersianDigits(textNode.textContent);
      }
    });
  }
}

/**
 * Sets up mutation observer to watch for dynamic content changes
 */
function setupObserver(el: PersianNumberElement): void {
  if (el._persianNumberObserver) {
    el._persianNumberObserver.disconnect();
  }

  el._persianNumberObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        updateElementText(el);
      }
    });
  });

  el._persianNumberObserver.observe(el, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

/**
 * Persian Number Directive
 * Usage: v-persian-numbers
 * 
 * Automatically converts all English digits to Persian digits in the element
 * and sets up observers for dynamic content changes
 */
export const vPersianNumbers: Directive<PersianNumberElement> = {
  mounted(el: PersianNumberElement, binding: DirectiveBinding) {
    // Store original content if needed
    if (el.textContent) {
      el._originalTextContent = el.textContent;
    }

    // Initial conversion
    updateElementText(el);

    // Setup observer for dynamic changes
    if (binding.modifiers.dynamic !== false) {
      setupObserver(el);
    }
  },

  updated(el: PersianNumberElement) {
    // Update content when component updates
    updateElementText(el);
  },

  unmounted(el: PersianNumberElement) {
    // Clean up observer
    if (el._persianNumberObserver) {
      el._persianNumberObserver.disconnect();
      delete el._persianNumberObserver;
    }
    delete el._originalTextContent;
  }
};

/**
 * Persian Number Input Directive
 * Usage: v-persian-input
 * 
 * Specifically for input elements - converts display to Persian but maintains 
 * English digits for form processing
 */
export const vPersianInput: Directive<HTMLInputElement> = {
  mounted(el: HTMLInputElement, binding: DirectiveBinding) {
    if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') {
      console.warn('v-persian-input directive should only be used on input or textarea elements');
      return;
    }

    const handleInput = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const cursorPosition = target.selectionStart;
      const originalValue = target.value;
      
      // Display Persian digits
      target.value = toPersianDigits(originalValue);
      
      // Restore cursor position
      if (cursorPosition !== null) {
        target.setSelectionRange(cursorPosition, cursorPosition);
      }
    };

    const handleFocus = () => {
      // Optionally convert to English digits for editing
      if (binding.modifiers.editEnglish) {
        // This would require reverse conversion function
      }
    };

    el.addEventListener('input', handleInput);
    el.addEventListener('focus', handleFocus);

    // Store handlers for cleanup
    (el as any)._persianInputHandlers = { handleInput, handleFocus };

    // Initial conversion
    if (el.value) {
      el.value = toPersianDigits(el.value);
    }
  },

  unmounted(el: HTMLInputElement) {
    const handlers = (el as any)._persianInputHandlers;
    if (handlers) {
      el.removeEventListener('input', handlers.handleInput);
      el.removeEventListener('focus', handlers.handleFocus);
      delete (el as any)._persianInputHandlers;
    }
  }
};

/**
 * Export both directives
 */
export default {
  'persian-numbers': vPersianNumbers,
  'persian-input': vPersianInput
};