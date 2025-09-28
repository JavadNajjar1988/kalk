import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
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
  Alert,
  RadioGroup,
  Radio,
  FormLabel
} from '@mui/material';

interface SingleConfigData {
  displayStyle: 'dropdown' | 'radio' | 'button';
  showIcons: boolean;
  compact: boolean;
}

interface SingleConfigProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: SingleConfigData) => void;
  initialConfig?: SingleConfigData;
}

const SingleConfig: React.FC<SingleConfigProps> = ({
  open,
  onClose,
  onSave,
  initialConfig
}) => {
  const [config, setConfig] = useState<SingleConfigData>({
    displayStyle: 'dropdown',
    showIcons: false,
    compact: false,
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
    // No specific validation needed for single config
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfigChange = (field: keyof SingleConfigData, value: any) => {
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
        displayStyle: 'dropdown',
        showIcons: false,
        compact: false
      });
    }
    setErrors({});
    onClose();
  };

  const getDisplayStyleDescription = (style: string): string => {
    switch (style) {
      case 'dropdown':
        return 'نمایش به صورت لیست کشویی (انتخاب از منو)';
      case 'radio':
        return 'نمایش به صورت دکمه‌های رادیویی (گزینه‌های قابل مشاهده)';
      case 'button':
        return 'نمایش به صورت دکمه‌های انتخابی (طراحی مدرن)';
      default:
        return '';
    }
  };

  useEffect(() => {
    validateConfig();
  }, [config]);

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">تنظیمات انتخاب تکی</Typography>
        <Typography variant="body2" color="text.secondary">
          پیکربندی نحوه نمایش گزینه‌های انتخاب تکی
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 3 }}>
          این تنظیمات نحوه نمایش گزینه‌های انتخاب تکی را تعیین می‌کند.
          انتخاب تکی به کاربران اجازه می‌دهد تنها یک گزینه را انتخاب کنند.
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend">
                <Typography variant="subtitle2">نوع نمایش</Typography>
              </FormLabel>
              <RadioGroup
                value={config.displayStyle}
                onChange={(e) => handleConfigChange('displayStyle', e.target.value)}
              >
                <FormControlLabel
                  value="dropdown"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2">لیست کشویی</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getDisplayStyleDescription('dropdown')}
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="radio"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2">دکمه‌های رادیویی</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getDisplayStyleDescription('radio')}
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="button"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2">دکمه‌های انتخابی</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getDisplayStyleDescription('button')}
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              تنظیمات نمایش
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.showIcons}
                    onChange={(e) => handleConfigChange('showIcons', e.target.checked)}
                  />
                }
                label="نمایش آیکون‌ها (در صورت وجود)"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.compact}
                    onChange={(e) => handleConfigChange('compact', e.target.checked)}
                  />
                }
                label="نمایش فشرده"
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
            {config.displayStyle === 'dropdown' && (
              <FormControl fullWidth size="small">
                <InputLabel>انتخاب کنید</InputLabel>
                <Select disabled value="" label="انتخاب کنید">
                  <MenuItem value="option1">گزینه ۱</MenuItem>
                  <MenuItem value="option2">گزینه ۲</MenuItem>
                  <MenuItem value="option3">گزینه ۳</MenuItem>
                </Select>
              </FormControl>
            )}
            
            {config.displayStyle === 'radio' && (
              <FormControl component="fieldset">
                <RadioGroup>
                  <FormControlLabel value="option1" control={<Radio disabled />} label="گزینه ۱" />
                  <FormControlLabel value="option2" control={<Radio disabled />} label="گزینه ۲" />
                  <FormControlLabel value="option3" control={<Radio disabled />} label="گزینه ۳" />
                </RadioGroup>
              </FormControl>
            )}
            
            {config.displayStyle === 'button' && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button variant="outlined" size="small" disabled>گزینه ۱</Button>
                <Button variant="outlined" size="small" disabled>گزینه ۲</Button>
                <Button variant="outlined" size="small" disabled>گزینه ۳</Button>
              </Box>
            )}
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              نوع نمایش: {config.displayStyle === 'dropdown' ? 'لیست کشویی' : 
                          config.displayStyle === 'radio' ? 'دکمه‌های رادیویی' : 
                          'دکمه‌های انتخابی'}
              {config.showIcons && ' | آیکون‌ها: فعال'}
              {config.compact && ' | حالت فشرده: فعال'}
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

export default SingleConfig;