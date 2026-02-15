import { useState } from 'react';

export interface LogisticsFieldDefinition {
  id: string;
  name: string;
  englishName: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';
  isRequired: boolean;
  order: number;
  options?: string[];
  unit?: string;
}

export interface LogisticsPath {
  nodeId: string;
  nodeName: string;
  level: number;
}

export const useLogisticsHierarchy = () => {
  const [selectedPath, setSelectedPath] = useState<LogisticsPath[]>([]);
  return {
    rootNodes: [],
    loading: false,
    error: null as string | null,
    selectedPath,
    getCurrentSelection: { path: selectedPath, finalNode: null, fields: [] as LogisticsFieldDefinition[] },
    addToPath: (nodeId: string, nodeName: string, level: number) =>
      setSelectedPath((prev) => [...prev.filter((p) => p.level < level), { nodeId, nodeName, level }]),
    clearPathFromLevel: (level: number) => setSelectedPath((prev) => prev.filter((p) => p.level < level)),
    resetPath: () => setSelectedPath([]),
    updateSelectedPath: (path: LogisticsPath[]) => setSelectedPath(path),
    getOptionsForLevel: (_level: number) => [],
    findNodeByPath: (_path: LogisticsPath[]) => null,
    refresh: () => {},
    triggerManualSync: () => {},
    lastSyncTime: Date.now(),
  };
};
