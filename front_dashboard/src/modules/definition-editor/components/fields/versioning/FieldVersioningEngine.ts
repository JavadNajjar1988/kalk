import { 
  FieldVersion, 
  FieldConfiguration, 
  VersionBranch, 
  VersionHistoryQuery, 
  VersionComparison,
  VersionRestoreOptions,
  VersionExportData,
  VersionImportOptions,
  VersionConflict,
  VersioningSettings
} from './types';

/**
 * Core Field Versioning Engine
 * Manages field versioning, branching, and history
 */
export class FieldVersioningEngine {
  private static instance: FieldVersioningEngine;
  private versions: Map<string, FieldVersion[]> = new Map();
  private branches: Map<string, VersionBranch[]> = new Map();
  private settings: VersioningSettings;
  private isInitialized: boolean = false;

  private constructor() {
    this.settings = this.getDefaultSettings();
  }

  public static getInstance(): FieldVersioningEngine {
    if (!FieldVersioningEngine.instance) {
      FieldVersioningEngine.instance = new FieldVersioningEngine();
    }
    return FieldVersioningEngine.instance;
  }

  /**
   * Initialize the versioning engine
   */
  public async initialize(settings?: Partial<VersioningSettings>): Promise<void> {
    if (this.isInitialized) return;
    
    if (settings) {
      this.settings = { ...this.settings, ...settings };
    }
    
    // Load existing versions and branches from storage
    await this.loadFromStorage();
    
    this.isInitialized = true;
  }

  /**
   * Create a new field version
   */
  public createVersion(
    fieldId: string,
    configuration: FieldConfiguration,
    options: {
      name: string;
      description?: string;
      createdBy: string;
      isDraft?: boolean;
      branchName?: string;
      parentVersionId?: string;
    }
  ): FieldVersion {
    const versions = this.getFieldVersions(fieldId);
    const nextVersion = this.getNextVersionNumber(versions);
    
    const newVersion: FieldVersion = {
      id: this.generateVersionId(),
      fieldId,
      version: nextVersion,
      name: options.name,
      description: options.description,
      configuration,
      createdBy: options.createdBy,
      createdAt: new Date(),
      tags: [],
      isDraft: options.isDraft || false,
      isArchived: false,
      parentVersionId: options.parentVersionId,
      branchName: options.branchName
    };

    // Add to versions map
    if (!this.versions.has(fieldId)) {
      this.versions.set(fieldId, []);
    }
    this.versions.get(fieldId)!.push(newVersion);
    
    // Apply retention policy
    this.applyRetentionPolicy(fieldId);
    
    // Save to storage
    this.saveToStorage();
    
    return newVersion;
  }

  /**
   * Get field versions with query options
   */
  public getFieldVersions(fieldId: string, query?: VersionHistoryQuery): FieldVersion[] {
    let versions = this.versions.get(fieldId) || [];
    
    if (!query) return versions;

    // Apply filters
    if (query.branchName) {
      versions = versions.filter(v => v.branchName === query.branchName);
    }
    
    if (!query.includeDrafts) {
      versions = versions.filter(v => !v.isDraft);
    }
    
    if (!query.includeArchived) {
      versions = versions.filter(v => !v.isArchived);
    }
    
    // Apply sorting
    versions.sort((a, b) => {
      const sortField = query.sortBy || 'version';
      const sortOrder = query.sortOrder || 'desc';
      
      let comparison = 0;
      switch (sortField) {
        case 'version':
          comparison = a.version - b.version;
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    // Apply pagination
    if (query.limit || query.offset) {
      const start = query.offset || 0;
      const end = query.limit ? start + query.limit : versions.length;
      versions = versions.slice(start, end);
    }
    
    return versions;
  }

  /**
   * Get a specific field version
   */
  public getFieldVersion(fieldId: string, version: number): FieldVersion | undefined {
    const versions = this.versions.get(fieldId) || [];
    return versions.find(v => v.version === version);
  }

  /**
   * Compare two field versions
   */
  public compareVersions(
    fieldId: string,
    baseVersion: number,
    targetVersion: number
  ): VersionComparison {
    const base = this.getFieldVersion(fieldId, baseVersion);
    const target = this.getFieldVersion(fieldId, targetVersion);
    
    if (!base || !target) {
      throw new Error('Version not found');
    }
    
    const differences = this.calculateDifferences(base.configuration, target.configuration);
    const summary = this.calculateDifferenceSummary(differences);
    
    return {
      fieldId,
      baseVersion,
      targetVersion,
      differences,
      summary
    };
  }

  /**
   * Restore a field version
   */
  public restoreVersion(
    fieldId: string,
    version: number,
    options: VersionRestoreOptions = {}
  ): FieldVersion | null {
    const targetVersion = this.getFieldVersion(fieldId, version);
    
    if (!targetVersion) {
      return null;
    }
    
    if (options.createNewVersion) {
      // Create a new version based on the restored configuration
      return this.createVersion(fieldId, targetVersion.configuration, {
        name: `Restored from v${version}`,
        description: `Restored from version ${version}`,
        createdBy: 'system',
        isDraft: options.restoreAsDraft
      });
    } else {
      // Update the existing version
      const versions = this.versions.get(fieldId) || [];
      const versionIndex = versions.findIndex(v => v.version === version);
      
      if (versionIndex !== -1) {
        versions[versionIndex] = {
          ...targetVersion,
          isDraft: options.restoreAsDraft || false,
          createdAt: new Date()
        };
        
        this.saveToStorage();
        return versions[versionIndex];
      }
    }
    
    return null;
  }

  /**
   * Archive a field version
   */
  public archiveVersion(fieldId: string, version: number): boolean {
    const versions = this.versions.get(fieldId) || [];
    const versionIndex = versions.findIndex(v => v.version === version);
    
    if (versionIndex !== -1) {
      versions[versionIndex] = {
        ...versions[versionIndex],
        isArchived: true
      };
      
      this.saveToStorage();
      return true;
    }
    
    return false;
  }

  /**
   * Delete a field version
   */
  public deleteVersion(fieldId: string, version: number): boolean {
    const versions = this.versions.get(fieldId) || [];
    const versionIndex = versions.findIndex(v => v.version === version);
    
    if (versionIndex !== -1) {
      versions.splice(versionIndex, 1);
      this.saveToStorage();
      return true;
    }
    
    return false;
  }

  /**
   * Create a new branch
   */
  public createBranch(
    fieldId: string,
    name: string,
    options: {
      description?: string;
      createdBy: string;
      isDefault?: boolean;
      parentBranchId?: string;
    }
  ): VersionBranch {
    const newBranch: VersionBranch = {
      id: this.generateBranchId(),
      name,
      fieldId,
      description: options.description,
      createdAt: new Date(),
      createdBy: options.createdBy,
      isDefault: options.isDefault || false,
      parentBranchId: options.parentBranchId
    };
    
    if (!this.branches.has(fieldId)) {
      this.branches.set(fieldId, []);
    }
    
    const fieldBranches = this.branches.get(fieldId)!;
    
    // If this is the default branch, unset the current default
    if (options.isDefault) {
      fieldBranches.forEach(branch => {
        if (branch.isDefault) {
          branch.isDefault = false;
        }
      });
    }
    
    fieldBranches.push(newBranch);
    this.saveToStorage();
    
    return newBranch;
  }

  /**
   * Get branches for a field
   */
  public getBranches(fieldId: string): VersionBranch[] {
    return this.branches.get(fieldId) || [];
  }

  /**
   * Export field versions
   */
  public exportVersions(fieldId: string): VersionExportData {
    const versions = this.getFieldVersions(fieldId);
    const branches = this.getBranches(fieldId);
    
    return {
      fieldId,
      versions,
      branches,
      metadata: {
        exportDate: new Date(),
        exportBy: 'system',
        formatVersion: '1.0'
      }
    };
  }

  /**
   * Import field versions
   */
  public async importVersions(
    data: VersionExportData,
    options: VersionImportOptions
  ): Promise<{ success: boolean; conflicts?: VersionConflict[] }> {
    try {
      // Validate import data
      if (!data.fieldId || !data.versions || !data.branches) {
        throw new Error('Invalid import data');
      }
      
      // Check for conflicts
      const conflicts = this.checkImportConflicts(data, options);
      
      if (conflicts.length > 0 && options.mergeStrategy === 'skip') {
        return { success: false, conflicts };
      }
      
      // Apply import based on strategy
      switch (options.mergeStrategy) {
        case 'replace':
          this.versions.set(data.fieldId, data.versions);
          this.branches.set(data.fieldId, data.branches);
          break;
          
        case 'merge':
          // Merge versions and branches
          this.mergeVersions(data.fieldId, data.versions);
          this.mergeBranches(data.fieldId, data.branches);
          break;
          
        case 'skip':
          // Already handled above
          break;
      }
      
      this.saveToStorage();
      
      return { success: true, conflicts };
    } catch (error) {
      console.error('Failed to import versions:', error);
      return { success: false };
    }
  }

  /**
   * Get versioning settings
   */
  public getSettings(): VersioningSettings {
    return { ...this.settings };
  }

  /**
   * Update versioning settings
   */
  public updateSettings(settings: Partial<VersioningSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.saveSettings();
  }

  // Private helper methods

  private getDefaultSettings(): VersioningSettings {
    return {
      autoSaveDrafts: true,
      draftAutoSaveInterval: 30000, // 30 seconds
      maxVersionsPerField: 50,
      defaultBranchName: 'main',
      enableBranching: true,
      enableAutoMerge: true,
      retentionPolicy: {
        keepVersions: 20,
        archiveAfter: 90, // 90 days
        deleteAfter: 365 // 1 year
      }
    };
  }

  private generateVersionId(): string {
    return `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBranchId(): string {
    return `branch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getNextVersionNumber(versions: FieldVersion[]): number {
    if (versions.length === 0) return 1;
    
    const maxVersion = Math.max(...versions.map(v => v.version));
    return maxVersion + 1;
  }

  private applyRetentionPolicy(fieldId: string): void {
    const versions = this.versions.get(fieldId) || [];
    
    // Sort by version number (descending)
    versions.sort((a, b) => b.version - a.version);
    
    // Keep only the configured number of versions
    if (versions.length > this.settings.maxVersionsPerField) {
      const versionsToDelete = versions.slice(this.settings.maxVersionsPerField);
      
      versionsToDelete.forEach(version => {
        this.deleteVersion(fieldId, version.version);
      });
    }
  }

  private calculateDifferences(obj1: any, obj2: any, path: string = ''): any[] {
    const differences: any[] = [];
    
    // Handle primitive types
    if (obj1 !== obj2) {
      if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
        differences.push({
          path,
          type: 'modified',
          oldValue: obj1,
          newValue: obj2,
          description: `Value changed from ${obj1} to ${obj2}`
        });
        return differences;
      }
    }
    
    // Handle objects
    if (typeof obj1 === 'object' && typeof obj2 === 'object' && obj1 !== null && obj2 !== null) {
      const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);
      
      for (const key of allKeys) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (!(key in obj1)) {
          differences.push({
            path: currentPath,
            type: 'added',
            newValue: obj2[key],
            description: `Property ${key} added with value ${JSON.stringify(obj2[key])}`
          });
        } else if (!(key in obj2)) {
          differences.push({
            path: currentPath,
            type: 'removed',
            oldValue: obj1[key],
            description: `Property ${key} removed with value ${JSON.stringify(obj1[key])}`
          });
        } else {
          differences.push(...this.calculateDifferences(obj1[key], obj2[key], currentPath));
        }
      }
    }
    
    return differences;
  }

  private calculateDifferenceSummary(differences: any[]): { added: number; modified: number; removed: number } {
    return differences.reduce((summary, diff) => {
      switch (diff.type) {
        case 'added':
          summary.added++;
          break;
        case 'modified':
          summary.modified++;
          break;
        case 'removed':
          summary.removed++;
          break;
      }
      return summary;
    }, { added: 0, modified: 0, removed: 0 });
  }

  private checkImportConflicts(data: VersionExportData, options: VersionImportOptions): VersionConflict[] {
    const conflicts: VersionConflict[] = [];
    
    // Check for version conflicts
    const existingVersions = this.versions.get(data.fieldId) || [];
    const importedVersions = data.versions;
    
    importedVersions.forEach(importedVersion => {
      const existingVersion = existingVersions.find(v => v.version === importedVersion.version);
      
      if (existingVersion) {
        conflicts.push({
          fieldId: data.fieldId,
          version: importedVersion.version,
          conflictType: 'duplicate_version',
          description: `Version ${importedVersion.version} already exists`,
          resolutionOptions: ['skip', 'overwrite', 'rename']
        });
      }
    });
    
    return conflicts;
  }

  private mergeVersions(fieldId: string, importedVersions: FieldVersion[]): void {
    const existingVersions = this.versions.get(fieldId) || [];
    
    importedVersions.forEach(importedVersion => {
      const existingIndex = existingVersions.findIndex(v => v.version === importedVersion.version);
      
      if (existingIndex !== -1) {
        // Update existing version
        existingVersions[existingIndex] = importedVersion;
      } else {
        // Add new version
        existingVersions.push(importedVersion);
      }
    });
    
    this.versions.set(fieldId, existingVersions);
  }

  private mergeBranches(fieldId: string, importedBranches: VersionBranch[]): void {
    const existingBranches = this.branches.get(fieldId) || [];
    
    importedBranches.forEach(importedBranch => {
      const existingIndex = existingBranches.findIndex(b => b.id === importedBranch.id);
      
      if (existingIndex !== -1) {
        // Update existing branch
        existingBranches[existingIndex] = importedBranch;
      } else {
        // Add new branch
        existingBranches.push(importedBranch);
      }
    });
    
    this.branches.set(fieldId, existingBranches);
  }

  private async loadFromStorage(): Promise<void> {
    try {
      // In a real implementation, this would load from localStorage, IndexedDB, or a backend API
      const storedVersions = localStorage.getItem('field_versions');
      const storedBranches = localStorage.getItem('field_branches');
      const storedSettings = localStorage.getItem('versioning_settings');
      
      if (storedVersions) {
        this.versions = new Map(JSON.parse(storedVersions));
      }
      
      if (storedBranches) {
        this.branches = new Map(JSON.parse(storedBranches));
      }
      
      if (storedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(storedSettings) };
      }
    } catch (error) {
      console.warn('Failed to load versioning data from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      // In a real implementation, this would save to localStorage, IndexedDB, or a backend API
      localStorage.setItem('field_versions', JSON.stringify(Array.from(this.versions.entries())));
      localStorage.setItem('field_branches', JSON.stringify(Array.from(this.branches.entries())));
    } catch (error) {
      console.warn('Failed to save versioning data to storage:', error);
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('versioning_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save versioning settings:', error);
    }
  }
}

export default FieldVersioningEngine;