import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { AccessTime, CalendarToday } from '@mui/icons-material';
import jMoment from 'jalali-moment';
import FarsiTypography from './FarsiTypography';

interface PersianDateTimeProps {
  showDate?: boolean;
  showTime?: boolean;
  showIcons?: boolean;
  variant?: 'default' | 'compact' | 'minimal' | 'stacked';
}

/**
 * کامپوننت نمایش ساعت و تاریخ شمسی
 */
const PersianDateTime: React.FC<PersianDateTimeProps> = ({
  showDate = true,
  showTime = true,
  showIcons = true,
  variant = 'default',
}) => {
  const theme = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // به‌روزرسانی زمان هر ثانیه
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // تبدیل به تاریخ شمسی
  const persianDate = jMoment(currentTime).locale('fa').format('YYYY/MM/DD');
  
  // روز هفته و ماه به فارسی
  const dayOfWeek = jMoment(currentTime).locale('fa').format('dddd');
  const dayOfMonth = jMoment(currentTime).locale('fa').format('DD');
  const monthName = jMoment(currentTime).locale('fa').format('MMMM');
  
  // زمان به فرمت ساعت:دقیقه
  const time = currentTime.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  
  // نمایش مینیمال
  if (variant === 'minimal') {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        p: 1.5,
        borderRadius: 1,
        bgcolor: 'transparent',
        width: '100%',
        textAlign: 'center',
      }}>
        {showTime && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: showDate ? 0.5 : 0 }}>
            {showIcons && <AccessTime sx={{ fontSize: 14, mr: 0.5, color: theme.palette.primary.main, opacity: 0.9 }} />}
            <FarsiTypography variant="body1" fontWeight="bold" color="primary" sx={{ textShadow: '0px 1px 2px rgba(0,0,0,0.05)' }}>
              {time}
            </FarsiTypography>
          </Box>
        )}
        
        {showDate && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {showIcons && <CalendarToday sx={{ fontSize: 14, mr: 0.5, color: theme.palette.text.secondary, opacity: 0.7 }} />}
            <FarsiTypography variant="body2" color="text.secondary" sx={{ opacity: 0.85 }}>
              {dayOfWeek} {dayOfMonth} {monthName}
            </FarsiTypography>
          </Box>
        )}
      </Box>
    );
  }
  
  // نمایش پشته‌ای (ساعت روی تاریخ)
  if (variant === 'stacked') {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        p: 1,
        borderRadius: 1,
        bgcolor: 'transparent',
      }}>
        {showTime && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: showDate ? 0.5 : 0 }}>
            <FarsiTypography variant="body1" fontWeight="bold" color="primary" sx={{ textShadow: '0px 1px 2px rgba(0,0,0,0.05)' }}>
              {time}
            </FarsiTypography>
          </Box>
        )}
        
        {showDate && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FarsiTypography variant="body2" color="text.secondary" sx={{ opacity: 0.85 }}>
              {dayOfWeek} {dayOfMonth} {monthName}
            </FarsiTypography>
          </Box>
        )}
      </Box>
    );
  }
  
  // نمایش فشرده
  if (variant === 'compact') {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 1,
        borderRadius: 1,
        bgcolor: 'transparent',
      }}>
        {showTime && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {showIcons && <AccessTime sx={{ fontSize: 16, mr: 0.5, color: theme.palette.primary.main, opacity: 0.9 }} />}
            <FarsiTypography variant="body2" fontWeight="medium" sx={{ textShadow: '0px 1px 2px rgba(0,0,0,0.05)' }}>
              {time}
            </FarsiTypography>
          </Box>
        )}
        
        {showDate && (
          <Box sx={{ display: 'flex', alignItems: 'center', ml: showTime ? 2 : 0 }}>
            {showIcons && <CalendarToday sx={{ fontSize: 16, mr: 0.5, color: theme.palette.text.secondary, opacity: 0.7 }} />}
            <FarsiTypography variant="body2" color="text.secondary" sx={{ opacity: 0.85 }}>
              {persianDate}
            </FarsiTypography>
          </Box>
        )}
      </Box>
    );
  }
  
  // نمایش پیش‌فرض
  return (
    <Box sx={{ p: 2, bgcolor: 'transparent' }}>
      {showTime && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: showDate ? 1 : 0 }}>
          {showIcons && <AccessTime sx={{ fontSize: 18, mr: 1, color: theme.palette.primary.main, opacity: 0.9 }} />}
          <FarsiTypography variant="h6" fontWeight="bold" color="primary.main" sx={{ textShadow: '0px 1px 2px rgba(0,0,0,0.05)' }}>
            {time}
          </FarsiTypography>
        </Box>
      )}
      
      {showDate && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            {showIcons && <CalendarToday sx={{ fontSize: 18, mr: 1, color: theme.palette.text.secondary, opacity: 0.7 }} />}
            <FarsiTypography variant="body1" fontWeight="medium" sx={{ opacity: 0.9 }}>
              {dayOfWeek}
            </FarsiTypography>
          </Box>
          <FarsiTypography variant="body2" color="text.secondary" sx={{ ml: showIcons ? 4 : 0, opacity: 0.85 }}>
            {dayOfMonth} {monthName} {jMoment(currentTime).locale('fa').format('YYYY')}
          </FarsiTypography>
        </Box>
      )}
    </Box>
  );
};

export default PersianDateTime; 