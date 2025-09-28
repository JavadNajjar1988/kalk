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
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  Alert,
  FormControlLabel,
  Switch,
  InputAdornment
} from '@mui/material';

interface DecimalConfigData {
  places: number;
  separator: '.' | ',';
  thousandsSeparator?: ',' | '.' | ' ';
  allowNegative?: boolean;
  displayLeadingZeros?: boolean;
}

interface DecimalConfigProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: DecimalConfigData) => void;
  initialConfig?: DecimalConfigData;
}

const DecimalConfig: React.FC<DecimalConfigProps> = ({
  open,
  onClose,
  onSave,
  initialConfig
}) => {
  const [config, setConfig] = useState<DecimalConfigData>(() => ({
    places: 2,
    separator: '.',
    thousandsSeparator: ',',
    allowNegative: true,
    displayLeadingZeros: false,
    ...(initialConfig || {})
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateConfig = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (config.places < 0) {
      newErrors.places = 'تعداد اعشار نمی‌تواند منفی باشد';
    }

    if (config.places > 10) {
      newErrors.places = 'تعداد اعشار نمی‌تواند بیشتر از 10 باشد';
    }

    if (config.separator === config.thousandsSeparator && config.thousandsSeparator) {
      newErrors.separator = 'جداکننده اعشار و هزارگان نمی‌تواند یکسان باشد';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfigChange = (field: keyof DecimalConfigData, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
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
        places: 2,
        separator: '.',
        thousandsSeparator: ',',
        allowNegative: true,
        displayLeadingZeros: false
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
        پیکربندی اعداد اعشاری
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            تنظیمات نمایش و اعتبارسنجی اعداد اعشاری را تعریف کنید
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="تعداد اعشار"
                type="number"
                value={config.places}
                onChange={(e) => handleConfigChange('places', Number(e.target.value))}
                error={!!errors.places}
                helperText={errors.places || 'تعداد ارقام اعشار'}
                inputProps={{ min: 0, max: 10 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.separator}>
                <InputLabel>جداکننده اعشار</InputLabel>
                <Select
                  value={config.separator || '.'} // Ensure default value
                  label="جداکننده اعشار"
                  onChange={(e) => handleConfigChange('separator', e.target.value as '.' | ',')}
                >
                  <MenuItem value=".">نقطه (.)</MenuItem>
                  <MenuItem value=",">کاما (,)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>جداکننده هزارگان</InputLabel>
                <Select
                  value={config.thousandsSeparator || ''} // Ensure default value
                  label="جداکننده هزارگان"
                  onChange={(e) => handleConfigChange('thousandsSeparator', e.target.value || undefined)}
                >
                  <MenuItem value="">بدون جداکننده</MenuItem>
                  <MenuItem value=",">کاما (,)</MenuItem>
                  <MenuItem value=".">نقطه (.)</MenuItem>
                  <MenuItem value=" ">فاصله</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.allowNegative}
                      onChange={(e) => handleConfigChange('allowNegative', e.target.checked)}
                    />
                  }
                  label="پذیرش اعداد منفی"
                />
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.displayLeadingZeros}
                    onChange={(e) => handleConfigChange('displayLeadingZeros', e.target.checked)}
                  />
                }
                label="نمایش صفرهای پیشین"
              />
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            پیش‌نمایش:
          </Typography>
          
          <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                label="مثال"
                value={
                  config.thousandsSeparator 
                    ? `1${config.thousandsSeparator}234${config.separator}${'0'.repeat(config.places)}`
                    : `1234${config.separator}${'0'.repeat(config.places)}`
                }
                InputProps={{
                  startAdornment: config.allowNegative ? <InputAdornment position="start">-</InputAdornment> : null,
                }}
                fullWidth
                disabled
              />
              
              <Typography variant="body2" color="text.secondary">
                {config.places} رقم اعشار
              </Typography>
            </Box>
            
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              {config.thousandsSeparator 
                ? `جداکننده هزارگان: ${config.thousandsSeparator === ' ' ? 'فاصله' : config.thousandsSeparator}`
                : 'بدون جداکننده هزارگان'}
              <br />
              {config.allowNegative ? 'پذیرش اعداد منفی' : 'فقط اعداد مثبت'}
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

export default DecimalConfig;