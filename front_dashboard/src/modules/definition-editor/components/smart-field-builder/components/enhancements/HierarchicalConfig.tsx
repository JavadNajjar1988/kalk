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

interface HierarchicalConfigData {
  maxDepth: number;
  showFullPath: boolean;
  allowRootSelection: boolean;
  expandOnLoad: boolean;
  showCount: boolean;
  lazyLoad: boolean;
}

interface HierarchicalConfigProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: HierarchicalConfigData) => void;
  initialConfig?: HierarchicalConfigData;
}

const HierarchicalConfig: React.FC<HierarchicalConfigProps> = ({
  open,
  onClose,
  onSave,
  initialConfig
}) => {
  const [config, setConfig] = useState<HierarchicalConfigData>({
    maxDepth: 5,
    showFullPath: true,
    allowRootSelection: false,
    expandOnLoad: false,
    showCount: true,
    lazyLoad: true,
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

    if (config.maxDepth < 1) {
      newErrors.maxDepth = 'حداکثر عمق باید حداقل 1 باشد';
    }

    if (config.maxDepth > 10) {
      newErrors.maxDepth = 'حداکثر عمق نمی‌تواند بیشتر از 10 باشد';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfigChange = (field: keyof HierarchicalConfigData, value: any) => {
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
        maxDepth: 5,
        showFullPath: true,
        allowRootSelection: false,
        expandOnLoad: false,
        showCount: true,
        lazyLoad: true
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
        <Typography variant="h6">تنظیمات سلسله‌مراتبی</Typography>
        <Typography variant="body2" color="text.secondary">
          پیکربندی ساختار درختی برای فیلدهای مرجع
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 3 }}>
          این قابلیت به کاربران اجازه می‌دهد تا از بین داده‌های سلسله‌مراتبی انتخاب کنند.
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="حداکثر عمق"
              type="number"
              value={config.maxDepth}
              onChange={(e) => handleConfigChange('maxDepth', parseInt(e.target.value) || 1)}
              fullWidth
              error={!!errors.maxDepth}
              helperText={errors.maxDepth || 'حداکثر تعداد سطوح در سلسله‌مراتب'}
              inputProps={{ min: 1, max: 10 }}
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
                    checked={config.showFullPath}
                    onChange={(e) => handleConfigChange('showFullPath', e.target.checked)}
                  />
                }
                label="نمایش مسیر کامل"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.allowRootSelection}
                    onChange={(e) => handleConfigChange('allowRootSelection', e.target.checked)}
                  />
                }
                label="اجازه انتخاب ریشه"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.expandOnLoad}
                    onChange={(e) => handleConfigChange('expandOnLoad', e.target.checked)}
                  />
                }
                label="باز کردن به صورت خودکار"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.showCount}
                    onChange={(e) => handleConfigChange('showCount', e.target.checked)}
                  />
                }
                label="نمایش تعداد زیرمجموعه‌ها"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.lazyLoad}
                    onChange={(e) => handleConfigChange('lazyLoad', e.target.checked)}
                  />
                }
                label="بارگذاری تاخیری"
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">[+] ریشه</Typography>
                {config.showCount && <Typography variant="caption" color="text.secondary">(5)</Typography>}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                <Typography variant="body2">[+] زیرمجموعه ۱</Typography>
                {config.showCount && <Typography variant="caption" color="text.secondary">(3)</Typography>}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 4 }}>
                <Typography variant="body2">آیتم نهایی</Typography>
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              حداکثر عمق: {config.maxDepth}
              {' | '}
              {config.showFullPath ? 'نمایش مسیر کامل' : 'بدون مسیر کامل'}
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

export default HierarchicalConfig;