import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Fade } from '@mui/material';

interface ScenarioSplashScreenProps {
  onComplete: () => void;
  scenarioName?: string;
  duration?: number;
}

const ScenarioSplashScreen: React.FC<ScenarioSplashScreenProps> = ({
  onComplete,
  scenarioName = 'سناریو',
  duration = 3000,
}) => {
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setShowContent(true);
    }, 200);

    const progressTimer = setInterval(() => {
      setProgress((prevProgress) => {
        const newProgress = prevProgress + (100 / (duration / 100));
        if (newProgress >= 100) {
          clearInterval(progressTimer);
          setTimeout(onComplete, 500);
          return 100;
        }
        return newProgress;
      });
    }, 100);

    return () => {
      clearTimeout(showTimer);
      clearInterval(progressTimer);
    };
  }, [duration, onComplete]);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Fade in={showContent} timeout={1000}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            color: 'white',
          }}
        >
          <Typography
            variant='h1'
            sx={{
              fontWeight: 'bold',
              fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
              mb: 6,
              textShadow: '0 4px 8px rgba(0,0,0,0.3)',
            }}
          >
            کالک نگار
          </Typography>

          <Box sx={{ mb: 4, position: 'relative' }}>
            <CircularProgress
              variant='determinate'
              value={progress}
              size={80}
              thickness={4}
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
              }}
            />
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
              }}
            >
              <Typography
                variant='body2'
                sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: 'bold',
                }}
              >
                {Math.round(progress)}%
              </Typography>
            </Box>
          </Box>

          <Typography
            variant='h6'
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 500,
              fontSize: { xs: '1.1rem', sm: '1.3rem' },
            }}
          >
            {scenarioName} در حال بارگذاری است...
          </Typography>
        </Box>
      </Fade>
    </Box>
  );
};

export default ScenarioSplashScreen;