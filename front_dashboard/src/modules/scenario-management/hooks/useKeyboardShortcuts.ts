/**
 * useKeyboardShortcuts Hook
 * Hook برای مدیریت میانبرهای صفحه‌کلید مطابق ORBAT
 */

import { useEffect, useCallback } from 'react';
import { useOrbatCommands } from '../../orbat-integration';

export interface KeyboardShortcutsConfig {
  enableGlobalShortcuts?: boolean;
  enableUndoRedo?: boolean;
  enableNavigation?: boolean;
  enableSearch?: boolean;
  onSearch?: () => void;
  onShowHelp?: () => void;
}

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig = {}) {
  const {
    enableGlobalShortcuts = true,
    enableUndoRedo = true,
    enableNavigation = true,
    enableSearch = true,
    onSearch,
    onShowHelp,
  } = config;

  const commands = useOrbatCommands();

  const handleKeyDown = useCallback(async (event: KeyboardEvent) => {
    if (!enableGlobalShortcuts) return;

    // Check if we're in an input field
    const target = event.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || 
                        target.contentEditable === 'true';

    // Ctrl/Cmd + Z - Undo
    if (enableUndoRedo && (event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      try {
        await commands.undo();
      } catch (error) {
        console.error('Undo failed:', error);
      }
      return;
    }

    // Ctrl/Cmd + Shift + Z - Redo
    if (enableUndoRedo && (event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey) {
      event.preventDefault();
      try {
        await commands.redo();
      } catch (error) {
        console.error('Redo failed:', error);
      }
      return;
    }

    // Ctrl/Cmd + Y - Redo (alternative)
    if (enableUndoRedo && (event.ctrlKey || event.metaKey) && event.key === 'y') {
      event.preventDefault();
      try {
        await commands.redo();
      } catch (error) {
        console.error('Redo failed:', error);
      }
      return;
    }

    // Ctrl/Cmd + K - Search
    if (enableSearch && (event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      onSearch?.();
      return;
    }

    // Alt + K - Search (alternative)
    if (enableSearch && event.altKey && event.key === 'k' && !isInputField) {
      event.preventDefault();
      onSearch?.();
      return;
    }

    // ? - Show help
    if (event.key === '?' && !isInputField) {
      event.preventDefault();
      onShowHelp?.();
      return;
    }

    // Escape - Clear selection
    if (event.key === 'Escape' && !isInputField) {
      event.preventDefault();
      try {
        await commands.clearSelection();
      } catch (error) {
        console.error('Clear selection failed:', error);
      }
      return;
    }

    // Navigation shortcuts (only when not in input fields)
    if (enableNavigation && !isInputField) {
      // 1, 2, 3 - Change view mode
      if (event.key === '1') {
        event.preventDefault();
        try {
          await commands.setViewMode('chart');
        } catch (error) {
          console.error('Set view mode failed:', error);
        }
        return;
      }

      if (event.key === '2') {
        event.preventDefault();
        try {
          await commands.setViewMode('map');
        } catch (error) {
          console.error('Set view mode failed:', error);
        }
        return;
      }

      if (event.key === '3') {
        event.preventDefault();
        try {
          await commands.setViewMode('grid');
        } catch (error) {
          console.error('Set view mode failed:', error);
        }
        return;
      }

      // Space - Play/Pause timeline
      if (event.key === ' ') {
        event.preventDefault();
        try {
          await commands.toggleTimeline();
        } catch (error) {
          console.error('Toggle timeline failed:', error);
        }
        return;
      }

      // T - Open time modal
      if (event.key === 't' || event.key === 'T') {
        event.preventDefault();
        // TODO: Open time modal
        console.log('Open time modal');
        return;
      }

      // S - Open search
      if (event.key === 's' || event.key === 'S') {
        event.preventDefault();
        onSearch?.();
        return;
      }
    }
  }, [
    enableGlobalShortcuts,
    enableUndoRedo,
    enableNavigation,
    enableSearch,
    commands,
    onSearch,
    onShowHelp,
  ]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    // Handle key up events if needed
  }, []);

  useEffect(() => {
    if (!enableGlobalShortcuts) return;

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [enableGlobalShortcuts, handleKeyDown, handleKeyUp]);

  // Return manual trigger functions
  return {
    triggerUndo: useCallback(async () => {
      try {
        await commands.undo();
      } catch (error) {
        console.error('Manual undo failed:', error);
      }
    }, [commands]),

    triggerRedo: useCallback(async () => {
      try {
        await commands.redo();
      } catch (error) {
        console.error('Manual redo failed:', error);
      }
    }, [commands]),

    triggerSearch: useCallback(() => {
      onSearch?.();
    }, [onSearch]),

    triggerHelp: useCallback(() => {
      onShowHelp?.();
    }, [onShowHelp]),

    triggerClearSelection: useCallback(async () => {
      try {
        await commands.clearSelection();
      } catch (error) {
        console.error('Manual clear selection failed:', error);
      }
    }, [commands]),
  };
}