import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import ScenarioDialog from './ScenarioDialog';
import type { Scenario } from '@/types';

interface ScenarioDialogContextType {
  openDialog: (options?: { scenario?: Scenario; onSave?: (data: Partial<Scenario>) => void }) => void;
  closeDialog: () => void;
}

const ScenarioDialogContext = createContext<ScenarioDialogContextType | undefined>(undefined);

export const useScenarioDialog = () => {
  const ctx = useContext(ScenarioDialogContext);
  if (!ctx) throw new Error('useScenarioDialog must be used within ScenarioDialogProvider');
  return ctx;
};

export const ScenarioDialogProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [scenario, setScenario] = useState<Scenario | undefined>(undefined);
  const [onSaveCallback, setOnSaveCallback] = useState<((data: Partial<Scenario>) => void) | undefined>(undefined);

  const openDialog = useCallback((options?: { scenario?: Scenario; onSave?: (data: Partial<Scenario>) => void }) => {
    setScenario(options?.scenario);
    setOnSaveCallback(() => options?.onSave);
    setOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setOpen(false);
    setScenario(undefined);
    setOnSaveCallback(undefined);
  }, []);

  const handleSave = (data: Partial<Scenario>) => {
    if (onSaveCallback) onSaveCallback(data);
    closeDialog();
  };

  return (
    <ScenarioDialogContext.Provider value={{ openDialog, closeDialog }}>
      {children}
      <ScenarioDialog
        open={open}
        onClose={closeDialog}
        scenario={scenario}
        onSave={handleSave}
      />
    </ScenarioDialogContext.Provider>
  );
}; 