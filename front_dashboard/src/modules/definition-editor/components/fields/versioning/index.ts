// Field Versioning System - Main Exports

// Core Components
export { default as FieldVersioningPanel } from './FieldVersioningPanel';

// Core Engine
export { default as FieldVersioningEngine } from './FieldVersioningEngine';

// React Hooks
export { default as useFieldVersioning } from './useFieldVersioning';

// Types and Interfaces
export type {
  FieldVersion,
  FieldConfiguration,
  FieldValidation,
  FieldDependency,
  FieldOption,
  VersionBranch,
  VersionComparison,
  FieldDifference,
  VersionHistoryQuery,
  VersionRestoreOptions,
  VersionExportData,
  VersionImportOptions,
  VersionConflict,
  VersioningSettings
} from './types';

// Usage Examples and Documentation

/**
 * Basic Usage Example:
 * 
 * 1. Simple Versioning Panel:
 * ```tsx
 * import { FieldVersioningPanel } from './versioning';
 * 
 * const FieldEditor = ({ fieldId, fieldName }) => {
 *   return (
 *     <FieldVersioningPanel
 *       fieldId={fieldId}
 *       fieldName={fieldName}
 *       onVersionRestore={(version) => {
 *         console.log('Restored version:', version);
 *         // Update field configuration with restored version
 *       }}
 *       onVersionCompare={(comparison) => {
 *         console.log('Version comparison:', comparison);
 *         // Show comparison results
 *       }}
 *     />
 *   );
 * };
 * ```
 * 
 * 2. Using Versioning Hook:
 * ```tsx
 * import { useFieldVersioning } from './versioning';
 * 
 * const VersionManager = ({ fieldId }) => {
 *   const {
 *     versions,
 *     branches,
 *     isLoading,
 *     error,
 *     createVersion,
 *     getVersionHistory,
 *     compareVersions,
 *     restoreVersion
 *   } = useFieldVersioning();
 * 
 *   useEffect(() => {
 *     getVersionHistory(fieldId);
 *   }, [fieldId, getVersionHistory]);
 * 
 *   const handleCreateVersion = async () => {
 *     const newVersion = await createVersion(fieldId, {
 *       type: 'text',
 *       label: 'Email Address',
 *       required: true,
 *       validation: [{
 *         id: 'email-validation',
 *         type: 'pattern',
 *         rule: 'email',
 *         message: 'Please enter a valid email',
 *         enabled: true,
 *         priority: 1
 *       }]
 *     }, {
 *       name: 'Initial Version',
 *       description: 'First version of email field',
 *       createdBy: 'admin'
 *     });
 *     
 *     console.log('Created version:', newVersion);
 *   };
 * 
 *   const handleCompare = async () => {
 *     const comparison = await compareVersions(fieldId, 1, 2);
 *     console.log('Comparison result:', comparison);
 *   };
 * 
 *   if (isLoading) return <div>Loading versions...</div>;
 *   if (error) return <div>Error: {error}</div>;
 * 
 *   return (
 *     <div>
 *       <h3>Field Versions</h3>
 *       <button onClick={handleCreateVersion}>Create Version</button>
 *       <button onClick={handleCompare}>Compare v1 and v2</button>
 *       
 *       <ul>
 *         {versions.map(version => (
 *           <li key={version.id}>
 *             v{version.version} - {version.name}
 *             <button onClick={() => restoreVersion(fieldId, version.version)}>
 *               Restore
 *             </button>
 *           </li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * };
 * ```
 * 
 * 3. Advanced Versioning Engine Usage:
 * ```tsx
 * import { FieldVersioningEngine } from './versioning';
 * 
 * const engine = FieldVersioningEngine.getInstance();
 * 
 * // Initialize with custom settings
 * await engine.initialize({
 *   maxVersionsPerField: 100,
 *   defaultBranchName: 'development',
 *   retentionPolicy: {
 *     keepVersions: 50,
 *     archiveAfter: 180, // 6 months
 *     deleteAfter: 730  // 2 years
 *   }
 * });
 * 
 * // Create versions with branching
 * const mainVersion = engine.createVersion('email-field', {
 *   type: 'email',
 *   label: 'Email Address',
 *   required: true
 * }, {
 *   name: 'Production Release',
 *   description: 'Stable production version',
 *   createdBy: 'admin',
 *   branchName: 'main'
 * });
 * 
 * const devVersion = engine.createVersion('email-field', {
 *   type: 'email',
 *   label: 'Email Address',
 *   required: true,
 *   validation: [{
 *     id: 'enhanced-validation',
 *     type: 'custom',
 *     rule: 'enhanced-email',
 *     message: 'Enhanced email validation',
 *     enabled: true,
 *     priority: 1
 *   }]
 * }, {
 *   name: 'Development Build',
 *   description: 'Enhanced validation rules',
 *   createdBy: 'developer',
 *   branchName: 'development',
 *   parentVersionId: mainVersion.id
 * });
 * 
 * // Compare versions
 * const comparison = engine.compareVersions('email-field', 1, 2);
 * console.log('Added properties:', comparison.summary.added);
 * console.log('Modified properties:', comparison.summary.modified);
 * console.log('Removed properties:', comparison.summary.removed);
 * 
 * // Export versions
 * const exportData = engine.exportVersions('email-field');
 * 
 * // Import versions with merge strategy
 * const importResult = await engine.importVersions(exportData, {
 *   mergeStrategy: 'merge',
 *   preserveHistory: true
 * });
 * 
 * // Get version history with query
 * const history = engine.getFieldVersions('email-field', {
 *   branchName: 'main',
 *   includeDrafts: false,
 *   sortBy: 'createdAt',
 *   sortOrder: 'desc',
 *   limit: 10
 * });
 * ```
 * 
 * Features:
 * - Complete version history tracking
 * - Branching and merging support
 * - Version comparison with detailed diffs
 * - Restore and rollback capabilities
 * - Archive and delete version management
 * - Export/import functionality (JSON)
 * - Configurable retention policies
 * - Auto-save draft versions
 * - Glassmorphism UI design
 * - Responsive layout for all devices
 * - Type-safe versioning operations
 * - Non-intrusive integration with existing field systems
 * - Performance optimized with React best practices
 */