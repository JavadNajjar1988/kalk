import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import jMoment from 'jalali-moment';
import FarsiTypography from './FarsiTypography';

const PersianDateTimeClosedBox: React.FC = () => {
  const theme = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000 * 60); // هر دقیقه آپدیت شود
    return () => clearInterval(timer);
  }, []);

  const persianDate = jMoment(currentTime).locale('fa').format('YYYY/MM/DD');
  const dayOfWeek = jMoment(currentTime).locale('fa').format('dddd');
  const dayOfMonth = jMoment(currentTime).locale('fa').format('DD');
  const monthName = jMoment(currentTime).locale('fa').format('MMMM');
  const time = currentTime.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', textAlign: 'center', p: 0 }}>
      <FarsiTypography variant="body1" fontWeight="bold" color="primary" sx={{ mb: 0.5 }}>
        {time}
      </FarsiTypography>
      <FarsiTypography variant="body2" color="text.secondary" sx={{ whiteSpace: 'normal' }}>
        {dayOfWeek} {dayOfMonth} {monthName}
      </FarsiTypography>
    </Box>
  );
};

export default PersianDateTimeClosedBox; 