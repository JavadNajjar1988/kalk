import { describe, it, expect } from 'vitest';
import { validateFieldDefinition } from '../modules/definition-editor/components/fields/utils/fieldValidation';
import { ExtendedCustomFieldDefinition } from '../modules/definition-editor/components/fields/types/FieldEditTypes';

describe('Field Validation', () => {
  it('should validate required fields', () => {
    const field: ExtendedCustomFieldDefinition = {
      id: 'test-field',
      name: '',
      englishName: '',
      type: 'text',
      isRequired: false,
      defaultValue: '',
      order: 1,
    };

    const result = validateFieldDefinition(field);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors.some(e => e.field === 'name')).toBe(true);
    expect(result.errors.some(e => e.field === 'englishName')).toBe(true);
  });

  it('should validate english name format', () => {
    const field: ExtendedCustomFieldDefinition = {
      id: 'test-field',
      name: 'Test Field',
      englishName: '123invalid',
      type: 'text',
      isRequired: false,
      defaultValue: '',
      order: 1,
    };

    const result = validateFieldDefinition(field);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'englishName')).toBe(true);
  });

  it('should validate select field with no options', () => {
    const field: ExtendedCustomFieldDefinition = {
      id: 'test-field',
      name: 'Test Field',
      englishName: 'testField',
      type: 'select',
      isRequired: false,
      defaultValue: '',
      order: 1,
    };

    const result = validateFieldDefinition(field);
    
    expect(result.isValid).toBe(true); // Warnings don't make it invalid
    expect(result.errors.some(e => e.field === 'options' && e.type === 'warning')).toBe(true);
  });

  it('should validate select field with options', () => {
    const field: ExtendedCustomFieldDefinition = {
      id: 'test-field',
      name: 'Test Field',
      englishName: 'testField',
      type: 'select',
      isRequired: false,
      defaultValue: '',
      order: 1,
      options: ['Option 1', 'Option 2'],
    };

    const result = validateFieldDefinition(field);
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate field type conversion from text to select', () => {
    const field: ExtendedCustomFieldDefinition = {
      id: 'test-field',
      name: 'Test Field',
      englishName: 'testField',
      type: 'select',
      isRequired: false,
      defaultValue: '',
      order: 1,
    };

    const result = validateFieldDefinition(field, 'text');
    
    expect(result.isValid).toBe(true);
    // Should have a warning about missing options for select field
    expect(result.errors.some(e => e.field === 'options' && e.type === 'warning')).toBe(true);
  });

  it('should validate field type conversion with incompatible types', () => {
    const field: ExtendedCustomFieldDefinition = {
      id: 'test-field',
      name: 'Test Field',
      englishName: 'testField',
      type: 'number',
      isRequired: false,
      defaultValue: 'invalid',
      order: 1,
    };

    const result = validateFieldDefinition(field, 'select');
    
    expect(result.isValid).toBe(false);
    // Should have a warning about incompatible conversion
    expect(result.errors.some(e => e.field === 'type' && e.type === 'warning')).toBe(true);
    // Should have an error about invalid default value
    expect(result.errors.some(e => e.field === 'defaultValue' && e.type === 'error')).toBe(true);
  });

  it('should validate display type compatibility', () => {
    const field: ExtendedCustomFieldDefinition = {
      id: 'test-field',
      name: 'Test Field',
      englishName: 'testField',
      type: 'number',
      isRequired: false,
      defaultValue: '',
      order: 1,
      displayType: 'accordion', // Not compatible with number
    };

    const result = validateFieldDefinition(field);
    
    expect(result.isValid).toBe(true); // Warnings don't make it invalid
    expect(result.errors.some(e => e.field === 'displayType' && e.type === 'warning')).toBe(true);
  });

  it('should validate display type requiring options', () => {
    const field: ExtendedCustomFieldDefinition = {
      id: 'test-field',
      name: 'Test Field',
      englishName: 'testField',
      type: 'text',
      isRequired: false,
      defaultValue: '',
      order: 1,
      displayType: 'chips', // Requires options
    };

    const result = validateFieldDefinition(field);
    
    expect(result.isValid).toBe(true); // Warnings don't make it invalid
    expect(result.errors.some(e => e.field === 'options' && e.type === 'warning')).toBe(true);
  });
});