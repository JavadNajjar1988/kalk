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
  Divider
} from '@mui/material';

interface PlaceholderConfigData {
  text: string;
  showOnFocus: boolean;
  animateTransition: boolean;
}

interface PlaceholderConfigProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: PlaceholderConfigData) => void;
  initialConfig?: PlaceholderConfigData;
}

const PlaceholderConfig: React.FC<PlaceholderConfigProps> = ({
  open,
  onClose,
  onSave,
  initialConfig
}) => {
  const [config, setConfig] = useState<PlaceholderConfigData>({
    text: '',
    showOnFocus: true,
    animateTransition: true,
    ...initialConfig
  });

  useEffect(() => {
    if (initialConfig) {
      setConfig({ ...initialConfig });
    }
  }, [initialConfig]);

  const handleConfigChange = (field: keyof PlaceholderConfigData, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const handleCancel = () => {
    // Reset to initial config
    if (initialConfig) {
      setConfig({ ...initialConfig });
    } else {
      setConfig({
        text: '',
        showOnFocus: true,
        animateTransition: true
      });
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">تنظیمات متن راهنما</Typography>
        <Typography variant="body2" color="text.secondary">
          متن راهنمایی که به کاربر کمک می‌کند تا فیلد را به درستی پر کند
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="متن راهنما"
              value={config.text}
              onChange={(e) => handleConfigChange('text', e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="مثال: نام و نام خانوادگی خود را وارد کنید"
              helperText="این متن در فیلد خالی نمایش داده می‌شود"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              رفتار نمایش
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.showOnFocus}
                    onChange={(e) => handleConfigChange('showOnFocus', e.target.checked)}
                  />
                }
                label="نمایش متن راهنما هنگام فوکوس روی فیلد"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.animateTransition}
                    onChange={(e) => handleConfigChange('animateTransition', e.target.checked)}
                  />
                }
                label="انیمیشن نرم برای ظاهر شدن و ناپدید شدن"
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
              placeholder={config.text || 'متن راهنما در اینجا نمایش داده می‌شود'}
              fullWidth
              variant="outlined"
              size="small"
              disabled
              sx={{
                '& .MuiInputBase-input::placeholder': {
                  color: 'text.secondary',
                  opacity: 0.7
                }
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {config.showOnFocus ? '✓ ' : '✗ '}نمایش هنگام فوکوس
              {' | '}
              {config.animateTransition ? '✓ ' : '✗ '}انیمیشن
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
          disabled={!config.text.trim()}
        >
          ذخیره تنظیمات
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlaceholderConfig;