import React, { memo } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { FieldRulesStepProps } from '../types/FieldEditTypes';

const NumericFieldRulesStep: React.FC<FieldRulesStepProps> = ({ formData: _formData, onChange: _onChange }) => {
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
          قوانین فیلد عددی
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', opacity: 0.8, mb: 4 }}>
          قوانین اعتبارسنجی و محدودیت‌های فیلد عددی را تعریف کنید
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
          <Box sx={{ fontSize: '4rem', mb: 3, opacity: 0.6 }}>📐</Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#64748B', mb: 2 }}>
            در حال توسعه
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 400 }}>
            قوانین و محدودیت‌های فیلد عددی (حداقل، حداکثر، اعشار و...) در نسخه‌های آینده اضافه خواهد شد.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default memo(NumericFieldRulesStep);