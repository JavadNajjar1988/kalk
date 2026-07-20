import { useMemo, useState } from 'react';
import type { FieldDefinition } from './useDefinitionData';

export interface HierarchicalNode {
  id: string;
  name: string;
  englishName: string;
  level: number;
  parentId: string | null;
  description?: string;
  children: HierarchicalNode[];
  customFields: FieldDefinition[];
  hasChildren: boolean;
}

export interface HierarchicalPath {
  nodeId: string;
  nodeName: string;
  level: number;
}

export const useHierarchicalData = (_categoryType: 'users' | 'resources') => {
  const [selectedPath, setSelectedPath] = useState<HierarchicalPath[]>([]);

  const rootNode: HierarchicalNode = useMemo(
    () => ({
      id: 'root',
      name: 'ریشه',
      englishName: 'Root',
      level: 0,
      parentId: null,
      children: [],
      customFields: [],
      hasChildren: false,
    }),
    []
  );

  return {
    rootNode,
    loading: false,
    error: null as string | null,
    selectedPath,
    getCurrentSelection: { path: selectedPath, finalNode: null, fields: [] as FieldDefinition[] },
    addToPath: (nodeId: string, nodeName: string, level: number) =>
      setSelectedPath((prev) => [...prev.filter((p) => p.level < level), { nodeId, nodeName, level }]),
    clearPathFromLevel: (level: number) => setSelectedPath((prev) => prev.filter((p) => p.level < level)),
    resetPath: () => setSelectedPath([]),
    updateSelectedPath: (path: HierarchicalPath[]) => setSelectedPath(path),
    getOptionsForLevel: (_level: number) => [],
    findNodeByPath: (_path: HierarchicalPath[]) => null,
    refresh: () => {},
    triggerManualSync: () => {},
    getSyncInfo: () => ({ lastSyncTime: Date.now(), syncHistory: [], isAutoSyncEnabled: false }),
    lastSyncTime: Date.now(),
  };
};

export default useHierarchicalData;
