import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

interface NewSplashScreenProps {
  onComplete?: () => void;
  duration?: number; // زمان نمایش به میلی‌ثانیه
}

const NewSplashScreen: React.FC<NewSplashScreenProps> = ({
  onComplete,
  duration = 2000, // پیش‌فرض 2 ثانیه
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // پیشرفت نوار لودینگ
    const interval = setInterval(() => {
      setProgress((oldProgress) => {
        const newProgress = oldProgress + 2;
        return Math.min(newProgress, 100);
      });
    }, 20);
    
    // تایمر برای فراخوانی تابع onComplete
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, duration);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onComplete, duration]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        bgcolor: '#1c684e', // سبز میدانی
        color: 'white',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        {/* لوگو */}
        <Box
          sx={{
            width: 150,
            height: 150,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <img src="/logo.png" alt="ساجد" style={{ width: '100%', height: '100%' }} />
        </Box>
        
        {/* عنوان */}
        <Typography
          variant="h3"
          sx={{
            fontWeight: 'bold',
            textAlign: 'center',
            mb: 3,
            textShadow: '0 2px 10px rgba(0,0,0,0.2)',
          }}
        >
          سامانه جامع عملیات دفاعی
        </Typography>
        
        {/* نوار پیشرفت */}
        <Box sx={{ width: '250px', mt: 2 }}>
          <Box
            sx={{
              height: '4px',
              width: '100%',
              bgcolor: 'rgba(255,255,255,0.2)',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${progress}%`,
                bgcolor: 'white',
                borderRadius: '4px',
                transition: 'width 0.1s linear',
                boxShadow: '0 0 10px rgba(255,255,255,0.7)',
              }}
            />
          </Box>
          <Typography
            variant="body2"
            sx={{
              textAlign: 'center',
              mt: 1,
              fontSize: '0.85rem',
              opacity: 0.9,
            }}
          >
            {`در حال بارگذاری... ${progress}%`}
          </Typography>
        </Box>
        
        {/* لودینگ سیرکل */}
        <CircularProgress 
          size={36} 
          thickness={3} 
          sx={{ 
            color: 'white', 
            mt: 2 
          }} 
        />
      </Box>
    </Box>
  );
};

export default NewSplashScreen; 