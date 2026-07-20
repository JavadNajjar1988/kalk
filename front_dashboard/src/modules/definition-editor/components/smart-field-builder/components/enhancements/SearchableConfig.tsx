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

interface SearchableConfigData {
  minChars: number;
  maxSuggestions: number;
  caseSensitive: boolean;
  showPreview: boolean;
  highlightMatches: boolean;
}

interface SearchableConfigProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: SearchableConfigData) => void;
  initialConfig?: SearchableConfigData;
}

const SearchableConfig: React.FC<SearchableConfigProps> = ({
  open,
  onClose,
  onSave,
  initialConfig
}) => {
  const [config, setConfig] = useState<SearchableConfigData>({
    minChars: 2,
    maxSuggestions: 10,
    caseSensitive: false,
    showPreview: true,
    highlightMatches: true,
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

    if (config.minChars < 1) {
      newErrors.minChars = 'حداقل تعداد کاراکتر باید حداقل 1 باشد';
    }

    if (config.maxSuggestions < 1) {
      newErrors.maxSuggestions = 'حداکثر تعداد پیشنهاد باید حداقل 1 باشد';
    }

    if (config.maxSuggestions > 50) {
      newErrors.maxSuggestions = 'حداکثر تعداد پیشنهاد نمی‌تواند بیشتر از 50 باشد';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfigChange = (field: keyof SearchableConfigData, value: any) => {
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
        minChars: 2,
        maxSuggestions: 10,
        caseSensitive: false,
        showPreview: true,
        highlightMatches: true
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
        <Typography variant="h6">تنظیمات جستجوپذیری</Typography>
        <Typography variant="body2" color="text.secondary">
          پیکربندی قابلیت جستجو در گزینه‌های فیلد
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 3 }}>
          این قابلیت به کاربران اجازه می‌دهد تا در میان گزینه‌ها جستجو کنند و گزینه مورد نظر را سریعتر پیدا کنند.
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="حداقل کاراکتر برای شروع جستجو"
              type="number"
              value={config.minChars}
              onChange={(e) => handleConfigChange('minChars', parseInt(e.target.value) || 1)}
              fullWidth
              error={!!errors.minChars}
              helperText={errors.minChars || 'تعداد کاراکترهایی که باید وارد شود تا جستجو شروع شود'}
              inputProps={{ min: 1, max: 10 }}
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
              helperText={errors.maxSuggestions || 'حداکثر تعداد گزینه‌های پیشنهادی برای نمایش'}
              inputProps={{ min: 1, max: 50 }}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              تنظیمات نمایش
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.caseSensitive}
                    onChange={(e) => handleConfigChange('caseSensitive', e.target.checked)}
                  />
                }
                label="حساس به حروف کوچک و بزرگ"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.showPreview}
                    onChange={(e) => handleConfigChange('showPreview', e.target.checked)}
                  />
                }
                label="نمایش پیش‌نمایش گزینه‌ها"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.highlightMatches}
                    onChange={(e) => handleConfigChange('highlightMatches', e.target.checked)}
                  />
                }
                label="برجسته‌سازی موارد منطبق"
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
              placeholder={`جستجو (حداقل ${config.minChars} کاراکتر)`}
              fullWidth
              variant="outlined"
              size="small"
              disabled
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1, color: 'action.active' }}>🔍</Box>
                )
              }}
            />
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="caption" color="primary" sx={{ 
                px: 1, py: 0.5, backgroundColor: config.highlightMatches ? 'warning.light' : 'grey.200', 
                borderRadius: 1, border: '1px solid', borderColor: 'grey.300'
              }}>
                نمونه گزینه ۱
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ 
                px: 1, py: 0.5, backgroundColor: 'grey.200', 
                borderRadius: 1, border: '1px solid', borderColor: 'grey.300'
              }}>
                گزینه ۲
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              حداکثر {config.maxSuggestions} پیشنهاد
              {' | '}
              {config.caseSensitive ? 'حساس به حروف کوچک و بزرگ' : 'غیرحساس به حروف کوچک و بزرگ'}
              {config.highlightMatches && ' | برجسته‌سازی فعال'}
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

export default SearchableConfig;