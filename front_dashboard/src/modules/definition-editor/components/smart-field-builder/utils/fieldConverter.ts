import { SmartFieldConfig, EnhancementType } from '../types/smartFieldTypes';
import { CustomField } from '@/modules/definition-editor/types/equipment';

/**
 * Convert SmartFieldConfig to CustomField format for compatibility with FieldPreview
 * @param smartConfig The SmartFieldConfig to convert
 * @returns The converted CustomField object
 */
export const convertSmartFieldToCustomField = (smartConfig: SmartFieldConfig): CustomField => {
  const baseTypeMap: Record<string, any> = {
    'text': 'text',
    'number': 'number',
    'choice': 'select',
    'reference': 'reference'
  };

  const customField: CustomField = {
    id: smartConfig.id,
    name: smartConfig.name,
    englishName: smartConfig.englishName,
    type: baseTypeMap[smartConfig.baseType] || smartConfig.baseType,
    isRequired: smartConfig.isRequired || false,
    order: smartConfig.order || 1,
    defaultValue: ''
  };

  // Apply enhancements to the custom field
  if (smartConfig.enhancements) {
    // Apply unit enhancement for number fields
    const unitEnhancement = smartConfig.enhancements.find(e => e.type === EnhancementType.UNIT && e.enabled);
    if (unitEnhancement) {
      customField.unit = unitEnhancement.config.unit;
    }

    // Apply options for choice fields
    if (smartConfig.baseType === 'choice' && smartConfig.dataSource) {
      if (smartConfig.dataSource.config.items) {
        customField.options = smartConfig.dataSource.config.items.map((item: any) => item.label);
      }
    }
  }

  // Apply reference properties
  if (smartConfig.baseType === 'reference' && smartConfig.dataSource) {
    customField.referenceCategory = smartConfig.dataSource.config.categoryId;
  }

  // Store Smart Field metadata in defaultValue for FieldPreview to extract
  const smartFieldMetadata = {
    finalSettings: {
      name: smartConfig.name,
      placeholder: smartConfig.placeholder,
      helpText: smartConfig.helpText
    },
    enhancements: {} as Record<string, any>
  };

  // Convert enhancements to the format FieldPreview expects
  if (smartConfig.enhancements) {
    smartConfig.enhancements.forEach(enhancement => {
      if (enhancement.enabled) {
        smartFieldMetadata.enhancements[enhancement.type] = enhancement.config;
      }
    });
  }

  customField.defaultValue = JSON.stringify(smartFieldMetadata);

  return customField;
};