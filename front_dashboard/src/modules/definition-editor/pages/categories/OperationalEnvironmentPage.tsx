import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { CategoryType } from '../../types';
import { FieldsManagerBase, HierarchyLevelsManagerBase } from '../../components/base';
import { useNavigate } from 'react-router-dom';

const OperationalEnvironmentPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ p: 2 }}>
      {/* Header with title/description and back button */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5">محیط عملیاتی</Typography>
          <Typography variant="caption" color="text.secondary">
            انواع محیط‌های عملیاتی مختلف
          </Typography>
        </Box>
        <Button variant="outlined" color="primary" onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />}>بازگشت</Button>
      </Box>
      <FieldsManagerBase categoryType={CategoryType.OPERATIONAL_ENVIRONMENT} />
      <Box sx={{ mt: 3 }}>
        <HierarchyLevelsManagerBase categoryType={CategoryType.OPERATIONAL_ENVIRONMENT} maxLevels={12} />
      </Box>
    </Box>
  );
};

export default OperationalEnvironmentPage;


