import React from 'react';
import { Box, CircularProgress, Typography, Backdrop } from '@mui/material';

interface LoadingOverlayProps {
  open: boolean;
  message?: string;
  variant?: 'modal' | 'inline';
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  open,
  message = 'در حال پردازش...',
  variant = 'modal'
}) => {
  const loadingContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        p: 4,
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(135, 206, 250, 0.3)',
        boxShadow: '0 8px 32px rgba(135, 206, 250, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, rgba(135, 206, 250, 0.05) 0%, rgba(173, 216, 230, 0.08) 50%, rgba(176, 224, 230, 0.05) 100%)',
          zIndex: -1,
        }
      }}
    >
      <CircularProgress
        size={48}
        thickness={4}
        sx={{
          color: '#4A90E2',
          filter: 'drop-shadow(0 2px 8px rgba(74, 144, 226, 0.3))',
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          }
        }}
      />
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: '#4A90E2',
          textAlign: 'center',
          textShadow: '0 1px 2px rgba(74, 144, 226, 0.1)',
        }}
      >
        {message}
      </Typography>
    </Box>
  );

  if (variant === 'inline') {
    return open ? (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
        }}
      >
        {loadingContent}
      </Box>
    ) : null;
  }

  return (
    <Backdrop
      open={open}
      sx={{
        background: 'rgba(135, 206, 250, 0.1)',
        backdropFilter: 'blur(8px)',
        zIndex: 1300,
      }}
    >
      {loadingContent}
    </Backdrop>
  );
};

export default LoadingOverlay;