/**
 * Template Validation Utilities
 * Provides comprehensive validation for field templates
 */

import { SmartFieldConfig, BaseFieldType, EnhancementType } from '../types/smartFieldTypes';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // Quality score 0-100
}

export interface TemplateValidationOptions {
  strict?: boolean;
  requireDescription?: boolean;
  requireTags?: boolean;
  validateEnhancements?: boolean;
  checkDuplicates?: boolean;
}

/**
 * Comprehensive template validation
 */
export function validateTemplate(
  template: any,
  options: TemplateValidationOptions = {}
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  // Default options
  const {
    strict = false,
    requireDescription = true,
    requireTags = false,
    validateEnhancements = true,
    checkDuplicates = true
  } = options;

  // Basic structure validation
  if (!template) {
    errors.push('Template is null or undefined');
    return { isValid: false, errors, warnings, score: 0 };
  }

  // Required fields validation
  if (!template.id || typeof template.id !== 'string') {
    errors.push('Template must have a valid ID');
    score -= 20;
  }

  if (!template.name || typeof template.name !== 'string' || template.name.trim().length === 0) {
    errors.push('Template must have a valid name');
    score -= 20;
  }

  if (requireDescription && (!template.description || template.description.trim().length === 0)) {
    if (strict) {
      errors.push('Template description is required');
      score -= 15;
    } else {
      warnings.push('Template description is recommended');
      score -= 5;
    }
  }

  // Category validation
  if (!template.category) {
    warnings.push('Template category is not specified');
    score -= 5;
  } else if (Array.isArray(template.category)) {
    if (template.category.length === 0) {
      warnings.push('Template has empty category array');
      score -= 3;
    }
  }

  // Tags validation
  if (requireTags) {
    if (!template.tags || !Array.isArray(template.tags) || template.tags.length === 0) {
      if (strict) {
        errors.push('Template tags are required');
        score -= 10;
      } else {
        warnings.push('Template tags are recommended for better searchability');
        score -= 3;
      }
    }
  }

  // Fields validation
  if (!template.fields || !Array.isArray(template.fields)) {
    errors.push('Template must have a fields array');
    score -= 30;
  } else if (template.fields.length === 0) {
    errors.push('Template must have at least one field');
    score -= 25;
  } else {
    // Validate each field
    template.fields.forEach((field: any, index: number) => {
      const fieldValidation = validateTemplateField(field, index, validateEnhancements);
      errors.push(...fieldValidation.errors);
      warnings.push(...fieldValidation.warnings);
      score -= fieldValidation.scoreDeduction;
    });
  }

  // Icon validation
  if (!template.icon) {
    warnings.push('Template icon is missing');
    score -= 2;
  }

  // Usage metrics validation
  if (template.usageCount && typeof template.usageCount !== 'number') {
    warnings.push('Invalid usage count format');
    score -= 1;
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score
  };
}

/**
 * Validate individual template field
 */
function validateTemplateField(
  field: any,
  index: number,
  validateEnhancements: boolean
): { errors: string[]; warnings: string[]; scoreDeduction: number } {
  const errors: string[] = [];
  const warnings: string[] = [];
  let scoreDeduction = 0;

  const fieldPrefix = `Field ${index + 1}`;

  // Basic field validation
  if (!field) {
    errors.push(`${fieldPrefix}: Field is null or undefined`);
    return { errors, warnings, scoreDeduction: 10 };
  }

  if (!field.name || typeof field.name !== 'string') {
    errors.push(`${fieldPrefix}: Must have a valid name`);
    scoreDeduction += 5;
  }

  if (!field.englishName || typeof field.englishName !== 'string') {
    errors.push(`${fieldPrefix}: Must have a valid English name`);
    scoreDeduction += 5;
  } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(field.englishName)) {
    warnings.push(`${fieldPrefix}: English name should follow naming conventions`);
    scoreDeduction += 2;
  }

  if (!field.baseType || !Object.values(BaseFieldType).includes(field.baseType)) {
    errors.push(`${fieldPrefix}: Must have a valid base type`);
    scoreDeduction += 8;
  }

  // Enhancements validation
  if (validateEnhancements && field.enhancements) {
    if (!Array.isArray(field.enhancements)) {
      errors.push(`${fieldPrefix}: Enhancements must be an array`);
      scoreDeduction += 3;
    } else {
      field.enhancements.forEach((enhancement: any, enhIndex: number) => {
        if (!enhancement.type || !Object.values(EnhancementType).includes(enhancement.type)) {
          errors.push(`${fieldPrefix}, Enhancement ${enhIndex + 1}: Invalid enhancement type`);
          scoreDeduction += 2;
        }

        if (typeof enhancement.enabled !== 'boolean') {
          warnings.push(`${fieldPrefix}, Enhancement ${enhIndex + 1}: Enabled flag should be boolean`);
          scoreDeduction += 1;
        }

        if (!enhancement.config || typeof enhancement.config !== 'object') {
          warnings.push(`${fieldPrefix}, Enhancement ${enhIndex + 1}: Missing or invalid config`);
          scoreDeduction += 1;
        }
      });
    }
  }

  // Validation rules check
  if (field.validation && !Array.isArray(field.validation)) {
    warnings.push(`${fieldPrefix}: Validation should be an array`);
    scoreDeduction += 1;
  }

  return { errors, warnings, scoreDeduction };
}

/**
 * Validate template collection for duplicates and consistency
 */
export function validateTemplateCollection(templates: any[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  if (!Array.isArray(templates)) {
    return {
      isValid: false,
      errors: ['Templates must be provided as an array'],
      warnings: [],
      score: 0
    };
  }

  // Check for duplicate IDs
  const ids = new Set<string>();
  const duplicateIds = new Set<string>();

  templates.forEach((template, index) => {
    if (template?.id) {
      if (ids.has(template.id)) {
        duplicateIds.add(template.id);
      } else {
        ids.add(template.id);
      }
    }
  });

  if (duplicateIds.size > 0) {
    errors.push(`Duplicate template IDs found: ${Array.from(duplicateIds).join(', ')}`);
    score -= duplicateIds.size * 10;
  }

  // Check for duplicate names
  const names = new Set<string>();
  const duplicateNames = new Set<string>();

  templates.forEach((template) => {
    if (template?.name) {
      const normalizedName = template.name.toLowerCase().trim();
      if (names.has(normalizedName)) {
        duplicateNames.add(template.name);
      } else {
        names.add(normalizedName);
      }
    }
  });

  if (duplicateNames.size > 0) {
    warnings.push(`Duplicate template names found: ${Array.from(duplicateNames).join(', ')}`);
    score -= duplicateNames.size * 3;
  }

  // Check for duplicate English names in fields
  const englishNames = new Set<string>();
  const duplicateEnglishNames = new Set<string>();

  templates.forEach((template) => {
    if (template?.fields && Array.isArray(template.fields)) {
      template.fields.forEach((field: any) => {
        if (field?.englishName) {
          const normalizedName = field.englishName.toLowerCase();
          if (englishNames.has(normalizedName)) {
            duplicateEnglishNames.add(field.englishName);
          } else {
            englishNames.add(normalizedName);
          }
        }
      });
    }
  });

  if (duplicateEnglishNames.size > 0) {
    warnings.push(`Duplicate field English names found: ${Array.from(duplicateEnglishNames).join(', ')}`);
    score -= duplicateEnglishNames.size * 2;
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score
  };
}

/**
 * Quick validation for template existence and basic structure
 */
export function quickValidateTemplate(template: any): boolean {
  return !!(
    template &&
    template.id &&
    template.name &&
    template.fields &&
    Array.isArray(template.fields) &&
    template.fields.length > 0 &&
    template.fields.every((field: any) => 
      field && field.name && field.englishName && field.baseType
    )
  );
}

/**
 * Get validation summary for display
 */
export function getValidationSummary(result: ValidationResult): string {
  if (result.isValid) {
    if (result.warnings.length === 0) {
      return '✅ Template is valid and well-structured';
    } else {
      return `⚠️ Template is valid but has ${result.warnings.length} warning(s)`;
    }
  } else {
    return `❌ Template has ${result.errors.length} error(s) and needs to be fixed`;
  }
}