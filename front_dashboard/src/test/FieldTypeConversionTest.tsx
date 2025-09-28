import { describe, it, expect } from 'vitest';
import { convertFieldType } from '../modules/definition-editor/components/fields/NodeFieldManager';
import { ExtendedCustomFieldDefinition } from '../modules/definition-editor/components/fields/types/FieldEditTypes';

describe('Field Type Conversion', () => {
  it('should convert text field to select field and preserve relevant properties', () => {
    const originalField: ExtendedCustomFieldDefinition = {
      id: 'test-field',
      name: 'Test Field',
      englishName: 'testField',
      type: 'text',
      isRequired: true,
      defaultValue: 'default',
      order: 1,
      placeholder: 'Enter text',
      helpText: 'Help text',
      direction: 'rtl',
      minLength: 5,
      maxLength: 100,
    };

    const convertedField = convertFieldType(originalField, 'select');
    
    expect(convertedField.type).toBe('select');
    expect(convertedField.isRequired).toBe(true);
    expect(convertedField.defaultValue).toBe('default');
    // Text-specific properties should be preserved for select fields
    expect(convertedField.placeholder).toBe('Enter text');
    expect(convertedField.helpText).toBe('Help text');
    expect(convertedField.direction).toBe('rtl');
    expect(convertedField.minLength).toBe(5);
    expect(convertedField.maxLength).toBe(100);
    // Options array should be initialized
    expect(convertedField.options).toEqual([]);
  });

  it('should convert text field to number field and remove text-specific properties', () => {
    const originalField: ExtendedCustomFieldDefinition = {
      id: 'test-field',
      name: 'Test Field',
      englishName: 'testField',
      type: 'text',
      isRequired: true,
      defaultValue: 'default',
      order: 1,
      placeholder: 'Enter text',
      helpText: 'Help text',
      direction: 'rtl',
      minLength: 5,
      maxLength: 100,
      caseTransform: 'uppercase',
      characterControl: 'letters-only',
    };

    const convertedField = convertFieldType(originalField, 'number');
    
    expect(convertedField.type).toBe('number');
    expect(convertedField.isRequired).toBe(true);
    // Text-specific properties should be removed for number fields
    expect(convertedField.placeholder).toBeUndefined();
    expect(convertedField.helpText).toBeUndefined();
    expect(convertedField.direction).toBeUndefined();
    expect(convertedField.minLength).toBeUndefined();
    expect(convertedField.maxLength).toBeUndefined();
    expect(convertedField.caseTransform).toBeUndefined();
    expect(convertedField.characterControl).toBeUndefined();
  });

  it('should convert select field to text field and preserve common properties', () => {
    const originalField: ExtendedCustomFieldDefinition = {
      id: 'test-field',
      name: 'Test Field',
      englishName: 'testField',
      type: 'select',
      isRequired: true,
      defaultValue: 'option1',
      order: 1,
      options: ['option1', 'option2'],
      placeholder: 'Select an option',
    };

    const convertedField = convertFieldType(originalField, 'text');
    
    expect(convertedField.type).toBe('text');
    expect(convertedField.isRequired).toBe(true);
    expect(convertedField.defaultValue).toBe('option1');
    expect(convertedField.placeholder).toBe('Select an option');
    // Options should be removed for text fields
    expect(convertedField.options).toBeUndefined();
  });

  it('should convert text field to boolean field and remove incompatible properties', () => {
    const originalField: ExtendedCustomFieldDefinition = {
      id: 'test-field',
      name: 'Test Field',
      englishName: 'testField',
      type: 'text',
      isRequired: true,
      defaultValue: 'default',
      order: 1,
      placeholder: 'Enter text',
      helpText: 'Help text',
      direction: 'rtl',
      minLength: 5,
      maxLength: 100,
    };

    const convertedField = convertFieldType(originalField, 'boolean');
    
    expect(convertedField.type).toBe('boolean');
    expect(convertedField.isRequired).toBe(true);
    // Text-specific properties should be removed for boolean fields
    expect(convertedField.placeholder).toBeUndefined();
    expect(convertedField.helpText).toBeUndefined();
    expect(convertedField.direction).toBeUndefined();
    expect(convertedField.minLength).toBeUndefined();
    expect(convertedField.maxLength).toBeUndefined();
  });

  it('should preserve options for display types that support them', () => {
    const originalField: ExtendedCustomFieldDefinition = {
      id: 'test-field',
      name: 'Test Field',
      englishName: 'testField',
      type: 'text',
      isRequired: true,
      defaultValue: 'default',
      order: 1,
      displayType: 'chips',
      options: ['option1', 'option2'],
    };

    const convertedField = convertFieldType(originalField, 'text');
    
    expect(convertedField.type).toBe('text');
    // Options should be preserved because displayType is 'chips'
    expect(convertedField.options).toEqual(['option1', 'option2']);
  });
});