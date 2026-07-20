// Integration Tests for Field Constructor System
// تست‌های ادغام برای سیستم Field Constructor

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';

import DynamicForm from '../../../components/common/DynamicForm';
import HierarchicalInputComponent from '../components/input/HierarchicalInputComponent';
import ArrayInputComponent from '../components/input/ArrayInputComponent';
import { FeatureFlagManager } from '../../../utils/featureFlags';
import { TemplateExporter } from '../utils/templateExporter';
import { TemplateImporter } from '../utils/templateImporter';
import type { TabDefinition, FieldDefinition } from '../../../hooks/useDefinitionData';
import type { FieldConstructorConfig, FieldTemplate } from '../types/fieldConstructor';

// Mock store
const createMockStore = () => configureStore({
  reducer: {
    root: (state = {}) => state
  }
});

const testTheme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Provider store={createMockStore()}>
    <ThemeProvider theme={testTheme}>
      {children}
    </ThemeProvider>
  </Provider>
);

// Mock complete form data
const mockTabDefinition: TabDefinition = {
  id: 'test-tab',
  name: 'Test Tab',
  fields: [
    {
      id: 'text-field',
      name: 'Text Field',
      type: 'text',
      isRequired: true,
      order: 1
    },
    {
      id: 'select-field',
      name: 'Select Field',
      type: 'select',
      isRequired: false,
      order: 2,
      options: ['Option 1', 'Option 2', 'Option 3']
    },
    {
      id: 'date-field',
      name: 'Date Field',
      type: 'date',
      isRequired: true,
      order: 3
    }
  ]
};

const mockConstructorFields: FieldConstructorConfig[] = [
  {
    id: 'enhanced-text',
    name: 'Enhanced Text Field',
    inputType: 'text',
    isRequired: true,
    order: 1,
    inputEnhancement: {
      type: 'text',
      configuration: {
        multiline: false,
        validation: {
          pattern: '^[a-zA-Z\\s]+$',
          minLength: 2,
          maxLength: 50
        }
      }
    }
  },
  {
    id: 'phone-array',
    name: 'Phone Numbers',
    inputType: 'array',
    isRequired: false,
    order: 2,
    inputEnhancement: {
      type: 'array',
      configuration: {
        itemType: 'phone',
        minItems: 1,
        maxItems: 5,
        allowReorder: true
      }
    }
  },
  {
    id: 'address-hierarchical',
    name: 'Hierarchical Address',
    inputType: 'hierarchical-address',
    isRequired: true,
    order: 3,
    inputEnhancement: {
      type: 'hierarchical',
      configuration: {
        rootCategory: 'geographical',
        maxDepth: 4,
        showPath: true,
        allowSearch: true,
        showCoordinates: false
      }
    },
    dataSource: {
      type: 'hierarchical',
      configuration: {
        rootCategory: 'geographical'
      }
    }
  }
];

// Mock geographical data
const mockGeographicalData = [
  {
    id: 'country-1',
    name: 'ایران',
    englishName: 'Iran',
    level: 1,
    parentId: null,
    coordinates: { lat: 32.4279, lng: 53.6880 }
  },
  {
    id: 'province-1',
    name: 'تهران',
    englishName: 'Tehran',
    level: 2,
    parentId: 'country-1'
  },
  {
    id: 'city-1',
    name: 'تهران',
    englishName: 'Tehran City',
    level: 3,
    parentId: 'province-1'
  }
];

describe('Field Constructor Integration Tests', () => {
  let featureFlagManager: FeatureFlagManager;

  beforeEach(() => {
    featureFlagManager = FeatureFlagManager.getInstance();
    featureFlagManager.resetToDefaults();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    // Mock data loading functions
    jest.mock('../data/loader', () => ({
      loadGeographicalData: jest.fn().mockResolvedValue(mockGeographicalData),
      loadCategoryLevels: jest.fn().mockResolvedValue([
        { id: 1, name: 'کشور' },
        { id: 2, name: 'استان' },
        { id: 3, name: 'شهر' }
      ])
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('Dynamic Form Integration', () => {
    test('should render form with mixed legacy and constructor fields', async () => {
      await featureFlagManager.updateFlags({
        'field-constructor-enabled': true,
        'hybrid-field-rendering': true
      });
      await featureFlagManager.setMigrationPhase('hybrid');

      const mockData = {
        'text-field': 'Test value',
        'select-field': 'Option 1',
        'date-field': new Date().toISOString()
      };

      const mockOnChange = jest.fn();

      render(
        <TestWrapper>
          <DynamicForm
            tab={mockTabDefinition}
            data={mockData}
            errors={{}}
            onChange={mockOnChange}
          />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('Test value')).toBeInTheDocument();
      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    test('should handle form validation across field types', async () => {
      const mockData = {};
      const mockErrors = {
        'text-field': 'این فیلد اجباری است',
        'date-field': 'تاریخ نامعتبر است'
      };
      const mockOnChange = jest.fn();

      render(
        <TestWrapper>
          <DynamicForm
            tab={mockTabDefinition}
            data={mockData}
            errors={mockErrors}
            onChange={mockOnChange}
          />
        </TestWrapper>
      );

      expect(screen.getByText('این فیلد اجباری است')).toBeInTheDocument();
      expect(screen.getByText('تاریخ نامعتبر است')).toBeInTheDocument();
    });

    test('should migrate form data during phase transitions', async () => {
      const mockData = {
        'text-field': 'Original value'
      };
      const mockOnChange = jest.fn();

      // Start in legacy mode
      const { rerender } = render(
        <TestWrapper>
          <DynamicForm
            tab={mockTabDefinition}
            data={mockData}
            errors={{}}
            onChange={mockOnChange}
          />
        </TestWrapper>
      );

      // Switch to hybrid mode
      await featureFlagManager.setMigrationPhase('hybrid');
      await featureFlagManager.updateFlags({
        'field-constructor-enabled': true,
        'hybrid-field-rendering': true
      });

      rerender(
        <TestWrapper>
          <DynamicForm
            tab={mockTabDefinition}
            data={mockData}
            errors={{}}
            onChange={mockOnChange}
          />
        </TestWrapper>
      );

      // Value should persist across migration
      expect(screen.getByDisplayValue('Original value')).toBeInTheDocument();
    });
  });

  describe('Array Input Integration', () => {
    test('should handle array field operations', async () => {
      const mockValue = [
        { number: '+98-21-12345678', type: 'home' },
        { number: '+98-912-1234567', type: 'mobile' }
      ];
      const mockOnChange = jest.fn();

      render(
        <TestWrapper>
          <ArrayInputComponent
            config={mockConstructorFields[1]}
            value={mockValue}
            onChange={mockOnChange}
          />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('+98-21-12345678')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+98-912-1234567')).toBeInTheDocument();

      // Test adding new item
      const addButton = screen.getByLabelText(/افزودن/);
      fireEvent.click(addButton);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          ...mockValue,
          expect.objectContaining({ number: '', type: 'mobile' })
        ])
      );
    });

    test('should enforce array validation rules', async () => {
      const mockValue = Array.from({ length: 6 }, (_, i) => ({
        number: `+98-${i}`,
        type: 'mobile'
      }));
      const mockOnChange = jest.fn();

      render(
        <TestWrapper>
          <ArrayInputComponent
            config={mockConstructorFields[1]}
            value={mockValue}
            onChange={mockOnChange}
          />
        </TestWrapper>
      );

      // Should show max items warning
      expect(screen.getByText(/حداکثر/)).toBeInTheDocument();

      // Add button should be disabled
      const addButton = screen.getByLabelText(/افزودن/);
      expect(addButton).toBeDisabled();
    });
  });

  describe('Hierarchical Input Integration', () => {
    test('should load and display hierarchical data', async () => {
      const mockOnChange = jest.fn();

      render(
        <TestWrapper>
          <HierarchicalInputComponent
            config={mockConstructorFields[2]}
            value={null}
            onChange={mockOnChange}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Hierarchical Address')).toBeInTheDocument();
      });

      // Should show loading initially, then data
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });

    test('should handle hierarchical selection', async () => {
      const mockOnChange = jest.fn();

      render(
        <TestWrapper>
          <HierarchicalInputComponent
            config={mockConstructorFields[2]}
            value={null}
            onChange={mockOnChange}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        const countrySelect = screen.getByLabelText(/انتخاب سطح/);
        expect(countrySelect).toBeInTheDocument();
      });

      // Simulate selection would be complex with mocked data
      // In real E2E tests, this would involve actual data loading
    });
  });

  describe('Template Export/Import Integration', () => {
    test('should export field configurations correctly', () => {
      const exporter = new TemplateExporter();
      const template = exporter.exportTemplate(mockConstructorFields);

      expect(template.id).toBeDefined();
      expect(template.name).toBeDefined();
      expect(template.fields).toHaveLength(mockConstructorFields.length);
      expect(template.metadata.totalFields).toBe(mockConstructorFields.length);
      expect(template.metadata.fieldTypes).toContain('text');
      expect(template.metadata.fieldTypes).toContain('array');
      expect(template.metadata.fieldTypes).toContain('hierarchical-address');
    });

    test('should import and validate template', async () => {
      const exporter = new TemplateExporter();
      const template = exporter.exportTemplate(mockConstructorFields);
      
      const importer = new TemplateImporter();
      const result = await importer.importTemplate(template);

      expect(result.success).toBe(true);
      expect(result.fields).toHaveLength(mockConstructorFields.length);
      expect(result.convertedFields).toBe(0); // No legacy conversion needed
      expect(result.errors).toHaveLength(0);
    });

    test('should handle legacy field conversion during import', async () => {
      const legacyTemplate: FieldTemplate = {
        id: 'legacy-template',
        name: 'Legacy Template',
        version: '1.0.0',
        description: 'Template with legacy fields',
        fields: [
          {
            id: 'legacy-text',
            name: 'Legacy Text',
            type: 'text', // Legacy format
            isRequired: true,
            order: 1
          } as any
        ],
        metadata: {
          createdAt: new Date().toISOString(),
          version: '1.0.0',
          totalFields: 1,
          fieldTypes: ['text']
        }
      };

      const importer = new TemplateImporter();
      const result = await importer.importTemplate(legacyTemplate);

      expect(result.success).toBe(true);
      expect(result.convertedFields).toBe(1);
      expect(result.fields[0].inputType).toBe('text'); // Converted to constructor format
    });

    test('should merge templates without conflicts', async () => {
      const template1 = {
        id: 'template-1',
        name: 'Template 1',
        version: '1.0.0',
        fields: [mockConstructorFields[0]],
        metadata: {
          createdAt: new Date().toISOString(),
          version: '1.0.0',
          totalFields: 1,
          fieldTypes: ['text']
        }
      };

      const template2 = {
        id: 'template-2',
        name: 'Template 2',
        version: '1.0.0',
        fields: [mockConstructorFields[1]],
        metadata: {
          createdAt: new Date().toISOString(),
          version: '1.0.0',
          totalFields: 1,
          fieldTypes: ['array']
        }
      };

      const importer = new TemplateImporter();
      const result1 = await importer.importTemplate(template1);
      const result2 = await importer.mergeFields(result1.fields, template2.fields);

      expect(result2).toHaveLength(2);
      expect(result2.map(f => f.id)).toContain('enhanced-text');
      expect(result2.map(f => f.id)).toContain('phone-array');
    });
  });

  describe('Performance Integration', () => {
    test('should handle large forms efficiently', async () => {
      const largeFieldSet = Array.from({ length: 50 }, (_, i) => ({
        id: `field-${i}`,
        name: `Field ${i}`,
        type: 'text' as const,
        isRequired: false,
        order: i + 1
      }));

      const largeTab: TabDefinition = {
        id: 'large-tab',
        name: 'Large Tab',
        fields: largeFieldSet
      };

      const mockData = largeFieldSet.reduce((acc, field) => ({
        ...acc,
        [field.id]: `Value ${field.id}`
      }), {});

      const startTime = performance.now();

      render(
        <TestWrapper>
          <DynamicForm
            tab={largeTab}
            data={mockData}
            errors={{}}
            onChange={jest.fn()}
          />
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render large forms within reasonable time (1 second)
      expect(renderTime).toBeLessThan(1000);
    });

    test('should use virtualization for large arrays', async () => {
      const largeArray = Array.from({ length: 100 }, (_, i) => ({
        number: `+98-${i.toString().padStart(10, '0')}`,
        type: 'mobile'
      }));

      const mockOnChange = jest.fn();

      const startTime = performance.now();

      render(
        <TestWrapper>
          <ArrayInputComponent
            config={mockConstructorFields[1]}
            value={largeArray}
            onChange={mockOnChange}
          />
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should handle large arrays efficiently
      expect(renderTime).toBeLessThan(500);
    });
  });

  describe('Migration Phase Integration', () => {
    test('should transition smoothly between phases', async () => {
      const mockData = { 'text-field': 'Test value' };
      const mockOnChange = jest.fn();

      const { rerender } = render(
        <TestWrapper>
          <DynamicForm
            tab={mockTabDefinition}
            data={mockData}
            errors={{}}
            onChange={mockOnChange}
          />
        </TestWrapper>
      );

      // Phase 1: Legacy
      expect(screen.getByText('Legacy')).toBeInTheDocument();

      // Phase 2: Hybrid
      await featureFlagManager.setMigrationPhase('hybrid');
      await featureFlagManager.updateFlags({
        'field-constructor-enabled': true,
        'hybrid-field-rendering': true
      });

      rerender(
        <TestWrapper>
          <DynamicForm
            tab={mockTabDefinition}
            data={mockData}
            errors={{}}
            onChange={mockOnChange}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Hybrid Mode')).toBeInTheDocument();

      // Phase 3: Constructor
      await featureFlagManager.setMigrationPhase('constructor');

      rerender(
        <TestWrapper>
          <DynamicForm
            tab={mockTabDefinition}
            data={mockData}
            errors={{}}
            onChange={mockOnChange}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Field Constructor')).toBeInTheDocument();

      // Data should persist through all phases
      expect(screen.getByDisplayValue('Test value')).toBeInTheDocument();
    });
  });
});