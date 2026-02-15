import { useState } from 'react';

export interface EquipmentFieldDefinition {
  id: string;
  name: string;
  englishName: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';
  isRequired: boolean;
  order: number;
  options?: string[];
  unit?: string;
}

export interface EquipmentPath {
  nodeId: string;
  nodeName: string;
  level: number;
}

export const useEquipmentHierarchy = () => {
  const [selectedPath, setSelectedPath] = useState<EquipmentPath[]>([]);
  return {
    rootNodes: [],
    loading: false,
    error: null as string | null,
    selectedPath,
    getCurrentSelection: { path: selectedPath, finalNode: null, fields: [] as EquipmentFieldDefinition[] },
    addToPath: (nodeId: string, nodeName: string, level: number) =>
      setSelectedPath((prev) => [...prev.filter((p) => p.level < level), { nodeId, nodeName, level }]),
    clearPathFromLevel: (level: number) => setSelectedPath((prev) => prev.filter((p) => p.level < level)),
    resetPath: () => setSelectedPath([]),
    updateSelectedPath: (path: EquipmentPath[]) => setSelectedPath(path),
    getOptionsForLevel: (_level: number) => [],
    findNodeByPath: (_path: EquipmentPath[]) => null,
    refresh: () => {},
    triggerManualSync: () => {},
    lastSyncTime: Date.now(),
  };
};
