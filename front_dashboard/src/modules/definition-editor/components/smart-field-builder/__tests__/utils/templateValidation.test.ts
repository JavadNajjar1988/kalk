/**
 * Unit Tests for Template Validation Utilities
 */

import {
  validateTemplate,
  validateTemplateCollection,
  quickValidateTemplate,
  getValidationSummary,
  ValidationResult,
  TemplateValidationOptions
} from '../../utils/templateValidation';
import { Template, BaseFieldType, EnhancementType, ValidationType } from '../../types/smartFieldTypes';

describe('Template Validation', () => {
  const validTemplate: Template = {
    id: 'valid-template',
    name: 'نام معتبر',
    description: 'توضیحات معتبر',
    category: 'personnel',
    fields: [
      {
        id: 'field-1',
        name: 'نام فیلد',
        englishName: 'fieldName',
        baseType: BaseFieldType.TEXT,
        enhancements: [],
        validation: [],
        isRequired: false,
        order: 1
      }
    ],
    icon: '📝',
    tags: ['test'],
    keywords: ['valid'],
    isMultiField: false,
    isCritical: false,
    usageCount: 0,
    rating: 5,
    complexity: 'simple',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    qualityScore: 85
  };

  describe('validateTemplate', () => {
    test('validates correct template successfully', () => {
      const result = validateTemplate(validTemplate);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.score).toBeGreaterThan(50);
    });

    test('fails validation for missing required fields', () => {
      const invalidTemplate = {
        ...validTemplate,
        name: '',
        description: ''
      };
      
      const result = validateTemplate(invalidTemplate);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Template name is required');
      expect(result.errors).toContain('Template description is required');
    });

    test('fails validation for invalid field structure', () => {
      const invalidTemplate = {
        ...validTemplate,
        fields: [
          {
            id: '',
            name: '',
            englishName: 'invalid name with spaces',
            baseType: BaseFieldType.TEXT,
            enhancements: [],
            validation: [],
            isRequired: false,
            order: 1
          }
        ]
      };
      
      const result = validateTemplate(invalidTemplate);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Field name is required'))).toBe(true);
      expect(result.errors.some(error => error.includes('Invalid English name format'))).toBe(true);
    });

    test('validates enhancements correctly', () => {
      const templateWithEnhancements = {
        ...validTemplate,
        fields: [
          {
            ...validTemplate.fields[0],
            enhancements: [
              {
                type: EnhancementType.MULTILINE,
                config: { rows: 3 },
                enabled: true
              },
              {
                type: EnhancementType.RANGE,
                config: { min: 0, max: 100 },
                enabled: true
              }
            ]
          }
        ]
      };
      
      const result = validateTemplate(templateWithEnhancements, {
        validateEnhancements: true
      });
      
      expect(result.warnings.some(warning => 
        warning.includes('Enhancement RANGE not compatible with field type TEXT')
      )).toBe(true);
    });

    test('validates validation rules correctly', () => {
      const templateWithValidation = {
        ...validTemplate,
        fields: [
          {
            ...validTemplate.fields[0],
            validation: [
              {
                type: ValidationType.REQUIRED,
                config: {},
                enabled: true,
                errorMessage: 'این فیلد الزامی است'
              },
              {
                type: ValidationType.MIN_LENGTH,
                config: { value: 5 },
                enabled: true,
                errorMessage: 'حداقل 5 کاراکتر'
              }
            ]
          }
        ]
      };
      
      const result = validateTemplate(templateWithValidation);
      
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(validTemplate.qualityScore || 0);
    });

    test('handles strict validation mode', () => {
      const templateMissingOptional = {
        ...validTemplate,
        icon: undefined,
        tags: undefined
      };
      
      const strictResult = validateTemplate(templateMissingOptional, { strict: true });
      const normalResult = validateTemplate(templateMissingOptional, { strict: false });
      
      expect(strictResult.warnings.length).toBeGreaterThan(normalResult.warnings.length);
    });

    test('calculates quality score correctly', () => {
      const highQualityTemplate = {
        ...validTemplate,
        description: 'Very detailed description explaining the purpose and usage of this template',
        tags: ['personnel', 'basic', 'required', 'common'],
        keywords: ['name', 'personal', 'info'],
        fields: [
          {
            ...validTemplate.fields[0],
            description: 'Field description',
            helpText: 'Help text for users',
            validation: [
              {
                type: ValidationType.REQUIRED,
                config: {},
                enabled: true,
                errorMessage: 'Required field'
              }
            ]
          }
        ]
      };
      
      const result = validateTemplate(highQualityTemplate);
      
      expect(result.score).toBeGreaterThan(80);
    });
  });

  describe('validateTemplateCollection', () => {
    test('validates collection of templates', () => {
      const templates = [
        validTemplate,
        {
          ...validTemplate,
          id: 'template-2',
          name: 'قالب دوم'
        }
      ];
      
      const result = validateTemplateCollection(templates);
      
      expect(result.isValid).toBe(true);
      expect(result.totalTemplates).toBe(2);
      expect(result.validTemplates).toBe(2);
      expect(result.duplicateIds).toHaveLength(0);
    });

    test('detects duplicate template IDs', () => {
      const templates = [
        validTemplate,
        {
          ...validTemplate,
          name: 'نام متفاوت'
        }
      ];
      
      const result = validateTemplateCollection(templates);
      
      expect(result.duplicateIds).toContain('valid-template');
      expect(result.errors).toContain('Duplicate template ID found: valid-template');
    });

    test('detects missing critical templates', () => {
      const limitedTemplates = [validTemplate];
      
      const result = validateTemplateCollection(limitedTemplates);
      
      expect(result.warnings.some(warning => 
        warning.includes('Consider adding more critical templates')
      )).toBe(true);
    });
  });

  describe('quickValidateTemplate', () => {
    test('performs quick validation for performance', () => {
      const start = performance.now();
      const result = quickValidateTemplate(validTemplate);
      const end = performance.now();
      
      expect(result).toBe(true);
      expect(end - start).toBeLessThan(10); // Should be very fast
    });

    test('quickly identifies invalid templates', () => {
      const invalidTemplate = {
        ...validTemplate,
        id: '',
        name: ''
      };
      
      const result = quickValidateTemplate(invalidTemplate);
      
      expect(result).toBe(false);
    });

    test('handles edge cases gracefully', () => {
      expect(quickValidateTemplate(null as any)).toBe(false);
      expect(quickValidateTemplate(undefined as any)).toBe(false);
      expect(quickValidateTemplate({} as any)).toBe(false);
    });
  });

  describe('getValidationSummary', () => {
    test('creates summary from validation result', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        errors: ['Error 1', 'Error 2'],
        warnings: ['Warning 1'],
        score: 65,
        details: {
          hasRequiredFields: true,
          hasValidStructure: false,
          hasValidEnhancements: true,
          hasValidValidation: true,
          qualityMetrics: {
            descriptionQuality: 8,
            fieldQuality: 7,
            enhancementQuality: 6,
            validationQuality: 8,
            metadataQuality: 5
          }
        }
      };
      
      const summary = getValidationSummary(validationResult);
      
      expect(summary.status).toBe('invalid');
      expect(summary.errorCount).toBe(2);
      expect(summary.warningCount).toBe(1);
      expect(summary.score).toBe(65);
      expect(summary.recommendations).toContain('Fix structural issues');
    });

    test('identifies high quality templates', () => {
      const highQualityResult: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        score: 95,
        details: {
          hasRequiredFields: true,
          hasValidStructure: true,
          hasValidEnhancements: true,
          hasValidValidation: true,
          qualityMetrics: {
            descriptionQuality: 10,
            fieldQuality: 9,
            enhancementQuality: 9,
            validationQuality: 10,
            metadataQuality: 9
          }
        }
      };
      
      const summary = getValidationSummary(highQualityResult);
      
      expect(summary.status).toBe('excellent');
      expect(summary.recommendations).toContain('Template meets all quality standards');
    });
  });

  describe('Validation Options', () => {
    test('respects requireDescription option', () => {
      const templateWithoutDescription = {
        ...validTemplate,
        description: ''
      };
      
      const withRequirement = validateTemplate(templateWithoutDescription, {
        requireDescription: true
      });
      
      const withoutRequirement = validateTemplate(templateWithoutDescription, {
        requireDescription: false
      });
      
      expect(withRequirement.errors.some(error => 
        error.includes('description')
      )).toBe(true);
      
      expect(withoutRequirement.errors.some(error => 
        error.includes('description')
      )).toBe(false);
    });

    test('respects validateEnhancements option', () => {
      const templateWithIncompatibleEnhancements = {
        ...validTemplate,
        fields: [
          {
            ...validTemplate.fields[0],
            enhancements: [
              {
                type: EnhancementType.RANGE,
                config: { min: 0, max: 100 },
                enabled: true
              }
            ]
          }
        ]
      };
      
      const withValidation = validateTemplate(templateWithIncompatibleEnhancements, {
        validateEnhancements: true
      });
      
      const withoutValidation = validateTemplate(templateWithIncompatibleEnhancements, {
        validateEnhancements: false
      });
      
      expect(withValidation.warnings.length).toBeGreaterThan(withoutValidation.warnings.length);
    });
  });

  describe('Error Recovery', () => {
    test('handles malformed template data gracefully', () => {
      const malformedTemplate = {
        id: 'malformed',
        name: 'Test',
        fields: 'not an array' // Invalid type
      };
      
      expect(() => {
        validateTemplate(malformedTemplate as any);
      }).not.toThrow();
      
      const result = validateTemplate(malformedTemplate as any);
      expect(result.isValid).toBe(false);
    });

    test('handles circular references in validation', () => {
      const circularTemplate = {
        ...validTemplate
      };
      
      // Create circular reference
      (circularTemplate as any).self = circularTemplate;
      
      expect(() => {
        validateTemplate(circularTemplate);
      }).not.toThrow();
    });
  });
});