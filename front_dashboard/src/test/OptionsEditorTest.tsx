import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OptionsEditor } from '../modules/definition-editor/components/fields/properties/OptionsEditor';

describe('OptionsEditor', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('should render with empty options', () => {
    render(
      <OptionsEditor
        options={[]}
        onChange={mockOnChange}
        fieldType="select"
      />
    );

    expect(screen.getByText('مدیریت گزینه‌ها')).toBeInTheDocument();
    expect(screen.getByText('هیچ گزینه‌ای تعریف نشده است')).toBeInTheDocument();
  });

  it('should render with string options', () => {
    const options = ['Option 1', 'Option 2', 'Option 3'];
    
    render(
      <OptionsEditor
        options={options}
        onChange={mockOnChange}
        fieldType="select"
      />
    );

    options.forEach(option => {
      expect(screen.getByText(option)).toBeInTheDocument();
    });
  });

  it('should render with object options', () => {
    const options = [
      { id: '1', value: 'opt1', label: 'Option 1' },
      { id: '2', value: 'opt2', label: 'Option 2' },
    ];
    
    render(
      <OptionsEditor
        options={options}
        onChange={mockOnChange}
        fieldType="select"
      />
    );

    options.forEach(option => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
  });

  it('should add new option', async () => {
    const user = userEvent.setup();
    
    render(
      <OptionsEditor
        options={[]}
        onChange={mockOnChange}
        fieldType="select"
      />
    );

    const input = screen.getByLabelText('گزینه جدید');
    const addButton = screen.getByText('افزودن گزینه');

    await user.type(input, 'New Option');
    await user.click(addButton);

    expect(mockOnChange).toHaveBeenCalledWith([
      {
        id: expect.any(String),
        value: 'New Option',
        label: 'New Option',
      }
    ]);
  });

  it('should remove option', async () => {
    const user = userEvent.setup();
    const options = ['Option 1', 'Option 2'];
    
    render(
      <OptionsEditor
        options={options}
        onChange={mockOnChange}
        fieldType="select"
      />
    );

    const deleteButtons = screen.getAllByLabelText('حذف گزینه');
    await user.click(deleteButtons[0]);

    expect(mockOnChange).toHaveBeenCalledWith(['Option 2']);
  });

  it('should show message for unsupported field types', () => {
    render(
      <OptionsEditor
        options={[]}
        onChange={mockOnChange}
        fieldType="number"
      />
    );

    expect(screen.getByText('این نوع فیلد یا نمایش از گزینه‌ها پشتیبانی نمی‌کند')).toBeInTheDocument();
  });

  it('should handle bulk import', async () => {
    const user = userEvent.setup();
    
    render(
      <OptionsEditor
        options={[]}
        onChange={mockOnChange}
        fieldType="select"
      />
    );

    const bulkInput = screen.getByPlaceholderText(/هر گزینه را در یک خط بنویسید/);
    const bulkButton = screen.getByText('درج گروهی');

    await user.type(bulkInput, 'Option 1\nOption 2\nOption 3');
    await user.click(bulkButton);

    expect(mockOnChange).toHaveBeenCalledWith([
      {
        id: expect.any(String),
        value: 'Option 1',
        label: 'Option 1',
      },
      {
        id: expect.any(String),
        value: 'Option 2',
        label: 'Option 2',
      },
      {
        id: expect.any(String),
        value: 'Option 3',
        label: 'Option 3',
      }
    ]);
  });

  it('should handle bulk import with value:label format', async () => {
    const user = userEvent.setup();
    
    render(
      <OptionsEditor
        options={[]}
        onChange={mockOnChange}
        fieldType="select"
      />
    );

    const bulkInput = screen.getByPlaceholderText(/هر گزینه را در یک خط بنویسید/);
    const bulkButton = screen.getByText('درج گروهی');

    await user.type(bulkInput, 'opt1:Option 1\nopt2:Option 2');
    await user.click(bulkButton);

    expect(mockOnChange).toHaveBeenCalledWith([
      {
        id: expect.any(String),
        value: 'opt1',
        label: 'Option 1',
      },
      {
        id: expect.any(String),
        value: 'opt2',
        label: 'Option 2',
      }
    ]);
  });
});