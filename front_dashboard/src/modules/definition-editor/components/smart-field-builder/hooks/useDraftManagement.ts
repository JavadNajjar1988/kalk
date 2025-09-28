/**
 * Draft Management Hook for Smart Field Builder
 * Handles auto-save and draft recovery functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAdvancedMemo } from './useAdvancedMemoization';

interface DraftConfig {
  id: string;
  name?: string;
  data: any;
  timestamp: number;
  step?: number;
  mode?: string;
  version: number;
  checksum: string;
}

interface DraftOptions {
  autoSaveInterval: number; // ms
  maxDrafts: number;
  storageKey: string;
  enabled: boolean;
}

enum DraftStatus {
  IDLE = 'idle',
  SAVING = 'saving',
  SAVED = 'saved',
  ERROR = 'error'
}

export const useDraftManagement = (
  fieldData: any,
  currentStep: number,
  mode: string | null,
  options: Partial<DraftOptions> = {}
) => {
  const fullConfig = useAdvancedMemo(() => ({
    autoSaveInterval: 30000, // 30 seconds
    maxDrafts: 5,
    storageKey: 'smart-field-drafts',
    enabled: true,
    ...options
  }), [options]);

  const [status, setStatus] = useState<DraftStatus>(DraftStatus.IDLE);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [draftId] = useState(() => `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [availableDrafts, setAvailableDrafts] = useState<DraftConfig[]>([]);

  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastDataRef = useRef<string>('');

  // Generate checksum for data integrity
  const generateChecksum = useCallback((data: any): string => {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }, []);

  // Save draft to localStorage
  const saveDraft = useCallback(async () => {
    if (!fullConfig.enabled) return;

    setStatus(DraftStatus.SAVING);

    try {
      const draft: DraftConfig = {
        id: draftId,
        name: fieldData.name || `Draft ${new Date().toLocaleString('fa-IR')}`,
        data: fieldData,
        timestamp: Date.now(),
        step: currentStep,
        mode,
        version: 1,
        checksum: generateChecksum(fieldData)
      };

      const existingDrafts = JSON.parse(localStorage.getItem(fullConfig.storageKey) || '[]');
      const updatedDrafts = [...existingDrafts.filter((d: DraftConfig) => d.id !== draftId), draft]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, fullConfig.maxDrafts);

      localStorage.setItem(fullConfig.storageKey, JSON.stringify(updatedDrafts));
      setAvailableDrafts(updatedDrafts);
      setStatus(DraftStatus.SAVED);
      setLastSaved(new Date());

    } catch (error) {
      setStatus(DraftStatus.ERROR);
      console.error('Auto-save error:', error);
    }
  }, [fieldData, currentStep, mode, draftId, fullConfig.storageKey, fullConfig.maxDrafts, fullConfig.enabled, generateChecksum]);

  // Load available drafts
  const loadAvailableDrafts = useCallback(() => {
    try {
      const drafts = JSON.parse(localStorage.getItem(fullConfig.storageKey) || '[]');
      setAvailableDrafts(drafts);
      return drafts;
    } catch (error) {
      console.error('Error loading drafts:', error);
      return [];
    }
  }, [fullConfig.storageKey]);

  // Delete specific draft
  const deleteDraft = useCallback((draftId: string) => {
    try {
      const existingDrafts = JSON.parse(localStorage.getItem(fullConfig.storageKey) || '[]');
      const updatedDrafts = existingDrafts.filter((d: DraftConfig) => d.id !== draftId);
      localStorage.setItem(fullConfig.storageKey, JSON.stringify(updatedDrafts));
      setAvailableDrafts(updatedDrafts);
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  }, [fullConfig.storageKey]);

  // Clear all drafts
  const clearAllDrafts = useCallback(() => {
    try {
      localStorage.removeItem(fullConfig.storageKey);
      setAvailableDrafts([]);
    } catch (error) {
      console.error('Error clearing drafts:', error);
    }
  }, [fullConfig.storageKey]);

  // Auto-save effect
  useEffect(() => {
    if (!fullConfig.enabled) return;

    const currentDataStr = JSON.stringify(fieldData);
    
    // Only save if data has changed
    if (currentDataStr !== lastDataRef.current && Object.keys(fieldData).length > 0) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveDraft();
        lastDataRef.current = currentDataStr;
      }, 2000); // 2 second delay after user stops typing
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [fieldData, saveDraft, fullConfig.enabled]);

  // Periodic auto-save
  useEffect(() => {
    if (!fullConfig.enabled) return;

    const interval = setInterval(() => {
      const currentDataStr = JSON.stringify(fieldData);
      if (currentDataStr !== lastDataRef.current && Object.keys(fieldData).length > 0) {
        saveDraft();
        lastDataRef.current = currentDataStr;
      }
    }, fullConfig.autoSaveInterval);

    return () => clearInterval(interval);
  }, [fieldData, saveDraft, fullConfig.autoSaveInterval, fullConfig.enabled]);

  // Load available drafts on mount
  useEffect(() => {
    loadAvailableDrafts();
  }, [loadAvailableDrafts]);

  // Format last saved time
  const getLastSavedText = useCallback(() => {
    if (!lastSaved) return null;
    
    const now = new Date();
    const diffMs = now.getTime() - lastSaved.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'هم‌اکنون ذخیره شد';
    if (diffMinutes < 60) return `${diffMinutes} دقیقه پیش ذخیره شد`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} ساعت پیش ذخیره شد`;
    
    return lastSaved.toLocaleDateString('fa-IR');
  }, [lastSaved]);

  // Get status info
  const getStatusInfo = useCallback(() => {
    switch (status) {
      case DraftStatus.SAVING:
        return { text: 'در حال ذخیره...', color: 'info' };
      case DraftStatus.SAVED:
        return { text: getLastSavedText() || 'ذخیره شد', color: 'success' };
      case DraftStatus.ERROR:
        return { text: 'خطا در ذخیره خودکار', color: 'error' };
      default:
        return { text: '', color: 'default' };
    }
  }, [status, getLastSavedText]);

  return {
    // Status
    status,
    lastSaved,
    getStatusInfo,
    
    // Draft management
    availableDrafts,
    saveDraft,
    deleteDraft,
    clearAllDrafts,
    loadAvailableDrafts,
    
    // Config
    isEnabled: fullConfig.enabled,
    draftId
  };
};