import React, { useMemo } from 'react';
import { CalendarMonth } from '@mui/icons-material';
import { InputAdornment, TextField } from '@mui/material';
import DatePicker, { DateObject } from 'react-multi-date-picker';
import TimePicker from 'react-multi-date-picker/plugins/time_picker';
import gregorian from 'react-date-object/calendars/gregorian';
import persian from 'react-date-object/calendars/persian';
import persianFa from 'react-date-object/locales/persian_fa';

interface PersianCalendarFieldProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  dateOnly?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: React.ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
}

const pad = (value: number) => String(value).padStart(2, '0');

function parseLocalValue(value?: string) {
  if (!value) return undefined;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!match) return undefined;
  const [, year, month, day, hour = '0', minute = '0'] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute)
  );
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toLocalValue(dateObject: DateObject, dateOnly: boolean) {
  const gregorianDate = new DateObject(dateObject).convert(gregorian).toDate();
  const date = `${gregorianDate.getFullYear()}-${pad(
    gregorianDate.getMonth() + 1
  )}-${pad(gregorianDate.getDate())}`;
  if (dateOnly) return date;
  return `${date}T${pad(gregorianDate.getHours())}:${pad(
    gregorianDate.getMinutes()
  )}`;
}

const PersianCalendarField: React.FC<PersianCalendarFieldProps> = ({
  label,
  value,
  onChange,
  dateOnly = false,
  required,
  error,
  helperText,
  disabled,
  fullWidth = true,
}) => {
  const calendarValue = useMemo(() => {
    const parsed = parseLocalValue(value);
    if (!parsed) return null;
    return new DateObject({ date: parsed, calendar: gregorian }).convert(
      persian
    );
  }, [value]);

  return (
    <DatePicker
      value={calendarValue}
      calendar={persian}
      locale={persianFa}
      format={dateOnly ? 'YYYY/MM/DD' : 'YYYY/MM/DD HH:mm'}
      calendarPosition="bottom-right"
      editable={false}
      disabled={disabled}
      plugins={
        dateOnly
          ? []
          : [<TimePicker key="time" position="bottom" hideSeconds />]
      }
      containerStyle={{ width: fullWidth ? '100%' : undefined }}
      onChange={selectedDate => {
        if (!selectedDate) {
          onChange('');
          return;
        }
        onChange(toLocalValue(selectedDate, dateOnly));
      }}
      render={(displayValue, openCalendar) => (
        <TextField
          fullWidth={fullWidth}
          label={`${label} (شمسی)`}
          value={displayValue}
          onClick={openCalendar}
          required={required}
          error={error}
          helperText={helperText}
          disabled={disabled}
          inputProps={{
            readOnly: true,
            inputMode: 'none',
            'aria-label': `${label} شمسی`,
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

export default PersianCalendarField;
