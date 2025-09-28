import React, { memo, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Chip } from '@mui/material';
import { FieldTypeSelectionProps } from '../types/FieldEditTypes';

const FieldTypeSelection: React.FC<FieldTypeSelectionProps> = ({ formData, onChange }) => {
  // Handle field type changes that might affect options
  const handleTypeChange = (newType: string) => {
    // If changing to a select/multiselect type and we don't have options yet, initialize with empty array
    if ((newType === 'select' || newType === 'multiselect') && !formData.options) {
      onChange('options', []);
    }
    
    // If changing away from select/multiselect and display type supports options,
    // keep the options for display purposes
    if (newType !== 'select' && newType !== 'multiselect') {
      // We don't remove options here as they might be used by display types like accordion
    }
    
    onChange('type', newType);
  };

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
          انتخاب نوع فیلد
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', opacity: 0.8 }}>
          نوع فیلد مورد نظر خود را انتخاب کنید
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: '16px',
              background: formData.type === 'text' 
                ? 'linear-gradient(135deg, rgba(74, 144, 226, 0.1) 0%, rgba(123, 179, 240, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.6) 100%)',
              border: formData.type === 'text' ? '2px solid rgba(74, 144, 226, 0.3)' : '2px solid rgba(203, 213, 225, 0.3)',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              boxShadow: formData.type === 'text'
                ? '0 8px 32px rgba(74, 144, 226, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                : '0 8px 32px rgba(148, 163, 184, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              textAlign: 'center',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 16px 40px rgba(74, 144, 226, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                border: '2px solid rgba(74, 144, 226, 0.5)',
              },
            }}
            onClick={() => handleTypeChange('text')}
          >
            <Box 
              sx={{ 
                fontSize: '3rem',
                mb: 2,
                filter: 'drop-shadow(0 4px 8px rgba(74, 144, 226, 0.3))',
                animation: formData.type === 'text' ? 'bounce 2s ease-in-out infinite' : 'none',
                '@keyframes bounce': {
                  '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
                  '40%': { transform: 'translateY(-10px)' },
                  '60%': { transform: 'translateY(-5px)' },
                },
              }}
            >
              📝
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                color: formData.type === 'text' ? '#4A90E2' : '#64748B',
                mb: 1,
              }}
            >
              فیلد متنی
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ color: 'text.secondary', fontSize: '0.9rem' }}
            >
              برای ورود متن و کاراکتر
            </Typography>
            {formData.type === 'text' && (
              <Chip 
                label="انتخاب شده" 
                size="small"
                sx={{ 
                  mt: 2,
                  bgcolor: 'rgba(74, 144, 226, 0.1)',
                  color: '#4A90E2',
                  fontWeight: 600,
                }} 
              />
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: '16px',
              background: formData.type === 'number' 
                ? 'linear-gradient(135deg, rgba(74, 144, 226, 0.1) 0%, rgba(123, 179, 240, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.6) 100%)',
              border: formData.type === 'number' ? '2px solid rgba(74, 144, 226, 0.3)' : '2px solid rgba(203, 213, 225, 0.3)',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              boxShadow: formData.type === 'number'
                ? '0 8px 32px rgba(74, 144, 226, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                : '0 8px 32px rgba(148, 163, 184, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              textAlign: 'center',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 16px 40px rgba(74, 144, 226, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                border: '2px solid rgba(74, 144, 226, 0.5)',
              },
            }}
            onClick={() => handleTypeChange('number')}
          >
            <Box 
              sx={{ 
                fontSize: '3rem',
                mb: 2,
                filter: 'drop-shadow(0 4px 8px rgba(74, 144, 226, 0.3))',
                animation: formData.type === 'number' ? 'bounce 2s ease-in-out infinite' : 'none',
                '@keyframes bounce': {
                  '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
                  '40%': { transform: 'translateY(-10px)' },
                  '60%': { transform: 'translateY(-5px)' },
                },
              }}
            >
              🔢
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                color: formData.type === 'number' ? '#4A90E2' : '#64748B',
                mb: 1,
              }}
            >
              فیلد عددی
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ color: 'text.secondary', fontSize: '0.9rem' }}
            >
              برای ورود اعداد و محاسبات
            </Typography>
            {formData.type === 'number' ? (
              <Chip 
                label="انتخاب شده" 
                size="small"
                sx={{ 
                  mt: 2,
                  bgcolor: 'rgba(74, 144, 226, 0.1)',
                  color: '#4A90E2',
                  fontWeight: 600,
                }} 
              />
            ) : (
              <Chip 
                label="فعال" 
                size="small"
                sx={{ 
                  mt: 2,
                  bgcolor: 'rgba(34, 197, 94, 0.1)',
                  color: '#16a34a',
                  fontWeight: 500,
                }} 
              />
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: '16px',
              background: formData.type === 'reference' 
                ? 'linear-gradient(135deg, rgba(74, 144, 226, 0.1) 0%, rgba(123, 179, 240, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.6) 100%)',
              border: formData.type === 'reference' ? '2px solid rgba(74, 144, 226, 0.3)' : '2px solid rgba(203, 213, 225, 0.3)',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              boxShadow: formData.type === 'reference'
                ? '0 8px 32px rgba(74, 144, 226, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                : '0 8px 32px rgba(148, 163, 184, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              textAlign: 'center',
              opacity: 0.6,
              '&:hover': {
                opacity: 0.8,
                transform: 'translateY(-2px)',
              },
            }}
            onClick={() => {}}
          >
            <Box sx={{ fontSize: '3rem', mb: 2, filter: 'drop-shadow(0 4px 8px rgba(148, 163, 184, 0.3))' }}>🔗</Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#64748B', mb: 1 }}>
              فیلد مرجع
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
              برای ارجاع به سایر داده‌ها
            </Typography>
            <Chip 
              label="به زودی" 
              size="small"
              sx={{ 
                mt: 2,
                bgcolor: 'rgba(148, 163, 184, 0.2)',
                color: '#64748B',
                fontWeight: 500,
              }} 
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default memo(FieldTypeSelection);