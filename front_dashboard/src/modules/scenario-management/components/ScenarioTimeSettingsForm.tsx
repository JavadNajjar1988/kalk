/**
 * ScenarioTimeSettingsForm Component
 * فرم تنظیمات زمان سناریو
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  alpha,
  Chip
} from '@mui/material';
// import { timeZonesNames } from '@vvo/tzdb';
// Using simple timezone list for now
const commonTimeZones = [
  'UTC',
  'Asia/Tehran',
  'Europe/London', 
  'America/New_York',
  'Europe/Berlin',
  'Asia/Shanghai',
  'Asia/Tokyo'
];
import type { NewScenarioFormData, NewScenarioFormErrors } from '../types/new-scenario';

interface ScenarioTimeSettingsFormProps {
  formData: Pick<NewScenarioFormData, 'timeZone' | 'year' | 'month' | 'day' | 'hour' | 'minute'>;
  errors: Pick<NewScenarioFormErrors, 'timeZone' | 'year' | 'month' | 'day' | 'hour' | 'minute'>;
  onFieldChange: (field: keyof Pick<NewScenarioFormData, 'timeZone' | 'year' | 'month' | 'day' | 'hour' | 'minute'>, value: string | number) => void;
  resDateTime: { format: () => string };
}

const ScenarioTimeSettingsForm: React.FC<ScenarioTimeSettingsFormProps> = ({
  formData,
  errors,
  onFieldChange,
  resDateTime
}) => {
  const theme = useTheme();
  
  // Available timezones (common ones for now)
  const timeZonesWithUtc = React.useMemo(() => commonTimeZones, []);
  
  return (
    <Card 
      sx={{ 
        mb: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="h6" 
            component="h3"
            sx={{ 
              fontWeight: 600,
              color: theme.palette.text.primary,
              mb: 1
            }}
          >
            زمان شروع سناریو
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ lineHeight: 1.6 }}
          >
            زمان شروع و منطقه زمانی را انتخاب کنید.
          </Typography>
        </Box>
        
        {/* Form Fields */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Timezone Selector */}
          <FormControl fullWidth error={!!errors.timeZone}>
            <InputLabel>منطقه زمانی</InputLabel>
            <Select
              value={formData.timeZone}
              onChange={(e) => onFieldChange('timeZone', e.target.value)}
              label="منطقه زمانی"
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300,
                  },
                },
              }}
            >
              {timeZonesWithUtc.map((tz) => (
                <MenuItem key={tz} value={tz}>
                  {tz}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Date Fields */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="سال"
                type="number"
                value={formData.year}
                onChange={(e) => onFieldChange('year', parseInt(e.target.value) || new Date().getFullYear())}
                error={!!errors.year}
                helperText={errors.year}
                variant="outlined"
                fullWidth
                inputProps={{ min: 1900, max: 2100 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="ماه"
                type="number"
                value={formData.month}
                onChange={(e) => onFieldChange('month', parseInt(e.target.value) || 1)}
                error={!!errors.month}
                helperText={errors.month}
                variant="outlined"
                fullWidth
                inputProps={{ min: 1, max: 12 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="روز"
                type="number"
                value={formData.day}
                onChange={(e) => onFieldChange('day', parseInt(e.target.value) || 1)}
                error={!!errors.day}
                helperText={errors.day}
                variant="outlined"
                fullWidth
                inputProps={{ min: 1, max: 31 }}
              />
            </Grid>
          </Grid>
          
          {/* Time Fields */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="ساعت"
                type="number"
                value={formData.hour}
                onChange={(e) => onFieldChange('hour', parseInt(e.target.value) || 0)}
                error={!!errors.hour}
                helperText={errors.hour}
                variant="outlined"
                fullWidth
                inputProps={{ min: 0, max: 23 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="دقیقه"
                type="number"
                value={formData.minute}
                onChange={(e) => onFieldChange('minute', parseInt(e.target.value) || 0)}
                error={!!errors.minute}
                helperText={errors.minute}
                variant="outlined"
                fullWidth
                inputProps={{ min: 0, max: 59 }}
              />
            </Grid>
          </Grid>
          
          {/* DateTime Preview */}
          <Box 
            sx={{ 
              p: 2, 
              bgcolor: alpha(theme.palette.info.main, 0.1),
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              پیش‌نمایش زمان:
            </Typography>
            <Chip 
              label={resDateTime.format()}
              color="info"
              variant="outlined"
              sx={{ 
                fontFamily: 'monospace',
                fontWeight: 500,
                fontSize: '0.875rem'
              }}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ScenarioTimeSettingsForm;