import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  alpha,
} from '@mui/material';
import PersianCalendarField from '@/components/common/PersianCalendarField';
import type {
  NewScenarioFormData,
  NewScenarioFormErrors,
} from '../types/new-scenario';

type TimeFields = Pick<
  NewScenarioFormData,
  'timeZone' | 'year' | 'month' | 'day' | 'hour' | 'minute'
>;

interface ScenarioTimeSettingsFormProps {
  formData: TimeFields;
  errors: Pick<
    NewScenarioFormErrors,
    'timeZone' | 'year' | 'month' | 'day' | 'hour' | 'minute'
  >;
  onFieldChange: (field: keyof TimeFields, value: string | number) => void;
  resDateTime: { format: () => string };
}

const pad = (value: number) => String(value).padStart(2, '0');

const ScenarioTimeSettingsForm: React.FC<ScenarioTimeSettingsFormProps> = ({
  formData,
  errors,
  onFieldChange,
}) => {
  const theme = useTheme();
  const value = useMemo(
    () =>
      `${formData.year}-${pad(formData.month)}-${pad(formData.day)}T${pad(
        formData.hour
      )}:${pad(formData.minute)}`,
    [
      formData.day,
      formData.hour,
      formData.minute,
      formData.month,
      formData.year,
    ]
  );

  const handleChange = (nextValue: string) => {
    const match = nextValue.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
    if (!match) return;

    const [, year, month, day, hour, minute] = match;
    onFieldChange('year', Number(year));
    onFieldChange('month', Number(month));
    onFieldChange('day', Number(day));
    onFieldChange('hour', Number(hour));
    onFieldChange('minute', Number(minute));
  };

  const helperText =
    errors.year ||
    errors.month ||
    errors.day ||
    errors.hour ||
    errors.minute ||
    'تاریخ به شمسی نمایش داده می‌شود و هنگام ذخیره به ISO 8601 تبدیل خواهد شد.';

  return (
    <Card
      sx={{
        mb: 3,
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.background.paper,
          0.9
        )} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            component="h3"
            sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}
          >
            زمان شروع سناریو
          </Typography>
          <Typography variant="body2" color="text.secondary">
            تاریخ و ساعت شروع را با تقویم شمسی انتخاب کنید.
          </Typography>
        </Box>

        <PersianCalendarField
          label="تاریخ و ساعت شروع (شمسی)"
          value={value}
          onChange={handleChange}
          error={Boolean(
            errors.year ||
              errors.month ||
              errors.day ||
              errors.hour ||
              errors.minute
          )}
          helperText={helperText}
          required
        />
      </CardContent>
    </Card>
  );
};

export default ScenarioTimeSettingsForm;
