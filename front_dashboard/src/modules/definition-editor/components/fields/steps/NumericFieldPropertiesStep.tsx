import React, { memo } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { FieldPropertiesStepProps } from '../types/FieldEditTypes';

const NumericFieldPropertiesStep: React.FC<FieldPropertiesStepProps> = ({ formData: _formData, onChange: _onChange }) => {
  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography 
          variant="h5" 
          gutterBottom
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(45deg, #4A90E2 30%, #7BB3F0 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          ویژگی‌های فیلد عددی
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', opacity: 0.8, mb: 4 }}>
          مشخصات و تنظیمات فیلد عددی را تعریف کنید
        </Typography>
      </Box>
      
      <Paper
        sx={{
          p: 4,
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.8) 100%)',
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
          <Box sx={{ fontSize: '4rem', mb: 3, opacity: 0.6 }}>🔢</Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#64748B', mb: 2 }}>
            در حال توسعه
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 400 }}>
            تنظیمات ویژگی‌های فیلد عددی در نسخه‌های آینده اضافه خواهد شد.
            فعلاً می‌توانید بین مراحل جابجا شوید.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default memo(NumericFieldPropertiesStep);