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
  Alert,
  InputAdornment
} from '@mui/material';

interface RangeConfigData {
  min?: number;
  max?: number;
  step?: number;
  showSlider: boolean;
  allowDecimals: boolean;
}

interface RangeConfigProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: RangeConfigData) => void;
  initialConfig?: RangeConfigData;
}

const RangeConfig: React.FC<RangeConfigProps> = ({
  open,
  onClose,
  onSave,
  initialConfig
}) => {
  const [config, setConfig] = useState<RangeConfigData>(() => ({
    min: initialConfig?.min ?? undefined,
    max: initialConfig?.max ?? undefined,
    step: initialConfig?.step ?? 1,
    showSlider: initialConfig?.showSlider ?? true,
    allowDecimals: initialConfig?.allowDecimals ?? false
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateConfig = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (config.min !== undefined && config.max !== undefined && config.min > config.max) {
      newErrors.range = 'حداقل مقدار نمی‌تواند بیشتر از حداکثر مقدار باشد';
    }

    if (config.step !== undefined && config.step <= 0) {
      newErrors.step = 'اندازه گام باید بزرگتر از صفر باشد';
    }

    if (config.step !== undefined && config.min !== undefined && config.max !== undefined) {
      const range = config.max - config.min;
      if (config.step > range) {
        newErrors.step = 'اندازه گام نمی‌تواند بیشتر از محدوده باشد';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfigChange = (field: keyof RangeConfigData, value: any) => {
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
        step: 1,
        showSlider: true,
        allowDecimals: false
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
        پیکربندی محدوده عددی
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            محدوده عددی را برای فیلد تعریف کنید تا کاربر فقط بتواند مقادیر در این محدوده را وارد کند
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="حداقل مقدار"
                type="number"
                value={config.min ?? ''}
                onChange={(e) => handleConfigChange('min', e.target.value === '' ? undefined : Number(e.target.value))}
                error={!!errors.range && config.min !== undefined}
                helperText={errors.range && config.min !== undefined ? errors.range : 'حداقل مقدار مجاز'}
                InputProps={{
                  inputProps: { 
                    step: config.allowDecimals ? 0.1 : 1
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="حداکثر مقدار"
                type="number"
                value={config.max ?? ''}
                onChange={(e) => handleConfigChange('max', e.target.value === '' ? undefined : Number(e.target.value))}
                error={!!errors.range && config.max !== undefined}
                helperText={errors.range && config.max !== undefined ? errors.range : 'حداکثر مقدار مجاز'}
                InputProps={{
                  inputProps: { 
                    step: config.allowDecimals ? 0.1 : 1
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="اندازه گام"
                type="number"
                value={config.step ?? 1}
                onChange={(e) => handleConfigChange('step', e.target.value === '' ? 1 : Number(e.target.value))}
                error={!!errors.step}
                helperText={errors.step || 'افزایش/کاهش به این مقدار'}
                InputProps={{
                  inputProps: { 
                    step: config.allowDecimals ? 0.1 : 1,
                    min: 0.1
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.allowDecimals}
                      onChange={(e) => handleConfigChange('allowDecimals', e.target.checked)}
                    />
                  }
                  label="پذیرش اعداد اعشاری"
                />
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.showSlider}
                    onChange={(e) => handleConfigChange('showSlider', e.target.checked)}
                  />
                }
                label="نمایش نوار لغزنده"
              />
            </Grid>
          </Grid>
          
          {config.showSlider && config.min !== undefined && config.max !== undefined && (
            <>
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                پیش‌نمایش نوار لغزنده:
              </Typography>
              
              <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {config.min}
                  </Typography>
                  
                  <Slider
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    value={config.min + (config.max - config.min) / 2}
                    disabled
                    sx={{ flex: 1 }}
                  />
                  
                  <Typography variant="body2" color="text.secondary">
                    {config.max}
                  </Typography>
                </Box>
                
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  گام: {config.step}
                </Typography>
              </Paper>
            </>
          )}
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

export default RangeConfig;