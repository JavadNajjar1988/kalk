import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { CategoryType } from '../../types';
import { FieldsManagerBase } from '../../components/base';
import { useNavigate } from 'react-router-dom';

/**
 * صفحه مدیریت دسته‌بندی لجستیک
 * این صفحه شامل مدیریت فیلدهای مرتبط با تدارکات و لجستیک است
 */
const LogisticsPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <Box sx={{ p: 2 }}>
      {/* Header with title/description and back button */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5">لجستیک</Typography>
          <Typography variant="caption" color="text.secondary">
            مدیریت تدارکات، مواد مصرفی و خدمات پشتیبانی
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={() => navigate(-1)} 
          startIcon={<ArrowBackIcon />}
        >
          بازگشت
        </Button>
      </Box>
      
      {/* استفاده از کامپوننت پایه برای مدیریت فیلدها */}
      <FieldsManagerBase categoryType={CategoryType.LOGISTICS} />
    </Box>
  );
};

export default LogisticsPage;