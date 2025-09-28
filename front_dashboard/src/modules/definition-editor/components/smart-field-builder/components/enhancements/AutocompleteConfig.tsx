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
  Chip,
  IconButton,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

interface AutocompleteConfigData {
  source: 'static' | 'dynamic' | 'api';
  staticOptions?: string[];
  apiEndpoint?: string;
  minChars: number;
  maxSuggestions: number;
  allowCustom: boolean;
  caseSensitive: boolean;
}

interface AutocompleteConfigProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: AutocompleteConfigData) => void;
  initialConfig?: AutocompleteConfigData;
}

const AutocompleteConfig: React.FC<AutocompleteConfigProps> = ({
  open,
  onClose,
  onSave,
  initialConfig
}) => {
  const [config, setConfig] = useState<AutocompleteConfigData>({
    source: 'static',
    staticOptions: [],
    apiEndpoint: '',
    minChars: 2,
    maxSuggestions: 10,
    allowCustom: true,
    caseSensitive: false,
    ...initialConfig
  });

  const [newOption, setNewOption] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialConfig) {
      setConfig({ ...initialConfig });
    }
  }, [initialConfig]);

  const validateConfig = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (config.minChars < 1) {
      newErrors.minChars = 'حداقل تعداد کاراکتر باید حداقل 1 باشد';
    }

    if (config.maxSuggestions < 1) {
      newErrors.maxSuggestions = 'حداکثر تعداد پیشنهاد باید حداقل 1 باشد';
    }

    if (config.source === 'static' && (!config.staticOptions || config.staticOptions.length === 0)) {
      newErrors.staticOptions = 'برای منبع ثابت، حداقل یک گزینه باید تعریف شود';
    }

    if (config.source === 'api' && (!config.apiEndpoint || config.apiEndpoint.trim() === '')) {
      newErrors.apiEndpoint = 'برای منبع API، آدرس باید مشخص شود';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfigChange = (field: keyof AutocompleteConfigData, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addStaticOption = () => {
    if (newOption.trim()) {
      const currentOptions = config.staticOptions || [];
      if (!currentOptions.includes(newOption.trim())) {
        handleConfigChange('staticOptions', [...currentOptions, newOption.trim()]);
        setNewOption('');
      }
    }
  };

  const removeStaticOption = (index: number) => {
    const currentOptions = config.staticOptions || [];
    handleConfigChange('staticOptions', currentOptions.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addStaticOption();
    }
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
        source: 'static',
        staticOptions: [],
        apiEndpoint: '',
        minChars: 2,
        maxSuggestions: 10,
        allowCustom: true,
        caseSensitive: false
      });
    }
    setNewOption('');
    setErrors({});
    onClose();
  };

  useEffect(() => {
    validateConfig();
  }, [config]);

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">تنظیمات تکمیل خودکار</Typography>
        <Typography variant="body2" color="text.secondary">
          پیشنهادهای هوشمند برای تسریع ورود اطلاعات
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>منبع داده</InputLabel>
              <Select
                value={config.source}
                label="منبع داده"
                onChange={(e) => handleConfigChange('source', e.target.value)}
              >
                <MenuItem value="static">فهرست ثابت</MenuItem>
                <MenuItem value="dynamic">داده‌های پویا</MenuItem>
                <MenuItem value="api">API خارجی</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="حداقل کاراکتر برای شروع جستجو"
              type="number"
              value={config.minChars}
              onChange={(e) => handleConfigChange('minChars', parseInt(e.target.value) || 1)}
              fullWidth
              error={!!errors.minChars}
              helperText={errors.minChars}
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="حداکثر تعداد پیشنهاد"
              type="number"
              value={config.maxSuggestions}
              onChange={(e) => handleConfigChange('maxSuggestions', parseInt(e.target.value) || 1)}
              fullWidth
              error={!!errors.maxSuggestions}
              helperText={errors.maxSuggestions}
              inputProps={{ min: 1, max: 50 }}
            />
          </Grid>

          {/* Static Options */}
          {config.source === 'static' && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                گزینه‌های ثابت
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  placeholder="گزینه جدید اضافه کنید"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={handleKeyDown}
                  size="small"
                  fullWidth
                />
                <Button
                  onClick={addStaticOption}
                  variant="outlined"
                  disabled={!newOption.trim()}
                  startIcon={<AddIcon />}
                >
                  افزودن
                </Button>
              </Box>

              {errors.staticOptions && (
                <Alert severity="error" sx={{ mb: 2 }}>{errors.staticOptions}</Alert>
              )}

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {(config.staticOptions || []).map((option, index) => (
                  <Chip
                    key={index}
                    label={option}
                    onDelete={() => removeStaticOption(index)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>
          )}

          {/* API Endpoint */}
          {config.source === 'api' && (
            <Grid item xs={12}>
              <TextField
                label="آدرس API"
                value={config.apiEndpoint}
                onChange={(e) => handleConfigChange('apiEndpoint', e.target.value)}
                fullWidth
                error={!!errors.apiEndpoint}
                helperText={errors.apiEndpoint || 'آدرس کامل API برای دریافت پیشنهادها'}
                placeholder="https://api.example.com/suggestions"
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              تنظیمات رفتاری
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.allowCustom}
                    onChange={(e) => handleConfigChange('allowCustom', e.target.checked)}
                  />
                }
                label="اجازه ورود مقادیر سفارشی (غیر از پیشنهادها)"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.caseSensitive}
                    onChange={(e) => handleConfigChange('caseSensitive', e.target.checked)}
                  />
                }
                label="حساس به حروف کوچک و بزرگ"
              />
            </Box>
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
              placeholder={`تایپ کنید (حداقل ${config.minChars} کاراکتر)`}
              fullWidth
              variant="outlined"
              size="small"
              disabled
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              منبع: {config.source === 'static' ? 'فهرست ثابت' : config.source === 'dynamic' ? 'داده‌های پویا' : 'API خارجی'}
              {' | '}
              حداکثر {config.maxSuggestions} پیشنهاد
              {' | '}
              {config.allowCustom ? '✓' : '✗'} مقادیر سفارشی
            </Typography>
            {config.source === 'static' && config.staticOptions && config.staticOptions.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  نمونه پیشنهادها: {config.staticOptions.slice(0, 3).join(', ')}
                  {config.staticOptions.length > 3 && '...'}
                </Typography>
              </Box>
            )}
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

export default AutocompleteConfig;