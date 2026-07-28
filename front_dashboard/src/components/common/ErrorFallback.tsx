import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Container,
} from '@mui/material';
import { ArrowBack, Error, Refresh } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { navigateToPreviousStep } from '@/utils/navigation';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    resetErrorBoundary();
    navigateToPreviousStep(navigate, window.location.pathname, '/dashboard');
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
        }}
      >
        <Paper
          sx={{
            p: 4,
            borderRadius: 2,
            maxWidth: 500,
            width: '100%',
          }}
        >
          <Error
            sx={{
              fontSize: 80,
              color: 'error.main',
              mb: 2,
            }}
          />
          
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            خطایی رخ داده است
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            متأسفانه مشکلی در سیستم پیش آمده است. لطفاً دوباره تلاش کنید.
          </Typography>
          
          {process.env.NODE_ENV === 'development' && (
            <Box
              sx={{
                p: 2,
                bgcolor: 'grey.100',
                borderRadius: 1,
                mb: 3,
                textAlign: 'left',
                direction: 'ltr',
              }}
            >
              <Typography variant="caption" color="error">
                {error.message}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={resetErrorBoundary}
            >
              تلاش مجدد
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={handleGoBack}
            >
              بازگشت به مرحله قبل
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}; 
