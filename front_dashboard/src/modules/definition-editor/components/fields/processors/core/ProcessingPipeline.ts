// Processing Pipeline - Orchestrates multiple processors
// پایپ‌لاین پردازش - هماهنگ‌کننده چندین پردازشگر

import {
  ProcessingContext,
  ProcessingResult,
  ProcessingOptions,
  IFieldProcessor,
  ProcessorConfig,
  updateProcessingContext,
  addProcessingError,
  addProcessingWarning
} from './ProcessingContext';

/**
 * Processing pipeline for field value processing
 * پایپ‌لاین پردازش برای پردازش مقادیر فیلد
 */
export class ProcessingPipeline {
  private processors: Map<string, IFieldProcessor> = new Map();
  private configs: Map<string, ProcessorConfig> = new Map();
  private isEnabled: boolean = true;

  /**
   * Register a processor
   * ثبت یک پردازشگر
   */
  registerProcessor(processor: IFieldProcessor, config?: ProcessorConfig): void {
    this.processors.set(processor.name, processor);
    
    const defaultConfig: ProcessorConfig = {
      enabled: true,
      priority: processor.priority,
      options: {}
    };
    
    this.configs.set(processor.name, { ...defaultConfig, ...config });
  }

  /**
   * Unregister a processor
   * لغو ثبت یک پردازشگر
   */
  unregisterProcessor(processorName: string): boolean {
    const processor = this.processors.get(processorName);
    if (processor && processor.cleanup) {
      processor.cleanup();
    }
    
    const removed = this.processors.delete(processorName);
    this.configs.delete(processorName);
    return removed;
  }

  /**
   * Get registered processors sorted by priority
   * دریافت پردازشگرهای ثبت شده مرتب شده بر اساس اولویت
   */
  private getSortedProcessors(): IFieldProcessor[] {
    return Array.from(this.processors.values())
      .filter(processor => {
        const config = this.configs.get(processor.name);
        return config?.enabled !== false;
      })
      .sort((a, b) => {
        const configA = this.configs.get(a.name);
        const configB = this.configs.get(b.name);
        return (configA?.priority || a.priority) - (configB?.priority || b.priority);
      });
  }

  /**
   * Check if processor can process the context
   * بررسی اینکه پردازشگر می‌تواند زمینه را پردازش کند
   */
  private canProcessorHandle(processor: IFieldProcessor, context: ProcessingContext): boolean {
    try {
      const config = this.configs.get(processor.name);
      
      // Check processor conditions
      if (config?.conditions && config.conditions.length > 0) {
        const conditionsMet = config.conditions.every(condition => {
          return this.evaluateCondition(condition, context);
        });
        
        if (!conditionsMet) {
          return false;
        }
      }
      
      // Check processor's own canProcess method
      return processor.canProcess(context);
    } catch (error) {
      console.warn(`Error checking processor ${processor.name}:`, error);
      return false;
    }
  }

  /**
   * Evaluate processor condition
   * ارزیابی شرط پردازشگر
   */
  private evaluateCondition(condition: any, context: ProcessingContext): boolean {
    const fieldValue = this.getFieldValue(condition.field, context);
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'not_contains':
        return !String(fieldValue).includes(String(condition.value));
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      case 'not_exists':
        return fieldValue === undefined || fieldValue === null;
      default:
        return true;
    }
  }

  /**
   * Get field value for condition evaluation
   * دریافت مقدار فیلد برای ارزیابی شرط
   */
  private getFieldValue(fieldPath: string, context: ProcessingContext): any {
    if (fieldPath.startsWith('field.')) {
      const fieldProperty = fieldPath.substring(6);
      return (context.field as any)[fieldProperty];
    }
    
    if (fieldPath === 'currentValue') {
      return context.currentValue;
    }
    
    if (fieldPath.startsWith('formData.') && context.formData) {
      const dataProperty = fieldPath.substring(9);
      return context.formData[dataProperty];
    }
    
    return undefined;
  }

  /**
   * Process context through all applicable processors
   * پردازش زمینه از طریق تمام پردازشگرهای قابل اعمال
   */
  async processContext(
    context: ProcessingContext,
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    if (!this.isEnabled) {
      return {
        value: context.currentValue,
        isValid: true,
        hasChanges: false,
        context
      };
    }

    let currentContext = context;
    let hasChanges = false;
    const errors: string[] = [];
    const suggestions: string[] = [];

    try {
      const processors = this.getSortedProcessors();
      const startTime = Date.now();

      for (const processor of processors) {
        if (!this.canProcessorHandle(processor, currentContext)) {
          continue;
        }

        try {
          const processorStartTime = Date.now();
          const result = await this.processWithTimeout(processor, currentContext, options.timeout);
          const processorDuration = Date.now() - processorStartTime;

          if (result.value !== currentContext.currentValue) {
            hasChanges = true;
            
            currentContext = updateProcessingContext(currentContext, result.value, {
              processorName: processor.name,
              inputValue: currentContext.currentValue,
              outputValue: result.value,
              duration: processorDuration,
              applied: true
            });
          }

          // Collect suggestions
          if (result.suggestions) {
            suggestions.push(...result.suggestions);
          }

          // Collect validation errors
          if (result.validationErrors) {
            errors.push(...result.validationErrors);
          }

        } catch (error) {
          currentContext = addProcessingError(currentContext, {
            code: 'PROCESSOR_ERROR',
            message: `Processor ${processor.name} failed: ${error}`,
            severity: 'medium',
            recovery: 'Continue with next processor'
          }, processor.name);

          if (options.enableDebug) {
            console.error(`Processor ${processor.name} error:`, error);
          }
        }
      }

      const totalDuration = Date.now() - startTime;
      
      if (options.enableDebug) {
        console.log(`Processing pipeline completed in ${totalDuration}ms`, {
          processors: processors.length,
          hasChanges,
          errors: currentContext.metadata?.errors.length,
          warnings: currentContext.metadata?.warnings.length
        });
      }

      return {
        value: currentContext.currentValue,
        isValid: errors.length === 0,
        hasChanges,
        context: currentContext,
        suggestions: suggestions.length > 0 ? Array.from(new Set(suggestions)) : undefined,
        validationErrors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      currentContext = addProcessingError(currentContext, {
        code: 'PIPELINE_ERROR',
        message: `Pipeline processing failed: ${error}`,
        severity: 'high'
      }, 'ProcessingPipeline');

      return {
        value: context.currentValue,
        isValid: false,
        hasChanges: false,
        context: currentContext,
        validationErrors: [`Processing failed: ${error}`]
      };
    }
  }

  /**
   * Process with timeout protection
   * پردازش با حفاظت زمان‌بندی
   */
  private async processWithTimeout(
    processor: IFieldProcessor,
    context: ProcessingContext,
    timeout: number = 5000
  ): Promise<ProcessingResult> {
    const processingPromise = Promise.resolve(processor.process(context));
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Processor ${processor.name} timeout after ${timeout}ms`)), timeout);
    });

    return Promise.race([processingPromise, timeoutPromise]);
  }

  /**
   * Enable/disable pipeline
   * فعال/غیرفعال کردن پایپ‌لاین
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Get pipeline status
   * دریافت وضعیت پایپ‌لاین
   */
  getStatus(): {
    enabled: boolean;
    processorsCount: number;
    processors: Array<{ name: string; enabled: boolean; priority: number }>;
  } {
    return {
      enabled: this.isEnabled,
      processorsCount: this.processors.size,
      processors: Array.from(this.processors.values()).map(processor => ({
        name: processor.name,
        enabled: this.configs.get(processor.name)?.enabled !== false,
        priority: this.configs.get(processor.name)?.priority || processor.priority
      }))
    };
  }

  /**
   * Clear all processors
   * پاک کردن تمام پردازشگرها
   */
  clear(): void {
    for (const processor of Array.from(this.processors.values())) {
      if (processor.cleanup) {
        processor.cleanup();
      }
    }
    this.processors.clear();
    this.configs.clear();
  }
}