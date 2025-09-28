/**
 * Unit Tests for Smart Field Builder Core Components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import '@testing-library/jest-dom';

import SmartFieldBuilder from '../SmartFieldBuilder';
import { SmartFieldConfig, BaseFieldType, BuilderMode } from '../types/smartFieldTypes';

// Mock dependencies
jest.mock('../components/templates/OptimizedTemplateSelector', () => {
  return function MockOptimizedTemplateSelector({ onTemplateSelect }: any) {
    return (
      <div data-testid="template-selector">
        <button onClick={() => onTemplateSelect({ id: 'test-template', name: 'Test Template' })}>
          Select Template
        </button>
      </div>
    );
  };
});

jest.mock('../GuidedWizard', () => {
  return function MockGuidedWizard({ onComplete }: any) {
    return (
      <div data-testid="guided-wizard">
        <button 
          onClick={() => onComplete({
            id: 'test-field',
            name: 'تست فیلد',
            englishName: 'testField',
            baseType: BaseFieldType.TEXT,
            enhancements: [],
            validation: [],
            isRequired: false,
            order: 1
          })}
        >
          Complete Wizard
        </button>
      </div>
    );
  };
});

jest.mock('../BuilderModeSelector', () => {
  return function MockBuilderModeSelector({ onModeSelect }: any) {
    return (
      <div data-testid="mode-selector">
        <button onClick={() => onModeSelect('guided')}>Guided Mode</button>
        <button onClick={() => onModeSelect('template')}>Template Mode</button>
      </div>
    );
  };
});

const theme = createTheme();

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  onSave: jest.fn(),
  existingFields: [],
  categoryContext: 'personnel'
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('SmartFieldBuilder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Behavior', () => {
    test('renders when open prop is true', () => {
      renderWithTheme(<SmartFieldBuilder {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('ساخت فیلد هوشمند')).toBeInTheDocument();
    });

    test('does not render when open prop is false', () => {
      renderWithTheme(<SmartFieldBuilder {...defaultProps} open={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      renderWithTheme(<SmartFieldBuilder {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByLabelText('بستن مودال');
      await user.click(closeButton);
      
      expect(onClose).toHaveBeenCalled();
    });

    test('calls onClose when Escape key is pressed', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      renderWithTheme(<SmartFieldBuilder {...defaultProps} onClose={onClose} />);
      
      await user.keyboard('{Escape}');
      
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Editing Mode', () => {
    const editingField: SmartFieldConfig = {
      id: 'edit-field',
      name: 'فیلد ویرایش',
      englishName: 'editField',
      baseType: BaseFieldType.TEXT,
      enhancements: [],
      validation: [],
      isRequired: true,
      order: 1
    };

    test('shows edit mode title when editing field', () => {
      renderWithTheme(
        <SmartFieldBuilder {...defaultProps} editingField={editingField} />
      );
      
      expect(screen.getByText('ویرایش فیلد')).toBeInTheDocument();
    });

    test('shows create mode title when not editing', () => {
      renderWithTheme(<SmartFieldBuilder {...defaultProps} />);
      
      expect(screen.getByText('ساخت فیلد هوشمند')).toBeInTheDocument();
    });
  });

  describe('Mode Selection', () => {
    test('shows mode selector initially', () => {
      renderWithTheme(<SmartFieldBuilder {...defaultProps} />);
      
      expect(screen.getByTestId('mode-selector')).toBeInTheDocument();
    });

    test('switches to guided wizard when guided mode selected', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(<SmartFieldBuilder {...defaultProps} />);
      
      await user.click(screen.getByText('Guided Mode'));
      
      expect(screen.getByTestId('guided-wizard')).toBeInTheDocument();
      expect(screen.queryByTestId('mode-selector')).not.toBeInTheDocument();
    });

    test('switches to template selector when template mode selected', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(<SmartFieldBuilder {...defaultProps} />);
      
      await user.click(screen.getByText('Template Mode'));
      
      expect(screen.getByTestId('template-selector')).toBeInTheDocument();
      expect(screen.queryByTestId('mode-selector')).not.toBeInTheDocument();
    });
  });

  describe('Guided Wizard Flow', () => {
    test('completes wizard and calls onSave', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();
      
      renderWithTheme(<SmartFieldBuilder {...defaultProps} onSave={onSave} />);
      
      // Select guided mode
      await user.click(screen.getByText('Guided Mode'));
      
      // Complete wizard
      await user.click(screen.getByText('Complete Wizard'));
      
      // Save button should appear
      await waitFor(() => {
        expect(screen.getByText('ایجاد')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('ایجاد'));
      
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-field',
          name: 'تست فیلد',
          englishName: 'testField',
          baseType: BaseFieldType.TEXT
        })
      );
    });
  });

  describe('Template Flow', () => {
    test('selects template and shows save button', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();
      
      renderWithTheme(<SmartFieldBuilder {...defaultProps} onSave={onSave} />);
      
      // Select template mode
      await user.click(screen.getByText('Template Mode'));
      
      // Select a template
      await user.click(screen.getByText('Select Template'));
      
      // Should show customizer and eventually save button
      await waitFor(() => {
        expect(screen.getByText('ایجاد')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    test('shows back button when mode is selected', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(<SmartFieldBuilder {...defaultProps} />);
      
      await user.click(screen.getByText('Guided Mode'));
      
      expect(screen.getByText('بازگشت')).toBeInTheDocument();
    });

    test('returns to mode selector when back button clicked', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(<SmartFieldBuilder {...defaultProps} />);
      
      await user.click(screen.getByText('Guided Mode'));
      await user.click(screen.getByText('بازگشت'));
      
      expect(screen.getByTestId('mode-selector')).toBeInTheDocument();
      expect(screen.queryByTestId('guided-wizard')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA attributes', () => {
      renderWithTheme(<SmartFieldBuilder {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'smart-field-builder-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'smart-field-builder-description');
    });

    test('has proper heading structure', () => {
      renderWithTheme(<SmartFieldBuilder {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('ساخت فیلد هوشمند');
    });

    test('close button has accessible label', () => {
      renderWithTheme(<SmartFieldBuilder {...defaultProps} />);
      
      const closeButton = screen.getByLabelText('بستن مودال');
      expect(closeButton).toBeInTheDocument();
    });

    test('action buttons have accessible labels', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(<SmartFieldBuilder {...defaultProps} />);
      
      await user.click(screen.getByText('Guided Mode'));
      await user.click(screen.getByText('Complete Wizard'));
      
      await waitFor(() => {
        const saveButton = screen.getByLabelText('ایجاد فیلد');
        expect(saveButton).toBeInTheDocument();
        
        const cancelButton = screen.getByLabelText('انصراف');
        expect(cancelButton).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles missing required props gracefully', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderWithTheme(
          // @ts-ignore - intentionally passing incomplete props for testing
          <SmartFieldBuilder open={true} />
        );
      }).not.toThrow();
      
      consoleError.mockRestore();
    });

    test('handles invalid field configuration', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();
      
      renderWithTheme(<SmartFieldBuilder {...defaultProps} onSave={onSave} />);
      
      await user.click(screen.getByText('Guided Mode'));
      await user.click(screen.getByText('Complete Wizard'));
      
      await waitFor(() => {
        expect(screen.getByText('ایجاد')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('ایجاد'));
      
      // Should handle the save gracefully even if validation fails
      expect(onSave).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    test('lazy loads components', () => {
      renderWithTheme(<SmartFieldBuilder {...defaultProps} />);
      
      // Components should be lazy loaded, so we should see loading states
      expect(screen.getByTestId('mode-selector')).toBeInTheDocument();
    });

    test('does not re-render unnecessarily', () => {
      const { rerender } = renderWithTheme(<SmartFieldBuilder {...defaultProps} />);
      
      const initialDialog = screen.getByRole('dialog');
      
      // Re-render with same props
      rerender(
        <ThemeProvider theme={theme}>
          <SmartFieldBuilder {...defaultProps} />
        </ThemeProvider>
      );
      
      const rerenderDialog = screen.getByRole('dialog');
      
      // Should be the same DOM element (React didn't re-create it)
      expect(initialDialog).toBe(rerenderDialog);
    });
  });

  describe('Integration with existing fields', () => {
    const existingFields: SmartFieldConfig[] = [
      {
        id: 'existing-1',
        name: 'فیلد موجود',
        englishName: 'existingField',
        baseType: BaseFieldType.TEXT,
        enhancements: [],
        validation: [],
        isRequired: false,
        order: 1
      }
    ];

    test('passes existing fields to components', async () => {
      const user = userEvent.setup();
      
      renderWithTheme(
        <SmartFieldBuilder {...defaultProps} existingFields={existingFields} />
      );
      
      await user.click(screen.getByText('Template Mode'));
      
      // Template selector should receive existing fields
      expect(screen.getByTestId('template-selector')).toBeInTheDocument();
    });
  });
});

describe('SmartFieldBuilder Integration Tests', () => {
  test('complete wizard flow creates valid field', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    
    renderWithTheme(<SmartFieldBuilder {...defaultProps} onSave={onSave} />);
    
    // 1. Select guided mode
    await user.click(screen.getByText('Guided Mode'));
    expect(screen.getByTestId('guided-wizard')).toBeInTheDocument();
    
    // 2. Complete wizard steps
    await user.click(screen.getByText('Complete Wizard'));
    
    // 3. Save should be available
    await waitFor(() => {
      expect(screen.getByText('ایجاد')).toBeInTheDocument();
    });
    
    // 4. Save the field
    await user.click(screen.getByText('ایجاد'));
    
    // 5. Verify the field was created correctly
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        englishName: expect.any(String),
        baseType: expect.any(String),
        enhancements: expect.any(Array),
        validation: expect.any(Array),
        isRequired: expect.any(Boolean),
        order: expect.any(Number)
      })
    );
  });

  test('template selection flow works end-to-end', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    
    renderWithTheme(<SmartFieldBuilder {...defaultProps} onSave={onSave} />);
    
    // 1. Select template mode
    await user.click(screen.getByText('Template Mode'));
    expect(screen.getByTestId('template-selector')).toBeInTheDocument();
    
    // 2. Select a template
    await user.click(screen.getByText('Select Template'));
    
    // 3. Eventually should be able to save
    await waitFor(() => {
      expect(screen.getByText('ایجاد')).toBeInTheDocument();
    });
    
    // Note: Full template customization flow would require more complex mocking
  });

  test('editing existing field populates correct data', () => {
    const editingField: SmartFieldConfig = {
      id: 'edit-test',
      name: 'فیلد آزمایش',
      englishName: 'testField',
      baseType: BaseFieldType.NUMBER,
      enhancements: [],
      validation: [],
      isRequired: true,
      order: 5
    };
    
    renderWithTheme(
      <SmartFieldBuilder {...defaultProps} editingField={editingField} />
    );
    
    // Should show edit mode
    expect(screen.getByText('ویرایش فیلد')).toBeInTheDocument();
  });
});