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

interface SearchableRefConfigData {
  minChars: number;
  maxSuggestions: number;
  searchFields: string[];
  caseSensitive: boolean;
  showFullPathInResults: boolean;
  highlightMatches: boolean;
}

interface SearchableRefConfigProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: SearchableRefConfigData) => void;
  initialConfig?: SearchableRefConfigData;
}

const SearchableRefConfig: React.FC<SearchableRefConfigProps> = ({
  open,
  onClose,
  onSave,
  initialConfig
}) => {
  const [config, setConfig] = useState<SearchableRefConfigData>({
    minChars: 2,
    maxSuggestions: 10,
    searchFields: ['name', 'code'],
    caseSensitive: false,
    showFullPathInResults: true,
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

  const handleConfigChange = (field: keyof SearchableRefConfigData, value: any) => {
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
        searchFields: ['name', 'code'],
        caseSensitive: false,
        showFullPathInResults: true,
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
        <Typography variant="h6">تنظیمات جستجوی مرجع</Typography>
        <Typography variant="body2" color="text.secondary">
          پیکربندی جستجوی پیشرفته در داده‌های مرجع
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 3 }}>
          این قابلیت به کاربران اجازه می‌دهد تا در میان داده‌های مرجع جستجو کنند و موارد مورد نظر را سریعتر پیدا کنند.
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
              helperText={errors.maxSuggestions || 'حداکثر تعداد نتایج پیشنهادی برای نمایش'}
              inputProps={{ min: 1, max: 50 }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="فیلدهای جستجو"
              value={config.searchFields.join(', ')}
              onChange={(e) => handleConfigChange('searchFields', e.target.value.split(',').map(f => f.trim()))}
              fullWidth
              helperText="نام فیلدهایی که جستجو در آنها انجام می‌شود (با کاما جدا شوند)"
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
                    checked={config.showFullPathInResults}
                    onChange={(e) => handleConfigChange('showFullPathInResults', e.target.checked)}
                  />
                }
                label="نمایش مسیر کامل در نتایج"
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
            />
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>نتیجه نمونه</Typography>
              <Typography variant="body2" color="text.secondary">
                {config.showFullPathInResults ? 'ریشه > زیرمجموعه > آیتم' : 'آیتم'}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              حداکثر {config.maxSuggestions} نتیجه
              {' | '}
              {config.caseSensitive ? 'حساس به حروف کوچک و بزرگ' : 'غیرحساس به حروف کوچک و بزرگ'}
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

export default SearchableRefConfig;