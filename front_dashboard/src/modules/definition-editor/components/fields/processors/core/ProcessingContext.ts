// Processing Context Types and Interfaces
// انواع و رابط‌های زمینه پردازش

import { ExtendedCustomFieldDefinition } from '../../types/FieldEditTypes';

/**
 * Processing context interface
 * رابط زمینه پردازش
 */
export interface ProcessingContext {
  field: ExtendedCustomFieldDefinition;
  currentValue: string;
  previousValue?: string;
  formData?: Record<string, any>;
  metadata?: ProcessingMetadata;
}

/**
 * Processing metadata
 * متادیتای پردازش
 */
export interface ProcessingMetadata {
  timestamp: number;
  source: 'user_input' | 'programmatic' | 'suggestion';
  processingSteps: ProcessingStep[];
  errors: ProcessingError[];
  warnings: ProcessingWarning[];
}

/**
 * Processing step record
 * رکورد مرحله پردازش
 */
export interface ProcessingStep {
  processorName: string;
  inputValue: string;
  outputValue: string;
  duration: number;
  applied: boolean;
  metadata?: Record<string, any>;
}

/**
 * Processing error
 * خطای پردازش
 */
export interface ProcessingError {
  code: string;
  message: string;
  processorName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recovery?: string;
}

/**
 * Processing warning
 * هشدار پردازش
 */
export interface ProcessingWarning {
  code: string;
  message: string;
  processorName: string;
  suggestion?: string;
}

/**
 * Processing result
 * نتیجه پردازش
 */
export interface ProcessingResult {
  value: string;
  isValid: boolean;
  hasChanges: boolean;
  context: ProcessingContext;
  suggestions?: string[];
  validationErrors?: string[];
}

/**
 * Processor interface
 * رابط پردازشگر
 */
export interface IFieldProcessor {
  name: string;
  priority: number;
  enabled: boolean;
  process(context: ProcessingContext): Promise<ProcessingResult> | ProcessingResult;
  canProcess(context: ProcessingContext): boolean;
  validate?(context: ProcessingContext): boolean;
  cleanup?(): void;
}

/**
 * Processor configuration
 * پیکربندی پردازشگر
 */
export interface ProcessorConfig {
  enabled: boolean;
  priority: number;
  options?: Record<string, any>;
  conditions?: ProcessorCondition[];
}

/**
 * Processor condition
 * شرط پردازشگر
 */
export interface ProcessorCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'exists' | 'not_exists';
  value: any;
}

/**
 * Processing options
 * گزینه‌های پردازش
 */
export interface ProcessingOptions {
  skipValidation?: boolean;
  skipTransformation?: boolean;
  skipSuggestions?: boolean;
  skipSecurity?: boolean;
  enableDebug?: boolean;
  timeout?: number;
  maxRetries?: number;
}

/**
 * Create processing context
 * ایجاد زمینه پردازش
 */
export function createProcessingContext(
  field: ExtendedCustomFieldDefinition,
  currentValue: string,
  previousValue?: string,
  formData?: Record<string, any>
): ProcessingContext {
  return {
    field,
    currentValue,
    previousValue,
    formData,
    metadata: {
      timestamp: Date.now(),
      source: 'user_input',
      processingSteps: [],
      errors: [],
      warnings: []
    }
  };
}

/**
 * Update processing context
 * به‌روزرسانی زمینه پردازش
 */
export function updateProcessingContext(
  context: ProcessingContext,
  newValue: string,
  step: ProcessingStep
): ProcessingContext {
  return {
    ...context,
    currentValue: newValue,
    previousValue: context.currentValue,
    metadata: {
      ...context.metadata!,
      processingSteps: [...context.metadata!.processingSteps, step]
    }
  };
}

/**
 * Add processing error
 * اضافه کردن خطای پردازش
 */
export function addProcessingError(
  context: ProcessingContext,
  error: Omit<ProcessingError, 'processorName'>,
  processorName: string
): ProcessingContext {
  return {
    ...context,
    metadata: {
      ...context.metadata!,
      errors: [...context.metadata!.errors, { ...error, processorName }]
    }
  };
}

/**
 * Add processing warning
 * اضافه کردن هشدار پردازش
 */
export function addProcessingWarning(
  context: ProcessingContext,
  warning: Omit<ProcessingWarning, 'processorName'>,
  processorName: string
): ProcessingContext {
  return {
    ...context,
    metadata: {
      ...context.metadata!,
      warnings: [...context.metadata!.warnings, { ...warning, processorName }]
    }
  };
}