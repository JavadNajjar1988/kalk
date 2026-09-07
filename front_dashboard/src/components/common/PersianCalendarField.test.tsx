import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import PersianCalendarField from './PersianCalendarField';

it('shows a stored standard date in the Persian calendar', () => {
  const onChange = vi.fn();
  render(
    <PersianCalendarField
      label="تاریخ آزمایشی"
      value="2025-03-21"
      dateOnly
      onChange={onChange}
    />
  );

  expect(screen.getByLabelText('تاریخ آزمایشی شمسی')).toHaveValue(
    '۱۴۰۴/۰۱/۰۱'
  );

  fireEvent.click(screen.getByLabelText('تاریخ آزمایشی شمسی'));
  fireEvent.click(screen.getByLabelText(/انتخاب .*۰۲ فروردین ۱۴۰۴/));
  expect(onChange).toHaveBeenCalledWith('2025-03-22');
});

it('keeps an empty field visibly empty and localizes calendar controls', () => {
  function ControlledEmptyField() {
    const [value, setValue] = useState('');
    return (
      <PersianCalendarField
        label="تاریخ آزمایشی"
        value={value}
        dateOnly
        onChange={setValue}
      />
    );
  }

  render(<ControlledEmptyField />);

  const input = screen.getByLabelText('تاریخ آزمایشی شمسی');
  fireEvent.click(input);

  expect(input).toHaveValue('');
  expect(screen.getByRole('button', { name: 'ماه بعد' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'ماه قبل' })).toBeInTheDocument();
  expect(screen.getAllByLabelText(/^انتخاب /).length).toBeGreaterThan(20);
});
