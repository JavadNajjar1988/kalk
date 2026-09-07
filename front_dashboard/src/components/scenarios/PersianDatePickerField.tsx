import React, { useMemo } from 'react';
import { CalendarMonth } from '@mui/icons-material';
import { InputAdornment, TextField } from '@mui/material';
import DatePicker, { DateObject } from 'react-multi-date-picker';
import gregorian from 'react-date-object/calendars/gregorian';
import persian from 'react-date-object/calendars/persian';
import persianFa from 'react-date-object/locales/persian_fa';
import { persianToGregorianDate } from './scenarioDateTime';

interface PersianDatePickerFieldProps {
  year: number;
  month: number;
  day: number;
  onChange: (date: { year: number; month: number; day: number }) => void;
  error?: boolean;
  helperText?: string;
}

const PersianDatePickerField: React.FC<PersianDatePickerFieldProps> = ({
  year,
  month,
  day,
  onChange,
  error,
  helperText,
}) => {
  const value = useMemo(
    () =>
      new DateObject({
        calendar: gregorian,
        year,
        month,
        day,
      }).convert(persian),
    [day, month, year]
  );

  return (
    <DatePicker
      value={value}
      calendar={persian}
      locale={persianFa}
      format="YYYY/MM/DD"
      calendarPosition="bottom-right"
      editable={false}
      mapDays={({ date }) => ({
        'aria-label': `انتخاب ${date.format('dddd DD MMMM YYYY')}`,
      })}
      containerStyle={{ width: '100%' }}
      onChange={(selectedDate) => {
        if (!selectedDate) return;
        onChange(persianToGregorianDate({
          year: selectedDate.year,
          month: selectedDate.month.number,
          day: selectedDate.day,
        }));
      }}
      render={(displayValue, openCalendar) => (
        <TextField
          fullWidth
          label="تاریخ شروع (شمسی)"
          value={displayValue}
          onClick={openCalendar}
          error={error}
          helperText={helperText || 'تاریخ در سرور به ISO 8601 و UTC تبدیل می‌شود'}
          inputProps={{
            readOnly: true,
            inputMode: 'none',
            'aria-label': 'تاریخ شروع شمسی',
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <CalendarMonth color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ cursor: 'pointer', '& input': { cursor: 'pointer' } }}
        />
      )}
    />
  );
};

export default PersianDatePickerField;
