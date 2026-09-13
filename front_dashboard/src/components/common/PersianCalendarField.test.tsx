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
  expect(screen.getByRole('button', { name: 'ماه بعد' })).toHaveClass(
    'rmdp-right'
  );
  expect(screen.getByRole('button', { name: 'ماه قبل' })).toHaveClass(
    'rmdp-left'
  );
  expect(screen.getAllByLabelText(/^انتخاب /).length).toBeGreaterThan(20);
});

it('navigates from Farvardin to the previous Persian year', () => {
  render(
    <PersianCalendarField
      label="تاریخ آزمایشی"
      value="2025-03-21"
      dateOnly
      onChange={vi.fn()}
    />
  );

  fireEvent.click(screen.getByLabelText('تاریخ آزمایشی شمسی'));
  fireEvent.click(screen.getByRole('button', { name: 'ماه قبل' }));

  expect(
    screen.getAllByLabelText(/انتخاب .* اسفند ۱۴۰۳/).length
  ).toBeGreaterThan(20);
});

it('allows navigating back to Persian year 1345', () => {
  render(
    <PersianCalendarField
      label="تاریخ آزمایشی"
      value="2025-03-21"
      dateOnly
      onChange={vi.fn()}
    />
  );

  fireEvent.click(screen.getByLabelText('تاریخ آزمایشی شمسی'));
  fireEvent.click(screen.getAllByText('۱۴۰۴')[0]);

  for (let page = 0; page < 5; page += 1) {
    fireEvent.click(screen.getByRole('button', { name: 'ماه قبل' }));
  }

  expect(screen.getByText('۱۳۴۵')).toBeInTheDocument();
});
