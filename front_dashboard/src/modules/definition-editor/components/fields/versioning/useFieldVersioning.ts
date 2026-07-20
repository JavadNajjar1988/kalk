import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FieldVersioningEngine 
} from './FieldVersioningEngine';
import { 
  FieldVersion, 
  FieldConfiguration, 
  VersionBranch, 
  VersionComparison,
  VersionHistoryQuery,
  VersionRestoreOptions,
  VersionExportData,
  VersionImportOptions
} from './types';

interface UseFieldVersioningOptions {
  autoInitialize?: boolean;
}

interface UseFieldVersioningReturn {
  // Data
  versions: FieldVersion[];
  branches: VersionBranch[];
  currentVersion: FieldVersion | null;
  isLoading: boolean;
  error: string | null;
  
  // Methods
  createVersion: (
    fieldId: string,
    configuration: FieldConfiguration,
    options: {
      name: string;
      description?: string;
      createdBy: string;
      isDraft?: boolean;
      branchName?: string;
    }
  ) => Promise<FieldVersion | null>;
  
  getVersion: (fieldId: string, version: number) => Promise<FieldVersion | undefined>;
  getVersionHistory: (fieldId: string, query?: VersionHistoryQuery) => Promise<FieldVersion[]>;
  compareVersions: (fieldId: string, baseVersion: number, targetVersion: number) => Promise<VersionComparison | null>;
  restoreVersion: (fieldId: string, version: number, options?: VersionRestoreOptions) => Promise<FieldVersion | null>;
  archiveVersion: (fieldId: string, version: number) => Promise<boolean>;
  deleteVersion: (fieldId: string, version: number) => Promise<boolean>;
  
  // Branch methods
  createBranch: (
    fieldId: string,
    name: string,
    options: {
      description?: string;
      createdBy: string;
      isDefault?: boolean;
      parentBranchId?: string;
    }
  ) => Promise<VersionBranch | null>;
  
  getBranches: (fieldId: string) => Promise<VersionBranch[]>;
  
  // Export/Import
  exportVersions: (fieldId: string) => Promise<VersionExportData | null>;
  importVersions: (data: VersionExportData, options: VersionImportOptions) => Promise<boolean>;
  
  // Settings
  getSettings: () => any;
  updateSettings: (settings: any) => Promise<void>;
}

export const useFieldVersioning = (
  options: UseFieldVersioningOptions = {}
): UseFieldVersioningReturn => {
  const { autoInitialize = true } = options;
  
  const versioningEngine = useMemo(() => FieldVersioningEngine.getInstance(), []);
  
  const [versions, setVersions] = useState<FieldVersion[]>([]);
  const [branches, setBranches] = useState<VersionBranch[]>([]);
  const [currentVersion, setCurrentVersion] = useState<FieldVersion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the engine
  const initialize = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await versioningEngine.initialize();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize versioning engine');
    } finally {
      setIsLoading(false);
    }
  }, [versioningEngine]);

  // Auto-initialize if requested
  useEffect(() => {
    if (autoInitialize) {
      initialize();
    }
  }, [autoInitialize, initialize]);

  // Create a new field version
  const createVersion = useCallback(async (
    fieldId: string,
    configuration: FieldConfiguration,
    options: {
      name: string;
      description?: string;
      createdBy: string;
      isDraft?: boolean;
      branchName?: string;
    }
  ): Promise<FieldVersion | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newVersion = versioningEngine.createVersion(fieldId, configuration, options);
      setCurrentVersion(newVersion);
      return newVersion;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create version');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [versioningEngine]);

  // Get a specific field version
  const getVersion = useCallback(async (
    fieldId: string,
    version: number
  ): Promise<FieldVersion | undefined> => {
    setIsLoading(true);
    setError(null);
    
    try {
      return versioningEngine.getFieldVersion(fieldId, version);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get version');
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [versioningEngine]);

  // Get version history
  const getVersionHistory = useCallback(async (
    fieldId: string,
    query?: VersionHistoryQuery
  ): Promise<FieldVersion[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const history = versioningEngine.getFieldVersions(fieldId, query);
      setVersions(history);
      return history;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get version history');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [versioningEngine]);

  // Compare two versions
  const compareVersions = useCallback(async (
    fieldId: string,
    baseVersion: number,
    targetVersion: number
  ): Promise<VersionComparison | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const comparison = versioningEngine.compareVersions(fieldId, baseVersion, targetVersion);
      return comparison;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare versions');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [versioningEngine]);

  // Restore a version
  const restoreVersion = useCallback(async (
    fieldId: string,
    version: number,
    options?: VersionRestoreOptions
  ): Promise<FieldVersion | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const restored = versioningEngine.restoreVersion(fieldId, version, options);
      if (restored) {
        setCurrentVersion(restored);
      }
      return restored;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore version');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [versioningEngine]);

  // Archive a version
  const archiveVersion = useCallback(async (
    fieldId: string,
    version: number
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = versioningEngine.archiveVersion(fieldId, version);
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive version');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [versioningEngine]);

  // Delete a version
  const deleteVersion = useCallback(async (
    fieldId: string,
    version: number
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = versioningEngine.deleteVersion(fieldId, version);
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete version');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [versioningEngine]);

  // Create a new branch
  const createBranch = useCallback(async (
    fieldId: string,
    name: string,
    options: {
      description?: string;
      createdBy: string;
      isDefault?: boolean;
      parentBranchId?: string;
    }
  ): Promise<VersionBranch | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newBranch = versioningEngine.createBranch(fieldId, name, options);
      return newBranch;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create branch');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [versioningEngine]);

  // Get branches
  const getBranches = useCallback(async (
    fieldId: string
  ): Promise<VersionBranch[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const fieldBranches = versioningEngine.getBranches(fieldId);
      setBranches(fieldBranches);
      return fieldBranches;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get branches');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [versioningEngine]);

  // Export versions
  const exportVersions = useCallback(async (
    fieldId: string
  ): Promise<VersionExportData | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const exportData = versioningEngine.exportVersions(fieldId);
      return exportData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export versions');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [versioningEngine]);

  // Import versions
  const importVersions = useCallback(async (
    data: VersionExportData,
    options: VersionImportOptions
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await versioningEngine.importVersions(data, options);
      return result.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import versions');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [versioningEngine]);

  // Get settings
  const getSettings = useCallback(() => {
    return versioningEngine.getSettings();
  }, [versioningEngine]);

  // Update settings
  const updateSettings = useCallback(async (
    settings: any
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      versioningEngine.updateSettings(settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  }, [versioningEngine]);

  return {
    // Data
    versions,
    branches,
    currentVersion,
    isLoading,
    error,
    
    // Methods
    createVersion,
    getVersion,
    getVersionHistory,
    compareVersions,
    restoreVersion,
    archiveVersion,
    deleteVersion,
    createBranch,
    getBranches,
    exportVersions,
    importVersions,
    getSettings,
    updateSettings
  };
};

export default useFieldVersioning;