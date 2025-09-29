// Suggestion Processor module - Advanced suggestion and autocomplete functionality
// ماژول پردازشگر پیشنهادات - عملکرد پیشرفته پیشنهاد و تکمیل خودکار

import { IFieldProcessor, ProcessingContext, ProcessingResult } from '../core/ProcessingContext';

/**
 * Advanced suggestion manager with fuzzy matching and smart completion
 * مدیر پیشنهادات پیشرفته با تطبیق فازی و تکمیل هوشمند
 */
export class SuggestionManager implements IFieldProcessor {
  name = 'SuggestionManager';
  priority = 60;
  enabled = true;
  private suggestionCache: Map<string, string[]> = new Map();

  canProcess(context: ProcessingContext): boolean {
    return !!(
      (context.field.enableSuggestions && context.field.suggestions) ||
      context.field.autoComplete
    );
  }

  process(context: ProcessingContext): ProcessingResult {
    const { field, currentValue } = context;
    let suggestions: string[] = [];
    let processedValue = currentValue;
    let hasChanges = false;

    try {
      // Get base suggestions
      const baseSuggestions = field.suggestions || [];
      
      if (currentValue && currentValue.length > 0) {
        // Generate smart suggestions based on input
        suggestions = this.generateSmartSuggestions(currentValue, baseSuggestions);
        
        // Auto-complete if enabled and exact match found
        if (field.autoComplete) {
          const autoCompleted = this.tryAutoComplete(currentValue, baseSuggestions);
          if (autoCompleted && autoCompleted !== currentValue) {
            processedValue = autoCompleted;
            hasChanges = true;
          }
        }
      } else {
        // Return all suggestions when input is empty
        suggestions = baseSuggestions;
      }

      return {
        value: processedValue,
        isValid: true,
        hasChanges,
        context,
        suggestions: suggestions.slice(0, 10) // Limit to 10 suggestions
      };

    } catch (error) {
      return {
        value: currentValue,
        isValid: true,
        hasChanges: false,
        context,
        suggestions: field.suggestions || []
      };
    }
  }

  /**
   * Generate smart suggestions with fuzzy matching
   * تولید پیشنهادات هوشمند با تطبیق فازی
   */
  private generateSmartSuggestions(input: string, suggestions: string[]): string[] {
    const cacheKey = `${input}:${suggestions.length}`;
    
    if (this.suggestionCache.has(cacheKey)) {
      return this.suggestionCache.get(cacheKey)!;
    }

    const inputLower = input.toLowerCase().trim();
    const matches: { suggestion: string; score: number }[] = [];

    for (const suggestion of suggestions) {
      const suggestionLower = suggestion.toLowerCase();
      let score = 0;

      // Exact prefix match gets highest score
      if (suggestionLower.startsWith(inputLower)) {
        score = 100 - (suggestion.length - input.length);
      }
      // Contains match gets medium score
      else if (suggestionLower.includes(inputLower)) {
        score = 50 - Math.abs(suggestion.length - input.length);
      }
      // Fuzzy match for Persian/Arabic text
      else {
        score = this.calculateFuzzyScore(inputLower, suggestionLower);
      }

      if (score > 0) {
        matches.push({ suggestion, score });
      }
    }

    // Sort by score and return top matches
    const result = matches
      .sort((a, b) => b.score - a.score)
      .map(m => m.suggestion);

    this.suggestionCache.set(cacheKey, result);
    return result;
  }

  /**
   * Calculate fuzzy matching score for Persian/Arabic text
   * محاسبه امتیاز تطبیق فازی برای متن فارسی/عربی
   */
  private calculateFuzzyScore(input: string, suggestion: string): number {
    let score = 0;
    let inputIndex = 0;
    
    for (let i = 0; i < suggestion.length && inputIndex < input.length; i++) {
      if (suggestion[i] === input[inputIndex]) {
        score += 10;
        inputIndex++;
      }
    }
    
    // Bonus for completing the input
    if (inputIndex === input.length) {
      score += 20;
    }
    
    return score;
  }

  /**
   * Try to auto-complete the input
   * تلاش برای تکمیل خودکار ورودی
   */
  private tryAutoComplete(input: string, suggestions: string[]): string | null {
    const inputLower = input.toLowerCase().trim();
    
    // Find exact prefix match
    const exactMatch = suggestions.find(s => 
      s.toLowerCase().startsWith(inputLower) && s.length > input.length
    );
    
    return exactMatch || null;
  }

  cleanup(): void {
    this.suggestionCache.clear();
  }
}

/**
 * Multi-value processor for handling comma-separated values
 * پردازشگر چند مقداره برای مدیریت مقادیر جدا شده با کاما
 */
export class MultiValueProcessor implements IFieldProcessor {
  name = 'MultiValueProcessor';
  priority = 65;
  enabled = true;

  canProcess(context: ProcessingContext): boolean {
    return !!(context.field.enableMultipleValues && context.field.multipleSeparator);
  }

  process(context: ProcessingContext): ProcessingResult {
    const { field, currentValue } = context;
    
    if (!currentValue || typeof currentValue !== 'string') {
      return {
        value: currentValue,
        isValid: true,
        hasChanges: false,
        context
      };
    }

    try {
      const separator = this.getSeparator(field.multipleSeparator || 'comma');
      const values = currentValue.split(separator)
        .map(v => v.trim())
        .filter(v => v.length > 0);
      
      // Process each value separately
      const processedValues = values.map(value => {
        // Apply basic trimming and cleaning
        return value.replace(/\s+/g, ' ').trim();
      });
      
      const processedValue = processedValues.join(separator + ' ');
      
      return {
        value: processedValue,
        isValid: true,
        hasChanges: processedValue !== currentValue,
        context: {
          ...context,
          metadata: {
            ...context.metadata!,
            processingSteps: [
              ...context.metadata!.processingSteps,
              {
                processorName: this.name,
                inputValue: currentValue,
                outputValue: processedValue,
                duration: 0,
                applied: true,
                metadata: { multiValues: processedValues, valueCount: processedValues.length }
              }
            ]
          }
        }
      };

    } catch (error) {
      return {
        value: currentValue,
        isValid: true,
        hasChanges: false,
        context
      };
    }
  }

  private getSeparator(type: string): string {
    switch (type) {
      case 'comma': return ',';
      case 'semicolon': return ';';
      case 'space': return ' ';
      case 'enter': return '\n';
      default: return ',';
    }
  }

  cleanup(): void {}
}

/**
 * Autocomplete processor with intelligent completion
 * پردازشگر تکمیل خودکار با تکمیل هوشمند
 */
export class AutoCompleteProcessor implements IFieldProcessor {
  name = 'AutoCompleteProcessor';
  priority = 62;
  enabled = true;
  private completionHistory: Map<string, string[]> = new Map();

  canProcess(context: ProcessingContext): boolean {
    return !!(context.field.autoComplete && context.currentValue);
  }

  process(context: ProcessingContext): ProcessingResult {
    const { field, currentValue } = context;
    
    if (!currentValue || currentValue.length < 2) {
      return {
        value: currentValue,
        isValid: true,
        hasChanges: false,
        context
      };
    }

    try {
      const suggestions = field.suggestions || [];
      const completion = this.findBestCompletion(currentValue, suggestions);
      
      if (completion && completion !== currentValue) {
        // Store in history for learning
        this.addToHistory(currentValue, completion);
        
        return {
          value: completion,
          isValid: true,
          hasChanges: true,
          context: {
            ...context,
            metadata: {
              ...context.metadata!,
              processingSteps: [
                ...context.metadata!.processingSteps,
                {
                  processorName: this.name,
                  inputValue: currentValue,
                  outputValue: completion,
                  duration: 0,
                  applied: true,
                  metadata: { autoCompleted: true, originalValue: currentValue }
                }
              ]
            }
          }
        };
      }

      return {
        value: currentValue,
        isValid: true,
        hasChanges: false,
        context
      };

    } catch (error) {
      return {
        value: currentValue,
        isValid: true,
        hasChanges: false,
        context
      };
    }
  }

  private findBestCompletion(input: string, suggestions: string[]): string | null {
    const inputLower = input.toLowerCase().trim();
    
    // First, try exact prefix match
    let match = suggestions.find(s => 
      s.toLowerCase().startsWith(inputLower) && s.length > input.length
    );
    
    if (match) return match;
    
    // Then try from history
    const historyKey = inputLower.substring(0, Math.min(3, inputLower.length));
    const history = this.completionHistory.get(historyKey) || [];
    
    match = history.find(s => 
      s.toLowerCase().startsWith(inputLower) && s.length > input.length
    );
    
    return match || null;
  }

  private addToHistory(input: string, completion: string): void {
    const key = input.toLowerCase().substring(0, Math.min(3, input.length));
    const history = this.completionHistory.get(key) || [];
    
    if (!history.includes(completion)) {
      history.push(completion);
      // Keep only last 20 entries
      if (history.length > 20) {
        history.shift();
      }
      this.completionHistory.set(key, history);
    }
  }

  cleanup(): void {
    this.completionHistory.clear();
  }
}

export const SuggestionProcessor = { 
  SuggestionManager, 
  MultiValueProcessor, 
  AutoCompleteProcessor 
};