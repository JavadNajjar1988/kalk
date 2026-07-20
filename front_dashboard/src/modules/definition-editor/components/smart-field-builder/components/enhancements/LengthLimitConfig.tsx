import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  Slider,
  Alert
} from '@mui/material';

interface LengthLimitConfigData {
  min?: number;
  max?: number;
  showCounter: boolean;
  warningThreshold: number;
}

interface LengthLimitConfigProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: LengthLimitConfigData) => void;
  initialConfig?: LengthLimitConfigData;
}

const LengthLimitConfig: React.FC<LengthLimitConfigProps> = ({
  open,
  onClose,
  onSave,
  initialConfig
}) => {
  const [config, setConfig] = useState<LengthLimitConfigData>({
    min: undefined,
    max: undefined,
    showCounter: true,
    warningThreshold: 80,
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

    if (config.min !== undefined && config.min < 0) {
      newErrors.min = 'حداقل طول نمی‌تواند منفی باشد';
    }

    if (config.max !== undefined && config.max < 1) {
      newErrors.max = 'حداکثر طول باید حداقل 1 باشد';
    }

    if (config.min !== undefined && config.max !== undefined && config.min > config.max) {
      newErrors.range = 'حداقل طول نمی‌تواند بیشتر از حداکثر طول باشد';
    }

    if (config.warningThreshold < 1 || config.warningThreshold > 100) {
      newErrors.warningThreshold = 'آستانه هشدار باید بین 1 تا 100 باشد';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfigChange = (field: keyof LengthLimitConfigData, value: any) => {
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
        min: undefined,
        max: undefined,
        showCounter: true,
        warningThreshold: 80
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
        <Typography variant="h6">تنظیمات محدودیت طول</Typography>
        <Typography variant="body2" color="text.secondary">
          حداقل و حداکثر طول متن قابل ورود را تعیین کنید
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="حداقل طول"
              type="number"
              value={config.min ?? ''}
              onChange={(e) => handleConfigChange('min', e.target.value ? parseInt(e.target.value) : undefined)}
              fullWidth
              error={!!errors.min}
              helperText={errors.min || 'حداقل تعداد کاراکتر مجاز (اختیاری)'}
              inputProps={{ min: 0 }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label="حداکثر طول"
              type="number"
              value={config.max ?? ''}
              onChange={(e) => handleConfigChange('max', e.target.value ? parseInt(e.target.value) : undefined)}
              fullWidth
              error={!!errors.max}
              helperText={errors.max || 'حداکثر تعداد کاراکتر مجاز (اختیاری)'}
              inputProps={{ min: 1 }}
            />
          </Grid>
          
          {errors.range && (
            <Grid item xs={12}>
              <Alert severity="error">{errors.range}</Alert>
            </Grid>
          )}

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.showCounter}
                  onChange={(e) => handleConfigChange('showCounter', e.target.checked)}
                />
              }
              label="نمایش شمارنده کاراکتر"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              آستانه هشدار ({config.warningThreshold}%)
            </Typography>
            <Slider
              value={config.warningThreshold}
              onChange={(_, value) => handleConfigChange('warningThreshold', value)}
              min={1}
              max={100}
              step={5}
              marks={[
                { value: 25, label: '25%' },
                { value: 50, label: '50%' },
                { value: 75, label: '75%' },
                { value: 100, label: '100%' }
              ]}
              valueLabelDisplay="auto"
              sx={{ mt: 2 }}
            />
            <Typography variant="caption" color="text.secondary">
              هنگامی که طول متن به این درصد از حداکثر برسد، هشدار نمایش داده می‌شود
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* پیش‌نمایش */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            پیش‌نمایش:
          </Typography>
          <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
            <TextField
              placeholder="نمونه متن برای تست محدودیت طول"
              fullWidth
              variant="outlined"
              size="small"
              disabled
            />
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {config.min !== undefined && `حداقل: ${config.min} کاراکتر`}
                {config.min !== undefined && config.max !== undefined && ' | '}
                {config.max !== undefined && `حداکثر: ${config.max} کاراکتر`}
              </Typography>
              {config.showCounter && (
                <Typography variant="caption" color="text.secondary">
                  0 / {config.max || '∞'}
                </Typography>
              )}
            </Box>
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

export default LengthLimitConfig;