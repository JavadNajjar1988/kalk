import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import PreviewStep from '../components/wizard/steps/PreviewStep';
import { SmartFieldConfig, EnhancementType, BaseFieldType, DataSourceType } from '../types/smartFieldTypes';

// Mock MUI components that might cause issues in tests
vi.mock('@mui/material', () => ({
  ...vi.importActual('@mui/material'),
  useTheme: () => ({
    palette: {
      grey: { 100: '#f5f5f5', 400: '#bdbdbd' },
      primary: { main: '#1976d2' },
      text: { secondary: '#757575' }
    }
  })
}));

// Mock MUI icons
vi.mock('@mui/icons-material', () => ({
  Visibility: () => <div data-testid="visibility-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  CheckCircle: () => <div data-testid="check-icon" />,
  Info: () => <div data-testid="info-icon" />
}));

describe('Enhancement Preview Tests', () => {
  const mockOnConfigUpdate = vi.fn();
  const baseProps = {
    onConfigUpdate: mockOnConfigUpdate,
    fieldContext: {},
    errors: {}
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Text Field Enhancements', () => {
    test('should render multiline text field with correct configuration', () => {
      const config: Partial<SmartFieldConfig> = {
        name: 'توضیحات',
        englishName: 'description',
        baseType: BaseFieldType.TEXT,
        enhancements: [
          {
            type: EnhancementType.MULTILINE,
            config: { rows: 5, maxRows: 10 },
            enabled: true
          }
        ],
        isRequired: false,
        order: 1
      };

      render(<PreviewStep {...baseProps} config={config} />);
      
      // The preview should show a multiline text field
      // Note: We can't directly test the rendered TextField props in a unit test
      // but we can verify the component renders without errors
      expect(screen.getByText('پیش‌نمایش زنده')).toBeInTheDocument();
    });

    test('should render composite text field with correct configuration', () => {
      const config: Partial<SmartFieldConfig> = {
        name: 'نام کامل',
        englishName: 'fullName',
        baseType: BaseFieldType.TEXT,
        enhancements: [
          {
            type: EnhancementType.COMPOSITE,
            config: {
              parts: [
                { id: 'firstName', label: 'نام', type: 'text', required: true },
                { id: 'lastName', label: 'نام خانوادگی', type: 'text', required: true }
              ]
            },
            enabled: true
          }
        ],
        isRequired: true,
        order: 1
      };

      render(<PreviewStep {...baseProps} config={config} />);
      
      // Should show composite field preview
      expect(screen.getByText('نام کامل')).toBeInTheDocument();
      expect(screen.getByText('نام')).toBeInTheDocument();
      expect(screen.getByText('نام خانوادگی')).toBeInTheDocument();
    });
  });

  describe('Number Field Enhancements', () => {
    test('should render number field with range configuration', () => {
      const config: Partial<SmartFieldConfig> = {
        name: 'سن',
        englishName: 'age',
        baseType: BaseFieldType.NUMBER,
        enhancements: [
          {
            type: EnhancementType.RANGE,
            config: { min: 0, max: 120, step: 1 },
            enabled: true
          }
        ],
        isRequired: true,
        order: 1
      };

      render(<PreviewStep {...baseProps} config={config} />);
      
      // Should show range information in preview
      expect(screen.getByText('پیش‌نمایش زنده')).toBeInTheDocument();
      expect(screen.getByText(/حداقل 0/)).toBeInTheDocument();
      expect(screen.getByText(/حداکثر 120/)).toBeInTheDocument();
    });

    test('should render number field with unit configuration', () => {
      const config: Partial<SmartFieldConfig> = {
        name: 'وزن',
        englishName: 'weight',
        baseType: BaseFieldType.NUMBER,
        enhancements: [
          {
            type: EnhancementType.UNIT,
            config: { unit: 'کیلوگرم', display: 'after' },
            enabled: true
          }
        ],
        isRequired: false,
        order: 1
      };

      render(<PreviewStep {...baseProps} config={config} />);
      
      // Should show unit information in preview
      expect(screen.getByText('واحد: کیلوگرم')).toBeInTheDocument();
    });

    test('should render number field with decimal configuration', () => {
      const config: Partial<SmartFieldConfig> = {
        name: 'قیمت',
        englishName: 'price',
        baseType: BaseFieldType.NUMBER,
        enhancements: [
          {
            type: EnhancementType.DECIMAL,
            config: { places: 2, separator: '.', thousandsSeparator: ',' },
            enabled: true
          }
        ],
        isRequired: true,
        order: 1
      };

      render(<PreviewStep {...baseProps} config={config} />);
      
      // Should show decimal information in helper text
      expect(screen.getByText(/\(حداکثر 2 رقم اعشار\)/)).toBeInTheDocument();
    });

    test('should render number field with all numeric enhancements', () => {
      const config: Partial<SmartFieldConfig> = {
        name: 'دما',
        englishName: 'temperature',
        baseType: BaseFieldType.NUMBER,
        enhancements: [
          {
            type: EnhancementType.RANGE,
            config: { min: -50, max: 100, step: 0.1 },
            enabled: true
          },
          {
            type: EnhancementType.UNIT,
            config: { unit: 'درجه سانتی‌گراد', display: 'after' },
            enabled: true
          },
          {
            type: EnhancementType.DECIMAL,
            config: { places: 1, separator: '.' },
            enabled: true
          }
        ],
        isRequired: false,
        order: 1
      };

      render(<PreviewStep {...baseProps} config={config} />);
      
      // Should show all enhancements in preview
      expect(screen.getByText(/حداقل -50/)).toBeInTheDocument();
      expect(screen.getByText(/حداکثر 100/)).toBeInTheDocument();
      expect(screen.getByText('واحد: درجه سانتی‌گراد')).toBeInTheDocument();
      expect(screen.getByText(/\(حداکثر 1 رقم اعشار\)/)).toBeInTheDocument();
    });
  });

  describe('Choice Field Enhancements', () => {
    test('should render single choice field', () => {
      const config: Partial<SmartFieldConfig> = {
        name: 'شهر',
        englishName: 'city',
        baseType: BaseFieldType.CHOICE,
        dataSource: {
          type: DataSourceType.MANUAL,
          config: {
            items: [
              { id: '1', label: 'تهران' },
              { id: '2', label: 'اصفهان' },
              { id: '3', label: 'شیراز' }
            ]
          }
        },
        enhancements: [],
        isRequired: true,
        order: 1
      };

      render(<PreviewStep {...baseProps} config={config} />);
      
      // Should show choice field preview
      expect(screen.getByText('شهر')).toBeInTheDocument();
    });

    test('should render multiple choice field', () => {
      const config: Partial<SmartFieldConfig> = {
        name: 'مهارت‌ها',
        englishName: 'skills',
        baseType: BaseFieldType.CHOICE,
        dataSource: {
          type: DataSourceType.MANUAL,
          config: {
            items: [
              { id: '1', label: 'برنامه‌نویسی' },
              { id: '2', label: 'طراحی' },
              { id: '3', label: 'مدیریت' }
            ]
          }
        },
        enhancements: [
          {
            type: EnhancementType.MULTIPLE,
            config: {},
            enabled: true
          }
        ],
        isRequired: false,
        order: 1
      };

      render(<PreviewStep {...baseProps} config={config} />);
      
      // Should show multiple choice field preview
      expect(screen.getByText('مهارت‌ها')).toBeInTheDocument();
    });
  });

  describe('Reference Field Enhancements', () => {
    test('should render reference field', () => {
      const config: Partial<SmartFieldConfig> = {
        name: 'مدیر',
        englishName: 'manager',
        baseType: BaseFieldType.REFERENCE,
        enhancements: [],
        isRequired: false,
        order: 1
      };

      render(<PreviewStep {...baseProps} config={config} />);
      
      // Should show reference field preview
      expect(screen.getByText('مدیر')).toBeInTheDocument();
    });
  });
});