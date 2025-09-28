import React from 'react';
import { BaseStrategy } from './baseStrategy';
import { CategoryType, DefinitionNode, SearchFilters, FormErrors, GraphConfig } from '../types';
import { loadPersonsData } from '../data/loader';
import {
  validateEnglishOnly,
  validateNumericOnly,
  validateNationalIdByCountry,
  validatePhoneNumber
} from '../utils/validationUtils';
import { ENHANCED_FIELD_TYPES } from '../types/enhancedFields';
import type { PhoneEntry, HierarchicalAddress } from '../types/enhancedFields';

interface PersonsNode extends DefinitionNode {
  icon?: string;
  specialty?: string;
  customFields?: {
    type?: 'resource' | 'user' | string;
  } & Record<string, any>;
}

const PersonsNodeRenderer: React.FC<{ node: PersonsNode }> = ({ node }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {node.icon && <span aria-hidden style={{ fontSize: 12 }}>{node.icon}</span>}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <strong>{node.name}</strong>
        {node.description && (
          <span style={{ color: '#6c757d', fontSize: 12 }}>{node.description}</span>
        )}
      </div>
    </div>
  );
};

export class PersonsStrategy extends BaseStrategy {
  constructor() {
    super(CategoryType.PERSONS);
  }

  getGraphConfig(): GraphConfig {
    const base = super.getGraphConfig();
    return { ...base, nodeColor: '#10B981', layout: 'tree' };
  }

  getDefaultFilters(): SearchFilters {
    return {
      ...super.getDefaultFilters(),
      nodeType: 'all'
    };
  }

  validateNode(node: Partial<DefinitionNode>): FormErrors {
    const errors = super.validateNode(node);
    
    // Enhanced validation for personnel-specific fields
    if (node.customFields) {
      // Validate English-only fields
      const englishFields = ['res-first-name-en', 'res-last-name-en'];
      englishFields.forEach(fieldId => {
        const value = node.customFields[fieldId];
        if (value && !validateEnglishOnly(value)) {
          errors[fieldId] = 'فقط حروف انگلیسی مجاز است';
        }
      });

      // Validate numeric fields
      const numericFields = ['res-national-id'];
      numericFields.forEach(fieldId => {
        const value = node.customFields[fieldId];
        if (value && !validateNumericOnly(value)) {
          errors[fieldId] = 'فقط اعداد مجاز است';
        }
      });

      // Validate national ID based on nationality
      const nationalityValue = node.customFields['res-nationality'];
      const nationalIdValue = node.customFields['res-national-id'];
      if (nationalityValue && nationalIdValue) {
        const validation = validateNationalIdByCountry(nationalIdValue, nationalityValue);
        if (!validation.isValid) {
          errors['res-national-id'] = validation.message || 'شماره شناسایی نامعتبر است';
        }
      }

      // Validate phone numbers array
      const phones = node.customFields['res-phones'] as PhoneEntry[];
      if (phones && Array.isArray(phones)) {
        phones.forEach((phone, index) => {
          if (phone.number && !validatePhoneNumber(phone.number)) {
            errors[`res-phones-${index}-number`] = 'فرمت شماره تلفن نامعتبر است';
          }
        });
        
        // Check for primary phone
        const hasPrimary = phones.some(phone => phone.isPrimary);
        if (phones.length > 0 && !hasPrimary) {
          errors['res-phones'] = 'یکی از شماره‌ها باید به عنوان اصلی انتخاب شود';
        }
      }

      // Validate addresses array
      const addresses = node.customFields['res-addresses'] as HierarchicalAddress[];
      if (addresses && Array.isArray(addresses)) {
        addresses.forEach((address, index) => {
          if (address.postalCode && !/^\d{10}$/.test(address.postalCode)) {
            errors[`res-addresses-${index}-postalCode`] = 'کد پستی باید 10 رقم باشد';
          }
        });
      }
    }

    return errors;
  }

  filterNode(node: DefinitionNode, filters: SearchFilters): boolean {
    if (!super.filterNode(node, filters)) return false;
    // در صورت نیاز می‌توان بر اساس customFields.type فیلتر کرد
    return true;
  }

  // لود داده‌های اشخاص
  getNodeData(categoryId: string): DefinitionNode[] {
    // @ts-ignore loader returns Promise; we cast for compatibility with current interface
    return loadPersonsData(categoryId) as unknown as DefinitionNode[];
  }

  getNodeRenderer() {
    return (node: DefinitionNode) => <PersonsNodeRenderer node={node as PersonsNode} />;
  }
}

export default PersonsStrategy;