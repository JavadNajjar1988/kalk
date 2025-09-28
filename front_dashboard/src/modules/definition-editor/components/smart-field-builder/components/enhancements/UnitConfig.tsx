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
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Chip,
  Autocomplete,
  Switch  // Added missing import
} from '@mui/material';

interface UnitConfigData {
  unit: string;
  display: 'before' | 'after';
  conversion?: {
    baseUnit: string;
    factor: number;
  };
  customUnits?: string[];
}

interface UnitConfigProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: UnitConfigData) => void;
  initialConfig?: UnitConfigData;
}

// Common units for different categories
const COMMON_UNITS = {
  length: ['متر', 'سانتی‌متر', 'میلی‌متر', 'کیلومتر', 'اینچ', 'فوت', 'یارد', 'مایل'],
  weight: ['گرم', 'کیلوگرم', 'تن', 'اونس', 'پوند'],
  volume: ['لیتر', 'میلی‌لیتر', 'متر مکعب', 'گالن', 'پاینت'],
  area: ['متر مربع', 'هکتار', 'کیلومتر مربع', 'فوت مربع', 'اینچ مربع'],
  speed: ['کیلومتر بر ساعت', 'متر بر ثانیه', 'مایل بر ساعت', 'ناتیکال مایل بر ساعت'],
  temperature: ['درجه سانتی‌گراد', 'درجه فارنهایت', 'کلوین'],
  pressure: ['پاسکال', 'بار', 'پوند بر اینچ مربع', 'اتمسفر'],
  time: ['ثانیه', 'دقیقه', 'ساعت', 'روز', 'هفته', 'ماه', 'سال'],
  digital: ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت', 'ترابایت'],
  currency: ['ریال', 'تومان', 'دلار', 'یورو', 'پوند', 'ین']
};

const UnitConfig: React.FC<UnitConfigProps> = ({
  open,
  onClose,
  onSave,
  initialConfig
}) => {
  const [config, setConfig] = useState<UnitConfigData>(() => ({
    unit: '',
    display: 'after',
    customUnits: [],
    ...(initialConfig || {})
  }));

  const [unitCategory, setUnitCategory] = useState<string>('length');
  const [newCustomUnit, setNewCustomUnit] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateConfig = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!config.unit.trim()) {
      newErrors.unit = 'انتخاب واحد اندازه‌گیری الزامی است';
    }

    if (config.conversion && (!config.conversion.baseUnit.trim() || config.conversion.factor <= 0)) {
      newErrors.conversion = 'تبدیل واحد نیازمند واحد پایه و ضریب معتبر است';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfigChange = (field: keyof UnitConfigData, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConversionChange = (field: string, value: any) => {  // Fixed parameter types
    setConfig(prev => ({
      ...prev,
      conversion: prev.conversion ? {
        ...prev.conversion,
        [field]: value
      } : prev.conversion
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
        unit: '',
        display: 'after',
        customUnits: []
      });
    }
    setErrors({});
    onClose();
  };

  const addCustomUnit = () => {
    if (newCustomUnit.trim() && !config.customUnits?.includes(newCustomUnit.trim())) {
      const updatedCustomUnits = [...(config.customUnits || []), newCustomUnit.trim()];
      setConfig(prev => ({
        ...prev,
        customUnits: updatedCustomUnits
      }));
      setNewCustomUnit('');
    }
  };

  const removeCustomUnit = (unit: string) => {
    const updatedCustomUnits = config.customUnits?.filter(u => u !== unit) || [];
    setConfig(prev => ({
      ...prev,
      customUnits: updatedCustomUnits
    }));
    
    // If the removed unit was the selected unit, clear it
    if (config.unit === unit) {
      setConfig(prev => ({
        ...prev,
        unit: ''
      }));
    }
  };

  const availableUnits = [...COMMON_UNITS[unitCategory as keyof typeof COMMON_UNITS], ...(config.customUnits || [])];

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        پیکربندی واحد اندازه‌گیری
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            واحد اندازه‌گیری را برای فیلد تعریف کنید تا به کاربر کمک کند مقدار را به درستی وارد کند
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.unit}>
                <Autocomplete
                  value={config.unit || null}
                  onChange={(event, newValue) => handleConfigChange('unit', newValue || '')}
                  options={availableUnits}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="واحد اندازه‌گیری"
                      helperText={errors.unit || 'واحد اندازه‌گیری مورد نظر را انتخاب یا وارد کنید'}
                    />
                  )}
                  freeSolo
                />
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>دسته‌بندی واحدها</InputLabel>
                <Select
                  value={unitCategory}
                  label="دسته‌بندی واحدها"
                  onChange={(e) => setUnitCategory(e.target.value)}
                >
                  <MenuItem value="length">طول</MenuItem>
                  <MenuItem value="weight">وزن</MenuItem>
                  <MenuItem value="volume">حجم</MenuItem>
                  <MenuItem value="area">مساحت</MenuItem>
                  <MenuItem value="speed">سرعت</MenuItem>
                  <MenuItem value="temperature">دما</MenuItem>
                  <MenuItem value="pressure">فشار</MenuItem>
                  <MenuItem value="time">زمان</MenuItem>
                  <MenuItem value="digital">داده دیجیتال</MenuItem>
                  <MenuItem value="currency">ارز</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>محل نمایش واحد</InputLabel>
                <Select
                  value={config.display || 'after'} // Ensure default value
                  label="محل نمایش واحد"
                  onChange={(e) => handleConfigChange('display', e.target.value as 'before' | 'after')}
                >
                  <MenuItem value="before">قبل از عدد</MenuItem>
                  <MenuItem value="after">بعد از عدد</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                واحدهای سفارشی:
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  label="واحد سفارشی جدید"
                  value={newCustomUnit}
                  onChange={(e) => setNewCustomUnit(e.target.value)}
                  size="small"
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="contained"
                  onClick={addCustomUnit}
                  disabled={!newCustomUnit.trim()}
                >
                  افزودن
                </Button>
              </Box>
              
              {config.customUnits && config.customUnits.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {config.customUnits.map((unit) => (
                    <Chip
                      key={unit}
                      label={unit}
                      onDelete={() => removeCustomUnit(unit)}
                      variant="outlined"
                    />
                  ))}
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!config.conversion}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleConfigChange('conversion', {
                          baseUnit: '',
                          factor: 1
                        });
                      } else {
                        handleConfigChange('conversion', undefined);
                      }
                    }}
                  />
                }
                label="فعال‌سازی تبدیل واحد"
              />
            </Grid>
            
            {config.conversion && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    تنظیمات تبدیل واحد:
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="واحد پایه"
                        value={config.conversion.baseUnit}
                        onChange={(e) => handleConversionChange('baseUnit', e.target.value)}
                        error={!!errors.conversion}
                        helperText="واحد استاندارد برای ذخیره‌سازی"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="ضریب تبدیل"
                        type="number"
                        value={config.conversion.factor}
                        onChange={(e) => handleConversionChange('factor', Number(e.target.value))}
                        inputProps={{ min: 0, step: 0.01 }}
                        error={!!errors.conversion}
                        helperText="ضریب تبدیل به واحد پایه"
                      />
                    </Grid>
                  </Grid>
                  
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    مثال: اگر واحد اصلی "سانتی‌متر" باشد و واحد پایه "متر" باشد، ضریب تبدیل 0.01 است
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            پیش‌نمایش:
          </Typography>
          
          <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {config.display === 'before' && config.unit && (
                <Typography variant="body2" color="text.secondary">
                  {config.unit}
                </Typography>
              )}
              
              <TextField
                placeholder="100"
                size="small"
                sx={{ width: 100 }}
                disabled
              />
              
              {config.display === 'after' && config.unit && (
                <Typography variant="body2" color="text.secondary">
                  {config.unit}
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

export default UnitConfig;