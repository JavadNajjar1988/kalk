import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { vi } from 'vitest';
import TemplateCustomizer from '../components/templates/TemplateCustomizer';
import { SmartFieldConfig, BaseFieldType } from '../types/smartFieldTypes';

// Create a simple mock theme for testing
const mockTheme = createTheme({
  direction: 'rtl',
  palette: {
    mode: 'light',
    primary: {
      main: '#4CAF50'
    }
  }
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={mockTheme}>
      {component}
    </ThemeProvider>
  );
};

const mockTemplate: SmartFieldConfig = {
  id: 'test-field',
  name: 'فیلد تست',
  englishName: 'testField',
  baseType: BaseFieldType.TEXT,
  enhancements: [],
  validation: [],
  isRequired: false,
  order: 1
};

describe('TemplateCustomizer', () => {
  const defaultProps = {
    template: mockTemplate,
    onSave: vi.fn(),
    onCancel: vi.fn(),
    existingFields: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render template customization interface', () => {
    renderWithProviders(<TemplateCustomizer {...defaultProps} />);
    
    expect(screen.getByText('سفارشی‌سازی قالب')).toBeInTheDocument();
    expect(screen.getByText('فیلد تست')).toBeInTheDocument();
  });

  it('should handle field editing', async () => {
    renderWithProviders(<TemplateCustomizer {...defaultProps} />);
    
    // Click edit button
    const editButton = screen.getByLabelText('ویرایش فیلد');
    fireEvent.click(editButton);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('فیلد تست')).toBeInTheDocument();
    });
  });

  it('should validate field names', async () => {
    renderWithProviders(<TemplateCustomizer {...defaultProps} />);
    
    // Enter edit mode
    const editButton = screen.getByLabelText('ویرایش فیلد');
    fireEvent.click(editButton);
    
    // Clear the name field
    const nameInput = screen.getByDisplayValue('فیلد تست');
    fireEvent.change(nameInput, { target: { value: '' } });
    
    // Try to save
    const saveButton = screen.getByText('ذخیره');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('نام فیلد الزامی است')).toBeInTheDocument();
    });
  });

  it('should validate English names', async () => {
    renderWithProviders(<TemplateCustomizer {...defaultProps} />);
    
    // Enter edit mode
    const editButton = screen.getByLabelText('ویرایش فیلد');
    fireEvent.click(editButton);
    
    // Enter invalid English name
    const englishNameInput = screen.getByDisplayValue('testField');
    fireEvent.change(englishNameInput, { target: { value: '123invalid' } });
    
    // Try to save
    const saveButton = screen.getByText('ذخیره');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('نام انگلیسی باید با حرف شروع شود')).toBeInTheDocument();
    });
  });

  it('should handle field type changes', async () => {
    renderWithProviders(<TemplateCustomizer {...defaultProps} />);
    
    // Enter edit mode
    const editButton = screen.getByLabelText('ویرایش فیلد');
    fireEvent.click(editButton);
    
    // Change field type
    const typeSelect = screen.getByDisplayValue('متن');
    fireEvent.change(typeSelect, { target: { value: BaseFieldType.NUMBER } });
    
    await waitFor(() => {
      expect(typeSelect).toHaveValue(BaseFieldType.NUMBER);
    });
  });

  it('should handle required field toggle', async () => {
    renderWithProviders(<TemplateCustomizer {...defaultProps} />);
    
    // Enter edit mode
    const editButton = screen.getByLabelText('ویرایش فیلد');
    fireEvent.click(editButton);
    
    // Toggle required switch
    const requiredSwitch = screen.getByRole('checkbox');
    fireEvent.click(requiredSwitch);
    
    await waitFor(() => {
      expect(requiredSwitch).toBeChecked();
    });
  });

  it('should handle adding new fields', async () => {
    renderWithProviders(<TemplateCustomizer {...defaultProps} />);
    
    // Click add field button
    const addButton = screen.getByText('افزودن فیلد جدید');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('فیلد جدید')).toBeInTheDocument();
    });
  });

  it('should handle removing fields', async () => {
    const multiFieldTemplate = [mockTemplate, { ...mockTemplate, id: 'field2', name: 'فیلد دوم' }];
    
    renderWithProviders(
      <TemplateCustomizer {...defaultProps} template={multiFieldTemplate} />
    );
    
    // Click delete button for first field
    const deleteButtons = screen.getAllByLabelText('حذف فیلد');
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(screen.queryByText('فیلد تست')).not.toBeInTheDocument();
    });
  });

  it('should handle enhancement selection', async () => {
    renderWithProviders(<TemplateCustomizer {...defaultProps} />);
    
    // Enter edit mode
    const editButton = screen.getByLabelText('ویرایش فیلد');
    fireEvent.click(editButton);
    
    // Click on an enhancement chip
    const enhancementChip = screen.getByText('validation');
    fireEvent.click(enhancementChip);
    
    await waitFor(() => {
      expect(enhancementChip).toHaveClass('MuiChip-filled');
    });
  });

  it('should save customized template', async () => {
    const onSave = vi.fn();
    renderWithProviders(
      <TemplateCustomizer {...defaultProps} onSave={onSave} />
    );
    
    // Click save button
    const saveButton = screen.getByText('ذخیره قالب سفارشی‌شده');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith([expect.objectContaining({
        id: expect.stringContaining('test-field'),
        name: 'فیلد تست'
      })]);
    });
  });

  it('should handle cancel', () => {
    const onCancel = vi.fn();
    renderWithProviders(
      <TemplateCustomizer {...defaultProps} onCancel={onCancel} />
    );
    
    // Click cancel button
    const cancelButton = screen.getByText('انصراف');
    fireEvent.click(cancelButton);
    
    expect(onCancel).toHaveBeenCalled();
  });

  it('should detect duplicate English names', async () => {
    const existingFields = [
      { id: 'existing', englishName: 'testField', baseType: BaseFieldType.TEXT }
    ];
    
    renderWithProviders(
      <TemplateCustomizer {...defaultProps} existingFields={existingFields} />
    );
    
    // Enter edit mode
    const editButton = screen.getByLabelText('ویرایش فیلد');
    fireEvent.click(editButton);
    
    // Try to save with duplicate name
    const saveButton = screen.getByText('ذخیره');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('این نام انگلیسی قبلاً استفاده شده است')).toBeInTheDocument();
    });
  });

  it('should disable save when no fields exist', () => {
    const emptyTemplate: SmartFieldConfig[] = [];
    
    renderWithProviders(
      <TemplateCustomizer {...defaultProps} template={emptyTemplate} />
    );
    
    const saveButton = screen.getByText('ذخیره قالب سفارشی‌شده');
    expect(saveButton).toBeDisabled();
  });

  it('should show field validation errors in view mode', async () => {
    renderWithProviders(<TemplateCustomizer {...defaultProps} />);
    
    // Enter edit mode and create error
    const editButton = screen.getByLabelText('ویرایش فیلد');
    fireEvent.click(editButton);
    
    // Clear name to create error
    const nameInput = screen.getByDisplayValue('فیلد تست');
    fireEvent.change(nameInput, { target: { value: '' } });
    
    // Exit edit mode to show error in view
    const saveButton = screen.getByText('ذخیره');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('نام فیلد الزامی است')).toBeInTheDocument();
    });
  });

  it('should handle multiple field template', () => {
    const multiFieldTemplate = [
      mockTemplate,
      { ...mockTemplate, id: 'field2', name: 'فیلد دوم', englishName: 'secondField' }
    ];
    
    renderWithProviders(
      <TemplateCustomizer {...defaultProps} template={multiFieldTemplate} />
    );
    
    expect(screen.getByText('فیلد تست')).toBeInTheDocument();
    expect(screen.getByText('فیلد دوم')).toBeInTheDocument();
  });
});