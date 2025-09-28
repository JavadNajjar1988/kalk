import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { vi } from 'vitest';
import EnhancementsStep from '../components/wizard/steps/EnhancementsStep';
import { BaseFieldType, EnhancementType } from '../types/smartFieldTypes';

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

describe('EnhancementsStep', () => {
  const defaultProps = {
    config: {
      baseType: BaseFieldType.TEXT
    },
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

  it('should render enhancement selection interface', () => {
    renderWithProviders(<EnhancementsStep {...defaultProps} />);
    
    expect(screen.getByText('ویژگی‌های هوشمند')).toBeInTheDocument();
    expect(screen.getByText('قابلیت‌های اضافی مورد نظر را انتخاب کنید')).toBeInTheDocument();
  });

  it('should show appropriate enhancements for text fields', () => {
    renderWithProviders(<EnhancementsStep {...defaultProps} />);
    
    // Text field enhancements
    expect(screen.getByText('چندخطی')).toBeInTheDocument();
    expect(screen.getByText('قالب‌بندی')).toBeInTheDocument();
    expect(screen.getByText('ترکیبی')).toBeInTheDocument();
  });

  it('should show different enhancements for number fields', () => {
    renderWithProviders(
      <EnhancementsStep 
        {...defaultProps} 
        config={{ baseType: BaseFieldType.NUMBER }}
      />
    );
    
    // Number field enhancements
    expect(screen.getByText('محدوده')).toBeInTheDocument();
    expect(screen.getByText('واحد')).toBeInTheDocument();
    expect(screen.getByText('اعشار')).toBeInTheDocument();
  });

  it('should show choice field enhancements', () => {
    renderWithProviders(
      <EnhancementsStep 
        {...defaultProps} 
        config={{ baseType: BaseFieldType.CHOICE }}
      />
    );
    
    // Choice field enhancements
    expect(screen.getByText('چندگانه')).toBeInTheDocument();
    expect(screen.getByText('قابل جستجو')).toBeInTheDocument();
    expect(screen.getByText('گروه‌بندی')).toBeInTheDocument();
  });

  it('should show reference field enhancements', () => {
    renderWithProviders(
      <EnhancementsStep 
        {...defaultProps} 
        config={{ baseType: BaseFieldType.REFERENCE }}
      />
    );
    
    // Reference field enhancements
    expect(screen.getByText('سلسله‌مراتبی')).toBeInTheDocument();
    expect(screen.getByText('متن آزاد')).toBeInTheDocument();
    expect(screen.getByText('قابل جستجو')).toBeInTheDocument();
  });

  it('should handle enhancement toggle', async () => {
    const onConfigUpdate = vi.fn();
    renderWithProviders(
      <EnhancementsStep {...defaultProps} onConfigUpdate={onConfigUpdate} />
    );
    
    // Click on multiline enhancement
    const multilineCard = screen.getByText('چندخطی').closest('div');
    fireEvent.click(multilineCard!);
    
    await waitFor(() => {
      expect(onConfigUpdate).toHaveBeenCalledWith({
        enhancements: expect.arrayContaining([
          expect.objectContaining({
            type: EnhancementType.MULTILINE,
            enabled: true
          })
        ])
      });
    });
  });

  it('should handle enhancement removal', async () => {
    const onConfigUpdate = vi.fn();
    const configWithEnhancement = {
      ...defaultProps.config,
      enhancements: [
        { type: EnhancementType.MULTILINE, enabled: true, config: {} }
      ]
    };
    
    renderWithProviders(
      <EnhancementsStep 
        {...defaultProps} 
        config={configWithEnhancement}
        onConfigUpdate={onConfigUpdate}
      />
    );
    
    // Click on already selected multiline enhancement to remove it
    const multilineCard = screen.getByText('چندخطی').closest('div');
    fireEvent.click(multilineCard!);
    
    await waitFor(() => {
      expect(onConfigUpdate).toHaveBeenCalledWith({
        enhancements: []
      });
    });
  });

  it('should show enhancement configuration modal', async () => {
    renderWithProviders(<EnhancementsStep {...defaultProps} />);
    
    // Click configure button on multiline enhancement
    const configureButtons = screen.getAllByText('تنظیم');
    fireEvent.click(configureButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('تنظیمات چندخطی')).toBeInTheDocument();
    });
  });

  it('should show recommended enhancements', () => {
    const contextWithSuggestions = {
      ...defaultProps.fieldContext,
      usagePatterns: {
        [EnhancementType.MULTILINE]: 5
      }
    };
    
    renderWithProviders(
      <EnhancementsStep 
        {...defaultProps}
        fieldContext={contextWithSuggestions}
      />
    );
    
    expect(screen.getByText('پیشنهادی')).toBeInTheDocument();
  });

  it('should handle keyboard navigation', async () => {
    renderWithProviders(<EnhancementsStep {...defaultProps} />);
    
    const multilineCard = screen.getByText('چندخطی').closest('div');
    
    // Focus and press Enter
    multilineCard!.focus();
    fireEvent.keyDown(multilineCard!, { key: 'Enter' });
    
    await waitFor(() => {
      expect(defaultProps.onConfigUpdate).toHaveBeenCalled();
    });
  });

  it('should display validation errors', () => {
    renderWithProviders(
      <EnhancementsStep 
        {...defaultProps}
        errors={{ enhancements: 'حداقل یک ویژگی را انتخاب کنید' }}
      />
    );
    
    expect(screen.getByText('حداقل یک ویژگی را انتخاب کنید')).toBeInTheDocument();
  });

  it('should show enhancement previews', () => {
    const configWithEnhancement = {
      ...defaultProps.config,
      enhancements: [
        { type: EnhancementType.MULTILINE, enabled: true, config: { rows: 3 } }
      ]
    };
    
    renderWithProviders(
      <EnhancementsStep {...defaultProps} config={configWithEnhancement} />
    );
    
    expect(screen.getByText('پیش‌نمایش ویژگی‌های انتخاب‌شده')).toBeInTheDocument();
  });
});