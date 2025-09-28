import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { CategoryType } from '../../types';
import { HierarchyLevelsManagerBase } from '../../components/base';
import { useNavigate } from 'react-router-dom';

const LogisticsStatusPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ p: 2 }}>
      {/* Header with title/description and back button */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5">وضعیت لجستیکی</Typography>
          <Typography variant="caption" color="text.secondary">
            وضعیت‌های مختلف لجستیکی
          </Typography>
        </Box>
        <Button variant="outlined" color="primary" onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />}>بازگشت</Button>
      </Box>
      {/* Hierarchy levels management only */}
      <HierarchyLevelsManagerBase categoryType={CategoryType.LOGISTICS_STATUS} maxLevels={2} />
    </Box>
  );
};

export default LogisticsStatusPage;


