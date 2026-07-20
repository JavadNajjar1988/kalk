import React from 'react';
import { Box, Typography } from '@mui/material';

const DataProcessingPage: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        پردازش اطلاعات
      </Typography>
      <Typography variant="body1" color="text.secondary">
        این صفحه برای ماژول پردازش اطلاعات در نظر گرفته شده است. می‌توانید منطق و کامپوننت‌های مرتبط را در این‌جا پیاده‌سازی کنید.
      </Typography>
    </Box>
  );
};

export default DataProcessingPage;

