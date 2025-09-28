import React, { memo } from 'react';
import { Box, Typography, Paper, Grid, TextField, FormControlLabel, Switch } from '@mui/material';
import HelpTooltip from '../shared/HelpTooltip';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';

interface MaskPropertiesProps {
  formData: ExtendedCustomFieldDefinition;
  onChange: (key: keyof ExtendedCustomFieldDefinition, value: any) => void;
}

const MaskProperties: React.FC<MaskPropertiesProps> = ({ formData, onChange }) => {
  return (
    <Paper
      sx={{
        p: 3,
        mb: 3,
        borderRadius: '12px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(135, 206, 250, 0.2)',
        boxShadow: '0 4px 16px rgba(135, 206, 250, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      }}
    >
      <Typography variant="h6" sx={{ mb: 3, color: '#4A90E2', fontWeight: 600 }}>
        ویژگی‌های ماسک‌گذاری
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.variant === 'masked'}
                  onChange={(e) => onChange('variant', e.target.checked ? 'masked' : 'plain')}
                  size="small"
                />
              }
              label="فعال‌سازی ماسک‌گذاری"
            />
            <HelpTooltip
              title="فعال‌سازی ماسک‌گذاری"
              description="نمایش فیلد به صورت ماسک‌شده برای اطلاعات حساس"
              example="نمایش ۰۹۱۲ *** ۱۲۳۴"
            />
          </Box>
        </Grid>
        
        {formData.variant === 'masked' && (
          <>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="الگوی ماسک"
                value={formData.maskPattern || ''}
                onChange={(e) => onChange('maskPattern', e.target.value)}
                placeholder="0999 *** 9999"
                helperText="استفاده از ۹ برای ارقام و * برای کاراکترهای ماسک‌شده"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.enableSensitiveDataDetection || false}
                      onChange={(e) => onChange('enableSensitiveDataDetection', e.target.checked)}
                      size="small"
                    />
                  }
                  label="تشخیص خودکار اطلاعات حساس"
                />
                <HelpTooltip
                  title="تشخیص خودکار اطلاعات حساس"
                  description="تشخیص خودکار اطلاعات حساس مانند شماره کارت یا شماره ملی"
                  example="تشخیص خودکار شماره کارت بانکی"
                />
              </Box>
            </Grid>
          </>
        )}
      </Grid>
    </Paper>
  );
};

export default memo(MaskProperties);