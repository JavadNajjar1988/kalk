import React from 'react';
import { Box, Typography, Fade, Zoom } from '@mui/material';
import { Error as ErrorIcon, Warning as WarningIcon } from '@mui/icons-material';
import { ValidationError } from '../utils/fieldValidation';

interface ValidationMessageProps {
  error?: ValidationError;
  show?: boolean;
  variant?: 'inline' | 'tooltip' | 'badge';
}

const ValidationMessage: React.FC<ValidationMessageProps> = ({
  error,
  show = true,
  variant = 'inline'
}) => {
  if (!error || !show) return null;

  const isError = error.type === 'error';
  const icon = isError ? <ErrorIcon sx={{ fontSize: 16 }} /> : <WarningIcon sx={{ fontSize: 16 }} />;

  const baseStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    borderRadius: '8px',
    backdropFilter: 'blur(10px)',
    border: '1px solid',
    fontSize: '0.875rem',
    fontWeight: 500,
  };

  const errorStyles = {
    ...baseStyles,
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    color: '#DC2626',
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  };

  const warningStyles = {
    ...baseStyles,
    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    color: '#D97706',
    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  };

  const styles = isError ? errorStyles : warningStyles;

  if (variant === 'tooltip') {
    return (
      <Zoom in={show} timeout={200}>
        <Box
          sx={{
            ...styles,
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 1,
            p: 1.5,
            zIndex: 1000,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -6,
              left: 16,
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderBottom: `6px solid ${isError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            }
          }}
        >
          {icon}
          <Typography variant="body2" sx={{ color: 'inherit' }}>
            {error.message}
          </Typography>
        </Box>
      </Zoom>
    );
  }

  if (variant === 'badge') {
    return (
      <Fade in={show} timeout={300}>
        <Box
          sx={{
            ...styles,
            position: 'absolute',
            top: -8,
            right: -8,
            minWidth: 20,
            height: 20,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 0,
            fontSize: '0.75rem',
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          }}
          title={error.message}
        >
          {icon}
        </Box>
      </Fade>
    );
  }

  // Default inline variant
  return (
    <Fade in={show} timeout={300}>
      <Box sx={{ ...styles, p: 1.5, mt: 1 }}>
        {icon}
        <Typography variant="body2" sx={{ color: 'inherit' }}>
          {error.message}
        </Typography>
      </Box>
    </Fade>
  );
};

export default ValidationMessage;