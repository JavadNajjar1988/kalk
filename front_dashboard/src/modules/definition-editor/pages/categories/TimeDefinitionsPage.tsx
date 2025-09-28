import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { CategoryType } from '../../types';
import { FieldsManagerBase, HierarchyLevelsManagerBase, TimeDefinitionsManager } from '../../components/base';
import { useNavigate } from 'react-router-dom';

const TimeDefinitionsPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ p: 2 }}>
      {/* Header with title/description and back button */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5">واحدهای زمان و دوره</Typography>
          <Typography variant="caption" color="text.secondary">
            تعاریف زمانی و دوره‌های مختلف
          </Typography>
        </Box>
        <Button variant="outlined" color="primary" onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />}>بازگشت</Button>
      </Box>
      <FieldsManagerBase categoryType={CategoryType.TIME_DEFINITIONS} />
      <Box sx={{ mt: 3 }}>
        <HierarchyLevelsManagerBase categoryType={CategoryType.TIME_DEFINITIONS} maxLevels={5} />
      </Box>
      <Box sx={{ mt: 3 }}>
        <TimeDefinitionsManager />
      </Box>
    </Box>
  );
};

export default TimeDefinitionsPage;


