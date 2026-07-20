import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { vi } from 'vitest';
import BaseTypeStep from '../components/wizard/steps/BaseTypeStep';
import { BaseFieldType } from '../types/smartFieldTypes';

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

describe('BaseTypeStep', () => {
  const defaultProps = {
    config: {},
    onConfigUpdate: vi.fn(),
    fieldContext: {
      categoryType: 'test',
      existingFields: [],
      usagePatterns: {},
      currentCategory: 'test-category'
    },
    errors: {},
    editingField: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all base field types', () => {
    renderWithProviders(<BaseTypeStep {...defaultProps} />);
    
    expect(screen.getByText('انتخاب نوع پایه فیلد')).toBeInTheDocument();
    expect(screen.getByText('متن')).toBeInTheDocument();
    expect(screen.getByText('عدد')).toBeInTheDocument();
    expect(screen.getByText('انتخابی')).toBeInTheDocument();
    expect(screen.getByText('مرجع')).toBeInTheDocument();
  });

  it('should call onConfigUpdate when field type is selected', () => {
    const onConfigUpdate = vi.fn();
    renderWithProviders(
      <BaseTypeStep {...defaultProps} onConfigUpdate={onConfigUpdate} />
    );
    
    // Click on text field type
    const textTypeCard = screen.getByText('متن').closest('div');
    fireEvent.click(textTypeCard!);
    
    expect(onConfigUpdate).toHaveBeenCalledWith({
      baseType: BaseFieldType.TEXT
    });
  });

  it('should highlight selected field type', () => {
    renderWithProviders(
      <BaseTypeStep {...defaultProps} config={{ baseType: BaseFieldType.TEXT }} />
    );
    
    const textTypeCard = screen.getByText('متن').closest('[data-selected="true"]');
    expect(textTypeCard).toBeInTheDocument();
  });

  it('should show context-aware suggestions', () => {
    const contextWithPatterns = {
      ...defaultProps.fieldContext,
      usagePatterns: {
        [BaseFieldType.TEXT]: 5,
        [BaseFieldType.NUMBER]: 2
      }
    };
    
    renderWithProviders(
      <BaseTypeStep 
        {...defaultProps} 
        fieldContext={contextWithPatterns}
      />
    );
    
    // Should show "پرکاربرد" badge for text type
    expect(screen.getByText('پرکاربرد')).toBeInTheDocument();
  });

  it('should display validation errors', () => {
    renderWithProviders(
      <BaseTypeStep 
        {...defaultProps} 
        errors={{ baseType: 'انتخاب نوع فیلد الزامی است' }}
      />
    );
    
    expect(screen.getByText('انتخاب نوع فیلد الزامی است')).toBeInTheDocument();
  });

  it('should be accessible with keyboard navigation', async () => {
    renderWithProviders(<BaseTypeStep {...defaultProps} />);
    
    const textTypeCard = screen.getByText('متن').closest('div');
    
    // Focus the card
    textTypeCard!.focus();
    
    // Press Enter
    fireEvent.keyDown(textTypeCard!, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      expect(defaultProps.onConfigUpdate).toHaveBeenCalledWith({
        baseType: BaseFieldType.TEXT
      });
    });
  });

  it('should show appropriate descriptions for each field type', () => {
    renderWithProviders(<BaseTypeStep {...defaultProps} />);
    
    expect(screen.getByText('ورود متن ساده، رشته‌ها و محتوای متنی')).toBeInTheDocument();
    expect(screen.getByText('ورود اعداد صحیح، اعشاری و محاسبات')).toBeInTheDocument();
    expect(screen.getByText('انتخاب از گزینه‌های از پیش تعریف شده')).toBeInTheDocument();
    expect(screen.getByText('ارجاع به سایر دسته‌ها یا منابع خارجی')).toBeInTheDocument();
  });
});