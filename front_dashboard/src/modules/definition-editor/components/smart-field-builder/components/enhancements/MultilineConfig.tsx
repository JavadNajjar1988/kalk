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
  Alert,
  Slider
} from '@mui/material';

interface MultilineConfigData {
  rows: number;
  maxRows: number;
  autoResize: boolean;
}

interface MultilineConfigProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: MultilineConfigData) => void;
  initialConfig?: MultilineConfigData;
}

const MultilineConfig: React.FC<MultilineConfigProps> = ({
  open,
  onClose,
  onSave,
  initialConfig
}) => {
  const [config, setConfig] = useState<MultilineConfigData>(() => ({
    rows: initialConfig?.rows ?? 3,
    maxRows: initialConfig?.maxRows ?? 6,
    autoResize: initialConfig?.autoResize ?? true
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateConfig = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (config.rows < 1) {
      newErrors.rows = 'تعداد ردیف‌ها باید حداقل 1 باشد';
    }

    if (config.maxRows !== undefined && config.maxRows < config.rows) {
      newErrors.maxRows = 'حداکثر ردیف‌ها نمی‌تواند کمتر از تعداد ردیف‌های اولیه باشد';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfigChange = (field: keyof MultilineConfigData, value: any) => {
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
        rows: 3,
        maxRows: 6,
        autoResize: true
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
        <Typography variant="h6">تنظیمات فیلد چندخطی</Typography>
        <Typography variant="body2" color="text.secondary">
          پیکربندی فیلد متنی چندخطی برای ورود متون طولانی
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ pt: 1 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            فیلد چندخطی برای ورود متون طولانی مانند توضیحات، آدرس یا نظرات استفاده می‌شود
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="تعداد ردیف‌های اولیه"
                type="number"
                value={config.rows}
                onChange={(e) => handleConfigChange('rows', parseInt(e.target.value) || 3)}
                error={!!errors.rows}
                helperText={errors.rows || 'تعداد ردیف‌های نمایش داده شده در حالت اولیه'}
                inputProps={{ min: 1, max: 20 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="حداکثر ردیف‌ها"
                type="number"
                value={config.maxRows ?? ''}
                onChange={(e) => handleConfigChange('maxRows', e.target.value === '' ? undefined : parseInt(e.target.value))}
                error={!!errors.maxRows}
                helperText={errors.maxRows || 'حداکثر تعداد ردیف‌های قابل نمایش (اختیاری)'}
                inputProps={{ min: config.rows, max: 50 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.autoResize}
                    onChange={(e) => handleConfigChange('autoResize', e.target.checked)}
                  />
                }
                label="تغییر اندازه خودکار"
              />
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            پیش‌نمایش:
          </Typography>
          
          <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
            <TextField
              label="متن نمونه"
              placeholder="متن نمونه برای پیش‌نمایش فیلد چندخطی"
              fullWidth
              multiline
              rows={config.rows}
              maxRows={config.maxRows}
              variant="outlined"
              size="small"
              disabled
            />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              {config.autoResize ? '✓ ' : '✗ '}تغییر اندازه خودکار فعال است
              <br />
              ردیف‌های اولیه: {config.rows}
              {config.maxRows && ` | حداکثر ردیف‌ها: ${config.maxRows}`}
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

export default MultilineConfig;