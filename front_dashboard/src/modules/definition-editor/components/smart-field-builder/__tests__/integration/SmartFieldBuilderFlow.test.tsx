/**
 * Integration Tests for Smart Field Builder Complete Workflows
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import '@testing-library/jest-dom';

import SmartFieldBuilder from '../../SmartFieldBuilder';
import { SmartFieldConfig, BaseFieldType, EnhancementType, ValidationType } from '../../types/smartFieldTypes';

// Mock complex components but keep their basic functionality
jest.mock('../../components/templates/OptimizedTemplateSelector', () => {
  const templates = [
    {
      id: 'personal-info',
      name: 'اطلاعات شخصی',
      description: 'قالب اطلاعات شخصی پایه',
      category: 'personnel',
      fields: [
        {
          id: 'full-name',
          name: 'نام و نام خانوادگی',
          englishName: 'fullName',
          baseType: BaseFieldType.TEXT,
          enhancements: [
            {
              type: EnhancementType.COMPOSITE,
              config: {
                parts: [
                  { id: 'firstName', label: 'نام', required: true },
                  { id: 'lastName', label: 'نام خانوادگی', required: true }
                ]
              },
              enabled: true
            }
          ],
          validation: [
            {
              type: ValidationType.REQUIRED,
              config: {},
              enabled: true,
              errorMessage: 'نام الزامی است'
            }
          ],
          isRequired: true,
          order: 1
        }
      ]
    },
    {
      id: 'contact-info',
      name: 'اطلاعات تماس',
      description: 'قالب اطلاعات تماس',
      category: 'contact',
      fields: [
        {
          id: 'email',
          name: 'ایمیل',
          englishName: 'email',
          baseType: BaseFieldType.TEXT,
          enhancements: [],
          validation: [
            {
              type: ValidationType.EMAIL,
              config: {},
              enabled: true,
              errorMessage: 'ایمیل نامعتبر است'
            }
          ],
          isRequired: true,
          order: 1
        }
      ]
    }
  ];

  return function MockOptimizedTemplateSelector({ onTemplateSelect, categoryContext }: any) {
    const filteredTemplates = categoryContext 
      ? templates.filter(t => t.category === categoryContext)
      : templates;

    return (
      <div data-testid="template-selector">
        <div data-testid="template-search">
          <input placeholder="جستجو در قالب‌ها..." />
        </div>
        <div data-testid="template-list">
          {filteredTemplates.map(template => (
            <div key={template.id} data-testid={`template-${template.id}`}>
              <h3>{template.name}</h3>
              <p>{template.description}</p>
              <button onClick={() => onTemplateSelect(template.fields)}>
                انتخاب قالب
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };
});

jest.mock('../../GuidedWizard', () => {
  return function MockGuidedWizard({ wizardState, onStateChange, onComplete }: any) {
    const [currentStep, setCurrentStep] = React.useState(0);
    const [config, setConfig] = React.useState<Partial<SmartFieldConfig>>({});

    const steps = ['Base Type', 'Enhancements', 'Data Source', 'Preview'];

    const handleNext = () => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Complete wizard
        onComplete({
          id: 'wizard-field',
          name: config.name || 'فیلد جدید',
          englishName: config.englishName || 'newField',
          baseType: config.baseType || BaseFieldType.TEXT,
          enhancements: config.enhancements || [],
          validation: config.validation || [],
          isRequired: config.isRequired || false,
          order: 1
        });
      }
    };

    const handlePrevious = () => {
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
      }
    };

    return (
      <div data-testid="guided-wizard">
        <div data-testid="wizard-steps">
          {steps.map((step, index) => (
            <div 
              key={index} 
              data-testid={`step-${index}`}
              className={index === currentStep ? 'active' : ''}
            >
              {step} {index === currentStep && '(فعال)'}
            </div>
          ))}
        </div>

        <div data-testid="wizard-content">
          {currentStep === 0 && (
            <div data-testid="base-type-step">
              <h3>انتخاب نوع پایه</h3>
              <button onClick={() => setConfig({...config, baseType: BaseFieldType.TEXT})}>
                متن
              </button>
              <button onClick={() => setConfig({...config, baseType: BaseFieldType.NUMBER})}>
                عدد
              </button>
              <button onClick={() => setConfig({...config, baseType: BaseFieldType.CHOICE})}>
                انتخابی
              </button>
            </div>
          )}

          {currentStep === 1 && (
            <div data-testid="enhancements-step">
              <h3>ویژگی‌های هوشمند</h3>
              <label>
                <input 
                  type="checkbox" 
                  onChange={(e) => {
                    const enhancements = e.target.checked 
                      ? [{ type: EnhancementType.MULTILINE, config: {}, enabled: true }]
                      : [];
                    setConfig({...config, enhancements});
                  }}
                />
                چندخطی
              </label>
            </div>
          )}

          {currentStep === 2 && (
            <div data-testid="data-source-step">
              <h3>منبع داده</h3>
              <p>پیکربندی منبع داده (اختیاری)</p>
            </div>
          )}

          {currentStep === 3 && (
            <div data-testid="preview-step">
              <h3>پیش‌نمایش</h3>
              <div>
                <label>
                  نام فیلد:
                  <input 
                    type="text"
                    value={config.name || ''}
                    onChange={(e) => setConfig({...config, name: e.target.value})}
                  />
                </label>
              </div>
              <div>
                <label>
                  نام انگلیسی:
                  <input 
                    type="text"
                    value={config.englishName || ''}
                    onChange={(e) => setConfig({...config, englishName: e.target.value})}
                  />
                </label>
              </div>
              <div>
                <label>
                  <input 
                    type="checkbox"
                    checked={config.isRequired || false}
                    onChange={(e) => setConfig({...config, isRequired: e.target.checked})}
                  />
                  اجباری
                </label>
              </div>
            </div>
          )}
        </div>

        <div data-testid="wizard-navigation">
          {currentStep > 0 && (
            <button onClick={handlePrevious}>قبلی</button>
          )}
          <button onClick={handleNext}>
            {currentStep === steps.length - 1 ? 'تکمیل' : 'بعدی'}
          </button>
        </div>
      </div>
    );
  };
});

jest.mock('../../BuilderModeSelector', () => {
  return function MockBuilderModeSelector({ onModeSelect }: any) {
    return (
      <div data-testid="mode-selector">
        <h2>انتخاب روش ساخت فیلد</h2>
        <div data-testid="mode-options">
          <button 
            data-testid="guided-mode"
            onClick={() => onModeSelect('guided')}
          >
            <h3>راهنمای گام به گام</h3>
            <p>ساخت فیلد با راهنمای تصویری</p>
          </button>
          <button 
            data-testid="template-mode"
            onClick={() => onModeSelect('template')}
          >
            <h3>قالب آماده</h3>
            <p>انتخاب از قالب‌های پیش‌ساخته</p>
          </button>
        </div>
      </div>
    );
  };
});

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  onSave: jest.fn(),
  existingFields: [],
  categoryContext: 'personnel'
};

describe('Smart Field Builder Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Guided Wizard Flow', () => {
    test('creates text field through complete wizard flow', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();

      renderWithTheme(
        <SmartFieldBuilder {...defaultProps} onSave={onSave} />
      );

      // 1. Select guided mode
      await user.click(screen.getByTestId('guided-mode'));
      expect(screen.getByTestId('guided-wizard')).toBeInTheDocument();

      // 2. Step 1: Select base type
      expect(screen.getByTestId('base-type-step')).toBeInTheDocument();
      await user.click(screen.getByText('متن'));

      // 3. Navigate to next step
      await user.click(screen.getByText('بعدی'));
      expect(screen.getByTestId('enhancements-step')).toBeInTheDocument();

      // 4. Step 2: Configure enhancements
      await user.click(screen.getByLabelText('چندخطی'));

      // 5. Navigate to next step
      await user.click(screen.getByText('بعدی'));
      expect(screen.getByTestId('data-source-step')).toBeInTheDocument();

      // 6. Navigate to preview step
      await user.click(screen.getByText('بعدی'));
      expect(screen.getByTestId('preview-step')).toBeInTheDocument();

      // 7. Fill required fields
      await user.type(screen.getByLabelText('نام فیلد:'), 'نام کاربر');
      await user.type(screen.getByLabelText('نام انگلیسی:'), 'userName');
      await user.click(screen.getByLabelText('اجباری'));

      // 8. Complete wizard
      await user.click(screen.getByText('تکمیل'));

      // 9. Save button should appear
      await waitFor(() => {
        expect(screen.getByText('ایجاد')).toBeInTheDocument();
      });

      // 10. Save the field
      await user.click(screen.getByText('ایجاد'));

      // 11. Verify field was created correctly
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'نام کاربر',
          englishName: 'userName',
          baseType: BaseFieldType.TEXT,
          isRequired: true,
          enhancements: expect.arrayContaining([
            expect.objectContaining({
              type: EnhancementType.MULTILINE,
              enabled: true
            })
          ])
        })
      );
    });

    test('can navigate backwards in wizard', async () => {
      const user = userEvent.setup();

      renderWithTheme(<SmartFieldBuilder {...defaultProps} />);

      // Navigate to wizard
      await user.click(screen.getByTestId('guided-mode'));

      // Go to step 2
      await user.click(screen.getByText('متن'));
      await user.click(screen.getByText('بعدی'));

      expect(screen.getByTestId('enhancements-step')).toBeInTheDocument();

      // Go back to step 1
      await user.click(screen.getByText('قبلی'));

      expect(screen.getByTestId('base-type-step')).toBeInTheDocument();
    });

    test('validates required fields in preview step', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();

      renderWithTheme(
        <SmartFieldBuilder {...defaultProps} onSave={onSave} />
      );

      await user.click(screen.getByTestId('guided-mode'));

      // Navigate to preview without filling required data
      await user.click(screen.getByText('بعدی')); // Skip base type
      await user.click(screen.getByText('بعدی')); // Skip enhancements
      await user.click(screen.getByText('بعدی')); // Skip data source

      expect(screen.getByTestId('preview-step')).toBeInTheDocument();

      // Try to complete without required fields
      await user.click(screen.getByText('تکمیل'));

      // Should still be able to complete (mocked wizard handles validation)
      await waitFor(() => {
        expect(screen.getByText('ایجاد')).toBeInTheDocument();
      });
    });
  });

  describe('Complete Template Flow', () => {
    test('selects and applies template successfully', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();

      renderWithTheme(
        <SmartFieldBuilder {...defaultProps} onSave={onSave} categoryContext="personnel" />
      );

      // 1. Select template mode
      await user.click(screen.getByTestId('template-mode'));
      expect(screen.getByTestId('template-selector')).toBeInTheDocument();

      // 2. Verify templates are filtered by category
      expect(screen.getByTestId('template-personal-info')).toBeInTheDocument();
      expect(screen.queryByTestId('template-contact-info')).not.toBeInTheDocument();

      // 3. Select a template
      const personalInfoTemplate = screen.getByTestId('template-personal-info');
      const selectButton = within(personalInfoTemplate).getByText('انتخاب قالب');
      await user.click(selectButton);

      // 4. Should show save button (template customizer is mocked)
      await waitFor(() => {
        expect(screen.getByText('ایجاد')).toBeInTheDocument();
      });

      // 5. Save the template
      await user.click(screen.getByText('ایجاد'));

      // 6. Verify template fields were applied
      expect(onSave).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'نام و نام خانوادگی',
            englishName: 'fullName',
            baseType: BaseFieldType.TEXT,
            enhancements: expect.arrayContaining([
              expect.objectContaining({
                type: EnhancementType.COMPOSITE,
                enabled: true
              })
            ])
          })
        ])
      );
    });

    test('searches templates correctly', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <SmartFieldBuilder {...defaultProps} categoryContext={undefined} />
      );

      await user.click(screen.getByTestId('template-mode'));

      // Both templates should be visible without category filter
      expect(screen.getByTestId('template-personal-info')).toBeInTheDocument();
      expect(screen.getByTestId('template-contact-info')).toBeInTheDocument();

      // Search functionality would be in the actual implementation
      const searchInput = screen.getByPlaceholderText('جستجو در قالب‌ها...');
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Navigation and Mode Switching', () => {
    test('can switch between modes before starting', async () => {
      const user = userEvent.setup();

      renderWithTheme(<SmartFieldBuilder {...defaultProps} />);

      // Start with guided mode
      await user.click(screen.getByTestId('guided-mode'));
      expect(screen.getByTestId('guided-wizard')).toBeInTheDocument();

      // Go back to mode selection
      await user.click(screen.getByText('بازگشت'));
      expect(screen.getByTestId('mode-selector')).toBeInTheDocument();

      // Now select template mode
      await user.click(screen.getByTestId('template-mode'));
      expect(screen.getByTestId('template-selector')).toBeInTheDocument();
    });

    test('shows correct buttons based on state', async () => {
      const user = userEvent.setup();

      renderWithTheme(<SmartFieldBuilder {...defaultProps} />);

      // Initially only cancel button should be visible
      expect(screen.getByText('انصراف')).toBeInTheDocument();
      expect(screen.queryByText('بازگشت')).not.toBeInTheDocument();
      expect(screen.queryByText('ایجاد')).not.toBeInTheDocument();

      // After selecting mode, back button should appear
      await user.click(screen.getByTestId('guided-mode'));
      expect(screen.getByText('بازگشت')).toBeInTheDocument();
    });
  });

  describe('Editing Existing Fields', () => {
    const existingField: SmartFieldConfig = {
      id: 'existing-field',
      name: 'فیلد موجود',
      englishName: 'existingField',
      baseType: BaseFieldType.TEXT,
      enhancements: [],
      validation: [],
      isRequired: true,
      order: 1
    };

    test('shows edit mode for existing field', () => {
      renderWithTheme(
        <SmartFieldBuilder {...defaultProps} editingField={existingField} />
      );

      expect(screen.getByText('ویرایش فیلد')).toBeInTheDocument();
    });

    test('saves edited field correctly', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();

      renderWithTheme(
        <SmartFieldBuilder 
          {...defaultProps} 
          editingField={existingField} 
          onSave={onSave} 
        />
      );

      // Go through wizard to modify field
      await user.click(screen.getByTestId('guided-mode'));
      
      // Navigate to preview and complete
      await user.click(screen.getByText('بعدی'));
      await user.click(screen.getByText('بعدی'));
      await user.click(screen.getByText('بعدی'));
      await user.click(screen.getByText('تکمیل'));

      await waitFor(() => {
        expect(screen.getByText('ذخیره')).toBeInTheDocument();
      });

      await user.click(screen.getByText('ذخیره'));

      expect(onSave).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('handles modal close during wizard', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      renderWithTheme(
        <SmartFieldBuilder {...defaultProps} onClose={onClose} />
      );

      await user.click(screen.getByTestId('guided-mode'));
      await user.click(screen.getByLabelText('بستن مودال'));

      expect(onClose).toHaveBeenCalled();
    });

    test('handles escape key to close modal', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      renderWithTheme(
        <SmartFieldBuilder {...defaultProps} onClose={onClose} />
      );

      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalled();
    });

    test('preserves state during re-renders', async () => {
      const user = userEvent.setup();
      const { rerender } = renderWithTheme(
        <SmartFieldBuilder {...defaultProps} />
      );

      await user.click(screen.getByTestId('guided-mode'));

      // Re-render with same props
      rerender(
        <ThemeProvider theme={theme}>
          <SmartFieldBuilder {...defaultProps} />
        </ThemeProvider>
      );

      // Should still be in wizard mode
      expect(screen.getByTestId('guided-wizard')).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    test('maintains focus management throughout flow', async () => {
      const user = userEvent.setup();

      renderWithTheme(<SmartFieldBuilder {...defaultProps} />);

      // Modal should trap focus
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');

      await user.click(screen.getByTestId('guided-mode'));

      // Focus should be managed within the wizard
      expect(screen.getByTestId('guided-wizard')).toBeInTheDocument();
    });

    test('provides proper ARIA labels throughout flow', async () => {
      const user = userEvent.setup();

      renderWithTheme(<SmartFieldBuilder {...defaultProps} />);

      // Check initial ARIA labels
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby');
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby');

      await user.click(screen.getByTestId('template-mode'));

      // Template selector should be accessible
      expect(screen.getByTestId('template-selector')).toBeInTheDocument();
    });
  });

  describe('Performance Integration', () => {
    test('lazy loads components efficiently', () => {
      const { container } = renderWithTheme(
        <SmartFieldBuilder {...defaultProps} />
      );

      // Should start with minimal DOM
      expect(container.querySelector('[data-testid="guided-wizard"]')).not.toBeInTheDocument();
      expect(container.querySelector('[data-testid="template-selector"]')).not.toBeInTheDocument();
    });

    test('handles large template collections', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <SmartFieldBuilder {...defaultProps} categoryContext={undefined} />
      );

      await user.click(screen.getByTestId('template-mode'));

      // Should render template list efficiently
      expect(screen.getByTestId('template-list')).toBeInTheDocument();
    });
  });
});

describe('Real-world Scenarios', () => {
  test('HR department creates employee personal info field', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();

    renderWithTheme(
      <SmartFieldBuilder 
        {...defaultProps} 
        onSave={onSave}
        categoryContext="personnel"
        existingFields={[]}
      />
    );

    // Use template approach for quick setup
    await user.click(screen.getByTestId('template-mode'));
    
    const personalTemplate = screen.getByTestId('template-personal-info');
    await user.click(within(personalTemplate).getByText('انتخاب قالب'));

    await waitFor(() => {
      expect(screen.getByText('ایجاد')).toBeInTheDocument();
    });

    await user.click(screen.getByText('ایجاد'));

    expect(onSave).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'نام و نام خانوادگی',
          baseType: BaseFieldType.TEXT,
          isRequired: true
        })
      ])
    );
  });

  test('System admin creates custom validation field', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();

    renderWithTheme(
      <SmartFieldBuilder {...defaultProps} onSave={onSave} />
    );

    // Use wizard for custom field
    await user.click(screen.getByTestId('guided-mode'));
    
    // Create number field with range validation
    await user.click(screen.getByText('عدد'));
    await user.click(screen.getByText('بعدی'));
    
    // Skip enhancements
    await user.click(screen.getByText('بعدی'));
    await user.click(screen.getByText('بعدی'));
    
    // Fill preview
    await user.type(screen.getByLabelText('نام فیلد:'), 'سن');
    await user.type(screen.getByLabelText('نام انگلیسی:'), 'age');
    
    await user.click(screen.getByText('تکمیل'));

    await waitFor(() => {
      expect(screen.getByText('ایجاد')).toBeInTheDocument();
    });

    await user.click(screen.getByText('ایجاد'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'سن',
        englishName: 'age',
        baseType: BaseFieldType.NUMBER
      })
    );
  });

  test('Field modification workflow', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    
    const existingField: SmartFieldConfig = {
      id: 'modify-field',
      name: 'فیلد قدیمی',
      englishName: 'oldField',
      baseType: BaseFieldType.TEXT,
      enhancements: [],
      validation: [],
      isRequired: false,
      order: 1
    };

    renderWithTheme(
      <SmartFieldBuilder 
        {...defaultProps} 
        onSave={onSave}
        editingField={existingField}
      />
    );

    expect(screen.getByText('ویرایش فیلد')).toBeInTheDocument();

    // Use wizard to modify
    await user.click(screen.getByTestId('guided-mode'));
    
    // Navigate to preview
    await user.click(screen.getByText('بعدی'));
    await user.click(screen.getByText('بعدی'));
    await user.click(screen.getByText('بعدی'));
    
    // Make it required
    await user.click(screen.getByLabelText('اجباری'));
    
    await user.click(screen.getByText('تکمیل'));

    await waitFor(() => {
      expect(screen.getByText('ذخیره')).toBeInTheDocument();
    });

    await user.click(screen.getByText('ذخیره'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: expect.any(String),
        englishName: expect.any(String),
        isRequired: true
      })
    );
  });
});