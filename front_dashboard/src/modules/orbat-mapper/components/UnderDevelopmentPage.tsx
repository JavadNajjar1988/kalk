import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
import ScenarioSplashScreen from './ScenarioSplashScreen';

const UnderDevelopmentPage: React.FC = () => {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const handleSplashComplete = () => {
    setIsLoading(false);
  };

  const handleGoHome = () => {
    navigate('/dashboard/orbat-mapper');
  };

  if (isLoading) {
    return (
      <ScenarioSplashScreen
        onComplete={handleSplashComplete}
        scenarioName={`سناریو ${scenarioId}`}
        duration={2500}
      />
    );
  }

  return (
    <Box 
      sx={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: 'background.default'
      }}
    >
      {/* Header */}
      <Box
        component="nav"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgb(15 23 42)', // slate-900
          color: 'rgb(229 231 235)', // gray-200
          py: 1,
          px: 3,
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            fontFamily: 'Vazirmatn, sans-serif',
            fontWeight: 500 
          }}
        >
          {scenarioId ? `سناریو ${scenarioId}` : 'نقشه‌کش آرایش نبرد'}
        </Typography>
        
        <Tooltip title="بازگشت به صفحه اصلی">
          <IconButton
            onClick={handleGoHome}
            sx={{
              color: 'rgb(156 163 175)',
              '&:hover': {
                backgroundColor: 'rgb(55 65 81)',
                color: 'white',
              },
            }}
          >
            <HomeIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Main Content */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 4 
        }}
      >
        <Box sx={{ textAlign: 'center', maxWidth: 600 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              mb: 3, 
              fontFamily: 'Vazirmatn, sans-serif',
              fontWeight: 600,
              color: 'primary.main'
            }}
          >
            در دست توسعه
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 2, 
              fontFamily: 'Vazirmatn, sans-serif',
              color: 'text.secondary'
            }}
          >
            این بخش به زودی در دسترس خواهد بود
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              fontFamily: 'Vazirmatn, sans-serif',
              lineHeight: 1.8,
              color: 'text.secondary'
            }}
          >
            ما در حال کار بر روی ویژگی‌های جدید و بهبود تجربه کاربری هستیم. 
            لطفاً کمی صبر کنید تا این بخش کامل شود.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default UnderDevelopmentPage;