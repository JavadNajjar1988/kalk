import { 
  FieldDependency, 
  DependencyType, 
  DependencyCondition, 
  DependencyAction,
  ConditionOperator,
  ActionType,
  DependencyContext,
  DependencyResult,
  DependencyPatterns
} from './types';

/**
 * Core Field Dependency Management System
 * Handles all field dependency logic, condition evaluation, and action execution
 */
export class DependencyManager {
  private static instance: DependencyManager;
  private dependencies: Map<string, FieldDependency[]> = new Map();
  private fieldCache: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): DependencyManager {
    if (!DependencyManager.instance) {
      DependencyManager.instance = new DependencyManager();
    }
    return DependencyManager.instance;
  }

  /**
   * Register a new field dependency
   */
  public addDependency(dependency: FieldDependency): void {
    const targetDeps = this.dependencies.get(dependency.targetFieldId) || [];
    
    // Remove existing dependency with same ID
    const filteredDeps = targetDeps.filter(dep => dep.id !== dependency.id);
    filteredDeps.push(dependency);
    
    // Sort by priority (higher priority executes first)
    filteredDeps.sort((a, b) => b.priority - a.priority);
    
    this.dependencies.set(dependency.targetFieldId, filteredDeps);
  }

  /**
   * Remove a field dependency
   */
  public removeDependency(dependencyId: string, targetFieldId: string): void {
    const targetDeps = this.dependencies.get(targetFieldId) || [];
    const filteredDeps = targetDeps.filter(dep => dep.id !== dependencyId);
    
    if (filteredDeps.length === 0) {
      this.dependencies.delete(targetFieldId);
    } else {
      this.dependencies.set(targetFieldId, filteredDeps);
    }
  }

  /**
   * Get all dependencies for a target field
   */
  public getDependencies(targetFieldId: string): FieldDependency[] {
    return this.dependencies.get(targetFieldId) || [];
  }

  /**
   * Evaluate all dependencies for a specific field
   */
  public async evaluateDependencies(
    targetFieldId: string, 
    context: DependencyContext
  ): Promise<DependencyResult[]> {
    const deps = this.getDependencies(targetFieldId);
    const results: DependencyResult[] = [];

    for (const dep of deps) {
      if (!dep.enabled) continue;

      try {
        const conditionMet = await this.evaluateCondition(dep.condition, context);
        const result = await this.executeAction(dep.action, conditionMet, context);
        
        results.push({
          dependencyId: dep.id,
          dependency: dep,
          matched: conditionMet,
          conditionMet,
          actionExecuted: result.executed,
          action: dep.action,
          targetFieldId: dep.targetFieldId,
          newValue: result.value,
          context,
          error: result.error
        });
      } catch (error) {
        results.push({
          dependencyId: dep.id,
          dependency: dep,
          matched: false,
          conditionMet: false,
          actionExecuted: false,
          action: dep.action,
          targetFieldId: dep.targetFieldId,
          context,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Evaluate a dependency condition
   */
  private async evaluateCondition(
    condition: DependencyCondition, 
    context: DependencyContext
  ): Promise<boolean> {
    const sourceValue = context.fieldValues[condition.sourceFieldId];
    const targetValue = condition.targetValue || condition.value;

    switch (condition.operator) {
      case ConditionOperator.EQUALS:
        return sourceValue === targetValue;
      
      case ConditionOperator.NOT_EQUALS:
        return sourceValue !== targetValue;
      
      case ConditionOperator.CONTAINS:
        return String(sourceValue || '').toLowerCase().includes(String(targetValue || '').toLowerCase());
      
      case ConditionOperator.NOT_CONTAINS:
        return !String(sourceValue || '').toLowerCase().includes(String(targetValue || '').toLowerCase());
      
      case ConditionOperator.STARTS_WITH:
        return String(sourceValue || '').toLowerCase().startsWith(String(targetValue || '').toLowerCase());
      
      case ConditionOperator.ENDS_WITH:
        return String(sourceValue || '').toLowerCase().endsWith(String(targetValue || '').toLowerCase());
      
      case ConditionOperator.IS_EMPTY:
        return !sourceValue || sourceValue === '';
      
      case ConditionOperator.IS_NOT_EMPTY:
        return sourceValue && sourceValue !== '';
      
      case ConditionOperator.GREATER_THAN:
        return Number(sourceValue || 0) > Number(targetValue || 0);
      
      case ConditionOperator.LESS_THAN:
        return Number(sourceValue || 0) < Number(targetValue || 0);
      
      case ConditionOperator.GREATER_EQUAL:
        return Number(sourceValue || 0) >= Number(targetValue || 0);
      
      case ConditionOperator.LESS_EQUAL:
        return Number(sourceValue || 0) <= Number(targetValue || 0);
      
      case ConditionOperator.MATCHES_PATTERN:
        try {
          const regex = new RegExp(String(targetValue || ''));
          return regex.test(String(sourceValue || ''));
        } catch {
          return false;
        }
      
      case ConditionOperator.IN:
      case ConditionOperator.IN_LIST:
        const list = condition.values || (Array.isArray(targetValue) ? targetValue : String(targetValue || '').split(','));
        return list.includes(sourceValue);
      
      case ConditionOperator.NOT_IN:
      case ConditionOperator.NOT_IN_LIST:
        const notList = condition.values || (Array.isArray(targetValue) ? targetValue : String(targetValue || '').split(','));
        return !notList.includes(sourceValue);
      
      default:
        return false;
    }
  }

  /**
   * Execute a dependency action
   */
  private async executeAction(
    action: DependencyAction, 
    conditionMet: boolean, 
    context: DependencyContext
  ): Promise<{ executed: boolean; value?: any; error?: string }> {
    // If condition is not met and action should only execute when condition is true
    if (!conditionMet && !action.executeWhenConditionFalse) {
      return { executed: false };
    }

    // If condition is met and action should only execute when condition is false
    if (conditionMet && action.executeWhenConditionFalse) {
      return { executed: false };
    }

    try {
      switch (action.type) {
        case ActionType.SHOW:
        case ActionType.SHOW_FIELD:
          return { executed: true, value: true };
        
        case ActionType.HIDE:
        case ActionType.HIDE_FIELD:
          return { executed: true, value: false };
        
        case ActionType.EDITABLE:
        case ActionType.ENABLE_FIELD:
          return { executed: true, value: false };
        
        case ActionType.READONLY:
        case ActionType.DISABLE_FIELD:
          return { executed: true, value: true };
        
        case ActionType.REQUIRE:
        case ActionType.MAKE_REQUIRED:
          return { executed: true, value: true };
        
        case ActionType.OPTIONAL:
        case ActionType.MAKE_OPTIONAL:
          return { executed: true, value: false };
        
        case ActionType.SET_VALUE:
          return { executed: true, value: action.value || action.config?.value };
        
        case ActionType.CLEAR_VALUE:
          return { executed: true, value: '' };
        
        case ActionType.SET_OPTIONS:
          return { executed: true, value: action.value || action.config?.options };
        
        case ActionType.FILTER_OPTIONS:
          // Implement option filtering logic
          const currentOptions = action.value || action.config?.options || [];
          const filteredOptions = currentOptions.filter((option: any) => {
            // Add filtering logic based on source field value
            return true;
          });
          return { executed: true, value: filteredOptions };
        
        case ActionType.ENABLE_VALIDATION:
        case ActionType.ADD_VALIDATION:
          return { executed: true, value: action.value || action.config?.validationRules };
        
        case ActionType.DISABLE_VALIDATION:
        case ActionType.REMOVE_VALIDATION:
          return { executed: true, value: null };
        
        case ActionType.EXECUTE_CUSTOM:
          if (action.customFunction) {
            const result = await action.customFunction(context);
            return { executed: true, value: result };
          }
          return { executed: false, error: 'No custom function provided' };
        
        default:
          return { executed: false, error: `Unknown action type: ${action.type}` };
      }
    } catch (error) {
      return { 
        executed: false, 
        error: error instanceof Error ? error.message : 'Action execution failed' 
      };
    }
  }

  /**
   * Create dependency from built-in pattern
   */
  public createFromPattern(
    pattern: keyof typeof DependencyPatterns,
    sourceFieldId: string,
    targetFieldId: string,
    customConfig?: Partial<FieldDependency>
  ): FieldDependency {
    const patternConfig = DependencyPatterns[pattern];
    
    return {
      id: `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceFieldId,
      targetFieldId,
      type: patternConfig.type,
      condition: {
        ...patternConfig.condition,
        sourceFieldId
      },
      action: patternConfig.action,
      enabled: true,
      priority: patternConfig.priority || 100,
      description: `${pattern} dependency from ${sourceFieldId} to ${targetFieldId}`,
      ...customConfig
    };
  }

  /**
   * Batch evaluate multiple fields
   */
  public async evaluateMultiple(
    fieldIds: string[], 
    context: DependencyContext
  ): Promise<Map<string, DependencyResult[]>> {
    const results = new Map<string, DependencyResult[]>();
    
    for (const fieldId of fieldIds) {
      const fieldResults = await this.evaluateDependencies(fieldId, context);
      if (fieldResults.length > 0) {
        results.set(fieldId, fieldResults);
      }
    }
    
    return results;
  }

  /**
   * Clear all dependencies
   */
  public clearAllDependencies(): void {
    this.dependencies.clear();
    this.fieldCache.clear();
  }

  /**
   * Get dependency statistics
   */
  public getStatistics(): {
    totalDependencies: number;
    dependenciesByType: Record<DependencyType, number>;
    fieldsCovered: number;
  } {
    let totalDependencies = 0;
    const dependenciesByType: Record<DependencyType, number> = {
      [DependencyType.VISIBILITY]: 0,
      [DependencyType.REQUIRED]: 0,
      [DependencyType.VALUE]: 0,
      [DependencyType.OPTIONS]: 0,
      [DependencyType.VALIDATION]: 0,
      [DependencyType.READONLY]: 0
    };

    this.dependencies.forEach(deps => {
      totalDependencies += deps.length;
      deps.forEach(dep => {
        dependenciesByType[dep.type]++;
      });
    });

    return {
      totalDependencies,
      dependenciesByType,
      fieldsCovered: this.dependencies.size
    };
  }
}

export default DependencyManager;