/**
 * Auto-Save and Draft Management System for Smart Field Builder
 * Handles automatic saving, draft persistence, and recovery
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Chip,
  Typography,
  IconButton,
  Snackbar,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  alpha,
  useTheme
} from '@mui/material';
import {
  CloudDone as SavedIcon,
  CloudQueue as SavingIcon,
  CloudOff as ErrorIcon,
  History as HistoryIcon,
  Delete as DeleteIcon,
  Restore as RestoreIcon
} from '@mui/icons-material';

// Draft status types
export enum DraftStatus {
  IDLE = 'idle',
  SAVING = 'saving',
  SAVED = 'saved',
  ERROR = 'error',
  CONFLICT = 'conflict'
}

// Draft interface
export interface FieldDraft {
  id: string;
  name: string;
  data: any;
  timestamp: number;
  step: number;
  mode: 'guided' | 'template';
  version: number;
  checksum?: string;
}

// Auto-save configuration
interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // seconds
  maxDrafts: number;
  storageKey: string;
}

// Default configuration
const DEFAULT_CONFIG: AutoSaveConfig = {
  enabled: true,
  interval: 10, // 10 seconds
  maxDrafts: 5,
  storageKey: 'smart-field-builder-drafts'
};

// Draft storage manager
class DraftStorageManager {
  private storageKey: string;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  // Get all drafts
  getDrafts(): FieldDraft[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading drafts:', error);
      return [];
    }
  }

  // Save draft
  saveDraft(draft: FieldDraft): void {
    try {
      const drafts = this.getDrafts();
      const existingIndex = drafts.findIndex(d => d.id === draft.id);
      
      if (existingIndex >= 0) {
        drafts[existingIndex] = draft;
      } else {
        drafts.push(draft);
      }

      // Sort by timestamp (newest first)
      drafts.sort((a, b) => b.timestamp - a.timestamp);

      // Limit number of drafts
      if (drafts.length > DEFAULT_CONFIG.maxDrafts) {
        drafts.splice(DEFAULT_CONFIG.maxDrafts);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(drafts));
    } catch (error) {
      console.error('Error saving draft:', error);
      throw new Error('خطا در ذخیره draft');
    }
  }

  // Delete draft
  deleteDraft(draftId: string): void {
    try {
      const drafts = this.getDrafts().filter(d => d.id !== draftId);
      localStorage.setItem(this.storageKey, JSON.stringify(drafts));
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  }

  // Clear all drafts
  clearDrafts(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Error clearing drafts:', error);
    }
  }

  // Get draft by ID
  getDraft(draftId: string): FieldDraft | null {
    const drafts = this.getDrafts();
    return drafts.find(d => d.id === draftId) || null;
  }
}

// Generate checksum for data integrity
const generateChecksum = (data: any): string => {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
};

// Auto-save hook
export const useAutoSave = (
  fieldData: any,
  currentStep: number,
  mode: 'guided' | 'template',
  config: Partial<AutoSaveConfig> = {}
) => {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const [status, setStatus] = useState<DraftStatus>(DraftStatus.IDLE);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [draftId, setDraftId] = useState<string>(() => 
    `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  const storageManager = useRef(new DraftStorageManager(fullConfig.storageKey));
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastDataRef = useRef<string>('');

  // Save draft function
  const saveDraft = useCallback(async () => {
    if (!fullConfig.enabled) return;

    setStatus(DraftStatus.SAVING);

    try {
      const draft: FieldDraft = {
        id: draftId,
        name: fieldData.name || `Draft ${new Date().toLocaleString('fa-IR')}`,
        data: fieldData,
        timestamp: Date.now(),
        step: currentStep,
        mode,
        version: 1,
        checksum: generateChecksum(fieldData)
      };

      storageManager.current.saveDraft(draft);
      setStatus(DraftStatus.SAVED);
      setLastSaved(new Date());

    } catch (error) {
      setStatus(DraftStatus.ERROR);
      console.error('Auto-save error:', error);
    }
  }, [fieldData, currentStep, mode, draftId, fullConfig.enabled]);

  // Auto-save effect
  useEffect(() => {
    if (!fullConfig.enabled) return;

    const currentDataStr = JSON.stringify(fieldData);
    
    // Only save if data has changed
    if (currentDataStr !== lastDataRef.current && Object.keys(fieldData).length > 0) {
      lastDataRef.current = currentDataStr;
      
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for auto-save
      saveTimeoutRef.current = setTimeout(() => {
        saveDraft();
      }, fullConfig.interval * 1000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [fieldData, fullConfig.enabled, fullConfig.interval, saveDraft]);

  // Manual save
  const saveNow = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveDraft();
  }, [saveDraft]);

  // Delete current draft
  const deleteDraft = useCallback(() => {
    storageManager.current.deleteDraft(draftId);
    setStatus(DraftStatus.IDLE);
    setLastSaved(null);
  }, [draftId]);

  return {
    status,
    lastSaved,
    draftId,
    saveNow,
    deleteDraft,
    isAutoSaveEnabled: fullConfig.enabled
  };
};

// Draft status indicator component
interface DraftStatusIndicatorProps {
  status: DraftStatus;
  lastSaved: Date | null;
  onManualSave?: () => void;
}

export const DraftStatusIndicator: React.FC<DraftStatusIndicatorProps> = ({
  status,
  lastSaved,
  onManualSave
}) => {
  const theme = useTheme();

  const getStatusConfig = () => {
    switch (status) {
      case DraftStatus.SAVING:
        return {
          icon: <SavingIcon />,
          label: 'در حال ذخیره...',
          color: theme.palette.info.main
        };
      case DraftStatus.SAVED:
        return {
          icon: <SavedIcon />,
          label: 'ذخیره شد',
          color: theme.palette.success.main
        };
      case DraftStatus.ERROR:
        return {
          icon: <ErrorIcon />,
          label: 'خطا در ذخیره',
          color: theme.palette.error.main
        };
      default:
        return {
          icon: <SavedIcon />,
          label: 'آماده',
          color: theme.palette.grey[500]
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Chip
        icon={statusConfig.icon}
        label={statusConfig.label}
        size="small"
        sx={{
          backgroundColor: alpha(statusConfig.color, 0.1),
          color: statusConfig.color,
          '& .MuiChip-icon': {
            color: statusConfig.color
          }
        }}
        onClick={status === DraftStatus.ERROR ? onManualSave : undefined}
        clickable={status === DraftStatus.ERROR}
      />
      
      {lastSaved && status === DraftStatus.SAVED && (
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          {lastSaved.toLocaleTimeString('fa-IR')}
        </Typography>
      )}
    </Box>
  );
};

// Draft manager hook
export const useDraftManager = () => {
  const [drafts, setDrafts] = useState<FieldDraft[]>([]);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const storageManager = useRef(new DraftStorageManager(DEFAULT_CONFIG.storageKey));

  // Load drafts
  const loadDrafts = useCallback(() => {
    const loadedDrafts = storageManager.current.getDrafts();
    setDrafts(loadedDrafts);
  }, []);

  // Load drafts on mount
  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  // Delete draft
  const deleteDraft = useCallback((draftId: string) => {
    storageManager.current.deleteDraft(draftId);
    loadDrafts();
  }, [loadDrafts]);

  // Clear all drafts
  const clearAllDrafts = useCallback(() => {
    storageManager.current.clearDrafts();
    loadDrafts();
  }, [loadDrafts]);

  // Restore draft
  const restoreDraft = useCallback((draftId: string) => {
    const draft = storageManager.current.getDraft(draftId);
    return draft;
  }, []);

  return {
    drafts,
    showDraftDialog,
    setShowDraftDialog,
    deleteDraft,
    clearAllDrafts,
    restoreDraft,
    loadDrafts,
    hasDrafts: drafts.length > 0
  };
};

// Draft recovery dialog
interface DraftRecoveryDialogProps {
  open: boolean;
  onClose: () => void;
  onRestore: (draft: FieldDraft) => void;
  drafts: FieldDraft[];
  onDelete: (draftId: string) => void;
  onClearAll: () => void;
}

export const DraftRecoveryDialog: React.FC<DraftRecoveryDialogProps> = ({
  open,
  onClose,
  onRestore,
  drafts,
  onDelete,
  onClearAll
}) => {
  const theme = useTheme();

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('fa-IR');
  };

  const getModeLabel = (mode: string) => {
    return mode === 'guided' ? 'راهنمای گام‌به‌گام' : 'قالب‌های آماده';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon />
          بازیابی Draft های ذخیره شده
        </Box>
      </DialogTitle>

      <DialogContent>
        {drafts.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={3}>
            هیچ draft ذخیره شده‌ای وجود ندارد
          </Typography>
        ) : (
          <List>
            {drafts.map((draft) => (
              <ListItem key={draft.id} divider>
                <ListItemText
                  primary={draft.name}
                  secondary={
                    <Box>
                      <Typography variant="caption" display="block">
                        {formatDateTime(draft.timestamp)}
                      </Typography>
                      <Typography variant="caption" color="primary">
                        {getModeLabel(draft.mode)} • مرحله {draft.step + 1}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    size="small"
                    onClick={() => onRestore(draft)}
                    sx={{ mr: 1 }}
                  >
                    <RestoreIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDelete(draft.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        {drafts.length > 0 && (
          <Button color="error" onClick={onClearAll}>
            حذف همه
          </Button>
        )}
        <Button onClick={onClose}>بستن</Button>
      </DialogActions>
    </Dialog>
  );
};