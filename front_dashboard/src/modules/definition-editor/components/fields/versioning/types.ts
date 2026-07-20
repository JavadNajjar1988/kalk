// Field Versioning System - Types and Interfaces

export interface FieldVersion {
  id: string;
  fieldId: string;
  version: number;
  name: string;
  description?: string;
  configuration: FieldConfiguration;
  createdBy: string;
  createdAt: Date;
  tags: string[];
  isDraft: boolean;
  isArchived: boolean;
  parentVersionId?: string;
  branchName?: string;
}

export interface FieldConfiguration {
  // Basic field properties
  type: string;
  label: string;
  placeholder?: string;
  description?: string;
  defaultValue?: any;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  hidden?: boolean;
  
  // Validation rules
  validation?: FieldValidation[];
  
  // Styling and appearance
  className?: string;
  style?: Record<string, any>;
  size?: 'small' | 'medium' | 'large';
  variant?: string;
  
  // Behavior properties
  caseTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  trimExtraSpaces?: boolean;
  characterControl?: {
    allowPersian?: boolean;
    allowEnglish?: boolean;
    allowNumbers?: boolean;
    allowSpecialChars?: boolean;
    maxLength?: number;
    minLength?: number;
  };
  
  // Dependencies
  dependencies?: FieldDependency[];
  
  // Options for select fields
  options?: FieldOption[];
  
  // Custom properties
  customProperties?: Record<string, any>;
  
  // Metadata
  metadata?: Record<string, any>;
}

export interface FieldValidation {
  id: string;
  type: string;
  rule: string;
  message: string;
  enabled: boolean;
  priority: number;
  customValidator?: (value: any) => boolean | Promise<boolean>;
}

export interface FieldDependency {
  id: string;
  sourceFieldId: string;
  targetFieldId: string;
  type: 'visibility' | 'required' | 'value' | 'options' | 'validation' | 'readonly';
  condition: {
    operator: string;
    value: any;
  };
  action: {
    type: string;
    value?: any;
  };
  enabled: boolean;
  priority: number;
}

export interface FieldOption {
  value: any;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface VersionBranch {
  id: string;
  name: string;
  fieldId: string;
  description?: string;
  createdAt: Date;
  createdBy: string;
  isDefault: boolean;
  parentBranchId?: string;
}

export interface VersionComparison {
  fieldId: string;
  baseVersion: number;
  targetVersion: number;
  differences: FieldDifference[];
  summary: {
    added: number;
    modified: number;
    removed: number;
  };
}

export interface FieldDifference {
  path: string;
  type: 'added' | 'modified' | 'removed';
  oldValue?: any;
  newValue?: any;
  description: string;
}

export interface VersionHistoryQuery {
  fieldId: string;
  branchName?: string;
  limit?: number;
  offset?: number;
  includeDrafts?: boolean;
  includeArchived?: boolean;
  sortBy?: 'version' | 'createdAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface VersionRestoreOptions {
  createNewVersion?: boolean;
  restoreAsDraft?: boolean;
  mergeWithCurrent?: boolean;
  preserveHistory?: boolean;
}

export interface VersionExportData {
  fieldId: string;
  versions: FieldVersion[];
  branches: VersionBranch[];
  metadata: {
    exportDate: Date;
    exportBy: string;
    formatVersion: string;
  };
}

export interface VersionImportOptions {
  mergeStrategy: 'replace' | 'merge' | 'skip';
  createNewField?: boolean;
  preserveIds?: boolean;
  preserveHistory?: boolean;
}

export interface VersionConflict {
  fieldId: string;
  version: number;
  conflictType: 'duplicate_version' | 'missing_parent' | 'branch_conflict';
  description: string;
  resolutionOptions: string[];
}

export interface VersioningSettings {
  autoSaveDrafts: boolean;
  draftAutoSaveInterval: number;
  maxVersionsPerField: number;
  defaultBranchName: string;
  enableBranching: boolean;
  enableAutoMerge: boolean;
  retentionPolicy: {
    keepVersions: number;
    archiveAfter: number; // days
    deleteAfter: number; // days
  };
}