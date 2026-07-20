import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { vi } from 'vitest';
import TemplateSelector from '../TemplateSelector';
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

// Mock templates data
const mockTemplates = [
  {
    id: 'full-name',
    name: 'نام کامل',
    description: 'نام و نام خانوادگی شخص',
    category: 'personal',
    icon: 'PersonIcon',
    color: '#4CAF50',
    fields: [
      {
        id: 'first_name',
        name: 'نام',
        englishName: 'firstName',
        baseType: BaseFieldType.TEXT,
        enhancements: [],
        validation: [],
        isRequired: true,
        order: 1
      } as SmartFieldConfig
    ]
  }
];

// Mock the template data
vi.mock('../data/templateData', () => ({
  templateCategories: [
    { id: 'personal', name: 'اطلاعات شخصی', icon: 'PersonIcon', color: '#4CAF50' }
  ],
  templates: mockTemplates
}));

describe('TemplateSelector', () => {
  const defaultProps = {
    onTemplateSelect: vi.fn(),
    existingFields: [],
    categoryContext: 'test-category',
    editingField: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render template selection interface', () => {
    renderWithProviders(<TemplateSelector {...defaultProps} />);
    
    expect(screen.getByText('انتخاب قالب آماده')).toBeInTheDocument();
    expect(screen.getByText('دسته‌بندی‌ها')).toBeInTheDocument();
  });

  it('should display template categories', () => {
    renderWithProviders(<TemplateSelector {...defaultProps} />);
    
    expect(screen.getByText('اطلاعات شخصی')).toBeInTheDocument();
  });

  it('should filter templates by category', async () => {
    renderWithProviders(<TemplateSelector {...defaultProps} />);
    
    // Click on personal category
    const personalCategory = screen.getByText('اطلاعات شخصی');
    fireEvent.click(personalCategory);
    
    await waitFor(() => {
      expect(screen.getByText('نام کامل')).toBeInTheDocument();
    });
  });

  it('should handle template selection', async () => {
    const onTemplateSelect = vi.fn();
    renderWithProviders(
      <TemplateSelector {...defaultProps} onTemplateSelect={onTemplateSelect} />
    );
    
    // Select personal category first
    const personalCategory = screen.getByText('اطلاعات شخصی');
    fireEvent.click(personalCategory);
    
    await waitFor(() => {
      const templateCard = screen.getByText('نام کامل');
      fireEvent.click(templateCard);
    });
    
    expect(onTemplateSelect).toHaveBeenCalled();
  });

  it('should show template search functionality', () => {
    renderWithProviders(<TemplateSelector {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('جستجوی قالب...');
    expect(searchInput).toBeInTheDocument();
  });

  it('should filter templates by search term', async () => {
    renderWithProviders(<TemplateSelector {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('جستجوی قالب...');
    fireEvent.change(searchInput, { target: { value: 'نام' } });
    
    await waitFor(() => {
      expect(screen.getByText('نام کامل')).toBeInTheDocument();
    });
  });

  it('should show template preview on hover', async () => {
    renderWithProviders(<TemplateSelector {...defaultProps} />);
    
    // Select personal category
    const personalCategory = screen.getByText('اطلاعات شخصی');
    fireEvent.click(personalCategory);
    
    await waitFor(() => {
      const templateCard = screen.getByText('نام کامل').closest('div');
      fireEvent.mouseEnter(templateCard!);
    });
    
    expect(screen.getByText('پیش‌نمایش قالب')).toBeInTheDocument();
  });

  it('should handle empty state when no templates match search', async () => {
    renderWithProviders(<TemplateSelector {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('جستجوی قالب...');
    fireEvent.change(searchInput, { target: { value: 'نتیجه‌ای یافت نشد' } });
    
    await waitFor(() => {
      expect(screen.getByText('قالبی یافت نشد')).toBeInTheDocument();
    });
  });

  it('should show sorting options', () => {
    renderWithProviders(<TemplateSelector {...defaultProps} />);
    
    expect(screen.getByText('مرتب‌سازی:')).toBeInTheDocument();
    expect(screen.getByText('جدیدترین')).toBeInTheDocument();
  });

  it('should handle sorting change', async () => {
    renderWithProviders(<TemplateSelector {...defaultProps} />);
    
    const sortSelect = screen.getByDisplayValue('جدیدترین');
    fireEvent.change(sortSelect, { target: { value: 'popularity' } });
    
    await waitFor(() => {
      expect(sortSelect).toHaveValue('popularity');
    });
  });

  it('should be accessible with keyboard navigation', async () => {
    renderWithProviders(<TemplateSelector {...defaultProps} />);
    
    const personalCategory = screen.getByText('اطلاعات شخصی');
    
    // Focus and press Enter
    personalCategory.focus();
    fireEvent.keyDown(personalCategory, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText('نام کامل')).toBeInTheDocument();
    });
  });

  it('should show template complexity indicators', async () => {
    renderWithProviders(<TemplateSelector {...defaultProps} />);
    
    // Select personal category
    const personalCategory = screen.getByText('اطلاعات شخصی');
    fireEvent.click(personalCategory);
    
    await waitFor(() => {
      expect(screen.getByText('ساده')).toBeInTheDocument();
    });
  });

  it('should handle template favoriting', async () => {
    renderWithProviders(<TemplateSelector {...defaultProps} />);
    
    // Select personal category
    const personalCategory = screen.getByText('اطلاعات شخصی');
    fireEvent.click(personalCategory);
    
    await waitFor(() => {
      const favoriteButton = screen.getByLabelText('افزودن به علاقه‌مندی‌ها');
      fireEvent.click(favoriteButton);
    });
    
    expect(screen.getByLabelText('حذف از علاقه‌مندی‌ها')).toBeInTheDocument();
  });

  it('should show validation errors for duplicate fields', () => {
    const existingFields = [
      {
        id: 'existing_name',
        englishName: 'firstName',
        baseType: BaseFieldType.TEXT
      }
    ];
    
    renderWithProviders(
      <TemplateSelector {...defaultProps} existingFields={existingFields} />
    );
    
    // Should show warning about field conflicts
    expect(screen.getByText('تداخل فیلد')).toBeInTheDocument();
  });
});