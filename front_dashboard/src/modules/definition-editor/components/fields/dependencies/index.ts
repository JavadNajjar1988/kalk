// Field Dependency Management System - Main Exports

// Core Classes
export { default as DependencyManager } from './DependencyManager';

// React Components
export { default as DependencyConfigPanel } from './DependencyConfigPanel';

// React Hooks
export { default as useFieldDependencies } from './useFieldDependencies';

// Types and Interfaces
export type {
  FieldDependency,
  DependencyType,
  DependencyCondition,
  DependencyAction,
  DependencyContext,
  DependencyResult,
  DependencyEvaluationContext,
  DependencyManagerOptions,
  DependencyPattern,
  DependencyExample,
  FieldOption,
  ActionConfig
} from './types';

export {
  ConditionOperator,
  ActionType,
  ValueType,
  DependencyPatternCategory,
  DEPENDENCY_PATTERNS,
  DependencyPatterns
} from './types';

// Usage Examples and Documentation

/**
 * Basic Usage Example:
 * 
 * 1. Simple Visibility Dependency:
 * ```tsx
 * import { DependencyManager, DependencyType, ConditionOperator, ActionType } from './dependencies';
 * 
 * const manager = DependencyManager.getInstance();
 * 
 * manager.addDependency({
 *   id: 'show-address-details',
 *   sourceFieldId: 'country',
 *   targetFieldId: 'address_details',
 *   type: DependencyType.VISIBILITY,
 *   condition: {
 *     sourceFieldId: 'country',
 *     operator: ConditionOperator.EQUALS,
 *     targetValue: 'Other',
 *     value: 'Other',
 *     valueType: ValueType.STRING
 *   },
 *   action: {
 *     type: ActionType.SHOW,
 *     config: { animate: true }
 *   },
 *   enabled: true,
 *   priority: 100,
 *   description: 'Show address details when country is Other'
 * });
 * ```
 * 
 * 2. React Hook Usage:
 * ```tsx
 * import { useFieldDependencies } from './dependencies';
 * 
 * const MyForm = () => {
 *   const {
 *     fieldStates,
 *     updateFieldValue,
 *     addDependency,
 *     dependencyStats
 *   } = useFieldDependencies(
 *     { country: '', address_details: '' }, // Initial values
 *     { country: { type: 'select' }, address_details: { type: 'text' } } // Field definitions
 *   );
 * 
 *   return (
 *     <form>
 *       <select 
 *         value={fieldStates.country?.value || ''} 
 *         onChange={(e) => updateFieldValue('country', e.target.value)}
 *       >
 *         <option value="">Select Country</option>
 *         <option value="US">United States</option>
 *         <option value="Other">Other</option>
 *       </select>
 * 
 *       {fieldStates.address_details?.visible && (
 *         <input
 *           type="text"
 *           value={fieldStates.address_details?.value || ''}
 *           onChange={(e) => updateFieldValue('address_details', e.target.value)}
 *           required={fieldStates.address_details?.required}
 *           disabled={fieldStates.address_details?.readonly}
 *         />
 *       )}
 *     </form>
 *   );
 * };
 * ```
 * 
 * 3. Configuration Panel Usage:
 * ```tsx
 * import { DependencyConfigPanel } from './dependencies';
 * 
 * const FieldEditor = () => {
 *   const availableFields = [
 *     { id: 'country', label: 'Country', type: 'select' },
 *     { id: 'state', label: 'State', type: 'select' },
 *     { id: 'city', label: 'City', type: 'text' }
 *   ];
 * 
 *   return (
 *     <DependencyConfigPanel
 *       fieldId="address_details"
 *       availableFields={availableFields}
 *       onDependenciesChange={(deps) => console.log('Updated dependencies:', deps)}
 *     />
 *   );
 * };
 * ```
 */