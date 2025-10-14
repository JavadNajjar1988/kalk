import React, { memo } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { FieldPreviewStepProps } from '../types/FieldEditTypes';

const NumericFieldPreviewStep: React.FC<FieldPreviewStepProps> = ({ formData }) => {
  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography 
          variant="h5" 
          gutterBottom
          sx={{
            fontWeight: 700,
            color: 'primary.main',
          }}
        >
          پیش‌نمایش فیلد عددی
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', opacity: 0.8, mb: 4 }}>
          نمایش نهایی فیلد عددی شما
        </Typography>
      </Box>
      
      <Paper
        sx={{
          p: 4,
          borderRadius: '16px',
          backgroundColor: 'rgba(248, 250, 252, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(203, 213, 225, 0.3)',
          textAlign: 'center',
          minHeight: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box>
          <Box sx={{ fontSize: '4rem', mb: 3, opacity: 0.6 }}>👁️</Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#64748B', mb: 2 }}>
            در حال توسعه
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 400 }}>
            پیش‌نمایش فیلد عددی با تمام تنظیمات و ویژگی‌ها در نسخه‌های آینده نمایش داده خواهد شد.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default memo(NumericFieldPreviewStep);