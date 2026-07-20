import React, { memo, useEffect } from 'react';
import { Box, Typography, Paper, Grid, useTheme, alpha } from '@mui/material';
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

  const theme = useTheme();

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography 
          variant="h5" 
          gutterBottom
          sx={{
            fontWeight: 700,
            color: theme.palette.primary.main,
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
              backgroundColor: formData.type === 'text' ? alpha(theme.palette.primary.main, 0.08) : 'rgba(255,255,255,0.8)',
              border: formData.type === 'text' ? `2px solid ${alpha(theme.palette.primary.main, 0.3)}` : '2px solid rgba(203, 213, 225, 0.3)',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              boxShadow: formData.type === 'text'
                ? `0 8px 32px ${alpha(theme.palette.primary.main, 0.2)}, inset 0 1px 0 rgba(255, 255, 255, 0.8)`
                : '0 8px 32px rgba(148, 163, 184, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              textAlign: 'center',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 16px 40px ${alpha(theme.palette.primary.main, 0.25)}`,
                border: `2px solid ${alpha(theme.palette.primary.main, 0.5)}`,
              },
            }}
            onClick={() => handleTypeChange('text')}
          >
            <Box 
              sx={{ 
                fontSize: '3rem',
                mb: 2,
                filter: `drop-shadow(0 4px 8px ${alpha(theme.palette.primary.main, 0.3)})`,
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
                color: formData.type === 'text' ? theme.palette.primary.main : '#64748B',
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
            {/* Badge removed to keep size uniform; selection indicated by color only */}
          </Paper>
        </Grid>
        
        <Grid item xs={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: '16px',
              backgroundColor: formData.type === 'number' ? alpha(theme.palette.primary.main, 0.08) : 'rgba(255,255,255,0.8)',
              border: formData.type === 'number' ? `2px solid ${alpha(theme.palette.primary.main, 0.3)}` : '2px solid rgba(203, 213, 225, 0.3)',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              boxShadow: formData.type === 'number'
                ? `0 8px 32px ${alpha(theme.palette.primary.main, 0.2)}, inset 0 1px 0 rgba(255, 255, 255, 0.8)`
                : '0 8px 32px rgba(148, 163, 184, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              textAlign: 'center',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 16px 40px ${alpha(theme.palette.primary.main, 0.25)}`,
                border: `2px solid ${alpha(theme.palette.primary.main, 0.5)}`,
              },
            }}
            onClick={() => handleTypeChange('number')}
          >
            <Box 
              sx={{ 
                fontSize: '3rem',
                mb: 2,
                filter: `drop-shadow(0 4px 8px ${alpha(theme.palette.primary.main, 0.3)})`,
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
                color: formData.type === 'number' ? theme.palette.primary.main : '#64748B',
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
            {/* Badges removed to keep size uniform; selection indicated by color only */}
          </Paper>
        </Grid>
        
        <Grid item xs={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: '16px',
              backgroundColor: formData.type === 'reference' ? alpha(theme.palette.primary.main, 0.08) : 'rgba(255,255,255,0.8)',
              border: formData.type === 'reference' ? `2px solid ${alpha(theme.palette.primary.main, 0.3)}` : '2px solid rgba(203, 213, 225, 0.3)',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              boxShadow: formData.type === 'reference'
                ? `0 8px 32px ${alpha(theme.palette.primary.main, 0.2)}, inset 0 1px 0 rgba(255, 255, 255, 0.8)`
                : '0 8px 32px rgba(148, 163, 184, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              textAlign: 'center',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 16px 40px ${alpha(theme.palette.primary.main, 0.25)}`,
                border: `2px solid ${alpha(theme.palette.primary.main, 0.5)}`,
              },
            }}
            onClick={() => handleTypeChange('reference')}
          >
            <Box 
              sx={{ 
                fontSize: '3rem', 
                mb: 2, 
                filter: `drop-shadow(0 4px 8px ${alpha(theme.palette.primary.main, 0.3)})`,
                animation: formData.type === 'reference' ? 'bounce 2s ease-in-out infinite' : 'none',
                '@keyframes bounce': {
                  '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
                  '40%': { transform: 'translateY(-10px)' },
                  '60%': { transform: 'translateY(-5px)' },
                },
              }}
            >
              🔗
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700, 
                color: formData.type === 'reference' ? theme.palette.primary.main : '#64748B', 
                mb: 1 
              }}
            >
              فیلد مرجع
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
              برای ارجاع به سایر داده‌ها
            </Typography>
            {/* Badges removed to keep size uniform; selection indicated by color only */}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default memo(FieldTypeSelection);