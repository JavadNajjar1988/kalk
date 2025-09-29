import React from 'react';
import { Box, Typography, Paper, Grid, useTheme, useMediaQuery } from '@mui/material';
import { FieldSelectionPageProps } from '../types/FieldEditTypes';

const FieldSelectionPage: React.FC<FieldSelectionPageProps> = ({
  onCreateField,
  onReadyFields,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  return (
    <Box 
      sx={{ 
        p: isMobile ? 2 : 4,
        background: 'linear-gradient(135deg, rgba(240, 248, 255, 0.9) 0%, rgba(230, 245, 255, 0.8) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, rgba(135, 206, 250, 0.1) 0%, rgba(173, 216, 230, 0.15) 50%, rgba(176, 224, 230, 0.1) 100%)',
          borderRadius: '16px',
          zIndex: -1,
        }
      }}
    >
      <Box sx={{ textAlign: 'center', mb: isMobile ? 2 : 4 }}>
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          gutterBottom 
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(45deg, #4A90E2 30%, #7BB3F0 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 2px 4px rgba(135, 206, 250, 0.3)',
            fontSize: isMobile ? '1.4rem' : undefined
          }}
        >
          نحوه ایجاد فیلد را انتخاب کنید
        </Typography>
        <Typography 
          variant={isMobile ? "body2" : "body1"} 
          color="text.secondary"
          sx={{ 
            opacity: 0.8,
            fontSize: isMobile ? '0.9rem' : '1.1rem',
          }}
        >
          با استفاده از ابزارهای زیر فیلد مورد نظر خود را بسازید
        </Typography>
      </Box>
      
      <Grid container spacing={isMobile ? 2 : 4} sx={{ mt: isMobile ? 1 : 2 }}>
        <Grid item xs={12} sm={6}>
          <Paper
            sx={{
              p: isMobile ? 2 : 4,
              textAlign: 'center',
              cursor: 'pointer',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 248, 255, 0.8) 100%)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(135, 206, 250, 0.3)',
              boxShadow: '0 8px 32px rgba(135, 206, 250, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                transition: 'left 0.6s',
              },
              '&:hover': {
                transform: isMobile ? 'translateY(-4px) scale(1.01)' : 'translateY(-8px) scale(1.02)',
                boxShadow: '0 20px 40px rgba(135, 206, 250, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                border: '2px solid rgba(135, 206, 250, 0.6)',
                '&::before': {
                  left: '100%',
                },
              },
            }}
            onClick={onCreateField}
          >
            <Box 
              sx={{ 
                fontSize: isMobile ? '3rem' : '4rem', 
                mb: isMobile ? 2 : 3,
                filter: 'drop-shadow(0 4px 8px rgba(74, 144, 226, 0.3))',
                animation: 'float 3s ease-in-out infinite',
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0px)' },
                  '50%': { transform: isMobile ? 'translateY(-5px)' : 'translateY(-10px)' },
                },
              }}
            >
              🛠️
            </Box>
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              gutterBottom
              sx={{ 
                fontWeight: 700,
                color: '#4A90E2',
                textShadow: '0 2px 4px rgba(74, 144, 226, 0.2)',
                fontSize: isMobile ? '1.1rem' : undefined
              }}
            >
              ساخت فیلد
            </Typography>
            <Typography 
              variant={isMobile ? "body2" : "body1"} 
              sx={{ 
                color: 'text.secondary',
                lineHeight: 1.6,
                fontSize: isMobile ? '0.85rem' : '1rem',
              }}
            >
              فیلد جدید را از ابتدا بسازید
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Paper
            sx={{
              p: isMobile ? 2 : 4,
              textAlign: 'center',
              cursor: 'pointer',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.6) 0%, rgba(241, 245, 249, 0.4) 100%)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(203, 213, 225, 0.5)',
              boxShadow: '0 8px 32px rgba(148, 163, 184, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: 0.7,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                transition: 'left 0.6s',
              },
              '&:hover': {
                opacity: 0.9,
                transform: isMobile ? 'translateY(-2px) scale(1.005)' : 'translateY(-4px) scale(1.01)',
                boxShadow: '0 16px 32px rgba(148, 163, 184, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
                '&::before': {
                  left: '100%',
                },
              },
            }}
            onClick={onReadyFields}
          >
            <Box 
              sx={{ 
                fontSize: isMobile ? '3rem' : '4rem', 
                mb: isMobile ? 2 : 3,
                filter: 'drop-shadow(0 4px 8px rgba(148, 163, 184, 0.3))',
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { transform: 'scale(1)' },
                  '50%': { transform: isMobile ? 'scale(1.02)' : 'scale(1.05)' },
                },
              }}
            >
              📦
            </Box>
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              gutterBottom
              sx={{ 
                fontWeight: 700,
                color: '#64748B',
                textShadow: '0 2px 4px rgba(100, 116, 139, 0.2)',
                fontSize: isMobile ? '1.1rem' : undefined
              }}
            >
              فیلد آماده
            </Typography>
            <Typography 
              variant={isMobile ? "body2" : "body1"} 
              sx={{ 
                color: 'text.secondary',
                lineHeight: 1.6,
                fontSize: isMobile ? '0.85rem' : '1rem',
              }}
            >
              از فیلدهای از پیش تعریف شده استفاده کنید
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FieldSelectionPage;