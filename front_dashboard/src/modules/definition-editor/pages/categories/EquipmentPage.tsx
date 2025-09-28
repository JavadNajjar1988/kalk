import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { CategoryType } from '../../types';
import { FieldsManagerBase } from '../../components/base';
import { useNavigate } from 'react-router-dom';

const EquipmentPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ p: 2 }}>
      {/* Header with title/description and back button */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5">تجهیزات و سامانه‌ها</Typography>
          <Typography variant="caption" color="text.secondary">
            انواع تجهیزات نظامی و سامانه‌های مختلف
          </Typography>
        </Box>
        <Button variant="outlined" color="primary" onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />}>بازگشت</Button>
      </Box>
      <FieldsManagerBase categoryType={CategoryType.EQUIPMENT} />
    </Box>
  );
};

export default EquipmentPage;


