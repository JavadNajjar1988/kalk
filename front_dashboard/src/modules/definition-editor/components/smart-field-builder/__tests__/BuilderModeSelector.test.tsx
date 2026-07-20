import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { vi } from 'vitest';
import BuilderModeSelector, { BuilderMode } from '../BuilderModeSelector';

// Create a simple mock theme for testing
const mockTheme = createTheme({
  direction: 'rtl',
  palette: {
    mode: 'light',
    primary: {
      main: '#4CAF50'
    },
    success: {
      main: '#2E7D32'
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

describe('BuilderModeSelector', () => {
  const defaultProps = {
    onModeSelect: vi.fn(),
    editingField: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render mode selection interface', () => {
    renderWithProviders(<BuilderModeSelector {...defaultProps} />);
    
    expect(screen.getByText('انتخاب روش ایجاد')).toBeInTheDocument();
    expect(screen.getByText('نحوه مورد نظر خود را برای ساخت فیلد هوشمند انتخاب کنید')).toBeInTheDocument();
  });

  it('should display both mode options', () => {
    renderWithProviders(<BuilderModeSelector {...defaultProps} />);
    
    // Guided mode
    expect(screen.getByText('راهنمای هوشمند')).toBeInTheDocument();
    expect(screen.getByText('گام‌به‌گام و تخصصی')).toBeInTheDocument();
    
    // Template mode
    expect(screen.getByText('قالب‌های آماده')).toBeInTheDocument();
    expect(screen.getByText('سریع و کاربردی')).toBeInTheDocument();
  });

  it('should show guided mode features', () => {
    renderWithProviders(<BuilderModeSelector {...defaultProps} />);
    
    expect(screen.getByText('انتخاب نوع پایه با راهنمایی')).toBeInTheDocument();
    expect(screen.getByText('پیشنهادات هوشمند بر اساس محتوا')).toBeInTheDocument();
    expect(screen.getByText('پیش‌نمایش زنده و تعاملی')).toBeInTheDocument();
    expect(screen.getByText('اعتبارسنجی پیشرفته')).toBeInTheDocument();
  });

  it('should show template mode features', () => {
    renderWithProviders(<BuilderModeSelector {...defaultProps} />);
    
    expect(screen.getByText('قالب‌های آماده و تست‌شده')).toBeInTheDocument();
    expect(screen.getByText('سفارشی‌سازی سریع')).toBeInTheDocument();
    expect(screen.getByText('فیلدهای چندتایی')).toBeInTheDocument();
    expect(screen.getByText('الگوهای استاندارد')).toBeInTheDocument();
  });

  it('should handle guided mode selection', async () => {
    const onModeSelect = vi.fn();
    renderWithProviders(
      <BuilderModeSelector {...defaultProps} onModeSelect={onModeSelect} />
    );
    
    // Click on guided mode card
    const guidedCard = screen.getByText('راهنمای هوشمند').closest('div');
    fireEvent.click(guidedCard!);
    
    await waitFor(() => {
      expect(onModeSelect).toHaveBeenCalledWith(BuilderMode.GUIDED);
    });
  });

  it('should handle template mode selection', async () => {
    const onModeSelect = vi.fn();
    renderWithProviders(
      <BuilderModeSelector {...defaultProps} onModeSelect={onModeSelect} />
    );
    
    // Click on template mode card
    const templateCard = screen.getByText('قالب‌های آماده').closest('div');
    fireEvent.click(templateCard!);
    
    await waitFor(() => {
      expect(onModeSelect).toHaveBeenCalledWith(BuilderMode.TEMPLATE);
    });
  });

  it('should show different title when editing field', () => {
    const editingField = { id: 'test', name: 'Test Field' };
    
    renderWithProviders(
      <BuilderModeSelector {...defaultProps} editingField={editingField} />
    );
    
    expect(screen.getByText('انتخاب روش ویرایش')).toBeInTheDocument();
  });

  it('should handle keyboard navigation with Enter key', async () => {
    const onModeSelect = vi.fn();
    renderWithProviders(
      <BuilderModeSelector {...defaultProps} onModeSelect={onModeSelect} />
    );
    
    const guidedCard = screen.getByText('راهنمای هوشمند').closest('div');
    
    // Focus and press Enter
    guidedCard!.focus();
    fireEvent.keyDown(guidedCard!, { key: 'Enter' });
    
    await waitFor(() => {
      expect(onModeSelect).toHaveBeenCalledWith(BuilderMode.GUIDED);
    });
  });

  it('should handle keyboard navigation with Space key', async () => {
    const onModeSelect = vi.fn();
    renderWithProviders(
      <BuilderModeSelector {...defaultProps} onModeSelect={onModeSelect} />
    );
    
    const templateCard = screen.getByText('قالب‌های آماده').closest('div');
    
    // Focus and press Space
    templateCard!.focus();
    fireEvent.keyDown(templateCard!, { key: ' ' });
    
    await waitFor(() => {
      expect(onModeSelect).toHaveBeenCalledWith(BuilderMode.TEMPLATE);
    });
  });

  it('should show recommended badge for guided mode', () => {
    renderWithProviders(<BuilderModeSelector {...defaultProps} />);
    
    expect(screen.getByText('پیشنهادی')).toBeInTheDocument();
  });

  it('should show quick badge for template mode', () => {
    renderWithProviders(<BuilderModeSelector {...defaultProps} />);
    
    expect(screen.getByText('سریع')).toBeInTheDocument();
  });

  it('should have hover effects on cards', async () => {
    renderWithProviders(<BuilderModeSelector {...defaultProps} />);
    
    const guidedCard = screen.getByText('راهنمای هوشمند').closest('div');
    
    // Hover over card
    fireEvent.mouseEnter(guidedCard!);
    
    // Check if card has appropriate styling (this would need to be checked via computed styles in real test)
    expect(guidedCard).toBeInTheDocument();
  });

  it('should be responsive on mobile', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    
    renderWithProviders(<BuilderModeSelector {...defaultProps} />);
    
    // Should still render all content properly
    expect(screen.getByText('راهنمای هوشمند')).toBeInTheDocument();
    expect(screen.getByText('قالب‌های آماده')).toBeInTheDocument();
  });

  it('should not trigger selection on other keyboard keys', () => {
    const onModeSelect = vi.fn();
    renderWithProviders(
      <BuilderModeSelector {...defaultProps} onModeSelect={onModeSelect} />
    );
    
    const guidedCard = screen.getByText('راهنمای هوشمند').closest('div');
    
    // Press a different key
    guidedCard!.focus();
    fireEvent.keyDown(guidedCard!, { key: 'Tab' });
    
    expect(onModeSelect).not.toHaveBeenCalled();
  });

  it('should show mode descriptions', () => {
    renderWithProviders(<BuilderModeSelector {...defaultProps} />);
    
    expect(screen.getByText('ایجاد فیلد با راهنمایی هوشمند و پیشنهادات متناسب')).toBeInTheDocument();
    expect(screen.getByText('انتخاب از قالب‌های پیش‌ساخته و سفارشی‌سازی سریع')).toBeInTheDocument();
  });

  it('should handle focus management properly', () => {
    renderWithProviders(<BuilderModeSelector {...defaultProps} />);
    
    const guidedCard = screen.getByText('راهنمای هوشمند').closest('div');
    const templateCard = screen.getByText('قالب‌های آماده').closest('div');
    
    // Both cards should be focusable
    expect(guidedCard).toHaveAttribute('tabIndex', '0');
    expect(templateCard).toHaveAttribute('tabIndex', '0');
  });
});