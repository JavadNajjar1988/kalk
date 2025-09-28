import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  Alert
} from '@mui/material';

interface FreeTextConfigData {
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
  showSuggestions: boolean;
  suggestionLimit: number;
  allowOnlySuggestions: boolean;
}

interface FreeTextConfigProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: FreeTextConfigData) => void;
  initialConfig?: FreeTextConfigData;
}

const FreeTextConfig: React.FC<FreeTextConfigProps> = ({
  open,
  onClose,
  onSave,
  initialConfig
}) => {
  const [config, setConfig] = useState<FreeTextConfigData>({
    minLength: undefined,
    maxLength: undefined,
    placeholder: '',
    showSuggestions: true,
    suggestionLimit: 5,
    allowOnlySuggestions: false,
    ...initialConfig
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialConfig) {
      setConfig({ ...initialConfig });
    }
  }, [initialConfig]);

  const validateConfig = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (config.minLength !== undefined && config.minLength < 0) {
      newErrors.minLength = 'حداقل طول نمی‌تواند منفی باشد';
    }

    if (config.maxLength !== undefined && config.maxLength < 1) {
      newErrors.maxLength = 'حداکثر طول باید حداقل 1 باشد';
    }

    if (config.minLength !== undefined && config.maxLength !== undefined && config.minLength > config.maxLength) {
      newErrors.range = 'حداقل طول نمی‌تواند بیشتر از حداکثر طول باشد';
    }

    if (config.suggestionLimit < 1) {
      newErrors.suggestionLimit = 'حداکثر تعداد پیشنهاد باید حداقل 1 باشد';
    }

    if (config.suggestionLimit > 20) {
      newErrors.suggestionLimit = 'حداکثر تعداد پیشنهاد نمی‌تواند بیشتر از 20 باشد';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfigChange = (field: keyof FreeTextConfigData, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value === '' ? undefined : value
    }));
  };

  const handleSave = () => {
    if (validateConfig()) {
      onSave(config);
      onClose();
    }
  };

  const handleCancel = () => {
    // Reset to initial config
    if (initialConfig) {
      setConfig({ ...initialConfig });
    } else {
      setConfig({
        minLength: undefined,
        maxLength: undefined,
        placeholder: '',
        showSuggestions: true,
        suggestionLimit: 5,
        allowOnlySuggestions: false
      });
    }
    setErrors({});
    onClose();
  };

  useEffect(() => {
    validateConfig();
  }, [config]);

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">تنظیمات متن آزاد</Typography>
        <Typography variant="body2" color="text.secondary">
          پیکربندی ورود متن دلخواه در کنار انتخاب از مرجع
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 3 }}>
          این قابلیت به کاربران اجازه می‌دهد تا علاوه بر انتخاب از مرجع، متن دلخواهی وارد کنند.
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="حداقل طول (اختیاری)"
              type="number"
              value={config.minLength ?? ''}
              onChange={(e) => handleConfigChange('minLength', e.target.value === '' ? undefined : parseInt(e.target.value))}
              fullWidth
              error={!!errors.minLength}
              helperText={errors.minLength || 'حداقل تعداد کاراکترهای مجاز'}
              inputProps={{ min: 0 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="حداکثر طول (اختیاری)"
              type="number"
              value={config.maxLength ?? ''}
              onChange={(e) => handleConfigChange('maxLength', e.target.value === '' ? undefined : parseInt(e.target.value))}
              fullWidth
              error={!!errors.maxLength}
              helperText={errors.maxLength || 'حداکثر تعداد کاراکترهای مجاز'}
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="متن راهنما (Placeholder)"
              value={config.placeholder || ''}
              onChange={(e) => handleConfigChange('placeholder', e.target.value)}
              fullWidth
              helperText="متن راهنمایی که در فیلد خالی نمایش داده می‌شود"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.showSuggestions}
                  onChange={(e) => handleConfigChange('showSuggestions', e.target.checked)}
                />
              }
              label="نمایش پیشنهادها"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="حداکثر پیشنهاد"
              type="number"
              value={config.suggestionLimit}
              onChange={(e) => handleConfigChange('suggestionLimit', parseInt(e.target.value) || 1)}
              fullWidth
              error={!!errors.suggestionLimit}
              helperText={errors.suggestionLimit || 'حداکثر تعداد پیشنهادهای نمایش داده شده'}
              inputProps={{ min: 1, max: 20 }}
              disabled={!config.showSuggestions}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.allowOnlySuggestions}
                  onChange={(e) => handleConfigChange('allowOnlySuggestions', e.target.checked)}
                />
              }
              label="فقط پیشنهادهای مجاز"
            />
          </Grid>
        </Grid>

        {errors.range && (
          <Alert severity="error" sx={{ mt: 2 }}>{errors.range}</Alert>
        )}

        <Divider sx={{ my: 3 }} />

        {/* پیش‌نمایش */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            پیش‌نمایش:
          </Typography>
          <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
            <TextField
              placeholder={config.placeholder || 'متن دلخواه خود را وارد کنید'}
              fullWidth
              variant="outlined"
              size="small"
              disabled
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {config.minLength !== undefined ? `حداقل ${config.minLength} کاراکتر` : 'بدون حداقل طول'}
              {config.maxLength !== undefined && `، حداکثر ${config.maxLength} کاراکتر`}
              {config.showSuggestions && `، حداکثر ${config.suggestionLimit} پیشنهاد`}
            </Typography>
          </Paper>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleCancel} color="inherit">
          انصراف
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={Object.keys(errors).length > 0}
        >
          ذخیره تنظیمات
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FreeTextConfig;